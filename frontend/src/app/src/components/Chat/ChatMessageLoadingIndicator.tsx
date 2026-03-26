import React from "react";
import { CircularProgress } from "@mui/material";
import ChatLoadingSkeleton from "../../components/AiTrafficInformation/ChatLoadingSkeleton";
import { getModelIsReasoningModel } from "../../models/models-config";

// You can move this array into a shared location if it's used elsewhere
const LOADING_MESSAGES = [
  "Thinking",
  "Reasoning about the problem",
  "Evaluating solutions",
  "Processing information",
  "Analyzing context",
];

interface ChatMessageLoadingIndicatorProps {
  moduleName?: string;
  isRegenerating?: boolean;
  reasoningTags?: string[];
  selectedValue: string;
  loadingMessageIndex: number;
  updatingText?: string;
  chatType?: string;
}

const ChatMessageLoadingIndicator: React.FC<
  ChatMessageLoadingIndicatorProps
> = ({
  moduleName,
  isRegenerating,
  reasoningTags,
  selectedValue,
  loadingMessageIndex,
  updatingText,
  chatType,
}) => {
  /**
   * If reasoning tags are present, the selected model is a reasoning model,
   * or this is a workspace chat (backend-controlled reasoning model),
   * show rotating messages.
   */
  const hasReasoningTags = reasoningTags && reasoningTags.length > 0;
  const isWorkspaceChat = chatType === "Workspace";
  if (
    hasReasoningTags ||
    getModelIsReasoningModel(selectedValue) ||
    isWorkspaceChat
  ) {
    const displayMessage =
      hasReasoningTags
        ? reasoningTags![loadingMessageIndex % reasoningTags!.length]
        : LOADING_MESSAGES[loadingMessageIndex % LOADING_MESSAGES.length];

    return (
      <div className="flex items-center gap-3 mt-2">
        <CircularProgress sx={{ color: "#FFFFFF" }} size={20} />
        <div className="text-white-100">{displayMessage}...</div>
      </div>
    );
  }

  /**
   * If the module is "AI Traffic Information", show the skeleton.
   */
  if (moduleName === "AI Traffic Information") {
    return <ChatLoadingSkeleton isRegenerating={isRegenerating} />;
  }

  /**
   * Otherwise, show a generic "dot-pulse" loader.
   */
  return (
    <div className="dot-pulse-container mt-2">
      <div className="dot-pulse" />
      {updatingText && <div className="ml-7">{updatingText}...</div>}
    </div>
  );
};

export default ChatMessageLoadingIndicator;
