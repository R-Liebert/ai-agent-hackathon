import axiosInstance from "./axiosInstance";

export const getChatMessages = async (
  chatId: string,
  chatType: string,
  workspaceId?: string
) => {
  let url = `/chat/${chatType}/${chatId}/export`;

  if (workspaceId) {
    url += `?workspaceId=${workspaceId}`;
  }

  const response = await axiosInstance.get(url, {
    responseType: "arraybuffer",
  });

  return response;
};

export const chatExportService = {
  getChatMessages,
};
