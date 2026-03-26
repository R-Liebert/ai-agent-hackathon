import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import {
  TbRefresh,
  TbTrash,
  TbPlayerStop,
  TbClock,
  TbServer,
  TbList,
  TbCode,
  TbHistory,
} from "react-icons/tb";
import ModalContainer from "../../../../components/Global/ModalContainer";
import Tooltip from "../../../../components/Global/Tooltip";
import { useHangfireJobDetail } from "../../hooks/useHangfireQueries";
import {
  HangfireJobDetail,
  HangfireJobHistory,
  getJobStateColor,
  JOB_STATE_COLORS,
} from "../../../../services/admin/types/hangfire.types";

interface JobDetailModalProps {
  jobId: string | undefined;
  open: boolean;
  onClose: () => void;
  onRequeue: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  onCancel: (jobId: string) => void;
}

const focusVisibleStyles = {
  "&:focus-visible": {
    outline: "2px solid rgba(96, 165, 250, 0.7)",
    outlineOffset: 2,
  },
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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

const shouldAutoRefresh = (state: string): boolean => {
  return ["Enqueued", "Scheduled", "Processing", "Awaiting"].includes(state);
};

const JobDetailModal: React.FC<JobDetailModalProps> = ({
  jobId,
  open,
  onClose,
  onRequeue,
  onDelete,
  onCancel,
}) => {
  const { data: job, isLoading, error, refetch } = useHangfireJobDetail(jobId, open);

  // Auto-refresh for transient states
  useEffect(() => {
    if (!job || !open) return;
    if (!shouldAutoRefresh(job.state)) return;

    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [job, open, refetch]);

  const canRequeue = job?.state === "Failed" || job?.state === "Deleted";
  const canCancel = job?.state === "Processing";

  const stateColors = job ? JOB_STATE_COLORS[job.state] || JOB_STATE_COLORS.default : JOB_STATE_COLORS.default;

  const renderHistory = (history: HangfireJobHistory[]) => {
    const sortedHistory = [...history].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Most recent first
    });

    return (
      <Box
        sx={{ position: "relative", pl: 3 }}
        role="list"
        aria-label="Job state history timeline"
      >
        {/* Timeline line */}
        <Box
          sx={{
            position: "absolute",
            left: 8,
            top: 8,
            bottom: 8,
            width: 2,
            backgroundColor: "#3A3A3D",
          }}
          aria-hidden="true"
        />

        {sortedHistory.map((entry, index) => {
          const color = getJobStateColor(entry.stateName);
          return (
            <Box
              key={index}
              sx={{ position: "relative", mb: 2 }}
              role="listitem"
              aria-label={`${entry.stateName} at ${formatDate(entry.createdAt)}`}
            >
              {/* Timeline dot */}
              <Box
                sx={{
                  position: "absolute",
                  left: -19,
                  top: 4,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: "2px solid #1a1a1a",
                }}
                aria-hidden="true"
              />

              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Chip
                    label={entry.stateName}
                    size="small"
                    aria-label={`State: ${entry.stateName}`}
                    sx={{
                      backgroundColor: `${color}20`,
                      color: color,
                      border: `1px solid ${color}`,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 22,
                    }}
                  />
                  <Tooltip text={formatFullDate(entry.createdAt)} placement="top" useMui>
                    <Typography
                      variant="caption"
                      sx={{ color: "#9ca3af", cursor: "help" }}
                    >
                      {formatDate(entry.createdAt)}
                    </Typography>
                  </Tooltip>
                </Box>

                {entry.reason && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#EDEDED",
                      mb: 0.5,
                    }}
                  >
                    {entry.reason}
                  </Typography>
                )}

                {Object.keys(entry.data).length > 0 && (
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor: "#1f1f1f",
                      borderRadius: 1,
                      mt: 0.5,
                    }}
                    role="group"
                    aria-label={`Additional data for ${entry.stateName} state`}
                  >
                    {Object.entries(entry.data).map(([key, value]) => (
                      <Box key={key} sx={{ mb: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#9ca3af",
                            textTransform: "capitalize",
                          }}
                        >
                          {key}:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#EDEDED",
                            fontFamily:
                              key.toLowerCase().includes("exception")
                                ? "monospace"
                                : "inherit",
                            fontSize:
                              key.toLowerCase().includes("exception")
                                ? "0.7rem"
                                : "inherit",
                            wordBreak: "break-word",
                          }}
                        >
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      title="Job Details"
      width="max-w-3xl"
    >
      <Box sx={{ p: 2 }} role="region" aria-label="Job details">
        {isLoading ? (
          <Box
            sx={{ display: "flex", justifyContent: "center", py: 4 }}
            role="status"
            aria-live="polite"
          >
            <CircularProgress sx={{ color: "#60a5fa" }} aria-label="Loading job details" />
            <span className="sr-only">Loading job details...</span>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error.message || "Failed to load job details"}
          </Alert>
        ) : job ? (
          <>
            {/* Header */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={3}
              component="header"
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Typography
                  component="h2"
                  sx={{
                    color: "#60a5fa",
                    fontFamily: "monospace",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  #{job.jobId}
                </Typography>
                <Chip
                  label={job.state}
                  aria-label={`Current state: ${job.state}`}
                  sx={{
                    backgroundColor: stateColors.bg,
                    color: stateColors.fg,
                    border: `1px solid ${stateColors.border}`,
                    fontWeight: 600,
                  }}
                />
                {job.queue && (
                  <Chip
                    label={job.queue}
                    size="small"
                    aria-label={`Queue: ${job.queue}`}
                    sx={{
                      backgroundColor: "#424242",
                      color: "#EDEDED",
                    }}
                  />
                )}
              </Box>

              {/* Actions */}
              <Box
                display="flex"
                gap={1}
                role="group"
                aria-label="Job actions"
              >
                {canRequeue && (
                  <Button
                    size="small"
                    startIcon={<TbRefresh size={16} aria-hidden="true" />}
                    onClick={() => onRequeue(job.jobId)}
                    aria-label={`Requeue job ${job.jobId}`}
                    sx={{
                      textTransform: "none",
                      color: "#60a5fa",
                      "&:hover": {
                        backgroundColor: "rgba(96, 165, 250, 0.1)",
                      },
                      ...focusVisibleStyles,
                    }}
                  >
                    Requeue
                  </Button>
                )}
                {canCancel && (
                  <Button
                    size="small"
                    startIcon={<TbPlayerStop size={16} aria-hidden="true" />}
                    onClick={() => onCancel(job.jobId)}
                    aria-label={`Cancel job ${job.jobId}`}
                    sx={{
                      textTransform: "none",
                      color: "#f59e0b",
                      "&:hover": {
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                      },
                      ...focusVisibleStyles,
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="small"
                  startIcon={<TbTrash size={16} aria-hidden="true" />}
                  onClick={() => onDelete(job.jobId)}
                  aria-label={`Delete job ${job.jobId}`}
                  sx={{
                    textTransform: "none",
                    color: "#ef4444",
                    "&:hover": {
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                    },
                    ...focusVisibleStyles,
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Box>

            {/* Job Info */}
            <Box sx={{ mb: 3 }} component="section" aria-labelledby="job-info-heading">
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TbCode size={18} color="#9ca3af" aria-hidden="true" />
                <Typography
                  variant="subtitle2"
                  id="job-info-heading"
                  sx={{
                    color: "#EDEDED",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Job Information
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  p: 2,
                  backgroundColor: "#1f1f1f",
                  borderRadius: 1,
                }}
                role="list"
                aria-label="Job information details"
              >
                <Box role="listitem">
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Job Name
                  </Typography>
                  <Typography
                    sx={{
                      color: "#EDEDED",
                      wordBreak: "break-word",
                      mt: 0.5,
                    }}
                  >
                    {job.jobName}
                  </Typography>
                </Box>
                <Box role="listitem">
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Method
                  </Typography>
                  <Typography sx={{ color: "#EDEDED", mt: 0.5 }}>
                    {job.methodName || "-"}
                  </Typography>
                </Box>
                <Box role="listitem">
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Type
                  </Typography>
                  <Tooltip text={job.methodType || "-"} placement="top" useMui>
                    <Typography
                      sx={{
                        color: "#EDEDED",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        wordBreak: "break-all",
                        mt: 0.5,
                        cursor: job.methodType ? "help" : "default",
                      }}
                    >
                      {job.methodType || "-"}
                    </Typography>
                  </Tooltip>
                </Box>
                <Box role="listitem">
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Server
                  </Typography>
                  <Typography sx={{ color: "#EDEDED", mt: 0.5 }}>
                    {job.serverName || "-"}
                  </Typography>
                </Box>
                <Box role="listitem">
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Created
                  </Typography>
                  <Tooltip text={formatFullDate(job.createdAt)} placement="top" useMui>
                    <Typography sx={{ color: "#EDEDED", mt: 0.5, cursor: "help" }}>
                      {formatDate(job.createdAt)}
                    </Typography>
                  </Tooltip>
                </Box>
                <Box role="listitem">
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Retry Count
                  </Typography>
                  <Typography
                    sx={{
                      color: job.retryCount > 0 ? "#f59e0b" : "#EDEDED",
                      fontWeight: job.retryCount > 0 ? 600 : 400,
                      mt: 0.5,
                    }}
                    aria-label={`Retry count: ${job.retryCount}${job.retryCount > 0 ? " (has retried)" : ""}`}
                  >
                    {job.retryCount}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Arguments */}
            {job.arguments && job.arguments.length > 0 && (
              <Box sx={{ mb: 3 }} component="section" aria-labelledby="arguments-heading">
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TbList size={18} color="#9ca3af" aria-hidden="true" />
                  <Typography
                    variant="subtitle2"
                    id="arguments-heading"
                    sx={{
                      color: "#EDEDED",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Arguments
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    backgroundColor: "#1a1a2e",
                    borderRadius: 1,
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                  role="region"
                  aria-label="Job arguments"
                  tabIndex={0}
                >
                  {job.arguments.map((arg, index) => (
                    <Typography
                      key={index}
                      component="pre"
                      sx={{
                        color: "#EDEDED",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                        mb: index < job.arguments.length - 1 ? 1 : 0,
                      }}
                    >
                      {arg}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {/* Properties */}
            {job.properties && Object.keys(job.properties).length > 0 && (
              <Box sx={{ mb: 3 }} component="section" aria-labelledby="properties-heading">
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TbServer size={18} color="#9ca3af" aria-hidden="true" />
                  <Typography
                    variant="subtitle2"
                    id="properties-heading"
                    sx={{
                      color: "#EDEDED",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Properties
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    backgroundColor: "#1f1f1f",
                    borderRadius: 1,
                  }}
                  role="list"
                  aria-label="Job properties"
                >
                  {Object.entries(job.properties).map(([key, value]) => (
                    <Box
                      key={key}
                      display="flex"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                      role="listitem"
                    >
                      <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                        {key}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#EDEDED",
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                          maxWidth: "60%",
                          wordBreak: "break-all",
                          textAlign: "right",
                        }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ borderColor: "#3A3A3D", my: 3 }} aria-hidden="true" />

            {/* History */}
            <Box component="section" aria-labelledby="history-heading">
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TbHistory size={18} color="#9ca3af" aria-hidden="true" />
                <Typography
                  variant="subtitle2"
                  id="history-heading"
                  sx={{
                    color: "#EDEDED",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  State History
                </Typography>
              </Box>

              {job.history && job.history.length > 0 ? (
                renderHistory(job.history)
              ) : (
                <Typography
                  sx={{ color: "#9ca3af", fontStyle: "italic" }}
                  role="status"
                >
                  No history available
                </Typography>
              )}
            </Box>

            {/* Auto-refresh indicator */}
            {shouldAutoRefresh(job.state) && (
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                mt={2}
                sx={{
                  p: 1,
                  backgroundColor: "rgba(96, 165, 250, 0.1)",
                  borderRadius: 1,
                }}
                role="status"
                aria-live="polite"
              >
                <TbClock size={16} color="#60a5fa" aria-hidden="true" />
                <Typography variant="caption" sx={{ color: "#60a5fa" }}>
                  Auto-refreshing every 3 seconds while job is in transient
                  state
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Typography
            sx={{ color: "#9ca3af", textAlign: "center", py: 4 }}
            role="status"
          >
            No job data available
          </Typography>
        )}
      </Box>
    </ModalContainer>
  );
};

export default JobDetailModal;
