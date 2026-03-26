import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import CanvasTextEditCard from "./CanvasTextEditCard";
import CanvasLoadingSkeleton from "./CanvasLoadingSkeleton";
import CanvasInitializeChatCard from "./CanvasInitializeChatCard";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { AnimatePresence, motion, easeOut } from "framer-motion";
import { Skeleton } from "@mui/material";
import { useCanvas } from "../../hooks/useCanvas";
import { useTranslation } from "react-i18next";
import { ChatMessage } from "../../models/chat-message";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useParams } from "react-router-dom";
import useSidebarStore from "../../stores/navigationStore";

interface CanvasProps {
  jobPostHeaders: string[];
}

interface ProcessedMessage extends ChatMessage {
  processedContent: React.ReactNode;
}

interface CanvasEditableSectionProps {
  htmlContent: string;
  isStreaming: boolean;
  isPlaceholder: boolean;
  placeholderLabel: string;
  isActive: boolean;
  onFocus: (e: React.FocusEvent<HTMLDivElement>) => void;
  onInput: (e: React.FormEvent<HTMLDivElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLDivElement>) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const CanvasEditableSection = React.memo(
  ({
    htmlContent,
    isStreaming,
    isPlaceholder,
    placeholderLabel,
    isActive,
    onFocus,
    onInput,
    onBlur,
    onMouseDown,
  }: CanvasEditableSectionProps) => {
    const divRef = useRef<HTMLDivElement>(null);
    const targetHtml = isPlaceholder
      ? `<div class="flex w-full italic text-left text-gray-300 cursor-pointer">${placeholderLabel}</div>`
      : htmlContent || "";

    useLayoutEffect(() => {
      const el = divRef.current;
      if (!el) return;

      // Don't update innerHTML if the element is currently focused (user is editing)
      // This prevents cursor reset during auto-save
      if (document.activeElement === el) {
        return;
      }

      if (el.innerHTML !== targetHtml) {
        el.innerHTML = targetHtml;
      }
    }, [targetHtml]);

    // Prevent Enter key from triggering form submission or page refresh
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        // Allow Enter to create new lines, but prevent form submission
        e.stopPropagation();
      }
    };

    return (
      <div
        ref={divRef}
        data-section-content
        contentEditable={!isStreaming}
        aria-disabled={isStreaming}
        suppressContentEditableWarning
        onFocus={onFocus}
        onInput={onInput}
        onBlur={onBlur}
        onMouseDown={onMouseDown}
        onKeyDown={handleKeyDown}
        className={`${
          isActive
            ? "bg-blue-400 text-superwhite"
            : "bg-transparent text-white-100"
        } ${
          isPlaceholder ? " italic text-left !text-gray-300" : "text-white-100"
        } rounded-xs px-1 transition-colors duration-300 w-full
        border-none outline-none whitespace-pre-wrap selection:bg-blue-400 selection:text-superwhite`}
      />
    );
  },
  (prev, next) =>
    prev.htmlContent === next.htmlContent &&
    prev.isStreaming === next.isStreaming &&
    prev.isPlaceholder === next.isPlaceholder &&
    prev.placeholderLabel === next.placeholderLabel &&
    prev.isActive === next.isActive,
);

const Canvas: React.FC<CanvasProps> = ({ jobPostHeaders }) => {
  const { t } = useTranslation();
  const {
    isStreamingCanvasContent,
    isSavingSection,
    overwriteActiveContentVersion,
    showPlaceholderMap,
    setShowPlaceholderMap,
    contentVersions,
    mapContentItemsToChatMessages,
    setIsStreamingCanvasContent,
    applyUpdates,
    streamController,
    modifyingSectionId,
    setEditingSectionId,
  } = useCanvas();
  const isMobileAndTablet = useMediaQuery("(max-width: 1200px)");
  const isBetween1200And1500 = useMediaQuery(
    "(min-width: 1200px) and (max-width: 1500px)",
  );
  const { isSidebarOpen } = useSidebarStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const jobPostId = useParams<{ jobPostId: string }>().jobPostId;

  // Debounce timer for auto-save
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  const [showTextEditCard, setShowTextEditCard] = useState(false);
  const [showInitializeChatCard, setShowInitializeChatCard] = useState(false);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [activeChatCardId, setActiveChatCardId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const textEditCardRef = useRef<HTMLDivElement>(null);
  const initChatCardRef = useRef<HTMLDivElement>(null);
  const [selectedSection, setSelectedSection] = useState<{
    sectionId: string | null;
    sectionTextReference: string;
    sectionRef?: string;
  }>({ sectionId: null, sectionTextReference: "" });
  const [dialogueSelectedText, setDialogueSelectedText] = useState<string>("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionContext, setSelectionContext] = useState<{
    beforeText: string;
    afterText: string;
  }>({ beforeText: "", afterText: "" });

  const selectionRef = useRef<Range | null>(null);

  const canvasContentWidth = " w-[90%] max-w-[38rem] lg:max-w-auto lg:w-[60%]";

  // Constants for context extraction
  const CONTEXT_WORDS_BEFORE = 20;
  const CONTEXT_WORDS_AFTER = 20;
  const MAX_CONTEXT_CHARS = 200;

  /**
   * Extracts surrounding text context for AI selection modifications.
   * Phase 0 implementation: Captures ~20 words before/after selection for better context.
   *
   * Uses Range offsets to precisely locate the selection, avoiding false matches
   * when the same text appears multiple times in a section.
   *
   * @param range - The DOM Range representing the text selection
   * @param wordsBefore - Number of words to capture before selection (default: 20)
   * @param wordsAfter - Number of words to capture after selection (default: 20)
   * @returns Object with beforeText and afterText strings
   */
  const extractSurroundingContext = (
    range: Range,
    wordsBefore: number = CONTEXT_WORDS_BEFORE,
    wordsAfter: number = CONTEXT_WORDS_AFTER,
  ): { beforeText: string; afterText: string } => {
    try {
      const startContainer = range.startContainer;

      // Get the parent section element
      const sectionContent = startContainer.parentElement?.closest(
        "[data-section-content]",
      ) as HTMLElement | null;

      if (!sectionContent) {
        return { beforeText: "", afterText: "" };
      }

      const fullText = sectionContent.innerText;
      const selectedText = range.toString();

      // Calculate precise selection position using Range offsets
      // This avoids false matches when the same text appears multiple times
      const rangeToStart = document.createRange();
      rangeToStart.selectNodeContents(sectionContent);
      rangeToStart.setEnd(range.startContainer, range.startOffset);
      const selectionStart = rangeToStart.toString().length;
      const selectionEnd = selectionStart + selectedText.length;

      // Extract before text
      const beforeFullText = fullText.substring(0, selectionStart);
      const beforeWords = beforeFullText
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .slice(-wordsBefore);
      let beforeText = beforeWords.join(" ");

      // Extract after text
      const afterFullText = fullText.substring(selectionEnd);
      const afterWords = afterFullText
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .slice(0, wordsAfter);
      let afterText = afterWords.join(" ");

      // Validate and truncate if needed
      if (beforeText.length > MAX_CONTEXT_CHARS) {
        console.warn(
          `[Canvas] beforeText truncated from ${beforeText.length} to ${MAX_CONTEXT_CHARS} chars`,
        );
        beforeText = beforeText.substring(
          beforeText.length - MAX_CONTEXT_CHARS,
        );
      }
      if (afterText.length > MAX_CONTEXT_CHARS) {
        console.warn(
          `[Canvas] afterText truncated from ${afterText.length} to ${MAX_CONTEXT_CHARS} chars`,
        );
        afterText = afterText.substring(0, MAX_CONTEXT_CHARS);
      }

      // Log for debugging in dev mode
      if (import.meta.env.MODE !== "production") {
        console.debug("[Canvas] Selection context extracted:", {
          selectedText:
            selectedText.substring(0, 50) +
            (selectedText.length > 50 ? "..." : ""),
          beforeText:
            beforeText.substring(0, 30) + (beforeText.length > 30 ? "..." : ""),
          afterText:
            afterText.substring(0, 30) + (afterText.length > 30 ? "..." : ""),
          beforeWords: beforeWords.length,
          afterWords: afterWords.length,
        });
      }

      return {
        beforeText: beforeText.trim(),
        afterText: afterText.trim(),
      };
    } catch (err) {
      console.warn("[Canvas] Failed to extract selection context:", err);
      return { beforeText: "", afterText: "" };
    }
  };

  const clearSelectionContext = () => {
    selectionRef.current = null;
    setDialogueSelectedText("");
    setSelectedSection({
      sectionId: null,
      sectionTextReference: "",
      sectionRef: undefined,
    });
    setIsSelectionMode(false);
    setSelectionContext({ beforeText: "", afterText: "" });
  };

  /**
   * Apply a custom highlight to the currently selected text.
   * Used when "Ask AI" is clicked to retain visual highlight while input is focused.
   */
  const applyHighlightToSelection = (): boolean => {
    const range = selectionRef.current;
    if (!range || range.collapsed) return false;

    try {
      // Create a highlight span
      const highlightSpan = document.createElement("span");
      highlightSpan.className = "canvas-ai-highlight";
      highlightSpan.style.backgroundColor = "#3c7995";
      highlightSpan.style.borderRadius = "2px";

      // Wrap the selected content in the highlight span
      range.surroundContents(highlightSpan);
      return true;
    } catch (err) {
      // surroundContents can fail if selection spans multiple elements
      // In that case, we'll just let the native selection disappear
      console.warn("[Canvas] Could not apply highlight to selection:", err);
      return false;
    }
  };

  /**
   * Remove custom AI highlight spans from the DOM.
   * Called when the AI chat input is closed or message is sent.
   */
  const removeAiHighlight = () => {
    document.querySelectorAll("span.canvas-ai-highlight").forEach((span) => {
      const parent = span.parentNode;
      while (span.firstChild) parent?.insertBefore(span.firstChild, span);
      parent?.removeChild(span);
    });
  };

  // Clean up highlight spans from HTML string or live DOM
  const removeAllHighlightedSpans = (html?: string): string => {
    if (html) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      // Remove both legacy .highlight and new .canvas-ai-highlight spans
      const highlights = tempDiv.querySelectorAll(
        "span.highlight, span.canvas-ai-highlight",
      );
      highlights.forEach((highlight) => {
        const parent = highlight.parentNode;
        while (highlight.firstChild)
          parent?.insertBefore(highlight.firstChild, highlight);
        parent?.removeChild(highlight);
      });
      return tempDiv.innerHTML;
    } else {
      // Live DOM cleanup if any old highlights exist
      document
        .querySelectorAll("span.highlight, span.canvas-ai-highlight")
        .forEach((span) => {
          const parent = span.parentNode;
          while (span.firstChild) parent?.insertBefore(span.firstChild, span);
          parent?.removeChild(span);
        });
      return "";
    }
  };

  /**
   * Normalize contentEditable HTML to use <br> tags instead of <div> elements.
   * This ensures consistent behavior in Word export.
   *
   * The browser's contentEditable creates <div> elements when Enter is pressed,
   * but Word exporters expect <br> tags for line breaks.
   *
   * Transformation logic:
   * - "text<div>more</div>" → "text<br>more" (1 Enter = 1 newline)
   * - "text<div><span><br></span></div><div>more</div>" → "text<br><br>more" (2 Enters = 2 newlines)
   *
   * This function is idempotent - running it multiple times produces the same result.
   */
  const normalizeHtmlLineBreaks = (html: string): string => {
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Convert top-level <div> elements to <br> tags
      // Get only direct children divs (not nested ones)
      const divs = Array.from(tempDiv.children).filter(
        (el) => el.tagName === "DIV",
      );

      // If there are no divs, return original HTML (already normalized)
      if (divs.length === 0) {
        return html;
      }

      // Process in reverse to avoid issues with DOM manipulation
      divs.reverse().forEach((div) => {
        // Check if there's already a <br> right before this div
        const prevSibling = div.previousSibling;
        const hasPreviousBr = prevSibling?.nodeName === "BR";

        // Check if div only contains formatting tags with <br> inside (empty line)
        const divText = div.textContent?.trim() || "";
        const hasBr = div.querySelector("br") !== null;
        const isEmptyLine = divText === "" && hasBr;

        if (isEmptyLine) {
          // Empty line with <br> inside
          if (hasPreviousBr) {
            // Already have a <br> before this empty div → just remove the div
            // This prevents: text<br><div><br></div> → text<br><br>
            div.parentNode?.removeChild(div);
          } else {
            // No previous <br> → replace div with one <br>
            const br = document.createElement("br");
            div.parentNode?.replaceChild(br, div);
          }
        } else {
          // Line with content → add <br> before content (if not already there), remove div wrapper
          if (!hasPreviousBr) {
            const br = document.createElement("br");
            div.parentNode?.insertBefore(br, div);
          }

          // Move div's children out
          while (div.firstChild) {
            div.parentNode?.insertBefore(div.firstChild, div);
          }
          div.parentNode?.removeChild(div);
        }
      });

      return tempDiv.innerHTML;
    } catch (error) {
      console.error("[Canvas] Error normalizing HTML:", error);
      // Return original HTML if normalization fails
      return html;
    }
  };

  const clearSelectionInCanvas = () => {
    // Clear native selection across browsers
    const sel = window.getSelection?.();
    try {
      if (sel) {
        if (typeof sel.empty === "function")
          sel.empty(); // Chrome
        else if (typeof sel.removeAllRanges === "function")
          sel.removeAllRanges(); // Firefox
      }
    } catch {
      try {
        window.getSelection()?.removeAllRanges();
      } catch {}
    }

    // Blur active element to avoid re-selections inside contentEditable
    (document.activeElement as HTMLElement | null)?.blur?.();

    // Clear local selection context/state
    selectionRef.current = null;
    setDialogueSelectedText("");
    setSelectedText("");
    setSelectedSection({
      sectionId: null,
      sectionTextReference: "",
      sectionRef: undefined,
    });
    setIsSelectionMode(false);
    setSelectionContext({ beforeText: "", afterText: "" });

    // Close cards
    setShowTextEditCard(false);
    setShowInitializeChatCard(false);
    setActiveChatCardId(null);
  };

  useEffect(() => {
    if (!isStreamingCanvasContent) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isStreamingCanvasContent]);

  // Close + clear on outside click (capture to run early)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const node = e.target as Node;
      if (wrapperRef.current?.contains(node)) return;
      if (canvasRef.current?.contains(node)) return;
      clearSelectionInCanvas();
    };
    document.addEventListener("mousedown", handleOutsideClick, true);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick, true);
  }, []);

  const getParentSectionId = (node: Node | null): string | null => {
    while (node) {
      if (
        node instanceof HTMLElement &&
        node.dataset &&
        node.dataset["messageId"]
      ) {
        return node.dataset["messageId"];
      }
      node = node.parentNode!;
    }
    return null;
  };

  const getSectionDomRefs = (sectionId: string) => {
    const sectionEl = document.querySelector(
      `[data-message-id="${sectionId}"]`,
    ) as HTMLElement | null;
    if (!sectionEl) return { sectionEl: null, headerEl: null, contentEl: null };
    const headerEl = sectionEl.querySelector("h3") as HTMLElement | null;
    const contentEl = sectionEl.querySelector(
      "[data-section-content]",
    ) as HTMLElement | null;
    return { sectionEl, headerEl, contentEl };
  };

  const getFullSectionText = (
    contentEl: HTMLElement,
    asHtml = false,
  ): string => {
    if (!contentEl) return "";
    if (asHtml) return removeAllHighlightedSpans(contentEl.innerHTML); // legacy cleanup
    return contentEl.innerText.trim();
  };

  // Triple-click: select entire section (includes formatting)
  const selectEntireSection = (sectionId: string) => {
    const { contentEl } = getSectionDomRefs(sectionId);
    if (!contentEl) return;
    contentEl.focus();
    const range = document.createRange();
    range.selectNodeContents(contentEl);
    const sel = window.getSelection?.();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  };

  // Formatting actions
  const applyBoldFormatting = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.focus();
    document.execCommand("bold", false);
  };
  const applyItalicFormatting = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.focus();
    document.execCommand("italic", false);
  };

  // Chat card activation per section
  const handleChatCardActivation = (messageId: string) => {
    setActiveChatCardId((prevId) => (prevId === messageId ? null : messageId));
    clearSelectionContext(); // no highlights now
    const { headerEl, contentEl } = getSectionDomRefs(messageId);
    const headerText = headerEl?.textContent?.trim() ?? "";
    const fullText = contentEl ? getFullSectionText(contentEl, false) : "";
    setSelectedSection({
      sectionId: messageId,
      sectionTextReference: headerText,
      sectionRef: headerText,
    });
    setDialogueSelectedText(fullText);
    setIsSelectionMode(false);
  };

  const closeAllCards = () => {
    removeAiHighlight(); // Remove custom highlight when closing cards
    clearSelectionContext();
    clearSelectionInCanvas();
  };

  const handleInitializeChat = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    // Apply custom highlight before showing chat input (native selection will be lost on focus)
    applyHighlightToSelection();
    setShowInitializeChatCard(true);
    setShowTextEditCard(false);
  };

  const hasSelection = showTextEditCard || selectedText.trim().length > 0;

  const activeContent = contentVersions || [];
  const dialogueMessages: ChatMessage[] =
    mapContentItemsToChatMessages(activeContent);

  // Placeholder helpers
  const originalContentRef = useRef<Record<string, string>>({});
  const handleFocus = (
    e: React.FocusEvent<HTMLDivElement>,
    sectionId: string,
  ) => {
    if (isStreamingCanvasContent) return;
    setEditingSectionId(sectionId);
    // Store innerHTML (not trimmed) to preserve exact formatting for comparison
    originalContentRef.current[sectionId] = e.currentTarget.innerHTML;
    if (showPlaceholderMap[sectionId]) {
      e.currentTarget.innerText = "";
      setShowPlaceholderMap((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  // Debounced input handler - auto-saves 5 seconds after user stops typing
  const handleInput = (
    e: React.FormEvent<HTMLDivElement>,
    sectionId: string,
  ) => {
    if (showInitializeChatCard) return;
    if (isStreamingCanvasContent) return;

    // Capture the current element reference (React events are pooled)
    const element = e.currentTarget;

    // Clear existing timer for this section
    if (debounceTimerRef.current[sectionId]) {
      clearTimeout(debounceTimerRef.current[sectionId]);
    }

    // Set new timer; we rely on blur to save eagerly
    debounceTimerRef.current[sectionId] = setTimeout(() => {
      // Preserve exact HTML structure (don't trim) to maintain newlines
      let currentContent = element.innerHTML;
      currentContent = removeAllHighlightedSpans(currentContent);
      // Normalize <div> elements to <br> tags for proper Word export
      const normalizedContent = normalizeHtmlLineBreaks(currentContent);
      const originalContent = originalContentRef.current[sectionId];

      // Check if content is effectively empty (only whitespace/line breaks)
      const trimmedForCheck = normalizedContent.trim();
      const isEffectivelyEmpty =
        trimmedForCheck === "" ||
        trimmedForCheck === "<br>" ||
        trimmedForCheck === "<div><br></div>";

      if (normalizedContent !== originalContent) {
        // DON'T update innerHTML during auto-save - it resets cursor position!
        // Only update on blur when user leaves the section

        if (isEffectivelyEmpty) {
          setShowPlaceholderMap((prev) => ({ ...prev, [sectionId]: true }));
          overwriteActiveContentVersion(sectionId, "");
        } else {
          overwriteActiveContentVersion(sectionId, normalizedContent);
        }
        // Update original content after save
        originalContentRef.current[sectionId] = normalizedContent;
      }
    }, 5000);
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLDivElement>,
    sectionId: string,
  ) => {
    e.preventDefault();
    if (showInitializeChatCard) return;
    if (isStreamingCanvasContent) return;

    // Clear any pending debounce timer and save immediately on blur
    if (debounceTimerRef.current[sectionId]) {
      clearTimeout(debounceTimerRef.current[sectionId]);
      delete debounceTimerRef.current[sectionId];
    }

    // Preserve exact HTML structure (don't trim) to maintain newlines
    let currentContent = e.currentTarget.innerHTML;
    currentContent = removeAllHighlightedSpans(currentContent);
    // Normalize <div> elements to <br> tags for proper Word export
    const normalizedContent = normalizeHtmlLineBreaks(currentContent);
    const originalContent = originalContentRef.current[sectionId];

    // DEBUG: Log the HTML structure being saved
    console.log("[Canvas Debug] Saving content for section:", sectionId);
    console.log(
      "[Canvas Debug] HTML being saved (after normalization):",
      normalizedContent,
    );
    console.log("[Canvas Debug] HTML length:", normalizedContent.length);
    console.log(
      "[Canvas Debug] Number of <br> tags:",
      (normalizedContent.match(/<br>/gi) || []).length,
    );
    console.log(
      "[Canvas Debug] Number of <div> tags:",
      (normalizedContent.match(/<div>/gi) || []).length,
    );

    // Check if content is effectively empty (only whitespace/line breaks)
    const trimmedForCheck = normalizedContent.trim();
    const isEffectivelyEmpty =
      trimmedForCheck === "" ||
      trimmedForCheck === "<br>" ||
      trimmedForCheck === "<div><br></div>";

    if (normalizedContent !== originalContent) {
      // Update the DOM immediately to prevent visual duplication
      if (normalizedContent !== currentContent) {
        e.currentTarget.innerHTML = normalizedContent;
      }

      if (isEffectivelyEmpty) {
        setShowPlaceholderMap((prev) => ({ ...prev, [sectionId]: true }));
        overwriteActiveContentVersion(sectionId, "");
      } else {
        overwriteActiveContentVersion(sectionId, normalizedContent);
      }
      // Update original content after save
      originalContentRef.current[sectionId] = normalizedContent;
    }
    setEditingSectionId((current) => (current === sectionId ? null : current));
  };

  const getFullTextByMessageId = (messageId: string): string => {
    const contentEl = document.querySelector(
      `[data-message-id="${messageId}"] [data-section-content]`,
    ) as HTMLElement | null;
    return contentEl ? contentEl.innerText.trim() : "";
  };

  // Click on canvas clears residual selection when no cards are open
  const handleCanvasPointerDown = () => {
    if (isStreamingCanvasContent) return;
    const anyCardOpen =
      showTextEditCard || showInitializeChatCard || activeChatCardId !== null;
    if (anyCardOpen) return;
    const sel = window.getSelection?.();
    if (sel && !sel.isCollapsed && sel.toString().trim()) {
      clearSelectionInCanvas();
    }
  };

  // Track if user is currently selecting (mousedown state)
  const isSelectingRef = useRef(false);

  // Handle mousedown to track when user starts selecting
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (canvasRef.current?.contains(e.target as Node)) {
        isSelectingRef.current = true;
      }
    };

    const handleMouseUp = () => {
      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        // Trigger selection handler after mouse is released
        setTimeout(() => handleSelectionComplete(), 50);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isStreamingCanvasContent,
    showTextEditCard,
    showInitializeChatCard,
    activeChatCardId,
  ]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimerRef.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  const handleSelectionComplete = () => {
    if (isStreamingCanvasContent) return;

    const sel = document.getSelection?.();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      // Don't clear selection context if chat card is open - preserve selected text for chat
      if (showInitializeChatCard || activeChatCardId) {
        return;
      }

      if (showTextEditCard) setShowTextEditCard(false);
      selectionRef.current = null;
      setDialogueSelectedText("");
      setIsSelectionMode(false);
      setSelectionContext({ beforeText: "", afterText: "" });
      return;
    }

    const anchor = sel.anchorNode;
    const focus = sel.focusNode;
    if (
      !anchor ||
      !focus ||
      !canvasRef.current?.contains(anchor) ||
      !canvasRef.current?.contains(focus)
    ) {
      // Don't clear selection context if chat card is open
      if (showInitializeChatCard || activeChatCardId) {
        return;
      }

      if (showTextEditCard) setShowTextEditCard(false);
      selectionRef.current = null;
      setDialogueSelectedText("");
      setIsSelectionMode(false);
      setSelectionContext({ beforeText: "", afterText: "" });
      return;
    }

    const startId = getParentSectionId(anchor);
    const endId = getParentSectionId(focus);
    if (!startId || !endId || startId !== endId) {
      // Don't clear selection context if chat card is open
      if (showInitializeChatCard || activeChatCardId) {
        return;
      }

      if (showTextEditCard) setShowTextEditCard(false);
      selectionRef.current = null;
      setDialogueSelectedText("");
      setIsSelectionMode(false);
      setSelectionContext({ beforeText: "", afterText: "" });
      return;
    }

    // Persist selection and context
    const range = sel.getRangeAt(0);
    selectionRef.current = range.cloneRange();
    const selectedTextValue = sel.toString();
    setDialogueSelectedText(selectedTextValue);

    // Extract surrounding context for AI (Phase 0 implementation)
    const context = extractSurroundingContext(range);
    setSelectionContext(context);

    const headerText =
      (document.querySelector(`[data-message-id="${startId}"] h3`)
        ?.textContent ||
        "") ??
      "";
    setSelectedSection({
      sectionId: startId,
      sectionTextReference: headerText,
      sectionRef: headerText,
    });

    // Get all the rects for the selection to find where it ends
    const rects = Array.from(range.getClientRects());

    // The popup is positioned relative to the parent section (position: relative)
    // We need to get the bounding rect of that positioned ancestor
    const positionedParent = canvasRef.current?.parentElement;
    const parentRect = positionedParent?.getBoundingClientRect();

    if (!parentRect || !positionedParent) {
      console.error("[Selection] Could not find positioned parent");
      return;
    }

    // IMPORTANT: Account for scroll offset of the scrollable parent
    const scrollTop = positionedParent.scrollTop;
    const scrollLeft = positionedParent.scrollLeft;

    // Determine if selecting downwards
    const anchorBeforeFocus =
      sel.anchorNode === range.startContainer &&
      sel.anchorOffset === range.startOffset;

    // Get the exact position where the user's cursor ended (the focus point)
    let cursorRect: DOMRect;
    try {
      // Create a range at the exact focus point
      const focusRange = document.createRange();
      focusRange.setStart(sel.focusNode!, sel.focusOffset);
      focusRange.setEnd(sel.focusNode!, sel.focusOffset);

      // Get the rect at this exact position
      const focusRects = focusRange.getClientRects();
      cursorRect =
        focusRects.length > 0
          ? focusRects[0]
          : focusRange.getBoundingClientRect();
    } catch (err) {
      // Fallback: use first or last rect based on direction
      cursorRect = anchorBeforeFocus
        ? rects[rects.length - 1] || range.getBoundingClientRect()
        : rects[0] || range.getBoundingClientRect();
    }

    // Position at the exact cursor location
    // cursorRect gives us a zero-width position at the focus point
    // Add scrollLeft to account for horizontal scroll
    const cardWidth = 280;

    // Downward: right border aligns with cursor (cursor on right side of selection)
    // Upward: left border aligns with cursor (cursor on left side of selection)
    const x = anchorBeforeFocus
      ? cursorRect.left - parentRect.left + scrollLeft - cardWidth - 7 // Right border at cursor for downward (subtract 5px to align)
      : cursorRect.left - parentRect.left + scrollLeft; // Left border at cursor for upward

    // Position vertically based on selection direction
    // Add scrollTop to account for vertical scroll
    const cardHeight = 60;
    const y = anchorBeforeFocus
      ? cursorRect.bottom - parentRect.top + scrollTop + 10 // Below when selecting down
      : cursorRect.top - parentRect.top + scrollTop - cardHeight - 7; // Above when selecting up

    console.log("[Selection Position Debug]", {
      cursorRect: {
        top: cursorRect.top,
        left: cursorRect.left,
        right: cursorRect.right,
        bottom: cursorRect.bottom,
      },
      parentRect: { top: parentRect.top, left: parentRect.left },
      scroll: { scrollTop, scrollLeft },
      focusNode: sel.focusNode?.nodeName,
      focusOffset: sel.focusOffset,
      calculatedX: x,
      calculatedY: y,
      selectionRects: rects.length,
      anchorBeforeFocus,
    });

    setCardPosition({ x, y });

    if (!showTextEditCard) setShowTextEditCard(true);
    setIsSelectionMode(true);
  };

  // Escape clears selection if no card is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const anyCardOpen =
        showTextEditCard || showInitializeChatCard || activeChatCardId !== null;
      if (!anyCardOpen) clearSelectionInCanvas();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showTextEditCard, showInitializeChatCard, activeChatCardId]);

  return (
    <AnimatePresence>
      <motion.section
        key="canvas-fade"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className=" flex w-full relative h-full mx-auto !z-[99999999] overflow-y-auto pl-0 mt-[3.4rem] md:mt-[4.6rem] pb-[10rem]  md:pb-[7rem] "
      >
        {isStreamingCanvasContent && (
          <div className="pointer-events-none absolute inset-0 z-[103]">
            <div className="absolute top-3 right-6 bg-gray-700/80 text-white-100 text-xs px-2 py-1 rounded-md shadow flex items-center gap-2">
              <span className="inline-block h-3 w-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              {t("common:updating")}
            </div>
          </div>
        )}

        {isSavingSection && (
          <div className="pointer-events-none absolute inset-0 z-[103]">
            <div className="absolute top-3 right-6 bg-gray-700/80 text-white-100 text-xs px-2 py-1 rounded-md shadow flex items-center gap-2">
              <span className="inline-block h-3 w-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              {t("common:saving")}
            </div>
          </div>
        )}

        <>
          <AnimatePresence>
            <motion.div
              ref={wrapperRef}
              key="canvas-wrapper-fadein"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="w-full relative overflow-x-hidden"
            >
              <motion.div
                ref={canvasRef}
                onPointerDown={handleCanvasPointerDown}
                className={`${canvasContentWidth} mx-auto gap-4 !outline-none !border-none`}
                animate={{
                  x:
                    activeChatCardId &&
                    !isMobileAndTablet &&
                    !(isSidebarOpen && isBetween1200And1500)
                      ? `calc(-10vw - min(16px, 60%))`
                      : "0vw",
                }}
                transition={{ duration: 0.3, ease: easeOut }}
              >
                {dialogueMessages.map((message, index) => {
                  const isPlaceholderActive = showPlaceholderMap[message.id];
                  const placeholderLabel = t(
                    "job-post-creator:temporaryContent.placeholderText",
                  );

                  // Debug: Log when checking modification state
                  if (index === 0 && modifyingSectionId) {
                    console.log("[Canvas] Checking modifying state:", {
                      modifyingSectionId,
                      messageIds: dialogueMessages.map((m) => m.id),
                    });
                  }

                  return (
                    <div
                      key={message.id}
                      data-message-id={message.id}
                      className="p-4 flex flex-col items-start gap-1 group !relative w-full"
                    >
                      {/* Loading overlay when section is being modified */}
                      {modifyingSectionId === message.id && (
                        <div className="absolute inset-0 bg-gray-800/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2 text-white-100">
                            <div className="inline-block h-8 w-8 border-4 border-white/70 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium">
                              Modifying section...
                            </span>
                          </div>
                        </div>
                      )}

                      <h3
                        className="text-[16px] font-semibold select-none leading-normal pl-1 py-2 opacity-25 mb-2"
                        onMouseDown={(e) => {
                          // Triple-click header selects entire section (event.detail >= 3 is widely supported).
                          if (e.detail >= 3) {
                            e.preventDefault();
                            e.stopPropagation();
                            selectEntireSection(message.id);
                          }
                        }}
                      >
                        {message.header}
                      </h3>

                      <div className="flex flex-col items-start w-full text-md font-body">
                        {isStreamingCanvasContent &&
                        (!message.content || message.content.trim() === "") ? (
                          // Show skeleton for this section while waiting for content
                          <div className="w-full flex flex-col gap-2">
                            {Array.from({ length: 3 }).map(
                              (_, skeletonIndex) => (
                                <div
                                  key={skeletonIndex}
                                  className="rounded-lg bg-gray-650 overflow-hidden w-full"
                                >
                                  <Skeleton
                                    variant="rectangular"
                                    width="100%"
                                    height={24}
                                    animation="pulse"
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <CanvasEditableSection
                            htmlContent={message.content || ""}
                            isStreaming={isStreamingCanvasContent}
                            isPlaceholder={!!isPlaceholderActive}
                            placeholderLabel={placeholderLabel}
                            isActive={activeChatCardId === message.id}
                            onFocus={(e) => handleFocus(e, message.id)}
                            onInput={(e) => handleInput(e, message.id)}
                            onBlur={(e) => handleBlur(e, message.id)}
                            onMouseDown={(e) => {
                              if (e.detail >= 3) {
                                e.preventDefault();
                                e.stopPropagation();
                                selectEntireSection(message.id);
                              }
                            }}
                          />
                        )}
                      </div>

                      {/* Chat activation button */}
                      <button
                        onClick={() => handleChatCardActivation(message.id)}
                        className={`${
                          activeChatCardId === message.id || hasSelection
                            ? "hidden"
                            : "flex"
                        } absolute top-6 -right-[1rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white-100 mt-6 outline-none border-none`}
                      >
                        <IoChatbubbleEllipsesOutline size={24} />
                      </button>

                      {/* Initialize Chat Card */}
                      {activeChatCardId === message.id &&
                        (() => {
                          const fullSectionText = isSelectionMode
                            ? dialogueSelectedText
                            : dialogueSelectedText ||
                              getFullTextByMessageId(message.id);
                          return (
                            <CanvasInitializeChatCard
                              ref={initChatCardRef}
                              onClose={() => {
                                removeAiHighlight();
                                setActiveChatCardId(null);
                              }}
                              closeAllCards={closeAllCards}
                              showInitializeChatCard={showInitializeChatCard}
                              selectionRef={selectionRef}
                              dialogueHeaderRef={message.header}
                              dialogueMessageId={message.id}
                              dialogueSelectedText={fullSectionText}
                              selectionContext={selectionContext}
                            />
                          );
                        })()}
                    </div>
                  );
                })}
              </motion.div>

              {/* Text Edit Card */}
              {showTextEditCard && (
                <CanvasTextEditCard
                  position={cardPosition}
                  onClose={() => clearSelectionInCanvas()} // one click closes and deselects
                  canvasRect={canvasRef.current?.getBoundingClientRect()}
                  handleInitializeChat={handleInitializeChat}
                  applyBoldFormatting={applyBoldFormatting}
                  applyItalicFormatting={applyItalicFormatting}
                />
              )}

              {/* Initialize Chat Card for Text Selection */}
              {showInitializeChatCard && (
                <CanvasInitializeChatCard
                  ref={textEditCardRef}
                  onClose={() => {
                    removeAiHighlight();
                    setShowInitializeChatCard(false);
                  }}
                  position={cardPosition}
                  setShowTextEditCard={setShowTextEditCard}
                  closeAllCards={closeAllCards}
                  showInitializeChatCard={showInitializeChatCard}
                  selectionRef={selectionRef}
                  dialogueHeaderRef={selectedSection.sectionRef}
                  dialogueMessageId={selectedSection.sectionId || undefined}
                  dialogueSelectedText={dialogueSelectedText}
                  selectionContext={selectionContext}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      </motion.section>
    </AnimatePresence>
  );
};

export default Canvas;
