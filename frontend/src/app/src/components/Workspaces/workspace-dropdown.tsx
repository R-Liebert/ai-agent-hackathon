import React, { useState, useEffect, useCallback, useRef } from "react";
import DropdownMenuButton from "../Global/DropdownMenuButton";
import { FiChevronDown } from "react-icons/fi";
import {
  TbEditCircle,
  TbInfoCircle,
  TbTrash,
  TbPin,
  TbPinnedOff,
  TbFileDescription,
  TbStackPop,
  TbShare,
} from "react-icons/tb";
import { IconType } from "react-icons";
import { Skeleton } from "@mui/material";
import { workspacesService } from "../../services/workspacesService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMsal } from "../../hooks/useMsalMock";
import { Config } from "../../interfaces/interfaces";
import WorkspaceDetailsDialog from "./workspace-details-modal";
import { notificationsService } from "../../services/notificationsService";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { StyledPopover } from "../StyledPopover";
import Loader from "../app-loader";
import Tooltip from "../Global/Tooltip";
import FilesModal from "./workspace-files-modal";
import { useTranslation } from "react-i18next";
import ConfirmActionDialog from "../Global/ConfirmActionDialog";
import handleCopyContent from "../../utils/handleCopyContent";

const config: Config = window.env;

interface DropdownMenuItem {
  label: string;
  Icon: React.ReactElement | IconType;
  onClick?: () => void;
  redirectTo?: string;
}

interface WorkspaceDropdownProps {
  open?: boolean;
  name: string;
  workspaceId?: string | null;
  isLoading?: boolean;
  chatId?: string;
}

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  open,
  name,
  workspaceId = null,
  isLoading,
  chatId,
}) => {
  const [isWorkspaceDropdown, setWorkspaceDropdown] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(true);
  const [lastInteraction, setLastInteraction] = useState<Date | undefined>(
    undefined
  );
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [isLoadingOnDelete, setIsLoadingOnDelete] = useState<boolean>(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState<boolean>(false);
  const [showLeaveWorkspaceLink, setShowLeaveWorkspaceLink] =
    useState<boolean>(false);
  const [showEditWorkspaceLink, setShowEditWorkspaceLink] =
    useState<boolean>(false);

  const [isLoadingOnLeave, setIsLoadingOnLeave] = useState<boolean>(false);
  const [showFiles, setShowFiles] = useState<boolean>(false);
  const [selectedWorkspaceFiles, setSelectedWorkspaceFiles] = useState<
    string | null
  >(null);
  const [shareWorkspace, setShareWorkspace] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const { accounts } = useMsal();
  const accountID = accounts[0].localAccountId;
  const navigate = useNavigate();
  const {
    updateWorkspaceMutation,
    updateWorkspaceInteractionMutation,
    leaveWorkspaceMutation,
    workspaces,
  } = useWorkspaces();
  const { t } = useTranslation();

  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      setIsMobile(window.innerWidth < 480);
      setIsSmallMobile(window.innerWidth < 384);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (workspaceId && workspaces) {
      const workspace = workspaces.find((w) => w.id === workspaceId);
      if (workspace) {
        const workspaceOwners = workspace.members.filter((x) => x.isOwner);
        const workspaceOwner =
          workspaceOwners.find((x) => x.id == accountID) != null;

        setIsHidden(workspace.isHidden);
        setLastInteraction(workspace.lastInteraction);
        setShowFiles(
          !workspace?.isFileAccessRestrictedForMembers || workspaceOwner
        );
        setShowLeaveWorkspaceLink(
          !workspaceOwner || (workspaceOwner && workspaceOwners?.length > 1)
        );
        setShowEditWorkspaceLink(workspaceOwner);
      }
    }
  }, [workspaceId, workspaces]);

  const { mutateAsync: deleteWorkspace, isPending } = useMutation({
    mutationFn: workspacesService.deleteWorkspace,
    onSuccess: () => {
      notificationsService.success(
        t(
          "workspaces:singleWorkspace.modals.deleteWorkspaceModal.notifications.success"
        )
      );
      queryClient.invalidateQueries({ queryKey: ["workspaces", accountID] });
    },
    onError: (error: AxiosError) => {
      console.error(error);
      switch (error.response?.status) {
        case 404:
          notificationsService.error(
            t(
              "workspaces:singleWorkspace.modals.deleteWorkspaceModal.notifications.errorNoId"
            )
          );
          break;
        default:
          notificationsService.error(
            t(
              "workspaces:singleWorkspace.modals.deleteWorkspaceModal.notifications.error"
            )
          );
          navigate("/server-error");
      }
      queryClient.invalidateQueries({ queryKey: ["workspaces", accountID] });
    },
  });

  const pinToSidebar = () => {
    if (workspaceId) {
      updateWorkspaceMutation.mutate({
        workspaceId,
        isHidden: false,
      });
      setIsHidden(false);
      var currentDate = new Date();
      setLastInteraction(currentDate);
      updateWorkspaceInteractionMutation.mutate({
        workspaceId,
        lastInteraction: currentDate,
      });
    }
  };

  const hideFromSidebar = () => {
    if (workspaceId) {
      updateWorkspaceMutation.mutate({
        workspaceId,
        isHidden: true,
      });
      setIsHidden(true);
    }
  };

  const showWorkspaceDetails = () => {
    if (workspaceId) {
      setSelectedWorkspace(workspaceId);
    }
  };

  const showWorkspaceFiles = () => {
    if (workspaceId) {
      setSelectedWorkspaceFiles(workspaceId);
    }
  };

  const toggleWorkspaceModal = useCallback(() => {
    setWorkspaceDropdown(!isWorkspaceDropdown);
  }, [isWorkspaceDropdown]);

  const handleClose = useCallback(() => {
    setWorkspaceDropdown(false);
  }, []);

  const openWorkspaceModal = (onClick?: () => void) => {
    if (onClick) {
      onClick();
      setWorkspaceDropdown(false);
    }
  };

  const transferWorkspace = () => {
    console.log("Transferring workspace...");
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setIsLoadingOnDelete(true);

    if (workspaceId) {
      deleteWorkspace(workspaceId).finally(() => {
        setIsLoadingOnDelete(false);
        handleDeleteCancel();
        navigate(`/workspaces`);
      });
    } else {
      setIsLoadingOnDelete(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const handleLeave = () => {
    setShowLeaveDialog(true);
  };

  const handleLeaveConfirm = () => {
    setIsLoadingOnLeave(true);

    if (workspaceId && workspaceId != null) {
      leaveWorkspaceMutation.mutate(
        { workspaceId: workspaceId },
        {
          onSuccess() {
            setIsLoadingOnLeave(false);
            handleLeaveCancel();
            notificationsService.success(
              t("workspaces:common.notifications.leaveWorkspace")
            );
            navigate(`/workspaces`);
          },
          onError() {
            setIsLoadingOnLeave(false);
            notificationsService.error(
              t("workspaces:common.notifications.serverError")
            );
          },
        }
      );
    } else {
      setIsLoadingOnLeave(false);
    }
  };

  const handleLeaveCancel = () => {
    setShowLeaveDialog(false);
  };

  const dropdownMenuData: DropdownMenuItem[] = [
    {
      label: "workspaces:singleWorkspace.dropdownLinks.about",
      Icon: TbInfoCircle,
      onClick: showWorkspaceDetails,
    },
    ...(showLeaveWorkspaceLink
      ? [
          {
            label: "workspaces:singleWorkspace.dropdownLinks.leave",
            Icon: TbStackPop,
            onClick: handleLeave,
          },
        ]
      : []),
    ...(showFiles
      ? [
          {
            label: "workspaces:singleWorkspace.dropdownLinks.files",
            Icon: TbFileDescription,
            onClick: showWorkspaceFiles,
          },
        ]
      : []),
    ...(showEditWorkspaceLink
      ? [
          {
            label: "workspaces:singleWorkspace.dropdownLinks.edit",
            Icon: TbEditCircle,
            redirectTo: `/workspaces/${workspaceId}/edit`,
          },
          /* {
           label: "Transfer Workspace",
           Icon: TbTransform,
           onClick: transferWorkspace,
         },*/
          {
            label: "workspaces:singleWorkspace.dropdownLinks.delete",
            Icon: TbTrash,
            onClick: handleDelete,
          },
          {
            label: "workspaces:singleWorkspace.dropdownLinks.share", // Add Copy Link Option
            Icon: TbShare,
            onClick: () => handleShareWorkspace(workspaceId), // Call the handleCopyLink function
          },
        ]
      : []),
    ...(isHidden || !lastInteraction
      ? [
          {
            label: "workspaces:singleWorkspace:dropdownLinks:pin",
            Icon: TbPin,
            onClick: pinToSidebar,
          },
        ]
      : [
          {
            label: "workspaces:singleWorkspace.dropdownLinks.hide",
            Icon: TbPinnedOff,
            onClick: hideFromSidebar,
          },
        ]),
  ];

  const handleShareWorkspace = (workspaceId: string | null) => {
    if (workspaceId) {
      const workspaceLink = `${window.location.origin}/workspaces/${workspaceId}`;
      handleCopyContent({
        htmlToCopy: workspaceLink,
        setMessageCopyOk: setShareWorkspace,
        errorMessage: t(
          "workspaces:singleWorkspace:modals:shareWorkspace.errorNotification"
        ),
        successMessage: t(
          "workspaces:singleWorkspace:modals:shareWorkspace.successNotification"
        ),
      });
    }
  };

  if (isLoadingOnDelete) {
    return <Loader />;
  }

  if (isLoading) {
    return (
      <Skeleton
        variant="rounded"
        className={`transform transition-transform duration-200 ease-out mt-2 ml-3 ${
          open ? "translate-x-[1.8em]" : "translate-x-0"
        }`}
        animation="pulse"
        width={150}
        height={30}
        sx={{ bgcolor: "grey.800", borderRadius: "10px" }}
      />
    );
  }

  return (
    <div className="relative text-white-100">
      <button
        ref={anchorRef}
        onClick={toggleWorkspaceModal}
        aria-label="Choose Model Option"
        className={`flex items-center justify-start hover:bg-gray-600 relative group ${
          isWorkspaceDropdown ? "bg-gray-600" : "bg-gray-800"
        } transform transition-all text-white-100 pl-3 pr-2 pt-[4px] pb-[6px] mt-[3px] rounded-lg text-md duration-200 ease-out
        capitalize`}
      >
        <span className="font-semibold">
          {name.length > 20
            ? name.slice(0, 20) + ".."
            : isSmallMobile
            ? name.slice(0, 8) + ".."
            : isMobile
            ? name.slice(0, 16) + ".."
            : name}
        </span>
        <div
          className={`mt-1 ml-1 transform transition-transform duration-200 ${
            isWorkspaceDropdown
              ? "rotate-180 text-white-100"
              : "rotate-0 text-gray-300"
          } `}
        >
          <FiChevronDown strokeWidth={2} />
        </div>
        <Tooltip
          text="workspaces:common:tooltips:workspaceLink"
          position="left-0 top-11"
        />
      </button>

      {isWorkspaceDropdown && (
        <StyledPopover
          open={isWorkspaceDropdown}
          onClose={handleClose}
          anchorEl={anchorRef.current}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          topMargin={8}
          disableScrollLock={true}
        >
          {dropdownMenuData.map((item, index) => (
            <DropdownMenuButton
              key={index}
              Icon={item.Icon}
              label={t(item.label)}
              iconSize={20}
              gap={2}
              onClick={
                item.onClick
                  ? () => openWorkspaceModal(item.onClick)
                  : undefined
              }
              redirectTo={item.redirectTo}
            />
          ))}
        </StyledPopover>
      )}
      {selectedWorkspace && (
        <>
          <WorkspaceDetailsDialog
            isOpen={!!selectedWorkspace}
            workspaceId={selectedWorkspace}
            onClose={() => setSelectedWorkspace(null)}
          />
        </>
      )}
      {showDeleteDialog && ( // Updated to use showDeleteDialog state
        <ConfirmActionDialog
          title={t(
            "workspaces:singleWorkspace:modals:deleteWorkspaceModal.title"
          )}
          message={t(
            "workspaces:singleWorkspace:modals:deleteWorkspaceModal.paragraph"
          )}
          cancelBtn={t(
            "workspaces:singleWorkspace:modals:deleteWorkspaceModal.cancelBtn"
          )}
          confirmBtn={t(
            "workspaces:singleWorkspace:modals:deleteWorkspaceModal.deleteBtn"
          )}
          open={showDeleteDialog}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
      {showFiles && (
        <FilesModal
          title={t("workspaces:singleWorkspace:modals:filesModal.title")}
          manageBtn={t(
            "workspaces:singleWorkspace:modals:filesModal.manageBtn"
          )}
          addBtn={t("workspaces:singleWorkspace:modals:filesModal.addBtn")}
          isOpen={!!selectedWorkspaceFiles}
          workspaceId={selectedWorkspaceFiles || ""}
          onClose={() => setSelectedWorkspaceFiles(null)}
        />
      )}
      {showLeaveDialog && ( // Updated to use showLeaveDialog state
        <ConfirmActionDialog
          open={showLeaveDialog}
          title={t(
            "workspaces:singleWorkspace:modals:leaveWorkspaceModal.title"
          )}
          message={t(
            "workspaces:singleWorkspace:modals:leaveWorkspaceModal.paragraph"
          )}
          cancelBtn={t(
            "workspaces:singleWorkspace:modals:leaveWorkspaceModal.cancelBtn"
          )}
          confirmBtn={t(
            "workspaces:singleWorkspace:modals:leaveWorkspaceModal.leaveBtn"
          )}
          onCancel={handleLeaveCancel}
          onConfirm={handleLeaveConfirm}
          onClose={() => setShowLeaveDialog(false)}
        />
      )}
    </div>
  );
};

export default WorkspaceDropdown;
