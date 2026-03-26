import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { ChatMessage, ChatFileMetadata } from "../models/chat-message";
import { SectionId } from "src/pages/feature-job-post-creator/sections";

export interface ContentItem {
  id: SectionId | string;
  header: string;
  text: string;
  failed?: boolean;  // True when section generation failed (Content: null from backend)
}

export enum MessageSource {
  ChatInput = "ChatInput",
  HighlightCard = "HighlightCard",
}

export interface SendMessagePayload {
  inputValue: string;
  source?: MessageSource;
  files?: ChatFileMetadata[];
  isEditing?: boolean;
  messageRef?: string;
  selectedText?: string;
  beforeText?: string;  // Phase 0: Surrounding context before selection
  afterText?: string;   // Phase 0: Surrounding context after selection
  sectionId?: string;
  sectionRef?: string;
}

interface CanvasContextState {
  // -------------------- Canvas-Related States -------------------- //

  canvasTitle: string;
  setCanvasTitle: React.Dispatch<React.SetStateAction<string>>;
  isCanvasMode: boolean;
  setIsCanvasMode: React.Dispatch<React.SetStateAction<boolean>>;
  isStreamingCanvasContent: boolean;
  setIsStreamingCanvasContent: React.Dispatch<React.SetStateAction<boolean>>;
  isStreamingCanvasChatMessages: boolean;
  setIsStreamingCanvasChatMessages: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  isSavingSection: boolean;
  setIsSavingSection: React.Dispatch<React.SetStateAction<boolean>>;
  showPlaceholderMap: Record<string, boolean>;
  setShowPlaceholderMap: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  currentChatMessages: ChatMessage[];
  setCurrentChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;

  contentVersions: ContentItem[];
  setContentVersions: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  documentETag: string | null;
  setDocumentETag: React.Dispatch<React.SetStateAction<string | null>>;
  editingSectionId: string | null;
  setEditingSectionId: React.Dispatch<React.SetStateAction<string | null>>;
  pendingSections: Record<string, boolean>;
  setPendingSections: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  headVersionId: string | null;
  setHeadVersionId: React.Dispatch<React.SetStateAction<string | null>>;
  currentVersionId: string | null;
  setCurrentVersionId: React.Dispatch<React.SetStateAction<string | null>>;
  versionCounter: number;
  setVersionCounter: React.Dispatch<React.SetStateAction<number>>;
  redoStack: string[];
  setRedoStack: React.Dispatch<React.SetStateAction<string[]>>;
  sectionVersions: Record<string, string>;
  setSectionVersions: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  modifyingSectionId: string | null;
  setModifyingSectionId: React.Dispatch<React.SetStateAction<string | null>>;

  pointsToVersionIndex: number;
  setPointsToVersionIndex: React.Dispatch<React.SetStateAction<number>>;

  maxVersionIndex: number;
  setMaxVersionIndex: React.Dispatch<React.SetStateAction<number>>;

  currentVersionIndex: number;
  setCurrentVersionIndex: React.Dispatch<React.SetStateAction<number>>;

  hasPreviousContent: boolean;
  setHasPreviousContent: React.Dispatch<React.SetStateAction<boolean>>;

  hasNextContent: boolean;
  setHasNextContent: React.Dispatch<React.SetStateAction<boolean>>;

  streamController: React.MutableRefObject<AbortController | null>;

  // ------------------- Job Post-Related States ------------------- //

  isGeneratedJobPost: boolean;
  setIsGeneratedJobPost: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isDefaultView: boolean;
  setIsDefaultView: React.Dispatch<React.SetStateAction<boolean>>;
  positionTitle: string;
  setPositionTitle: React.Dispatch<React.SetStateAction<string>>;
  isHeaderBackgroundRemoved: boolean;
  setIsHeaderBackgroundRemoved: React.Dispatch<React.SetStateAction<boolean>>;
  resetFormSignal: number;
  setResetFormSignal: React.Dispatch<React.SetStateAction<number>>;
  isGeneratedJobPostReadyToCopy: boolean;
  setIsGeneratedJobPostReadyToCopy: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  formSubmitted: boolean;
  setFormSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  activeGeneratedContent: ContentItem[];
  formattedContent: string;
  jobPostStreamingSystemMessage: string;
  jobPostGeneratedSystemMessage: string;

  regenerateContentSignal: number;
  setRegenrateContentSignal: React.Dispatch<React.SetStateAction<number>>;
}

const CanvasContext = createContext<CanvasContextState | undefined>(undefined);
export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ------------- Canvas-Related States ------------- //
  const [canvasTitle, setCanvasTitle] = useState("");
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [isStreamingCanvasContent, setIsStreamingCanvasContent] =
    useState(false);
  const [isStreamingCanvasChatMessages, setIsStreamingCanvasChatMessages] =
    useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);

  const [showPlaceholderMap, setShowPlaceholderMap] = useState<
    Record<string, boolean>
  >({});
  const [currentChatMessages, setCurrentChatMessages] = useState<ChatMessage[]>(
    []
  );
  const [contentVersions, setContentVersions] = useState<ContentItem[]>([]);
  const [documentETag, setDocumentETag] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [pendingSections, setPendingSections] = useState<Record<string, boolean>>(
    {}
  );
  const [headVersionId, setHeadVersionId] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [versionCounter, setVersionCounter] = useState(0);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [sectionVersions, setSectionVersions] = useState<Record<string, string>>(
    {}
  );
  const [modifyingSectionId, setModifyingSectionId] = useState<string | null>(null);

  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [pointsToVersionIndex, setPointsToVersionIndex] = useState(0);
  const [maxVersionIndex, setMaxVersionIndex] = useState(0);

  const [hasPreviousContent, setHasPreviousContent] = useState(false);
  const [hasNextContent, setHasNextContent] = useState(false);

  const streamController = useRef<AbortController | null>(null);

  // ------------- Job Post-Related States ------------- //
  const [isGeneratedJobPost, setIsGeneratedJobPost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDefaultView, setIsDefaultView] = useState(true);
  const [positionTitle, setPositionTitle] = useState("New Job Post");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [isHeaderBackgroundRemoved, setIsHeaderBackgroundRemoved] = useState(
    !isDefaultView || isCanvasMode
  );

  const [isGeneratedJobPostReadyToCopy, setIsGeneratedJobPostReadyToCopy] =
    useState(false);

  const [resetFormSignal, setResetFormSignal] = useState(0);
  const [regenerateContentSignal, setRegenrateContentSignal] = useState(0);

  // ------------- Derived States for the Job Post ------------- //

  const activeGeneratedContent = useMemo(() => {
    return contentVersions || [];
  }, [contentVersions]);

  const formattedContent = useMemo(() => {
    return activeGeneratedContent
      .map(({ header, text }) => `${header}\n${text}`)
      .join("\n\n");
  }, [activeGeneratedContent]);

  const jobPostStreamingSystemMessage = "Streaming job post content...";
  const jobPostGeneratedSystemMessage = `A new job post (${positionTitle}) has been generated.`;

  useEffect(() => {
    setIsHeaderBackgroundRemoved(!isDefaultView || isCanvasMode);
  }, [isDefaultView, isCanvasMode]);

  const contextValue: CanvasContextState = {
    // Canvas states
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

    maxVersionIndex,
    setMaxVersionIndex,

    hasPreviousContent,
    setHasPreviousContent,
    hasNextContent,
    setHasNextContent,

    streamController,

    // Job Post states
    isGeneratedJobPost,
    setIsGeneratedJobPost,
    isLoading,
    setIsLoading,
    isDefaultView,
    setIsDefaultView,
    positionTitle,
    setPositionTitle,
    isHeaderBackgroundRemoved,
    setIsHeaderBackgroundRemoved,
    resetFormSignal,
    setResetFormSignal,
    isGeneratedJobPostReadyToCopy,
    setIsGeneratedJobPostReadyToCopy,
    formSubmitted,
    setFormSubmitted,

    // Derived states
    activeGeneratedContent,
    formattedContent,
    jobPostStreamingSystemMessage,
    jobPostGeneratedSystemMessage,

    regenerateContentSignal,
    setRegenrateContentSignal,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};

export function useCanvasContext(): CanvasContextState {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within a CanvasProvider");
  }
  return context;
}
