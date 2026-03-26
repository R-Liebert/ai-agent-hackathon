import { ChatConversationOptions } from "./chat-conversation-options";
import { ChatMessage } from "./chat-message";

interface IChatConversation {
  id?: string | null;
  userId: string;
  messages: ChatMessage[];
  title?: string;
  options?: ChatConversationOptions;
}

export class ChatConversation implements IChatConversation {
  id?: string | null;
  userId: string;
  title?: string;
  messages: ChatMessage[];
  language?: string;

  constructor(id: string | null, userId: string, messages: ChatMessage[], title?: string) {
    this.id = id;
    this.userId = userId;
    this.messages = messages;
    this.title = title;
  }

  static Create(userId: string): ChatConversation {
    return new ChatConversation(null, userId, [], "New chat");
  }
}
