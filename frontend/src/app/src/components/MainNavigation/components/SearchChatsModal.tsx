import React, { useState, useEffect, useCallback } from "react";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../services/axiosInstance";
import { ChatHistoryDto } from "../../../interfaces/interfaces";
import ChatItem from "../../Chat/ChatHistoryItem";
import ModalContainer from "../../Global/ModalContainer";
import SearchBar from "../../Global/AppSearchField";
import { useNavigate } from "react-router-dom";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;

  // Optional scoping:
  type?: string;
  workspaceId?: string | null;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  open,
  onClose,
  type,
  workspaceId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<ChatHistoryDto[]>([]);

  // Route builder — adjust to your actual route schema
  const buildChatRoute = (chat: ChatHistoryDto) => {
    const chatType = (chat.type ?? "normal").toLowerCase();

    if (chat.workspaceId) {
      return `/workspaces/${chat.workspaceId}/chat/${chat.id}`;
    }

    if (chatType === "JobPost") {
      return `/job-post-creator/${chat.id}`;
    }

    return `/dsb-chat/${chat.id}`;
  };

  const handleSelectChat = (chat: ChatHistoryDto) => {
    const route = buildChatRoute(chat);
    navigate(route);
    onClose();
  };

  // Global search request
  const fetchChats = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get("/chat/global-search", {
        params: {
          query: searchQuery,
          // Pass optional scoping if your endpoint supports it
          type: type?.toLowerCase(),
          workspaceId: workspaceId || undefined,
        },
      });

      setSearchResults(response.data as ChatHistoryDto[]);
    } catch (error) {
      console.error("Error fetching global chats:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, type, workspaceId]);

  // Debounce trigger
  useEffect(() => {
    const id = setTimeout(fetchChats, 300);
    return () => clearTimeout(id);
  }, [fetchChats]);

  return (
    <ModalContainer
      open={open}
      title={t("Search Chats")}
      onClose={onClose}
      width="max-w-2xl"
    >
      {/* Search Input — bind to state */}
      <div className="fixed -top-[2.76rem] right-16 w-full max-w-xs h-16 z-[99999]">
        <SearchBar isNarrow onSearch={(val: string) => setSearchQuery(val)} />
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <CircularProgress sx={{ color: "#FFFFFF" }} />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center text-gray-300 h-20">
            {t("No chats found.")}
          </div>
        ) : (
          <div className="h-96 overflow-y-auto flex flex-wrap w-full">
            <ol className="space-y-1">
              {searchResults.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isGlobalSearch
                  onClick={() => handleSelectChat(chat)}
                />
              ))}
            </ol>
          </div>
        )}
      </div>
    </ModalContainer>
  );
};

export default GlobalSearch;
