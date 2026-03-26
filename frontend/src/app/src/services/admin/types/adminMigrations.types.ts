export interface ChatMessageVersionsMigrationParams {
  pageSize?: number;
  dryRun?: boolean;
  preflightOnly?: boolean;
  delayBetweenItemsMs?: number;
  delayBetweenPagesMs?: number;
  globalMaxItemsPerSecond?: number;
}

export interface ChatMessageVersionsQueuedResponse {
  jobId: string;
  message: string;
  pageSize: number;
  dryRun: boolean;
  preflightOnly: boolean;
  delayBetweenItemsMs: number;
  delayBetweenPagesMs: number;
  globalMaxItemsPerSecond: number;
}

export interface ChatMessageVersionsRunNowResponse {
  processed: number;
  messagesWithActiveVersion: number;
  messagesMissingActiveVersion: number;
  activeVersionMissingDocument: number;
  plannedCreatedVersions: number;
  plannedPatchedMessages: number;
  createdVersions: number;
  patchedMessages: number;
  dryRun: boolean;
  preflightOnly: boolean;
}
