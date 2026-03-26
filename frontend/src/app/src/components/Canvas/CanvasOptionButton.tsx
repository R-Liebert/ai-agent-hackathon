import React, { useState, useCallback } from "react";
import { TbDotsVertical, TbTrash } from "react-icons/tb";
import Tooltip from "../Global/Tooltip";
import { useTranslation } from "react-i18next";
import DropdownMenuButton from "../Global/DropdownMenuButton";
import { StyledPopover } from "../StyledPopover";
import ConfirmDeleteDialog from "../Global/ConfirmActionDialog";
import { useJobPost } from "../../hooks/useJobPost";
import { useCanvas } from "../../hooks/useCanvas";
import useSidebarStore from "../../stores/navigationStore";
import { useNavigate } from "react-router-dom";

interface CanvasOptionButtonProps {
  moduleName?: string;
  size: number;
  positionFixed?: boolean;
}

const CanvasOptionButton: React.FC<CanvasOptionButtonProps> = ({
  moduleName,
  size,
  positionFixed,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { handleDeleteJobPost } = useJobPost();
  const { isSidebarOpen } = useSidebarStore();

  const { canvasTitle } = useCanvas();

  const handleShowOptions = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(anchorEl ? null : event.currentTarget);
    },
    [anchorEl]
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <div
      className={`${
        positionFixed
          ? `fixed top-2 ${
              isSidebarOpen
                ? "left-[50%] lg:left-[53%] xl:left-[42%]"
                : "left-[46%] lg:left-[35%]"
            }  !z-[999]`
          : "static mt-[1.4px]"
      }  transition-all duration-[400ms] ease-[cubic-bezier(0.25, 0.8, 0.25, 1)]`}
    >
      {/* Icon Button */}
      <button
        onClick={handleShowOptions}
        className={`${
          !positionFixed
            ? " hover:bg-gray-600 mr-2"
            : " hover:bg-gray-400 md:hover:bg-gray-600 md:hover:border-gray-500"
        }flex place-content-center p-2 text-center transform transition-all duration-200 ease-in-out rounded-lg relative group`}
        aria-label={t("common:canvasDotIcon.label")}
      >
        <TbDotsVertical strokeWidth={1.6} size={size} />
        <Tooltip
          text="common:canvasDotIcon.label"
          position={`${
            positionFixed ? "left-[-4.4rem] top-[2px]" : "left-0 top-10"
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <StyledPopover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        style={{ transform: "translateY(14px) translateX(-14px)" }}
      >
        <DropdownMenuButton
          Icon={<TbTrash fontSize={20} strokeWidth={1.2} />}
          label={t("common:canvasDotIcon.options.delete")}
          onClick={() => {
            setShowDeleteDialog(true);
            handleClose();
          }}
          gap={2}
        />
      </StyledPopover>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDeleteDialog
          title={
            moduleName === "Job Post Creator"
              ? t("job-post-creator:deleteJobPostModal.title")
              : t("components:deleteChatModal.title")
          }
          message={
            moduleName === "Job Post Creator"
              ? t("job-post-creator:deleteJobPostModal.paragraph", {
                  positionTitle: canvasTitle,
                })
              : t("components:deleteChatModal.paragraph")
          }
          cancelBtn={t("components:deleteChatModal.cancelBtn")}
          confirmBtn={t("components:deleteChatModal.deleteBtn")}
          open={showDeleteDialog}
          onCancel={() => {
            setShowDeleteDialog(false);
          }}
          onConfirm={() => {
            handleDeleteJobPost();
            setShowDeleteDialog(false);
            // Navigate to new job post page after deletion
            setTimeout(() => {
              navigate("/job-post-creator");
            }, 500);
          }}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
};

export default CanvasOptionButton;
