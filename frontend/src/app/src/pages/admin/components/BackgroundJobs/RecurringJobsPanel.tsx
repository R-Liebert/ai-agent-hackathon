import React, { useState, useCallback } from "react";
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  TbPlayerPlay,
  TbPlayerPause,
  TbRefresh,
  TbAlertCircle,
  TbCalendarTime,
} from "react-icons/tb";
import {
  useTriggerRecurringJob,
  usePauseRecurringJob,
  useResumeRecurringJob,
} from "../../hooks/useHangfireQueries";
import {
  HangfireRecurringJob,
  getJobStateColor,
} from "../../../../services/admin/types/hangfire.types";
import {
  getAdminTableContainerStyles,
  getAdminTableHeaderCellStyles,
  getAdminTableRowHoverStyles,
  getAdminTableCellBorderStyles,
  adminTableClasses,
} from "../shared/adminTableStyles";
import ConfirmActionDialog from "../../../../components/Global/ConfirmActionDialog";
import Tooltip from "../../../../components/Global/Tooltip";

interface RecurringJobsPanelProps {
  recurringJobs: HangfireRecurringJob[];
  refreshInterval: number;
}

const focusVisibleStyles = {
  "&:focus-visible": {
    outline: "2px solid rgba(96, 165, 250, 0.7)",
    outlineOffset: 2,
  },
};

const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const isFuture = diffMs > 0;
  const absDiffMs = Math.abs(diffMs);
  const diffSec = Math.floor(absDiffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return isFuture ? `In ${diffSec}s` : `${diffSec}s ago`;
  }
  if (diffMin < 60) {
    return isFuture ? `In ${diffMin}m` : `${diffMin}m ago`;
  }
  if (diffHour < 24) {
    return isFuture ? `In ${diffHour}h` : `${diffHour}h ago`;
  }
  if (diffDay < 7) {
    return isFuture ? `In ${diffDay}d` : `${diffDay}d ago`;
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFullDate = (dateString: string | null): string => {
  if (!dateString) return "Never";
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

const isPaused = (job: HangfireRecurringJob): boolean => {
  // A job is considered paused if it has no next execution scheduled
  return job.nextExecution === null && job.cron !== null;
};

const RecurringJobsPanel: React.FC<RecurringJobsPanelProps> = ({
  recurringJobs,
}) => {
  const triggerMutation = useTriggerRecurringJob();
  const pauseMutation = usePauseRecurringJob();
  const resumeMutation = useResumeRecurringJob();

  const [confirmPause, setConfirmPause] = useState<{
    open: boolean;
    job?: HangfireRecurringJob;
  }>({ open: false });

  const [resumeDialog, setResumeDialog] = useState<{
    open: boolean;
    job?: HangfireRecurringJob;
    cronExpression: string;
  }>({ open: false, cronExpression: "" });

  const handleTrigger = useCallback(
    (jobId: string) => {
      triggerMutation.mutate(jobId);
    },
    [triggerMutation]
  );

  const handlePauseClick = useCallback((job: HangfireRecurringJob) => {
    // Store cron in localStorage before pausing
    if (job.cron) {
      localStorage.setItem(`paused-job-cron-${job.id}`, job.cron);
    }
    setConfirmPause({ open: true, job });
  }, []);

  const handlePauseConfirm = useCallback(() => {
    if (confirmPause.job) {
      pauseMutation.mutate(confirmPause.job.id);
    }
    setConfirmPause({ open: false });
  }, [confirmPause.job, pauseMutation]);

  const handleResumeClick = useCallback((job: HangfireRecurringJob) => {
    const storedCron = localStorage.getItem(`paused-job-cron-${job.id}`);
    setResumeDialog({
      open: true,
      job,
      cronExpression: storedCron || job.cron || "0 * * * *",
    });
  }, []);

  const handleResumeConfirm = useCallback(() => {
    if (resumeDialog.job && resumeDialog.cronExpression) {
      resumeMutation.mutate({
        jobId: resumeDialog.job.id,
        cronExpression: resumeDialog.cronExpression,
      });
      localStorage.removeItem(`paused-job-cron-${resumeDialog.job.id}`);
    }
    setResumeDialog({ open: false, cronExpression: "" });
  }, [resumeDialog, resumeMutation]);

  if (recurringJobs.length === 0) {
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
        aria-label="No recurring jobs configured"
      >
        <TbCalendarTime size={48} color="#9ca3af" aria-hidden="true" />
        <Typography sx={{ color: "#9ca3af", mt: 2 }}>
          No recurring jobs configured
        </Typography>
      </Paper>
    );
  }

  return (
    <Box role="region" aria-label="Recurring jobs management">
      <TableContainer
        component={Paper}
        sx={getAdminTableContainerStyles()}
        className={adminTableClasses.container}
      >
        <Table aria-label="Recurring jobs table">
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
                  Cron
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
                <Typography
                  sx={{
                    color: "#EDEDED",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Next Execution
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
                  Last Execution
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
                  Last State
                </Typography>
              </TableCell>
              <TableCell sx={{ ...getAdminTableHeaderCellStyles(), width: 150 }} scope="col">
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
            {recurringJobs.map((job, index) => {
              const isLastRow = index === recurringJobs.length - 1;
              const paused = isPaused(job);
              const hasError = Boolean(job.error);

              return (
                <TableRow
                  key={job.id}
                  sx={getAdminTableRowHoverStyles()}
                  aria-label={`Recurring job ${job.id}${paused ? " (paused)" : ""}${hasError ? " (has error)" : ""}`}
                >
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        sx={{
                          color: "#60a5fa",
                          fontWeight: 500,
                          fontSize: "0.875rem",
                        }}
                      >
                        {job.id}
                      </Typography>
                      {hasError && (
                        <Tooltip text={job.error || "Configuration error"} placement="top" useMui>
                          <span>
                            <TbAlertCircle
                              size={16}
                              color="#ef4444"
                              aria-label="Job has configuration error"
                            />
                          </span>
                        </Tooltip>
                      )}
                      {paused && (
                        <Chip
                          label="Paused"
                          size="small"
                          aria-label="Job is paused"
                          sx={{
                            backgroundColor: "rgba(245, 158, 11, 0.15)",
                            color: "#f59e0b",
                            border: "1px solid #f59e0b",
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                    {job.jobType && (
                      <Tooltip text={job.jobType} placement="top" useMui>
                        <Typography
                          sx={{
                            color: "#9ca3af",
                            fontSize: "0.7rem",
                            fontFamily: "monospace",
                            maxWidth: 250,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {job.jobType}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Typography
                      sx={{
                        color: "#EDEDED",
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                      }}
                    >
                      {job.cron}
                    </Typography>
                    {job.timeZoneId && (
                      <Typography
                        sx={{ color: "#9ca3af", fontSize: "0.7rem" }}
                      >
                        {job.timeZoneId}
                      </Typography>
                    )}
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
                    {paused ? (
                      <Typography
                        sx={{ color: "#f59e0b", fontSize: "0.8rem" }}
                        aria-label="Job is paused, no next execution scheduled"
                      >
                        Paused
                      </Typography>
                    ) : (
                      <Tooltip text={formatFullDate(job.nextExecution)} placement="top" useMui>
                        <Typography
                          sx={{ color: "#10b981", fontSize: "0.8rem", cursor: "help" }}
                          aria-label={`Next execution: ${formatFullDate(job.nextExecution)}`}
                        >
                          {formatRelativeTime(job.nextExecution)}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Tooltip text={formatFullDate(job.lastExecution)} placement="top" useMui>
                      <Typography
                        sx={{ color: "#9ca3af", fontSize: "0.8rem", cursor: "help" }}
                        aria-label={`Last execution: ${formatFullDate(job.lastExecution)}`}
                      >
                        {formatRelativeTime(job.lastExecution)}
                      </Typography>
                    </Tooltip>
                    {job.lastJobId && (
                      <Typography
                        sx={{
                          color: "#60a5fa",
                          fontSize: "0.7rem",
                          fontFamily: "monospace",
                        }}
                      >
                        #{job.lastJobId}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    {job.lastJobState ? (
                      <Chip
                        label={job.lastJobState}
                        size="small"
                        aria-label={`Last job state: ${job.lastJobState}`}
                        sx={{
                          backgroundColor: `${getJobStateColor(job.lastJobState)}20`,
                          color: getJobStateColor(job.lastJobState),
                          border: `1px solid ${getJobStateColor(job.lastJobState)}`,
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 22,
                        }}
                      />
                    ) : (
                      <Typography sx={{ color: "#9ca3af", fontSize: "0.8rem" }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                    <Box
                      display="flex"
                      gap={0.5}
                      role="group"
                      aria-label={`Actions for recurring job ${job.id}`}
                    >
                      <Tooltip text="Trigger job now" placement="top" useMui>
                        <IconButton
                          size="small"
                          onClick={() => handleTrigger(job.id)}
                          disabled={triggerMutation.isPending}
                          aria-label={`Trigger ${job.id} now`}
                          sx={{
                            color: "#10b981",
                            "&:hover": {
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                            },
                            ...focusVisibleStyles,
                          }}
                        >
                          <TbPlayerPlay size={16} aria-hidden="true" />
                        </IconButton>
                      </Tooltip>
                      {paused ? (
                        <Tooltip text="Resume job" placement="top" useMui>
                          <IconButton
                            size="small"
                            onClick={() => handleResumeClick(job)}
                            disabled={resumeMutation.isPending}
                            aria-label={`Resume ${job.id}`}
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
                      ) : (
                        <Tooltip text="Pause job" placement="top" useMui>
                          <IconButton
                            size="small"
                            onClick={() => handlePauseClick(job)}
                            disabled={pauseMutation.isPending}
                            aria-label={`Pause ${job.id}`}
                            sx={{
                              color: "#f59e0b",
                              "&:hover": {
                                backgroundColor: "rgba(245, 158, 11, 0.1)",
                              },
                              ...focusVisibleStyles,
                            }}
                          >
                            <TbPlayerPause size={16} aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pause Confirmation Dialog */}
      {confirmPause.open && (
        <ConfirmActionDialog
          title="Pause Recurring Job"
          message={`Are you sure you want to pause "${confirmPause.job?.id}"? You'll need to provide the cron expression when resuming.`}
          cancelBtn="Cancel"
          confirmBtn="Pause"
          open={confirmPause.open}
          onCancel={() => setConfirmPause({ open: false })}
          onConfirm={handlePauseConfirm}
          onClose={() => setConfirmPause({ open: false })}
          isLoading={pauseMutation.isPending}
        />
      )}

      {/* Resume Dialog */}
      <Dialog
        open={resumeDialog.open}
        onClose={() => setResumeDialog({ open: false, cronExpression: "" })}
        aria-labelledby="resume-dialog-title"
        aria-describedby="resume-dialog-description"
        PaperProps={{
          sx: {
            backgroundColor: "#1a1a1a",
            border: "1px solid #3A3A3D",
            borderRadius: 2,
            minWidth: 400,
          },
        }}
      >
        <DialogTitle id="resume-dialog-title" sx={{ color: "#EDEDED" }}>
          Resume Recurring Job
        </DialogTitle>
        <DialogContent>
          <Typography
            id="resume-dialog-description"
            sx={{ color: "#9ca3af", mb: 2 }}
          >
            Enter the cron expression to resume "{resumeDialog.job?.id}"
          </Typography>
          <TextField
            fullWidth
            label="Cron Expression"
            value={resumeDialog.cronExpression}
            onChange={(e) =>
              setResumeDialog((prev) => ({
                ...prev,
                cronExpression: e.target.value,
              }))
            }
            placeholder="0 * * * *"
            inputProps={{
              "aria-label": "Cron expression",
              "aria-describedby": "cron-help-text",
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#EDEDED",
                backgroundColor: "#262626",
                "& fieldset": {
                  borderColor: "#3A3A3D",
                },
                "&:hover fieldset": {
                  borderColor: "#60a5fa",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#60a5fa",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#9ca3af",
                "&.Mui-focused": {
                  color: "#60a5fa",
                },
              },
            }}
          />
          <Typography
            id="cron-help-text"
            variant="caption"
            sx={{ color: "#9ca3af", display: "block", mt: 1 }}
          >
            Example: "0 * * * *" (every hour), "*/5 * * * *" (every 5 minutes)
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setResumeDialog({ open: false, cronExpression: "" })}
            sx={{
              color: "#9ca3af",
              ...focusVisibleStyles,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResumeConfirm}
            disabled={
              !resumeDialog.cronExpression.trim() || resumeMutation.isPending
            }
            variant="contained"
            sx={{
              backgroundColor: "#60a5fa",
              "&:hover": {
                backgroundColor: "#3b82f6",
              },
              ...focusVisibleStyles,
            }}
          >
            {resumeMutation.isPending ? "Resuming..." : "Resume"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecurringJobsPanel;
