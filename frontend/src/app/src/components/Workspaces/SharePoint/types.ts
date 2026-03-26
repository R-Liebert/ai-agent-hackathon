export interface DriveItem {
  id: string;
  name: string;
  folder?: any;
  size?: number;
  lastModifiedDateTime?: string;
  parentReference?: {
    driveId: string;
    path?: string;
  };
  "@microsoft.graph.downloadUrl"?: string;
  remoteItem?: {
    id: string;
    parentReference: {
      driveId: string;
      driveType: string;
    };
  };
  isAllowed?: boolean;
  isChannel?: boolean;
  channelId?: string;
}

export interface DownloadProgress {
  [key: string]: {
    progress: number;
    total: number;
    buffer: number;
  };
}

export interface JoinedTeam {
  id: string;
  displayName: string;
  description?: string;
  photoUrl?: string;
  driveId?: string;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

export interface PathHistoryItem {
  path: string;
  name: string;
}

export type SortField = "name" | "size" | "lastModified";
export type SortDirection = "asc" | "desc";

export interface SharePointFilePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  allowedFileTypes?: { contentType: string; fileExtension: string }[];
}
