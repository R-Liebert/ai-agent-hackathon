import { useQuery } from "@tanstack/react-query";
import { siteAlertService } from "../services/siteAlertService";
import {
  SiteAlertResponse,
  SupportedLanguage,
} from "../services/admin/types/siteAlert.types";

/**
 * Hook to fetch the current site alert configuration in the user's language
 * Use this in the main app layout to display alerts via StickyWarning
 * Polls every 60 seconds
 * @param lang - Language code: 'en' or 'da'
 * @param refetchInterval - Polling interval in ms (default: 60000)
 */
export const useSiteAlert = (
  lang: SupportedLanguage = "en",
  refetchInterval: number = 60000
) => {
  return useQuery<SiteAlertResponse, Error>({
    queryKey: ["site-alert", lang],
    queryFn: () => siteAlertService.getConfiguration(lang),
    staleTime: 30000,
    gcTime: 120000,
    refetchInterval,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
