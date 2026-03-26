export type WorkspaceProcessingStatus = "Pending" | "Processing" | "Completed" | "Failed";

export interface AdminWorkspaceSummaryDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  showCitations: boolean;
  advancedFileAnalysis: boolean;
  isConservative?: boolean | null;
  isFileAccessRestrictedForMembers?: boolean;
  emailNotificationsDisabled?: boolean;
  processingStatus: WorkspaceProcessingStatus;
  // New inline counts provided by backend to avoid separate stats call
  membersCount?: number;
  fileCount?: number;
  // Optional PII fields (enabled only when includeCreatorDetails=true)
  creatorName?: string;
  creatorEmail?: string;
}

export interface WorkspaceStatsDto {
  workspaceId: string;
  memberCount: number;
  fileCount: number;
  totalStorageUsed: number;
}

// Legacy helper if needed elsewhere
export interface PagedResult<T> {
  items: T[];
  continuationToken?: string;
  hasMore: boolean;
}

export interface WorkspaceMemberDto {
  userId: string;
  isOwner: boolean;
  lastInteraction?: string;
  isHidden?: boolean;
}

export interface WorkspaceFileDto {
  id: string;
  fileName: string;
  externalId?: string;
  blobName?: string;
  contentType?: string;
  status: "Uploaded" | "Processing" | "Indexed" | "Failed";
  uploadedAt: string;
  contentLength: number;
  driveId?: string | null;
  fileSource?: "Device" | "Sharepoint";
  itemId?: string | null;
}

export interface WorkspaceDetailsDto {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  color?: string | null;
  showCitations: boolean;
  advancedFileAnalysis: boolean;
  systemMessageOverride?: boolean;
  isConservative?: boolean | null;
  isFileAccessRestrictedForMembers?: boolean;
  emailNotificationsDisabled?: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  processingStatus: WorkspaceProcessingStatus;
  // Inline totals
  membersCount?: number;
  fileCount?: number;
  // Members (paged independently)
  members: WorkspaceMemberDto[];
  membersContinuationToken?: string;
  membersPageSize: number;
  membersHasMore: boolean;
  // Files (paged independently)
  files: WorkspaceFileDto[];
  filesContinuationToken?: string | null;
  filesPageSize: number;
  filesHasMore: boolean;
  // Inactive files (paged independently)
  inactiveFiles?: WorkspaceFileDto[];
  inactiveFilesContinuationToken?: string | null;
  inactiveFilesPageSize?: number;
  inactiveFilesHasMore?: boolean;
  // Optional totals
  totalChats?: number | null;
}

export interface WorkspaceFilters {
  searchTerm?: string;
  sortBy?: "CreatedAt" | "UpdatedAt" | "Name" | "MembersCount" | "FileCount";
  sortDescending?: boolean;
  createdAfter?: string; // ISO string
  createdBefore?: string; // ISO string
  showCitations?: boolean;
  advancedFileAnalysis?: boolean;
  isConservative?: boolean;
  isFileAccessRestrictedForMembers?: boolean;
  emailNotificationsDisabled?: boolean;
  includeCreatorDetails?: boolean;
  includeTotalCount?: boolean; // when true on first page, totalCount included
}

export interface WorkspaceQueryParams extends WorkspaceFilters {
  pageSize?: number;
  continuationToken?: string;
  forceRefresh?: boolean;
}

export interface WorkspaceListResponse {
  workspaces: AdminWorkspaceSummaryDto[];
  continuationToken?: string;
  pageSize: number;
  hasMore: boolean;
  fromCache: boolean;
  responseTime: string;
  totalCount?: number;
}

// Diagnostics
export interface BlobFilesResponse {
  container: string;
  prefix: string;
  files: string[];
  count: number;
}

export interface IndexFilesResponse {
  indexName: string;
  files: string[];
  fileAndCount: { fileName: string; count: number }[];
}

export interface OpenAiFileInput {
  fileName: string;
  blobName?: string | null;
  externalId?: string | null;
}

export interface OpenAiFilesCheckRequest {
  files: OpenAiFileInput[];
}

export interface OpenAiFileCheckResult {
  externalId: string | null;
  fileName: string;
  blobName: string | null;
  openAiFileName: string | null;
  existsAndMatches: boolean;
  missing: boolean;
  reason: string | null;
}

export interface OpenAiFilesCheckResponse {
  results: OpenAiFileCheckResult[];
}

export interface WorkspaceDetailsQueryParams {
  membersPageSize?: number;
  membersContinuationToken?: string;
  filesPageSize?: number;
  filesContinuationToken?: string | null;
  inactiveFilesPageSize?: number;
  inactiveFilesContinuationToken?: string | null;
  includeChatTotals?: boolean;
  fetchAllFiles?: boolean;
}

