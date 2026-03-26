import React from "react";
import { useTranslation } from "react-i18next";
import {
  TbRepeat,
  TbPencilStar,
  TbDownload,
  TbTrash,
  TbMarkdown,
} from "react-icons/tb";
import { PiCheckFill } from "react-icons/pi";
import Tooltip from "../Global/Tooltip";
import ContentCopy from "../../components/Global/AppContentCopy";
import MessageRating from "../MessageRating/message-rating";
import TextToSpeechControls from "./TextToSpeechControls";

interface ChatMessageActionIconsProps {
  isUserMessage: boolean;
  isTabbedChat: boolean;
  hasImages: boolean;
  alwaysShowActions?: boolean;
  selectedIcon?: string | null;
  onIconClick?: (
    iconType: string,
    userMessage: string,
    consent: boolean,
    editedAssistantMessage?: string
  ) => void;
  ratingDialogMessage?: string;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  isRegenerating?: boolean;
  handleCopyContent?: (params: {
    setMessageCopyOk: React.Dispatch<React.SetStateAction<boolean>>;
    htmlToCopy: string;
    copyType?: "activeTab" | "entireMessage";
  }) => void;
  handleCopyMarkdown?: (params: {
    setMessageCopyOk: React.Dispatch<React.SetStateAction<boolean>>;
    htmlToCopy: string;
    copyType?: "activeTab" | "entireMessage";
  }) => void;
  onToggleLanguage?: () => void;
  language?: "DA" | "EN";
  activeTab?: string;
  htmlToCopy?: string | "";
  markdownToCopy?: string | "";
  onDownloadImage?: () => void;
  textForTTS: string;
  messageDate?: string;
  assistantContent?: string;
  chatId?: string;
  /** Agent information for agent-generated messages */
  agent?: { id: string; name: string };
}

const ChatMessageActionIcons: React.FC<ChatMessageActionIconsProps> = ({
  isUserMessage,
  isTabbedChat,
  hasImages,
  alwaysShowActions,
  selectedIcon,
  onIconClick,
  ratingDialogMessage,
  onRegenerate,
  onEdit,
  onDelete,
  canDelete = false, // Default to false for safety - must be explicitly enabled
  isRegenerating,
  handleCopyContent,
  handleCopyMarkdown,
  onToggleLanguage,
  language,
  activeTab,
  htmlToCopy,
  markdownToCopy,
  onDownloadImage,
  textForTTS,
  messageDate,
  assistantContent,
  chatId,
  agent,
}) => {
  const { t } = useTranslation();

  if (isUserMessage) {
    return null;
  }

  return (
    <div className="message-content">
      <div
        className={`flex items-center justify-start ${
          !hasImages ? "-mt-5 sm:-mt-3" : "mt-1"
        } ${
          alwaysShowActions
            ? ""
            : "invisible opacity-0 message-group-hover:pointer-events-auto message-group-hover:opacity-100 message-group-hover:visible transition-all duration-75 ease-out"
        }`}
      >
        {/* If not tabbed chat, show rating */}
        {!isTabbedChat && (
          <MessageRating
            selectedIcon={selectedIcon ?? null}
            onIconClick={
              onIconClick ??
              ((_iconType, _userMessage, _consent, _editedAssistantMessage) =>
                {})
            }
            dialogMessage={ratingDialogMessage}
            messageDate={messageDate}
            assistantContent={assistantContent}
            chatId={chatId}
            agent={agent}
          />
        )}

        {/* AI Traffic Information icons */}
        {isTabbedChat && (
          <>
            {/* Regenerate */}
            <Tooltip text="common:chatActionIconTooltips.regenerate" useMui>
              <button
                aria-label={t("common:chatActionIconTooltips.regenerate")}
                className="group h-8 w-8 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite rounded-lg flex items-center justify-center"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <TbRepeat size={18} />
              </button>
            </Tooltip>
            {/* Edit */}
            <Tooltip text="common:chatActionIconTooltips.edit" useMui>
              <button
                aria-label={t("common:chatActionIconTooltips.edit")}
                className="group h-8 w-8 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite rounded-lg flex items-center justify-center"
                onClick={onEdit}
              >
                <TbPencilStar size={18} />
              </button>
            </Tooltip>
          </>
        )}

        {/* Text-to-speech */}
        <TextToSpeechControls text={textForTTS} />

        {/* Copy or Download button logic */}
        {!isTabbedChat && (
          <>
            {!hasImages ? (
              <>
                <ContentCopy
                  handleCopyContent={handleCopyContent}
                  copyType="entireMessage"
                  htmlToCopy={htmlToCopy}
                  customClass="h-8 w-8 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite"
                  iconSize={18}
                  tooltipText={t("components:codeCopyBtn.copy")}
                  tooltipPosition="-left-[0.35rem] -bottom-[3.4rem]"
                />
                {handleCopyMarkdown && (
                  <ContentCopy
                    handleCopyContent={handleCopyMarkdown}
                    copyType="entireMessage"
                  htmlToCopy={markdownToCopy ?? ""}
                  customClass="ml-1 h-8 w-8 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite"
                  iconSize={18}
                  tooltipText={t("components:codeCopyBtn.copyMarkdown")}
                    tooltipPosition="-left-[0.35rem] -bottom-[3.4rem]"
                    ariaLabel={t("components:codeCopyBtn.copyMarkdown")}
                    icon={TbMarkdown}
                    copiedIcon={PiCheckFill}
                  />
                )}
              </>
            ) : (
              <Tooltip text="common:chatActionIconTooltips.download" useMui>
                <button
                  aria-label={t("common:chatActionIconTooltips.download")}
                  className="group h-8 w-8 text-white-100 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite rounded-lg flex items-center justify-center"
                  onClick={onDownloadImage}
                >
                  <TbDownload size={18} />
                </button>
              </Tooltip>
            )}
          </>
        )}

        {/* Copy active tab content & language toggle only for tabbed chat */}
        {isTabbedChat && (
          <>
            <ContentCopy
              handleCopyContent={handleCopyContent}
              copyType="activeTab"
              htmlToCopy="" // Not used in this mode, can be empty or fallback
              customClass="h-8 w-8 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite"
              iconSize={18}
              tooltipText={t("common:chatActionIconTooltips.copyOutput")}
              tooltipPosition="-left-[0.35rem] -bottom-[3.4rem]"
            />
            <Tooltip
              text={
                language === "DA"
                  ? t("common:chatActionIconTooltips.english")
                  : t("common:chatActionIconTooltips.danish")
              }
              useMui
            >
              <button
                aria-label={
                  language === "DA"
                    ? t("common:chatActionIconTooltips.english")
                    : t("common:chatActionIconTooltips.danish")
                }
                onClick={onToggleLanguage}
                className={`text-[13px] font-body group h-8 w-8 text-white-100 hover:text-sperwhite bg-transparent hover:bg-gray-600 rounded-full flex items-center justify-center ${
                  language === "DA"
                    ? "bg-gray-600 text-white-100 hover:bg-gray-600"
                    : "bg-blue-600 text-white"
                }`}
              >
                {language === "DA" ? "EN" : "DA"}
              </button>
            </Tooltip>
          </>
        )}

        {/* Delete last user message and this response */}
        {onDelete && (
          <Tooltip
            text={
              canDelete
                ? t("common:chatActionIconTooltips.delete", "Delete")
                : t(
                    "common:chatActionIconTooltips.cannotDelete",
                    "Cannot delete the only message"
                  )
            }
            useMui
          >
            <span>
              <button
                aria-label={
                  canDelete
                    ? t("common:chatActionIconTooltips.delete", "Delete")
                    : t(
                        "common:chatActionIconTooltips.cannotDelete",
                        "Cannot delete the only message"
                      )
                }
                className={`group h-8 w-8 bg-transparent rounded-lg flex items-center justify-center ${
                  canDelete
                    ? "text-white-100 hover:text-superwhite hover:bg-gray-600 cursor-pointer"
                    : "cursor-not-allowed"
                }`}
                onClick={canDelete ? onDelete : undefined}
                disabled={!canDelete}
              >
                <TbTrash size={18} />
              </button>
            </span>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default ChatMessageActionIcons;
