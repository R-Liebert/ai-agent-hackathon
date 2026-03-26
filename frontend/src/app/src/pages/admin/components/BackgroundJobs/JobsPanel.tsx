import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Tabs,
  Tab,
  Button,
  Typography,
} from "@mui/material";
import { TbRefresh, TbTrash } from "react-icons/tb";
import {
  useHangfireJobsByState,
  useRequeueJob,
  useDeleteJob,
  useCancelJob,
  useBulkOperations,
  hangfireKeys,
} from "../../hooks/useHangfireQueries";
import {
  HangfireStatistics,
  HangfireJob,
  JobState,
  JobSortField,
  SortDirection,
  GetJobsParams,
  getJobStateColor,
} from "../../../../services/admin/types/hangfire.types";
import JobsTable from "./JobsTable";
import JobFilters from "./JobFilters";
import JobDetailModal from "./JobDetailModal";
import JobsLoadingSkeleton from "./JobsLoadingSkeleton";
import ConfirmActionDialog from "../../../../components/Global/ConfirmActionDialog";
import { useQueryClient } from "@tanstack/react-query";

interface JobsPanelProps {
  statistics: HangfireStatistics | undefined;
  refreshInterval: number;
}

const JOB_STATES: JobState[] = [
  "Enqueued",
  "Scheduled",
  "Processing",
  "Succeeded",
  "Failed",
  "Deleted",
  "Awaiting",
];

const PAGE_SIZE = 20;

const focusVisibleStyles = {
  "&:focus-visible": {
    outline: "2px solid rgba(96, 165, 250, 0.7)",
    outlineOffset: 2,
  },
};

const JobsPanel: React.FC<JobsPanelProps> = ({
  statistics,
  refreshInterval,
}) => {
  const queryClient = useQueryClient();
  const [activeState, setActiveState] = useState<JobState>("Enqueued");
  const [from, setFrom] = useState(0);
  const [items, setItems] = useState<HangfireJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(
    undefined
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Sorting (defaults match backend: stateAt desc)
  const [sortBy, setSortBy] = useState<JobSortField>("stateAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filters
  const [jobName, setJobName] = useState<string>("");
  const [jobType, setJobType] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Debounced filters
  const [debouncedJobName, setDebouncedJobName] = useState<string>("");
  const [debouncedJobType, setDebouncedJobType] = useState<string>("");
  const [debouncedFromDate, setDebouncedFromDate] = useState<string>("");
  const [debouncedToDate, setDebouncedToDate] = useState<string>("");

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "delete" | "requeue" | "cancel" | "bulkRequeue" | "bulkDelete";
    jobId?: string;
  }>({ open: false, type: "delete" });

  // Apply debounce to filters
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedJobName(jobName);
      setDebouncedJobType(jobType);
      setDebouncedFromDate(fromDate);
      setDebouncedToDate(toDate);
    }, 300);
    return () => clearTimeout(handle);
  }, [jobName, jobType, fromDate, toDate]);

  // Reset items when state, filters, or sort changes
  useEffect(() => {
    setFrom(0);
    setItems([]);
  }, [
    activeState,
    debouncedJobName,
    debouncedJobType,
    debouncedFromDate,
    debouncedToDate,
    sortBy,
    sortDirection,
  ]);

  // Build query params
  const queryParams: GetJobsParams = useMemo(
    () => ({
      from,
      count: PAGE_SIZE,
      jobName: debouncedJobName || undefined,
      jobType: debouncedJobType || undefined,
      fromDate: debouncedFromDate || undefined,
      toDate: debouncedToDate || undefined,
      sortBy,
      sortDirection,
    }),
    [from, debouncedJobName, debouncedJobType, debouncedFromDate, debouncedToDate, sortBy, sortDirection]
  );

  const jobsQuery = useHangfireJobsByState(activeState, queryParams);
  const requeueJobMutation = useRequeueJob();
  const deleteJobMutation = useDeleteJob();
  const cancelJobMutation = useCancelJob();
  const bulkOperations = useBulkOperations();

  // Accumulate items on pagination
  useEffect(() => {
    if (!jobsQuery.data) return;

    const jobs = jobsQuery.data.jobs;
    if (from === 0) {
      setItems(jobs);
    } else {
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.jobId));
        const newItems = jobs.filter((item) => !existingIds.has(item.jobId));
        return [...prev, ...newItems];
      });
    }
  }, [jobsQuery.data, from]);

  const handleStateChange = useCallback(
    (_event: React.SyntheticEvent, newValue: JobState) => {
      setActiveState(newValue);
    },
    []
  );

  const handleLoadMore = useCallback(() => {
    if (jobsQuery.data && items.length < jobsQuery.data.totalCount) {
      setFrom(items.length);
    }
  }, [jobsQuery.data, items.length]);

  const handleRefresh = useCallback(() => {
    setFrom(0);
    setItems([]);
    queryClient.invalidateQueries({ queryKey: hangfireKeys.jobs() });
  }, [queryClient]);

  const handleClearFilters = useCallback(() => {
    setJobName("");
    setJobType("");
    setFromDate("");
    setToDate("");
  }, []);

  const handleSortChange = useCallback(
    (field: JobSortField, direction: SortDirection) => {
      setSortBy(field);
      setSortDirection(direction);
    },
    []
  );

  const handleJobClick = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
    setDetailModalOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedJobId(undefined);
  }, []);

  const handleRequeue = useCallback((jobId: string) => {
    setConfirmDialog({ open: true, type: "requeue", jobId });
  }, []);

  const handleDelete = useCallback((jobId: string) => {
    setConfirmDialog({ open: true, type: "delete", jobId });
  }, []);

  const handleCancel = useCallback((jobId: string) => {
    setConfirmDialog({ open: true, type: "cancel", jobId });
  }, []);

  const handleBulkRequeue = useCallback(() => {
    setConfirmDialog({ open: true, type: "bulkRequeue" });
  }, []);

  const handleBulkDelete = useCallback(() => {
    setConfirmDialog({ open: true, type: "bulkDelete" });
  }, []);

  const handleConfirmAction = useCallback(() => {
    const { type, jobId } = confirmDialog;
    switch (type) {
      case "requeue":
        if (jobId) requeueJobMutation.mutate(jobId);
        break;
      case "delete":
        if (jobId) deleteJobMutation.mutate(jobId);
        break;
      case "cancel":
        if (jobId) cancelJobMutation.mutate(jobId);
        break;
      case "bulkRequeue":
        bulkOperations.requeueAllFailed();
        break;
      case "bulkDelete":
        bulkOperations.deleteAllFailed();
        break;
    }
    setConfirmDialog({ open: false, type: "delete" });
  }, [
    confirmDialog,
    requeueJobMutation,
    deleteJobMutation,
    cancelJobMutation,
    bulkOperations,
  ]);

  const getConfirmDialogContent = () => {
    switch (confirmDialog.type) {
      case "requeue":
        return {
          title: "Requeue Job",
          message:
            "Are you sure you want to requeue this job? It will be moved back to the Enqueued state.",
          confirmBtn: "Requeue",
        };
      case "delete":
        return {
          title: "Delete Job",
          message:
            "Are you sure you want to delete this job? This action cannot be undone.",
          confirmBtn: "Delete",
        };
      case "cancel":
        return {
          title: "Cancel Job",
          message:
            "Are you sure you want to cancel this job? It will be marked as deleted.",
          confirmBtn: "Cancel Job",
        };
      case "bulkRequeue":
        return {
          title: "Requeue All Failed Jobs",
          message:
            "Are you sure you want to requeue all failed jobs? They will be processed again.",
          confirmBtn: "Requeue All",
        };
      case "bulkDelete":
        return {
          title: "Delete All Failed Jobs",
          message:
            "Are you sure you want to delete all failed jobs? This action cannot be undone.",
          confirmBtn: "Delete All",
        };
      default:
        return { title: "", message: "", confirmBtn: "" };
    }
  };

  const dialogContent = getConfirmDialogContent();

  const getStateCount = (state: JobState): number => {
    if (!statistics) return 0;
    const key = state.toLowerCase() as keyof HangfireStatistics;
    return (statistics[key] as number) || 0;
  };

  const hasMore =
    jobsQuery.data && items.length < jobsQuery.data.totalCount;

  const activeFilterCount = [
    jobName,
    jobType,
    fromDate,
    toDate,
  ].filter(Boolean).length;

  const tabStyles = {
    color: "#EDEDED",
    textTransform: "none",
    fontFamily: '"Nunito Sans", sans-serif',
    fontWeight: 500,
    minHeight: 40,
    minWidth: 100,
    "&.Mui-selected": {
      color: "#60a5fa",
    },
    "&:hover": {
      color: "#60a5fa",
      backgroundColor: "rgba(96, 165, 250, 0.1)",
    },
    "&:focus-visible": {
      outline: "2px solid rgba(96, 165, 250, 0.7)",
      outlineOffset: -2,
    },
  };

  return (
    <Box role="region" aria-label="Jobs management panel">
      {/* State Tabs */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "#3A3A3D",
          mb: 3,
          overflowX: "auto",
        }}
        role="navigation"
        aria-label="Job state filters"
      >
        <Tabs
          value={activeState}
          onChange={handleStateChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Filter jobs by state"
          TabIndicatorProps={{
            sx: { backgroundColor: "#60a5fa", height: 2 },
          }}
        >
          {JOB_STATES.map((state) => {
            const count = getStateCount(state);
            const color = getJobStateColor(state);
            return (
              <Tab
                key={state}
                value={state}
                aria-label={`${state} jobs: ${count}`}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {state}
                    <Box
                      component="span"
                      aria-hidden="true"
                      sx={{
                        backgroundColor:
                          state === "Failed" && count > 0 ? color : "#424242",
                        color:
                          state === "Failed" && count > 0 ? "#fff" : "#EDEDED",
                        borderRadius: "9999px",
                        px: 1,
                        py: 0.25,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {count.toLocaleString()}
                    </Box>
                  </Box>
                }
                sx={tabStyles}
              />
            );
          })}
        </Tabs>
      </Box>

      {/* Filters */}
      <JobFilters
        jobName={jobName}
        onJobNameChange={setJobName}
        jobType={jobType}
        onJobTypeChange={setJobType}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        onClear={handleClearFilters}
        onRefresh={handleRefresh}
        activeFilterCount={activeFilterCount}
      />

      {/* Bulk Actions for Failed Jobs */}
      {activeState === "Failed" && statistics && statistics.failed > 0 && (
        <Box
          display="flex"
          gap={2}
          mb={3}
          role="group"
          aria-label="Bulk actions for failed jobs"
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<TbRefresh size={16} aria-hidden="true" />}
            onClick={handleBulkRequeue}
            disabled={bulkOperations.isRequeueingAllFailed}
            aria-label={`Requeue all ${statistics.failed} failed jobs`}
            sx={{
              textTransform: "none",
              borderRadius: "9999px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#ef4444",
              "&:hover": {
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.55)",
              },
              ...focusVisibleStyles,
            }}
          >
            {bulkOperations.isRequeueingAllFailed
              ? "Requeuing..."
              : "Requeue All Failed"}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TbTrash size={16} aria-hidden="true" />}
            onClick={handleBulkDelete}
            disabled={bulkOperations.isDeletingAllFailed}
            aria-label={`Delete all ${statistics.failed} failed jobs`}
            sx={{
              textTransform: "none",
              borderRadius: "9999px",
              backgroundColor: "rgba(107, 114, 128, 0.1)",
              border: "1px solid rgba(107, 114, 128, 0.35)",
              color: "#9ca3af",
              "&:hover": {
                backgroundColor: "rgba(107, 114, 128, 0.2)",
                border: "1px solid rgba(107, 114, 128, 0.55)",
              },
              ...focusVisibleStyles,
            }}
          >
            {bulkOperations.isDeletingAllFailed
              ? "Deleting..."
              : "Delete All Failed"}
          </Button>
        </Box>
      )}

      {/* Jobs Table */}
      {jobsQuery.isLoading && from === 0 ? (
        <JobsLoadingSkeleton variant="table" rows={10} />
      ) : jobsQuery.isError ? (
        <Box
          sx={{
            p: 3,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #ef4444",
            borderRadius: 2,
          }}
          role="alert"
          aria-live="assertive"
        >
          <Typography sx={{ color: "#ef4444" }}>
            {jobsQuery.error?.message || "Failed to load jobs"}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRefresh}
            sx={{
              mt: 2,
              textTransform: "none",
              color: "#ef4444",
              borderColor: "#ef4444",
              "&:hover": {
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: "#ef4444",
              },
            }}
          >
            Try Again
          </Button>
        </Box>
      ) : (
        <JobsTable
          jobs={items}
          state={activeState}
          onJobClick={handleJobClick}
          onRequeue={handleRequeue}
          onDelete={handleDelete}
          onCancel={handleCancel}
          isLoading={jobsQuery.isFetching}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          totalCount={jobsQuery.data?.totalCount}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      )}

      {/* Job Detail Modal */}
      <JobDetailModal
        jobId={selectedJobId}
        open={detailModalOpen}
        onClose={handleCloseDetail}
        onRequeue={handleRequeue}
        onDelete={handleDelete}
        onCancel={handleCancel}
      />

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <ConfirmActionDialog
          title={dialogContent.title}
          message={dialogContent.message}
          cancelBtn="Cancel"
          confirmBtn={dialogContent.confirmBtn}
          open={confirmDialog.open}
          onCancel={() => setConfirmDialog({ open: false, type: "delete" })}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmDialog({ open: false, type: "delete" })}
          isLoading={
            requeueJobMutation.isPending ||
            deleteJobMutation.isPending ||
            cancelJobMutation.isPending ||
            bulkOperations.isRequeueingAllFailed ||
            bulkOperations.isDeletingAllFailed
          }
        />
      )}
    </Box>
  );
};

export default JobsPanel;
