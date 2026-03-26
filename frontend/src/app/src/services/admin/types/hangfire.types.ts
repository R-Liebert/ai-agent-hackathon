/**
 * Hangfire API Types
 * TypeScript interfaces for the Hangfire Management REST API
 */

// Job state union type
export type JobState =
  | "Enqueued"
  | "Scheduled"
  | "Processing"
  | "Succeeded"
  | "Failed"
  | "Deleted"
  | "Awaiting";

// Sorting types for job queries
export type JobSortField = "createdAt" | "stateAt";
export type SortDirection = "asc" | "desc";

// Statistics & Overview
export interface HangfireStatistics {
  servers: number;
  queues: number;
  enqueued: number;
  scheduled: number;
  processing: number;
  succeeded: number;
  failed: number;
  deleted: number;
  recurring: number;
}

export interface HangfireOverview {
  statistics: HangfireStatistics;
  servers: HangfireServer[];
  queues: HangfireQueue[];
  recurringJobs: HangfireRecurringJob[];
}

// Jobs
export interface HangfireJob {
  jobId: string;
  jobName: string;
  state: JobState;
  queue: string | null;
  createdAt: string | null;
  enqueuedAt: string | null;
  startedAt: string | null;
  succeededAt: string | null;
  failedAt: string | null;
  deletedAt: string | null;
  scheduledAt: string | null;
  exceptionMessage: string | null;
  exceptionType: string | null;
  retryCount: number;
  serverName: string | null;
}

export interface HangfireJobHistory {
  stateName: string;
  createdAt: string | null;
  reason: string | null;
  data: Record<string, string>;
}

export interface HangfireJobDetail extends HangfireJob {
  methodType: string | null;
  methodName: string | null;
  arguments: string[];
  properties: Record<string, string>;
  history: HangfireJobHistory[];
}

export interface GetJobsResponse {
  jobs: HangfireJob[];
  totalCount: number;
  from: number;
  count: number;
}

export interface GetJobsParams {
  from?: number;
  count?: number;
  jobName?: string;
  jobType?: string;
  fromDate?: string; // ISO 8601 format
  toDate?: string; // ISO 8601 format
  sortBy?: JobSortField;
  sortDirection?: SortDirection;
}

// Recurring Jobs
export interface HangfireRecurringJob {
  id: string;
  cron: string;
  queue: string;
  jobType: string | null;
  methodName: string | null;
  nextExecution: string | null;
  lastExecution: string | null;
  lastJobId: string | null;
  lastJobState: string | null;
  error: string | null;
  timeZoneId: string | null;
  createdAt: string | null;
}

// Servers & Queues
export interface HangfireServer {
  name: string;
  workersCount: number;
  queues: string[];
  startedAt: string | null;
  heartbeat: string | null;
}

export interface HangfireQueue {
  name: string;
  length: number;
  fetched: number | null;
}

// Request Types
export interface EnqueueJobRequest {
  jobType: string;
  methodName?: string;
  argumentsJson?: string;
  queue?: string;
  delay?: string; // TimeSpan format: "HH:mm:ss" or "d.HH:mm:ss"
}

// API Response Types
export interface SuccessResponse {
  jobId?: string;
  message: string;
}

export interface BulkOperationResponse {
  requeuedCount?: number;
  deletedCount?: number;
  purgedCount?: number;
  message: string;
}

export interface QueueOperationResponse {
  queueName: string;
  message: string;
}

export interface RecurringJobTriggerResponse {
  recurringJobId: string;
  triggeredJobId: string;
  message: string;
}

// State color mapping for UI
export const JOB_STATE_COLORS: Record<
  JobState | string,
  { bg: string; fg: string; border: string }
> = {
  Enqueued: { bg: "rgba(59, 130, 246, 0.15)", fg: "#3b82f6", border: "#3b82f6" },
  Processing: {
    bg: "rgba(245, 158, 11, 0.15)",
    fg: "#f59e0b",
    border: "#f59e0b",
  },
  Scheduled: {
    bg: "rgba(139, 92, 246, 0.15)",
    fg: "#8b5cf6",
    border: "#8b5cf6",
  },
  Succeeded: {
    bg: "rgba(16, 185, 129, 0.15)",
    fg: "#10b981",
    border: "#10b981",
  },
  Failed: { bg: "rgba(239, 68, 68, 0.15)", fg: "#ef4444", border: "#ef4444" },
  Deleted: { bg: "rgba(107, 114, 128, 0.15)", fg: "#6b7280", border: "#6b7280" },
  Awaiting: { bg: "rgba(6, 182, 212, 0.15)", fg: "#06b6d4", border: "#06b6d4" },
  default: { bg: "#1f1f1f", fg: "#a3a3a3", border: "#a3a3a3" },
};

// Helper to get state color
export const getJobStateColor = (state: string): string => {
  const colors: Record<string, string> = {
    Enqueued: "#3b82f6",
    Processing: "#f59e0b",
    Scheduled: "#8b5cf6",
    Succeeded: "#10b981",
    Failed: "#ef4444",
    Deleted: "#6b7280",
    Awaiting: "#06b6d4",
  };
  return colors[state] || "#6b7280";
};
