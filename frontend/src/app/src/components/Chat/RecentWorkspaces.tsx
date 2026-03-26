import React, { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BiSolidHide } from "react-icons/bi";
import { CircularProgress } from "@mui/material";
import DropdownMenuButton from "../Global/DropdownMenuButton";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { StyledPopover } from "../StyledPopover";
import WorkspaceAvatar from "../Workspaces/workspace-avatar";
import { useTranslation } from "react-i18next";
import { FiMoreHorizontal } from "react-icons/fi";
import { useIsLeader } from "../../contexts/AuthProvider";

interface RecentWorkspacesProps {
  onNewChat?: () => void;
}

const RecentWorkspaces: React.FC<RecentWorkspacesProps> = React.memo(
  ({ onNewChat }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const isLeader = useIsLeader();
    const showLeaderChat = isLeader;
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
      null
    );
    const { isLoading, error, updateWorkspaceMutation, getRecentWorkspaces } =
      useWorkspaces();

    const handleWorkspaceClick = useCallback(
      (workspaceId: string) => {
        if (location.pathname.includes(`/workspaces/${workspaceId}`)) {
          onNewChat?.(); // Use optional chaining to avoid calling undefined
        } else {
          navigate(`/workspaces/${workspaceId}`);
        }
      },
      [location.pathname, navigate, onNewChat]
    );

    const handleItemClick = useCallback(
      (route: string) => {
        if (location.pathname.includes(route)) {
          onNewChat?.(); // Use optional chaining
        } else {
          navigate(route);
        }
      },
      [location.pathname, navigate, onNewChat]
    );

    const handleThreeDotsClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>, workspaceId: string) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setActiveWorkspaceId(workspaceId);
      },
      []
    );

    const handleClose = useCallback(() => {
      setAnchorEl(null);
      setActiveWorkspaceId(null);
    }, []);

    const handleHideWorkspace = () => {
      if (activeWorkspaceId) {
        updateWorkspaceMutation.mutate({
          workspaceId: activeWorkspaceId,
          isHidden: true,
        });
        handleClose();
      }
    };

    if (isLoading) {
      return (
        <div className="flex justify-center items-center px-3 py-2">
          <CircularProgress sx={{ color: "#FFFFFF" }} size={40} />
        </div>
      );
    }
    if (error)
      return (
        <div className="px-3 py-2">
          Error fetching workspaces: {error.message}
        </div>
      );

    const recentWorkspaces = getRecentWorkspaces();

    return (
      <div className="py-2 pl-1 pr-1">
        <ul className="space-y-1">
          {recentWorkspaces.map((workspace) => (
            <li
              key={workspace.id}
              className={`group relative rounded-lg h-9 ${
                activeWorkspaceId === workspace.id ? "bg-neutral-800" : ""
              }`}
            >
              <div
                role="button"
                onClick={() => handleWorkspaceClick(workspace.id)}
                className="w-full flex items-center px-2 h-full text-sm font-normal rounded-lg hover:bg-gray-600"
              >
                <WorkspaceAvatar
                  imageUrl={workspace.imageUrl}
                  color={workspace.color}
                  alt={workspace.name.charAt(0).toUpperCase()}
                  size="sm"
                />
                <span
                  className={`ml-3 truncate transition-all duration-200 ease-in-out ${
                    activeWorkspaceId === workspace.id
                      ? "max-w-[calc(100%-5.5rem)]"
                      : "group-hover:max-w-[calc(100%-5.5rem)] max-w-[calc(100%-3rem)]"
                  }`}
                >
                  {workspace.name}
                </span>
                <div
                  className={`flex items-center absolute right-2 top-1/2 transform -translate-y-1/2 ${
                    activeWorkspaceId === workspace.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <button
                    className="!text-white-100 hover:!text-superwhite mr-1"
                    aria-label={workspace.id}
                    onClick={(e) => handleThreeDotsClick(e, workspace.id)}
                  >
                    <FiMoreHorizontal size={20} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <StyledPopover
          open={activeWorkspaceId !== null}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
        >
          <DropdownMenuButton
            key={activeWorkspaceId}
            Icon={<BiSolidHide fontSize={20} />}
            label={"Hide from sidebar"}
            onClick={handleHideWorkspace}
            gap={2}
          />
        </StyledPopover>
      </div>
    );
  }
);

RecentWorkspaces.displayName = "RecentWorkspaces";

export default RecentWorkspaces;
