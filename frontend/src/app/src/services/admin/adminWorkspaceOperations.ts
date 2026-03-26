import axiosInstance from "../axiosInstance";

const BASE = "/admin/workspaces";

export const adminWorkspaceOperations = {
  async ingestFiles(workspaceId: string, blobNames: string[]): Promise<void> {
    await axiosInstance.post(`${BASE}/${workspaceId}/ingest-files`, {
      blobNames,
    });
  },
};


