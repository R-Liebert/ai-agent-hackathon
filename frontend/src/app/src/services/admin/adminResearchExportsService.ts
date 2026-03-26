import axiosInstance from "../axiosInstance";
import {
  CreateResearchExportRequest,
  DownloadResearchExportResult,
  ResearchExportQueuedResponse,
  ResearchExportStatus,
} from "./types/adminResearchExports.types";

const BASE = "/admin/research-exports";

const getFilenameFromDisposition = (contentDisposition?: string): string | null => {
  if (!contentDisposition) return null;

  // Prefer RFC5987 filename* when present
  const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1].replace(/['"]/g, ""));
    } catch {
      return filenameStarMatch[1].replace(/['"]/g, "");
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1];
  }

  return null;
};

const downloadArtifact = async (
  url: string,
  fallbackFileName: string
): Promise<DownloadResearchExportResult> => {
  const response = await axiosInstance.get(url, {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as
    | string
    | undefined;

  return {
    blob: response.data as Blob,
    filename: getFilenameFromDisposition(contentDisposition) ?? fallbackFileName,
  };
};

export const adminResearchExportsService = {
  async createExport(
    request: CreateResearchExportRequest
  ): Promise<ResearchExportQueuedResponse> {
    const response = await axiosInstance.post<ResearchExportQueuedResponse>(
      BASE,
      request
    );
    return response.data;
  },

  async getExportStatus(exportId: string): Promise<ResearchExportStatus> {
    const response = await axiosInstance.get<ResearchExportStatus>(
      `${BASE}/${encodeURIComponent(exportId)}`
    );
    return response.data;
  },

  async downloadRawBundle(
    exportId: string,
    fallbackFileName?: string
  ): Promise<DownloadResearchExportResult> {
    const safeId = encodeURIComponent(exportId);
    return downloadArtifact(
      `${BASE}/${safeId}/download`,
      fallbackFileName ?? `research-export-${exportId}.zip`
    );
  },

  async downloadInsightsWorkbook(
    exportId: string,
    fallbackFileName?: string
  ): Promise<DownloadResearchExportResult> {
    const safeId = encodeURIComponent(exportId);
    return downloadArtifact(
      `${BASE}/${safeId}/download-insights`,
      fallbackFileName ?? `research-export-insights-${exportId}.xlsx`
    );
  },
};
