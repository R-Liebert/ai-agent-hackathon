import axiosInstance from "../axiosInstance";
import {
  ChatMessageVersionsMigrationParams,
  ChatMessageVersionsQueuedResponse,
  ChatMessageVersionsRunNowResponse,
} from "./types/adminMigrations.types";

const BASE = "/admin/migrations/chat-message-versions";

const buildSearchParams = (
  params: ChatMessageVersionsMigrationParams
): URLSearchParams => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams;
};

export const adminMigrationsService = {
  async runChatMessageVersionsMigration(
    params: ChatMessageVersionsMigrationParams
  ): Promise<ChatMessageVersionsRunNowResponse> {
    const searchParams = buildSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `${BASE}/run-now?${queryString}` : `${BASE}/run-now`;
    const response = await axiosInstance.post(url);
    return response.data;
  },

  async queueChatMessageVersionsMigration(
    params: ChatMessageVersionsMigrationParams
  ): Promise<ChatMessageVersionsQueuedResponse> {
    const searchParams = buildSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `${BASE}?${queryString}` : BASE;
    const response = await axiosInstance.post(url);
    return response.data;
  },
};
