// Common SharePoint file interfaces
export interface GraphFileDownloadRequest {
  fileName: string;
  driveId: string;
  itemId: string;
  replace: boolean;
}

// Extended File type with SharePoint metadata
export interface FileWithSharePointMetadata extends File {
  sharePointMetadata?: GraphFileDownloadRequest;
  replace?: boolean;
}
