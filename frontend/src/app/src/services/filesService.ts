import axiosInstance from "./axiosInstance";

const config = window.env;

export interface FileUploadResponse {
  fileName: string;
  fileType: string;
  blobUrl: string;      // Direct blob storage URL for backend use
  previewUrl: string;   // API endpoint URL for frontend authenticated display
}

export const uploadFiles = async (
  file: File,
  chatId: string,
  chatType: string = 'Normal'
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const controller = chatType === "Normal" ? "chat" : `${chatType.toLowerCase()}chat`;
    const response = await axiosInstance.post<FileUploadResponse>(
      `/${controller}/conversation/${chatId}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

/**
 * Generate a preview URL for encrypted workspace files
 *
 * Flow for encrypted files:
 * 1. Request base64-encoded SAS token from backend
 * 2. Build preview URL: /files/preview-from-sas?token={base64Sas}
 * 3. Server decrypts and streams the file when preview URL is opened
 *
 * @param containerName - The blob container (e.g., 'workspace-files')
 * @param blobName - The blob name/path within the container
 * @param workspaceId - Optional workspace ID (for workspace-scoped files)
 * @returns Preview URL to open in new tab (token embedded in query string)
 */
export const getPreviewFileLink = async (
  containerName: string,
  blobName: string,
  workspaceId?: string
): Promise<string | undefined> => {
  // Build the blob path: if workspace-scoped, include workspace ID
  const blobPath = workspaceId ? `${workspaceId}/${blobName}` : blobName;

  // Encode the blob path and preserve forward slashes (as per guide)
  const encodedBlobPath = encodeURIComponent(blobPath).replace(/%2F/g, '/');

  // Build the endpoint URL to get preview token
  const url = `/files/links/${containerName}/${encodedBlobPath}/generate`;

  // POST request with bearer token (added by axiosInstance interceptor)
  const response = await axiosInstance.post(url);

  // Response is base64-encoded SAS token
  const base64Sas = response.data;

  // Build the absolute preview URL using apiUrl from config
  // Server will decrypt and stream the file when this URL is opened
  const previewUrl = `${config.apiUrl}api/files/preview-from-sas?token=${base64Sas}`;

  return previewUrl;
};

export const downloadFile = async (
  containerName: string,
  blobName: string,
  workspaceId?: string
): Promise<void> => {
  const url =  workspaceId
    ? `/files/${containerName}/${workspaceId}/${blobName}`
    : `/files/${containerName}/${blobName}`;

  const response = await axiosInstance.post(url, null, { responseType: "blob" });
  const fileName = extractFileName(response, blobName);
  triggerFileDownload(response.data, fileName, response.headers["content-type"]);
};


function extractFileName(response: any, fallbackName: string): string {
  const contentDisposition = response.headers["content-disposition"];
  if (!contentDisposition) return fallbackName;

  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  return match?.[1] ? decodeURIComponent(match[1]) : fallbackName;
}

function triggerFileDownload(data: BlobPart, fileName: string, contentType?: string) {
  const blob = new Blob([data], { type: contentType || "application/octet-stream" });
  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(link);
  }, 100);
}

export const filesService = {
  uploadFiles,
  getPreviewFileLink,
  downloadFile
};