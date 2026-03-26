// Traffic Information Types and Interfaces

export type TabKey = "DSB.dk" | "Tavle 7" | "Infoskaerm";
export type Language = "Danish" | "English";

// Request Interfaces
export interface TrafficInformationRequest {
  TrafficInformation: string;
}

export interface TrafficInformationRegenerationRequest {
  TrafficInformation: string;
  Platform: TabKey;
  OutputLanguage: Language;
}

export interface SystemPromptUpdateRequest {
  Message: string;
  Platform: TabKey;
}

// Response Types
export interface SystemPrompts {
  "DSB.dk": string;
  "Tavle 7": string;
  Infoskaerm: string;
}

export interface StreamingResponse {
  content?: string;
  messageId?: string;
  error?: string;
  done?: boolean;
}

// UI State Interfaces
export interface TabContent {
  platform: TabKey;
  content: {
    Danish: string;
    English: string;
  };
  isLoading: boolean;
  error?: Error;
  regenerationHistory: string[];
}

export interface TrafficInformationState {
  inputText: string;
  tabContents: Record<TabKey, TabContent>;
  activeTab: TabKey;
  systemPrompts: SystemPrompts;
  isGenerating: boolean;
  globalError?: Error;
}

// Component Props
export interface Tab {
  label: TabKey;
  content: React.ReactNode;
}

export interface ChatOutputTabProps {
  tabs: Tab[];
  activeTab: TabKey;
  onTabChange: (newTab: TabKey) => void;
  isRegenerating?: boolean;
  isLoading?: boolean;
  contentOnlyLoading?: boolean; // Only show skeleton in content area, keep tabs and instructions visible
}

export interface PromptSettingsDialogProps {
  open: boolean;
  title: string;
  cancelBtn: string;
  confirmBtn: string;
  onCancel: () => void;
  onConfirm: () => void;
  onClose: () => void;
  systemPrompts?: SystemPrompts;
  updateSystemPrompts?: (prompts: SystemPrompts) => Promise<void>;
  isLoadingPrompts?: boolean;
  refreshSystemPrompts?: () => Promise<void>;
}

export interface EditTabOutputDialogProps {
  open: boolean;
  title: string;
  regeneratedContents: string[];
  cancelBtn: string;
  confirmBtn: string;
  onCancel: () => void;
  onConfirm: (updatedContent: string) => void;
  onRegenerate: () => void;
  onClose: () => void;
}

// Backend Response Types
export interface PlatformContentResponse {
  platform: string;
  content: {
    Danish: string;
    English: string;
  };
}

// Service Response Types
export interface GenerateContentStreamParams {
  payload: TrafficInformationRequest;
  onContent: (content: PlatformContentResponse) => void;
  onDone?: () => void;
  onError?: (err: any) => void;
  signal?: AbortSignal;
}

export interface RegenerateContentStreamParams {
  payload: TrafficInformationRegenerationRequest;
  onContent: (content: string) => void;
  onDone?: () => void;
  onError?: (err: any) => void;
  signal?: AbortSignal;
}

// Error Types
export interface TrafficInformationError extends Error {
  code?: string;
  statusCode?: number;
  platform?: TabKey;
}
