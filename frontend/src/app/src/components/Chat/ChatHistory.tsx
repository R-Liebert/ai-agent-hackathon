import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { ChatHistoryDto, ChatHistoryRef } from "../../interfaces/interfaces";
import { useTranslation } from "react-i18next";
import { CircularProgress } from "@mui/material";
import ChatItem from "./ChatHistoryItem";
import useChatHistoryStore from "../../stores/chatHistoryStore";

interface ChatHistoryProps {
  onSelectChat: (selectedChat: ChatHistoryDto) => void;
  onNewChat: () => void;
  DeleteSelectChat: (selectedChat: ChatHistoryDto) => void;
  type: string;
  workspaceId?: string | null;
  handleChatExport: (
    chatId: string,
    chatType: string,
    workspaceId?: string,
    fileName?: string
  ) => Promise<void>;
}

export const ChatHistoryComponent = forwardRef<
  ChatHistoryRef,
  ChatHistoryProps
>((props, ref) => {
  const { t } = useTranslation();

  // Zustand store hooks
  const {
    chatDataByType,
    activeChatId,
    setActiveChatId,
    setChatData,
    addChat,
    updateChat,
    deleteChat,
    resetActiveChat,
    fetchChatData,
    loadNextPage,
  } = useChatHistoryStore();

  const compositeKey = useMemo(
    () => `${props.type.toLowerCase()}__${(props.workspaceId || "").trim()}`,
    [props.type, props.workspaceId]
  );
  const chatData = useMemo(
    () => chatDataByType[compositeKey] || [],
    [chatDataByType, compositeKey]
  );

  // Compute loading state based on in-flight map in the store
  const key = `${props.type.toLowerCase()}__${(
    props.workspaceId || ""
  ).trim()}`;
  const isLoading = useChatHistoryStore((s) => s.inFlightByKey[key] === true);
  const isLoadingMore = useChatHistoryStore(
    (s) => s.inFlightByKey[`${key}__next`] === true
  );
  const continuationForType = useChatHistoryStore(
    (s) => s.continuationToken[key]
  );
  const hasMore = !!continuationForType;

  // Load chat data for the current type/module (normalized workspaceId)
  // Note: keep a single effect to avoid double-fetching under StrictMode

  // Imperative API for parent components
  useImperativeHandle(ref, () => ({
    addNewChatEntry(newChat: ChatHistoryDto) {
      addChat(props.type, newChat, props.workspaceId);
    },

    updateConversation(updatedChat: ChatHistoryDto, newTitle) {
      updateChat(props.type, updatedChat, newTitle, props.workspaceId);
    },

    resetActiveChat() {
      resetActiveChat();
    },

    updateConversationWithoutTitle(updatedChat: ChatHistoryDto) {
      updateChat(
        props.type,
        updatedChat,
        t("components:chatHistoryComponent.newChat") ?? "New chat",
        props.workspaceId
      );
    },

    updateConversationTitle(chatId: string, newTitle: string) {
      updateChat(
        props.type,
        { id: chatId } as ChatHistoryDto,
        newTitle,
        props.workspaceId
      );
    },
  }));

  const handleChatItemClick = (chat: ChatHistoryDto) => {
    if (chat?.id) {
      setActiveChatId(chat.id);
    } else {
      // For any edge case where id is missing, clear selection
      setActiveChatId(null);
    }
    props.onSelectChat(chat);
  };

  const handleChatDeleteClick = (chat: ChatHistoryDto) => {
    if (chat.id) {
      deleteChat(props.type, chat.id, props.workspaceId); // Only call deleteChat if chat.id is valid
      props.DeleteSelectChat(chat);
    } else {
      console.error("Chat ID is undefined or null. Cannot delete chat.");
    }
  };

  useEffect(() => {
    const normalizedWorkspaceId = props.workspaceId ?? undefined; // Convert null to undefined
    // Force refresh when entering a page that mounts this component
    fetchChatData(props.type, normalizedWorkspaceId, true);
  }, [props.type, props.workspaceId]);

  // Infinite scroll: observe the sentinel at the end of the list
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadNextPage(props.type, props.workspaceId ?? undefined);
        }
      },
      { root: null, rootMargin: "200px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    hasMore,
    isLoading,
    isLoadingMore,
    loadNextPage,
    props.type,
    props.workspaceId,
  ]);

  const renderNoChatsMessage = () => (
    <div className="flex flex-col ml-2 justify-center h-full font-body text-gray-400">
      <p>{t("components:chatHistoryComponent.noChats")}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full font-body text-sm w-full will-change-transform">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <CircularProgress sx={{ color: "#FFFFFF" }} />
        </div>
      ) : chatData.length === 0 ? (
        renderNoChatsMessage()
      ) : (
        <div className="flex flex-col">
          <div className="flex flex-col h-auto w-full space-between">
            <ol className="mr-2" style={{ contain: "content" }}>
              {chatData.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  onClick={() => handleChatItemClick(chat)}
                  onDelete={() => handleChatDeleteClick(chat)}
                  handleChatExport={() => {
                    if (chat.id) {
                      const normalizedWorkspaceId =
                        props.workspaceId ?? undefined; // Convert null to undefined
                      props.handleChatExport(
                        chat.id,
                        chat.type,
                        normalizedWorkspaceId, // Pass normalized value
                        `${chat.title}.docx`
                      );
                    }
                  }}
                />
              ))}
            </ol>
            {/* Infinite scroll sentinel and loading-more skeletons */}
            <div ref={loadMoreRef} className="h-px" />
            {isLoadingMore && (
              <div className="flex items-center justify-center py-1 mr-1">
                <CircularProgress size={20} sx={{ color: "#FFFFFF" }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
