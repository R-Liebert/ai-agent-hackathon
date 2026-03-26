import React, {
  useState,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import { ChatMessageComponent } from "./ChatMessage";
import { ChatMessage, ChatFileMetadata } from "../../models/chat-message";
import { useTranslation } from "react-i18next";
import { CircularProgress, Skeleton } from "@mui/material";
import { MessageRole, MessageRoleString } from "../../models/chat-message-role";
import {
  WorkspaceMemberDto,
  WorkspaceFileDto,
} from "../../models/workspace-model";

import { useMarkdownProcessor } from "../../hooks/useMarkdownProcessor";
import { IconType } from "react-icons";

interface ChatdialogueBoxProps {
  Icon?: React.ReactElement | IconType;
  iconSize?: number;
  dialogue: ChatMessage[];
  displayName: string;
  picture?: string;
  agentAvatarColor?: string;
  loading?: boolean;
  loadingMessages?: boolean;
  welcomeMessage?: string | string[];
  updatingText?: string;
  moduleName?: string;
  ratingDialogMessage?: string;
  displayPlaceholder?: boolean;
  description?: string | React.ReactNode;
  owner?: WorkspaceMemberDto;
  chatType?: string;
  detailsLoading?: boolean;
  workspaceImage?: string;
  reasoningTags?: string[];
  imageDataIncoming?: boolean;
  streamEnded?: boolean;
  workspaceId?: string;
  workspaceFiles?: WorkspaceFileDto[];
  editedMessageId?: string | null;
  setEditedMessageId?: React.Dispatch<React.SetStateAction<string | null>>;
  handleSendMessage?: (
    inputValue: string,
    files?: ChatFileMetadata[],
    isEditing?: boolean,
    messageId?: string
  ) => void;
  handleDeleteMessage?: (messageId: string) => void;
  /** GUID of the current chat - required for rating submissions in Phase 3 */
  chatId?: string;
}

export const ChatdialogueBox: React.FC<ChatdialogueBoxProps> = ({
  dialogue = [],
  displayName,
  picture,
  agentAvatarColor,
  loading = false,
  loadingMessages = false,
  welcomeMessage,
  updatingText,
  moduleName,
  ratingDialogMessage,
  displayPlaceholder = false,
  description,
  owner,
  chatType,
  detailsLoading,
  workspaceImage,
  Icon,
  iconSize,
  reasoningTags,
  streamEnded,
  workspaceId,
  workspaceFiles,
  editedMessageId: editingMessageId,
  setEditedMessageId: setEditingMessageId,
  handleSendMessage,
  handleDeleteMessage,
  chatId,
}) => {
  const { t } = useTranslation();
  const [showLogo, setShowLogo] = useState(window.innerWidth > 664);

  useEffect(() => {
    const handleResize = () => {
      setShowLogo(window.innerWidth > 664);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter and sort messages
  const sortedMessages = useMemo(
    () =>
      (dialogue ?? [])
        .filter(
          (message: ChatMessage) =>
            message.role !== MessageRoleString[MessageRole.System]
        )
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
    [dialogue]
  );
  const userMessages = useMemo(
    () =>
      sortedMessages.filter(
        (message: ChatMessage) =>
          message.role === MessageRoleString[MessageRole.User]
      ),
    [sortedMessages]
  );

  const lastUserMessageId = useMemo(
    () =>
      userMessages.findLast(
        (message: ChatMessage) =>
          message.role === MessageRoleString[MessageRole.User]
      )?.id,
    [userMessages]
  );

  const canDeleteMessages = useMemo(
    () => userMessages.length > 1,
    [userMessages]
  );
  // Default static text
  const initialHelloText =
    t("components:chatDialogueBox.helloText", { displayName: displayName }) ??
    `Hello ${displayName}, `;
  const defaultStaticText =
    t("components:chatDialogueBox.staticText") ?? `how can I help you today?`;

  const getWelcomeMessage = (welcomeMessage: any) => {
    if (typeof welcomeMessage === "string" && welcomeMessage.trim() !== "") {
      return welcomeMessage;
    }

    if (Array.isArray(welcomeMessage) && welcomeMessage.length > 0) {
      return welcomeMessage.join("\n\n");
    }
    return defaultStaticText;
  };

  const messageText = getWelcomeMessage(welcomeMessage);

  const newMessage: ChatMessage = useMemo(
    () =>
      new ChatMessage(
        "welcome-message",
        initialHelloText + messageText,
        MessageRoleString[MessageRole.Assistant],
        new Date().toISOString()
      ),
    [initialHelloText, messageText]
  );
  const processedContent = useMarkdownProcessor(
    description as string
  ).processedContent;

  const renderDescription = () => {
    if (owner) {
      return (
        <div className="flex flex-col items-center mt-2 mb-4">
          {typeof description === "string" && (
            <div className="mt-4 max-w-md text-center text-sm font-normal text-token-text-primary leading-6">
              {processedContent}
            </div>
          )}
        </div>
      );
    }
    return (
      <>
        <div className="max-w-lg text-center text-lg font-normal text-gray-300 leading-6 font-body">
          {processedContent}
        </div>
      </>
    );
  };

  const renderWelcomeContent = () => {
    if (detailsLoading) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-token-text-primary">
          <Skeleton
            variant="circular"
            animation="pulse"
            width={90}
            height={90}
            className="mb-5"
            sx={{ bgcolor: "grey.800" }}
          />
          <Skeleton
            variant="rounded"
            animation="pulse"
            width={300}
            height={40}
            className="mb-4"
            sx={{ bgcolor: "grey.800" }}
          />
          <Skeleton
            variant="rounded"
            animation="pulse"
            width={300}
            height={20}
            sx={{ bgcolor: "grey.800" }}
          />
        </div>
      );
    } else {
      return (
        <div
          className={` flex h-auto flex-col items-center  !w-full ${
            moduleName === "Image Creator"
              ? "!mt-0 sm:!mt-10 md:!mt-0"
              : "!mt-0"
          } xxxl:mt-[3em] xl:mt-[1em] `}
        >
          <div
            className={`text-center flex flex-col w-full place-items-center place-content-center w-auto`}
          >
            <h1 className="text-5xl text-white-100 font-headers font-medium max-w-full break-words">
              {moduleName}
            </h1>
            {renderDescription && (
              <div className="flex text-gray-300 mt-2 font-body text-lg text-center">
                {" "}
                {renderDescription()}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  if (loadingMessages) {
    return (
      <div className="flex h-full items-center justify-center min-h-20">
        <CircularProgress size={65} style={{ color: "#FFFFFF" }} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {displayPlaceholder && sortedMessages.length === 0
        ? renderWelcomeContent()
        : !displayPlaceholder && (
            <ChatMessageComponent
              Icon={Icon}
              iconSize={iconSize}
              className="welcome-message"
              key={newMessage.id}
              agentAvatarColor={agentAvatarColor}
              message={newMessage}
              inkey={9999}
              messageId={newMessage.id}
              moduleName={moduleName}
              chatType={chatType || "Normal"}
              workspaceId={workspaceId}
              workspaceFiles={workspaceFiles}
              handleSendMessage={handleSendMessage}
              isEditing={editingMessageId === newMessage.id}
              setEditingMessageId={setEditingMessageId}
            />
          )}

      {sortedMessages.map((message: ChatMessage, i) => {
        const isLastMessage = i === sortedMessages.length - 1;
        const isLastAssistantMessage =
          isLastMessage &&
          message.role === MessageRoleString[MessageRole.Assistant];
        const messageKey =
          message.clientId ||
          message.id ||
          `${message.role}-${message.date || "unknown-date"}-${i}`;
        // Get the previous message (user's question) for rating linkage
        const previousMessage = sortedMessages[i - 1];
        const isAssistantMessage =
          message.role === MessageRoleString[MessageRole.Assistant];
        // parentMessageId is the user's question that prompted this assistant response
        const parentMessageId =
          isAssistantMessage &&
          previousMessage?.role === MessageRoleString[MessageRole.User]
            ? previousMessage.id
            : undefined;
        return (
          <ChatMessageComponent
            Icon={Icon}
            key={messageKey}
            message={message}
            agentAvatarColor={agentAvatarColor}
            inkey={i + 1}
            messageId={message.id}
            chatId={chatId}
            parentMessageId={parentMessageId}
            moduleName={moduleName}
            error={message.error}
            parentMessageText={previousMessage?.content}
            ratingDialogMessage={ratingDialogMessage}
            updatingText={updatingText}
            loading={isLastAssistantMessage ? loading : false}
            chatType={chatType || "Normal"}
            reasoningTags={reasoningTags}
            alwaysShowActions={isLastMessage}
            streamEnded={streamEnded}
            workspaceId={workspaceId}
            workspaceFiles={workspaceFiles}
            handleSendMessage={handleSendMessage}
            handleDeleteMessage={handleDeleteMessage}
            isEditing={editingMessageId === message.id}
            setEditingMessageId={setEditingMessageId}
            showDeleteAction={isLastMessage} // Always show for last message
            canDelete={canDeleteMessages} // But disable if only one user message
            lastUserMessageId={isLastMessage ? lastUserMessageId : undefined}
            showFeedbackCard={sortedMessages.length > 4}
          />
        );
      })}
    </div>
  );
};
