import axiosInstance from "./axiosInstance";
import {
  SiteAlertResponse,
  SupportedLanguage,
} from "./admin/types/siteAlert.types";

const PUBLIC_URL = "/site-alert";

/**
 * Public site alert service - for all authenticated users
 * Used by StickyWarning component to display alerts
 */
export const siteAlertService = {
  /**
   * Fetches the current site alert configuration in the specified language
   * GET /api/site-alert?lang={lang}
   * @param lang - Language code: 'en' or 'da' (defaults to 'en')
   */
  async getConfiguration(
    lang: SupportedLanguage = "en"
  ): Promise<SiteAlertResponse> {
    const response = await axiosInstance.get<SiteAlertResponse>(PUBLIC_URL, {
      params: { lang },
    });
    return response.data;
  },
};
