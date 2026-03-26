export interface ChatHistoryRef {
  resetActiveChat: () => void;
  addNewChatEntry: (newChat: ChatHistoryDto) => void;
  updateConversation: (updatedChat: ChatHistoryDto, newTitle: string) => void;
  updateConversationWithoutTitle: (updatedChat: ChatHistoryDto) => void;
  updateConversationTitle: (chatId: string, newTitle: string) => void;
}

export interface Config {
  clientId: string;
  clientScopes: string[];
  clientUrl: string;
  apiUrl: string;
  environment: string;
  instrumentationKey?: string;
  features?: {
    useFeedbackChat: boolean;
  };
}

export interface ChatHistoryDto {
  id?: string;
  title: string;
  type: string;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;

  // NEW: optional agent snapshot for last assistant reply in this conversation
  lastAgentId?: string | null;
  lastAgentName?: string | null;
  lastAgentDescription?: string | null;
  lastAgentImage?: string | null;
}

export interface ChatHistoryResponse {
  results: ChatHistoryDto[];
  continuationToken: string | null;
  pageSize: number;
  totalResults: number;
}
