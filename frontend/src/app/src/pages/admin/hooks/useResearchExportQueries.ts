import { AxiosError } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { notificationsService } from "../../../services/notificationsService";
import { adminResearchExportsService } from "../../../services/admin/adminResearchExportsService";
import {
  CreateResearchExportRequest,
  DownloadResearchExportResult,
  ResearchExportQueuedResponse,
  ResearchExportStatus,
} from "../../../services/admin/types/adminResearchExports.types";

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<{ message?: string; title?: string } | string>;
  const responseData = axiosError.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "message" in responseData &&
    typeof responseData.message === "string"
  ) {
    return responseData.message;
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "title" in responseData &&
    typeof responseData.title === "string"
  ) {
    return responseData.title;
  }

  return axiosError.message || fallback;
};

const triggerBrowserDownload = (result: DownloadResearchExportResult): void => {
  const url = window.URL.createObjectURL(result.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

export const researchExportKeys = {
  all: ["admin", "research-exports"] as const,
  detail: (exportId: string) => [...researchExportKeys.all, exportId] as const,
} as const;

export const useCreateResearchExport = () => {
  return useMutation<
    ResearchExportQueuedResponse,
    Error,
    CreateResearchExportRequest
  >({
    mutationFn: (request) => adminResearchExportsService.createExport(request),
    onSuccess: () => {
      notificationsService.success("Research export queued successfully");
    },
    onError: (error: unknown) => {
      notificationsService.error(
        getApiErrorMessage(error, "Failed to queue research export")
      );
    },
  });
};

export const useResearchExportStatus = (
  exportId: string | null,
  enabled: boolean = true
) => {
  return useQuery<ResearchExportStatus, Error>({
    queryKey: exportId ? researchExportKeys.detail(exportId) : researchExportKeys.all,
    queryFn: () => adminResearchExportsService.getExportStatus(exportId as string),
    enabled: Boolean(exportId) && enabled,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 2000;
      if (status === "queued") return 2000;
      if (status === "running") return 5000;
      return false;
    },
  });
};

interface DownloadResearchExportParams {
  exportId: string;
  fallbackFileName?: string;
}

export const useDownloadRawResearchExport = () => {
  return useMutation<void, Error, DownloadResearchExportParams>({
    mutationFn: async ({ exportId, fallbackFileName }) => {
      const result = await adminResearchExportsService.downloadRawBundle(
        exportId,
        fallbackFileName
      );
      triggerBrowserDownload(result);
    },
    onSuccess: () => {
      notificationsService.success("Raw ZIP download started");
    },
    onError: (error: unknown) => {
      notificationsService.error(
        getApiErrorMessage(error, "Failed to download raw ZIP")
      );
    },
  });
};

export const useDownloadInsightsResearchExport = () => {
  return useMutation<void, Error, DownloadResearchExportParams>({
    mutationFn: async ({ exportId, fallbackFileName }) => {
      const result = await adminResearchExportsService.downloadInsightsWorkbook(
        exportId,
        fallbackFileName
      );
      triggerBrowserDownload(result);
    },
    onSuccess: () => {
      notificationsService.success("Insights workbook download started");
    },
    onError: (error: unknown) => {
      notificationsService.error(
        getApiErrorMessage(error, "Failed to download insights workbook")
      );
    },
  });
};
