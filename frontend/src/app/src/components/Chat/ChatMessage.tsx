import React, {
  useRef,
  useState,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  forwardRef,
} from "react";
import { Avatar } from "@mui/material";
import AgentAvatar from "./AgentAvatar";
import Tooltip from "../Global/Tooltip";
import {
  ChatMessage,
  ChatFileMetadata,
  ImageGenerationItem,
  ChatStreamItem,
} from "../../models/chat-message";
import { useMsal } from "../../hooks/useMsalMock";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";
import SimpleCitations from "../SimpleCitations";
import { MessageRole, MessageRoleString } from "../../models/chat-message-role";
import axiosInstance from "../../services/axiosInstance";
import { useMarkdownProcessor } from "../../hooks/useMarkdownProcessor";
import { IconType } from "react-icons";
import { FilePreview } from "./FilePreview";
import { SelectedValueContext } from "../../contexts/SelectedValueContext";
import useCombinedRefs from "../../hooks/useCombinedRefs";
import { WorkspaceFileDto } from "../../models/workspace-model";
import { HiOutlinePencil } from "react-icons/hi";
import { TbExclamationCircle } from "react-icons/tb";
import ChatMessageEdit from "./ChatMessageEdit";
import ChatMessageActionIcons from "./ChatMessageActionIcons";
import ChatMessageLoadingIndicator from "./ChatMessageLoadingIndicator";
import ChatMessageError from "./ChatMessageError";
import DeleteMessageConfirmModal from "./DeleteMessageConfirmModal";
import handleCopyContent from "../../utils/handleCopyContent";
import attachCopyEventListener from "../../utils/attachCopyEventListener";
import { notificationsService } from "../../services/notificationsService";
import CanvasStreamingCard from "../../components/Canvas/CanvasStreamingCard";
import { useCanvas } from "../../hooks/useCanvas";
import { useJobPost } from "../../hooks/useJobPost";
import { Agent, getAgentSecondaryText } from "../../models/agent-model";
import { encodeToBase64 } from "../../utils/encodingUtils";
import ContentCopy from "../Global/AppContentCopy";
import MessageRating from "../MessageRating/message-rating";
import ImagePreview from "./ImagePreview";
import {
  UserRating,
  MessageFeedbackRequest,
} from "../../models/message-rating.types";

interface ChatMessageProps {
  Icon?: React.ReactElement | IconType;
  iconSize?: number;
  inkey: number;
  agentAvatarColor?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  error?: boolean;
  message: ChatMessage;
  messageId?: string;
  /** GUID of the chat containing this message (required for rating submission in Phase 3) */
  chatId?: string;
  /** GUID of the parent user message (for rating content linkage) */
  parentMessageId?: string;
  parentMessageText?: string | null;
  updatingText?: string;
  moduleName?: string;
  className?: string;
  ratingDialogMessage?: string;
  isChat?: boolean;
  chatType: string;
  reasoningTags?: string[];
  alwaysShowActions?: boolean;
  showDeleteAction?: boolean;
  canDelete?: boolean;
  streamEnded?: boolean;
  workspaceId?: string;
  workspaceFiles?: WorkspaceFileDto[];
  isEditing?: boolean;
  setEditingMessageId?: React.Dispatch<React.SetStateAction<string | null>>;
  handleSendMessage?: (
    inputValue: string,
    files?: ChatFileMetadata[],
    isEditing?: boolean,
    messageId?: string
  ) => void;
  handleDeleteMessage?: (messageId: string) => void;
  lastUserMessageId?: string;
  showFeedbackCard?: boolean;
}

const ChatMessageTextBlock: React.FC<{
  content: string;
  isAssistant: boolean;
  workspaceId?: string;
  workspaceFiles?: WorkspaceFileDto[];
}> = ({ content, isAssistant, workspaceId, workspaceFiles }) => {
  const trimmed = content.trim();
  const markdownResult = isAssistant
    ? useMarkdownProcessor(trimmed, workspaceId, workspaceFiles)
    : {
        processedContent: <div className="whitespace-pre-wrap">{trimmed}</div>,
        extractedCitations: [],
      };

  return <>{markdownResult.processedContent}</>;
};

export const ChatMessageComponent = forwardRef<
  HTMLDivElement,
  ChatMessageProps
>((props, ref) => {
  const { t } = useTranslation();
  const Icon = props.Icon;
  const iconSize = props.iconSize || 15;
  const isChat = props.isChat !== undefined ? props.isChat : true;
  const selectedModelValueContext = useContext(SelectedValueContext);
  const { selectedValue } = selectedModelValueContext;
  const { accounts } = useMsal();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const messageTextRef = useRef<HTMLDivElement>(null);
  const combinedRef = useCombinedRefs(messageTextRef, ref);
  const bubbleRef = useRef<HTMLDivElement | null>(null); // Separate ref for measuring bubble height only
  const [htmlToCopy, setHtmlToCopy] = useState<string>("");
  const [plainTextToCopy, setPlainTextToCopy] = useState<string>("");
  const { isStreamingCanvasContent, isCanvasMode } = useCanvas();

  const { jobPostGeneratedSystemMessage, jobPostStreamingSystemMessage } =
    useJobPost();

  // Define isUserMessage early, before any useEffect that uses it
  const [localAssistantContent, setLocalAssistantContent] = useState<
    string | null
  >(null);
  const isUserMessage =
    props.message.role === MessageRoleString[MessageRole.User];
  const isAssistantMessage =
    props.message.role === MessageRoleString[MessageRole.Assistant];
  const content =
    isAssistantMessage && localAssistantContent !== null
      ? localAssistantContent
      : props.message.content;
  const streamItems =
    isAssistantMessage && localAssistantContent !== null
      ? ([] as ChatStreamItem[])
      : ((props.message?.streamItems || []) as ChatStreamItem[]);
  const imageGenerations = (props.message?.imageGenerations ||
    []) as ImageGenerationItem[];
  const completedGeneratedImages = imageGenerations.filter(
    (item) => item.status === "completed" && item.url
  );
  const hasCompletedGeneratedImages = completedGeneratedImages.length > 0;
  const hasImageGenerations = imageGenerations.length > 0;
  const hasImages = hasCompletedGeneratedImages;
  const downloadUrl = hasCompletedGeneratedImages
    ? completedGeneratedImages[0].url
    : undefined;
  const shouldRenderStreamItems = isAssistantMessage && streamItems.length > 0;
  const imageGenerationById = useMemo(() => {
    const map = new Map<string, ImageGenerationItem>();
    imageGenerations.forEach((item) => {
      map.set(item.requestId, item);
    });
    return map;
  }, [imageGenerations]);

  const [messageHeight, setMessageHeight] = useState<number>(0); // Track message height

  // Measure the height of the bubble (text only, excluding file previews)
  // useLayoutEffect ensures measurement happens before paint to avoid visual flash
  useLayoutEffect(() => {
    if (bubbleRef.current && isUserMessage) {
      setMessageHeight(bubbleRef.current.offsetHeight);
    }
  }, [props.message.content, props.loading, isUserMessage]);

  // Attach copy listener for manual selection
  useEffect(() => {
    const { attachListener, detachListener } =
      attachCopyEventListener(messageTextRef);
    attachListener();
    return () => {
      detachListener();
    };
  }, []);

  // Reset any local edit override when this component is reused for another message id.
  useEffect(() => {
    setLocalAssistantContent(null);
  }, [props.message.id]);

  // Update copyable text when message finishes streaming or for user messages
  useEffect(() => {
    if (
      messageTextRef.current &&
      (!props.loading || props.streamEnded || isUserMessage)
    ) {
      if (isUserMessage) {
        // For user messages, extract just the inner text without the wrapper div
        const messageContent = messageTextRef.current.querySelector(
          ".whitespace-pre-wrap"
        );
        const textContent =
          (messageContent || messageTextRef.current).textContent || "";
        // Pass plain text as HTML to avoid additional wrapper divs
        setHtmlToCopy(textContent);
        setPlainTextToCopy(textContent);
      } else {
        // For assistant messages, keep the formatted HTML
        setHtmlToCopy(messageTextRef.current.innerHTML);
        setPlainTextToCopy(messageTextRef.current.textContent || "");
      }
    }
  }, [content, props.message, props.streamEnded, isUserMessage]);

  // Rotate loading messages if reasoning tags present
  useEffect(() => {
    if (props.loading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => {
          if (props.reasoningTags && props.reasoningTags.length > 0) {
            return (prev + 1) % props.reasoningTags.length;
          }
          return prev + 1;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [props.loading, props.reasoningTags]);

  // Process markdown for assistant messages; plain text for user
  const markdownResult =
    props.message.role === MessageRoleString[MessageRole.Assistant]
      ? useMarkdownProcessor(content, props.workspaceId, props.workspaceFiles)
      : {
          processedContent: (
            <div className="whitespace-pre-wrap">{content}</div>
          ),
          extractedCitations: [],
        };

  const processedContent = markdownResult.processedContent;

  // Editing user messages
  const handleEditClick = () => {
    if (props.setEditingMessageId && props.messageId) {
      props.setEditingMessageId(props.messageId);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteConfirm = () => {
    if (props.handleDeleteMessage && props.lastUserMessageId) {
      props.handleDeleteMessage(props.lastUserMessageId);
    }
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmModal(false);
  };

  const handleSave = (updatedMessage: string) => {
    if (props.handleSendMessage) {
      props.handleSendMessage(
        updatedMessage,
        props.message.files,
        true,
        props.messageId
      );
    }
    if (props.setEditingMessageId) {
      props.setEditingMessageId(null);
    }
  };

  const handleCancel = () => {
    if (props.setEditingMessageId) {
      props.setEditingMessageId(null);
    }
  };

  // Feedback rating icon click
  const handleIconClick = async (
    iconType: string,
    userMessage: string,
    consent: boolean = true,
    editedAssistantMessage?: string
  ) => {
    setSelectedIcon(iconType);

    // Get agent info from the message if available
    const agent = props.message.agent as Agent | undefined;

    const canIncludeEditedMessage = !!editedAssistantMessage && !!props.chatId;

    const messageFeedbackDto: MessageFeedbackRequest = {
      // Required fields
      chatMessageId: props.messageId || "",
      userId: accounts[0].localAccountId,
      userRating:
        iconType === "up" ? UserRating.ThumbsUp : UserRating.ThumbsDown,
      consent: consent,
      chatId: props.chatId || undefined,

      // Optional fields
      parentMessageId: props.parentMessageId, // Enables content linkage
      userMessage: userMessage
        ? encodeToBase64(userMessage)
        : undefined,
      currentPageUrl: encodeToBase64(window.location.href),
      editedAssistantMessage: canIncludeEditedMessage
        ? encodeToBase64(editedAssistantMessage as string)
        : undefined,

      // Agent metadata
      generatedByAgent: !!agent,
      agentId: agent?.id,
      agentName: agent?.name,
    };

    try {
      await axiosInstance.post(
        "/feedback/MessageFeedback",
        JSON.stringify(messageFeedbackDto)
      );

      if (canIncludeEditedMessage) {
        setLocalAssistantContent(editedAssistantMessage as string);
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
    }
  };

  // Download for images
  const handleDownload = () => {
    if (downloadUrl) {
      fetch(downloadUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "image.png";
          a.click();
          URL.revokeObjectURL(url);
        })
      .catch(console.error);
    }
  };

  const renderImageGenerationItem = (
    image: ImageGenerationItem | undefined,
    key: string
  ) => {
    if (!image || image.status === "started") {
      return (
        <div key={key} className="message-image">
          <ImagePreview
            loading
            streaming
            alt="temporary image"
            className="!mt-0 !mb-0"
          />
        </div>
      );
    }

    if (image.status === "partial") {
      return (
        <div key={key} className="message-image">
          <ImagePreview
            imageUrl={image.partialUrl}
            alt={
              image.alt ||
              image.prompt ||
              t("components:imagePreview.labels.generating")
            }
            loading={false}
            streaming
            progress={image.progress}
            partialIndex={image.partialIndex}
            totalPartials={image.totalPartials}
            className="!mt-0 !mb-0"
          />
        </div>
      );
    }

    if (image.status === "completed" && image.url) {
      return (
        <div key={key} className="message-image">
          <ImagePreview
            imageUrl={image.url}
            alt={
              image.alt ||
              image.prompt ||
              t("components:chatMessageImageGeneration.generatedAlt")
            }
            className="!mt-0 !mb-0"
          />
        </div>
      );
    }

    if (image.status === "failed") {
      return (
        <div
          key={key}
          className="message-image w-[400px] rounded-2xl bg-[#2F2F2F] text-white-100 px-4 py-3"
        >
          <div className="text-sm font-semibold">
            {t("components:chatMessageImageGeneration.failedTitle")}
          </div>
          <div className="text-xs opacity-80 mt-1">
            {image.error ||
              t("components:chatMessageImageGeneration.failedDescription")}
          </div>
        </div>
      );
    }

    return null;
  };

  // Helper to distinguish Icon type
  function isIconType(icon: React.ReactElement | IconType): icon is IconType {
    return typeof icon === "function";
  }

  // Copy wrapper
  const handleCopyContentWrapper = async ({
    setMessageCopyOk,
    htmlToCopy,
  }: {
    setMessageCopyOk: React.Dispatch<React.SetStateAction<boolean>>;
    htmlToCopy: string;
    copyType?: "activeTab" | "entireMessage";
  }) => {
    try {
      await handleCopyContent({
        htmlToCopy,
        setMessageCopyOk,
        errorMessage: t("common:copyContent.error"),
        successMessage: t("common:copyContent.success"),
        defaultFont: {
          fontFamily: "Calibri, Arial, sans-serif",
          fontSize: "15px",
          color: "#000",
        },
      });
    } catch (error) {
      console.error("[handleCopyContentWrapper] Copy failed:", error);
      notificationsService.error(t("common:copyContent.error"));
    }
  };

  const handleCopyMarkdownWrapper = async ({
    htmlToCopy: markdownToCopy,
  }: {
    setMessageCopyOk: React.Dispatch<React.SetStateAction<boolean>>;
    htmlToCopy: string;
    copyType?: "activeTab" | "entireMessage";
  }) => {
    if (!markdownToCopy) {
      notificationsService.error(t("common:copyContent.error"));
      return;
    }

    try {
      await navigator.clipboard.writeText(markdownToCopy);
      notificationsService.success(t("common:copyContent.success"));
    } catch (error) {
      console.error("[handleCopyMarkdownWrapper] Copy failed:", error);
      notificationsService.error(t("common:copyContent.error"));
    }
  };

  const isDefaultCanvasMessage =
    props.inkey == 9999 && !isUserMessage && isCanvasMode;

  const textForTTS = plainTextToCopy || "";

  const agent = props.message.agent as Agent | undefined;
  const agentSecondaryText = getAgentSecondaryText(agent);

  const markdownToCopy = isAssistantMessage
    ? content.replace(/\s*<!--\s*IMG_GEN:\s*\S+?\s*-->\s*/g, "\n\n")
    : "";

  if (props.error) {
    return (
      <ChatMessageError
        message={props.message}
        moduleName={props.moduleName}
        agentAvatarColor={props.agentAvatarColor}
        Icon={props.Icon}
        iconSize={props.iconSize}
        className={props.className}
      />
    );
  }

  if (
    !props.loading &&
    !props.error &&
    (!props.message.content || props.message.content.trim().length === 0) &&
    !hasImages
  ) {
    return null;
  }

  return (
    <div
      style={props.style}
      key={props.inkey}
      className={`w-full py-2 msg !font-body text-white-100 ${
        isUserMessage ? "user" : "agent"
      } ${props.className || ""}`}
    >
      <div className="mx-auto my-0 sm:max-w-2xl lg:max-w-3xl pl-1 pr-0">
        {/* Render Avatar or Module Name */}
        {isAssistantMessage && (
          <div className="flex mb-3">
            {agent ? (
              <div className="flex items-center gap-3">
                <AgentAvatar
                  image={agent.image}
                  name={agent.name}
                  textClassName="text-sm"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-md ml-1 text-white capitalize font-semibold font-body">
                  {agent.name}
                  {agentSecondaryText && (
                    <span className="font-normal text-gray-300">
                      {" "}
                      - {agentSecondaryText}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar
                  variant="rounded"
                  className="-mt-[1.8px] !rounded-[50%] !w-7 !h-7"
                  style={{
                    backgroundColor: props.agentAvatarColor || "#18AD9B",
                  }}
                >
                  {Icon && typeof Icon === "function" ? (
                    <Icon size={iconSize} />
                  ) : (
                    "M"
                  )}
                </Avatar>

                <span className="text-md ml-1 text-white capitalize font-semibold font-body">
                  {props?.moduleName || "Module Name"}
                </span>
              </div>
            )}
          </div>
        )}

        <div
          className={`flex flex-col message font-body text-white-100 message-group`}
        >
          {/* MAIN MESSAGE CONTENT */}
          <div
            className="flex flex-col leading-7 message-text"
            ref={combinedRef}
          >
            {props.loading &&
            (!props.message.content || props.message.content.trim() === "") &&
            !shouldRenderStreamItems ? (
              <ChatMessageLoadingIndicator
                moduleName={props.moduleName}
                isRegenerating={false}
                reasoningTags={props.reasoningTags}
                selectedValue={selectedValue}
                loadingMessageIndex={loadingMessageIndex}
                updatingText={props.updatingText}
                chatType={props.chatType}
              />
            ) : props.isEditing && isUserMessage ? (
              <div className="flex flex-col space-y-3">
                <ChatMessageEdit
                  initialMessage={props.message.content}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
                {/* Warning message about editing consequences */}
                <div className="w-full border bg-blue-500 border-blue-500 text-superwhite px-3 sm:px-4 py-2 rounded-2xl text-md font-body">
                  <div className="flex items-center gap-3 sm:gap-2">
                    <TbExclamationCircle size={24} />
                    <span className="flex flex-1 flex-wrap">
                      {t("components:chatMessageEdit.editWarning")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col w-auto">
                {/* Render any attached files */}
                {props.message.files && props.message.files.length > 0 && (
                  <div className="file flex flex-wrap gap-2 mb-2 !self-end justify-end">
                    {props.message.files.map((file, index) => (
                      <FilePreview
                        key={`${file.fileIdentifier || file.fileName}-${index}`}
                        file={file}
                        showDeleteButton={false}
                      />
                    ))}
                  </div>
                )}

                {/* Render selected text if present */}
                {props.message.selectedText &&
                  props.message.selectedText.trim().length > 0 && (
                    <div
                      className={`mb-3 ${
                        isUserMessage ? "ml-auto max-w-[92%]" : "w-full"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-gray-300 font-medium px-1">
                          Selected text:
                        </div>
                        <div
                          className={`
                          border-l-4 border-violet-400
                          px-3 py-2
                          rounded-r-lg
                          text-sm
                          text-gray-200
                          italic
                          whitespace-pre-wrap
                          ${isUserMessage ? "ml-auto" : ""}
                        `}
                          style={{ backgroundColor: "#181818" }}
                        >
                          {props.message.selectedText}
                        </div>
                      </div>
                    </div>
                  )}

                {/* The message container */}
                <div
                  className={`flex flex-col ${
                    isUserMessage ? "ml-auto max-w-[73%] flex-none" : "w-full"
                  }`}
                >
                  <div
                    className={`flex flex-col ${
                      isUserMessage
                        ? `whitespace-pre-wrap break-words w-auto overflow-x-hidden break-all bg-gray-600 ml-auto mr-0 mx-0 rounded-3xl text-white-100 self-end items-end justify-end ${
                            messageHeight > 50
                              ? "py-[15px] px-[19px]"
                              : "py-[6px] px-[16px]"
                          }`
                        : "w-full"
                  }`}
                    ref={(el) => {
                      // Attach both refs to the bubble
                      if (typeof combinedRef === "function") {
                        combinedRef(el);
                      } else if (combinedRef) {
                        (
                          combinedRef as React.MutableRefObject<HTMLDivElement | null>
                        ).current = el;
                      }
                      bubbleRef.current = el;
                    }}
                  >
                    {shouldRenderStreamItems ? (
                      <div className="flex flex-col gap-3 w-full [&>:last-child]:!mb-0 [&>:last-child>:last-child]:!mb-0">
                        {streamItems.map((item, index) => {
                          if (item.type === "text") {
                            return (
                              <ChatMessageTextBlock
                                key={`text-${index}`}
                                content={item.content}
                                isAssistant={isAssistantMessage}
                                workspaceId={props.workspaceId}
                                workspaceFiles={props.workspaceFiles}
                              />
                            );
                          }
                          if (item.type === "image") {
                            const image = imageGenerationById.get(
                              item.requestId
                            );
                            return renderImageGenerationItem(
                              image,
                              `image-${item.requestId}`
                            );
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                      processedContent
                    )}
                  </div>
                </div>
                {isDefaultCanvasMessage && (
                  <div className="inline-flex flex-col pt-3 gap-2 mb-2 items-start">
                    <CanvasStreamingCard />
                    {jobPostStreamingSystemMessage &&
                      jobPostGeneratedSystemMessage && (
                        <div className="mt-4">
                          {isStreamingCanvasContent ? (
                            <span>{jobPostStreamingSystemMessage}</span>
                          ) : (
                            <span>{jobPostGeneratedSystemMessage}</span>
                          )}
                        </div>
                      )}
                  </div>
                )}
                {/* Render images if any */}
                {!shouldRenderStreamItems && hasImageGenerations && (
                  <div className="inline-flex flex-col pt-3 gap-2 mb-2 items-start">
                    {imageGenerations.map((image) =>
                      renderImageGenerationItem(
                        image,
                        `image-${image.requestId}`
                      )
                    )}
                  </div>
                )}
                {/* For Leader Chat and History Chat, show simple citation list from backend */}
                {(props.chatType === "Manager" ||
                  props.chatType === "History") &&
                  !props.loading &&
                  props.message.citations &&
                  props.message.citations.length > 0 && (
                    <SimpleCitations citations={props.message.citations} />
                  )}
                {/* Other chats use inline clickable numbered superscripts with tooltips */}
              </div>
            )}
          </div>
          {/* ACTION ICONS */}
          {props.inkey === 9999 || props.loading ? (
            <div className="message-content" />
          ) : isUserMessage ? (
            // Action buttons for user messages (Copy and Edit) - hide when editing
            !props.isEditing && (
              <div className="message-content">
                <div
                  className={`flex items-center justify-end -mt-3 ${
                    props.alwaysShowActions
                      ? ""
                      : "invisible opacity-0 message-group-hover:pointer-events-auto message-group-hover:opacity-100 message-group-hover:visible transition-all duration-75 ease-out"
                  }`}
                >
                  {/* Copy button */}
                  <ContentCopy
                    handleCopyContent={handleCopyContentWrapper}
                    copyType="entireMessage"
                    htmlToCopy={htmlToCopy}
                    customClass="h-8 w-8 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite"
                    iconSize={18}
                    tooltipText={t("components:codeCopyBtn.copy")}
                    tooltipPosition="-left-[0.35rem] -bottom-[3.4rem]"
                  />

                  {/* Edit button */}
                  <Tooltip text={t("components:tooltips.edit")} useMui>
                    <button
                      aria-label={t("components:tooltips.edit")}
                      className="group h-8 w-8 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite rounded-lg flex items-center justify-center"
                      onClick={handleEditClick}
                    >
                      <HiOutlinePencil size={18} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            )
          ) : (
            <>
              <ChatMessageActionIcons
                isUserMessage={isUserMessage}
                isTabbedChat={false}
                hasImages={hasImages}
                alwaysShowActions={props.alwaysShowActions}
                selectedIcon={selectedIcon}
                onIconClick={(iconType, userMessage, consent, editedMessage) =>
                  handleIconClick(
                    iconType,
                    userMessage,
                    consent,
                    editedMessage
                  )
                }
                ratingDialogMessage={props.ratingDialogMessage}
                handleCopyContent={handleCopyContentWrapper}
                handleCopyMarkdown={handleCopyMarkdownWrapper}
                htmlToCopy={htmlToCopy}
                markdownToCopy={markdownToCopy}
                onDownloadImage={handleDownload}
                onDelete={
                  props.showDeleteAction ? handleDeleteClick : undefined
                }
                canDelete={props.canDelete}
                textForTTS={textForTTS}
                assistantContent={content}
                chatId={props.chatId}
                agent={agent ? { id: agent.id, name: agent.name } : undefined}
              />
              {/* Render MessageRating only for the last message */}
              {props.alwaysShowActions && props.showFeedbackCard && (
                <div className="mt-4">
                  <MessageRating
                    selectedIcon={selectedIcon ?? null}
                    onIconClick={(iconType, userMessage, consent, editedMessage) =>
                      handleIconClick(
                        iconType,
                        userMessage,
                        consent,
                        editedMessage
                      )
                    }
                    dialogMessage={props.ratingDialogMessage}
                    renderCard={true} // Render the feedback card
                    messageDate={props.message.timestamp}
                    messageId={props.message.id}
                    assistantContent={content}
                    chatId={props.chatId}
                    agent={agent ? { id: agent.id, name: agent.name } : undefined}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteMessageConfirmModal
        open={showDeleteConfirmModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
});
