export interface RetryState {
  subscriptionId: string;
  resource: string;
  retryCount: number;
  nextRetryAt: string;
  lastFailureReason: string;
  isOverdue: boolean;
  expirationDateTime: string;
  createdAt?: string;
  changeType?: string;
  notificationUrl?: string;
}

export interface RetryStatistics {
  totalSubscriptionsWithRetryState: number;
  pendingRetries: number;
  overdueRetries: number;
  retriesScheduledNext30Min: number;
  retryCountDistribution: Record<string, number>;
  topFailureReasons: Record<string, number>;
  lastUpdated: string;
}

export interface JobResponse {
  jobId: string;
  message: string;
  status?: "queued" | "processing" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
}

export interface CleanupJobRequest {
  forceCleanup?: boolean;
  maxRetentionDays?: number;
}

export interface ProcessRetriesRequest {
  maxRetries?: number;
  batchSize?: number;
}

export interface SubscriptionHealth {
  healthy: number;
  warning: number;
  critical: number;
  total: number;
}

export interface SubscriptionMetrics {
  statistics: RetryStatistics;
  health: SubscriptionHealth;
  recentJobs: JobResponse[];
}

// New enhanced subscription interface based on updated API format
export interface NotificationSubscription {
  subscriptionId: string;
  resource: string;
  expirationDateTime: string;
  deltaToken?: string | null;
  clientState?: string | null;
  fileIds?: string[] | null;
  
  // Retry state information
  retryCount: number;
  nextRetryAt?: string | null;
  lastFailureReason?: string | null;
  
  // Graph validation results
  isActiveInGraph: boolean | null; // true/false/null
  graphStatus: 'Active' | 'NotFound' | 'ValidationError';
  
  // File tracking metrics
  driveId?: string | null;
  uniqueFileCount: number;
  workspaceCount: number;
  totalMappings: number;
}

// Legacy interface for backward compatibility (DEPRECATED)
export interface LegacySubscription {
  id: string; // Now "subscriptionId"
  resource: string;
  changeType: string; // Removed
  notificationUrl: string; // Removed
  expirationDateTime: string;
}