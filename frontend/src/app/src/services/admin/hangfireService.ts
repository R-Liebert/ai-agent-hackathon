import axiosInstance from "../axiosInstance";
import {
  HangfireStatistics,
  HangfireOverview,
  HangfireJobDetail,
  HangfireRecurringJob,
  HangfireServer,
  HangfireQueue,
  GetJobsResponse,
  GetJobsParams,
  JobState,
  SuccessResponse,
  BulkOperationResponse,
  RecurringJobTriggerResponse,
} from "./types/hangfire.types";

const BASE = "/admin/hangfire";

/**
 * Build URLSearchParams from object, skipping undefined/null values.
 */
const buildSearchParams = (params: Record<string, unknown>): URLSearchParams => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams;
};

export const hangfireService = {
  /**
   * Get job statistics
   * GET /api/admin/hangfire/statistics
   */
  async getStatistics(): Promise<HangfireStatistics> {
    const response = await axiosInstance.get<HangfireStatistics>(
      `${BASE}/statistics`
    );
    return response.data;
  },

  /**
   * Get full overview (statistics, servers, queues, recurring jobs)
   * GET /api/admin/hangfire/overview
   */
  async getOverview(): Promise<HangfireOverview> {
    const response = await axiosInstance.get<HangfireOverview>(
      `${BASE}/overview`
    );
    return response.data;
  },

  /**
   * Get jobs by state with pagination and optional filters
   * GET /api/admin/hangfire/jobs/{state}
   */
  async getJobsByState(
    state: JobState,
    params: GetJobsParams = {}
  ): Promise<GetJobsResponse> {
    const searchParams = buildSearchParams(params as Record<string, unknown>);
    const response = await axiosInstance.get<GetJobsResponse>(
      `${BASE}/jobs/${state.toLowerCase()}?${searchParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get detailed information for a specific job
   * GET /api/admin/hangfire/jobs/{jobId}
   */
  async getJobDetails(jobId: string): Promise<HangfireJobDetail> {
    const response = await axiosInstance.get<HangfireJobDetail>(
      `${BASE}/jobs/${jobId}`
    );
    return response.data;
  },

  /**
   * Requeue a job (move back to enqueued state)
   * POST /api/admin/hangfire/jobs/{jobId}/requeue
   */
  async requeueJob(jobId: string): Promise<SuccessResponse> {
    const response = await axiosInstance.post<SuccessResponse>(
      `${BASE}/jobs/${jobId}/requeue`
    );
    return response.data;
  },

  /**
   * Delete a job
   * DELETE /api/admin/hangfire/jobs/{jobId}
   */
  async deleteJob(jobId: string): Promise<SuccessResponse> {
    const response = await axiosInstance.delete<SuccessResponse>(
      `${BASE}/jobs/${jobId}`
    );
    return response.data;
  },

  /**
   * Cancel a processing job
   * POST /api/admin/hangfire/jobs/{jobId}/cancel
   */
  async cancelJob(jobId: string): Promise<SuccessResponse> {
    const response = await axiosInstance.post<SuccessResponse>(
      `${BASE}/jobs/${jobId}/cancel`
    );
    return response.data;
  },

  /**
   * Get all recurring jobs
   * GET /api/admin/hangfire/recurring
   */
  async getRecurringJobs(): Promise<HangfireRecurringJob[]> {
    const response = await axiosInstance.get<HangfireRecurringJob[]>(
      `${BASE}/recurring`
    );
    return response.data;
  },

  /**
   * Trigger a recurring job immediately
   * POST /api/admin/hangfire/recurring/{jobId}/trigger
   */
  async triggerRecurringJob(
    jobId: string
  ): Promise<RecurringJobTriggerResponse> {
    const response = await axiosInstance.post<RecurringJobTriggerResponse>(
      `${BASE}/recurring/${encodeURIComponent(jobId)}/trigger`
    );
    return response.data;
  },

  /**
   * Pause a recurring job
   * POST /api/admin/hangfire/recurring/{jobId}/pause
   */
  async pauseRecurringJob(jobId: string): Promise<SuccessResponse> {
    const response = await axiosInstance.post<SuccessResponse>(
      `${BASE}/recurring/${encodeURIComponent(jobId)}/pause`
    );
    return response.data;
  },

  /**
   * Resume a paused recurring job
   * POST /api/admin/hangfire/recurring/{jobId}/resume
   */
  async resumeRecurringJob(
    jobId: string,
    cronExpression: string
  ): Promise<SuccessResponse> {
    const response = await axiosInstance.post<SuccessResponse>(
      `${BASE}/recurring/${encodeURIComponent(jobId)}/resume?cronExpression=${encodeURIComponent(cronExpression)}`
    );
    return response.data;
  },

  /**
   * Get all servers
   * GET /api/admin/hangfire/servers
   */
  async getServers(): Promise<HangfireServer[]> {
    const response = await axiosInstance.get<HangfireServer[]>(
      `${BASE}/servers`
    );
    return response.data;
  },

  /**
   * Get all queues
   * GET /api/admin/hangfire/queues
   */
  async getQueues(): Promise<HangfireQueue[]> {
    const response = await axiosInstance.get<HangfireQueue[]>(`${BASE}/queues`);
    return response.data;
  },

  /**
   * Requeue all failed jobs
   * POST /api/admin/hangfire/jobs/failed/requeue-all
   */
  async requeueAllFailed(): Promise<BulkOperationResponse> {
    const response = await axiosInstance.post<BulkOperationResponse>(
      `${BASE}/jobs/failed/requeue-all`
    );
    return response.data;
  },

  /**
   * Delete all failed jobs
   * DELETE /api/admin/hangfire/jobs/failed
   */
  async deleteAllFailed(): Promise<BulkOperationResponse> {
    const response = await axiosInstance.delete<BulkOperationResponse>(
      `${BASE}/jobs/failed`
    );
    return response.data;
  },

  /**
   * Delete all succeeded jobs
   * DELETE /api/admin/hangfire/jobs/succeeded
   */
  async deleteAllSucceeded(): Promise<BulkOperationResponse> {
    const response = await axiosInstance.delete<BulkOperationResponse>(
      `${BASE}/jobs/succeeded`
    );
    return response.data;
  },
};
