import axiosInstance from "./axiosInstance";

export interface SharePointClassicGroupsResponse {
  groupIds: string[];
  hasGroups: boolean;
}

export const getSharePointClassicGroups =
  async (): Promise<SharePointClassicGroupsResponse> => {
    try {
      const response =
        await axiosInstance.get<SharePointClassicGroupsResponse>(
          "/users/me/sharepoint-classic-groups"
        );
      return response.data;
    } catch (error) {
      console.error("Error fetching SharePoint classic groups:", error);
      throw error;
    }
  };
