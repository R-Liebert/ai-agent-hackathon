import React from "react";
import { Avatar } from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { IconType } from "react-icons";
import { ChatMessage } from "../../models/chat-message";
import { MessageRole, MessageRoleString } from "../../models/chat-message-role";
import { useTranslation } from "react-i18next";

interface ChatMessageErrorProps {
  message: ChatMessage;
  moduleName?: string;
  agentAvatarColor?: string;
  Icon?: React.ReactElement | IconType;
  iconSize?: number;
  className?: string;
}

const ChatMessageError: React.FC<ChatMessageErrorProps> = ({
  message,
  moduleName,
  agentAvatarColor,
  Icon,
  iconSize = 15,
  className,
}) => {
  const { t } = useTranslation();

  const isIconType = (
    icon: React.ReactElement | IconType
  ): icon is IconType => {
    return typeof icon === "function";
  };

  return (
    <div className={`w-full font-body msg py-2 agent ${className || ""}`}>
      <div className="flex mx-auto my-0 max-w-3xl">
        {/* Avatar */}
        <Avatar
          variant="rounded"
          className="mr-4 -mt-[1.8px] !rounded-[50%] !w-7 !h-7"
          style={{ backgroundColor: agentAvatarColor || "#19c37d" }}
        >
          {Icon && isIconType(Icon) ? (
            <Icon size={iconSize} />
          ) : (
            <PsychologyIcon className="!text-xl" />
          )}
        </Avatar>

        {/* Error Text */}
        <div className="w-auto h-auto flex flex-col">
          {/* Module or Default Label */}
          {message.role === MessageRoleString[MessageRole.User] ? null : (
            <>
              {moduleName ? (
                <div className="author font-semibold text-white-100">
                  {moduleName}
                </div>
              ) : (
                <div className="author font-semibold">
                  {t("components:chatMessageComponent.assistant")}
                </div>
              )}
            </>
          )}
          <div className="flex mt-4 bg-[#A6363D] py-2 px-4 rounded-tl-xs rounded-tr-lg rounded-bl-lg rounded-br-lg w-auto text-white-100">
            {message.content ||
              t("components:chatMessageComponent.messages.error")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageError;
