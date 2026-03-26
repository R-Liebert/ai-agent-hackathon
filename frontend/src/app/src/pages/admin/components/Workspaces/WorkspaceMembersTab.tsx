import React from "react";
import { Box } from "@mui/material";
import WorkspaceMembers from "./WorkspaceMembers";
import { WorkspaceMemberDto } from "../../../../services/admin/types/adminWorkspace.types";

type WorkspaceMembersTabProps = {
  members?: WorkspaceMemberDto[];
  hasMore?: boolean;
  continuationToken?: string;
  onLoadMore: (token?: string) => void;
};

const WorkspaceMembersTab: React.FC<WorkspaceMembersTabProps> = ({
  members,
  hasMore,
  continuationToken,
  onLoadMore,
}) => {
  return (
    <Box>
      <WorkspaceMembers
        members={members || []}
        hasMore={hasMore}
        continuationToken={continuationToken}
        onLoadMore={onLoadMore}
      />
    </Box>
  );
};

export default WorkspaceMembersTab;