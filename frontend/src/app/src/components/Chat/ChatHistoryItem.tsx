import React, { useState, useCallback } from "react";
import { TbTrash, TbMessage2Down } from "react-icons/tb";
import { FiMoreHorizontal } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import DropdownMenuButton from "../Global/DropdownMenuButton";
import { StyledPopover } from "../StyledPopover";
import { ChatHistoryDto } from "../../interfaces/interfaces";
import ConfirmDeleteDialog from "../../components/Global/ConfirmActionDialog";

export interface ChatItemProps {
  chat: ChatHistoryDto;
  isActive?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  handleChatExport?: (chatId: string, fileName?: string) => void;
  isGlobalSearch?: boolean;
}

const ChatHistoryItem: React.FC<ChatItemProps> = React.memo(
  ({ chat, isActive, onClick, onDelete, handleChatExport, isGlobalSearch }) => {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

    const handleShowOptions = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>, chatId: string) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setActiveChatId(chatId);
      },
      []
    );

    const handleClose = useCallback(() => {
      setAnchorEl(null);
      setActiveChatId(null);
    }, []);

    const handleDeleteCancel = () => {
      setShowDeleteDialog(false);
    };

    const handleDeleteConfirmation = () => {
      setShowDeleteDialog(true);
    };
    return (
      <>
        <li
          className={`relative z-[15] cursor-pointer rounded-lg ${
            isActive || activeChatId ? "bg-gray-600" : "hover:bg-gray-600"
          } group`}
          onClick={onClick}
        >
          <div className="flex py-2 px-3 gap-2 items-center w-full will-change-transform">
            <div
              className={`normal-case first-letter:uppercase transition-all duration-200 ease-in-out truncate flex-1 font-body text-[13px] overflow-hidden break-all w-full dark:text-white ${
                isActive ? "pr-8" : "pr-3 group-hover:pr-8"
              }`}
            >
              {chat.title || t("components:chatHistoryComponent.noTitle")}
            </div>
            {!isGlobalSearch && (
              <button
                className={`ml-auto text-white-100 !text-xl hover:text-superwhite ${
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                } absolute top-50 right-2`}
                onClick={(e) => {
                  if (!chat.id) return; // Early return if chat.id is undefined
                  handleShowOptions(e, chat.id);
                }}
              >
                <FiMoreHorizontal size={20} />
              </button>
            )}
          </div>
        </li>
        {!isGlobalSearch && (
          <StyledPopover
            open={activeChatId !== null}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <DropdownMenuButton
              Icon={<TbTrash fontSize={20} strokeWidth={1.4} />}
              label={t("components:sidebarOptions.delete")}
              onClick={() => {
                handleDeleteConfirmation();
                handleClose();
              }}
              gap={2}
              variant="delete"
            />
            <DropdownMenuButton
              Icon={<TbMessage2Down fontSize={20} strokeWidth={1.4} />}
              label={
                chat.type === "JobPost"
                  ? t("components:sidebarOptions.download")
                  : t("components:sidebarOptions.export")
              }
              onClick={() => {
                console.log(
                  `${
                    chat.type === "JobPost" ? "Downloading" : "Exporting"
                  } chat with ID:`,
                  chat.id
                );
                if (!chat.id) {
                  console.error("Chat ID is undefined!");
                  return;
                }
                if (handleChatExport) {
                  handleChatExport(chat.id);
                }
                handleClose();
              }}
              gap={2}
            />
          </StyledPopover>
        )}

        {showDeleteDialog && onDelete && (
          <ConfirmDeleteDialog
            title={
              chat.type === "JobPost"
                ? t("job-post-creator:deleteJobPostModal.title", {
                    positionTitle: chat.title,
                  })
                : t("components:deleteChatModal.title")
            }
            message={
              chat.type === "JobPost"
                ? t("job-post-creator:deleteJobPostModal.paragraph", {
                    positionTitle: chat.title,
                  })
                : t("components:deleteChatModal.paragraph")
            }
            cancelBtn={t("components:deleteChatModal.cancelBtn")}
            confirmBtn={t("components:deleteChatModal.deleteBtn")}
            open={showDeleteDialog}
            onCancel={handleDeleteCancel}
            onConfirm={onDelete}
            onClose={() => setShowDeleteDialog(false)}
          />
        )}
      </>
    );
  }
);

// Add display name for better debugging
ChatHistoryItem.displayName = "ChatHistoryItem";

export default ChatHistoryItem;
