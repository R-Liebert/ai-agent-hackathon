import { ChatMessage } from "src/models/chat-message";
import { ChatConversation } from "../../models/chat-conversation";

export type previewApiType = {
  appetizer: string;
  header: string;
  jobDescription: string;
  qualifications: string;
  shortIntroduction: string;
  teamDescription: string;
};
export type requestApiType = {
  [key: string]: string;
};

export interface previewResponse {
  title: string;
  description: string[];
  currentVariant: number;
}

export type createPromptFieldType = {
  id: string;
  isError: boolean;
  title: string;
  placeholder: string;
  value: string;
  isEdited: boolean;
};
export interface State {
  dialogue: ChatConversation;
}
export type loadingPreviewType = {
  [key: string]: boolean;
};

export interface JobPostDto {
  id: string;
  title: string;
  isActive: boolean;
}

export interface JobPostProperties {
  positionLevel: string;
  jobTitle: string;
  jobScope: string;
  qualifications: string;
  departmentTeam: string;
  language: string;
}

export interface JobPostSection {
  id: string;
  order?: number;
  html?: string;
  text?: string;
}

export interface JobPostState {
  id: string;
  properties: JobPostProperties;
  sections: Record<string, string> | JobPostSection[];
  sectionVersions?: Record<string, string>;
  headVersionId?: string | null;
  currentVersionId?: string | null;
  versionCounter?: number;
  redoStack?: string[];
  snapshotVersion?: number;
  pointsTo?: number;
  canUndo?: boolean;
  canRedo?: boolean;
  eTag?: string;
  etag?: string;
  _etag?: string;
}

export interface JobPostResponseDto {
  jobPost: JobPostDto;
  state: JobPostState;
  chatHistory: ChatMessage[];
}
