/**
 * Correlation ID Utility for Job Post Creator V2
 *
 * Provides utilities for generating and logging correlation IDs for tracking
 * requests across the frontend and backend.
 *
 * Correlation ID Format: {prefix}:{jobPostId}:{timestamp}
 * Example: chat:abc123:20250129T104523Z
 *
 * @see job-post-creator-v2-frontend-integration.md Section 6: Correlation & Telemetry
 */

/**
 * Generates a correlation ID for tracking requests
 *
 * Format: {prefix}:{jobPostId}:{timestamp}
 * - prefix: Operation type (e.g., "generate", "chat", "modify")
 * - jobPostId: Optional job post ID for context
 * - timestamp: ISO 8601 timestamp without punctuation
 *
 * @param prefix - Operation type prefix (e.g., "chat", "generate", "modify")
 * @param jobPostId - Optional job post ID to include in correlation ID
 * @returns Formatted correlation ID string
 *
 * @example
 * generateCorrelationId('chat', 'abc123')
 * // Returns: "chat:abc123:20250129T104523Z"
 *
 * @example
 * generateCorrelationId('generate')
 * // Returns: "generate:20250129T104523Z"
 */
export const generateCorrelationId = (
  prefix: string,
  jobPostId?: string
): string => {
  // Generate timestamp in ISO 8601 format without punctuation
  // Format: YYYYMMDDTHHmmssZ
  const timestamp = new Date()
    .toISOString()              // "2025-01-29T10:45:23.456Z"
    .replace(/[-:.]/g, '')      // Remove dashes, colons, dots: "20250129T104523456Z"
    .slice(0, -4) + 'Z';        // Remove milliseconds + Z, add Z back: "20250129T104523Z"

  // Build correlation ID parts
  const parts = [prefix];
  if (jobPostId) {
    parts.push(jobPostId);
  }
  parts.push(timestamp);

  return parts.join(':');
};

/**
 * Logs correlation ID to console in development mode only
 *
 * This helps with debugging by showing the correlation ID that can be
 * searched in backend logs. Only logs in non-production environments.
 *
 * @param id - The correlation ID to log
 * @param context - Context description (e.g., "Generation", "Chat", "Modify")
 *
 * @example
 * const correlationId = generateCorrelationId('chat', jobPostId);
 * logCorrelationId(correlationId, 'Chat');
 * // Console (dev only): "[Chat] Correlation ID: chat:abc123:20250129T104523Z"
 */
export const logCorrelationId = (id: string, context: string): void => {
  if (import.meta.env.MODE !== 'production') {
    console.log(`[${context}] Correlation ID: ${id}`);
  }
};

/**
 * Logs x-correlation-id header from response in development mode only
 *
 * The backend returns a request-scoped correlation ID in the x-correlation-id
 * header. This is different from the body-level correlation ID and tracks
 * the HTTP request itself.
 *
 * @param response - Fetch Response object
 * @param context - Context description (e.g., "Generation Request")
 *
 * @example
 * const response = await fetch(url, options);
 * logServerCorrelationId(response, 'Generation Request');
 * // Console (dev only): "[Generation Request] Server correlation ID: req-xyz789"
 */
export const logServerCorrelationId = (
  response: Response,
  context: string
): void => {
  if (import.meta.env.MODE !== 'production') {
    const serverCorrelationId = response.headers.get('x-correlation-id');
    if (serverCorrelationId) {
      console.log(`[${context}] Server correlation ID: ${serverCorrelationId}`);
    }
  }
};

/**
 * Prefix constants for correlation IDs
 * Use these constants to ensure consistency across the codebase
 */
export const CorrelationPrefix = {
  GENERATE: 'generate',
  CHAT: 'chat',
  MODIFY: 'modify',
} as const;

/**
 * Type for correlation ID prefixes
 */
export type CorrelationPrefixType = typeof CorrelationPrefix[keyof typeof CorrelationPrefix];
