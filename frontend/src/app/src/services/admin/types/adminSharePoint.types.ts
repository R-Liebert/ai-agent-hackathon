import { WorkspaceFileDto } from "./adminWorkspace.types";

export interface AdminSharePointFileWithMetadata extends WorkspaceFileDto {
  // Graph API metadata
  graphMetadata?: {
    lastModifiedDateTime: string;
    createdDateTime: string;
    size: number;
    createdBy?: {
      user?: {
        displayName: string;
        email: string;
      };
    };
    lastModifiedBy?: {
      user?: {
        displayName: string;
        email: string;
      };
    };
    webUrl?: string;
  };
  
  // Drive information
  driveInfo?: {
    id: string;
    name: string;
    driveType: 'personal' | 'business' | 'documentLibrary';
    owner?: {
      user?: { 
        displayName: string; 
        email: string; 
      };
      group?: { 
        displayName: string; 
      };
    };
    webUrl?: string;
  };

  // Loading states
  driveInfoLoading?: boolean;
  fileMetadataLoading?: boolean;
  driveInfoError?: string;
  fileMetadataError?: string;
}

export interface AdminSharePointMetadataState {
  // Drive information cache
  driveInfoCache: Map<string, AdminDriveInfo | Error>;
  driveInfoLoading: boolean;
  driveInfoError?: string;

  // File metadata cache  
  fileMetadataCache: Map<string, AdminFileItemDetails | Error>;
  fileMetadataLoading: boolean;
  fileMetadataError?: string;

  // Overall loading state
  isLoading: boolean;
}

export interface AdminDriveInfo {
  id: string;
  name: string;
  driveType: 'personal' | 'business' | 'documentLibrary';
  owner?: {
    user?: { 
      displayName: string; 
      email: string; 
    };
    group?: { 
      displayName: string; 
    };
  };
  webUrl?: string;
  siteName?: string; // SharePoint site name extracted from webUrl
}

export interface AdminFileItemDetails {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  createdDateTime: string;
  createdBy?: {
    user?: {
      displayName: string;
      email: string;
    };
  };
  lastModifiedBy?: {
    user?: {
      displayName: string;
      email: string;
    };
  };
  webUrl?: string;
  isMissing?: boolean; // Flag to indicate file is missing from SharePoint
}

export interface AdminSharePointMetadataProps {
  files: WorkspaceFileDto[];
  workspaceId: string;
}