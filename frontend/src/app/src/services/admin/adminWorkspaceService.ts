import axiosInstance from "../axiosInstance";
import {
  WorkspaceDetailsDto,
  WorkspaceListResponse,
  WorkspaceQueryParams,
  WorkspaceDetailsQueryParams,
} from "./types/adminWorkspace.types";

const BASE = "/admin/workspaces";

export const adminWorkspaceService = {
  async getWorkspaces(
    params: WorkspaceQueryParams
  ): Promise<WorkspaceListResponse> {
    const response = await axiosInstance.get(`${BASE}`, { params });
    return response.data;
  },

  async getWorkspaceDetails(id: string, params?: WorkspaceDetailsQueryParams): Promise<WorkspaceDetailsDto> {
    const response = await axiosInstance.get(`${BASE}/${id}`, { params });
    return response.data;
  },

  // Stats removed; counts are returned inline on summary DTOs
};


