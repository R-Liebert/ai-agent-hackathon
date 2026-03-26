/**
 * SSE Event Type Definitions for Job Post Creator V2
 *
 * These types define the structure of Server-Sent Events (SSE) emitted by the
 * enhanced backend API (/api/jobpoststream).
 *
 * @see job-post-creator-v2-frontend-integration.md for complete API documentation
 */

// ============================================================================
// Base Interfaces
// ============================================================================

/**
 * Base interface for all SSE events
 * Every event should include a correlationId for request tracking
 */
export interface SSEEventBase {
  correlationId: string;
}

// ============================================================================
// Generation Events
// ============================================================================

/**
 * Generation progress event
 * Emitted during parallel section generation with per-section streaming
 *
 * @example
 * {
 *   "Section": "Header",
 *   "Content": "Join Our Team as a Senior Developer",
 *   "Progress": { "Completed": 1, "Total": 6 },
 *   "correlationId": "generate:abc123:20250129T104523Z"
 * }
 */
export interface GenerationProgressEvent extends SSEEventBase {
  Section: string;
  Content: string | null;  // null indicates section generation failed
  Progress?: {
    Completed: number;
    Total: number;
  };
}

// ============================================================================
// ShortPost Events (Condensed Job Post Generation)
// ============================================================================

/**
 * Progress information included in ShortPost events
 */
export interface ShortPostProgress {
  Phase: 'generation' | 'summarization' | 'streaming' | 'replay' | 'complete';
  Completed: number;
  Total: number;  // 14 for new generation, 6 for replay
}

/**
 * ShortPost start event
 * First event when ShortPost generation begins
 */
export interface ShortPostStartEvent extends SSEEventBase {
  Type: 'shortpost_start';
  Message: string;  // "Generating condensed job post..." or "Loading existing..."
  Progress: ShortPostProgress;
}

/**
 * ShortPost section generated event
 * Emitted when each section completes generation (during parallel generation phase)
 */
export interface ShortPostSectionGeneratedEvent extends SSEEventBase {
  Type: 'shortpost_section_generated';
  Section: 'Header' | 'Appetizer' | 'ShortIntroduction' | 'JobDescription' | 'TeamDescription' | 'Qualifications';
  Progress: ShortPostProgress;
}

/**
 * ShortPost section failed event
 * Emitted when a section fails during generation (doesn't abort the entire flow)
 */
export interface ShortPostSectionFailedEvent extends SSEEventBase {
  Type: 'shortpost_section_failed';
  Section: string;
  Error: string;
  Progress: ShortPostProgress;
}

/**
 * Heartbeat event
 * Emitted every 5 seconds during generation and summarization phases
 * Used as keep-alive signal
 */
export interface HeartbeatEvent extends SSEEventBase {
  Type: 'heartbeat';
  Timestamp: string;  // ISO 8601 timestamp
}

/**
 * ShortPost summarizing event
 * Emitted when summarization phase begins (after all sections generated)
 */
export interface ShortPostSummarizingEvent extends SSEEventBase {
  Type: 'shortpost_summarizing';
  Progress: ShortPostProgress;
}

/**
 * ShortPost summarization complete event
 * Emitted when summarization finishes (may include warning if failed)
 */
export interface ShortPostSummarizationCompleteEvent extends SSEEventBase {
  Type: 'shortpost_summarization_complete';
  WasSummarized: boolean;  // false = fell back to full-length content
  Warning: string | null;  // Explains why summarization failed
  Progress: ShortPostProgress;
}

/**
 * Section complete event (for ShortPost streaming phase)
 * Emitted when each final section is streamed to client (after summarization)
 */
export interface SectionCompleteEvent extends SSEEventBase {
  Type: 'section_complete';
  Section: string;
  Content: string;  // The actual section content
  Progress: ShortPostProgress;
}

/**
 * ShortPost complete event
 * Final event after all content is persisted
 */
export interface ShortPostCompleteEvent extends SSEEventBase {
  Type: 'shortpost_complete';
  WasSummarized: boolean;
  FailedSections: string[];  // Sections that failed to generate (may be empty)
  Warnings: string[] | null;  // Human-readable warnings for user display
  ContentGenerated: boolean;  // false = retry allowed/recommended
  SequenceNumber: number;  // Version for optimistic concurrency
  TotalSections: number;  // Always 6
  Payload: any;  // JobPostResponseDto - full job post data
  Progress: ShortPostProgress;
}

// ============================================================================
// Chat Events
// ============================================================================

/**
 * Chat start event
 * Emitted when chat request is received and intent is classified
 *
 * Intent types:
 * - "information_request" - User asking for information
 * - "modification_text_selection" - User requesting text modification
 * - "modification_section" - User requesting section modification
 * - "general_conversation" - General chat
 */
export interface ChatStartEvent extends SSEEventBase {
  type: 'chat_start';
  intent: string;
  targetSection?: string;
  willModify: boolean;
}

/**
 * Chat chunk event
 * Emitted as AI response streams character-by-character
 *
 * @example
 * {
 *   "type": "chat_chunk",
 *   "content": "Here's how to tighten...",
 *   "index": 0,
 *   "correlationId": "chat:abc123:20250129T104530Z"
 * }
 */
export interface ChatChunkEvent extends SSEEventBase {
  type: 'chat_chunk';
  content: string;
  index: number;
}

/**
 * Chat complete event
 * Emitted when chat response streaming is complete
 */
export interface ChatCompleteEvent extends SSEEventBase {
  type: 'chat_complete';
  fullMessage: string;
}

// ============================================================================
// Modification Events
// ============================================================================

/**
 * Modification queued event
 * Emitted when a modification job is queued for processing
 *
 * Modification types:
 * - "text_selection" - Modifying selected text
 * - "section" - Modifying entire section
 */
export interface ModificationQueuedEvent extends SSEEventBase {
  type: 'modification_queued';
  jobId: string;
  modificationType: string;
}

/**
 * Modification progress event
 * Emitted during modification processing with progress updates
 *
 * @example
 * {
 *   "type": "modification_progress",
 *   "jobId": "mod-123",
 *   "progress": 70,
 *   "message": "Validating changes",
 *   "correlationId": "chat:abc123:20250129T104530Z"
 * }
 */
export interface ModificationProgressEvent extends SSEEventBase {
  type: 'modification_progress';
  jobId: string;
  progress: number;  // 0-100
  message: string;
}

/**
 * Modification complete event
 * Emitted when modification is complete and content is ready
 *
 * IMPORTANT: This event contains the updated content that should be applied to the Canvas
 *
 * @example
 * {
 *   "type": "modification_complete",
 *   "jobId": "mod-123",
 *   "modification": {
 *     "sectionName": "Qualifications",
 *     "textToReplace": "...old text...",
 *     "replacementText": "...new text...",
 *     "completeSectionContent": "...",
 *     "revisionId": "v2-20250129T104500Z",
 *     "appliedToCache": true,
 *     "persistedToDatabase": true
 *   },
 *   "correlationId": "chat:abc123:20250129T104530Z"
 * }
 */
export interface ModificationCompleteEvent extends SSEEventBase {
  type: 'modification_complete';
  jobId: string;
  modification: {
    sectionName: string;
    textToReplace?: string;         // Only present for text selection modifications
    replacementText: string;
    completeSectionContent: string;  // Full section content after modification
    revisionId: string;
    appliedToCache: boolean;
    persistedToDatabase: boolean;
  };
}

// ============================================================================
// Error Event
// ============================================================================

/**
 * Stream error event
 * Emitted when an error occurs during streaming
 *
 * Error types (see ErrorType enum below):
 * - generation_failed: Section generation failed
 * - chat_failed: Chat request failed
 * - modification_failed: Modification failed
 * - modification_timeout: Modification exceeded timeout
 * - circuit_breaker_open: Backend circuit breaker triggered
 * - feature_disabled: Enhanced backend not available
 * - internal_error: Unexpected backend error
 *
 * IMPORTANT: Check `recoverable` flag to determine if user can retry
 * IMPORTANT: Check for `feature_disabled` to inform user the service is unavailable
 */
export interface StreamErrorEvent extends SSEEventBase {
  type: 'error';
  errorType: string;
  message: string;
  recoverable: boolean;  // true = user can retry, false = permanent failure
}

// ============================================================================
// Stream End Marker
// ============================================================================

/**
 * Stream end event
 * Emitted when SSE stream ends successfully
 *
 * @example
 * {
 *   "Content": "stream-ended"
 * }
 */
export interface StreamEndEvent {
  Content: 'stream-ended';
}

// ============================================================================
// Union Type
// ============================================================================

/**
 * Union type of all possible SSE events
 * Use this type for event handlers that can receive any event type
 */
export type SSEEvent =
  | GenerationProgressEvent
  | ChatStartEvent
  | ChatChunkEvent
  | ChatCompleteEvent
  | ModificationQueuedEvent
  | ModificationProgressEvent
  | ModificationCompleteEvent
  | StreamErrorEvent
  | StreamEndEvent
  // ShortPost events
  | ShortPostStartEvent
  | ShortPostSectionGeneratedEvent
  | ShortPostSectionFailedEvent
  | HeartbeatEvent
  | ShortPostSummarizingEvent
  | ShortPostSummarizationCompleteEvent
  | SectionCompleteEvent
  | ShortPostCompleteEvent;

// ============================================================================
// Error Type Enum
// ============================================================================

/**
 * Enumeration of all error types emitted by the backend
 *
 * Usage:
 * ```typescript
 * if (event.type === 'error' && event.errorType === ErrorType.FeatureDisabled) {
 *   // Fallback to current backend
 * }
 * ```
 */
export enum ErrorType {
  GenerationFailed = 'generation_failed',
  ChatFailed = 'chat_failed',
  ModificationFailed = 'modification_failed',
  ModificationTimeout = 'modification_timeout',
  CircuitBreakerOpen = 'circuit_breaker_open',
  FeatureDisabled = 'feature_disabled',
  InternalError = 'internal_error',
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if event is a generation progress event
 */
export function isGenerationProgressEvent(event: SSEEvent): event is GenerationProgressEvent {
  return 'Section' in event && 'Content' in event && !('type' in event);
}

/**
 * Type guard to check if event is a chat start event
 */
export function isChatStartEvent(event: SSEEvent): event is ChatStartEvent {
  return 'type' in event && event.type === 'chat_start';
}

/**
 * Type guard to check if event is a chat chunk event
 */
export function isChatChunkEvent(event: SSEEvent): event is ChatChunkEvent {
  return 'type' in event && event.type === 'chat_chunk';
}

/**
 * Type guard to check if event is a chat complete event
 */
export function isChatCompleteEvent(event: SSEEvent): event is ChatCompleteEvent {
  return 'type' in event && event.type === 'chat_complete';
}

/**
 * Type guard to check if event is a modification queued event
 */
export function isModificationQueuedEvent(event: SSEEvent): event is ModificationQueuedEvent {
  return 'type' in event && event.type === 'modification_queued';
}

/**
 * Type guard to check if event is a modification progress event
 */
export function isModificationProgressEvent(event: SSEEvent): event is ModificationProgressEvent {
  return 'type' in event && event.type === 'modification_progress';
}

/**
 * Type guard to check if event is a modification complete event
 */
export function isModificationCompleteEvent(event: SSEEvent): event is ModificationCompleteEvent {
  return 'type' in event && event.type === 'modification_complete';
}

/**
 * Type guard to check if event is an error event
 */
export function isStreamErrorEvent(event: SSEEvent): event is StreamErrorEvent {
  return 'type' in event && event.type === 'error';
}

/**
 * Type guard to check if event is a stream end event
 */
export function isStreamEndEvent(event: SSEEvent): event is StreamEndEvent {
  return 'Content' in event && event.Content === 'stream-ended';
}

// ============================================================================
// ShortPost Type Guards
// ============================================================================

/**
 * Type guard to check if event is a ShortPost start event
 */
export function isShortPostStartEvent(event: SSEEvent): event is ShortPostStartEvent {
  return 'Type' in event && event.Type === 'shortpost_start';
}

/**
 * Type guard to check if event is a ShortPost section generated event
 */
export function isShortPostSectionGeneratedEvent(event: SSEEvent): event is ShortPostSectionGeneratedEvent {
  return 'Type' in event && event.Type === 'shortpost_section_generated';
}

/**
 * Type guard to check if event is a ShortPost section failed event
 */
export function isShortPostSectionFailedEvent(event: SSEEvent): event is ShortPostSectionFailedEvent {
  return 'Type' in event && event.Type === 'shortpost_section_failed';
}

/**
 * Type guard to check if event is a heartbeat event
 */
export function isHeartbeatEvent(event: SSEEvent): event is HeartbeatEvent {
  return 'Type' in event && event.Type === 'heartbeat';
}

/**
 * Type guard to check if event is a ShortPost summarizing event
 */
export function isShortPostSummarizingEvent(event: SSEEvent): event is ShortPostSummarizingEvent {
  return 'Type' in event && event.Type === 'shortpost_summarizing';
}

/**
 * Type guard to check if event is a ShortPost summarization complete event
 */
export function isShortPostSummarizationCompleteEvent(event: SSEEvent): event is ShortPostSummarizationCompleteEvent {
  return 'Type' in event && event.Type === 'shortpost_summarization_complete';
}

/**
 * Type guard to check if event is a section complete event (ShortPost streaming phase)
 */
export function isSectionCompleteEvent(event: SSEEvent): event is SectionCompleteEvent {
  return 'Type' in event && event.Type === 'section_complete';
}

/**
 * Type guard to check if event is a ShortPost complete event
 */
export function isShortPostCompleteEvent(event: SSEEvent): event is ShortPostCompleteEvent {
  return 'Type' in event && event.Type === 'shortpost_complete';
}

/**
 * Helper to check if an event belongs to the ShortPost flow
 * Use this to determine which generation flow is active
 */
export function isShortPostFlow(event: SSEEvent): boolean {
  if (!('Type' in event)) return false;
  const type = (event as { Type: string }).Type;
  return type.startsWith('shortpost_') || type === 'section_complete' || type === 'heartbeat';
}
