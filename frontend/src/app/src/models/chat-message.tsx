import { MessageRole, MessageRoleString } from "./chat-message-role";
import { ChatMessageCitation } from "./chat-message-citations";
import { v4 as uuidv4 } from "uuid";
import { Agent } from "./agent-model"; // Import the Agent model

export interface ChatFileMetadata {
  fileName: string;
  fileType: string;
  fileIdentifier?: string; // Legacy - for backward compatibility with old messages
  blobUrl?: string; // Direct blob storage URL for backend use
  previewUrl?: string; // API endpoint URL for frontend authenticated display
}

export interface ImageGenerationItem {
  requestId: string;
  status: "started" | "partial" | "completed" | "failed";
  url?: string;
  alt?: string;
  prompt?: string;
  error?: string;
  progress?: number;
  partialUrl?: string;
  partialIndex?: number;
  totalPartials?: number;
}

export type ChatStreamItem =
  | { type: "text"; content: string }
  | { type: "image"; requestId: string };

export interface IChatMessage {
  id: string;
  clientId?: string;
  role: string;
  content: string;
  date: string;
  citations?: ChatMessageCitation[];
  error: boolean;
  files?: ChatFileMetadata[];
  imageGenerations?: ImageGenerationItem[];
  streamItems?: ChatStreamItem[];
  header?: string;
  agent?: Agent; // Optional agent property
  selectedText?: string; // Optional selected text from canvas
  timestamp?: string;
}

export class ChatMessage implements IChatMessage {
  id: string;
  clientId?: string;
  content: string;
  role: string;
  date: string;
  imageGenerations?: ImageGenerationItem[];
  streamItems?: ChatStreamItem[];
  citations?: ChatMessageCitation[];
  error: boolean;
  files?: ChatFileMetadata[];
  header?: string;
  agent?: Agent; // Optional agent property
  selectedText?: string; // Optional selected text from canvas
  timestamp?: string;

  constructor(
    id: string,
    content: string,
    role: string,
    date: string,
    error: boolean = false,
    files?: ChatFileMetadata[],
    header?: string,
    agent?: Agent, // Optional agent parameter
    selectedText?: string, // Optional selected text parameter
    timestamp?: string,
    clientId: string = uuidv4()
  ) {
    this.id = id;
    this.clientId = clientId;
    this.content = content;
    this.role = role;
    this.date = date;
    this.error = error;
    this.files = files;
    this.header = header;
    this.agent = agent;
    this.selectedText = selectedText;
    this.timestamp = timestamp;
  }

  // Method to create a user message
  static CreateUserMessage(
    content: string,
    files?: ChatFileMetadata[]
  ): ChatMessage {
    return new ChatMessage(
      uuidv4(),
      content,
      MessageRoleString[MessageRole.User],
      new Date().toISOString(),
      false,
      files
    );
  }

  // Method to create an agent message
  static CreateAgentMessage(
    content: string,
    agent: Agent,
    files?: ChatFileMetadata[]
  ): ChatMessage {
    return new ChatMessage(
      uuidv4(),
      content,
      MessageRoleString[MessageRole.Assistant],
      new Date().toISOString(),
      false,
      files,
      undefined,
      agent // Associate the agent with the message
    );
  }
}
