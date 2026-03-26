import { AdminWorkspaceSummaryDto, WorkspaceProcessingStatus } from "../../../../services/admin/types/adminWorkspace.types";

export interface WorkspaceTableProps {
  workspaces: AdminWorkspaceSummaryDto[];
  onWorkspaceClick: (workspaceId: string) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalCount?: number;
  sortBy: "CreatedAt" | "UpdatedAt" | "Name" | "MembersCount" | "FileCount";
  sortDescending: boolean;
  onSortChange: (field: "CreatedAt" | "UpdatedAt" | "Name" | "MembersCount" | "FileCount", descending: boolean) => void;
}

export interface WorkspaceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  forceRefresh: boolean;
  onForceRefreshChange: (value: boolean) => void;
  showCitations?: boolean;
  onShowCitationsChange: (value: boolean | undefined) => void;
  advancedFileAnalysis?: boolean;
  onAdvancedFileAnalysisChange: (value: boolean | undefined) => void;
  isConservative?: boolean;
  onIsConservativeChange: (value: boolean | undefined) => void;
  isFileAccessRestrictedForMembers?: boolean;
  onIsFileAccessRestrictedForMembersChange: (value: boolean | undefined) => void;
  emailNotificationsDisabled?: boolean;
  onEmailNotificationsDisabledChange: (value: boolean | undefined) => void;
  createdAfter?: string;
  onCreatedAfterChange: (value: string | undefined) => void;
  createdBefore?: string;
  onCreatedBeforeChange: (value: string | undefined) => void;
  processingStatus?: WorkspaceProcessingStatus[];
  onProcessingStatusChange: (value: WorkspaceProcessingStatus[] | undefined) => void;
  onRefresh: () => void;
}

export interface WorkspaceTableRowProps {
  workspace: AdminWorkspaceSummaryDto;
  onClick: () => void;
}

export interface WorkspaceEmptyStateProps {
  hasFilters?: boolean;
}

export type SortField = "name" | "createdAt" | "updatedAt" | "membersCount" | "fileCount" | "status";
export type SortDirection = "asc" | "desc";

export type OpenAiState = "present" | "missing" | "mismatched" | "noExternalId" | "unknown" | "error";

export type OpenAiRowStatusById = Record<string, { state: OpenAiState; pending: boolean }>;

export interface OpenAiChipStyle {
  label: string;
  sx: {
    backgroundColor: string;
    color: string;
    border: string;
  };
}

export interface DbStatusChipStyle {
  label: string;
  sx: {
    backgroundColor: string;
    color: string;
    border: string;
  };
}