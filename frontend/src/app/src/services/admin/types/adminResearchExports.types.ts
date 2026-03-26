export type ResearchExportStatusValue =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "expired";

export interface CreateResearchExportRequest {
  fromUtc: string;
  toUtc: string;
  includeRawBundle?: boolean;
  includeInsightsWorkbook?: boolean;
  includeSessionEvents?: boolean;
  includeDerivedSessions?: boolean;
  includeChatSummary?: boolean;
}

export interface ResearchExportQueuedResponse {
  exportId: string;
  jobId: string;
  queuedAtUtc: string;
  statusUrl: string;
  downloadUrl: string;
  rawDownloadUrl: string;
  insightsDownloadUrl: string;
}

export interface ResearchExportStatus {
  exportId: string;
  jobId: string;
  status: ResearchExportStatusValue;
  requestedAtUtc: string;
  startedAtUtc?: string | null;
  completedAtUtc?: string | null;
  fromUtc: string;
  toUtc: string;
  includeRawBundle: boolean;
  includeInsightsWorkbook: boolean;
  includeSessionEvents: boolean;
  includeDerivedSessions: boolean;
  includeChatSummary: boolean;
  downloadReady: boolean;
  downloadUrl: string;
  bundleFileName: string;
  rawBundleReady: boolean;
  insightsWorkbookReady: boolean;
  rawDownloadUrl: string;
  insightsDownloadUrl: string;
  rawBundleFileName: string;
  insightsWorkbookFileName: string;
  sessionEventsRowCount: number;
  derivedSessionsRowCount: number;
  chatSummaryRowCount: number;
  errorMessage?: string | null;
  insightsErrorMessage?: string | null;
}

export interface DownloadResearchExportResult {
  blob: Blob;
  filename: string;
}
