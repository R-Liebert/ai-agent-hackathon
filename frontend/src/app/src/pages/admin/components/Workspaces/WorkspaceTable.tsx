import React, { memo, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  TbFolder,
  TbUsers,
  TbFiles,
  TbClock,
  TbCheck,
  TbAlertCircle,
  TbX,
  TbRefresh,
} from "react-icons/tb";
import {
  AdminWorkspaceSummaryDto,
  WorkspaceProcessingStatus,
} from "../../../../services/admin/types/adminWorkspace.types";
import { WorkspaceTableProps, SortField, SortDirection } from "./types";
import WorkspaceEmptyState from "./WorkspaceEmptyState";
import { formatRelativeDateTime, formatDateTime } from "./utils";
import {
  getAdminTableContainerStyles,
  getAdminTableSortHeaderStyles,
  getSortIcon,
  getAdminTableRowHoverStyles,
  getAdminTableHeaderCellStyles,
  getAdminTableHeaderTextStyles,
  getAdminTableCellBorderStyles,
  adminTableClasses,
  getStatusChipStyles,
  getAdminButtonStyles,
} from "../shared/adminTableStyles";
import Tooltip from "../../../../components/Global/Tooltip";

const WorkspaceTable: React.FC<WorkspaceTableProps> = ({
  workspaces,
  onWorkspaceClick,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  totalCount,
  sortBy,
  sortDescending,
  onSortChange,
}) => {
  const handleSort = (
    field: "Name" | "CreatedAt" | "UpdatedAt" | "MembersCount" | "FileCount"
  ) => {
    if (sortBy === field) {
      onSortChange(field, !sortDescending);
    } else {
      onSortChange(field, false);
    }
  };

  const getStatusColor = (status: WorkspaceProcessingStatus): string => {
    switch (status) {
      case "Completed":
        return "#22c55e"; // Brighter green
      case "Failed":
        return "#ef4444"; // Brighter red
      case "Processing":
        return "#f59e0b"; // Brighter amber
      case "Pending":
      default:
        return "#94a3b8"; // Lighter gray
    }
  };

  const getStatusIcon = (status: WorkspaceProcessingStatus) => {
    switch (status) {
      case "Completed":
        return <TbCheck size={16} />;
      case "Failed":
        return <TbX size={16} />;
      case "Processing":
        return <TbRefresh size={16} className="animate-spin" />;
      case "Pending":
      default:
        return <TbClock size={16} />;
    }
  };

  // Use shared relative formatter

  const renderConfigurationChips = (workspace: AdminWorkspaceSummaryDto) => {
    const configs = [];

    if (workspace.showCitations) {
      configs.push(
        <Tooltip key="citations" text="Citations enabled" useMui>
          <Chip
            label="Citations"
            size="small"
            sx={{
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              color: "#22c55e",
              border: "1px solid #22c55e",
              fontFamily: '"Nunito Sans", sans-serif',
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          />
        </Tooltip>
      );
    }

    if (workspace.advancedFileAnalysis) {
      configs.push(
        <Tooltip key="advanced" text="Advanced file analysis enabled" useMui>
          <Chip
            label="Advanced"
            size="small"
            sx={{
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              color: "#22c55e",
              border: "1px solid #22c55e",
              fontFamily: '"Nunito Sans", sans-serif',
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          />
        </Tooltip>
      );
    }

    if (workspace.isConservative) {
      configs.push(
        <Tooltip key="conservative" text="Conservative mode enabled" useMui>
          <Chip
            label="Conservative"
            size="small"
            sx={{
              backgroundColor: "rgba(245, 158, 11, 0.2)",
              color: "#f59e0b",
              border: "1px solid #f59e0b",
              fontFamily: '"Nunito Sans", sans-serif',
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          />
        </Tooltip>
      );
    }

    if (workspace.isFileAccessRestrictedForMembers) {
      configs.push(
        <Tooltip
          key="restricted"
          text="File access restricted for members"
          useMui
        >
          <Chip
            label="Restricted"
            size="small"
            sx={{
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              color: "#ef4444",
              border: "1px solid #ef4444",
              fontFamily: '"Nunito Sans", sans-serif',
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          />
        </Tooltip>
      );
    }

    if (workspace.emailNotificationsDisabled) {
      configs.push(
        <Tooltip key="no-email" text="Email notifications disabled" useMui>
          <Chip
            label="No Email"
            size="small"
            sx={{
              backgroundColor: "rgba(148, 163, 184, 0.2)",
              color: "#94a3b8",
              border: "1px solid #94a3b8",
              fontFamily: '"Nunito Sans", sans-serif',
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          />
        </Tooltip>
      );
    }

    return configs.length > 0 ? (
      <Box display="flex" gap={0.5} flexWrap="wrap">
        {configs}
      </Box>
    ) : (
      <Typography
        variant="caption"
        sx={{ color: "#a3a3a3", fontStyle: "italic" }}
      >
        Default settings
      </Typography>
    );
  };

  return (
    <>
      <TableContainer
        component={Paper}
        className={adminTableClasses.container}
        sx={getAdminTableContainerStyles()}
      >
        <Table className={adminTableClasses.table}>
          <TableHead>
            <TableRow className={adminTableClasses.headerRow}>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{ ...getAdminTableHeaderCellStyles(), minWidth: 250 }}
              >
                <Box
                  onClick={() => handleSort("Name")}
                  sx={getAdminTableSortHeaderStyles(sortBy === "Name")}
                >
                  <Typography sx={getAdminTableHeaderTextStyles()}>
                    Workspace
                  </Typography>
                  {getSortIcon(
                    sortBy === "Name",
                    sortBy === "Name" ? (sortDescending ? "desc" : "asc") : null
                  )}
                </Box>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 120,
                  textAlign: "center",
                }}
              >
                <Typography sx={getAdminTableHeaderTextStyles()}>
                  Status
                </Typography>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{ ...getAdminTableHeaderCellStyles(), minWidth: 250 }}
              >
                <Typography sx={getAdminTableHeaderTextStyles()}>
                  Configuration
                </Typography>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 100,
                  textAlign: "center",
                }}
              >
                <Box
                  onClick={() => handleSort("MembersCount")}
                  sx={getAdminTableSortHeaderStyles(
                    sortBy === "MembersCount",
                    "#f92a4b",
                    true
                  )}
                >
                  <Typography sx={getAdminTableHeaderTextStyles()}>
                    Members
                  </Typography>
                  {getSortIcon(
                    sortBy === "MembersCount",
                    sortBy === "MembersCount"
                      ? sortDescending
                        ? "desc"
                        : "asc"
                      : null
                  )}
                </Box>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 100,
                  textAlign: "center",
                }}
              >
                <Box
                  onClick={() => handleSort("FileCount")}
                  sx={getAdminTableSortHeaderStyles(
                    sortBy === "FileCount",
                    "#f92a4b",
                    true
                  )}
                >
                  <Typography sx={getAdminTableHeaderTextStyles()}>
                    Files
                  </Typography>
                  {getSortIcon(
                    sortBy === "FileCount",
                    sortBy === "FileCount"
                      ? sortDescending
                        ? "desc"
                        : "asc"
                      : null
                  )}
                </Box>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{ ...getAdminTableHeaderCellStyles(), minWidth: 140 }}
              >
                <Box
                  onClick={() => handleSort("CreatedAt")}
                  sx={getAdminTableSortHeaderStyles(
                    sortBy === "CreatedAt",
                    "#f92a4b",
                    true
                  )}
                >
                  <Typography sx={getAdminTableHeaderTextStyles()}>
                    Created
                  </Typography>
                  {getSortIcon(
                    sortBy === "CreatedAt",
                    sortBy === "CreatedAt"
                      ? sortDescending
                        ? "desc"
                        : "asc"
                      : null
                  )}
                </Box>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{ ...getAdminTableHeaderCellStyles(), minWidth: 140 }}
              >
                <Box
                  onClick={() => handleSort("UpdatedAt")}
                  sx={getAdminTableSortHeaderStyles(
                    sortBy === "UpdatedAt",
                    "#f92a4b",
                    true
                  )}
                >
                  <Typography sx={getAdminTableHeaderTextStyles()}>
                    Updated
                  </Typography>
                  {getSortIcon(
                    sortBy === "UpdatedAt",
                    sortBy === "UpdatedAt"
                      ? sortDescending
                        ? "desc"
                        : "asc"
                      : null
                  )}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workspaces.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  className="!font-body !text-white-100 !border-gray-500"
                  sx={{ py: 6 }}
                >
                  <WorkspaceEmptyState hasFilters={false} />
                </TableCell>
              </TableRow>
            ) : (
              workspaces.map((workspace, index) => (
                <TableRow
                  key={workspace.id}
                  onClick={() => onWorkspaceClick(workspace.id)}
                  className="hover:!bg-gray-600 transition-colors duration-200 cursor-pointer"
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(66, 70, 84, 0.4) !important",
                    },
                  }}
                >
                  <TableCell
                    className={adminTableClasses.bodyCell}
                    sx={getAdminTableCellBorderStyles(
                      index === workspaces.length - 1
                    )}
                  >
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <TbFolder size={18} className="text-blue-400" />
                        <Typography
                          variant="body2"
                          className="!text-white-100"
                          sx={{ fontWeight: 600 }}
                        >
                          {workspace.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        className="!text-gray-300 !font-mono"
                        sx={{ fontSize: "0.75rem" }}
                      >
                        {workspace.id}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell
                    className={adminTableClasses.bodyCell}
                    sx={{
                      ...getAdminTableCellBorderStyles(
                        index === workspaces.length - 1
                      ),
                      textAlign: "center",
                    }}
                  >
                    <Chip
                      icon={getStatusIcon(workspace.processingStatus)}
                      label={workspace.processingStatus}
                      size="small"
                      sx={{
                        backgroundColor:
                          workspace.processingStatus === "Completed"
                            ? "rgba(34, 197, 94, 0.2)"
                            : workspace.processingStatus === "Failed"
                            ? "rgba(239, 68, 68, 0.2)"
                            : workspace.processingStatus === "Processing"
                            ? "rgba(245, 158, 11, 0.2)"
                            : "rgba(148, 163, 184, 0.2)",
                        color: getStatusColor(workspace.processingStatus),
                        border: `1px solid ${getStatusColor(
                          workspace.processingStatus
                        )}`,
                        fontFamily: '"Nunito Sans", sans-serif',
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        "& .MuiChip-icon": {
                          color: getStatusColor(workspace.processingStatus),
                        },
                      }}
                    />
                  </TableCell>

                  <TableCell
                    className={adminTableClasses.bodyCell}
                    sx={getAdminTableCellBorderStyles(
                      index === workspaces.length - 1
                    )}
                  >
                    {renderConfigurationChips(workspace)}
                  </TableCell>

                  <TableCell
                    className={adminTableClasses.bodyCell}
                    sx={{
                      ...getAdminTableCellBorderStyles(
                        index === workspaces.length - 1
                      ),
                      textAlign: "center",
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={0.5}
                    >
                      <TbUsers size={16} className="text-blue-400" />
                      <Typography
                        variant="body2"
                        className="!text-white-100"
                        sx={{ fontWeight: 600 }}
                      >
                        {workspace.membersCount ?? 0}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell
                    className={adminTableClasses.bodyCell}
                    sx={{
                      ...getAdminTableCellBorderStyles(
                        index === workspaces.length - 1
                      ),
                      textAlign: "center",
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={0.5}
                    >
                      <TbFiles size={16} className="text-blue-400" />
                      <Typography
                        variant="body2"
                        className="!text-white-100"
                        sx={{ fontWeight: 600 }}
                      >
                        {workspace.fileCount ?? 0}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell
                    className={adminTableClasses.bodyCell}
                    sx={{
                      ...getAdminTableCellBorderStyles(
                        index === workspaces.length - 1
                      ),
                      textAlign: "center",
                    }}
                  >
                    <Tooltip text={formatDateTime(workspace.createdAt)} useMui>
                      <Typography variant="body2" className="!text-white-100">
                        {formatRelativeDateTime(workspace.createdAt)}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  <TableCell
                    className={adminTableClasses.bodyCell}
                    sx={{
                      ...getAdminTableCellBorderStyles(
                        index === workspaces.length - 1
                      ),
                      textAlign: "center",
                    }}
                  >
                    <Tooltip text={formatDateTime(workspace.updatedAt)} useMui>
                      <Typography variant="body2" className="!text-white-100">
                        {formatRelativeDateTime(workspace.updatedAt)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {hasMore && onLoadMore && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={isLoading}
            sx={{
              textTransform: "none",
              borderRadius: "9999px",
              backgroundColor: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.35)",
              color: "#60a5fa",
              py: 0.75,
              px: 3,
              fontSize: "0.95rem",
              minWidth: 180,
              "&:hover": {
                backgroundColor: "rgba(59,130,246,0.25)",
                border: "1px solid rgba(59,130,246,0.55)",
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.25)",
                color: "#60a5fa",
                opacity: 0.7,
              },
            }}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} sx={{ color: "#60a5fa" }} />
              ) : undefined
            }
          >
            {isLoading ? "Loading more workspaces..." : "Load more"}
          </Button>
        </Box>
      )}
    </>
  );
};

export default memo(WorkspaceTable);
