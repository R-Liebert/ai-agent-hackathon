import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { launchpadSettingsAdminService } from "../../../services/admin/launchpadSettingsService";
import {
  LaunchpadSettingsResponse,
  LaunchpadSettingsValidationProblem,
  UpdateLaunchpadSettingsRequest,
} from "../../../services/admin/types/launchpadSettings.types";

export const launchpadSettingsAdminKeys = {
  all: ["admin", "launchpad-settings"] as const,
  configuration: () =>
    [...launchpadSettingsAdminKeys.all, "configuration"] as const,
};

export const useLaunchpadSettingsAdmin = () => {
  return useQuery<LaunchpadSettingsResponse, Error>({
    queryKey: launchpadSettingsAdminKeys.configuration(),
    queryFn: () => launchpadSettingsAdminService.getConfiguration(),
    staleTime: 30000,
    gcTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useUpdateLaunchpadSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<
    LaunchpadSettingsResponse,
    AxiosError<LaunchpadSettingsValidationProblem | string>,
    UpdateLaunchpadSettingsRequest
  >({
    mutationFn: (request) =>
      launchpadSettingsAdminService.updateConfiguration(request),
    onSuccess: (data) => {
      queryClient.setQueryData(launchpadSettingsAdminKeys.configuration(), data);
    },
  });
};
