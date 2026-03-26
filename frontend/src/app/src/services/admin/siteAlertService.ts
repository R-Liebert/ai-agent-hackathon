import axiosInstance from "../axiosInstance";
import {
  SiteAlertAdminResponse,
  UpdateSiteAlertRequest,
} from "./types/siteAlert.types";

const ADMIN_URL = "/admin/site-alert";

/**
 * Admin site alert service - for admin panel management
 */
export const siteAlertAdminService = {
  /**
   * Fetches the current site alert configuration with both languages (admin)
   * GET /api/admin/site-alert
   */
  async getConfiguration(): Promise<SiteAlertAdminResponse> {
    const response =
      await axiosInstance.get<SiteAlertAdminResponse>(ADMIN_URL);
    return response.data;
  },

  /**
   * Updates the site alert configuration (admin only)
   * Both messageEn and messageDa are required when enabled is true
   * PUT /api/admin/site-alert
   */
  async updateConfiguration(
    request: UpdateSiteAlertRequest
  ): Promise<SiteAlertAdminResponse> {
    const response = await axiosInstance.put<SiteAlertAdminResponse>(
      ADMIN_URL,
      request
    );
    return response.data;
  },
};
