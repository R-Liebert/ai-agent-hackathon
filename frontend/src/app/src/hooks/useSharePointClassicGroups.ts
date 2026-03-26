import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  getSharePointClassicGroups,
  SharePointClassicGroupsResponse,
} from "../services/sharePointClassicGroupsService";

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

interface UseSharePointClassicGroupsOptions {
  enabled?: boolean;
}

export const useSharePointClassicGroups = (
  options: UseSharePointClassicGroupsOptions = {}
) => {
  const { enabled = true } = options;

  return useQuery<SharePointClassicGroupsResponse, AxiosError>({
    queryKey: ["sharepoint-classic-groups"],
    queryFn: getSharePointClassicGroups,
    enabled,
    staleTime: THREE_HOURS_MS,
    gcTime: THREE_HOURS_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};
