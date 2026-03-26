import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
} from "@mui/material";
import {
  TbRefresh,
  TbTrash,
  TbPlayerStop,
  TbChevronDown,
  TbInbox,
} from "react-icons/tb";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import {
  HangfireJob,
  JobState,
  JobSortField,
  SortDirection,
  JOB_STATE_COLORS,
  getJobStateColor,
} from "../../../../services/admin/types/hangfire.types";
import {
  getAdminTableContainerStyles,
  getAdminTableHeaderCellStyles,
  getAdminTableRowHoverStyles,
  getAdminTableCellBorderStyles,
  adminTableClasses,
} from "../shared/adminTableStyles";
import Tooltip from "../../../../components/Global/Tooltip";

interface JobsTableProps {
  jobs: HangfireJob[];
  state: JobState;
  onJobClick: (jobId: string) => void;
  onRequeue: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalCount?: number;
  sortBy?: JobSortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: JobSortField, direction: SortDirection) => void;
}

const focusVisibleStyles = {
  "&:focus-visible": {
    outline: "2px solid rgba(96, 165, 250, 0.7)",
    outlineOffset: 2,
  },
};

const formatFullDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateString);
};

const truncateJobName = (name: string, maxLength: number = 40): string => {
  if (name.length <= maxLength) return name;
  return `${name.substring(0, maxLength)}...`;
};

const getStateTimestamp = (job: HangfireJob): string | null => {
  switch (job.state) {
    case "Enqueued":
      return job.enqueuedAt;
    case "Scheduled":
      return job.scheduledAt;
    case "Processing":
      return job.startedAt;
    case "Succeeded":
      return job.succeededAt;
    case "Failed":
      return job.failedAt;
    case "Deleted":
      return job.deletedAt;
    default:
      return job.createdAt;
  }
};

const JobsTable: React.FC<JobsTableProps> = ({
  jobs,
  state,
  onJobClick,
  onRequeue,
  onDelete,
  onCancel,
  isLoading,
  onLoadMore,
  hasMore,
  totalCount,
  sortBy = "stateAt",
  sortDirection = "desc",
  onSortChange,
}) => {
  // Jobs are sorted server-side, no client-side sorting needed

  const handleSort = (field: JobSortField) => {
    if (!onSortChange) return;

    if (sortBy === field) {
      // Toggle direction
      onSortChange(field, sortDirection === "desc" ? "asc" : "desc");
    } else {
      // New field, default to descending
      onSortChange(field, "desc");
    }
  };

  const getSortIcon = (field: JobSortField) => {
    const isActive = sortBy === field;
    const baseStyles = {
      marginLeft: "4px",
      transition: "all 0.2s ease",
      fontSize: "0.7rem",
    };

    if (!isActive || !onSortChange) {
      return (
        <FaSort
          aria-hidden="true"
          style={{
            ...baseStyles,
            color: "#9ca3af",
            opacity: onSortChange ? 0.6 : 0,
          }}
        />
      );
    }

    const IconComponent = sortDirection === "desc" ? FaSortDown : FaSortUp;
    return (
      <IconComponent
        aria-hidden="true"
        style={{
          ...baseStyles,
          color: "#60a5fa",
          opacity: 1,
        }}
      />
    );
  };

  if (jobs.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          backgroundColor: "#1a1a1a",
          border: "1px solid #313131",
          borderRadius: 2,
          textAlign: "center",
        }}
        role="status"
        aria-label={`No ${state.toLowerCase()} jobs found`}
      >
        <TbInbox size={48} color="#9ca3af" aria-hidden="true" />
        <Typography sx={{ color: "#9ca3af", mt: 2 }}>
          No {state.toLowerCase()} jobs found
        </Typography>
      </Paper>
    );
  }

  const canRequeue = state === "Failed" || state === "Deleted";
  const canCancel = state === "Processing";
  const showException = state === "Failed";

  return (
    <Box>
      {/* Total count indicator */}
      {totalCount !== undefined && (
        <Typography
          variant="body2"
          sx={{ color: "#9ca3af", mb: 2 }}
          role="status"
          aria-live="polite"
        >
          Showing {jobs.length} of {totalCount.toLocaleString()} jobs
        </Typography>
      )}

      <TableContainer
        component={Paper}
        sx={getAdminTableContainerStyles()}
        className={adminTableClasses.container}
      >
        <Table aria-label={`${state} jobs table`}>
          <TableHead>
            <TableRow>
              <TableCell sx={getAdminTableHeaderCellStyles()} scope="col">
                <Typography
                  sx={{
                    color: "#EDEDED",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Job ID
                </Typography>
              </TableCell>
              <TableCell sx={getAdminTableHeaderCellStyles()} scope="col">
                <Typography
                  sx={{
                    color: "#EDEDED",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Job Name
                </Typography>
              </TableCell>
              <TableCell sx={getAdminTableHeaderCellStyles()} scope="col">
                <Typography
                  sx={{
                    color: "#EDEDED",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Queue
                </Typography>
              </TableCell>
              <TableCell sx={getAdminTableHeaderCellStyles()} scope="col">
                <Box
                  component="button"
                  onClick={() => handleSort("createdAt")}
                  aria-label={`Sort by created date, currently ${sortBy === "createdAt" ? sortDirection : "unsorted"}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: onSortChange ? "pointer" : "default",
                    userSelect: "none",
                    color: sortBy === "createdAt" ? "#60a5fa" : "#EDEDED",
                    transition: "color 0.2s ease",
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                    "&:hover": onSortChange
                      ? {
                          color: "#60a5fa",
                        }
                      : {},
                    ...focusVisibleStyles,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "inherit",
                    }}
                  >
                    Created
                  </Typography>
                  {getSortIcon("createdAt")}
                </Box>
              </TableCell>
              <TableCell sx={getAdminTableHeaderCellStyles()} scope="col">
                <Box
                  component="button"
                  onClick={() => handleSort("stateAt")}
                  aria-label={`Sort by ${state.toLowerCase()} date, currently ${sortBy === "stateAt" ? sortDirection : "unsorted"}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: onSortChange ? "pointer" : "default",
                    userSelect: "none",
                    color: sortBy === "stateAt" ? "#60a5fa" : "#EDEDED",
                    transition: "color 0.2s ease",
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                    "&:hover": onSortChange
                      ? {
                          color: "#60a5fa",
                        }
                      : {},
                    ...focusVisibleStyles,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "inherit",
                    }}
                  >
                    {state} At
                  </Typography>
                  {getSortIcon("stateAt")}
                </Box>
              </TableCell>
              {state !== "Succeeded" && state !== "Deleted" && (
                <TableCell sx={getAdminTableHeaderCellStyles()} scope="col">
                  <Typography
                    sx={{
                      color: "#EDEDED",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Retries
                  </Typography>
                </TableCell>
              )}
              {showException && (
                <TableCell sx={getAdminTableHeaderCellStyles()} scope="col">
                  <Typography
                    sx={{
                      color: "#EDEDED",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Error
                  </Typography>
                </TableCell>
              )}
              <TableCell sx={{ ...getAdminTableHeaderCellStyles(), width: 120 }} scope="col">
                <Typography
                  sx={{
                    color: "#EDEDED",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ backgroundColor: "#262626" }}>
            {jobs.map((job, index) => {
              const isLastRow = index === jobs.length - 1;
              const stateColors = JOB_STATE_COLORS[job.state] || JOB_STATE_COLORS.default;
              const stateTimestamp = getStateTimestamp(job);

              return (
                <TableRow
                  key={job.jobId}
                  onClick={() => onJobClick(job.jobId)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onJobClick(job.jobId);
                    }
                  }}
                  role="button"
                  aria-label={`View details for job ${job.jobId}: ${job.jobName}`}
                  sx={{
                    ...getAdminTableRowHoverStyles(),
                    cursor: "pointer",
                    "&:focus-visible": {
                      outline: "2px solid rgba(96, 165, 250, 0.7)",
                      outlineOffset: -2,
                    },
                  }}
                >
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Typography
                      sx={{
                        color: "#60a5fa",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                      }}
                    >
                      {job.jobId}
                    </Typography>
                  </TableCell>
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Tooltip text={job.jobName} placement="top" useMui>
                      <Typography
                        sx={{
                          color: "#EDEDED",
                          fontSize: "0.875rem",
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {truncateJobName(job.jobName)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Chip
                      label={job.queue || "default"}
                      size="small"
                      aria-label={`Queue: ${job.queue || "default"}`}
                      sx={{
                        backgroundColor: "#424242",
                        color: "#EDEDED",
                        fontSize: "0.7rem",
                        height: 24,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Tooltip text={formatFullDate(job.createdAt)} placement="top" useMui>
                      <Typography
                        sx={{ color: "#9ca3af", fontSize: "0.8rem", cursor: "help" }}
                        aria-label={`Created: ${formatFullDate(job.createdAt)}`}
                      >
                        {formatRelativeTime(job.createdAt)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Tooltip text={formatFullDate(stateTimestamp)} placement="top" useMui>
                      <Typography
                        sx={{
                          color: getJobStateColor(job.state),
                          fontSize: "0.8rem",
                          cursor: "help",
                        }}
                        aria-label={`${state} at: ${formatFullDate(stateTimestamp)}`}
                      >
                        {formatRelativeTime(stateTimestamp)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  {state !== "Succeeded" && state !== "Deleted" && (
                    <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                      <Typography
                        sx={{
                          color:
                            job.retryCount > 0 ? "#f59e0b" : "#9ca3af",
                          fontSize: "0.8rem",
                          fontWeight: job.retryCount > 0 ? 600 : 400,
                        }}
                        aria-label={`Retry count: ${job.retryCount}`}
                      >
                        {job.retryCount}
                      </Typography>
                    </TableCell>
                  )}
                  {showException && (
                    <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                      <Tooltip
                        text={job.exceptionMessage || "No error message"}
                        placement="top"
                        useMui
                      >
                        <Typography
                          sx={{
                            color: "#ef4444",
                            fontSize: "0.75rem",
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {job.exceptionType || job.exceptionMessage || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Box
                      display="flex"
                      gap={0.5}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="group"
                      aria-label={`Actions for job ${job.jobId}`}
                    >
                      {canRequeue && (
                        <Tooltip text="Requeue job" placement="top" useMui>
                          <IconButton
                            size="small"
                            onClick={() => onRequeue(job.jobId)}
                            aria-label={`Requeue job ${job.jobId}`}
                            sx={{
                              color: "#60a5fa",
                              "&:hover": {
                                backgroundColor: "rgba(96, 165, 250, 0.1)",
                              },
                              ...focusVisibleStyles,
                            }}
                          >
                            <TbRefresh size={16} aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canCancel && (
                        <Tooltip text="Cancel job" placement="top" useMui>
                          <IconButton
                            size="small"
                            onClick={() => onCancel(job.jobId)}
                            aria-label={`Cancel job ${job.jobId}`}
                            sx={{
                              color: "#f59e0b",
                              "&:hover": {
                                backgroundColor: "rgba(245, 158, 11, 0.1)",
                              },
                              ...focusVisibleStyles,
                            }}
                          >
                            <TbPlayerStop size={16} aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip text="Delete job" placement="top" useMui>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(job.jobId)}
                          aria-label={`Delete job ${job.jobId}`}
                          sx={{
                            color: "#ef4444",
                            "&:hover": {
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                            },
                            ...focusVisibleStyles,
                          }}
                        >
                          <TbTrash size={16} aria-hidden="true" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Load More */}
      {hasMore && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={isLoading}
            startIcon={<TbChevronDown size={18} aria-hidden="true" />}
            aria-label={isLoading ? "Loading more jobs" : "Load more jobs"}
            sx={{
              textTransform: "none",
              borderRadius: "9999px",
              backgroundColor: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.35)",
              color: "#60a5fa",
              py: 1,
              px: 3,
              "&:hover": {
                backgroundColor: "rgba(59,130,246,0.25)",
                border: "1px solid rgba(59,130,246,0.55)",
              },
              "&.Mui-disabled": {
                opacity: 0.7,
              },
              ...focusVisibleStyles,
            }}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default JobsTable;
