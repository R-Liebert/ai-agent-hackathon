export interface UserDto {
  id: string;
  displayName: string;
  email: string;
  profilePictureBase64?: string;
}

export interface WorkspaceMemberDto {
  id: string;
  displayName: string;
  email: string;
  profilePictureBase64?: string;
  isOwner: boolean;
}

export type CreateWorkspaceDto = {
  workspaceId: string;
  name: string;
  description?: string;
  imageUrl: string;
  color: string;
  isConservative?: boolean;
  showCitations?: boolean;
  advancedFileAnalysis: boolean;
  systemMessageOverride: boolean;
  members: WorkspaceMemberDto[];
  workspaceFiles: WorkspaceFileDto[];
  isFileAccessRestrictedForMembers: boolean;
  emailNotificationsDisabled: boolean;
  persona: PersonaConfigurationDto;
  conversationStarters: ConversationStarterDto[];
};

export type WorkspaceUpdateRequest = {
  workspaceId: string;
  name?: string;
  description?: string;
  isConservative?: boolean;
  showCitations?: boolean;
  advancedFileAnalysis?: boolean;
  systemMessageOverride?: boolean;
  imageUrl?: string;
  membersToAdd?: WorkspaceMemberDto[];
  membersToRemove?: WorkspaceMemberDto[];
  filesToAdd?: WorkspaceFileDto[];
  filesToRemove?: WorkspaceFileDto[];
  isFileAccessRestrictedForMembers: boolean;
  emailNotificationsDisabled: boolean;
  persona?: PersonaConfigurationDto;
  conversationStarters: ConversationStarterDto[];
};

export type PersonaConfigurationDto = {
  systemMessage: string;
  detailLevel: string;
  interactionStyle: string;
};

export type WorkspaceSettingsDto = {
  persona: PersonaConfigurationDto;
  files: {
    maxFileSize: number;
    maxNumberOfFiles: number;
    maxBatchSize: number;
    quota: number;
    allowedFileTypes: [
      {
        contentType: string;
        fileExtension: string;
      }
    ];
  };
};

export type WorkspaceDto = {
  id: string;
  isOwner: boolean;
  name: string;
  isHidden: boolean;
  imageUrl?: string;
  lastInteraction?: Date;
  createdAt: Date;
  updatedAt?: Date;
  memberCount: number;
  fileCount: number;
  color: string;
  isFileAccessRestrictedForMembers?: boolean;
  members: WorkspaceMemberDto[];
};

export type WorkspaceFileDto = {
  id: string;
  externalId: string;
  fileName: string;
  blobName: string;
  contentType: string;
  status: string;
  uploadedAt: Date;
  contentLength: number;
};

export type WorkspaceDetailsResponse = {
  id: string;
  name: string;
  description?: string;
  isOwner: boolean;
  ownerId: string;
  workspaceName: string;
  imageUrl: string;
  members: WorkspaceMemberDto[];
  files: WorkspaceFileDto[];
  color: string;
  isConservative?: boolean;
  showCitations?: boolean;
  advancedFileAnalysis?: boolean;
  systemMessageOverride?: boolean;
  isFileAccessRestrictedForMembers?: boolean;
  emailNotificationsDisabled?: boolean;
  persona: PersonaConfigurationDto;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: WorkspaceMemberDto;
  processingStatus: ProcessingStatus;
  conversationStarters: ConversationStarterDto[];
};

export type FileStatus = "Indexed" | "NotIndexed" | "Processing" | "CodeInterpreter";
export type ProcessingStatus = "Pending" | "Processing" | "Completed" | "Failed";

export type ProcessStatusResponse = {
  processingStatus: ProcessingStatus;
};

export type WorkspaceProcessingStatusResponse = {
  processingStatus: ProcessingStatus;
  failureReason?: string;
  lastStatusUpdate?: string;
  processingAttempts: number;
  hasFiles: boolean;
};


export type ConversationStarterDto = {
  id: string;
  content: string;
};
