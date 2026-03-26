import {
  CreateWorkspaceDto,
  ProcessStatusResponse,
  WorkspaceDetailsResponse,
  WorkspaceDto,
  WorkspaceSettingsDto,
  WorkspaceUpdateRequest,
  WorkspaceProcessingStatusResponse,
} from "../models/workspace-model";
import axiosInstance from "./axiosInstance";
import { FileUploadResponse } from "./filesService";

const getWorkspaceSettings = async (workspaceId?: string | undefined) => {
  const requestUrl = workspaceId
    ? `/workspaces/settings?workspaceId=${workspaceId}`
    : `/workspaces/settings`;

  const response = await axiosInstance.get(requestUrl);

  return response.data as WorkspaceSettingsDto;
};

const create = async (model: CreateWorkspaceDto) => {
  // Create a request object with the base properties
  const requestBody = {
    workspaceId: model.workspaceId,
    name: model.name,
    description: model.description || "",
    imageUrl: model.imageUrl,
    color: model.color,
    isConservative: model.isConservative,
    showCitations: model.showCitations,
    advancedFileAnalysis: model.advancedFileAnalysis,
    systemMessageOverride: model.systemMessageOverride,
    isFileAccessRestrictedForMembers: model.isFileAccessRestrictedForMembers,
    emailNotificationsDisabled: model.emailNotificationsDisabled,
    members:
      model.members?.map((member) => ({
        UserId: member.id,
        IsOwner: member.isOwner,
      })) || [],
    files: model.workspaceFiles
      .filter((file) => file.status !== "Failed")
      .map((file) => {
        const fileObject = {
          externalId: file.externalId,
          fileName: file.fileName,
        };
        // Encode the file object to Base64
        return btoa(unescape(encodeURIComponent(JSON.stringify(fileObject))));
      }),
    persona: model.persona
      ? {
          detailLevel: model.persona.detailLevel,
          interactionStyle: model.persona.interactionStyle,
          systemMessage: model.persona.systemMessage
            ? btoa(unescape(encodeURIComponent(model.persona.systemMessage)))
            : undefined,
        }
      : undefined,
    conversationStarters: model.conversationStarters
      ?.filter((item) => item.content.length > 0)
      .map((item) => ({
        id: item.id,
        content: item.content,
      })),
  };

  // Log request for debugging
  console.log("Creating workspace with:", requestBody);

  const response = await axiosInstance.post(`/workspaces`, requestBody, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

const update = async (id: string, model: WorkspaceUpdateRequest) => {
  // Create a request object with the properties that need to be updated
  const requestBody: any = {};

  if (model.name) {
    requestBody.name = model.name;
  }
  if (model.description) {
    requestBody.description = model.description;
  }
  if (model.imageUrl) {
    requestBody.imageUrl = model.imageUrl;
  }
  if (model.isConservative !== undefined) {
    requestBody.isConservative = model.isConservative;
  }
  if (model.showCitations !== undefined) {
    requestBody.showCitations = model.showCitations;
  }
  if (model.advancedFileAnalysis !== undefined) {
    requestBody.advancedFileAnalysis = model.advancedFileAnalysis;
  }
  if (model.systemMessageOverride !== undefined) {
    requestBody.systemMessageOverride = model.systemMessageOverride;
  }
  if (model.isFileAccessRestrictedForMembers !== undefined) {
    requestBody.isFileAccessRestrictedForMembers =
      model.isFileAccessRestrictedForMembers;
  }
  if (model.emailNotificationsDisabled !== undefined) {
    requestBody.emailNotificationsDisabled = model.emailNotificationsDisabled;
  }

  if (model.membersToAdd) {
    requestBody.membersToAdd = model.membersToAdd.map((member) => ({
      UserId: member.id,
      IsOwner: member.isOwner,
    }));
  }

  if (model.membersToRemove) {
    requestBody.membersToRemove = model.membersToRemove.map(
      (member) => member.id
    );
  }

  if (model.filesToAdd) {
    requestBody.filesToAdd = model.filesToAdd
      .filter((file) => file.status !== "Failed")
      .map((file) => {
        const fileObject = {
          externalId: file.externalId,
          fileName: file.fileName,
        };
        // Encode the file object to Base64
        return btoa(unescape(encodeURIComponent(JSON.stringify(fileObject))));
      });
  }

  if (model.filesToRemove) {
    requestBody.filesToRemove = model.filesToRemove.map((file) => {
      const fileObject = {
        externalId: file.externalId,
        fileName: file.fileName,
      };
      // Encode the file object to Base64
      return btoa(unescape(encodeURIComponent(JSON.stringify(fileObject))));
    });
  }

  if (model.persona) {
    requestBody.persona = {
      detailLevel: model.persona.detailLevel,
      interactionStyle: model.persona.interactionStyle,
      systemMessage: model.persona.systemMessage
        ? btoa(unescape(encodeURIComponent(model.persona.systemMessage)))
        : undefined,
    };
  }

  if (model.conversationStarters) {
    requestBody.conversationStarters = model.conversationStarters
      .filter((item) => item.content.length > 0)
      .map((item) => ({
        id: item.id,
        content: item.content,
      }));
  }

  // Log request for debugging
  console.log(`Updating workspace ${id} with:`, requestBody);

  const response = await axiosInstance.patch(`/workspaces/${id}`, requestBody, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

const getWorkspaces = async () => {
  const response = await axiosInstance.get("/workspaces");
  return response.data as WorkspaceDto[];
};

const get = async (workspaceId: string) => {
  const response = await axiosInstance.get(`/workspaces/${workspaceId}`);
  console.log(response);
  return response.data as WorkspaceDetailsResponse;
};

const deleteWorkspace = async (workspaceId: string) => {
  const response = await axiosInstance.delete(`/workspaces/${workspaceId}`);
  return response.data as WorkspaceDetailsResponse;
};

const updateWorkspaceSidebarVisibility = async (
  workspaceId: string,
  isHidden: boolean
) => {
  const response = await axiosInstance.patch(
    `/workspaces/${workspaceId}/visibility`,
    {
      isHidden: isHidden,
    }
  );
};

const updateWorkspaceLastInteraction = async (
  workspaceId: string,
  lastInteraction?: Date
) => {
  const url = `/workspaces/${workspaceId}/lastinteraction`;

  if (lastInteraction) {
    const response = await axiosInstance.patch(url, { lastInteraction });
    return response.data;
  } else {
    const response = await axiosInstance.patch(url);
    return response.data;
  }
};

const getWorkspaceImages = async () => {
  const response = await axiosInstance.get(`/workspaces/images`);
  return response.data as string[];
};

const getWorkspaceImage = async (imageUrl: string) => {
  const response = await axiosInstance.get(
    `/workspaces/images/by-url?imageUrl=${imageUrl}`,
    {
      responseType: "arraybuffer",
    }
  );
  return response;
};

const getProcessingStatus = async (workspaceId: string) => {
  const response = await axiosInstance.get(
    `/workspaces/${workspaceId}/processing-status`
  );
  return response.data as ProcessStatusResponse;
};

const leaveWorkspace = async (workspaceId: string) => {
  const response = await axiosInstance.put(`/workspaces/${workspaceId}/leave`);
  return response.data;
};

const requestFileUpload = async (workspaceId: string, fileName: string) => {
  const requestUrl = `/workspaces/requestFileUpload?workspaceId=${workspaceId}&fileName=${fileName}`;
  const response = await axiosInstance.get(requestUrl);
  return response.data as string;
};

const uploadWorkspaceFile = async (workspaceId: string, file: File) => {
  const formData = new FormData();
  console.log("Will upload: " + file.name);
  formData.append("file", file);

  // Build the URL, adding the query parameter if file.replace is true
  let url = `/workspaces/${workspaceId}/upload`;
  if ((file as any).replace) {
    url += "?replace=true";
  }

  try {
    const response = await axiosInstance.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading workspace file:", error);
    throw error;
  }
};

const downloadFromSharePoint = async (workspaceId: string, request: string): Promise<FileUploadResponse> => {
  return await downloadFromSharePointGeneric(
    `/workspaces/${workspaceId}/download-from-graph`,
    request
  );
};

const downloadFromSharePointForChat = async (
  chatId: string,
  request: string,
  chatType: string = 'Normal'
): Promise<FileUploadResponse> => {
  const controller = chatType === "Normal" ? "chat" : `${chatType.toLowerCase()}chat`;
  return await downloadFromSharePointGeneric(
    `/${controller}/conversation/${chatId}/download-from-graph`,
    request
  );
};

// Generic helper for downloading from SharePoint
// Note: Expects a base64 encoded GraphFileDownloadRequest with driveId and itemId properties
const downloadFromSharePointGeneric = async (
  endpoint: string,
  request: string
): Promise<FileUploadResponse> => {
  return await axiosInstance
    .post<FileUploadResponse>(endpoint, request)
    .then((response) => response.data);
};

// Export all functions through a single service object
export const workspacesService = {
  getWorkspaceSettings,
  getWorkspaces,
  get,
  create,
  update,
  deleteWorkspace,
  updateWorkspaceSidebarVisibility,
  updateWorkspaceLastInteraction,
  getWorkspaceImages,
  getWorkspaceImage,
  getProcessingStatus,
  leaveWorkspace,
  requestFileUpload,
  uploadWorkspaceFile,
  downloadFromSharePoint,
  downloadFromSharePointForChat,
};
