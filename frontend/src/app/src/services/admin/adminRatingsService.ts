import axiosInstance from "../axiosInstance";
import {
  GetAllRatingsRequest,
  GetAllRatingsResponse,
  AdminRatingDetailDto,
} from "./types/adminRatings.types";

const BASE = "/admin/ratings";

/**
 * Build URLSearchParams from object, skipping undefined/null values.
 * Uses browser's URLSearchParams to ensure correct encoding as per API guide.
 */
const buildSearchParams = (params: Record<string, unknown>): URLSearchParams => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams;
};

export const adminRatingsService = {
  /**
   * Get paginated list of message ratings with optional filters
   * GET /api/admin/ratings
   *
   * Note: Uses URLSearchParams for proper handling of continuation tokens.
   * The backend returns tokens in URL-safe format - pass them as-is.
   */
  async getRatings(params: GetAllRatingsRequest): Promise<GetAllRatingsResponse> {
    const searchParams = buildSearchParams(params as Record<string, unknown>);
    const response = await axiosInstance.get(`${BASE}?${searchParams.toString()}`);
    return response.data;
  },

  /**
   * Get full details for a specific rating
   * GET /api/admin/ratings/{id}
   * @param id - Rating ID (same as chatMessageId)
   * @param userId - Optional user ID for efficient lookup (1 RU vs cross-partition query)
   */
  async getRatingDetails(
    id: string,
    userId?: string
  ): Promise<AdminRatingDetailDto> {
    const params = userId ? { userId } : undefined;
    const response = await axiosInstance.get(`${BASE}/${id}`, { params });
    return response.data;
  },

  /**
   * Export ratings matching filter criteria as CSV
   * GET /api/admin/ratings/export
   * @returns Object with blob (null if empty) and filename
   */
  async exportRatingsCsv(
    params: Omit<GetAllRatingsRequest, "pageSize" | "continuationToken"> & {
      includeContent?: boolean;
    }
  ): Promise<{ blob: Blob | null; filename: string; empty: boolean }> {
    const response = await axiosInstance.get(`${BASE}/export`, {
      params,
      responseType: "blob",
      headers: {
        Accept: "text/csv",
      },
      validateStatus: (status) => status === 200 || status === 204,
    });

    if (response.status === 204) {
      return { blob: null, filename: "", empty: true };
    }

    const contentDisposition = response.headers["content-disposition"];
    const filename =
      contentDisposition?.split("filename=")[1]?.replace(/"/g, "") ??
      `RatingsExport_${new Date().toISOString().split("T")[0]}.csv`;

    return { blob: response.data, filename, empty: false };
  },

  /**
   * Export ratings matching filter criteria as Excel
   * GET /api/admin/ratings/export-excel
   * @returns Object with blob (null if empty) and filename
   */
  async exportRatingsExcel(
    params: Omit<GetAllRatingsRequest, "pageSize" | "continuationToken"> & {
      includeContent?: boolean;
    }
  ): Promise<{ blob: Blob | null; filename: string; empty: boolean }> {
    const response = await axiosInstance.get(`${BASE}/export-excel`, {
      params,
      responseType: "blob",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      validateStatus: (status) => status === 200 || status === 204,
    });

    if (response.status === 204) {
      return { blob: null, filename: "", empty: true };
    }

    const contentDisposition = response.headers["content-disposition"];
    const filename =
      contentDisposition?.split("filename=")[1]?.replace(/"/g, "") ??
      `RatingsExport_${new Date().toISOString().split("T")[0]}.xlsx`;

    return { blob: response.data, filename, empty: false };
  },
};
