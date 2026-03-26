import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../app-card";
import { IoFileTrayFullOutline, IoPeopleOutline } from "react-icons/io5";
import WorkspaceAvatar from "./workspace-avatar";
import { useTranslation } from "react-i18next";
import { WorkspaceMemberDto } from "../../models/workspace-model";

interface WorkspaceCardProps {
  workspace: {
    workspaceId: string;
    workspaceName: string;
    files: number;
    memberCount: number;
    members: WorkspaceMemberDto[];
    imageUrl?: string;
    color?: string;
  };
  onWorkspaceCardClick: (workspaceId: string) => void;
}

const WorkspaceCard = React.memo(
  ({ workspace, onWorkspaceCardClick }: WorkspaceCardProps) => {
    const {
      workspaceId,
      workspaceName,
      imageUrl,
      files,
      members,
      memberCount,
      color = "",
    } = workspace;

    const navigate = useNavigate();
    const { t } = useTranslation();

    const getFirstLetter = (): string => {
      if (!workspaceName) return "";
      return workspaceName.charAt(0).toUpperCase();
    };

    const handleWorkspaceClick = () => {
      navigate(`/workspaces/${workspaceId}`);
    };

    return (
      <Card
        title={workspaceName}
        color={color}
        icon={
          <>
            {!imageUrl && (
              <span className="text-[1.8rem] font-semibold text-white-100 font-headers">
                {getFirstLetter()}
              </span>
            )}
            {imageUrl && <WorkspaceAvatar imageUrl={imageUrl} size="md" />}
          </>
        }
        additionalInfo={
          <>
            <div className="flex items-center mr-6">
              <IoFileTrayFullOutline className="text-2xl mr-2" />
              <p>
                {files > 1
                  ? `${files} ${t(
                      "workspaces:listing:cardData:filesQty:plural"
                    )}`
                  : `${files} ${t(
                      "workspaces:listing:cardData:filesQty:single"
                    )}`}
              </p>
            </div>
            <div className="flex items-center">
              <IoPeopleOutline className="text-2xl mr-2" />
              <p>
                {memberCount > 1
                  ? `${memberCount} ${t(
                      "workspaces:listing:cardData:membersQty:plural"
                    )}`
                  : `${memberCount} ${t(
                      "workspaces:listing:cardData:membersQty:single"
                    )}`}
              </p>
            </div>
          </>
        }
        onClick={handleWorkspaceClick}
        variant="workspace"
      />
    );
  }
);

// Add display name for better debugging
WorkspaceCard.displayName = "WorkspaceCard";

export default WorkspaceCard;
