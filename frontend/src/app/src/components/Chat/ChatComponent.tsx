import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useMsal } from "@azure/msal-react";
import { Box, CircularProgress } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";
import {
  ChatMessage,
  ChatFileMetadata,
  ImageGenerationItem,
  ChatStreamItem,
} from "../../models/chat-message";
import { ChatHistoryDto, ChatHistoryRef } from "../../interfaces/interfaces";
import { SelectedValueContext } from "../../contexts/SelectedValueContext";
import { MessageRole, MessageRoleString } from "../../models/chat-message-role";
import { useMsGraphApi } from "../../services/graph";
import { fetchEventSource } from "../../services/fetch";
import axiosInstance from "../../services/axiosInstance";
import ChatInput, { UnsentAttachmentsSummary } from "./ChatInput";
import { ChatdialogueBox } from "./ChatDialogueBox";
import ChatPredefinedPrompts from "./ChatPredefinedPrompts";
import useScrollToBottom from "../../hooks/useScrollToBottom";
import "./chat-page.css";
import { ChatFooter } from "./ChatFooter";
import { WorkspaceMemberDto } from "../../models/workspace-model";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import ChatHeader from "./ChatHeader";
import { TbAlertCircle, TbX } from "react-icons/tb";
import { IconType } from "react-icons";
import launchpadMetrics from "../../services/launchpadMetrics";
import { chatExportService } from "../../services/chatExportService";
import { notificationsService } from "../../services/notificationsService";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { ALLOWED_FILE_EXTENSIONS } from "./ChatInput";
import { FaRegImage } from "react-icons/fa6";
import { HiDocumentText } from "react-icons/hi";
import { motion, AnimatePresence, easeInOut, easeIn } from "framer-motion";
import ScrollableFeed from "react-scrollable-feed";
import { getEnabledTools, getToolsMetadata } from "../../utils/chatToolsUtils";
import { WorkspaceDto } from "../../models/workspace-model";
import {
  getModelSupportsTools,
  getModelSupportsDocuments,
  getModelSupportsImages,
  getModelIsReasoningModel,
} from "../../models/models-config";
import { WorkspaceFileDto } from "../../models/workspace-model";
import CanvasChat from "../../components/Canvas/CanvasChat";
import { useCanvas } from "../../hooks/useCanvas";
import { useJobPost } from "../../hooks/useJobPost";
import WorkspaceAvatar from "../Workspaces/workspace-avatar";
import useSidebarStore from "../../stores/navigationStore";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";
import ChatList from "./ChatList";
import useAgentsStore from "../../stores/agentsStore";
import { useSharePointClassicGroups } from "../../hooks/useSharePointClassicGroups";
import { useLocation } from "react-router-dom";
import { useScrollStore } from "../../stores/scrollStore";
import ChatScrollArrow from "./ChatScrollArrow";
import {
  agentHasTool,
  DATA_ANALYST_AGENT_TOOL,
  normalizeAgentFromSnapshot,
} from "../../models/agent-model";
import { spaCodeAndNativeAccountIdPresent } from "node_modules/@azure/msal-browser/dist/error/BrowserAuthErrorCodes";

const config = window.env;

interface ChatComponentProps {
  chatType: string;
  accentColor?: string;
  title?: string;
  welcomeMessage?: string;
  description?: string;
  moduleName?: string;
  isModelSelectable?: boolean;
  hasHistory?: boolean;
  predefinedPrompts?: any[] | null;
  workspaceId?: string | undefined;
  workspaceImage?: string | undefined;
  owner?: WorkspaceMemberDto;
  detailsLoading?: boolean;
  isProcessing?: boolean;
  hasFailedFiles?: boolean;
  Icon?: React.ReactElement | IconType;
  iconSize?: number;
  advancedFileAnalysis?: boolean;
  userWorkspaces?: WorkspaceDto[] | undefined;
  workspaceFiles?: WorkspaceFileDto[];
  loadingText?: string;
  showWelcome?: boolean;
  isExternalApplicationWithCanvas?: boolean;
  placeholderText?: string;
  entrySource?: string;
}

interface ChatInputRef {
  handleFilesUpload: (files: File[]) => Promise<void>;
  triggerUpload: () => void;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  chatType,
  accentColor,
  title = "",
  welcomeMessage,
  description = "",
  moduleName,
  predefinedPrompts = null,
  isModelSelectable = true,
  hasHistory = true,
  workspaceId,
  workspaceImage,
  owner,
  detailsLoading,
  isProcessing,
  hasFailedFiles,
  Icon,
  iconSize,
  advancedFileAnalysis,
  userWorkspaces,
  workspaceFiles,
  loadingText,
  showWelcome,
  isExternalApplicationWithCanvas = false,
  placeholderText,
  entrySource,
}) => {
  const { t } = useTranslation();

  const handleErrorNotification = useCallback(
    (error: any, customMessage?: string) => {
      let errorMessage =
        customMessage || "An error occurred. Please try again later.";
      if (!customMessage && error && error.status) {
        if (error.status === 403) {
          errorMessage = t("components:chatComponent.messages.forbidden");
        }
      }
      setCurrentChatMessages((prevMessages) => {
        if (prevMessages.length === 0) {
          return [
            new ChatMessage(
              uuidv4(),
              errorMessage,
              MessageRoleString[MessageRole.Assistant],
              new Date().toISOString(),
              true
            ),
          ];
        }

        const newMessages = prevMessages.slice(0, -1);
        const lastMessage = prevMessages[prevMessages.length - 1];
        const updatedLastMessage = {
          ...lastMessage,
          content: errorMessage,
          error: true,
        };

        return [...newMessages, updatedLastMessage];
      });
    },
    [t]
  );

  const {
    isCanvasMode,
    setIsCanvasMode,
    currentChatMessages: canvasChatMessages,
  } = useCanvas();
  const { handleDownloadClick } = useJobPost();
  const { isSidebarOpen } = useSidebarStore();

  const streamController = useRef<AbortController | null>(null);
  const activeStreamIdRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const chatHistoryRef = useRef<ChatHistoryRef>(null);
  // Store only the index and affected messages for edit restoration (memory optimization)
  const [editRestoreData, setEditRestoreData] = useState<{
    messageIndex: number;
    affectedMessages: ChatMessage[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isStreaming, setisStreaming] = useState(false);
  const [userClosedStream, setUserClosedStream] = useState(false);
  const [isNewChatRequest, setIsNewChatRequest] = useState<boolean>(true);
  const [currentChat, setCurrentChat] = useState<ChatHistoryDto | null>(null);
  const [currentChatMessages, setCurrentChatMessages] = useState<ChatMessage[]>(
    []
  );
  const [currentChatTitle, setCurrentChatTitle] = useState<string>("");
  const [showProcessingMessage, setShowProcessingMessage] = useState(true);
  const [reasoningTags, setReasoningTags] = useState<string[]>([]);
  const { scrollableFeedRef, scrollToBottom } = useScrollToBottom();
  const { updateWorkspaceInteractionMutation } = useWorkspaces();

  const [isClosing, setIsClosing] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(
    showWelcome && (!currentChatMessages || currentChatMessages.length === 0)
  );
  const [showPromptCatalogue, setShowPromptCatalogue] =
    useState<boolean>(false);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [editedMessageId, setEditedMessageId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showWorkspacesList, setShowWorkspacesList] = useState(false);
  const [showWorkspacesFooterList, setShowWorkspacesFooterList] =
    useState(false);

  const location = useLocation();

  useEffect(() => {
    setIsShowPredefinedPrompts(currentChatMessages.length === 0);
  }, [currentChatMessages.length]);

  useEffect(() => {
    setIsCanvasMode(false);
  }, [setIsCanvasMode]);

  useEffect(() => {
    setShowWelcomeScreen(
      showWelcome && (!currentChatMessages || currentChatMessages.length === 0)
    );
  }, [showWelcome, currentChatMessages]);

  useEffect(() => {
    if (currentChatMessages.length > 0) {
      scrollableFeedRef.current?.scrollToBottom();
    }
  }, [currentChatMessages.length]);

  const {
    agents,
    selectedAgent,
    setShowAgentList,
    fetchAgents,
    selectAgent,
    showActiveAgentListButton,
    setShowActiveAgentListButton,
    resetAgents,
    agentsLoading,
    handleRemoveAgent,
  } = useAgentsStore();

  const {
    data: sharePointClassicGroups,
    isLoading: sharePointGroupsLoading,
  } = useSharePointClassicGroups({ enabled: chatType === "Normal" });

  const shouldHideMarcus =
    chatType === "Normal" && sharePointClassicGroups?.hasGroups !== true;

  const visibleAgents = useMemo(() => {
    if (!shouldHideMarcus) {
      return agents;
    }

    return agents.filter((agent) => {
      const agentName = (agent.name || "").trim().toLowerCase();
      return agentName !== "marcus";
    });
  }, [agents, shouldHideMarcus]);

  const getAgentUnavailableMessage = useCallback(
    (agentName?: string | null) =>
      t("components:chatComponent.messages.agentUnavailable", {
        agentName:
          agentName?.trim() ||
          t("components:chatComponent.messages.selectedAgentFallback"),
      }),
    [t]
  );

  const reconcileUnavailableSelectedAgent = useCallback(
    async (failedAgent?: { id?: string; name?: string | null }) => {
      if (!failedAgent?.id) return false;

      try {
        await fetchAgents(true);
        const latestAgents = useAgentsStore.getState().agents;
        const isStillAvailable = latestAgents.some(
          (agent) => String(agent.id) === String(failedAgent.id)
        );

        if (isStillAvailable) {
          return false;
        }

        handleRemoveAgent();
        setShowAgentList(false);
        setShowActiveAgentListButton(false);

        const unavailableMessage = getAgentUnavailableMessage(failedAgent.name);
        notificationsService.warn(unavailableMessage);
        handleErrorNotification(undefined, unavailableMessage);

        return true;
      } catch {
        return false;
      }
    },
    [
      fetchAgents,
      getAgentUnavailableMessage,
      handleErrorNotification,
      handleRemoveAgent,
      setShowAgentList,
      setShowActiveAgentListButton,
    ]
  );

  useEffect(() => {
    fetchAgents(); // Fetch agents when the component mounts
  }, []);

  useEffect(() => {
    if (!selectedAgent) return;

    const isAgentListReady =
      !agentsLoading && !(chatType === "Normal" && sharePointGroupsLoading);
    if (!isAgentListReady) return;

    const selectedAgentStillAvailable = visibleAgents.some(
      (agent) => String(agent.id) === String(selectedAgent.id)
    );

    if (selectedAgentStillAvailable) return;

    handleRemoveAgent();
    setShowAgentList(false);
    setShowActiveAgentListButton(false);
  }, [
    selectedAgent,
    agentsLoading,
    chatType,
    sharePointGroupsLoading,
    visibleAgents,
    handleRemoveAgent,
    setShowAgentList,
    setShowActiveAgentListButton,
  ]);

  useEffect(() => {
    // Reset agents whenever the location changes
    handleRemoveAgent();
    resetAgents();
    setShowAgentList(false);
    setShowActiveAgentListButton(false);
  }, [
    location.pathname,
    handleRemoveAgent,
    setShowAgentList,
    setShowActiveAgentListButton,
    resetAgents,
  ]);

  const handleAgentClick = (agentId: string) => {
    const agent = visibleAgents.find((a) => a.id === agentId);
    if (agent) {
      selectAgent(agent); // Update the selected agent in the Zustand store
      setShowAgentList(true); // Close the agent list
      setShowActiveAgentListButton(false); // Hide the "Agents" tab
    }
  };

  const handleCloseProcessingMessage = () => {
    setIsClosing(true);
    timeoutRef.current = window.setTimeout(() => {
      setShowProcessingMessage(false);
      setIsClosing(false);
      timeoutRef.current = null;
    }, 500); // Match the duration with the CSS transition duration
  };

  const updateConversationTitle = (newTitle: string) => {
    if (currentChat?.id && chatHistoryRef.current) {
      chatHistoryRef.current.updateConversationTitle(currentChat.id, newTitle);
      setCurrentChatTitle(newTitle);
    }
  };

  // Clean up the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Setting up sideabr default state depending whether on mobile or desktop

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };

    handleResize(); // Initial check

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedModelValueContext = useContext(SelectedValueContext);
  const { selectedValue } = selectedModelValueContext;
  const [isShowPredefinedPrompts, setIsShowPredefinedPrompts] = useState(true);
  const { accounts } = useMsal();

  const { getUserPhoto } = useMsGraphApi();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [streamEnded, setStreamEnded] = useState(false);
  const navigate = useNavigate();

  // Track previous workspaceId to reset chat when navigating between workspaces without remount
  const previousWorkspaceIdRef = useRef<string | undefined>(workspaceId);

  const fetchUserProfilePhoto = async () => {
    try {
      const photoUrl = await getUserPhoto();
      if (photoUrl) {
        setProfilePhoto(photoUrl);
      }
    } catch (error) {
      console.error("Error fetching user photo:", error);
    }
  };

  const handleNewMessage = (messageId: string | undefined, newContent: string) => {
    setCurrentChatMessages((prevMessages) => {
      if (prevMessages.length === 0) {
        console.error("No messages found to update.");
        return prevMessages; // Return the previous state unchanged
      }

      // Create a new array with all messages except the last one
      const updatedMessages = prevMessages.slice(0, -1);

      // Get the last message
      const lastMessage = prevMessages[prevMessages.length - 1];

      const existingStreamItems: ChatStreamItem[] = Array.isArray(
        lastMessage.streamItems
      )
        ? [...lastMessage.streamItems]
        : [];

      if (existingStreamItems.length === 0) {
        existingStreamItems.push({ type: "text", content: newContent });
      } else {
        const lastItem = existingStreamItems[existingStreamItems.length - 1];
        if (lastItem.type === "text") {
          existingStreamItems[existingStreamItems.length - 1] = {
            ...lastItem,
            content: lastItem.content + newContent,
          };
        } else {
          existingStreamItems.push({ type: "text", content: newContent });
        }
      }

      // Create an updated version of the last message
      const updatedLastMessage = {
        ...lastMessage,
        id: messageId || lastMessage.id, // Preserve the placeholder id until backend provides one
        content: lastMessage.content + newContent, // Append the new content
        streamItems: existingStreamItems,
      };

      // Add the updated last message to the array
      updatedMessages.push(updatedLastMessage);

      return updatedMessages; // Return the new array of messages
    });
  };

  const findLastAssistantIndex = (messages: ChatMessage[]): number => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === MessageRoleString[MessageRole.Assistant]) {
        return i;
      }
    }
    return messages.length - 1;
  };

  const upsertImageGeneration = (
    requestId: string,
    update: Partial<ImageGenerationItem> & Pick<ImageGenerationItem, "status">
  ) => {
    setCurrentChatMessages((prevMessages) => {
      if (prevMessages.length === 0) return prevMessages;

      const updatedMessages = [...prevMessages];
      let targetMessageIndex = -1;
      let targetItemIndex = -1;

      for (let i = updatedMessages.length - 1; i >= 0; i -= 1) {
        const items = updatedMessages[i].imageGenerations;
        if (!items || items.length === 0) continue;
        const itemIndex = items.findIndex(
          (item) => item.requestId === requestId
        );
        if (itemIndex !== -1) {
          targetMessageIndex = i;
          targetItemIndex = itemIndex;
          break;
        }
      }

      if (targetMessageIndex === -1) {
        targetMessageIndex = findLastAssistantIndex(updatedMessages);
        if (targetMessageIndex < 0) return prevMessages;
      }

      const targetMessage = updatedMessages[targetMessageIndex];
      const existingItems = Array.isArray(targetMessage.imageGenerations)
        ? [...targetMessage.imageGenerations]
        : [];
      const existingStreamItems: ChatStreamItem[] = Array.isArray(
        targetMessage.streamItems
      )
        ? [...targetMessage.streamItems]
        : [];

      if (targetItemIndex === -1) {
        existingItems.push({ ...update, requestId });
      } else {
        existingItems[targetItemIndex] = {
          ...existingItems[targetItemIndex],
          ...update,
          requestId,
        };
      }

      let updatedStreamItems = existingStreamItems;
      const hasImageStreamItem = existingStreamItems.some(
        (item) => item.type === "image" && item.requestId === requestId
      );

      let updatedContent = targetMessage.content;

      if (!hasImageStreamItem) {
        if (updatedStreamItems.length === 0 && targetMessage.content) {
          updatedStreamItems = [
            { type: "text", content: targetMessage.content },
          ];
        }
        updatedStreamItems = [
          ...updatedStreamItems,
          { type: "image", requestId },
        ];
        // Inject a content marker so that the interleaving position survives
        // backend round-trips (the marker is an HTML comment, invisible in
        // rendered markdown but parseable when reconstructing streamItems
        // from history).
        updatedContent =
          (updatedContent || "") + `\n\n<!-- IMG_GEN:${requestId} -->\n\n`;
      }

      updatedMessages[targetMessageIndex] = {
        ...targetMessage,
        content: updatedContent,
        imageGenerations: existingItems,
        streamItems:
          updatedStreamItems.length > 0
            ? updatedStreamItems
            : targetMessage.streamItems,
      };

      return updatedMessages;
    });
  };

  const handleImageGenerationEvent = (eventData: any): boolean => {
    const imageGeneration = eventData?.imageGeneration;
    if (!imageGeneration) return false;

    const { status, requestId, prompt, image, error } = imageGeneration;
    if (!status || !requestId) return true;

    switch (status) {
      case "started":
        setLoading(false);
        upsertImageGeneration(requestId, {
          status: "started",
          prompt,
          alt: prompt,
        });
        return true;
      case "partial":
        setLoading(false);
        if (image?.url) {
          upsertImageGeneration(requestId, {
            status: "partial",
            partialUrl: image.url,
            alt: image.alt || image.prompt || prompt,
            prompt: image.prompt || prompt,
            progress: imageGeneration.progress,
            partialIndex: image.index,
            totalPartials: image.total,
          });
        }
        return true;
      case "completed":
        setLoading(false);
        if (!image?.url) {
          upsertImageGeneration(requestId, {
            status: "failed",
            error: error || "Image generation returned no URL.",
            prompt,
          });
          return true;
        }
        upsertImageGeneration(requestId, {
          status: "completed",
          url: image.url,
          alt: image.alt || image.prompt || prompt,
          prompt: image.prompt || prompt,
        });
        return true;
      case "failed":
        setLoading(false);
        upsertImageGeneration(requestId, {
          status: "failed",
          error: error || "Image generation failed.",
          prompt,
        });
        return true;
      default:
        return true;
    }
  };

  const failPendingImageGenerations = (errorMessage: string) => {
    setCurrentChatMessages((prevMessages) => {
      let hasChanges = false;
      const updatedMessages = prevMessages.map((message) => {
        if (!message.imageGenerations || message.imageGenerations.length === 0) {
          return message;
        }

        let updatedItems: ImageGenerationItem[] | null = null;
        message.imageGenerations!.forEach((item, index) => {
          if (item.status === "started" || item.status === "partial") {
            if (!updatedItems) {
              updatedItems = [...message.imageGenerations!];
            }
            updatedItems[index] = {
              ...item,
              status: "failed",
              error: item.error || errorMessage,
            };
          }
        });

        if (updatedItems) {
          hasChanges = true;
          return {
            ...message,
            imageGenerations: updatedItems,
          };
        }

        return message;
      });

      return hasChanges ? updatedMessages : prevMessages;
    });
  };

  const initializeSSE = async (
    message: ChatMessage,
    isEditing: boolean = false
  ) => {
    setLoading(true);
    setisStreaming(true);

    const placeholderMessage = new ChatMessage(
      uuidv4(),
      "",
      MessageRoleString[MessageRole.Assistant],
      new Date().toISOString(),
      false
    );

    setCurrentChatMessages((prevState) => [...prevState, placeholderMessage]);

    try {
      const response = await axiosInstance.post(`/chat/${currentChat?.id}/message`, {
        content: message.content,
        role: "user"
      });

      const { content, completed } = response.data;

      setCurrentChatMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          content: content
        };
        return updatedMessages;
      });

      setLoading(false);
      setisStreaming(false);
      
      if (completed) {
        // Handle completion if needed
      }
    } catch (error) {
      console.error("Error sending message:", error);
      handleErrorNotification(error);
      setLoading(false);
      setisStreaming(false);
    }
  };

  const handleCloseStream = (userInvoked: boolean = false) => {
    if (streamController.current && !streamController.current.signal.aborted) {
      streamController.current.abort();
    }

    setReasoningTags([]);
    setisStreaming(false);
    setStreamEnded(true);
    setUserClosedStream(userInvoked);
    failPendingImageGenerations("Image generation was interrupted.");

    setLoading(false);

    // Restore original messages and reset editing state if stream is cancelled during editing
    if (editedMessageId) {
      if (editRestoreData) {
        setCurrentChatMessages((prevMessages) => {
          const messagesBeforeEdit = prevMessages.slice(
            0,
            editRestoreData.messageIndex
          );
          return [...messagesBeforeEdit, ...editRestoreData.affectedMessages];
        });
        setEditRestoreData(null);
      }
      setEditedMessageId(null);
    }

    // Do not update workspace interaction on mere navigation/stream close.
    // Interaction should be recorded only when a message stream completes.

    streamController.current = null;
    activeStreamIdRef.current = null;

    return;
  };

  useEffect(() => {
    fetchUserProfilePhoto();
    return () => {
      handleCloseStream();
    };
  }, []);

  // Initialize new chat session when component mounts
  useEffect(() => {
    newChatSession();
  }, []);

  // Reset chat state when workspace changes via navigation (e.g., Recent Workspaces)
  useEffect(() => {
    if (chatType !== "Workspace") return;

    const previousWorkspaceId = previousWorkspaceIdRef.current;
    if (
      previousWorkspaceId !== undefined &&
      workspaceId !== undefined &&
      previousWorkspaceId !== workspaceId
    ) {
      // Start a fresh chat for the new workspace
      newChatSession();
    }
    previousWorkspaceIdRef.current = workspaceId;
  }, [workspaceId, chatType]);

  useEffect(() => {
    if (streamEnded) {
      if (!userClosedStream) {
      } else {
        setUserClosedStream(false);
      }
      setStreamEnded(false); // Reset the flag
    }
  }, [streamEnded]);

  const fetchMessagesForChat = async (
    chatType: string | undefined,
    chatId: string
  ) => {
    try {
      const response = await axiosInstance.get(`/chat/${chatId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching messages for chat:", error);
      throw error;
    }
  };

  const minimumLoadingTime = 200;

  const isAssistantRole = (role: any) =>
    String(role ?? "").toLowerCase() === "assistant";

  const resolveAgentForMessage = (m: any, agentsList: any[]) => {
    // Prefer any agent object the backend sent
    const rawAgent =
      m.agent ??
      m.agentSnapshot ??
      m.assistantAgent ??
      m.Agent ??
      m.AgentSnapshot;
    const normalized = normalizeAgentFromSnapshot(rawAgent);
    if (normalized) {
      return normalized;
    }

    // Fallback: map agentId via store
    const agentId =
      m.agentId ?? m.AgentId ?? m.assistantAgentId ?? m.AssistantAgentId;

    if (agentId && Array.isArray(agentsList) && agentsList.length) {
      const matchedAgent = agentsList.find(
        (a: any) => String(a.id) === String(agentId)
      );
      if (matchedAgent) {
        return matchedAgent;
      }
    }

    return undefined;
  };
  // Optional: drop empty assistant placeholders (just in case some slip into history)
  const sanitizeHistory = (messages: any[]) =>
    messages.filter((m) => {
      const isAssistant = isAssistantRole(m.role);
      const emptyId = !m.id || `${m.id}`.trim() === "";
      const emptyContent = !m.content || `${m.content}`.trim() === "";
      const markedPlaceholder = m.placeholder === true;
      return !(isAssistant && (markedPlaceholder || (emptyId && emptyContent)));
    });

  /**
   * Reconstruct the streamItems array for a history-loaded assistant message.
   *
   * The backend embeds `<!-- IMG_GEN:requestId -->` markers in the stored
   * content at the position where an image was generated, and appends the
   * actual markdown image (`![alt](url)`) at the end of the content.
   *
   * This function extracts the markdown images, strips them from the text,
   * splits on the markers, and re-inserts each image at its marker position
   * using real `image`-type streamItems backed by synthetic
   * ImageGenerationItem entries.  This ensures history-loaded messages render
   * via the same `ImagePreview` component used during streaming.
   */
  const reconstructStreamItemsForHistory = (
    message: any
  ): {
    streamItems: ChatStreamItem[];
    imageGenerations: ImageGenerationItem[];
  } | null => {
    const content = String(message.content ?? message.Content ?? "");
    const hasMarkers = /<!--\s*IMG_GEN:/.test(content);

    // Match markdown images with:
    // - plain URLs: ![alt](url)
    // - angle-bracket URLs: ![alt](<url>)
    // - optional title: ![alt](url "title")
    const mdImageRegex =
      /!\[([^\]]*)\]\((?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\)/g;
    const images: { full: string; alt: string; url: string }[] = [];
    let imgMatch;
    while ((imgMatch = mdImageRegex.exec(content)) !== null) {
      const full = imgMatch[0];
      const alt = imgMatch[1] || "";
      const url = imgMatch[2] || imgMatch[3] || "";
      if (!url) continue;
      images.push({ full, alt, url });
    }

    if (images.length === 0) return null;

    // Remove markdown image tokens from text so we can rebuild layout.
    let textOnly = content;
    for (const img of images) {
      textOnly = textOnly.replace(img.full, "");
    }

    const baseRequestId = message.id || message.MessageId || "history";
    const imageGenerations: ImageGenerationItem[] = images.map((img, i) => ({
      requestId: `history-img-${baseRequestId}-${i}`,
      status: "completed" as const,
      url: img.url,
      alt: img.alt,
    }));

    const streamItems: ChatStreamItem[] = [];

    if (hasMarkers) {
      // Preserve original image placement when markers are present.
      const markerSplitRegex = /\s*<!--\s*IMG_GEN:\s*\S+?\s*-->\s*/;
      const segments = textOnly.split(markerSplitRegex);
      let imgIdx = 0;

      for (let i = 0; i < segments.length; i++) {
        const text = segments[i].trim();
        if (text) {
          streamItems.push({ type: "text", content: text });
        }
        if (i < segments.length - 1 && imgIdx < imageGenerations.length) {
          streamItems.push({
            type: "image",
            requestId: imageGenerations[imgIdx++].requestId,
          });
        }
      }

      while (imgIdx < imageGenerations.length) {
        streamItems.push({
          type: "image",
          requestId: imageGenerations[imgIdx++].requestId,
        });
      }
    } else {
      // Fallback for history entries without markers: show text then images.
      const cleanedText = textOnly
        .replace(/<!--\s*IMG_GEN:\s*\S+?\s*-->/g, "")
        .trim();
      if (cleanedText) {
        streamItems.push({ type: "text", content: cleanedText });
      }
      imageGenerations.forEach((img) => {
        streamItems.push({ type: "image", requestId: img.requestId });
      });
    }

    if (streamItems.length === 0) return null;
    return { streamItems, imageGenerations };
  };

  const enrichMessagesForHistory = (messages: any[], agentsList: any[]) => {
    const sanitized = sanitizeHistory(messages);
    return sanitized.map((m) => {
      let enriched = m;

      if (isAssistantRole(m.role)) {
        const agentObj = resolveAgentForMessage(m, agentsList);
        if (agentObj) enriched = { ...enriched, agent: agentObj };

        // Reconstruct streamItems for messages whose content contains
        // IMG_GEN markers, so that history-loaded messages use the same
        // rendering path (flex-col with gap) as streamed messages.
        const result = reconstructStreamItemsForHistory(m);
        if (result) {
          enriched = {
            ...enriched,
            streamItems: result.streamItems,
            imageGenerations: result.imageGenerations,
          };
        }
      }

      return enriched;
    });
  };

  const handleChatItemClick = async (chat: ChatHistoryDto) => {
    const startTs = performance.now();
    setIsTransitioning(true);
    setChatLoading(true);
    setIsNewChatRequest(false);
    setLoadingMessages(true);

    try {
      handleCloseStream(true);
      setCurrentChat(chat);
      setCurrentChatTitle(chat.title || "");

      // Clear any unsent attachments in the input when switching conversations
      setResetFiles(true);
      setUnsentAttachmentsSummary({
        hasDocuments: false,
        hasImages: false,
        counts: { documents: 0, images: 0, total: 0 },
        files: [],
      });

      const chatTypeSafe = chat.type || "Normal";
      if (chatTypeSafe === "JobPost") {
        navigate(`/job-post-creator/${chat.id}`);
        return;
      }

      if (chat.id) {
        const messages = await fetchMessagesForChat(chatTypeSafe, chat.id);

        const enrichedMessages = enrichMessagesForHistory(
          messages,
          agents || []
        );

        setCurrentChatMessages(enrichedMessages);

        // Count total files in conversation
        const totalFiles = messages.reduce(
          (count: number, message: ChatMessage) =>
            count + (message.files?.length || 0),
          0
        );

        setTotalFileCount(totalFiles);
        setHasAttachedFiles(totalFiles > 0);

        // Calculate conversation file type flags
        const hasDocs = messages.some((msg: ChatMessage) =>
          (msg.files || []).some((f) => {
            const type = (f.fileType || "").toLowerCase();
            const ext = `.${
              (f.fileName || "").split(".").pop()?.toLowerCase() || ""
            }`;
            const isImageExt = [
              ".jpg",
              ".jpeg",
              ".png",
              ".gif",
              ".webp",
            ].includes(ext);
            // If we know it's an image by extension, don't count as document
            if (isImageExt) return false;
            // If fileType says document (case-insensitive), count as document
            if (type.includes("document")) return true;
            // If fileType says image (case-insensitive), don't count as document
            if (type.includes("image")) return false;
            // Fallback: treat unknown non-image extensions as documents
            return true;
          })
        );
        const hasImgs = messages.some((msg: ChatMessage) =>
          (msg.files || []).some((f) => {
            const type = (f.fileType || "").toLowerCase();
            const ext = `.${
              (f.fileName || "").split(".").pop()?.toLowerCase() || ""
            }`;
            const isImageExt = [
              ".jpg",
              ".jpeg",
              ".png",
              ".gif",
              ".webp",
            ].includes(ext);
            if (isImageExt) return true;
            return type.includes("image");
          })
        );
        setConversationHasDocuments(hasDocs);
        setConversationHasImages(hasImgs);

        // Force model selection to one that supports needed capabilities if files are present
        if (totalFiles > 0 && selectedModelValueContext.selectedValue) {
          const currentModel = selectedModelValueContext.selectedValue;
          const needsDocs = hasDocs;
          const needsImages = hasImgs;
          const lacksTools = !getModelSupportsTools(currentModel);
          const lacksDocs =
            needsDocs && !getModelSupportsDocuments(currentModel);
          const lacksImages =
            needsImages && !getModelSupportsImages(currentModel);

          if (lacksTools || lacksDocs || lacksImages) {
            selectedModelValueContext.setSelectedValue("GPT-4o");
          }
        }

        // NEW LOGIC: Set default model to "GPT-4o" if chatType is "TrafficInformation"
        if (chat.type === "TrafficInformation") {
          selectedModelValueContext.setSelectedValue("GPT-4o");
        }
      }
    } catch (error) {
      console.error("Error loading messages for selected chat:", error);
    } finally {
      const elapsed = performance.now() - startTs;
      const remaining = Math.max(0, minimumLoadingTime - elapsed);
      window.setTimeout(() => {
        setChatLoading(false);
        setLoadingMessages(false);
        setIsTransitioning(false);
      }, remaining);
    }
  };

  useEffect(() => {
    // No timeout cleanup necessary with remainder-only delay
  }, []);

  const handleDeleteHistoryClick = (chat: ChatHistoryDto) => {
    if (chat && chat.id) {
      deleteConversation(chat.type, chat.id);
    }
  };

  const [resetFiles, setResetFiles] = useState(false);

  const newChatSession = async () => {
    handleCloseStream(true);

    if (hasHistory) {
      chatHistoryRef.current?.resetActiveChat();
    }

    try {
      const response = await axiosInstance.post("/chat/start");
      const { conversation_id, message } = response.data;

      const newChat: ChatHistoryDto = {
        id: conversation_id,
        title: "New Chat",
        type: chatType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCurrentChat(newChat);
      
      const welcomeMsg = new ChatMessage(
        uuidv4(),
        message,
        MessageRoleString[MessageRole.Assistant],
        new Date().toISOString()
      );
      
      setCurrentChatMessages([welcomeMsg]);
      setIsNewChatRequest(false);
      setResetFiles(true);
      setTotalFileCount(0);
      setHasAttachedFiles(false);
      setConversationHasDocuments(false);
      setConversationHasImages(false);
      resetAgents();
      setShowWelcomeScreen(false);
    } catch (error) {
      console.error("Error starting new chat session:", error);
      // Fallback to local behavior if backend fails
      const temporaryChat: ChatHistoryDto = {
        id: uuidv4(),
        title: "New Chat",
        type: chatType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentChat(temporaryChat);
      setCurrentChatMessages([]);
      setIsNewChatRequest(true);
      setShowWelcomeScreen(true);
    }
  };

  const deleteConversation = async (
    chatType: string,
    conversationId: string
  ) => {
    try {
      const controller =
        chatType == "Normal" ? "chat" : `${chatType.toLowerCase()}chat`;
      await axiosInstance.delete(`/${controller}/${conversationId}`);

      if (currentChat?.id === conversationId) {
        newChatSession();
      }
      if (chatType === "JobPost") {
        notificationsService.success(
          t("job-post-creator:deleteJobPostModal.notifications.success", {
            positionTitle: "",
          })
        );
      } else {
        notificationsService.success(
          t("components:deleteChatModal.notifications.success")
        );
      }
    } catch (error) {
      console.error("Error deleting chat message:", error);
      if (chatType === "JobPost") {
        notificationsService.success(
          t("job-post-creator:deleteJobPostModal.notifications.error", {
            positionTitle: "",
          })
        );
      } else {
        notificationsService.error(
          t("components:deleteChatModal.notifications.error")
        );
      }
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentChat?.id) {
      console.error("No active chat to delete message from");
      return;
    }

    try {
      const controller =
        chatType == "Normal" ? "chat" : `${chatType.toLowerCase()}chat`;
      await axiosInstance.delete(
        `/${controller}/${currentChat.id}/messages/${messageId}`
      );

      // Remove the deleted message and all subsequent messages from the state
      setCurrentChatMessages((prevMessages) => {
        const messageIndex = prevMessages.findIndex(
          (msg) => msg.id === messageId
        );
        if (messageIndex === -1) return prevMessages;

        // Keep only messages before the deleted message
        return prevMessages.slice(0, messageIndex);
      });

      notificationsService.success(
        t("components:chatComponent.messages.deleteMessageSuccess")
      );
    } catch (error) {
      console.error("Error deleting message:", error);
      notificationsService.error(
        t("components:chatComponent.messages.deleteMessageError")
      );
    }
  };

  const sendChatMessage = async (
    message: ChatMessage,
    isEditing: boolean = false
  ) => {
    initializeSSE(message, isEditing);
  };

  const handleSendMessage = async (
    inputValue: string,
    files: ChatFileMetadata[] = [],
    isEditing: boolean = false,
    messageId: string = ""
  ) => {
    if (inputValue.trim() === "") return;
    if (isEditing && !messageId) {
      console.error("Message ID is required for editing.");
      return;
    }

    scrollToBottom();
    setIsShowPredefinedPrompts(false);

    const newMsg = new ChatMessage(
      messageId || uuidv4(),
      inputValue,
      MessageRoleString[MessageRole.User],
      new Date().toISOString(),
      false,
      files,
      undefined,
      selectedAgent || undefined
    );

    if (isEditing) {
      // Find the index of the message being edited
      const messageIndex = currentChatMessages.findIndex(
        (msg) => msg.id === messageId
      );

      if (messageIndex === -1) {
        console.error("Message to edit not found");
        return;
      }

      // Store only the affected messages (from edited message onwards) for potential restoration
      setEditRestoreData({
        messageIndex,
        affectedMessages: currentChatMessages.slice(messageIndex),
      });

      // When editing, keep messages up to the one being edited, replace it, and remove any after it
      setCurrentChatMessages((prevMessages) => {
        // Keep all messages before the edited message, then add the edited message
        const messagesBeforeEdit = prevMessages.slice(0, messageIndex);
        return [...messagesBeforeEdit, newMsg];
      });
      // Don't reset editing state here - wait for successful stream start
    } else {
      setCurrentChatMessages((prevMessages) => [...prevMessages, newMsg]); // Append for new messages
    }

    try {
      await sendChatMessage(newMsg, isEditing);
    } catch (error) {
      console.error("Error sending chat message:", error);
      // Restore original messages and reset editing state on error if we were editing
      if (isEditing && editRestoreData) {
        setCurrentChatMessages((prevMessages) => {
          // Take messages before the edit point (these are unchanged)
          const messagesBeforeEdit = prevMessages.slice(
            0,
            editRestoreData.messageIndex
          );
          // Restore with the original affected messages
          return [...messagesBeforeEdit, ...editRestoreData.affectedMessages];
        });
        setEditRestoreData(null);
        setEditedMessageId(null);
      }
    }
  };

  const isChatInputEnabled = (): boolean | undefined => {
    if (chatType == "Normal") {
      return selectedValue != null && selectedValue.length > 0;
    }
    return true;
  };

  const handleChatExportOrDownload = async (
    chatId: string,
    chatType: string,
    workspaceId?: string,
    fileName?: string
  ) => {
    try {
      if (!chatId) {
        notificationsService.error("Chat ID is missing. Unable to download.");
        return;
      }
      if (chatType === "JobPost") {
        if (handleDownloadClick) {
          await handleDownloadClick(chatId);
        } else {
          console.error("handleDownloadClick function is not provided.");
        }
      } else {
        // Default export logic for other modules
        const chatResponse = await chatExportService.getChatMessages(
          chatId,
          chatType,
          workspaceId
        );

        const capitalizeFirstLetter = (fileName: string) => {
          if (!fileName) return fileName;
          return fileName.charAt(0).toUpperCase() + fileName.slice(1);
        };

        const contentType =
          chatResponse.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        const blob = new Blob([chatResponse.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = capitalizeFirstLetter(fileName || "Chat Messages.docx");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        notificationsService.success(
          t("dsb-chat:exportChat.successNotification")
        );
      }
    } catch (error) {
      console.error("Error during export/download operation:", error);
      notificationsService.error(
        moduleName === "Job Post Creator"
          ? t("job-post-creator:notifications.download.error")
          : t("dsb-chat:exportChat.errorNotification")
      );
    }
  };

  const handleReturnWorkspaces = () => {
    navigate("/workspaces");
  };

  const [totalFileCount, setTotalFileCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [hasAttachedFiles, setHasAttachedFiles] = useState(false);
  const chatInputRef = useRef<ChatInputRef>(null);
  const [unsentAttachmentsSummary, setUnsentAttachmentsSummary] =
    useState<UnsentAttachmentsSummary>({
      hasDocuments: false,
      hasImages: false,
      counts: { documents: 0, images: 0, total: 0 },
      files: [],
    });
  const [conversationHasDocuments, setConversationHasDocuments] =
    useState(false);
  const [conversationHasImages, setConversationHasImages] = useState(false);

  // Update hasAttachedFiles when totalFileCount changes
  useEffect(() => {
    setHasAttachedFiles(totalFileCount > 0);
  }, [totalFileCount]);

  // Feedback/Workspace keep existing upload behavior. For Normal chat with a selected
  // agent, uploads are allowed only when the agent exposes the data_analyst tool.
  const isSpecialAttachmentChatType =
    chatType === "Workspace" || chatType === "Feedback";
  const selectedAgentSupportsAttachmentUploads =
    !selectedAgent || agentHasTool(selectedAgent, DATA_ANALYST_AGENT_TOOL);
  const isModelAttachmentEnabled =
    isModelSelectable && !!selectedValue && getModelSupportsTools(selectedValue);
  const isAttachmentEnabledForChatInput =
    isSpecialAttachmentChatType ||
    (isModelAttachmentEnabled &&
      selectedAgentSupportsAttachmentUploads &&
      totalFileCount <= 20);

  const handleFileDrop = useCallback(
    async (droppedFiles: File[]) => {
      if (
        (!isSpecialAttachmentChatType &&
          (!isModelAttachmentEnabled ||
            !selectedAgentSupportsAttachmentUploads)) ||
        totalFileCount >= 20 ||
        !currentChat?.id
      ) {
        return;
      }

      if (chatInputRef.current?.handleFilesUpload) {
        await chatInputRef.current.handleFilesUpload(droppedFiles);
      }
    },
    [
      isSpecialAttachmentChatType,
      isModelAttachmentEnabled,
      selectedAgentSupportsAttachmentUploads,
      totalFileCount,
      currentChat?.id,
    ]
  );

  const isDropzoneEnabled =
    isSpecialAttachmentChatType ||
    (isModelAttachmentEnabled && selectedAgentSupportsAttachmentUploads);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    noClick: true,
    disabled: !isDropzoneEnabled || totalFileCount >= 20,
    onDropRejected: (rejectedFiles) => {
      // Handle files that don't match the accept criteria
      rejectedFiles.forEach(({ file }) => {
        if (
          !ALLOWED_FILE_EXTENSIONS.some((ext) =>
            file.name.toLowerCase().endsWith(ext)
          )
        ) {
          notificationsService.error(`File type not supported: ${file.name}`);
        }
      });
    },
    onError: (error) => {
      console.error("Dropzone error:", error);
      notificationsService.error("Error processing dropped files");
    },
    accept: ALLOWED_FILE_EXTENSIONS.reduce(
      (acc: Record<string, string[]>, ext: string) => {
        // Special cases with multiple MIME types
        if (ext === ".md") {
          return {
            ...acc,
            "text/markdown": [ext],
            "text/x-markdown": [ext],
            "text/plain": [ext],
            "application/x-markdown": [ext],
          };
        }

        if (ext === ".csv") {
          return {
            ...acc,
            "text/csv": [ext],
            "application/csv": [ext],
            "application/vnd.ms-excel": [ext],
            "text/plain": [ext],
          };
        }

        if (ext === ".docx" || ext === ".doc") {
          return {
            ...acc,
            "application/msword": [ext],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [ext],
          };
        }

        if (ext === ".xlsx" || ext === ".xls") {
          return {
            ...acc,
            "application/vnd.ms-excel": [ext],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [ext],
          };
        }

        if (ext === ".pptx" || ext === ".ppt") {
          return {
            ...acc,
            "application/vnd.ms-powerpoint": [ext],
            "application/vnd.openxmlformats-officedocument.presentationml.presentation":
              [ext],
          };
        }

        // Code files and text-based formats
        if (
          [
            ".html",
            ".css",
            ".js",
            ".ts",
            ".py",
            ".java",
            ".rb",
            ".php",
            ".c",
            ".cpp",
            ".cs",
            ".sh",
          ].includes(ext)
        ) {
          return {
            ...acc,
            "text/plain": [ext],
            "text/x-script": [ext],
            "application/x-httpd-php": [ext],
            "application/javascript": [ext],
            "text/javascript": [ext],
            "text/x-python": [ext],
            "text/x-java": [ext],
            "text/x-c": [ext],
          };
        }

        // Archives
        if (ext === ".zip") {
          return {
            ...acc,
            "application/zip": [ext],
            "application/x-zip-compressed": [ext],
          };
        }

        if (ext === ".tar") {
          return {
            ...acc,
            "application/x-tar": [ext],
            "application/gtar": [ext],
          };
        }

        // Default mappings for other types
        const mimeType =
          ext === ".md"
            ? "text/markdown"
            : ext === ".txt"
            ? "text/plain"
            : ext === ".json"
            ? "application/json"
            : ext === ".pdf"
            ? "application/pdf"
            : ext.includes("jpg") || ext.includes("jpeg")
            ? "image/jpeg"
            : ext.includes("png")
            ? "image/png"
            : ext.includes("gif")
            ? "image/gif"
            : "application/octet-stream"; // Better default than */*

        return { ...acc, [mimeType]: [ext] };
      },
      {} as Record<string, string[]>
    ),
  });

  const parentDivRef = useRef<HTMLDivElement | null>(null);
  const parentFooterDivRef = useRef<HTMLDivElement | null>(null);

  const activateWorkspacesList = () => {
    setShowWorkspacesList(!showWorkspacesList);
  };

  const activateWorkspacesFooterList = () => {
    setShowWorkspacesFooterList(!showWorkspacesFooterList);
  };

  const renderAvatar = () => {
    if (chatType === "Workspace" && moduleName) {
      return (
        <div className="mx-auto">
          <WorkspaceAvatar
            imageUrl={workspaceImage}
            color={accentColor}
            alt={moduleName.charAt(0).toUpperCase()}
            size={"md"}
          />
        </div>
      );
    } else {
      return null;
    }
  };

  // Determine the positioning of the dropdown (plus icon) depending from screen type

  const dropdownDirection = showWelcomeScreen
    ? isMobile
      ? "up"
      : "down"
    : "up";

  const isWelcomeScreenMobile = showWelcomeScreen && isMobile;

  const { setShowArrow, setScrollPosition, setShowBorder } = useScrollStore();
  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".content");

    const applyState = (top: number, height: number, client: number) => {
      setScrollPosition(top);

      const contentExceeds = height > client + 2;
      const isAtBottom = top >= height - client - 1;
      const isAtTop = top <= 0;

      // Arrow: visible when content exceeds and you're not at bottom
      setShowArrow(contentExceeds && !isAtBottom);

      // AppBar bottom border: visible when content exceeds and you're not at top
      setShowBorder(contentExceeds && !isAtTop);
    };

    const handleScroll = (scrollTop: number) => {
      if (container) {
        container.scrollTop = scrollTop;
        applyState(
          container.scrollTop,
          container.scrollHeight,
          container.clientHeight
        );
      } else {
        const el = document.documentElement || document.body;
        el.scrollTop = scrollTop;
        applyState(el.scrollTop, el.scrollHeight, el.clientHeight);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation keys, ignore all other keys to allow normal typing
      const navigationKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown"];
      if (!navigationKeys.includes(event.key)) {
        return;
      }

      // Prevent default browser scrolling for navigation keys
      event.preventDefault();

      const scrollStep = 50;
      const pageStep = window.innerHeight * 0.8;

      const scrollElement =
        container || document.documentElement || document.body;
      const currentScroll = scrollElement.scrollTop;

      let scrollDelta = 0;
      switch (event.key) {
        case "ArrowUp":
          scrollDelta = -scrollStep;
          break;
        case "ArrowDown":
          scrollDelta = scrollStep;
          break;
        case "PageUp":
          scrollDelta = -pageStep;
          break;
        case "PageDown":
          scrollDelta = pageStep;
          break;
      }

      handleScroll(currentScroll + scrollDelta);
    };

    if (!container) {
      // Fallback for non-chat/welcome screens (window scrolling)
      const onWindowScroll = () => {
        const el = document.documentElement || document.body;
        applyState(el.scrollTop, el.scrollHeight, el.clientHeight);
      };

      window.addEventListener("scroll", onWindowScroll, { passive: true });
      window.addEventListener("keydown", handleKeyDown);
      onWindowScroll();
      return () => {
        window.removeEventListener("scroll", onWindowScroll);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }

    const onContainerScroll = () => {
      applyState(
        container.scrollTop,
        container.scrollHeight,
        container.clientHeight
      );
    };

    container.addEventListener("scroll", onContainerScroll, { passive: true });
    document.addEventListener("keydown", handleKeyDown); // Attach to `document` to capture all keydown events
    onContainerScroll(); // initial state for this chat

    return () => {
      container.removeEventListener("scroll", onContainerScroll);
      document.removeEventListener("keydown", handleKeyDown); // Cleanup
    };
  }, [
    setShowArrow,
    setScrollPosition,
    setShowBorder,
    location.pathname,
    chatLoading,
    currentChatMessages.length,
    showWelcomeScreen,
  ]);

  // Cleanup when leaving chat view

  useEffect(() => {
    return () => {
      setShowBorder(false);
      setShowArrow(false);
      setScrollPosition(0);
    };
  }, [setShowBorder, setShowArrow, setScrollPosition]);
  return (
    <>
      <ChatHeader
        ref={chatHistoryRef}
        title={title}
        hasHistory={hasHistory}
        newChatSession={newChatSession}
        workspaceId={workspaceId}
        moduleName={moduleName}
        detailsLoading={detailsLoading}
        isModelSelectable={isModelSelectable}
        currentChat={currentChat}
        isTemporaryChat={
          isStreaming ||
          currentChatMessages.filter((x) => x.id != "").length <= 1
        }
        handleChatExport={handleChatExportOrDownload}
        handleReturnWorkspaces={handleReturnWorkspaces}
        hasAttachedFiles={hasAttachedFiles}
        unsentAttachmentsSummary={unsentAttachmentsSummary}
        conversationHasDocuments={conversationHasDocuments}
        conversationHasImages={conversationHasImages}
        onSelectChat={handleChatItemClick}
        onDeleteChat={handleDeleteHistoryClick}
        onNewChat={newChatSession}
        type={chatType}
      />

      <Box className="flex">
        {!isExternalApplicationWithCanvas && !isCanvasMode ? (
          <PageTransitionContainer>
            {" "}
            <div className="w-full h-full" {...getRootProps()}>
              <input {...getInputProps()} className="hidden" />
              <AnimatePresence>
                {isDragActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-gray-800 bg-opacity-95 flex flex-col items-center justify-center z-50"
                    style={{ pointerEvents: "none" }}
                  >
                    <div className="relative w-full max-w-lg flex justify-center mb-16">
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{
                          scale: 1,
                          x: -36,
                          y: [0, -8, 0],
                          rotate: -12,
                        }}
                        transition={{
                          y: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                          scale: {
                            duration: 0.2,
                          },
                        }}
                        className="absolute"
                      >
                        <FaRegImage size={48} className="text-blue-300" />
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{
                          scale: 1,
                          x: 36,
                          y: [0, -12, 0],
                          rotate: 12,
                        }}
                        transition={{
                          y: {
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.2,
                          },
                          scale: {
                            duration: 0.2,
                          },
                        }}
                        className="absolute"
                      >
                        <HiDocumentText size={48} className="text-[#b41730]" />
                      </motion.div>
                    </div>
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-center"
                    >
                      <h2 className="text-white-100 text-3xl font-semibold mb-3">
                        {t("dsb-chat:fileUpload.dragDrop.title")}
                      </h2>
                      <p className="text-gray-300 text-lg">
                        {t("dsb-chat:fileUpload.dragDrop.description")}
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <CircularProgress size={50} sx={{ color: "#FFFFFF" }} />
                </div>
              ) : !isTransitioning && showWelcomeScreen ? (
                <AnimatePresence>
                  <motion.div
                    className="flex flex-col items-center justify-between h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Chat Welcome View */}
                    <div
                      className={`flex flex-col items-center justify-center flex-1 w-full sm:max-w-2xl lg:max-w-3xl pl-6 pr-5 lg:pl-0 lg:pr-0 mb-0 ${
                        chatType === "Feedback" ? "sm:mb-0" : "sm:mb-[8rem]"
                      }`}
                    >
                      <div className="text-center mb-6">
                        {workspaceId ? (
                          <div className="flex flex-col gap-3">
                            {renderAvatar()}
                            <h1 className="text-3xl max-w-full break-words mb-3">
                              {moduleName}
                            </h1>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full">
                            <h1 className="text-3xl mb-3">{welcomeMessage}</h1>
                            {description && (
                              <div className="flex text-gray-300 mt-2 font-body text-lg text-center">
                                {description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <AnimatePresence>
                        <motion.div
                          className={`${
                            isWelcomeScreenMobile
                              ? `fixed bottom-9 ${
                                  showWorkspacesList
                                    ? "translate-y-[20rem]"
                                    : ""
                                } left-3 right-3 z-50`
                              : "w-full relative"
                          }`}
                          ref={parentDivRef}
                          initial={{ height: "auto", opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.6,
                            ease: easeInOut,
                          }}
                        >
                          <ChatInput
                            ref={chatInputRef}
                            sendMessage={handleSendMessage}
                            handleCloseStream={handleCloseStream}
                            isLoading={isStreaming}
                            accentColor={accentColor}
                            isInputEnabled={isChatInputEnabled()}
                            isAttachmentEnabled={
                              isAttachmentEnabledForChatInput
                            }
                            chatId={currentChat?.id}
                            resetFiles={resetFiles}
                            onResetComplete={() => setResetFiles(false)}
                            totalFileCount={totalFileCount}
                            onTotalFileCountChange={setTotalFileCount}
                            onImageGenerationChange={setImageGenerationEnabled}
                            chatType={chatType}
                            selectedModel={selectedValue}
                            moduleName={moduleName}
                            activateWorkspacesList={activateWorkspacesList}
                            showWorkspacesList={showWorkspacesList}
                            onUnsentAttachmentsChange={
                              setUnsentAttachmentsSummary
                            }
                            placeholderText={placeholderText}
                            dropdownDirection={dropdownDirection}
                            entrySource={entrySource}
                            entrySourcePopupKey={location.key}
                          />
                          {predefinedPrompts &&
                            predefinedPrompts.length > 0 &&
                            isShowPredefinedPrompts &&
                            !loadingMessages && (
                              <ChatPredefinedPrompts
                                chatType={chatType}
                                predefinedPrompts={predefinedPrompts}
                                isMobile={isMobile}
                                handleClickPrompt={(prompt, promptIndex) => {
                                  handleSendMessage(prompt).then(() => {
                                    setShowPromptCatalogue(false);
                                    launchpadMetrics.track({
                                      metric:
                                        "launchpad_ui_chat_card_click_count",
                                      labels: {
                                        promptIndex: `${promptIndex}`,
                                        chatType: chatType,
                                        prompt: prompt,
                                      },
                                    });
                                  });
                                }}
                              />
                            )}

                          {/* Agents List */}
                          {showActiveAgentListButton && visibleAgents && (
                            <ChatList
                              items={visibleAgents}
                              onItemClick={(id, item) => {
                                handleAgentClick(String(id));
                              }}
                              loading={
                                agentsLoading ||
                                (chatType === "Normal" &&
                                  sharePointGroupsLoading)
                              }
                              loadingMessage={
                                chatType === "Normal" && sharePointGroupsLoading
                                  ? t("components:chatComponent.messages.checkingAccess")
                                  : undefined
                              }
                            />
                          )}
                          {showWorkspacesList && (
                            <ChatList
                              items={(userWorkspaces ?? []).map((w, idx) => ({
                                id: w.id ?? idx,
                                name: w.name,
                                image: w.imageUrl,
                              }))}
                              onItemClick={(id, item) => {
                                navigate(`/workspaces/${id}`);
                                setShowWorkspacesList(false);
                              }}
                              selectedId={workspaceId}
                              loading={agentsLoading}
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div className="mt-auto w-full mb-2">
                      <ChatFooter />
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: easeIn,
                    delay: 0.2,
                  }}
                  className="flex flex-col w-full h-screen overflow-x-hidden pt-[3.2rem]"
                >
                  {/* Chat Messages View */}
                  <ScrollableFeed
                    ref={scrollableFeedRef}
                    className="content grow overflow-y-auto"
                    forceScroll={false}
                  >
                    <div className="px-5 lg:pl-0 lg:pr-0 mt-0 md:mt-2 lg:mt-0">
                      <ChatdialogueBox
                        dialogue={
                          isExternalApplicationWithCanvas &&
                          chatType === "JobPost"
                            ? canvasChatMessages
                            : currentChatMessages
                        }
                        displayName={accounts[0].name || ""}
                        picture={profilePhoto || ""}
                        key={1}
                        loading={loading}
                        loadingMessages={loadingMessages}
                        displayPlaceholder={true}
                        moduleName={moduleName}
                        description={description}
                        workspaceImage={workspaceImage}
                        owner={owner}
                        chatType={chatType}
                        detailsLoading={detailsLoading}
                        Icon={Icon}
                        iconSize={iconSize}
                        reasoningTags={reasoningTags}
                        workspaceId={workspaceId}
                        workspaceFiles={workspaceFiles}
                        handleSendMessage={handleSendMessage}
                        handleDeleteMessage={deleteMessage}
                        editedMessageId={editedMessageId}
                        setEditedMessageId={setEditedMessageId}
                        agentAvatarColor={accentColor}
                        chatId={currentChat?.id}
                      />
                    </div>
                    {predefinedPrompts &&
                      isShowPredefinedPrompts &&
                      !loadingMessages && (
                        <ChatPredefinedPrompts
                          predefinedPrompts={predefinedPrompts}
                          isMobile={isMobile}
                          handleClickPrompt={(prompt, promptIndex) => {
                            handleSendMessage(prompt).then(() => {
                              setShowPromptCatalogue(false);
                              launchpadMetrics.track({
                                metric: "launchpad_ui_chat_card_click_count",
                                labels: {
                                  promptIndex: `${promptIndex}`,
                                  chatType: chatType,
                                  prompt: prompt,
                                },
                              });
                            });
                          }}
                        />
                      )}
                  </ScrollableFeed>
                  {/* Scroll Arrow */}
                  <ChatScrollArrow isMobile={isMobile} />
                  <div className="w-full pb-2 px-3 lg:pl-0 lg:pr-0">
                    <div className="w-full sm:max-w-2xl lg:max-w-3xl mx-auto !relative">
                      {(isProcessing || hasFailedFiles) &&
                        showProcessingMessage && (
                          <div
                            className={`w-full mx-auto relative max-w-3xl flex items-center bg-gray-600 rounded-full p-2 mb-2 transition-opacity duration-500 ease-in-out ${
                              isClosing ? "opacity-0" : "opacity-100"
                            }`}
                          >
                            <div className="flex items-center">
                              {isProcessing ? (
                                <>
                                  <CircularProgress
                                    sx={{ color: "#ff506c" }}
                                    size={20}
                                  />
                                  <span className="text-red-200 ml-4">
                                    {t("components:chatComponent.processing")}
                                  </span>
                                </>
                              ) : hasFailedFiles ? (
                                <>
                                  <TbAlertCircle size={20} color="#ff506c" />
                                  <span className="text-red-200 ml-4">
                                    {t("components:chatComponent.failedFiles")}
                                  </span>
                                </>
                              ) : null}
                            </div>

                            <button
                              onClick={handleCloseProcessingMessage}
                              className="ml-auto focus:outline-none"
                            >
                              <TbX fontSize={24} color="#ff506c" />
                            </button>
                          </div>
                        )}
                      {/* Agents List */}
                      {showActiveAgentListButton && visibleAgents && (
                        <ChatList
                          items={visibleAgents}
                          onItemClick={(id, item) => {
                            handleAgentClick(String(id));
                          }}
                          isModal={true}
                          loading={
                            agentsLoading ||
                            (chatType === "Normal" && sharePointGroupsLoading)
                          }
                          loadingMessage={
                            chatType === "Normal" && sharePointGroupsLoading
                              ? t("components:chatComponent.messages.checkingAccess")
                              : undefined
                          }
                        />
                      )}
                      {showWorkspacesFooterList && (
                        <ChatList
                          items={(userWorkspaces ?? []).map((w, idx) => ({
                            id: w.id ?? idx,
                            name: w.name,
                            image: w.imageUrl,
                          }))}
                          onItemClick={(id, item) => {
                            navigate(`/workspaces/${id}`);
                            setShowWorkspacesList(false);
                          }}
                          selectedId={workspaceId}
                          isModal={true}
                        />
                      )}

                      <div ref={parentFooterDivRef} className="!relative">
                        {!(moduleName === "AI Traffic Information") ? (
                          <ChatInput
                            ref={chatInputRef}
                            sendMessage={handleSendMessage}
                            handleCloseStream={handleCloseStream}
                            isLoading={isStreaming}
                            accentColor={accentColor}
                            isInputEnabled={isChatInputEnabled()}
                            isAttachmentEnabled={
                              isAttachmentEnabledForChatInput
                            }
                            chatId={currentChat?.id}
                            resetFiles={resetFiles}
                            onResetComplete={() => setResetFiles(false)}
                            totalFileCount={totalFileCount}
                            onTotalFileCountChange={setTotalFileCount}
                            onImageGenerationChange={setImageGenerationEnabled}
                            chatType={chatType}
                            selectedModel={selectedValue}
                            moduleName={moduleName}
                            activateWorkspacesList={
                              activateWorkspacesFooterList
                            }
                            showWorkspacesList={showWorkspacesFooterList}
                            onUnsentAttachmentsChange={
                              setUnsentAttachmentsSummary
                            }
                            placeholderText={placeholderText}
                            dropdownDirection={dropdownDirection}
                            entrySource={entrySource}
                            entrySourcePopupKey={location.key}
                          />
                        ) : null}
                      </div>
                      <ChatFooter />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </PageTransitionContainer>
        ) : isCanvasMode ? (
          <CanvasChat
            chatType={chatType}
            accentColor={accentColor}
            moduleName={moduleName}
            Icon={Icon}
            displayName={accounts[0].name || ""}
            agentAvatarColor={accentColor}
            loading={loading}
            loadingMessages={loadingMessages}
            reasoningTags={reasoningTags}
            isModelSelectable={isModelSelectable}
            selectedValue={selectedValue}
            totalFileCount={totalFileCount}
            resetFiles={resetFiles}
            setResetFiles={setResetFiles}
            setTotalFileCount={setTotalFileCount}
            setImageGenerationEnabled={setImageGenerationEnabled}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        ) : null}
      </Box>
    </>
  );
};
