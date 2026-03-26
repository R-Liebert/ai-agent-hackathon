import {
  requestApiType,
  JobPostResponseDto
} from "../pages/feature-job-post-creator/types";
import axiosInstance from "./axiosInstance";
import { fetchEventSource } from "./fetch";
import {
  generateCorrelationId,
  logCorrelationId,
  logServerCorrelationId,
  CorrelationPrefix,
} from "../utils/correlationId";
import type {
  SSEEvent,
  StreamErrorEvent,
} from "../pages/feature-job-post-creator/sseEvents";

const config = window.env;
const ENHANCED_BASE = "api/jobpoststream";

// ============================================================================
// SSE Streaming Methods
// ============================================================================

/**
 * Generate job post sections using enhanced backend with SSE streaming
 *
 * Streams section content as it's generated. Sections are generated in parallel
 * and stream independently. The backend will return null Content for failed sections.
 *
 * IMPORTANT: This method will reject on stream errors (404, network failures, etc.).
 * Callers MUST wrap in try/catch. Errors are also reported via onEvent callback
 * for UI handling before the promise rejects.
 */
const generateEnhanced = async (
  jobPostId: string,
  regenerate: boolean,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> => {
  const correlationId = generateCorrelationId(
    CorrelationPrefix.GENERATE,
    jobPostId
  );
  logCorrelationId(correlationId, "Generation");

  const url = `${config.apiUrl}${ENHANCED_BASE}/${jobPostId}/generate?regenerate=${regenerate}`;

  await fetchEventSource(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: null,
    signal,
    onopen: async (response) => {
      logServerCorrelationId(response, "Generation Request");

      const contentType = response.headers.get("content-type");
      if (!contentType?.startsWith("text/event-stream")) {
        throw new Error(
          `Expected content-type to be text/event-stream, Actual: ${contentType}`
        );
      }
    },
    onmessage: (event) => {
      if (!event.data) return;
      try {
        let data = event.data;
        if (typeof data === 'string' && data.startsWith('data: ')) {
          data = data.substring(6);
        }

        const parsed = JSON.parse(data);

        if (parsed.type === "error" && parsed.errorType === "feature_disabled") {
          console.log("[Enhanced] Backend unavailable (feature_disabled)");
          onEvent({ ...parsed, correlationId });
          return;
        }

        onEvent({ ...parsed, correlationId });
      } catch (err) {
        console.error("[Enhanced] Generation parse error:", err, "Data:", event.data?.substring(0, 100));
      }
    },
    onerror: (err: any) => {
      console.error("[Enhanced] Generation stream error:", err);

      if (err.status === 404) {
        console.log("[Enhanced] Backend not available (404)");
        onEvent({
          type: "error",
          errorType: "feature_disabled",
          message: "Service temporarily unavailable. Please try again in a few moments.",
          recoverable: true,
          correlationId,
        } as StreamErrorEvent);
        throw err;
      }

      onEvent({
        type: "error",
        errorType: "generation_failed",
        message: "Stream failed",
        recoverable: true,
        correlationId,
      } as StreamErrorEvent);
      throw err;
    },
  });
};

/**
 * Send chat message with enhanced backend
 *
 * Supports both pure Q&A and chat-driven modifications. The backend will:
 * 1. Classify intent (information_request, modification_text_selection, etc.)
 * 2. Stream chat response character-by-character
 * 3. If modification needed, queue and process modification
 * 4. Auto-apply modifications to backend cache and database
 *
 * IMPORTANT: This method will reject on stream errors (404, network failures, etc.).
 * Callers MUST wrap in try/catch.
 */
const chatEnhanced = async (
  jobPostId: string,
  message: string,
  sectionName?: string,
  selection?: {
    selectedText: string;
    beforeText?: string;
    afterText?: string;
    startPosition: number;
    endPosition: number;
  },
  includeHistory: boolean = true,
  signal?: AbortSignal,
  clientMessageId?: string,
  clientAssistantMessageId?: string,
  onEvent?: (event: SSEEvent) => void
): Promise<void> => {
  const correlationId = generateCorrelationId(CorrelationPrefix.CHAT, jobPostId);
  logCorrelationId(correlationId, "Chat");

  const url = `${config.apiUrl}${ENHANCED_BASE}/${jobPostId}/chat`;

  const body = {
    message,
    sectionName,
    selection,
    includeHistory,
    correlationId,
    clientMessageId,
    clientAssistantMessageId,
  };

  await fetchEventSource(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
    onopen: async (response) => {
      logServerCorrelationId(response, "Chat Request");

      const contentType = response.headers.get("content-type");
      if (!contentType?.startsWith("text/event-stream")) {
        throw new Error(
          `Expected content-type to be text/event-stream, Actual: ${contentType}`
        );
      }
    },
    onmessage: (event) => {
      if (!event.data) return;
      try {
        let data = event.data;
        if (typeof data === 'string' && data.startsWith('data: ')) {
          data = data.substring(6);
        }

        const parsed = JSON.parse(data);

        if (parsed.type === "error" && parsed.errorType === "feature_disabled") {
          console.log("[Enhanced] Backend unavailable (feature_disabled)");
          if (onEvent) onEvent({ ...parsed, correlationId });
          return;
        }

        if (onEvent) onEvent({ ...parsed, correlationId });
      } catch (err) {
        console.error("[Chat] parse error:", err, "Data:", event.data?.substring(0, 100));
      }
    },
    onerror: (err: any) => {
      console.error("[Chat] stream error:", err);

      if (err.status === 404) {
        console.log("[Enhanced] Backend not available (404)");
        if (onEvent) {
          onEvent({
            type: "error",
            errorType: "feature_disabled",
            message: "Service temporarily unavailable. Please try again in a few moments.",
            recoverable: true,
            correlationId,
          } as StreamErrorEvent);
        }
        throw err;
      }

      if (onEvent) {
        onEvent({
          type: "error",
          errorType: "chat_failed",
          message: "Chat stream failed",
          recoverable: true,
          correlationId,
        } as StreamErrorEvent);
      }
      throw err;
    },
  });
};

/**
 * Direct modification without chat
 *
 * This endpoint allows direct modification of content without going through chat.
 * Useful for programmatic modifications or when chat context is not needed.
 *
 * NOTE: Most use cases should use chatEnhanced() instead.
 */
const modifyEnhanced = async (
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
  const correlationId = generateCorrelationId(
    CorrelationPrefix.MODIFY,
    jobPostId
  );
  logCorrelationId(correlationId, "Modify");

  const url = `${config.apiUrl}${ENHANCED_BASE}/${jobPostId}/modify`;

  const body = {
    instruction,
    sectionName,
    selection,
    correlationId,
  };

  await fetchEventSource(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
    onopen: async (response) => {
      logServerCorrelationId(response, "Modify Request");

      const contentType = response.headers.get("content-type");
      if (!contentType?.startsWith("text/event-stream")) {
        throw new Error(
          `Expected content-type to be text/event-stream, Actual: ${contentType}`
        );
      }
    },
    onmessage: (event) => {
      if (!event.data) return;
      try {
        let data = event.data;
        if (typeof data === 'string' && data.startsWith('data: ')) {
          data = data.substring(6);
        }

        const parsed = JSON.parse(data);

        if (parsed.type === "error" && parsed.errorType === "feature_disabled") {
          console.log("[Enhanced] Backend unavailable (feature_disabled)");
          if (onEvent) onEvent({ ...parsed, correlationId });
          return;
        }

        if (onEvent) onEvent({ ...parsed, correlationId });
      } catch (err) {
        console.error("[Modify] parse error:", err, "Data:", event.data?.substring(0, 100));
      }
    },
    onerror: (err: any) => {
      console.error("[Modify] stream error:", err);

      if (err.status === 404) {
        console.log("[Enhanced] Backend not available (404)");
        if (onEvent) {
          onEvent({
            type: "error",
            errorType: "feature_disabled",
            message: "Service temporarily unavailable. Please try again in a few moments.",
            recoverable: true,
            correlationId,
          } as StreamErrorEvent);
        }
        throw err;
      }

      if (onEvent) {
        onEvent({
          type: "error",
          errorType: "modification_failed",
          message: "Modification failed",
          recoverable: true,
          correlationId,
        } as StreamErrorEvent);
      }
      throw err;
    },
  });
};

// ============================================================================
// CRUD Operations
// ============================================================================

const attachETag = (
  data: JobPostResponseDto,
  headers?: Record<string, any>
): JobPostResponseDto => {
  const headerETag =
    headers?.etag ??
    headers?.ETag ??
    headers?.Etag ??
    headers?.["x-ms-etag"] ??
    null;
  const payloadETag =
    data?.state?.eTag ??
    data?.state?.etag ??
    (data?.state as any)?._etag ??
    null;
  const resolvedETag = payloadETag ?? headerETag;
  if (!resolvedETag) {
    return data;
  }

  return {
    ...data,
    state: {
      ...data.state,
      eTag: resolvedETag,
    },
  };
};

const get = async (jobPostId: string): Promise<JobPostResponseDto> => {
  const response = await axiosInstance.get(`/jobpoststream/${jobPostId}`);
  return attachETag(response.data, response.headers);
};

const create = async (data: any): Promise<JobPostResponseDto> => {
  const response = await axiosInstance.post(
    "/jobpoststream",
    JSON.stringify(data)
  );
  return attachETag(response.data, response.headers);
};

const update = async (
  jobPostId: string,
  data: any,
  options?: { expectedETag?: string | null }
): Promise<JobPostResponseDto> => {
  const payload = { ...data };
  if (options?.expectedETag) {
    payload.expectedETag = options.expectedETag;
  }

  const response = await axiosInstance.put(
    `/jobpoststream/${jobPostId}`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return attachETag(response.data, response.headers);
};

const deleteJobPost = async (jobPostId: string): Promise<void> => {
  const response = await axiosInstance.delete(`/jobpoststream/${jobPostId}`, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const rename = async (
  jobPostId: string,
  title: string,
  options?: { expectedETag?: string | null }
): Promise<JobPostResponseDto> => {
  const payload: Record<string, any> = {
    jobTitle: title,
  };

  if (options?.expectedETag) {
    payload.expectedETag = options.expectedETag;
  }

  const response = await axiosInstance.put(
    `/jobpoststream/${jobPostId}/rename`,
    payload
  );
  return attachETag(response.data, response.headers);
};

const updateSectionContent = async (
  jobPostId: string,
  sectionName: string,
  content: string,
  options?: {
    expectedVersion?: string | null;
    expectedETag?: string | null;
  }
): Promise<JobPostResponseDto> => {
  const payload: Record<string, any> = {
    section: sectionName,
    content,
  };

  if (options?.expectedVersion) {
    payload.expectedVersion = options.expectedVersion;
  }
  if (options?.expectedETag) {
    payload.expectedETag = options.expectedETag;
  }

  const response = await axiosInstance.put(
    `/jobpoststream/${jobPostId}/section`,
    payload
  );
  return attachETag(response.data, response.headers);
};

const loadChatHistory = async (jobPostId: string) => {
  const response = await axiosInstance.get(`/chat/${jobPostId}`);
  return response.data;
};

const generateJobPost = async (data: requestApiType, userId: string) => {
  const requestBody = {
    userId: userId || null,
    ...data,
  };
  return axiosInstance
    .post("/jobpostcreator", requestBody)
    .then((res) => res)
    .catch((error) => {
      return (
        (error?.response?.data?.error && error?.response?.data?.error) ||
        error.response.message
      );
    });
};

const download = async (jobPostId: string) => {
  return axiosInstance.post(
    `/jobpoststream/${jobPostId}/export`,
    {},
    {
      responseType: "blob",
    }
  );
};

const uploadForEvaluation = async (jobPostId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return axiosInstance.post(
    `/jobpoststream/${jobPostId}/evaluation`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

const undo = async (jobPostId: string): Promise<JobPostResponseDto> => {
  const response = await axiosInstance.post(
    `/jobpoststream/${jobPostId}/undo`,
    {},
    { headers: { "Content-Type": "application/json" } }
  );
  return attachETag(response.data, response.headers);
};

const redo = async (jobPostId: string): Promise<JobPostResponseDto> => {
  const response = await axiosInstance.post(
    `/jobpoststream/${jobPostId}/redo`,
    {},
    { headers: { "Content-Type": "application/json" } }
  );
  return attachETag(response.data, response.headers);
};

const exportJobPost = async (data: string, fileName: string) => {
  return axiosInstance
    .post("/jobpostcreator/export", data, {
      responseType: "blob",
    })
    .then((res) => {
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error(error);
    });
};

const EditFieldJobPost = async (data: requestApiType, field: string) => {
  const requestBody = {
    ...data,
  };
  return axiosInstance
    .post(`/jobpostcreator/${field}`, requestBody)
    .then((res) => res.data)
    .catch((error) => {
      return (
        (error?.response?.data?.error && error?.response?.data?.error) ||
        error.response.message
      );
    });
};

export default {
  // SSE Streaming Methods
  generateEnhanced,
  chatEnhanced,
  modifyEnhanced,

  // CRUD Operations
  get,
  create,
  update,
  deleteJobPost,
  rename,
  updateSectionContent,
  download,
  uploadForEvaluation,
  undo,
  redo,
  generateJobPost,
  exportJobPost,
  EditFieldJobPost,
  loadChatHistory,
};
