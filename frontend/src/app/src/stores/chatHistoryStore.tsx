import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatHistoryDto } from "../interfaces/interfaces";
import axiosInstance from "../services/axiosInstance";

interface ChatHistoryState {
  chatDataByType: Record<string, ChatHistoryDto[]>; // Stores chat history by composite key: `${type.toLowerCase()}__${workspaceId || ""}`
  activeChatId: string | null;
  continuationToken: Record<string, string | undefined>; // keyed by composite key like chatDataByType
  inFlightByKey: Record<string, boolean>;
  setActiveChatId: (chatId: string | null) => void;
  setChatData: (
    type: string,
    workspaceId: string | null | undefined,
    data: ChatHistoryDto[]
  ) => void;
  addChat: (type: string, chat: ChatHistoryDto, workspaceId?: string | null) => void;
  updateChat: (
    type: string,
    updatedChat: ChatHistoryDto,
    newTitle: string,
    workspaceId?: string | null
  ) => void;
  deleteChat: (type: string, chatId: string, workspaceId?: string | null) => void;
  resetActiveChat: () => void;
  fetchChatData: (
    type: string,
    workspaceId?: string | null,
    force?: boolean
  ) => Promise<void>;
  loadNextPage: (type: string, workspaceId?: string | null) => Promise<void>;
}

const fetchHistoryPage = async (
  type: string,
  limit: number,
  continuationToken: string | null = null,
  workspaceId: string | null
) => {
  const queryParams = {
    type: type.toLowerCase(),
    limit,
  } as {
    type: string;
    limit: number;
    workspaceId?: string;
  };

  if (workspaceId && workspaceId.trim() !== "") {
    queryParams.workspaceId = workspaceId;
  }

  const requestBody = continuationToken
    ? {
        continuationToken: btoa(
          unescape(encodeURIComponent(continuationToken))
        ),
      }
    : {};

  const controller =
    queryParams.type === "normal" ? "chat" : `${queryParams.type}chat`;

  const response = await axiosInstance.post(
    `/${controller}/history`,
    requestBody,
    {
      params: queryParams,
      headers: { "Content-Type": "application/json" },
    }
  );

  return {
    results: (response.data?.results ?? []) as ChatHistoryDto[],
    continuationToken: response.data?.continuationToken ?? null,
  };
};

const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      chatDataByType: {}, // Initial state: empty object to store chat data by type
      activeChatId: null, // Initial state for active chat
      continuationToken: {}, // Initial state for continuation tokens
      inFlightByKey: {},
      setActiveChatId: (chatId) => set({ activeChatId: chatId }),

      // Set chat data for a specific type/module/workspace
      setChatData: (type, workspaceId, data) =>
        set((state) => {
          const key = `${type.toLowerCase()}__${(workspaceId || "").trim()}`;
          return {
            chatDataByType: {
              ...state.chatDataByType,
              [key]: data,
            },
          };
        }),

      // Add a new chat for a specific type/module/workspace
      addChat: (type, chat, workspaceId) =>
        set((state) => {
          const key = `${type.toLowerCase()}__${(workspaceId || "").trim()}`;
          const existingChats = state.chatDataByType[key] || [];
          const exists = existingChats.some((c) => c.id === chat.id);
          if (exists) return state; // Prevent duplicates
          return {
            chatDataByType: {
              ...state.chatDataByType,
              [key]: [chat, ...existingChats],
            },
            activeChatId: chat.id,
          };
        }),

      // Update an existing chat for a specific type/module/workspace
      updateChat: (type, updatedChat, newTitle, workspaceId) =>
        set((state) => {
          const key = `${type.toLowerCase()}__${(workspaceId || "").trim()}`;
          const list = state.chatDataByType[key] || [];
          return {
            chatDataByType: {
              ...state.chatDataByType,
              [key]: list.map((chat) =>
                chat.id === updatedChat.id
                  ? { ...chat, ...updatedChat, title: newTitle }
                  : chat
              ),
            },
          };
        }),

      // Delete a chat for a specific type/module/workspace
      deleteChat: (type, chatId, workspaceId) =>
        set((state) => {
          const key = `${type.toLowerCase()}__${(workspaceId || "").trim()}`;
          const list = state.chatDataByType[key] || [];
          return {
            chatDataByType: {
              ...state.chatDataByType,
              [key]: list.filter((chat) => chat.id !== chatId),
            },
          };
        }),

      // Reset the active chat
      resetActiveChat: () => set({ activeChatId: null }),

      // Fetch chat data for a specific type/module
      fetchChatData: async (type, workspaceId, force = false) => {
        const compositeKey = `${type.toLowerCase()}__${(workspaceId || "").trim()}`;
        const existingData = get().chatDataByType[compositeKey];
        if (!force && existingData && existingData.length > 0) {
          // Data already present, skip unless forced
          return;
        }

        const key = compositeKey;
        const inFlight = get().inFlightByKey[key];
        if (inFlight) {
          // A fetch for the same key is already in progress
          return;
        }

        // Mark in-flight
        set((state) => ({
          inFlightByKey: { ...state.inFlightByKey, [key]: true },
        }));

        try {
          // initial page size kept small for perf; can be tweaked
          const initialLimit = 25;
          const wId = workspaceId?.trim() || null;

          const response = await fetchHistoryPage(
            type,
            initialLimit,
            null,
            wId
          );

          const results = response?.results ?? [];
          set((state) => ({
            chatDataByType: {
              ...state.chatDataByType,
              [key]: results,
            },
            continuationToken: {
              ...state.continuationToken,
              [key]: response.continuationToken,
            },
          }));
        } catch (err) {
          console.error(`Error fetching chat data for type "${type}":`, err);
          set((state) => ({
            chatDataByType: {
              ...state.chatDataByType,
              [key]: [],
            },
            continuationToken: {},
          }));
        } finally {
          // Clear in-flight flag
          set((state) => {
            const next = { ...state.inFlightByKey };
            delete next[key];
            return { inFlightByKey: next } as Partial<ChatHistoryState> as any;
          });
        }
      },

      loadNextPage: async (type, workspaceId) => {
        const keyBase = `${type.toLowerCase()}__${(workspaceId || "").trim()}`;
        const token = get().continuationToken[keyBase];
        if (!token) return; // nothing to load

        const key = `${keyBase}__next`;
        if (get().inFlightByKey[key]) return;

        // mark in-flight for next page
        set((state) => ({
          inFlightByKey: { ...state.inFlightByKey, [key]: true },
        }));

        try {
          const wId = workspaceId?.trim() || null;
          const pageSize = 25;
          const response = await fetchHistoryPage(
            type,
            pageSize,
            token,
            wId
          );

          const results = response?.results ?? [];
          set((state) => {
            const existing = state.chatDataByType[keyBase] || [];
            // dedupe by id when appending
            const existingIds = new Set(existing.map((c) => c.id));
            const merged = existing.concat(results.filter((c) => !existingIds.has(c.id)));
            return {
              chatDataByType: {
                ...state.chatDataByType,
                [keyBase]: merged,
              },
              continuationToken: {
                ...state.continuationToken,
                [keyBase]: response.continuationToken,
              },
            };
          });
        } catch (err) {
          console.error(`Error loading next page for type "${type}":`, err);
        } finally {
          set((state) => {
            const next = { ...state.inFlightByKey };
            delete next[key];
            return { inFlightByKey: next } as Partial<ChatHistoryState> as any;
          });
        }
      },
    }),
    {
      name: "chat-history", // Key for local storage
      // Persist only durable data. Do NOT persist in-flight flags to avoid sticky states
      // that can block network requests in subsequent sessions.
      partialize: (state) => ({
        chatDataByType: state.chatDataByType,
        activeChatId: state.activeChatId,
        continuationToken: state.continuationToken,
      }),
      // Bump version to migrate away any previously persisted inFlightByKey
      version: 2,
      migrate: (persisted, version) => {
        if (!persisted) return persisted as any;
        const { inFlightByKey, ...rest } = (persisted as any) || {};
        return rest as any;
      },
      storage: {
        getItem: (name) => {
          const storedValue = localStorage.getItem(name);
          return storedValue ? JSON.parse(storedValue) : null; // Deserialize JSON string
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value)); // Serialize to JSON string
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

export default useChatHistoryStore;
