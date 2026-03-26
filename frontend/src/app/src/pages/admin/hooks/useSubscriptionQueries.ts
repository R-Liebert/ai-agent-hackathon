import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  notificationSubscriptionsService 
} from "../../../services/admin";
import { NotificationSubscription } from "../../../models/subscription-models";
import {
  RetryState,
  RetryStatistics,
  JobResponse,
  ProcessRetriesRequest,
  CleanupJobRequest,
} from "../../../models/subscription-models";
import { notificationsService } from "../../../services/notificationsService";
import { useCallback } from "react";

export interface SubscriptionStatus {
  exists: boolean;
  isActive: boolean;
  status: 'Active' | 'NotFound' | 'ValidationError' | 'Unknown';
  subscription?: NotificationSubscription;
}

/**
 * Unified subscription query keys namespace - single source of truth for all subscription-related cache keys
 * 
 * Usage:
 * - Individual queries: subscriptionKeys.list(), subscriptionKeys.stats(), etc.
 * - Hierarchical invalidation: subscriptionKeys.all (invalidates ALL subscription queries)
 */
export const subscriptionKeys = {
  all: ['admin', 'subscriptions'] as const,
  list: () => [...subscriptionKeys.all, 'list'] as const,
  pendingRetries: () => [...subscriptionKeys.all, 'pending-retries'] as const,
  dueForRetry: () => [...subscriptionKeys.all, 'due-for-retry'] as const,
  stats: () => [...subscriptionKeys.all, 'stats'] as const,
};

export const useSubscriptionsQuery = () => {
  const query = useQuery<NotificationSubscription[], Error>({
    queryKey: subscriptionKeys.list(),
    queryFn: notificationSubscriptionsService.getNotificationSubscriptions,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const getSubscriptionStatus = useCallback((driveId: string): SubscriptionStatus => {
    const subscriptions = query.data || [];
    
    const subscription = subscriptions.find(sub => sub.driveId === driveId);
    
    if (!subscription) {
      return {
        exists: false,
        isActive: false,
        status: 'Unknown',
      };
    }

    return {
      exists: true,
      isActive: subscription.isActiveInGraph === true,
      status: subscription.graphStatus || 'Unknown',
      subscription,
    };
  }, [query.data]);

  const getSubscribedDriveIds = useCallback((): Set<string> => {
    const subscriptions = query.data || [];
    return new Set(subscriptions.map(sub => sub.driveId).filter(Boolean) as string[]);
  }, [query.data]);

  return {
    ...query,
    subscriptions: query.data || [],
    getSubscriptionStatus,
    getSubscribedDriveIds,
  };
};

export const useSubscriptionStats = () => {
  return useQuery<RetryStatistics, Error>({
    queryKey: subscriptionKeys.stats(),
    queryFn: notificationSubscriptionsService.getRetryStats,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const usePendingRetries = () => {
  return useQuery<RetryState[], Error>({
    queryKey: subscriptionKeys.pendingRetries(),
    queryFn: notificationSubscriptionsService.getPendingRetries,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useDueForRetry = () => {
  return useQuery<RetryState[], Error>({
    queryKey: subscriptionKeys.dueForRetry(),
    queryFn: notificationSubscriptionsService.getDueForRetry,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useSubscriptionMutations = () => {
  const queryClient = useQueryClient();

  const deleteSubscriptionMutation = useMutation({
    mutationFn: ({ id, resource }: { id: string; resource?: string }) =>
      notificationSubscriptionsService.deleteSubscriptionWithResource(id, resource),
    onSuccess: (_, variables) => {
      notificationsService.success("Subscription deleted successfully");
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => {
      notificationsService.error(
        `Failed to delete subscription: ${error.message}`
      );
    },
  });

  const renewSubscriptionMutation = useMutation({
    mutationFn: ({ id, resource }: { id?: string; resource?: string }) =>
      notificationSubscriptionsService.renewNotificationSubscription(id, resource),
    onSuccess: (_, variables) => {
      const message = variables.id
        ? `Subscription ${variables.id.substring(0, 8)}... renewed successfully`
        : "All active subscriptions renewed successfully";
      notificationsService.success(message);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error, variables) => {
      const message = variables.id
        ? `Failed to renew subscription ${variables.id.substring(0, 8)}...`
        : "Failed to renew all subscriptions";
      notificationsService.error(`${message}: ${error.message}`);
    },
  });

  const clearRetryStateMutation = useMutation({
    mutationFn: ({ id, resource }: { id: string; resource: string }) =>
      notificationSubscriptionsService.clearRetryState(id, resource),
    onSuccess: (_, variables) => {
      notificationsService.success(`Retry state cleared for subscription ${variables.id}`);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => {
      notificationsService.error(`Failed to clear retry state: ${error.message}`);
    },
  });

  return {
    deleteSubscription: deleteSubscriptionMutation.mutate,
    renewSubscription: renewSubscriptionMutation.mutate,
    clearRetryState: clearRetryStateMutation.mutate,
    isDeletingSubscription: deleteSubscriptionMutation.isPending,
    isRenewingSubscription: renewSubscriptionMutation.isPending,
    isClearingRetryState: clearRetryStateMutation.isPending,
  };
};

export const useJobMutations = () => {
  const queryClient = useQueryClient();

  const processRetriesMutation = useMutation({
    mutationFn: (request?: ProcessRetriesRequest) =>
      notificationSubscriptionsService.processRetries(request),
    onSuccess: (data) => {
      notificationsService.success(`Retry processing job queued: ${data.jobId}`);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => {
      notificationsService.error(`Failed to trigger retry processing: ${error.message}`);
    },
  });

  const triggerCleanupMutation = useMutation({
    mutationFn: (request?: CleanupJobRequest) =>
      notificationSubscriptionsService.triggerCleanup(request),
    onSuccess: (data) => {
      notificationsService.success(`Cleanup job queued: ${data.jobId}`);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => {
      notificationsService.error(`Failed to trigger cleanup: ${error.message}`);
    },
  });

  return {
    processRetries: processRetriesMutation.mutate,
    triggerCleanup: triggerCleanupMutation.mutate,
    isProcessingRetries: processRetriesMutation.isPending,
    isTriggeringCleanup: triggerCleanupMutation.isPending,
    processRetriesData: processRetriesMutation.data,
    cleanupData: triggerCleanupMutation.data,
  };
};

export const useSubscriptionsWithRetries = () => {
  const subscriptionsQuery = useSubscriptionsQuery();
  const statsQuery = useSubscriptionStats();
  const pendingRetriesQuery = usePendingRetries();
  const dueForRetryQuery = useDueForRetry();
  
  const mutations = useSubscriptionMutations();
  const jobMutations = useJobMutations();
  
  const refetchSubscriptionsOnly = useCallback(() => {
    subscriptionsQuery.refetch();
  }, [subscriptionsQuery]);

  const refetchRetryManagementOnly = useCallback(() => {
    pendingRetriesQuery.refetch();
    dueForRetryQuery.refetch();
  }, [pendingRetriesQuery, dueForRetryQuery]);

  const refetchStatisticsOnly = useCallback(() => {
    statsQuery.refetch();
  }, [statsQuery]);

  return {
    subscriptions: subscriptionsQuery.data || [],
    subscriptionsLoading: subscriptionsQuery.isLoading,
    subscriptionsError: subscriptionsQuery.error,
    
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    statsError: statsQuery.error,
    
    pendingRetries: pendingRetriesQuery.data || [],
    pendingRetriesLoading: pendingRetriesQuery.isLoading,
    
    dueForRetry: dueForRetryQuery.data || [],
    dueForRetryLoading: dueForRetryQuery.isLoading,
    
    refetchSubscriptionsOnly,
    refetchRetryManagementOnly,
    refetchStatisticsOnly,
    ...mutations,
    ...jobMutations,
  };
};