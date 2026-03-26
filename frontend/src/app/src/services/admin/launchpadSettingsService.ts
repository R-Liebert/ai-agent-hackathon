import axiosInstance from "../axiosInstance";
import {
  LaunchpadSettingsResponse,
  UpdateLaunchpadSettingsRequest,
} from "./types/launchpadSettings.types";

const BASE = "/admin/settings/launchpad";

export const launchpadSettingsAdminService = {
  async getConfiguration(): Promise<LaunchpadSettingsResponse> {
    const response =
      await axiosInstance.get<LaunchpadSettingsResponse>(BASE);
    return response.data;
  },

  async updateConfiguration(
    request: UpdateLaunchpadSettingsRequest
  ): Promise<LaunchpadSettingsResponse> {
    const response = await axiosInstance.patch<LaunchpadSettingsResponse>(
      BASE,
      request
    );
    return response.data;
  },
};
