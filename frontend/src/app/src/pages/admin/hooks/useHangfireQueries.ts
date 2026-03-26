import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { hangfireService } from "../../../services/admin/hangfireService";
import {
  HangfireOverview,
  HangfireJobDetail,
  HangfireRecurringJob,
  HangfireServer,
  HangfireQueue,
  GetJobsResponse,
  GetJobsParams,
  JobState,
  BulkOperationResponse,
  RecurringJobTriggerResponse,
  SuccessResponse,
} from "../../../services/admin/types/hangfire.types";
import { notificationsService } from "../../../services/notificationsService";

/**
 * Query key factory for Hangfire
 */
export const hangfireKeys = {
  all: ["admin", "hangfire"] as const,
  overview: () => [...hangfireKeys.all, "overview"] as const,
  statistics: () => [...hangfireKeys.all, "statistics"] as const,
  jobs: () => [...hangfireKeys.all, "jobs"] as const,
  jobsByState: (state: JobState, params: GetJobsParams) =>
    [...hangfireKeys.jobs(), state, params] as const,
  jobDetail: (jobId: string) => [...hangfireKeys.all, "job", jobId] as const,
  recurring: () => [...hangfireKeys.all, "recurring"] as const,
  servers: () => [...hangfireKeys.all, "servers"] as const,
  queues: () => [...hangfireKeys.all, "queues"] as const,
} as const;

/**
 * Hook to fetch Hangfire overview (statistics, servers, queues, recurring)
 * Auto-refreshes at configurable interval
 */
export const useHangfireOverview = (
  refetchInterval: number | false = 10000
) => {
  return useQuery<HangfireOverview, Error>({
    queryKey: hangfireKeys.overview(),
    queryFn: () => hangfireService.getOverview(),
    staleTime: 5000,
    gcTime: 60000,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch jobs by state with pagination
 */
export const useHangfireJobsByState = (
  state: JobState,
  params: GetJobsParams,
  enabled: boolean = true
) => {
  return useQuery<GetJobsResponse, Error>({
    queryKey: hangfireKeys.jobsByState(state, params),
    queryFn: () => hangfireService.getJobsByState(state, params),
    staleTime: 10000,
    gcTime: 60000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    enabled,
  });
};

/**
 * Hook to fetch details for a specific job
 */
export const useHangfireJobDetail = (
  jobId: string | undefined,
  enabled: boolean = true
) => {
  return useQuery<HangfireJobDetail, Error>({
    queryKey: jobId ? hangfireKeys.jobDetail(jobId) : hangfireKeys.jobs(),
    queryFn: () => hangfireService.getJobDetails(jobId as string),
    enabled: Boolean(jobId) && enabled,
    staleTime: 3000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch all recurring jobs
 */
export const useRecurringJobs = (refetchInterval: number | false = 30000) => {
  return useQuery<HangfireRecurringJob[], Error>({
    queryKey: hangfireKeys.recurring(),
    queryFn: () => hangfireService.getRecurringJobs(),
    staleTime: 15000,
    gcTime: 60000,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch servers
 */
export const useHangfireServers = (refetchInterval: number | false = 15000) => {
  return useQuery<HangfireServer[], Error>({
    queryKey: hangfireKeys.servers(),
    queryFn: () => hangfireService.getServers(),
    staleTime: 10000,
    gcTime: 60000,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch queues
 */
export const useHangfireQueues = (refetchInterval: number | false = 15000) => {
  return useQuery<HangfireQueue[], Error>({
    queryKey: hangfireKeys.queues(),
    queryFn: () => hangfireService.getQueues(),
    staleTime: 10000,
    gcTime: 60000,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to requeue a single job
 */
export const useRequeueJob = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, string>({
    mutationFn: (jobId: string) => hangfireService.requeueJob(jobId),
    onSuccess: () => {
      notificationsService.success("Job requeued successfully");
      queryClient.invalidateQueries({ queryKey: hangfireKeys.all });
    },
    onError: (error: Error) => {
      notificationsService.error(`Failed to requeue job: ${error.message}`);
    },
  });
};

/**
 * Hook to delete a single job
 */
export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, string>({
    mutationFn: (jobId: string) => hangfireService.deleteJob(jobId),
    onSuccess: () => {
      notificationsService.success("Job deleted successfully");
      queryClient.invalidateQueries({ queryKey: hangfireKeys.all });
    },
    onError: (error: Error) => {
      notificationsService.error(`Failed to delete job: ${error.message}`);
    },
  });
};

/**
 * Hook to cancel a processing job
 */
export const useCancelJob = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, string>({
    mutationFn: (jobId: string) => hangfireService.cancelJob(jobId),
    onSuccess: () => {
      notificationsService.success("Job cancelled successfully");
      queryClient.invalidateQueries({ queryKey: hangfireKeys.all });
    },
    onError: (error: Error) => {
      notificationsService.error(`Failed to cancel job: ${error.message}`);
    },
  });
};

/**
 * Hook to trigger a recurring job
 */
export const useTriggerRecurringJob = () => {
  const queryClient = useQueryClient();

  return useMutation<RecurringJobTriggerResponse, Error, string>({
    mutationFn: (jobId: string) => hangfireService.triggerRecurringJob(jobId),
    onSuccess: (response) => {
      notificationsService.success(
        `Recurring job triggered. New job ID: ${response.triggeredJobId}`
      );
      queryClient.invalidateQueries({ queryKey: hangfireKeys.all });
    },
    onError: (error: Error) => {
      notificationsService.error(
        `Failed to trigger recurring job: ${error.message}`
      );
    },
  });
};

/**
 * Hook to pause a recurring job
 */
export const usePauseRecurringJob = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, string>({
    mutationFn: (jobId: string) => hangfireService.pauseRecurringJob(jobId),
    onSuccess: () => {
      notificationsService.success("Recurring job paused");
      queryClient.invalidateQueries({ queryKey: hangfireKeys.recurring() });
    },
    onError: (error: Error) => {
      notificationsService.error(
        `Failed to pause recurring job: ${error.message}`
      );
    },
  });
};

/**
 * Hook to resume a paused recurring job
 */
export const useResumeRecurringJob = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse,
    Error,
    { jobId: string; cronExpression: string }
  >({
    mutationFn: ({ jobId, cronExpression }) =>
      hangfireService.resumeRecurringJob(jobId, cronExpression),
    onSuccess: () => {
      notificationsService.success("Recurring job resumed");
      queryClient.invalidateQueries({ queryKey: hangfireKeys.recurring() });
    },
    onError: (error: Error) => {
      notificationsService.error(
        `Failed to resume recurring job: ${error.message}`
      );
    },
  });
};

/**
 * Hook for bulk operations (requeue all failed, delete all failed/succeeded)
 */
export const useBulkOperations = () => {
  const queryClient = useQueryClient();

  const requeueAllFailedMutation = useMutation<BulkOperationResponse, Error>({
    mutationFn: () => hangfireService.requeueAllFailed(),
    onSuccess: (result) => {
      if (result.requeuedCount === 0) {
        notificationsService.info("No failed jobs to requeue");
      } else {
        notificationsService.success(
          `Requeued ${result.requeuedCount} failed jobs`
        );
      }
      queryClient.invalidateQueries({ queryKey: hangfireKeys.all });
    },
    onError: (error: Error) => {
      notificationsService.error(
        `Failed to requeue jobs: ${error.message}`
      );
    },
  });

  const deleteAllFailedMutation = useMutation<BulkOperationResponse, Error>({
    mutationFn: () => hangfireService.deleteAllFailed(),
    onSuccess: (result) => {
      if (result.deletedCount === 0) {
        notificationsService.info("No failed jobs to delete");
      } else {
        notificationsService.success(
          `Deleted ${result.deletedCount} failed jobs`
        );
      }
      queryClient.invalidateQueries({ queryKey: hangfireKeys.all });
    },
    onError: (error: Error) => {
      notificationsService.error(
        `Failed to delete jobs: ${error.message}`
      );
    },
  });

  const deleteAllSucceededMutation = useMutation<BulkOperationResponse, Error>({
    mutationFn: () => hangfireService.deleteAllSucceeded(),
    onSuccess: (result) => {
      if (result.deletedCount === 0) {
        notificationsService.info("No succeeded jobs to clear");
      } else {
        notificationsService.success(
          `Cleared ${result.deletedCount} succeeded jobs`
        );
      }
      queryClient.invalidateQueries({ queryKey: hangfireKeys.all });
    },
    onError: (error: Error) => {
      notificationsService.error(
        `Failed to clear succeeded jobs: ${error.message}`
      );
    },
  });

  return {
    requeueAllFailed: requeueAllFailedMutation.mutate,
    deleteAllFailed: deleteAllFailedMutation.mutate,
    deleteAllSucceeded: deleteAllSucceededMutation.mutate,
    isRequeueingAllFailed: requeueAllFailedMutation.isPending,
    isDeletingAllFailed: deleteAllFailedMutation.isPending,
    isDeletingAllSucceeded: deleteAllSucceededMutation.isPending,
  };
};

/**
 * Composite hook that combines common Hangfire operations
 */
export const useHangfire = () => {
  const queryClient = useQueryClient();
  const overviewQuery = useHangfireOverview();
  const bulkOperations = useBulkOperations();
  const requeueJobMutation = useRequeueJob();
  const deleteJobMutation = useDeleteJob();
  const cancelJobMutation = useCancelJob();
  const triggerRecurringJobMutation = useTriggerRecurringJob();
  const pauseRecurringJobMutation = usePauseRecurringJob();
  const resumeRecurringJobMutation = useResumeRecurringJob();

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: hangfireKeys.all });
  };

  return {
    // Overview data
    overview: overviewQuery.data,
    statistics: overviewQuery.data?.statistics,
    servers: overviewQuery.data?.servers ?? [],
    queues: overviewQuery.data?.queues ?? [],
    recurringJobs: overviewQuery.data?.recurringJobs ?? [],
    isLoading: overviewQuery.isLoading,
    isError: overviewQuery.isError,
    error: overviewQuery.error,

    // Single job mutations
    requeueJob: requeueJobMutation.mutate,
    deleteJob: deleteJobMutation.mutate,
    cancelJob: cancelJobMutation.mutate,
    isRequeueingJob: requeueJobMutation.isPending,
    isDeletingJob: deleteJobMutation.isPending,
    isCancellingJob: cancelJobMutation.isPending,

    // Recurring job mutations
    triggerRecurringJob: triggerRecurringJobMutation.mutate,
    pauseRecurringJob: pauseRecurringJobMutation.mutate,
    resumeRecurringJob: resumeRecurringJobMutation.mutate,
    isTriggeringRecurringJob: triggerRecurringJobMutation.isPending,
    isPausingRecurringJob: pauseRecurringJobMutation.isPending,
    isResumingRecurringJob: resumeRecurringJobMutation.isPending,

    // Bulk operations
    ...bulkOperations,

    // Refetch helpers
    refetchAll,
    refetchOverview: overviewQuery.refetch,
  };
};
