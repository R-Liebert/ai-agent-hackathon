import { ReactNode, useState } from "react";
import Tooltip from "../components/Global/Tooltip";
import { CircularProgress } from "@mui/material";
import axiosInstance from "../services/axiosInstance";

interface DownloadLinkProps {
  href: string | undefined;
  children: ReactNode;
}

const DownloadLink = ({ href, children }: DownloadLinkProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const fullPath = href || "";

  /**
   * Normalize URL for axios - handle hallucinated protocols and extract /files path
   * Works for all file containers: code-agent-files, chat-doc-converter, etc.
   */
  const normalizeUrl = (url: string): string => {
    // Protection against hallucinated protocols (sandbox:, http:, etc.)
    // Extract everything from /files onwards
    const filesIndex = url.indexOf("/files");
    if (filesIndex !== -1) {
      // Found /files, extract from there
      let path = url.substring(filesIndex);

      // Remove /api/ prefix if present (e.g., /api/files/... -> /files/...)
      if (path.startsWith("/api/files")) {
        path = path.substring(4); // Remove "/api" prefix
      }

      return path;
    }

    // Fallback: if /files not found, try to handle as regular URL
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;

        if (path.startsWith("/api/")) {
          return path.substring(4);
        }

        return path;
      } catch (e) {
        console.error("[DownloadLink] Error parsing URL:", e);
        return url;
      }
    }

    // If /api/ prefix exists, remove it
    if (url.startsWith("/api/")) {
      return url.substring(4);
    }

    return url;
  };

  const handleClick = async () => {
    if (!fullPath) return;

    try {
      setIsLoading(true);

      const normalizedUrl = normalizeUrl(fullPath);

      // Use axiosInstance to get authenticated request with bearer token
      const response = await axiosInstance.get(normalizedUrl, {
        responseType: "blob",
      });

      const contentType =
        response.headers["content-type"] || "application/octet-stream";

      // Try to infer filename from Content-Disposition or URL
      let filename = "download";
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(
          contentDisposition
        );
        filename = decodeURIComponent(match?.[1] || match?.[2] || filename);
      } else {
        // Extract filename from original URL path
        try {
          const urlObj = new URL(fullPath, window.location.origin);
          filename = urlObj.pathname.split("/").pop() || filename;
        } catch {
          filename = fullPath.split("/").pop() || filename;
        }
      }

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error("[DownloadLink] Error downloading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip useMui text="Download file">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="relative inline-flex mt-0 items-center disabled:opacity-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="font-semibild flex items-center gap-1 text-[#4E95FF] hover:opacity-70 transition-colors">
          <span className="mb-[6px]">👉</span> {children}
          {isLoading ? (
            <CircularProgress
              size={18}
              className="ml-2"
              color="inherit"
              style={{ color: isHovered ? "white" : "black" }}
            />
          ) : null}
        </span>
      </button>
    </Tooltip>
  );
};

export default DownloadLink;
