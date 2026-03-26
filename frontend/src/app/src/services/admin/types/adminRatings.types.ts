/**
 * Admin Ratings Types
 * Based on API contract from frontend-guide-message-ratings.md
 */

import { UserRating } from "../../../models/message-rating.types";

/**
 * Request params for listing ratings
 * GET /api/admin/ratings
 */
export interface GetAllRatingsRequest {
  /** Items per page (1-100), default: 20 */
  pageSize?: number;
  /** Token from previous response for pagination */
  continuationToken?: string;
  /** Filter: ratings created after this date (ISO 8601) */
  createdAfter?: string;
  /** Filter: ratings created before this date (ISO 8601) */
  createdBefore?: string;
  /** Filter by rating: 0=NotRated, 1=ThumbsDown, 2=ThumbsUp */
  ratingType?: UserRating;
  /** Filter by consent status */
  consent?: boolean;
  /** Filter: true=agent only, false=non-agent only */
  generatedByAgent?: boolean;
  /** Filter by agent name (case-insensitive exact match) */
  agentName?: string;
  /** Filter by specific user GUID */
  userId?: string;
  /** Sort field: "CreatedAt" or "UserRating" */
  sortBy?: "CreatedAt" | "UserRating";
  /** Sort order: true=newest first (default) */
  sortDescending?: boolean;
  /** Phase 2: When true, fetches conversation content from ChatMessages (default: false) */
  includeContent?: boolean;
}

/**
 * Response for paginated list of ratings
 * GET /api/admin/ratings
 */
export interface GetAllRatingsResponse {
  /** Array of rating summaries */
  ratings: AdminRatingSummaryDto[];
  /** Token for next page, null if no more */
  continuationToken: string | null;
  /** Total count (only on first page, may be null) */
  totalCount: number | null;
  /** Page size used */
  pageSize: number;
  /** Whether more pages exist */
  hasMore: boolean;
  /** ISO 8601 timestamp */
  responseTime: string;
}

/**
 * Summary DTO for list view
 * Returned by GET /api/admin/ratings
 */
export interface AdminRatingSummaryDto {
  /** GUID - rating ID (same as chatMessageId) */
  id: string;
  /** ISO 8601 timestamp */
  createdDate: string | null;
  /** GUID - user who submitted rating */
  userId: string;
  /** GUID - chat containing the rated message */
  chatId: string | null;
  /** GUID - rated message ID */
  chatMessageId: string;
  /** Rating value: 0=NotRated, 1=ThumbsDown, 2=ThumbsUp */
  userRating: UserRating;
  /** Display text: "NotRated", "ThumbsUp", or "ThumbsDown" */
  userRatingText: string;
  /** Whether user consented */
  consent: boolean;
  /** Whether message was from agent */
  generatedByAgent: boolean;
  /** GUID of agent (if applicable) */
  agentId: string | null;
  /** Agent name (if applicable) */
  agentName: string | null;
  /** URL where rating was submitted */
  currentPageUrl: string;
  /** Whether conversation content can be retrieved */
  contentAvailable: boolean;
  /** First 100 chars of question (ONLY if consent=true AND contentAvailable=true) */
  userQuestionPreview: string | null;
}

/**
 * Detailed DTO for single rating view
 * Returned by GET /api/admin/ratings/{id}
 */
export interface AdminRatingDetailDto {
  /** GUID - rating ID */
  id: string;
  /** ISO 8601 timestamp */
  createdDate: string | null;
  /** GUID - user who submitted rating */
  userId: string;
  /** GUID - chat containing the rated message */
  chatId: string | null;
  /** GUID - rated message ID */
  chatMessageId: string;
  /** GUID - the user's question message ID */
  parentMessageId: string | null;
  /** Rating value: 0=NotRated, 1=ThumbsDown, 2=ThumbsUp */
  userRating: UserRating;
  /** Display text: "NotRated", "ThumbsUp", or "ThumbsDown" */
  userRatingText: string;
  /** Whether user consented */
  consent: boolean;
  /** Whether message was from agent */
  generatedByAgent: boolean;
  /** GUID of agent (if applicable) */
  agentId: string | null;
  /** Agent name (if applicable) */
  agentName: string | null;
  /** URL where rating was submitted */
  currentPageUrl: string;

  /** Whether conversation content can be retrieved */
  contentAvailable: boolean;
  /** Why content is unavailable (if applicable) */
  contentUnavailableReason: string | null;

  /** User's question - ONLY if consent=true AND contentAvailable=true, null otherwise */
  userQuestion: string | null;
  /** Assistant's answer - ONLY if consent=true AND contentAvailable=true, null otherwise */
  assistantAnswer: string | null;
  /** Active assistant message version ID (if available) */
  activeAssistantMessageVersionId?: string | null;
  /** All assistant message versions (oldest -> newest) */
  assistantMessageVersions?: AssistantMessageVersionDto[] | null;
  /** User's feedback text - ALWAYS visible (not conversation content) */
  userMessage: string | null;
  /** True if content was hidden due to no consent (kept for backward compatibility) */
  contentRedactedDueToNoConsent: boolean;
  /** SQL queries executed by the assistant - ONLY if consent=true AND contentAvailable=true AND queries exist */
  sqlQueries?: string[] | null;
}

/**
 * Assistant message version DTO
 */
export interface AssistantMessageVersionDto {
  /** GUID - version ID */
  id: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** Assistant response content */
  content: string;
  /** GUID - user who created the edit (null for system) */
  createdByUserId: string | null;
  /** Whether this version is active */
  isActive: boolean;
}

/**
 * Filter state for UI components
 */
export interface RatingsFilterState {
  createdAfter?: string;
  createdBefore?: string;
  ratingType?: UserRating;
  consent?: boolean;
  generatedByAgent?: boolean;
  agentName?: string;
  userId?: string;
  sortBy: "CreatedAt" | "UserRating";
  sortDescending: boolean;
}

/**
 * Default filter state
 */
export const DEFAULT_RATINGS_FILTER_STATE: RatingsFilterState = {
  sortBy: "CreatedAt",
  sortDescending: true,
};

/**
 * Helper to decode Base64 content
 */
export const decodeBase64Content = (encoded: string | null): string => {
  if (!encoded) return "";
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return encoded;
  }
};
