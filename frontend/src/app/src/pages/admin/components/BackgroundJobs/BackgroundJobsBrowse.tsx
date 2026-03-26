import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { TbRefresh, TbClock } from "react-icons/tb";
import { useSearchParams } from "react-router-dom";
import { useHangfire } from "../../hooks/useHangfireQueries";
import HangfireDashboard from "./HangfireDashboard";
import JobsPanel from "./JobsPanel";
import RecurringJobsPanel from "./RecurringJobsPanel";
import ServersPanel from "./ServersPanel";
import JobsLoadingSkeleton from "./JobsLoadingSkeleton";

type TabValue = "dashboard" | "jobs" | "recurring" | "servers";

const REFRESH_INTERVALS = [
  { label: "5s", value: 5000 },
  { label: "10s", value: 10000 },
  { label: "30s", value: 30000 },
  { label: "Off", value: 0 },
];

const BackgroundJobsBrowse: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or default to dashboard
  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab") as TabValue;
    return ["dashboard", "jobs", "recurring", "servers"].includes(tab)
      ? tab
      : "dashboard";
  }, [searchParams]);

  const [refreshInterval, setRefreshInterval] = useState<number>(10000);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Track which tabs have been visited for lazy loading
  const [visitedTabs, setVisitedTabs] = useState<Set<TabValue>>(
    new Set(["dashboard"])
  );

  const {
    overview,
    statistics,
    servers,
    queues,
    recurringJobs,
    isLoading,
    isError,
    error,
    refetchAll,
    requeueAllFailed,
    deleteAllSucceeded,
    isRequeueingAllFailed,
    isDeletingAllSucceeded,
  } = useHangfire();

  // Update last updated timestamp when data changes
  useEffect(() => {
    if (overview) {
      setLastUpdated(new Date());
    }
  }, [overview]);

  // Mark current tab as visited
  useEffect(() => {
    setVisitedTabs((prev) => new Set([...prev, activeTab]));
  }, [activeTab]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: TabValue) => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", newValue);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleRefresh = useCallback(() => {
    refetchAll();
  }, [refetchAll]);

  const formatLastUpdated = (date: Date): string => {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const tabStyles = {
    color: "#EDEDED",
    textTransform: "none",
    fontFamily: '"Nunito Sans", sans-serif',
    fontWeight: 500,
    minHeight: 48,
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

  const focusVisibleStyles = {
    "&:focus-visible": {
      outline: "2px solid rgba(96, 165, 250, 0.7)",
      outlineOffset: 2,
    },
  };

  // Determine if tab content should be rendered (lazy loading)
  const shouldRenderTab = (tab: TabValue): boolean => {
    return activeTab === tab || visitedTabs.has(tab);
  };

  return (
    <Box
      sx={{ backgroundColor: "transparent", px: 3 }}
      role="region"
      aria-label="Background Jobs Management"
    >
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            className="font-headers text-white-100"
            sx={{ mb: 0.5 }}
            id="background-jobs-title"
          >
            Background Jobs
          </Typography>
          <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
            Monitor and manage Hangfire background jobs
          </Typography>
        </Box>

        {/* Controls */}
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
          role="group"
          aria-label="Refresh controls"
        >
          {/* Last Updated */}
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ color: "#9ca3af" }}
            aria-live="polite"
            aria-atomic="true"
          >
            <TbClock size={16} aria-hidden="true" />
            <Typography variant="caption">
              Last updated: {formatLastUpdated(lastUpdated)}
            </Typography>
          </Box>

          {/* Refresh Interval */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value as number)}
              aria-label="Auto-refresh interval"
              sx={{
                color: "#EDEDED",
                backgroundColor: "#262626",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3A3A3D",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#60a5fa",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#60a5fa",
                },
                "& .MuiSvgIcon-root": {
                  color: "#EDEDED",
                },
                ...focusVisibleStyles,
              }}
            >
              {REFRESH_INTERVALS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Manual Refresh */}
          <Button
            variant="outlined"
            size="medium"
            startIcon={<TbRefresh size={18} aria-hidden="true" />}
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh data manually"
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
                backgroundColor: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.25)",
                color: "#60a5fa",
                opacity: 0.7,
              },
              ...focusVisibleStyles,
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box
        sx={{ borderBottom: 1, borderColor: "#3A3A3D", mb: 3 }}
        role="navigation"
        aria-label="Background jobs sections"
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Background jobs navigation tabs"
          TabIndicatorProps={{
            sx: { backgroundColor: "#60a5fa", height: 3 },
          }}
        >
          <Tab
            value="dashboard"
            label="Dashboard"
            id="tab-dashboard"
            aria-controls="tabpanel-dashboard"
            sx={tabStyles}
          />
          <Tab
            value="jobs"
            id="tab-jobs"
            aria-controls="tabpanel-jobs"
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Jobs
                {statistics && statistics.failed > 0 && (
                  <Box
                    component="span"
                    role="status"
                    aria-label={`${statistics.failed} failed jobs`}
                    sx={{
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      borderRadius: "9999px",
                      px: 1,
                      py: 0.25,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {statistics.failed}
                  </Box>
                )}
              </Box>
            }
            sx={tabStyles}
          />
          <Tab
            value="recurring"
            id="tab-recurring"
            aria-controls="tabpanel-recurring"
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Recurring Jobs
                {statistics && (
                  <Box
                    component="span"
                    aria-label={`${statistics.recurring} recurring jobs`}
                    sx={{
                      backgroundColor: "#424242",
                      color: "#EDEDED",
                      borderRadius: "9999px",
                      px: 1,
                      py: 0.25,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {statistics.recurring}
                  </Box>
                )}
              </Box>
            }
            sx={tabStyles}
          />
          <Tab
            value="servers"
            id="tab-servers"
            aria-controls="tabpanel-servers"
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Servers
                {statistics && (
                  <Box
                    component="span"
                    aria-label={`${statistics.servers} servers`}
                    sx={{
                      backgroundColor: "#424242",
                      color: "#EDEDED",
                      borderRadius: "9999px",
                      px: 1,
                      py: 0.25,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {statistics.servers}
                  </Box>
                )}
              </Box>
            }
            sx={tabStyles}
          />
        </Tabs>
      </Box>

      {/* Content */}
      {isLoading && !overview ? (
        <JobsLoadingSkeleton variant="dashboard" />
      ) : isError ? (
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
            {error?.message || "Failed to load Hangfire data"}
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
        <>
          {/* Dashboard Tab Panel */}
          <Box
            role="tabpanel"
            id="tabpanel-dashboard"
            aria-labelledby="tab-dashboard"
            hidden={activeTab !== "dashboard"}
          >
            {shouldRenderTab("dashboard") && (
              <HangfireDashboard
                statistics={statistics}
                servers={servers}
                queues={queues}
                onRequeueAllFailed={requeueAllFailed}
                onDeleteAllSucceeded={deleteAllSucceeded}
                isRequeueingAllFailed={isRequeueingAllFailed}
                isDeletingAllSucceeded={isDeletingAllSucceeded}
              />
            )}
          </Box>

          {/* Jobs Tab Panel */}
          <Box
            role="tabpanel"
            id="tabpanel-jobs"
            aria-labelledby="tab-jobs"
            hidden={activeTab !== "jobs"}
          >
            {shouldRenderTab("jobs") && (
              <JobsPanel
                statistics={statistics}
                refreshInterval={refreshInterval}
              />
            )}
          </Box>

          {/* Recurring Jobs Tab Panel */}
          <Box
            role="tabpanel"
            id="tabpanel-recurring"
            aria-labelledby="tab-recurring"
            hidden={activeTab !== "recurring"}
          >
            {shouldRenderTab("recurring") && (
              <RecurringJobsPanel
                recurringJobs={recurringJobs}
                refreshInterval={refreshInterval}
              />
            )}
          </Box>

          {/* Servers Tab Panel */}
          <Box
            role="tabpanel"
            id="tabpanel-servers"
            aria-labelledby="tab-servers"
            hidden={activeTab !== "servers"}
          >
            {shouldRenderTab("servers") && (
              <ServersPanel servers={servers} queues={queues} />
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default BackgroundJobsBrowse;
