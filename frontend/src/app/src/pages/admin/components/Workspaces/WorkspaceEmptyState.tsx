import React from "react";
import { Box, Typography } from "@mui/material";
import { TbFolder } from "react-icons/tb";
import { WorkspaceEmptyStateProps } from "./types";

const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({ hasFilters = false }) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={6}>
      <TbFolder size={48} className="text-gray-400" />
      <Typography variant="h6" className="!text-white-100 !font-body">
        No workspaces found
      </Typography>
      <Typography variant="body2" className="!text-gray-300 !font-body">
        {hasFilters 
          ? "No workspaces match your current filters. Try adjusting your search criteria."
          : "There are currently no workspaces to display"}
      </Typography>
    </Box>
  );
};

export default WorkspaceEmptyState;