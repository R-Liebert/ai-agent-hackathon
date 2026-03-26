import { useState, useEffect, useRef } from "react";
import axiosInstance from "../services/axiosInstance";

const BLOB_CACHE_IDLE_TTL_MS = 90_000;
const MAX_BLOB_CACHE_ENTRIES = 60;

interface CachedBlobEntry {
  blobUrl: string;
  refCount: number;
  lastUsedAt: number;
  revokeTimerId: number | null;
}

const protectedImageBlobCache = new Map<string, CachedBlobEntry>();
const inFlightBlobRequests = new Map<string, Promise<string>>();

const clearRevokeTimer = (entry: CachedBlobEntry) => {
  if (entry.revokeTimerId === null) return;
  window.clearTimeout(entry.revokeTimerId);
  entry.revokeTimerId = null;
};

const scheduleRevokeIfIdle = (cacheKey: string, entry: CachedBlobEntry) => {
  if (entry.refCount > 0 || entry.revokeTimerId !== null) return;

  entry.revokeTimerId = window.setTimeout(() => {
    const current = protectedImageBlobCache.get(cacheKey);
    if (!current) return;
    if (current.refCount > 0) {
      current.revokeTimerId = null;
      return;
    }
    URL.revokeObjectURL(current.blobUrl);
    protectedImageBlobCache.delete(cacheKey);
  }, BLOB_CACHE_IDLE_TTL_MS);
};

const pruneBlobCache = () => {
  if (protectedImageBlobCache.size <= MAX_BLOB_CACHE_ENTRIES) return;

  const removableEntries = [...protectedImageBlobCache.entries()]
    .filter(([, entry]) => entry.refCount === 0)
    .sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt);

  while (
    protectedImageBlobCache.size > MAX_BLOB_CACHE_ENTRIES &&
    removableEntries.length > 0
  ) {
    const [cacheKey, entry] = removableEntries.shift()!;
    clearRevokeTimer(entry);
    URL.revokeObjectURL(entry.blobUrl);
    protectedImageBlobCache.delete(cacheKey);
  }
};

const acquireCachedBlobUrl = (cacheKey: string): string | undefined => {
  const entry = protectedImageBlobCache.get(cacheKey);
  if (!entry) return undefined;

  clearRevokeTimer(entry);
  entry.refCount += 1;
  entry.lastUsedAt = Date.now();
  return entry.blobUrl;
};

const releaseCachedBlobUrl = (cacheKey: string | null) => {
  if (!cacheKey) return;

  const entry = protectedImageBlobCache.get(cacheKey);
  if (!entry) return;

  entry.refCount = Math.max(0, entry.refCount - 1);
  entry.lastUsedAt = Date.now();
  scheduleRevokeIfIdle(cacheKey, entry);
};

const ensureCachedBlobUrl = async (cacheKey: string): Promise<string> => {
  const cached = protectedImageBlobCache.get(cacheKey);
  if (cached) {
    cached.lastUsedAt = Date.now();
    return cached.blobUrl;
  }

  const pending = inFlightBlobRequests.get(cacheKey);
  if (pending) return pending;

  const request = axiosInstance
    .get(cacheKey, { responseType: "blob" })
    .then((response) => {
      const existing = protectedImageBlobCache.get(cacheKey);
      if (existing) {
        existing.lastUsedAt = Date.now();
        return existing.blobUrl;
      }

      const blobUrl = URL.createObjectURL(response.data);
      const created: CachedBlobEntry = {
        blobUrl,
        refCount: 0,
        lastUsedAt: Date.now(),
        revokeTimerId: null,
      };
      protectedImageBlobCache.set(cacheKey, created);
      scheduleRevokeIfIdle(cacheKey, created);
      pruneBlobCache();
      return blobUrl;
    })
    .finally(() => {
      inFlightBlobRequests.delete(cacheKey);
    });

  inFlightBlobRequests.set(cacheKey, request);
  return request;
};

/**
 * Custom hook to fetch and authenticate image URLs from protected API endpoints
 *
 * @param imageUrl - The original image URL (can be full URL or relative path)
 * @returns Object with authenticated URL and loading state
 */
export const useAuthenticatedImageUrl = (
  imageUrl?: string
): { url: string | undefined; isLoading: boolean } => {
  const [authenticatedImageUrl, setAuthenticatedImageUrl] = useState<
    string | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const activeCacheKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const releaseActiveCacheKey = () => {
      releaseCachedBlobUrl(activeCacheKeyRef.current);
      activeCacheKeyRef.current = null;
    };

    if (!imageUrl) {
      releaseActiveCacheKey();
      setAuthenticatedImageUrl(undefined);
      setIsLoading(false);
      return;
    }

    // If it's not a protected API URL, use it directly
    const isProtected = isProtectedApiUrl(imageUrl);
    if (!isProtected) {
      releaseActiveCacheKey();
      setAuthenticatedImageUrl(imageUrl);
      setIsLoading(false);
      return;
    }

    releaseActiveCacheKey();

    // Fetch the image using authenticated axios instance
    const fetchAuthenticatedImage = async () => {
      setIsLoading(true);
      try {
        // Normalize URL - axiosInstance baseURL already includes /api/
        const normalizedUrl = normalizeApiUrl(imageUrl);

        const cachedBlobUrl = acquireCachedBlobUrl(normalizedUrl);
        if (cachedBlobUrl) {
          if (isCancelled) {
            releaseCachedBlobUrl(normalizedUrl);
            return;
          }
          activeCacheKeyRef.current = normalizedUrl;
          setAuthenticatedImageUrl(cachedBlobUrl);
          return;
        }

        await ensureCachedBlobUrl(normalizedUrl);
        if (isCancelled) return;

        const acquiredBlobUrl = acquireCachedBlobUrl(normalizedUrl);
        if (!acquiredBlobUrl) {
          throw new Error(
            `[useAuthenticatedImageUrl] Failed to acquire cached blob for ${normalizedUrl}`
          );
        }

        activeCacheKeyRef.current = normalizedUrl;
        setAuthenticatedImageUrl(acquiredBlobUrl);
      } catch (error) {
        if (isCancelled) return;
        console.error(
          "[useAuthenticatedImageUrl] Error fetching authenticated image:",
          error
        );
        console.error("[useAuthenticatedImageUrl] Failed URL:", imageUrl);
        // Fall back to the original URL (might fail but will trigger error handling)
        setAuthenticatedImageUrl(imageUrl);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAuthenticatedImage();

    return () => {
      isCancelled = true;
      releaseActiveCacheKey();
    };
  }, [imageUrl]);

  return { url: authenticatedImageUrl, isLoading };
};

/**
 * Helper function to check if URL is a protected API endpoint
 */
const isProtectedApiUrl = (url: string): boolean => {
  if (!url) return false;

  // New format: /files/... (current backend response)
  // Legacy formats: files/..., /api/files/..., or full URLs with /api/files/
  return url.includes("/files/");
};

/**
 * Helper function to normalize API URL for axios
 * Handles both new format (/files/...) and legacy formats
 * Note: axiosInstance baseURL already includes /api/, so we remove it if present
 */
const normalizeApiUrl = (url: string): string => {
  // Legacy: Full URL (e.g., https://example.com/api/files/...)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const urlObj = new URL(url);
      let path = urlObj.pathname;

      // Remove /api/ prefix if present since baseURL includes it
      if (path.startsWith("/api/")) {
        path = path.substring(4); // "/api/files/..." -> "/files/..."
      }

      // Preserve query/hash because some image URLs can contain required tokens.
      return `${path}${urlObj.search}${urlObj.hash}`;
    } catch (e) {
      console.error("Error parsing URL:", e);
      return url;
    }
  }

  // Legacy: /api/files/... -> remove /api/ prefix
  if (url.startsWith("/api/files/")) {
    return url.substring(4); // "/api/files/..." -> "/files/..."
  }

  // Legacy: files/... -> add leading slash
  if (url.startsWith("files/") && !url.startsWith("/files/")) {
    return `/${url}`; // "files/..." -> "/files/..."
  }

  // New format (and default): /files/...
  return url;
};
