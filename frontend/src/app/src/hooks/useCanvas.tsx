import { useCallback, useEffect } from "react";
import {
  useCanvasContext,
  MessageSource,
  SendMessagePayload,
  ContentItem,
} from "../contexts/CanvasContext";
import { ChatMessage } from "../models/chat-message";
import { v4 as uuidv4 } from "uuid";
import { MessageRole, MessageRoleString } from "../models/chat-message-role";
import handleCopyContent from "../utils/handleCopyContent";
import jobPostService from "../services/jobPostService";
const { chatEnhanced } = jobPostService;
import type {
  SSEEvent,
  ChatStartEvent,
  ChatChunkEvent,
  ChatCompleteEvent,
  ModificationCompleteEvent,
  StreamErrorEvent,
} from "../pages/feature-job-post-creator/sseEvents";
import { useParams } from "react-router-dom";
import { notificationsService } from "../services/notificationsService";
import { useTranslation } from "react-i18next";
import { JobPostResponseDto } from "src/pages/feature-job-post-creator/types";
import useChatHistoryStore from "../stores/chatHistoryStore";
import { ChatHistoryDto } from "../interfaces/interfaces";
import {
  CANONICAL_SECTIONS,
  toCanonicalSection,
  getSectionLabel,
  SectionId,
} from "../pages/feature-job-post-creator/sections";
import { JobPostState } from "../pages/feature-job-post-creator/types";

const deriveVersionState = (state: JobPostState) => {
  const versionCounter = state.versionCounter ?? state.snapshotVersion ?? 0;
  const redoStack = state.redoStack ?? [];

  return {
    versionCounter,
    redoStack,
    hasRedo: redoStack.length > 0 || !!state.canRedo,
    hasUndo:
      typeof state.canUndo === "boolean" ? state.canUndo : versionCounter > 1,
    headVersionId: state.headVersionId ?? null,
    currentVersionId: state.currentVersionId ?? null,
    sectionVersions: state.sectionVersions ?? {},
  };
};

const normalizeSections = (
  sections: JobPostState["sections"]
): Record<string, string> => {
  if (Array.isArray(sections)) {
    return sections.reduce<Record<string, string>>((acc, section) => {
      const key = section.id;
      acc[key] = section.html ?? section.text ?? "";
      return acc;
    }, {});
  }
  return sections ?? {};
};

export function useCanvas() {
  const ctx = useCanvasContext();

  // Destructure the context states we need for Canvas logic
  const {
    canvasTitle,
    setCanvasTitle,
    isCanvasMode,
    setIsCanvasMode,
    isStreamingCanvasContent,
    setIsStreamingCanvasContent,
    isStreamingCanvasChatMessages,
    setIsStreamingCanvasChatMessages,
    isSavingSection,
    setIsSavingSection,
    showPlaceholderMap,
    setShowPlaceholderMap,
    currentChatMessages,
    setCurrentChatMessages,
    contentVersions,
    setContentVersions,
    documentETag,
    setDocumentETag,
    editingSectionId,
    setEditingSectionId,
    pendingSections,
    setPendingSections,
    headVersionId,
    setHeadVersionId,
    currentVersionId,
    setCurrentVersionId,
    versionCounter,
    setVersionCounter,
    redoStack,
    setRedoStack,
    sectionVersions,
    setSectionVersions,
    modifyingSectionId,
    setModifyingSectionId,

    currentVersionIndex,
    setCurrentVersionIndex,

    pointsToVersionIndex,
    setPointsToVersionIndex,

    hasPreviousContent,
    setHasPreviousContent,
    hasNextContent,
    setHasNextContent,

    streamController,
    setIsDefaultView,
    setIsGeneratedJobPost,
    regenerateContentSignal,
    setRegenrateContentSignal,
  } = ctx;

  const jobPostId = useParams<{ jobPostId: string }>().jobPostId;
  const { i18n, t } = useTranslation();

  // Debug helper: logs only in non-production builds
  const __isProd = import.meta.env.MODE === "production";
  const __debug = (...args: any[]) => {
    if (!__isProd) console.debug(...args);
  };

  // ------------------------- Canvas Handlers ------------------------- //

  const applyUpdates = useCallback(
    (response: JobPostResponseDto) => {
      try {
        const versionState = deriveVersionState(response.state);
        const sectionsMap = normalizeSections(response.state.sections);
        const sectionKeys = Object.keys(sectionsMap);
        const snapshotETag =
          response.state.eTag ??
          response.state.etag ??
          (response.state as any)?._etag ??
          null;
        setDocumentETag(snapshotETag ?? null);
        __debug("[Canvas] applyUpdates() response summary", {
          currentVersionId: versionState.currentVersionId,
          headVersionId: versionState.headVersionId,
          versionCounter: versionState.versionCounter,
          redoStack: versionState.redoStack?.length,
          sectionKeys,
        });

        if (response.chatHistory?.length) {
          // Merge server-provided chat history with existing messages without losing prior context.
          // - Replace by id when present
          // - Append new ones
          // - De-duplicate adjacent identical user messages (common when server echoes the user's prompt)
          const incoming = response.chatHistory.map((message: any) => {
            return new ChatMessage(
              message.id,
              message.content,
              message.role,
              message.date || message.timestamp, // Support both 'date' and 'timestamp'
              false,
              message.files || [],
              message.header,
              message.agent,
              message.selectedText // Preserve selectedText from history
            );
          });

          setCurrentChatMessages((prev) => {
            const indexById = new Map(prev.map((m, i) => [m.id, i] as const));
            const merged = [...prev];
            for (const msg of incoming) {
              const idx = indexById.get(msg.id);
              if (idx !== undefined) {
                merged[idx] = msg;
              } else {
                merged.push(msg);
              }
            }
            // De-duplicate adjacent identical user messages by content
            const deduped: ChatMessage[] = [];
            for (const msg of merged) {
              const last = deduped[deduped.length - 1];
              if (
                last &&
                last.role === MessageRoleString[MessageRole.User] &&
                msg.role === MessageRoleString[MessageRole.User] &&
                last.content.trim() === msg.content.trim()
              ) {
                // Prefer the latest (server) instance
                deduped[deduped.length - 1] = msg;
              } else {
                deduped.push(msg);
              }
            }
            return deduped;
          });
        }

        const sanitize = (s: string) => s.replace(/[\s_-]/g, "").toLowerCase();

        setContentVersions((prev) => {
          if (!prev.length) {
            // If we don't yet have local content, bootstrap directly from the backend payload
            return CANONICAL_SECTIONS.map((id) => ({
              id,
              header: getSectionLabel(t, id),
              text: sectionsMap[id] ?? "",
            }));
          }

          let changed = false;

          const next = prev.map((item) => {
            // Find the backend key that matches this item.id
            const key = sectionKeys.find(
              (k) => sanitize(k) === sanitize(item.id)
            );
            if (!key) {
              console.warn(`Unable to detect section with id ${item.id}`);
              return item;
            }

            // Resolve canonical id defensively from backend key
            const canonical = toCanonicalSection(key) ?? (item.id as SectionId);
            const newHeader = getSectionLabel(t, canonical);
            const newText = sectionsMap[key] ?? "";

            if (editingSectionId && editingSectionId === canonical) {
              // Skip updating text while user is editing this section
              if (item.header !== newHeader || item.id !== canonical) {
                changed = true;
                return {
                  ...item,
                  id: canonical,
                  header: newHeader,
                };
              }
              return item;
            }
            if (pendingSections[canonical]) {
              if (item.header !== newHeader || item.id !== canonical) {
                changed = true;
                return { ...item, id: canonical, header: newHeader };
              }
              return item;
            }

            if (
              item.id === canonical &&
              item.header === newHeader &&
              item.text === newText
            ) {
              return item;
            }

            changed = true;
            return {
              ...item,
              id: canonical,
              header: newHeader,
              text: newText,
            };
          });

          return changed ? next : prev;
        });

        setCurrentVersionIndex(versionState.versionCounter);
        setVersionCounter(versionState.versionCounter);
        setHeadVersionId(versionState.headVersionId);
        setCurrentVersionId(versionState.currentVersionId);
        setRedoStack(versionState.redoStack);
        setSectionVersions(versionState.sectionVersions);
        setHasPreviousContent(versionState.hasUndo);
        setHasNextContent(versionState.hasRedo);
        setPointsToVersionIndex(versionState.versionCounter);
      } catch (err) {
        console.error("[Canvas] applyUpdates failed:", err);
      }
    },
    [
      setCurrentChatMessages,
      setContentVersions,
      setHasPreviousContent,
      setHasNextContent,
      setCurrentVersionIndex,
      setVersionCounter,
      setHeadVersionId,
      setCurrentVersionId,
      setRedoStack,
      setSectionVersions,
      editingSectionId,
      pendingSections,
      setDocumentETag,
      setPointsToVersionIndex,
      t,
    ]
  );

  useEffect(() => {
    setContentVersions((prev) =>
      prev.map((item) => {
        const canonical = toCanonicalSection(item.id);
        return {
          ...item,
          header: canonical
            ? getSectionLabel(t, canonical as SectionId)
            : item.header ?? String(item.id),
        };
      })
    );
  }, [i18n.language, setContentVersions, t]);

  const regenerateActiveCanvasContent = () => {
    setRegenrateContentSignal((prev) => prev + 1);
  };

  const goToPreviousCanvasContentVersion = useCallback(() => {
    if (!jobPostId) {
      return;
    }
    setIsStreamingCanvasContent(true);
    __debug("[Canvas] Undo requested", { jobPostId });

    jobPostService
      .undo(jobPostId)
      .then((jobPostUpdateResponse) => {
        const versionState = deriveVersionState(jobPostUpdateResponse.state);
        const sectionsMap = normalizeSections(
          jobPostUpdateResponse.state.sections
        );
        __debug("[Canvas] Undo response", {
          currentVersionId: versionState.currentVersionId,
          headVersionId: versionState.headVersionId,
          versionCounter: versionState.versionCounter,
          redoStack: versionState.redoStack?.length,
          sectionKeys: Object.keys(sectionsMap),
        });
        applyUpdates(jobPostUpdateResponse);
      })
      .catch((error: any) => {
        const status = error?.response?.status;
        if (status === 409) {
          notificationsService.warn(
            t("job-post-creator:notifications.versioning.contention")
          );
          jobPostService
            .get(jobPostId)
            .then(applyUpdates)
            .catch(() =>
              notificationsService.warn(
                t("job-post-creator:notifications.versioning.refreshFailed")
              )
            );
          return;
        }

        notificationsService.error(
          t("job-post-creator:notifications.undo.error")
        );
        console.error("[Canvas] Undo failed:", error);
      })
      .finally(() => {
        setIsStreamingCanvasContent(false);
      });
  }, [jobPostId, applyUpdates, setIsStreamingCanvasContent]);

  const goToNextCanvasContentVersion = useCallback(() => {
    if (!jobPostId) {
      return;
    }

    setIsStreamingCanvasContent(true);
    __debug("[Canvas] Redo requested", { jobPostId });

    jobPostService
      .redo(jobPostId)
      .then((jobPostUpdateResponse) => {
        const versionState = deriveVersionState(jobPostUpdateResponse.state);
        const sectionsMap = normalizeSections(
          jobPostUpdateResponse.state.sections
        );
        __debug("[Canvas] Redo response", {
          currentVersionId: versionState.currentVersionId,
          headVersionId: versionState.headVersionId,
          versionCounter: versionState.versionCounter,
          redoStack: versionState.redoStack?.length,
          sectionKeys: Object.keys(sectionsMap),
        });
        applyUpdates(jobPostUpdateResponse);
      })
      .catch((error: any) => {
        const status = error?.response?.status;
        if (status === 409) {
          notificationsService.warn(
            t("job-post-creator:notifications.versioning.contention")
          );
          jobPostService
            .get(jobPostId)
            .then(applyUpdates)
            .catch(() =>
              notificationsService.warn(
                t("job-post-creator:notifications.versioning.refreshFailed")
              )
            );
          return;
        }

        notificationsService.error(
          t("job-post-creator:notifications.redo.error")
        );
        console.error("[Canvas] Redo failed:", error);
      })
      .finally(() => {
        setIsStreamingCanvasContent(false);
      });
  }, [jobPostId, applyUpdates, setIsStreamingCanvasContent]);

  /** Reset only the Canvas session states**/
  const resetCanvasSession = useCallback(() => {
    setIsCanvasMode(false);
    setIsStreamingCanvasContent(false);
    setContentVersions([]);
    setDocumentETag(null);
    setHeadVersionId(null);
    setCurrentVersionId(null);
    setVersionCounter(0);
    setRedoStack([]);
    setSectionVersions({});
    setPendingSections({});
    setCurrentVersionIndex(0);
    setPointsToVersionIndex(0);
    setHasPreviousContent(false);
    setHasNextContent(false);
    setEditingSectionId(null);
  }, [
    setIsCanvasMode,
    setIsStreamingCanvasContent,
    setContentVersions,
    setDocumentETag,
    setHeadVersionId,
    setCurrentVersionId,
    setVersionCounter,
    setRedoStack,
    setSectionVersions,
    setPendingSections,
    setCurrentVersionIndex,
    setPointsToVersionIndex,
    setHasPreviousContent,
    setHasNextContent,
    setEditingSectionId,
  ]);

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // Build HTML from your content versions
  const buildCanvasHtml = (
    versions: Array<{ header?: string; text?: string }>
  ): string => {
    return (versions || [])
      .map(({ header, text }) => {
        const h = (header || "").trim();
        const t = (text || "").trim();

        const headerHtml = h ? `<h3>${escapeHtml(h)}</h3>` : "";
        const bodyHtml = t
          ? `<p>${escapeHtml(t).replace(/(?:\r\n|\r|\n)/g, "<br>")}</p>`
          : "";

        // Separate sections with some spacing
        return `${headerHtml}${bodyHtml}`;
      })
      .filter(Boolean)
      .join("<br><br>");
  };
  const preprocessHtmlContent = (html: string): string => {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = html;

    let processedHtml = tempElement.innerHTML.replace(
      /(?:\r\n|\r|\n)/g,
      "<br>"
    );

    // Make all h1–h6 bold and sized, keeping semantic tags
    processedHtml = processedHtml.replace(
      /<h([1-6])[^>]*>(.*?)<\/h\1>/gi,
      (_match, level, inner) => {
        const sizeMap: Record<string, number> = {
          "1": 22,
          "2": 20,
          "3": 18,
          "4": 16,
          "5": 15,
          "6": 14,
        };
        const content = String(inner).replace(/<\/?strong>/gi, ""); // avoid nested <strong>
        return `<h${level} style="font-weight:600; font-size:${sizeMap[level]}px; line-height:1;"><strong>${content}</strong></h${level}>`;
      }
    );

    return processedHtml;
  };

  const copyCurrentCanvasContent = useCallback(async () => {
    try {
      const html = buildCanvasHtml(contentVersions || []);
      if (!html) {
        notificationsService.error("No content available to copy.");
        return;
      }

      await handleCopyContent({
        htmlToCopy: preprocessHtmlContent(html),
        errorMessage: "Copy failed!",
        successMessage: "Canvas content copied!",
        defaultFont: {
          fontFamily: "Calibri, sans-serif",
          fontSize: "15px",
          color: "#000",
        },
        setMessageCopyOk: () => {
          // optional: hook any local success UI here
        },
      });
    } catch (error) {
      console.error("[useCanvas] copyCurrentCanvasContent error:", error);
      notificationsService.error("Copy failed!");
    }
  }, [contentVersions]);

  const downloadCurrentCanvasContent = useCallback(async () => {
    try {
      if (!jobPostId) {
        return;
      }

      jobPostService
        .download(jobPostId!)
        .then((res) => {
          const blob = new Blob([res.data], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;

          const fileName = res.headers["x-file-name"];

          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          notificationsService.success(
            t("job-post-creator:notifications.download.success", {
              positionTitle: canvasTitle,
            })
          );
        })
        .catch((error) => {
          console.error(error);
        });
    } catch (error) {
      console.error("[useCanvas] downloadCurrentCanvasContent error:", error);
      notificationsService.error(
        t("job-post-creator:notifications.download.error")
      );
    }
  }, [contentVersions, currentVersionIndex, canvasTitle]);

  /** OVERWRITE ACTIVE CONTENT VERSION**/
  const overwriteActiveContentVersion = useCallback(
    (sectionId: string, newHTML: string) => {
      if (!jobPostId) {
        console.error("Job Post ID is required to send a message.");
        return;
      }
      const canonical = toCanonicalSection(sectionId);
      if (!canonical) {
        notificationsService.error("Please select a valid section.");
        return;
      }
      setContentVersions((prev) =>
        prev.map((item) =>
          item.id === canonical
            ? {
                ...item,
                text: newHTML,
              }
            : item
        )
      );
      setPendingSections((prev) => ({ ...prev, [canonical]: true }));
      setIsSavingSection(true);
      jobPostService
        .updateSectionContent(jobPostId, canonical, newHTML, {
          expectedVersion: sectionVersions[canonical] ?? null,
          expectedETag: documentETag ?? null,
        })
        .then((res) => {
          applyUpdates(res);
          setPendingSections((prev) => {
            const next = { ...prev };
            delete next[canonical];
            return next;
          });
        })
        .catch((error: any) => {
          setPendingSections((prev) => {
            const next = { ...prev };
            delete next[canonical];
            return next;
          });
          const status = error?.response?.status;
          if (status === 409) {
            const opCode = error?.response?.data?.code;
            if (opCode === "OPERATION_IN_PROGRESS") {
              notificationsService.warn(
                t("job-post-creator:notifications.versioning.contention")
              );
            } else {
              notificationsService.warn(
                t("job-post-creator:notifications.versioning.conflict")
              );
            }
            jobPostService
              .get(jobPostId)
              .then(applyUpdates)
              .catch(() =>
                notificationsService.warn(
                  t("job-post-creator:notifications.versioning.refreshFailed")
                )
              );
            return;
          }

          notificationsService.error(
            t("job-post-creator:notifications.sectionUpdate.error")
          );
          console.error("[Canvas] updateSectionContent failed:", error);
        })
        .finally(() => {
          setIsSavingSection(false);
        });
    },
    [
      applyUpdates,
      jobPostId,
      sectionVersions,
      documentETag,
      t,
      setIsSavingSection,
      setContentVersions,
      setPendingSections,
    ]
  );

  /** Helper to map an array of ContentItems to ChatMessages (for display).**/
  const mapContentItemsToChatMessages = useCallback((items: ContentItem[]) => {
    return items.map((item) => ({
      id: item.id,
      header: item.header,
      content: item.text,
      role: "assistant",
      date: new Date().toISOString(),
      error: false,
    }));
  }, []);

  /** Stop streaming**/
  const handleStopStreaming = useCallback(() => {
    if (streamController.current && !streamController.current.signal.aborted) {
      streamController.current.abort();
      setIsStreamingCanvasChatMessages(false);
      setIsStreamingCanvasContent(false); // reflect stop immediately in UI
    } else {
      // Even if there's no active controller, ensure UI reflects non-streaming
      setIsStreamingCanvasChatMessages(false);
      setIsStreamingCanvasContent(false);
    }
  }, [
    streamController,
    setIsStreamingCanvasChatMessages,
    setIsStreamingCanvasContent,
  ]);

  /**  Sending chat messages **/
  const handleSendCanvasMessage = useCallback(
    async (payload: SendMessagePayload) => {
      if (!jobPostId) {
        console.error("Job Post ID is required to send a message.");
        return;
      }

      const {
        inputValue,
        source = MessageSource.ChatInput,
        files = [],
        selectedText,
        sectionRef,
        sectionId,
      } = payload;

      // Use just the user's question for display in chat
      // The selected text is sent separately to the backend in the selectionContext
      const displayMessageContent = inputValue;

      // Abort any existing stream before starting new one
      if (
        streamController?.current &&
        !streamController.current.signal.aborted
      ) {
        streamController.current.abort();
      }

      // Add user message optimistically
      const userMessage = new ChatMessage(
        uuidv4(),
        displayMessageContent,
        MessageRoleString[MessageRole.User],
        new Date().toISOString(),
        false,
        files,
        undefined, // header
        undefined, // agent
        selectedText // selectedText - pass the selected text to the message
      );

      setCurrentChatMessages((prev) => [...prev, userMessage]);

      // Start streaming
      setIsStreamingCanvasChatMessages(true);
      setIsStreamingCanvasContent(true);

      const controller = new AbortController();
      if (streamController) streamController.current = controller;

      let assistantContent = "";
      const assistantMessageId = uuidv4();
      let receivedStreamEnded = false;

      try {
        await chatEnhanced(
          jobPostId,
          inputValue, // Send the user's question to the backend
          sectionId,
          selectedText
            ? {
                selectedText,
                beforeText: payload.beforeText, // ✅ Phase 0 complete: extracted in Canvas.tsx
                afterText: payload.afterText, // ✅ Phase 0 complete: extracted in Canvas.tsx
                startPosition: 0,
                endPosition: selectedText.length,
              }
            : undefined,
          true, // includeHistory - see service documentation for explanation
          controller.signal,
          userMessage.id, // clientMessageId - pass the optimistic user message ID
          assistantMessageId, // clientAssistantMessageId - pass the optimistic assistant message ID
          (event: SSEEvent) => {
            // Handle chat_start (intent classification)
            if ("type" in event && event.type === "chat_start") {
              const startEvent = event as ChatStartEvent;
              console.log("[SSE Chat Start Event]", {
                willModify: startEvent.willModify,
                targetSection: startEvent.targetSection,
                intent: startEvent.intent,
              });

              // If modification will happen, show loading on target section
              if (startEvent.willModify && startEvent.targetSection) {
                const canonical = toCanonicalSection(startEvent.targetSection);
                console.log("[Canvas] Setting modifyingSectionId:", {
                  original: startEvent.targetSection,
                  canonical: canonical,
                });
                if (canonical) {
                  setModifyingSectionId(canonical);
                }
              }
            }

            // Handle chat_chunk (streaming response)
            if ("type" in event && event.type === "chat_chunk") {
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
                          [],
                          undefined,
                          undefined,
                          undefined // No selectedText for assistant messages
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
                      [],
                      undefined,
                      undefined,
                      undefined // No selectedText for assistant messages
                    ),
                  ];
                }
              });
            }

            // Handle modification_queued (show loading on section)
            if ("type" in event && event.type === "modification_queued") {
              console.log("[SSE Modification Queued Event]", event);
              // Note: modification_queued doesn't include targetSection
              // Section should already be set from chat_start event
            }

            // Handle modification_progress (optional: could show progress percentage)
            if ("type" in event && event.type === "modification_progress") {
              // Progress updates - section is already in loading state
            }

            // Handle modification_complete (auto-apply changes)
            if ("type" in event && event.type === "modification_complete") {
              const modEvent = event as ModificationCompleteEvent;
              console.log("[SSE Modification Complete Event]", {
                sectionName: modEvent.modification.sectionName,
                contentLength:
                  modEvent.modification.completeSectionContent.length,
              });

              // Apply modification to content
              setContentVersions((prev) => {
                return prev.map((item) => {
                  const canonical = toCanonicalSection(
                    modEvent.modification.sectionName
                  );
                  if (item.id === canonical) {
                    return {
                      ...item,
                      text: modEvent.modification.completeSectionContent,
                    };
                  }
                  return item;
                });
              });

              // Clear modifying state
              console.log("[Canvas] Clearing modifyingSectionId");
              setModifyingSectionId(null);

              // Re-fetch job post state to update version indices
              // Note: Current implementation's applyUpdates() may already handle this
              // Verify during implementation that undo/redo state is properly updated
              jobPostService.get(jobPostId).then((response) => {
                applyUpdates(response);
              });

              // Show success notification
              notificationsService.success("Section updated successfully");
            }

            // Handle chat_complete
            if ("type" in event && event.type === "chat_complete") {
              receivedStreamEnded = true;
              setIsStreamingCanvasChatMessages(false);
              setIsStreamingCanvasContent(false);
            }

            // Handle stream-ended (legacy support)
            if ("Content" in event && event.Content === "stream-ended") {
              receivedStreamEnded = true;
              setIsStreamingCanvasChatMessages(false);
              setIsStreamingCanvasContent(false);
            }

            // Handle errors
            if ("type" in event && event.type === "error") {
              const errEvent = event as StreamErrorEvent;

              // Clear modifying state on error
              setModifyingSectionId(null);

              // Show error notification
              if (errEvent.recoverable) {
                notificationsService.error(
                  `${errEvent.message} (You can retry)`
                );
              } else {
                notificationsService.error(errEvent.message);
              }

              setIsStreamingCanvasChatMessages(false);
              setIsStreamingCanvasContent(false);
            }
          }
        );
      } catch (err) {
        setModifyingSectionId(null);
        notificationsService.error(
          t("job-post-creator:notifications.chat.error")
        );
        setIsStreamingCanvasChatMessages(false);
        setIsStreamingCanvasContent(false);
      } finally {
        // STREAM TERMINATION DETECTION
        if (!receivedStreamEnded) {
          notificationsService.warn(
            "Chat response interrupted - message may be incomplete"
          );
        }

        if (streamController) streamController.current = null;
      }
    },
    [
      jobPostId,
      streamController,
      setCurrentChatMessages,
      setIsStreamingCanvasChatMessages,
      setIsStreamingCanvasContent,
      setContentVersions,
      applyUpdates,
      t,
    ]
  );

  /**
   * Resets **all** states (Canvas + Job Post) in the context.
   * You can optionally pass in a callback to also reset some custom states
   * (like job post states if you wish).
   */
  const resetAllStates = useCallback(
    (resetJobPostStates?: () => void) => {
      // Reset Canvas states
      setIsCanvasMode(false);
      setIsStreamingCanvasContent(false);
      setIsStreamingCanvasChatMessages(false);
      setContentVersions([]);
      setCurrentChatMessages([]);
      setCanvasTitle("");
      setDocumentETag(null);
      setHeadVersionId(null);
      setCurrentVersionId(null);
      setVersionCounter(0);
      setRedoStack([]);
      setSectionVersions({});
      setPendingSections({});
      setCurrentVersionIndex(0);
      setPointsToVersionIndex(0);
      setHasPreviousContent(false);
      setHasNextContent(false);
      setEditingSectionId(null);

      // Optionally reset jobpost states
      if (resetJobPostStates) {
        resetJobPostStates();
      }
    },
    [
      setIsCanvasMode,
      setIsStreamingCanvasContent,
      setIsStreamingCanvasChatMessages,
      setCurrentVersionIndex,
      setContentVersions,
      setCurrentChatMessages,
      setCanvasTitle,
      setDocumentETag,
      setHeadVersionId,
      setCurrentVersionId,
      setVersionCounter,
      setRedoStack,
      setSectionVersions,
      setPendingSections,
      setPointsToVersionIndex,
      setHasPreviousContent,
      setHasNextContent,
      setEditingSectionId,
    ]
  );

  const handleCloseCanvas = () => {
    setIsDefaultView(true);
    setIsGeneratedJobPost(true);
    setIsStreamingCanvasContent(false);
    setIsCanvasMode(false);
  };

  const handleNavigateCanvas = () => {
    setIsDefaultView(false);
    setIsCanvasMode(true);
  };

  const handleRename = (updatedTitle: string) => {
    if (jobPostId && updatedTitle?.length > 0) {
      jobPostService
        .rename(jobPostId, updatedTitle, {
          expectedETag: documentETag ?? null,
        })
        .then((response) => {
          setCanvasTitle(response.jobPost.title);
          applyUpdates(response);

          // Update the chat history sidebar title locally (JobPost type)
          try {
            const store = useChatHistoryStore.getState();
            // JobPost chats are not workspace-scoped; use empty workspace key
            store.updateChat(
              "JobPost",
              { id: jobPostId } as ChatHistoryDto,
              response.jobPost.title,
              null
            );
          } catch (err) {
            console.error(
              "[useCanvas] Failed to update chat history title:",
              err
            );
          }
        })
        .catch((error: any) => {
          const status = error?.response?.status;
          if (status === 409) {
            const opCode = error?.response?.data?.code;
            notificationsService.warn(
              opCode === "OPERATION_IN_PROGRESS"
                ? t("job-post-creator:notifications.versioning.contention")
                : t("job-post-creator:notifications.versioning.conflict")
            );
            jobPostService
              .get(jobPostId)
              .then(applyUpdates)
              .catch(() =>
                notificationsService.warn(
                  t("job-post-creator:notifications.versioning.refreshFailed")
                )
              );
            return;
          }

          notificationsService.error(
            t("job-post-creator:notifications.rename.error")
          );
          console.error("[useCanvas] rename failed:", error);
        });
    }
  };

  // Return all relevant Canvas states and handlers
  return {
    // States from context (Canvas specific)
    canvasTitle,
    setCanvasTitle,
    isCanvasMode,
    setIsCanvasMode,
    isStreamingCanvasContent,
    setIsStreamingCanvasContent,
    isStreamingCanvasChatMessages,
    setIsStreamingCanvasChatMessages,
    isSavingSection,
    setIsSavingSection,
    showPlaceholderMap,
    setShowPlaceholderMap,
    currentChatMessages,
    setCurrentChatMessages,
    contentVersions,
    setContentVersions,
    documentETag,
    setDocumentETag,
    editingSectionId,
    setEditingSectionId,
    headVersionId,
    setHeadVersionId,
    currentVersionId,
    setCurrentVersionId,
    versionCounter,
    setVersionCounter,
    redoStack,
    setRedoStack,
    sectionVersions,
    setSectionVersions,
    modifyingSectionId,
    setModifyingSectionId,

    currentVersionIndex,
    setCurrentVersionIndex,
    pointsToVersionIndex,
    setPointsToVersionIndex,

    hasPreviousContent,
    setHasPreviousContent,
    hasNextContent,
    setHasNextContent,

    regenerateContentSignal,

    // Canvas Handlers
    regenerateActiveCanvasContent,
    goToPreviousCanvasContentVersion,
    goToNextCanvasContentVersion,
    resetCanvasSession,
    handleStopStreaming,
    copyCurrentCanvasContent,
    downloadCurrentCanvasContent,
    overwriteActiveContentVersion,
    mapContentItemsToChatMessages,
    handleSendCanvasMessage,
    resetAllStates,
    handleCloseCanvas,
    handleNavigateCanvas,
    handleRename,
    applyUpdates,
    // Expose controller so stream starters can register their controller
    streamController,
  };
}
