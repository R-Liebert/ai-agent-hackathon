# Job Post Creator V2 Front-End Refactor Plan

**Version**: 1.3
**Date**: 2025-01-29
**Status**: Planning Phase
**Estimated Duration**: 3-4 weeks (14-20 development days)
**Last Updated**: 2025-01-29 - Final review addressing integration guide gaps

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Phases](#implementation-phases)
5. [File Structure](#file-structure)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Plan](#deployment-plan)
8. [Success Criteria](#success-criteria)

---

## Executive Summary

This refactor upgrades the Job Post Creator front-end to work with the new enhanced `/api/v2/jobpoststream` backend API. The current implementation uses Canvas-based UI and the `/jobpoststream` API. The refactor adds:

- **Chat-driven modifications** - AI assistant can automatically modify content based on chat interactions
- **Transform operations** - Polish, expand, and summarize entire job posts or sections
- **Enhanced streaming** - Improved SSE event handling with richer event types and progress tracking
- **Feature detection** - Graceful fallback to current backend when new backend is unavailable

### Key Principles

- ✅ **Reuse existing UI** - Canvas components already provide the required interface
- ✅ **Backward compatibility** - Fallback to current backend ensures continuity
- ✅ **Clean scope** - All job post creator files can be refactored (old version removed from codebase)
- ✅ **Simple feature flag** - Binary new backend on/off detection
- ✅ **Optimistic approach** - Assume new backend available, gracefully fallback on error

---

## Current State Analysis

### What Already Exists

**UI Components** (Reuse as-is):
- `CanvasChat.tsx` - Chat interface with input and message display
- `Canvas.tsx` - Main canvas with section rendering
- `CanvasContext.tsx` - Centralized state management
- `useCanvas.tsx` - Canvas handlers including `handleSendCanvasMessage`
- Canvas section components with inline text editing
- Progress indicators and loading states
- Undo/redo via existing navigation buttons

**API Integration** (Current Backend):
- `jobPostService.ts` - Current backend endpoints (`/jobpoststream`)
- SSE streaming support via `fetchEventSource`
- Form validation and submission logic
- Canvas-based chat with `prompt()` and `ask()` methods

### What Needs to Be Built

1. **Enhanced Service Layer** - New API methods for `/api/v2/jobpoststream`
2. **SSE Event Types** - TypeScript definitions for enhanced event payloads
3. **Event Parsing** - Handle new SSE event structures (chat, modification, transform)
4. **Feature Detection** - Detect new backend availability and fallback to current backend
5. **Transform UI** - Simple dropdown for polish/expand/summarize operations
6. **Request Cancellation** - Abort previous streams when new requests start

### Current Implementation (Refactor Target)

**Job Post Creator with Canvas**:
- Routes:
  - `/job-post-creator-new` (creation form)
  - `/job-post-creator/:jobPostId` (editor)
- Components:
  - `src/app/src/pages/feature-job-post-creator/job-post-creator.tsx` (creation)
  - `src/app/src/pages/feature-job-post-creator/job-post-editor.tsx` (editing)
  - `src/app/src/pages/feature-job-post-creator/job-post-maintenance.tsx` (maintenance view)
  - Uses Canvas components for UI
- API: Currently uses `/jobpoststream` → **Migrating to `/api/v2/jobpoststream`**
- Service: `src/app/src/services/jobPostService.ts` (current) → `jobPostServiceV2.ts` (enhanced)

**Note**: Old job post creator has been completely removed from the codebase. All files in `feature-job-post-creator/` are now safe to refactor.

---

## Architecture Overview

### Request Flow (Enhanced Backend)

```
User Action
    ↓
Component (job-post-editor.tsx)
    ↓
Hook (useCanvas.tsx)
    ↓
Service (jobPostServiceV2.ts)
    ↓
SSE Stream (/api/v2/jobpoststream)
    ↓
Event Handler (parse SSE events)
    ↓
State Update (CanvasContext)
    ↓
UI Update (Canvas components)
```

### Feature Detection Flow (Optimistic)

```
App Mount
    ↓
Assume Enhanced Backend Available
    ↓
    ├─ First Request → Success → Continue using enhanced endpoints
    │
    └─ First Request → Error (404/feature_disabled) → Fallback to current backend
```

### SSE Event Flow (Chat with Modification)

```
User sends chat message
    ↓
chatV2() initiates SSE stream
    ↓
Event Sequence:
    1. chat_start (intent classification)
    2. chat_chunk (streaming response)
    3. modification_queued (if modification needed)
    4. modification_progress (percentage updates)
    5. modification_complete (updated content)
    6. chat_complete (final message)
    7. stream-ended
    ↓
Content auto-applied to Canvas
```

---

## Implementation Phases

### Phase 0: Prerequisites & Investigation (1-2 days)

Before starting implementation, investigate existing Canvas capabilities:

#### 0.1 Selection Context Investigation

**Objective**: Determine if Canvas components already capture text selection context

**Tasks**:
- [ ] Review `CanvasTextEditCard.tsx` and related editor components
- [ ] Check if selection with before/after context already exists
- [ ] Test browser Selection API integration
- [ ] Document findings and implementation approach

**Questions to Answer**:
1. Does Canvas already track text selection?
2. Can we capture 20 words before/after selected text?
3. What APIs are available in the editor component?

**Deliverable**: Implementation strategy document for selection context capture

---

#### 0.2 Version Management Investigation

**Objective**: Understand current undo/redo state management

**Tasks**:
- [ ] Review how `applyUpdates()` currently handles version indices
- [ ] Check if modifications already trigger state refresh
- [ ] Verify undo/redo works after current chat modifications

**Deliverable**: Confirmation that version management approach is sound

---

#### 0.3 Stream Cancellation Review

**Objective**: Check if stream cancellation already exists

**Tasks**:
- [ ] Review `handleStopStreaming()` implementation
- [ ] Test if abort logic works correctly
- [ ] Identify if we need to add abort-before-new-request logic

**Deliverable**: Stream cancellation implementation plan

---

### Phase 1: Foundation (2-3 days)

#### 1.1 SSE Event Type Definitions

**File**: `src/app/src/pages/feature-job-post-creator/sseEvents.ts` (NEW)

Define TypeScript interfaces for all V2 SSE event types:

```typescript
// Base event interface
export interface SSEEventBase {
  correlationId: string;
}

// Generation events
export interface GenerationProgressEvent extends SSEEventBase {
  Section: string;
  Content: string;
  Progress?: { Completed: number; Total: number };
}

// Chat events
export interface ChatStartEvent extends SSEEventBase {
  type: 'chat_start';
  intent: string;
  targetSection?: string;
  willModify: boolean;
}

export interface ChatChunkEvent extends SSEEventBase {
  type: 'chat_chunk';
  content: string;
  index: number;
}

export interface ChatCompleteEvent extends SSEEventBase {
  type: 'chat_complete';
  fullMessage: string;
}

// Modification events
export interface ModificationQueuedEvent extends SSEEventBase {
  type: 'modification_queued';
  jobId: string;
  modificationType: string;
}

export interface ModificationProgressEvent extends SSEEventBase {
  type: 'modification_progress';
  jobId: string;
  progress: number;
  message: string;
}

export interface ModificationCompleteEvent extends SSEEventBase {
  type: 'modification_complete';
  jobId: string;
  modification: {
    sectionName: string;
    textToReplace?: string;
    replacementText: string;
    completeSectionContent: string;
    revisionId: string;
    appliedToCache: boolean;
    persistedToDatabase: boolean;
  };
}

// Note: Backend may return updated state with version indices
// Check if we need to re-fetch job post state after modifications

// Transform events
export interface TransformStartEvent extends SSEEventBase {
  type: 'transform_start';
  transformType: string;
  sectionName?: string;
  message: string;
}

export interface TransformCompleteEvent extends SSEEventBase {
  type: 'transform_complete';
  transformType: string;
  sectionsProcessed: number;
  message: string;
}

// Error event
export interface StreamErrorEvent extends SSEEventBase {
  type: 'error';
  errorType: string;
  message: string;
  recoverable: boolean;
}

// Stream end marker
export interface StreamEndEvent {
  Content: 'stream-ended';
}

export type SSEEvent =
  | GenerationProgressEvent
  | ChatStartEvent
  | ChatChunkEvent
  | ChatCompleteEvent
  | ModificationQueuedEvent
  | ModificationProgressEvent
  | ModificationCompleteEvent
  | TransformStartEvent
  | TransformCompleteEvent
  | StreamErrorEvent
  | StreamEndEvent;

// Error type enum
export enum ErrorType {
  GenerationFailed = 'generation_failed',
  ChatFailed = 'chat_failed',
  ModificationFailed = 'modification_failed',
  ModificationTimeout = 'modification_timeout',
  TransformationFailed = 'transformation_failed',
  CircuitBreakerOpen = 'circuit_breaker_open',
  FeatureDisabled = 'feature_disabled',
  InternalError = 'internal_error',
}
```

**Deliverables**:
- Complete TypeScript type definitions
- JSDoc comments for all event types
- Export union type for event handlers

---

#### 1.2 Correlation ID Utility

**File**: `src/app/src/utils/correlationId.ts` (NEW)

Create utility for generating and logging correlation IDs:

```typescript
/**
 * Generates a correlation ID for tracking requests
 * Format: {prefix}:{jobPostId}:{timestamp}
 * Example: chat:abc123:20250129T104523Z
 */
export const generateCorrelationId = (
  prefix: string,
  jobPostId?: string
): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, -1);
  const parts = [prefix];
  if (jobPostId) parts.push(jobPostId);
  parts.push(timestamp);
  return parts.join(':');
};

/**
 * Logs correlation ID in development mode only
 */
export const logCorrelationId = (id: string, context: string): void => {
  if (import.meta.env.MODE !== 'production') {
    console.log(`[${context}] Correlation ID: ${id}`);
  }
};
```

**Deliverables**:
- Correlation ID generator
- Dev-only logging utility
- Standardized ID format

---

#### 1.3 Feature Flag State

**File**: `src/app/src/contexts/CanvasContext.tsx` (MODIFY)

Add enhanced backend availability state:

```typescript
// Add to CanvasContextState interface
interface CanvasContextState {
  // ... existing properties

  // Enhanced Backend Availability Flag
  // true = using /api/v2/jobpoststream (new backend)
  // false = using /jobpoststream (current backend as fallback)
  isEnhancedBackend: boolean;
  setIsEnhancedBackend: React.Dispatch<React.SetStateAction<boolean>>;
}

// Add to CanvasProvider state
export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... existing state

  // Start optimistically - assume enhanced backend is available
  const [isEnhancedBackend, setIsEnhancedBackend] = useState<boolean>(true);

  // ... rest of implementation

  const contextValue: CanvasContextState = {
    // ... existing values
    isEnhancedBackend,
    setIsEnhancedBackend,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};
```

**Deliverables**:
- Enhanced backend flag in context
- Optimistic default (assume available)
- Setter exposed to components for fallback handling

---

### Phase 2: V2 Service Layer (3-4 days)

#### 2.1 Create V2 Service

**File**: `src/app/src/services/jobPostServiceV2.ts` (NEW)

Implement all V2 API methods with SSE streaming support:

```typescript
import { fetchEventSource } from "./fetch";
import axiosInstance from "./axiosInstance";
import { generateCorrelationId, logCorrelationId } from "../utils/correlationId";
import type { SSEEvent, StreamErrorEvent } from "../pages/feature-job-post-creator/sseEvents";
import jobPostService from './jobPostService';

const config = window.env;
const ENHANCED_BASE = "/api/v2/jobpoststream";
const CURRENT_BASE = "/jobpoststream";

/**
 * NO FEATURE DETECTION ENDPOINT - Use optimistic approach
 * Assume enhanced backend is available, handle errors gracefully
 * If request fails with 404 or feature_disabled SSE event, fallback to current backend
 */

// Generation with SSE streaming (Enhanced Backend)
export const generateEnhanced = async (
  jobPostId: string,
  regenerate: boolean,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> => {
  const correlationId = generateCorrelationId('generate', jobPostId);
  logCorrelationId(correlationId, 'Generation');

  const url = `${config.apiUrl}${ENHANCED_BASE}/${jobPostId}/generate?regenerate=${regenerate}`;

  // Capture response for header extraction
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: null,
    signal,
  });

  // Capture x-correlation-id header for debugging
  const serverCorrelationId = response.headers.get('x-correlation-id');
  if (import.meta.env.MODE !== 'production') {
    console.log('[Debug] Request correlation ID:', serverCorrelationId);
  }

  await fetchEventSource(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: null,
    signal,
    onmessage: (event) => {
      if (!event.data) return;
      try {
        const parsed = JSON.parse(event.data);

        // Check for feature_disabled event (backend doesn't support enhanced API)
        if (parsed.type === 'error' && parsed.errorType === 'feature_disabled') {
          console.log('[Enhanced] Backend not available, triggering fallback');
          onEvent(parsed);
          return;
        }

        onEvent({ ...parsed, correlationId });
      } catch (err) {
        console.error('[Enhanced] Generation parse error:', err);
      }
    },
    onerror: (err: any) => {
      console.error('[Enhanced] Generation stream error:', err);

      // If 404, backend doesn't have enhanced API
      if (err.status === 404) {
        onEvent({
          type: 'error',
          errorType: 'feature_disabled',
          message: 'Enhanced backend not available',
          recoverable: false,
          correlationId,
        } as StreamErrorEvent);
        return;
      }

      onEvent({
        type: 'error',
        errorType: 'generation_failed',
        message: 'Stream failed',
        recoverable: true,
        correlationId,
      } as StreamErrorEvent);
    },
  });
};

// Chat with SSE streaming (Enhanced Backend)
//
// SELECTION DTO STRUCTURE:
// - ChatRequest: beforeText/afterText are OPTIONAL - used for providing context to the AI
// - ModificationRequest: beforeText/afterText are NOT USED - only selectedText + positions required
//
// includeHistory parameter:
// - true: Backend streams recent chat context (up to 10 messages) for richer answers
// - false: Backend uses only current message without historical context
// - Default: true (recommended for better conversational experience)
export const chatEnhanced = async (
  jobPostId: string,
  message: string,
  sectionName?: string,
  selection?: {
    selectedText: string;
    beforeText?: string;  // Optional - captured from editor if available (for context)
    afterText?: string;   // Optional - captured from editor if available (for context)
    startPosition: number;
    endPosition: number;
  },
  includeHistory: boolean = true,  // See above for explanation
  signal?: AbortSignal,
  onEvent?: (event: SSEEvent) => void
): Promise<void> => {
  const correlationId = generateCorrelationId('chat', jobPostId);
  logCorrelationId(correlationId, 'Chat');

  const url = `${config.apiUrl}${ENHANCED_BASE}/${jobPostId}/chat`;

  const body = {
    message,
    sectionName,
    selection,
    includeHistory,
    correlationId,
  };

  await fetchEventSource(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
    onmessage: (event) => {
      if (!event.data) return;
      try {
        const parsed = JSON.parse(event.data);
        if (onEvent) onEvent(parsed);
      } catch (err) {
        console.error('[V2] Chat parse error:', err);
      }
    },
    onerror: (err) => {
      console.error('[V2] Chat stream error:', err);
      if (onEvent) {
        onEvent({
          type: 'error',
          errorType: 'chat_failed',
          message: 'Chat stream failed',
          recoverable: true,
          correlationId,
        } as StreamErrorEvent);
      }
    },
  });
};

// Transform (direct apply, no preview) (Enhanced Backend)
export const transformEnhanced = async (
  jobPostId: string,
  transformType: 'polish' | 'expand' | 'summarize',
  sectionName?: string,
  additionalInstructions?: string,
  signal?: AbortSignal,
  onEvent?: (event: SSEEvent) => void
): Promise<void> => {
  const correlationId = generateCorrelationId('transform', jobPostId);
  logCorrelationId(correlationId, 'Transform');

  const url = `${config.apiUrl}${ENHANCED_BASE}/${jobPostId}/transform`;

  const body = {
    transformType,
    sectionName: sectionName || null,
    additionalInstructions,
    correlationId,
  };

  await fetchEventSource(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
    onmessage: (event) => {
      if (!event.data) return;
      try {
        const parsed = JSON.parse(event.data);
        if (onEvent) onEvent(parsed);
      } catch (err) {
        console.error('[V2] Transform parse error:', err);
      }
    },
    onerror: (err) => {
      console.error('[V2] Transform stream error:', err);
      if (onEvent) {
        onEvent({
          type: 'error',
          errorType: 'transformation_failed',
          message: 'Transform failed',
          recoverable: true,
          correlationId,
        } as StreamErrorEvent);
      }
    },
  });
};

// Direct modification (without chat) (Enhanced Backend)
export const modifyEnhanced = async (
  jobPostId: string,
  instruction: string,
  sectionName: string,
  selection: {
    selectedText: string;
    beforeText: string;
    afterText: string;
    startPosition: number;
    endPosition: number;
  },
  signal?: AbortSignal,
  onEvent?: (event: SSEEvent) => void
): Promise<void> => {
  const correlationId = generateCorrelationId('modify', jobPostId);
  logCorrelationId(correlationId, 'Modify');

  const url = `${config.apiUrl}${ENHANCED_BASE}/${jobPostId}/modify`;

  const body = {
    instruction,
    sectionName,
    selection,
    correlationId,
  };

  await fetchEventSource(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
    onmessage: (event) => {
      if (!event.data) return;
      try {
        const parsed = JSON.parse(event.data);
        if (onEvent) onEvent(parsed);
      } catch (err) {
        console.error('[V2] Modify parse error:', err);
      }
    },
    onerror: (err) => {
      console.error('[V2] Modify stream error:', err);
      if (onEvent) {
        onEvent({
          type: 'error',
          errorType: 'modification_failed',
          message: 'Modification failed',
          recoverable: true,
          correlationId,
        } as StreamErrorEvent);
      }
    },
  });
};

// Current Backend Fallback Methods (delegate to existing jobPostService)
// Both enhanced and current backend use same CRUD operations
export const create = jobPostService.create;
export const update = jobPostService.update;
export const deleteJobPost = jobPostService.deleteJobPost;
export const updateSection = jobPostService.updateSectionContent;
export const undo = jobPostService.undo;
export const redo = jobPostService.redo;
export const download = jobPostService.download;
export const rename = jobPostService.rename;
export const loadChatHistory = jobPostService.loadChatHistory;
```

**Deliverables**:
- Generation streaming with enhanced events
- Chat streaming with modification support
- Transform streaming
- Direct modification support
- Graceful error handling for feature_disabled
- Current backend fallback for CRUD operations (already compatible)

---

### Phase 3: Update Generation Flow (2-3 days)

#### 3.1 Optimistic Backend Approach

**File**: `src/app/src/pages/feature-job-post-creator/job-post-creator.tsx` (MODIFY)

No explicit detection needed - start optimistically:

```typescript
import { useCanvas } from '../../hooks/useCanvas';

const JobPostCreator: React.FC = () => {
  // ... existing code

  const { isEnhancedBackend } = useCanvas();

  // No detection on mount - we assume enhanced backend is available
  // If first request fails with 404 or feature_disabled, we'll fallback automatically
  // See job-post-editor.tsx for error handling

  // ... rest of component
};
```

**Deliverables**:
- Removed explicit feature detection
- Optimistic approach - assume enhanced backend available
- Fallback happens on first error

---

#### 3.2 Update Editor Generation Handler

**File**: `src/app/src/pages/feature-job-post-creator/job-post-editor.tsx` (MODIFY)

Replace the `handleGenerate()` function (currently at line 264) with enhanced backend-aware version:

```typescript
import { generateEnhanced } from '../../services/jobPostServiceV2';
import type {
  SSEEvent,
  StreamErrorEvent,
  GenerationProgressEvent
} from './sseEvents';
import {
  toCanonicalSection,
  getSectionLabel,
  CANONICAL_SECTIONS,
  SectionId
} from './sections';

const handleGenerate = async (force?: boolean) => {
  setIsDefaultView(false);
  setFormSubmitted(true);
  setIsCanvasMode(true);
  setIsStreamingCanvasContent(true);
  setIsGeneratedJobPost(false);
  setIsLoading(true);

  const controller = new AbortController();
  if (streamController) {
    streamController.current = controller;
  }

  // Check if we should use enhanced backend
  if (!isEnhancedBackend) {
    console.log('[Generation] Using current backend fallback');

    // Keep existing current backend implementation as fallback
    const url = `${config.apiUrl}/jobpoststream/${jobPostId}/generate?force=${force}`;

    try {
      let fullContent: ContentItem[] = [];

      await fetchEventSource(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: null,
        signal: controller.signal,
        onmessage: (event) => {
          if (!event.data) return;
          try {
            const parsed = JSON.parse(event.data);

            if (parsed.Content === "stream-ended") {
              setIsStreamingCanvasContent(false);
              setIsLoading(false);
              setIsGeneratedJobPost(true);

              const byId = new Map<SectionId, ContentItem>();
              for (const item of fullContent) {
                if (!item?.id) continue;
                byId.set(item.id as SectionId, item);
              }
              const contentWithIds = CANONICAL_SECTIONS.map((id) => {
                const existing = byId.get(id);
                return {
                  id,
                  header: getSectionLabel(t, id),
                  text: existing?.text ?? "",
                } as ContentItem;
              });

              setContentVersions(contentWithIds);
              return;
            }

            const canonical = toCanonicalSection(parsed.Section);
            if (!canonical) {
              console.warn("Unknown section from stream:", parsed.Section);
              return;
            }

            const item: ContentItem = {
              id: canonical,
              header: getSectionLabel(t, canonical),
              text: parsed.Content || "",
            };

            const idx = fullContent.findIndex((i) => i.id === canonical);
            if (idx >= 0) fullContent[idx] = item;
            else fullContent.push(item);
          } catch (err) {
            console.error("Error parsing SSE data:", err);
          }
        },
        onerror: (err) => {
          console.error("Streaming error:", err);
          notificationsService.error(
            t("job-post-creator:notifications.stream.error")
          );
          controller.abort();
        },
      });
    } catch (err) {
      console.error("Fetch SSE error:", err);
      notificationsService.error(
        t("job-post-creator:notifications.stream.error")
      );
    } finally {
      setIsStreamingCanvasContent(false);
      if (streamController) {
        streamController.current = null;
      }
    }

    return;
  }

  // Use enhanced backend generation
  console.log('[Generation] Using enhanced backend');

  try {
    let fullContent: ContentItem[] = [];
    let receivedStreamEnded = false;

    await generateEnhanced(
      jobPostId!,
      force ?? false,
      (event: SSEEvent) => {
        // Handle stream-ended
        if ('Content' in event && event.Content === 'stream-ended') {
          receivedStreamEnded = true;
          setIsStreamingCanvasContent(false);
          setIsLoading(false);
          setIsGeneratedJobPost(true);

          // Ensure canonical order and translated headers
          const byId = new Map<SectionId, ContentItem>();
          for (const item of fullContent) {
            if (!item?.id) continue;
            byId.set(item.id as SectionId, item);
          }

          const contentWithIds = CANONICAL_SECTIONS.map((id) => {
            const existing = byId.get(id);
            return {
              id,
              header: getSectionLabel(t, id),
              text: existing?.text ?? "",
            } as ContentItem;
          });

          setContentVersions(contentWithIds);
          return;
        }

        // Handle generation progress
        const genEvent = event as GenerationProgressEvent;
        if (genEvent.Section && genEvent.Content !== undefined) {
          const canonical = toCanonicalSection(genEvent.Section);
          if (!canonical) {
            console.warn('[V2] Unknown section:', genEvent.Section);
            return;
          }

          // NULL CONTENT HANDLING: Backend returns null for failed sections
          if (genEvent.Content === null || genEvent.Content === "") {
            console.warn(`[V2] Section ${canonical} generation failed (null content)`);
            const item: ContentItem = {
              id: canonical,
              header: getSectionLabel(t, canonical),
              text: "",
              failed: true,  // Mark section as failed for UI handling
            };

            const idx = fullContent.findIndex((i) => i.id === canonical);
            if (idx >= 0) fullContent[idx] = item;
            else fullContent.push(item);

            // Show inline retry UI in the section card
            // TODO: Add "Retry Section" button in CanvasTextEditCard for failed sections
            return;
          }

          const item: ContentItem = {
            id: canonical,
            header: getSectionLabel(t, canonical),
            text: genEvent.Content,
          };

          // Upsert by id
          const idx = fullContent.findIndex((i) => i.id === canonical);
          if (idx >= 0) fullContent[idx] = item;
          else fullContent.push(item);
        }

        // Handle errors
        if ('type' in event && event.type === 'error') {
          const errEvent = event as StreamErrorEvent;
          console.error('[Enhanced] Generation error:', errEvent);

          // If feature_disabled, fallback to current backend
          if (errEvent.errorType === 'feature_disabled') {
            console.log('[Enhanced] Backend not available, switching to current backend');
            setIsEnhancedBackend(false);
            // Retry with current backend
            handleGenerate(force);
            return;
          }

          if (errEvent.recoverable) {
            notificationsService.error(
              `${errEvent.message} (You can retry)`,
              { action: 'Retry' }
            );
          } else {
            notificationsService.error(errEvent.message);
          }
        }
      },
      controller.signal
    );
  } catch (err) {
    console.error('[Enhanced] Generation error:', err);

    // If error is 404, enhanced backend not available
    if (err?.status === 404) {
      console.log('[Enhanced] 404 error, falling back to current backend');
      setIsEnhancedBackend(false);
      handleGenerate(force);
      return;
    }

    notificationsService.error(
      t('job-post-creator:notifications.stream.error')
    );
  } finally {
    setIsStreamingCanvasContent(false);
    setIsLoading(false);

    // STREAM TERMINATION DETECTION
    // Check if stream ended gracefully with stream-ended marker
    if (!receivedStreamEnded) {
      console.warn('[Generation] Stream ended without stream-ended marker');
      notificationsService.warning(
        'Content generation interrupted - some sections may be incomplete'
      );
    }

    if (streamController) {
      streamController.current = null;
    }
  }
};
```

**Deliverables**:
- Enhanced backend-aware generation handler
- Current backend fallback preserved
- Automatic fallback on 404 or feature_disabled
- Enhanced error handling with recoverable flag
- Progress tracking support (foundation for future UI)

**Note**: Version indices (`snapshotVersion`, `pointsTo`, `canUndo`, `canRedo`) are likely already handled by existing `applyUpdates()` logic. Verify during implementation that modifications properly update these indices.

---

### Phase 4: Wire Up Chat to V2 (3-4 days)

#### 4.1 Update Canvas Message Handler

**File**: `src/app/src/hooks/useCanvas.tsx` (MODIFY)

Modify `handleSendCanvasMessage` function (around line 431) to use enhanced backend chat.

**Important**: The current implementation uses `jobPostService.prompt()` for general chat and `jobPostService.ask()` for section-specific chat. This will be replaced with `chatEnhanced()` which handles both cases with the selection parameter.

```typescript
import { chatEnhanced } from '../services/jobPostServiceV2';
import type {
  SSEEvent,
  ChatStartEvent,
  ChatChunkEvent,
  ChatCompleteEvent,
  ModificationCompleteEvent,
  StreamErrorEvent
} from '../pages/feature-job-post-creator/sseEvents';

const handleSendCanvasMessage = useCallback(
  async (payload: SendMessagePayload) => {
    const { inputValue, selectedText, sectionId } = payload;

    if (!jobPostId) {
      console.error('[Canvas] No jobPostId available');
      return;
    }

    // Check enhanced backend availability from context
    const isEnhanced = ctx.isEnhancedBackend;

    // Abort any existing stream before starting new one
    if (streamController?.current && !streamController.current.signal.aborted) {
      console.log('[Chat] Aborting previous stream');
      streamController.current.abort();
    }

    if (!isEnhanced) {
      console.log('[Chat] Using current backend fallback');

      // Keep existing current backend implementation
      // Current implementation from line 484-516:
      setIsStreamingCanvasChatMessages(true);
      setIsStreamingCanvasContent(true);

      try {
        let jobPostUpdateResponse: JobPostResponseDto;

        if (payload.source === "ChatInput") {
          jobPostUpdateResponse = await jobPostService.prompt(
            jobPostId,
            inputValue
          );
        } else {
          const canonicalSection = toCanonicalSection(sectionId);
          if (!canonicalSection) {
            notificationsService.error("Please select a valid section.");
            return;
          }

          jobPostUpdateResponse = await jobPostService.ask(
            jobPostId,
            canonicalSection,
            selectedText ?? "",
            inputValue
          );
        }

        if (!jobPostUpdateResponse) {
          console.error("Failed to get a response from the AI.");
          return;
        }

        applyUpdates(jobPostUpdateResponse);
      } finally {
        setIsStreamingCanvasContent(false);
        setIsStreamingCanvasChatMessages(false);
      }

      return;
    }

    console.log('[Chat] Using enhanced backend');

    // Add user message optimistically
    const userMessage = new ChatMessage(
      uuidv4(),
      inputValue,
      MessageRoleString[MessageRole.User],
      new Date().toISOString(),
      false,
      []
    );
    setCurrentChatMessages((prev) => [...prev, userMessage]);

    // Start streaming
    setIsStreamingCanvasChatMessages(true);

    const controller = new AbortController();
    if (streamController) streamController.current = controller;

    let assistantContent = '';
    const assistantMessageId = uuidv4();
    let receivedStreamEnded = false;

    try {
      await chatEnhanced(
        jobPostId,
        inputValue,
        sectionId,
        selectedText ? {
          selectedText,
          beforeText: undefined, // TODO: Implement based on Phase 0 investigation
          afterText: undefined,  // TODO: Implement based on Phase 0 investigation
          startPosition: 0,
          endPosition: selectedText.length,
        } : undefined,
        true, // includeHistory - see service documentation for explanation
        controller.signal,
        (event: SSEEvent) => {
          // Handle chat_start (intent classification)
          if ('type' in event && event.type === 'chat_start') {
            const startEvent = event as ChatStartEvent;
            console.log('[Chat] Intent:', startEvent.intent, 'Will modify:', startEvent.willModify);

            if (startEvent.willModify && startEvent.targetSection) {
              // Optionally show UI indicator that modification will happen
              console.log(`[Chat] Will modify section: ${startEvent.targetSection}`);
            }
          }

          // Handle chat_chunk (streaming response)
          if ('type' in event && event.type === 'chat_chunk') {
            const chunkEvent = event as ChatChunkEvent;
            assistantContent += chunkEvent.content;

            // Update assistant message in chat
            setCurrentChatMessages((prev) => {
              const existing = prev.find((m) => m.id === assistantMessageId);
              if (existing) {
                return prev.map((m) =>
                  m.id === assistantMessageId
                    ? new ChatMessage(
                        m.id,
                        assistantContent,
                        m.role,
                        m.date,
                        false,
                        []
                      )
                    : m
                );
              } else {
                return [
                  ...prev,
                  new ChatMessage(
                    assistantMessageId,
                    assistantContent,
                    MessageRoleString[MessageRole.Assistant],
                    new Date().toISOString(),
                    false,
                    []
                  ),
                ];
              }
            });
          }

          // Handle modification_complete (auto-apply changes)
          if ('type' in event && event.type === 'modification_complete') {
            const modEvent = event as ModificationCompleteEvent;
            console.log('[Chat] Modification complete:', modEvent.modification);

            // Apply modification to content
            setContentVersions((prev) => {
              return prev.map((item) => {
                const canonical = toCanonicalSection(modEvent.modification.sectionName);
                if (item.id === canonical) {
                  return {
                    ...item,
                    text: modEvent.modification.completeSectionContent,
                  };
                }
                return item;
              });
            });

            // Re-fetch job post state to update version indices
            // Note: Current implementation's applyUpdates() may already handle this
            // Verify during implementation that undo/redo state is properly updated
            jobPostService.get(jobPostId).then((response) => {
              applyUpdates(response);
            });

            // Show success notification
            notificationsService.success(
              'Section updated successfully'
            );
          }

          // Handle stream-ended
          if ('Content' in event && event.Content === 'stream-ended') {
            receivedStreamEnded = true;
            setIsStreamingCanvasChatMessages(false);
          }

          // Handle errors
          if ('type' in event && event.type === 'error') {
            const errEvent = event as StreamErrorEvent;
            console.error('[Chat] Stream error:', errEvent);

            // If feature_disabled, fallback to current backend
            if (errEvent.errorType === 'feature_disabled') {
              console.log('[Chat] Backend not available, switching to current backend');
              ctx.setIsEnhancedBackend(false);
              // Don't retry automatically - let user try again
            }

            if (errEvent.recoverable) {
              notificationsService.error(
                `${errEvent.message} (You can retry)`,
                { action: 'Retry' }
              );
            } else {
              notificationsService.error(errEvent.message);
            }

            setIsStreamingCanvasChatMessages(false);
          }
        }
      );
    } catch (err) {
      console.error('[Chat] Error:', err);
      notificationsService.error(
        t('job-post-creator:notifications.chat.error')
      );
      setIsStreamingCanvasChatMessages(false);
    } finally {
      // STREAM TERMINATION DETECTION
      // Check if stream ended gracefully with stream-ended marker
      if (!receivedStreamEnded) {
        console.warn('[Chat] Stream ended without stream-ended marker');
        notificationsService.warning(
          'Chat response interrupted - message may be incomplete'
        );
      }

      if (streamController) streamController.current = null;
    }
  },
  [
    jobPostId,
    ctx.isV2Enabled,
    streamController,
    setCurrentChatMessages,
    setIsStreamingCanvasChatMessages,
    setContentVersions,
    t,
  ]
);
```

**Deliverables**:
- Enhanced backend-aware chat handler
- Current backend fallback preserved (using existing prompt/ask methods)
- Abort previous stream before starting new one
- Chat streaming with character-by-character updates
- Auto-apply modifications to Canvas
- Version indices refresh after modifications (verify existing logic handles this)
- Intent classification handling
- Error handling with recoverable flag and automatic fallback

---

### Phase 5: Add Transform Operations (2-3 days)

#### 5.1 Add Transform Dropdown to Canvas Header

**File**: `src/app/src/components/Canvas/CanvasHeaderTitle.tsx` (or similar header component) (MODIFY)

Add transform functionality:

```typescript
import { transformEnhanced } from '../../services/jobPostServiceV2';
import { useCanvas } from '../../hooks/useCanvas';
import { useParams } from 'react-router-dom';
import { notificationsService } from '../../services/notificationsService';
import { useTranslation } from 'react-i18next';

const CanvasHeaderTitle: React.FC = () => {
  // ... existing code

  const { isEnhancedBackend, setIsEnhancedBackend } = useCanvas();
  const { jobPostId } = useParams();

  const handleTransform = async (type: 'polish' | 'expand' | 'summarize') => {
    if (!jobPostId || !isEnhancedBackend) {
      notificationsService.error('Transform feature not available');
      return;
    }

    setIsLoading(true);

    try {
      await transformEnhanced(
        jobPostId,
        type,
        undefined, // null = all sections
        undefined, // no additional instructions
        streamController.current?.signal,
        (event) => {
          if (event.type === 'transform_complete') {
            notificationsService.success(
              `Transformed ${event.sectionsProcessed} sections`
            );

            // RECOMMENDATION: Instead of window.location.reload(),
            // trigger regeneration via existing handleGenerate() method
            // This requires access to handleGenerate from job-post-editor.tsx
            // Option 1: Expose via Canvas context
            // Option 2: Pass as prop to Canvas header
            // Option 3: Use event bus or signal pattern

            // For now, re-fetch content:
            jobPostService.get(jobPostId).then((response) => {
              applyUpdates(response);
            });
          }

          if (event.type === 'error') {
            const errEvent = event as StreamErrorEvent;

            // Handle feature_disabled
            if (errEvent.errorType === 'feature_disabled') {
              setIsEnhancedBackend(false);
            }

            notificationsService.error(errEvent.message);
          }
        }
      );
    } catch (err) {
      console.error('[Transform] Error:', err);
      notificationsService.error('Transform failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="canvas-header">
      {/* ... existing header content ... */}

      {/* Transform Dropdown - only show if enhanced backend available */}
      {isEnhancedBackend && (
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleTransform(e.target.value as any);
              e.target.value = ''; // Reset dropdown
            }
          }}
          className="transform-dropdown"
        >
          <option value="">Transform...</option>
          <option value="polish">Polish</option>
          <option value="expand">Expand</option>
          <option value="summarize">Summarize</option>
        </select>
      )}
    </div>
  );
};
```

**Deliverables**:
- Transform dropdown UI
- Integration with enhanced backend transform endpoint
- Success/error notifications
- Conditional rendering (only show when enhanced backend available)
- Automatic fallback to current backend on error
- Content refresh after transform (without page reload)

---

### Phase 6: Testing & Refinement (2-3 days)

#### 6.1 Manual Testing Checklist

**Generation Flow**:
- [ ] Create new job post → navigates to editor
- [ ] Editor loads → sections generate with enhanced backend streaming
- [ ] Progress events received and parsed correctly
- [ ] All 6 sections populate with content
- [ ] Stream-ended event triggers completion state
- [ ] Error during generation → shows retry option
- [ ] Enhanced backend unavailable (404) → falls back to current backend automatically

**Chat Flow**:
- [ ] Send chat message → streams response character-by-character
- [ ] Chat message without selection → pure Q&A response
- [ ] Chat message with section context → intelligent response
- [ ] Chat triggers modification → auto-applies to section
- [ ] Multiple chat messages → history maintained
- [ ] Send message while previous streaming → aborts old stream
- [ ] Modification complete → undo/redo state updated correctly
- [ ] Error during chat → shows recoverable error
- [ ] Enhanced backend unavailable → falls back to current backend (prompt/ask)

**Transform Flow**:
- [ ] Transform dropdown only visible when enhanced backend available
- [ ] Select "Polish" → all sections polished
- [ ] Select "Expand" → all sections expanded
- [ ] Select "Summarize" → all sections summarized
- [ ] Transform complete → success notification
- [ ] Content updates visible in Canvas without page reload
- [ ] Undo/redo works after transform
- [ ] Error during transform → error notification

**Feature Detection & Fallback**:
- [ ] Enhanced backend available → all enhanced features visible
- [ ] Enhanced backend unavailable (404) → falls back automatically
- [ ] Enhanced backend returns feature_disabled → falls back automatically
- [ ] Fallback to current backend works for generation
- [ ] Fallback to current backend works for chat
- [ ] Transform feature hidden when current backend active
- [ ] No errors when switching between backends
- [ ] User not aware of backend switch (seamless)

**Error Handling**:
- [ ] Recoverable error → "You can retry" message
- [ ] Non-recoverable error → generic error message
- [ ] Circuit breaker error → temporary disable message
- [ ] Feature disabled error → auto-fallback to current backend
- [ ] 404 error → auto-fallback to current backend
- [ ] Network error → proper error message

**UX**:
- [ ] Loading states show during streaming
- [ ] Chat messages appear in real-time
- [ ] Undo/redo works after modifications
- [ ] No UI flickering during streaming
- [ ] Responsive design maintained
- [ ] Previous stream aborted when new message sent
- [ ] No duplicate content or UI glitches

**Selection Context** (Phase 0 dependent):
- [ ] Text selection captured correctly
- [ ] beforeText/afterText captured if available
- [ ] Selection works in Canvas text editor
- [ ] Positions calculated correctly

---

#### 6.2 Error Handling Test Matrix

| Error Type | Expected Behavior | UI Action |
|------------|-------------------|-----------|
| `generation_failed` | Show retry button | Allow regeneration |
| `chat_failed` | Show retry option | Allow resend |
| `modification_failed` | Show error toast | Allow retry via chat |
| `modification_timeout` | Gentle warning | Suggest retry |
| `transformation_failed` | Error notification | Allow retry transform |
| `circuit_breaker_open` | Disable controls temporarily | Auto-enable after 30s |
| `feature_disabled` | Auto-fallback to V1 | Transparent to user |
| `internal_error` | Generic error message | Contact support |

**Test each error type**:
1. Trigger error condition (via backend or mock)
2. Verify correct error message displayed
3. Verify `recoverable` flag respected
4. Verify retry mechanism works (if applicable)
5. Verify correlation ID logged to console

---

#### 6.3 Integration Test Scenarios

**Scenario 1: End-to-End Job Post Creation (V2)**
1. Navigate to `/job-post-creator-new`
2. Fill out form and submit
3. Verify redirect to `/job-post-creator/:jobPostId`
4. Verify V2 generation starts automatically
5. Verify all sections populate
6. Send chat message "Make the header more exciting"
7. Verify modification auto-applies
8. Select "Polish" transform
9. Verify all sections polished
10. Download job post
11. Verify DOCX file downloads correctly

**Scenario 2: V1 Fallback**
1. Backend disables V2 feature flag
2. Navigate to `/job-post-creator-new`
3. Verify V1 detection occurs
4. Fill out form and submit
5. Verify V1 generation works
6. Verify no V2 features visible (transform dropdown)
7. Verify existing V1 chat works (if applicable)

**Scenario 3: Error Recovery**
1. Start generation
2. Backend returns `generation_failed` error
3. Verify retry button appears
4. Click retry
5. Verify regeneration starts
6. Verify successful completion

---

## File Structure

### New Files (3 total)

```
src/app/src/
├── services/
│   └── jobPostServiceV2.ts          # V2 API methods with SSE streaming
├── pages/feature-job-post-creator/
│   └── sseEvents.ts                 # TypeScript event type definitions
└── utils/
    └── correlationId.ts             # Correlation ID generation utility
```

### Modified Files (5 total)

```
src/app/src/
├── contexts/
│   └── CanvasContext.tsx            # Add isEnhancedBackend state
├── hooks/
│   └── useCanvas.tsx                # Update handleSendCanvasMessage for enhanced backend
├── pages/feature-job-post-creator/
│   ├── job-post-creator.tsx         # Use enhanced backend optimistically
│   └── job-post-editor.tsx          # Update handleGenerate for enhanced backend
└── components/Canvas/
    └── CanvasHeaderTitle.tsx        # Add transform dropdown (or similar header component)
```

### Potentially Modified (As Needed)

```
src/app/src/
├── pages/feature-job-post-creator/
│   ├── job-post-maintenance.tsx     # May need enhanced backend awareness
│   └── sections.ts                  # May need updates for new section handling
└── components/JobPostCreator/
    └── *.tsx                        # Various components may need minor updates
```

**Note**: All files in the job post creator feature are now fair game for refactoring. No files are off-limits.

---

## Testing Strategy

### Unit Tests

**Target Files**:
- `jobPostServiceV2.ts` - Test all enhanced backend API methods
- `correlationId.ts` - Test ID generation and formatting
- `sseEvents.ts` - Test event type guards

**Coverage Goals**:
- All enhanced backend service methods: 80%+
- Event parsing logic: 90%+
- Error handling paths: 80%+

### Integration Tests

**Test Suites**:
1. **Generation Flow** - End-to-end section generation
2. **Chat Flow** - Chat with and without modifications
3. **Transform Flow** - All transform types
4. **V1 Fallback** - Feature flag detection and fallback
5. **Error Recovery** - All error types and recovery paths

### Manual Testing

**Focus Areas**:
- SSE streaming performance
- Real-time UI updates
- Error message clarity
- UX smoothness during streaming
- V1/V2 transition seamlessness

---

## Deployment Plan

### Stage 0: Investigation & Prerequisites (Week 1)
- Complete Phase 0 investigation tasks
- Document selection context approach
- Verify version management approach
- **Goal**: Clear implementation strategy

### Stage 1: Service Layer Deployment (Week 1-2)
- Deploy `jobPostServiceV2.ts` with enhanced backend methods
- Deploy `sseEvents.ts` types
- Deploy `correlationId.ts` utility
- **Goal**: Foundation in place, no UI changes yet
- **Rollback**: Instant (no user-facing changes)

### Stage 2: Generation Enhancement (Week 2)
- Deploy updated `job-post-editor.tsx` with enhanced backend generation
- Deploy optimistic backend detection
- **Goal**: Enhanced generation works, automatic fallback tested
- **Rollback**: Backend disable (frontend falls back automatically)

### Stage 3: Chat Integration (Week 3)
- Deploy updated `useCanvas.tsx` with enhanced backend chat
- Deploy chat-driven modifications
- Deploy stream cancellation logic
- **Goal**: Full chat experience with auto-modifications
- **Rollback**: Backend disable (frontend falls back automatically)

### Stage 4: Transform Operations (Week 4)
- Deploy transform UI and handler
- Full enhanced feature set live
- **Goal**: All enhanced features available
- **Rollback**: Backend disable (frontend falls back automatically)

### Rollback Strategy

**Immediate Rollback**:
1. Backend disables enhanced API or returns 404
2. Frontend auto-detects and falls back to current backend
3. No code deployment needed (graceful degradation built-in)

**Code Rollback** (if needed):
1. Revert to previous commit
2. Redeploy frontend
3. All enhanced backend code inactive but present

---

## Success Criteria

### Functional Requirements
- ✅ All enhanced backend endpoints integrated and functional
- ✅ Optimistic backend detection works correctly
- ✅ Automatic fallback to current backend seamless and transparent
- ✅ Chat with auto-modification works end-to-end
- ✅ Transform operations (polish/expand/summarize) work
- ✅ Correlation IDs tracked and logged (dev console only)
- ✅ Error handling respects `recoverable` flag
- ✅ Stream cancellation works (abort previous before starting new)
- ✅ All job post creator code successfully refactored

### Performance Requirements
- ✅ SSE streaming latency < 500ms
- ✅ Chat response starts streaming within 1s
- ✅ No UI blocking during streaming
- ✅ Memory leaks checked (no zombie event listeners)
- ✅ Network usage reasonable (no redundant requests)

### Quality Requirements
- ✅ TypeScript types complete and accurate
- ✅ Console errors/warnings addressed
- ✅ Code follows existing patterns and conventions
- ✅ JSDoc comments on all public APIs
- ✅ Error messages user-friendly and actionable

### User Experience Requirements
- ✅ Real-time chat streaming feels responsive
- ✅ Modifications apply smoothly without jarring updates
- ✅ Loading states clear and informative
- ✅ Error messages helpful (not technical jargon)
- ✅ Backend transition invisible to users (seamless fallback)
- ✅ Previous streams cancelled cleanly (no overlap/duplication)

---

## Timeline Estimate

| Phase | Description | Duration | Deliverables |
|-------|-------------|----------|--------------|
| **Phase 0** | Prerequisites | 1-2 days | Investigation findings, implementation strategy |
| **Phase 1** | Foundation | 2-3 days | Event types, correlation ID, backend flag state |
| **Phase 2** | Service Layer | 3-4 days | Complete enhanced service with all endpoints |
| **Phase 3** | Generation | 2-3 days | Enhanced generation with automatic fallback |
| **Phase 4** | Chat Integration | 3-4 days | Chat with auto-modifications and stream cancellation |
| **Phase 5** | Transform | 2-3 days | Transform UI and handlers |
| **Phase 6** | Testing | 2-3 days | Manual and integration testing |

**Total Duration**: 15-22 development days (3-4.5 weeks)

---

## Risk Assessment

### High Risk
- **SSE Connection Stability** - Network issues could break streaming
  - *Mitigation*: Robust error handling, stream cancellation logic

- **Backend Behavioral Differences** - Subtle differences between current/enhanced could confuse users
  - *Mitigation*: Extensive testing of fallback scenarios, seamless transition

### Medium Risk
- **Performance Degradation** - SSE parsing overhead
  - *Mitigation*: Profile and optimize event handlers

- **State Management Complexity** - Modifications + chat + streaming
  - *Mitigation*: Clear state flow documentation

### Low Risk
- **TypeScript Typing Issues** - Event types could be incorrect
  - *Mitigation*: Comprehensive type tests and validation

---

## Open Questions & Decisions

### Resolved
✅ **UI Components**: Reuse existing Canvas components (no new UI needed)
✅ **Transform Preview**: Apply directly, use undo/redo for rollback
✅ **Correlation ID**: Developer-only, console logging sufficient
✅ **Feature Flag**: Binary on/off, optimistic approach
✅ **Conflicts**: Deferred (out of scope for initial refactor)
✅ **Translation Keys**: Handle separately, not part of this refactor
✅ **Stream Cancellation**: Abort previous stream before starting new one
✅ **Feature Detection**: No health endpoint, use optimistic strategy

### Requires Investigation (Phase 0)
⏳ **Selection Context Capture**: Does Canvas already support this? How to capture before/after text?
⏳ **Version Indices After Modifications**: Does existing applyUpdates() handle this correctly?
⏳ **Transform Reload Strategy**: How to trigger content refresh without window.reload()?

### Pending (Implementation Details)
⏳ **Transform Trigger UI**: Dropdown vs buttons (recommend dropdown for simplicity)
⏳ **Error Notification Duration**: Standard toast duration or custom?
⏳ **Chat History Limit**: Backend likely handles this, verify during implementation

---

## Appendix

### A. Backend API Reference
See: `job-post-creator-v2-frontend-integration.md`

### B. Component Architecture
```
JobPostEditor
    ├── ChatComponent
    │   └── CanvasChat
    │       ├── ChatInput
    │       └── ChatDialogueBox
    ├── Canvas
    │   ├── CanvasHeaderTitle (+ Transform UI)
    │   ├── CanvasNavButtons (undo/redo)
    │   └── CanvasTextEditCard (sections)
    └── JobPostCreatorFormItems
```

### C. State Flow Diagram
```
User Action
    ↓
Component Event Handler
    ↓
Hook (useCanvas / useJobPost)
    ↓
Service Method (jobPostServiceV2)
    ↓
SSE Stream (backend)
    ↓
Event Parser (onEvent callback)
    ↓
State Update (setContentVersions / setCurrentChatMessages)
    ↓
Canvas Re-render
    ↓
UI Update
```

### D. Correlation ID Format
```
Format: {prefix}:{jobPostId}:{timestamp}

Examples:
- generate:abc123:20250129T104523Z
- chat:abc123:20250129T104530Z
- modify:abc123:20250129T104545Z
- transform:abc123:20250129T104600Z
```

### E. Error Type Reference
```typescript
enum ErrorType {
  GenerationFailed = 'generation_failed',        // Recoverable
  ChatFailed = 'chat_failed',                    // Recoverable
  ModificationFailed = 'modification_failed',    // Recoverable
  ModificationTimeout = 'modification_timeout',  // Recoverable
  TransformationFailed = 'transformation_failed',// Recoverable
  CircuitBreakerOpen = 'circuit_breaker_open',  // Non-recoverable (temporary)
  FeatureDisabled = 'feature_disabled',          // Non-recoverable (fallback)
  InternalError = 'internal_error',              // Non-recoverable
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-29 | AI Assistant | Initial refactor plan created |
| 1.1 | 2025-01-29 | AI Assistant | Clarified terminology (current backend vs enhanced backend), added Phase 0 investigation, fixed feature detection strategy, added stream cancellation, made beforeText/afterText optional, added automatic fallback logic, removed translation keys concern |
| 1.2 | 2025-01-29 | AI Assistant | Simplified scope - old job post creator removed from codebase, all files now safe to refactor, removed "NEVER TOUCH" warnings |
| 1.3 | 2025-01-29 | AI Assistant | Final review addressing integration guide gaps: (1) Added null content handling for failed sections, (2) Clarified selection DTO structure differences between ChatRequest and ModificationRequest, (3) Added x-correlation-id header capture for debugging, (4) Added stream termination detection (receivedStreamEnded flag), (5) Documented includeHistory parameter usage, (6) Confirmed no frontend timeout logic per user constraint |

---

## Summary of v1.3 Changes

This version addresses all critical gaps identified in the final review against the backend integration guide:

### 1. Null Content Handling (Priority 1)
**Location**: Phase 3.2 - Enhanced backend generation handler

Added explicit handling for `Content: null` from backend indicating failed sections:
```typescript
if (genEvent.Content === null || genEvent.Content === "") {
  // Mark section as failed with failed: true flag
  // Show inline retry UI in CanvasTextEditCard
}
```

### 2. Selection DTO Clarification (Priority 1)
**Location**: Phase 2.1 - chatEnhanced service method

Added documentation comments explaining the difference:
- **ChatRequest**: `beforeText`/`afterText` are OPTIONAL (used for AI context)
- **ModificationRequest**: `beforeText`/`afterText` are NOT USED (only selectedText + positions)

### 3. x-correlation-id Header Capture (Priority 2)
**Location**: Phase 2.1 - generateEnhanced service method

Added header capture for debugging:
```typescript
const serverCorrelationId = response.headers.get('x-correlation-id');
if (import.meta.env.MODE !== 'production') {
  console.log('[Debug] Request correlation ID:', serverCorrelationId);
}
```

### 4. Stream Termination Detection (Priority 2)
**Location**: Phase 3.2 (generation) and Phase 4.1 (chat)

Added `receivedStreamEnded` flag and detection in finally blocks:
```typescript
if (!receivedStreamEnded) {
  notificationsService.warning('Content may be incomplete');
}
```

### 5. includeHistory Documentation (Priority 2)
**Location**: Phase 2.1 - chatEnhanced service method

Added clear documentation:
- `true`: Backend streams up to 10 messages of history for richer answers
- `false`: Only current message without historical context
- Default: `true` (recommended)

### 6. Frontend Timeout Constraint (User Requirement)
**Status**: Confirmed - No frontend timeout logic

Frontend assumes no timeout and only reacts to backend termination. The backend handles the ~60s timeout internally; frontend doesn't implement its own timeout logic.

---

**End of Document**
