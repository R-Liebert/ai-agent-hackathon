import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { siteAlertAdminService } from "../../../services/admin/siteAlertService";
import {
  SiteAlertAdminResponse,
  UpdateSiteAlertRequest,
} from "../../../services/admin/types/siteAlert.types";
import { notificationsService } from "../../../services/notificationsService";

/**
 * Query key factory for Admin Site Alert
 */
export const siteAlertAdminKeys = {
  all: ["admin", "site-alert"] as const,
  configuration: () => [...siteAlertAdminKeys.all, "configuration"] as const,
};

/**
 * Hook for admin page - fetches site alert configuration with both languages
 */
export const useSiteAlertAdmin = () => {
  return useQuery<SiteAlertAdminResponse, Error>({
    queryKey: siteAlertAdminKeys.configuration(),
    queryFn: () => siteAlertAdminService.getConfiguration(),
    staleTime: 30000,
    gcTime: 60000,
  });
};

/**
 * Mutation hook for updating site alert configuration (admin only)
 */
export const useUpdateSiteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation<SiteAlertAdminResponse, Error, UpdateSiteAlertRequest>({
    mutationFn: (request) => siteAlertAdminService.updateConfiguration(request),
    onSuccess: (data) => {
      notificationsService.success("Site alert updated successfully");
      // Update the cache with the new data
      queryClient.setQueryData(siteAlertAdminKeys.configuration(), data);
    },
    onError: (error: Error) => {
      notificationsService.error(
        `Failed to update site alert: ${error.message}`
      );
    },
  });
};
