import axiosInstance from "../axiosInstance";
import { AxiosError } from "axios";
import {
  RetryState,
  RetryStatistics,
  JobResponse,
  CleanupJobRequest,
  ProcessRetriesRequest,
  NotificationSubscription,
} from "../../models/subscription-models";

/**
 * API endpoints for notification subscriptions
 */
const API_ENDPOINTS = {
  BASE: "/admin/subscriptions",
  BY_ID: (id: string) => `/admin/subscriptions/${id}`,
  RENEW: "/admin/subscriptions/renew",
  PENDING_RETRIES: "/admin/subscriptions/pending-retries",
  DUE_FOR_RETRY: "/admin/subscriptions/due-for-retry",
  RETRY_STATS: "/admin/subscriptions/retry-stats",
  PROCESS_RETRIES: "/admin/subscriptions/process-retries",
  CLEANUP: "/admin/subscriptions/cleanup",
  CLEAR_RETRY: (id: string) => `/admin/subscriptions/${id}/clear-retry`,
};

// NotificationSubscription interface is now imported from models/subscription-models.ts


/**
 * Custom error class for notification subscription service errors
 */
export class NotificationSubscriptionError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "NotificationSubscriptionError";
    this.status = status;
  }
}

/**
 * Handles API errors and converts them to a consistent format
 * @param error The error from the API call
 * @param customMessage A custom message to include in the error
 * @returns A standardized error object
 */
const handleApiError = (error: unknown, customMessage: string): never => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = `${customMessage}: ${error.message}`;
    console.error(message, error);
    throw new NotificationSubscriptionError(message, status);
  } else {
    const message = `${customMessage}: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    throw new NotificationSubscriptionError(message);
  }
};

/**
 * Fetches all notification subscriptions from the API
 * @returns Promise with notification subscriptions data
 */
const getNotificationSubscriptions = async (): Promise<
  NotificationSubscription[]
> => {
  try {
    const response = await axiosInstance.get<NotificationSubscription[]>(
      API_ENDPOINTS.BASE
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, "Error fetching notification subscriptions");
  }
};

/**
 * Fetches a specific notification subscription by ID
 * @param id The ID of the notification subscription
 * @returns Promise with notification subscription data
 */
const getNotificationSubscriptionById = async (
  id: string
): Promise<NotificationSubscription> => {
  try {
    const response = await axiosInstance.get<NotificationSubscription>(
      API_ENDPOINTS.BY_ID(id)
    );
    return response.data;
  } catch (error) {
    return handleApiError(
      error,
      `Error fetching notification subscription with ID ${id}`
    );
  }
};



/**
 * Deletes a notification subscription
 * @param id The ID of the notification subscription to delete
 * @returns Promise with the operation result
 */
const deleteNotificationSubscription = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(API_ENDPOINTS.BY_ID(id));
  } catch (error) {
    return handleApiError(
      error,
      `Error deleting notification subscription with ID ${id}`
    );
  }
};

/**
 * Renews a specific notification subscription or all subscriptions
 * @param id Optional ID of the notification subscription to renew. If omitted, renews all.
 * @param resource Optional resource to include in the renewal request
 * @returns Promise resolving when the renewal is complete
 */
const renewNotificationSubscription = async (
  id?: string,
  resource?: string
): Promise<void> => {
  let url = API_ENDPOINTS.RENEW;
  const params = [];

  if (id) {
    params.push(`subscriptionId=${id}`);
  }

  if (resource) {
    params.push(`resource=${encodeURIComponent(resource)}`);
  }

  // Add query parameters if any exist
  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }

  try {
    await axiosInstance.post(url);
  } catch (error) {
    const message = id
      ? `Error renewing notification subscription with ID ${id}`
      : "Error renewing all notification subscriptions";
    return handleApiError(error, message);
  }
};

/**
 * Fetches pending retries for subscriptions
 * @returns Promise with pending retry states
 */
const getPendingRetries = async (): Promise<RetryState[]> => {
  try {
    const response = await axiosInstance.get<RetryState[]>(
      API_ENDPOINTS.PENDING_RETRIES
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, "Error fetching pending retries");
  }
};

/**
 * Fetches subscriptions due for retry
 * @returns Promise with subscriptions due for retry
 */
const getDueForRetry = async (): Promise<RetryState[]> => {
  try {
    const response = await axiosInstance.get<RetryState[]>(
      API_ENDPOINTS.DUE_FOR_RETRY
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, "Error fetching subscriptions due for retry");
  }
};

/**
 * Fetches retry statistics
 * @returns Promise with retry statistics
 */
const getRetryStats = async (): Promise<RetryStatistics> => {
  try {
    const response = await axiosInstance.get<RetryStatistics>(
      API_ENDPOINTS.RETRY_STATS
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, "Error fetching retry statistics");
  }
};

/**
 * Triggers processing of pending retries
 * @param request Optional request parameters
 * @returns Promise with job response
 */
const processRetries = async (
  request?: ProcessRetriesRequest
): Promise<JobResponse> => {
  try {
    const response = await axiosInstance.post<JobResponse>(
      API_ENDPOINTS.PROCESS_RETRIES,
      request
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, "Error triggering retry processing");
  }
};

/**
 * Triggers cleanup of old subscriptions
 * @param request Optional cleanup parameters
 * @returns Promise with job response
 */
const triggerCleanup = async (
  request?: CleanupJobRequest
): Promise<JobResponse> => {
  try {
    const response = await axiosInstance.post<JobResponse>(
      API_ENDPOINTS.CLEANUP,
      request
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, "Error triggering cleanup job");
  }
};

/**
 * Clears retry state for a specific subscription
 * @param id The ID of the subscription
 * @param resource The resource parameter (required for complete cleanup)
 * @returns Promise resolving when the retry state is cleared
 */
const clearRetryState = async (id: string, resource: string): Promise<void> => {
  try {
    const url = `${API_ENDPOINTS.CLEAR_RETRY(id)}?resource=${encodeURIComponent(resource)}`;
    await axiosInstance.post(url);
  } catch (error) {
    return handleApiError(
      error,
      `Error clearing retry state for subscription ${id}`
    );
  }
};

/**
 * Deletes a notification subscription with resource parameter
 * @param id The ID of the notification subscription to delete
 * @param resource Optional resource parameter for complete cleanup
 * @returns Promise with the operation result
 */
const deleteSubscriptionWithResource = async (
  id: string,
  resource?: string
): Promise<void> => {
  try {
    let url = API_ENDPOINTS.BY_ID(id);
    if (resource) {
      url += `?resource=${encodeURIComponent(resource)}`;
    }
    await axiosInstance.delete(url);
  } catch (error) {
    return handleApiError(
      error,
      `Error deleting notification subscription with ID ${id}`
    );
  }
};

/**
 * Service for managing notification subscriptions
 */
export const notificationSubscriptionsService = {
  // API methods
  getNotificationSubscriptions,
  getNotificationSubscriptionById,
  deleteNotificationSubscription,
  renewNotificationSubscription,

  // New retry management methods
  getPendingRetries,
  getDueForRetry,
  getRetryStats,
  processRetries,
  triggerCleanup,
  clearRetryState,
  deleteSubscriptionWithResource,

  // Error handling
  NotificationSubscriptionError,
};
