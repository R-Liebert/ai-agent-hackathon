import {
  useQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import { adminRatingsService } from "../../../services/admin/adminRatingsService";
import {
  GetAllRatingsRequest,
  GetAllRatingsResponse,
  AdminRatingDetailDto,
} from "../../../services/admin/types/adminRatings.types";
import { notificationsService } from "../../../services/notificationsService";

/**
 * Query key factory for ratings
 */
export const ratingsKeys = {
  all: ["admin", "ratings"] as const,
  lists: () => [...ratingsKeys.all, "list"] as const,
  list: (filters: Partial<GetAllRatingsRequest>) =>
    [...ratingsKeys.lists(), filters] as const,
  details: () => [...ratingsKeys.all, "details"] as const,
  detail: (id: string) => [...ratingsKeys.details(), id] as const,
} as const;

/**
 * Hook to fetch paginated list of ratings with filters
 */
export const useRatingsList = (params: GetAllRatingsRequest) => {
  return useQuery<GetAllRatingsResponse, Error>({
    queryKey: ratingsKeys.list(params),
    queryFn: () => adminRatingsService.getRatings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch details for a specific rating
 * @param id - Rating ID
 * @param userId - Optional user ID for efficient lookup
 */
export const useRatingDetails = (
  id: string | undefined,
  userId?: string
) => {
  const key = id ? ratingsKeys.detail(id) : ratingsKeys.details();
  return useQuery<AdminRatingDetailDto, Error>({
    queryKey: id ? [...key, userId] : key,
    queryFn: () => adminRatingsService.getRatingDetails(id as string, userId),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });
};

/**
 * Export format type
 */
export type ExportFormat = "csv" | "excel";

/**
 * Export request parameters
 */
export interface ExportRatingsParams {
  format: ExportFormat;
  createdAfter?: string;
  createdBefore?: string;
  ratingType?: number;
  consent?: boolean;
  agentName?: string;
  generatedByAgent?: boolean;
  userId?: string;
  sortBy?: "CreatedAt" | "UserRating";
  sortDescending?: boolean;
  includeContent?: boolean;
}

/**
 * Export result
 */
export interface ExportRatingsResult {
  empty: boolean;
}

/**
 * Hook to export ratings as CSV or Excel
 * Returns a mutation that triggers the download
 */
export const useExportRatings = () => {
  return useMutation<ExportRatingsResult, Error, ExportRatingsParams>({
    mutationFn: async (params) => {
      const { format, includeContent, ...filterParams } = params;

      const result =
        format === "excel"
          ? await adminRatingsService.exportRatingsExcel({
              ...filterParams,
              includeContent,
            })
          : await adminRatingsService.exportRatingsCsv({
              ...filterParams,
              includeContent,
            });

      if (result.empty) {
        return { empty: true };
      }

      // Trigger browser download
      const url = window.URL.createObjectURL(result.blob!);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { empty: false };
    },
    onSuccess: (result) => {
      if (result.empty) {
        notificationsService.info(
          "No ratings found for the selected filters"
        );
      } else {
        notificationsService.success("Ratings exported successfully");
      }
    },
    onError: (error: Error) => {
      notificationsService.error(`Export failed: ${error.message}`);
    },
  });
};
