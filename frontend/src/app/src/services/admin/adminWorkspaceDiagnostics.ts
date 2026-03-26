import axiosInstance from "../axiosInstance";
import { BlobFilesResponse, IndexFilesResponse, OpenAiFilesCheckRequest, OpenAiFilesCheckResponse } from "./types/adminWorkspace.types";

const BASE = "/admin/workspaces";

export const adminWorkspaceDiagnostics = {
  async getBlobFiles(workspaceId: string): Promise<BlobFilesResponse> {
    const response = await axiosInstance.get(
      `${BASE}/${workspaceId}/storage/blobs`
    );
    return response.data as BlobFilesResponse;
  },

  async getIndexFiles(workspaceId: string): Promise<IndexFilesResponse> {
    const response = await axiosInstance.get(
      `${BASE}/${workspaceId}/index/files`
    );
    return response.data as IndexFilesResponse;
  },

  async checkOpenAiFiles(
    workspaceId: string,
    body: OpenAiFilesCheckRequest
  ): Promise<OpenAiFilesCheckResponse> {
    const response = await axiosInstance.post(
      `${BASE}/${workspaceId}/openai/files/check`,
      body
    );
    return response.data as OpenAiFilesCheckResponse;
  },
};


