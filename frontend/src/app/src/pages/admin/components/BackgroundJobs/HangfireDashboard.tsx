import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
} from "@mui/material";
import ConfirmActionDialog from "../../../../components/Global/ConfirmActionDialog";
import Tooltip from "../../../../components/Global/Tooltip";
import {
  TbClock,
  TbPlayerPlay,
  TbCheck,
  TbX,
  TbTrash,
  TbRefresh,
  TbServer,
  TbList,
  TbAlertCircle,
  TbHourglass,
} from "react-icons/tb";
import {
  HangfireStatistics,
  HangfireServer,
  HangfireQueue,
  getJobStateColor,
} from "../../../../services/admin/types/hangfire.types";

interface HangfireDashboardProps {
  statistics: HangfireStatistics | undefined;
  servers: HangfireServer[];
  queues: HangfireQueue[];
  onRequeueAllFailed: () => void;
  onDeleteAllSucceeded: () => void;
  isRequeueingAllFailed: boolean;
  isDeletingAllSucceeded: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  highlighted?: boolean;
}

const focusVisibleStyles = {
  "&:focus-visible": {
    outline: "2px solid rgba(96, 165, 250, 0.7)",
    outlineOffset: 2,
  },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  highlighted = false,
}) => (
  <Paper
    sx={{
      p: 3,
      backgroundColor: highlighted ? `${color}15` : "#1a1a1a",
      border: `1px solid ${highlighted ? color : "#313131"}`,
      borderRadius: 2,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: color,
        transform: "translateY(-2px)",
      },
    }}
    role="article"
    aria-label={`${title}: ${value.toLocaleString()}`}
  >
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography
          variant="caption"
          component="h3"
          sx={{
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: highlighted ? color : "#EDEDED",
            fontWeight: 600,
            mt: 0.5,
          }}
          aria-hidden="true"
        >
          {value.toLocaleString()}
        </Typography>
      </Box>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          backgroundColor: `${color}20`,
          color: color,
        }}
        aria-hidden="true"
      >
        {icon}
      </Box>
    </Box>
  </Paper>
);

const isServerHealthy = (server: HangfireServer): boolean => {
  if (!server.heartbeat) return false;
  const lastHeartbeat = new Date(server.heartbeat);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastHeartbeat.getTime()) / 60000;
  return diffMinutes < 2;
};

const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
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

const HangfireDashboard: React.FC<HangfireDashboardProps> = ({
  statistics,
  servers,
  queues,
  onRequeueAllFailed,
  onDeleteAllSucceeded,
  isRequeueingAllFailed,
  isDeletingAllSucceeded,
}) => {
  const [showClearSucceededDialog, setShowClearSucceededDialog] = useState(false);

  const handleClearSucceededClick = () => {
    setShowClearSucceededDialog(true);
  };

  const handleClearSucceededConfirm = () => {
    onDeleteAllSucceeded();
    setShowClearSucceededDialog(false);
  };

  const handleClearSucceededCancel = () => {
    setShowClearSucceededDialog(false);
  };

  if (!statistics) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }} role="status" aria-live="polite">
        <Typography sx={{ color: "#9ca3af" }}>Loading statistics...</Typography>
      </Box>
    );
  }

  return (
    <Box role="region" aria-label="Hangfire Dashboard Overview">
      {/* Statistics Cards */}
      <Typography
        variant="h6"
        component="h2"
        sx={{ color: "#EDEDED", mb: 2, fontWeight: 600 }}
        id="stats-heading"
      >
        Job Statistics
      </Typography>
      <Grid
        container
        spacing={2}
        sx={{ mb: 4 }}
        role="list"
        aria-labelledby="stats-heading"
      >
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <StatCard
            title="Enqueued"
            value={statistics.enqueued}
            icon={<TbList size={24} />}
            color={getJobStateColor("Enqueued")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <StatCard
            title="Processing"
            value={statistics.processing}
            icon={<TbPlayerPlay size={24} />}
            color={getJobStateColor("Processing")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <StatCard
            title="Scheduled"
            value={statistics.scheduled}
            icon={<TbClock size={24} />}
            color={getJobStateColor("Scheduled")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <StatCard
            title="Succeeded"
            value={statistics.succeeded}
            icon={<TbCheck size={24} />}
            color={getJobStateColor("Succeeded")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <StatCard
            title="Failed"
            value={statistics.failed}
            icon={<TbX size={24} />}
            color={getJobStateColor("Failed")}
            highlighted={statistics.failed > 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <StatCard
            title="Deleted"
            value={statistics.deleted}
            icon={<TbTrash size={24} />}
            color={getJobStateColor("Deleted")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <StatCard
            title="Recurring"
            value={statistics.recurring}
            icon={<TbRefresh size={24} />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <StatCard
            title="Servers"
            value={statistics.servers}
            icon={<TbServer size={24} />}
            color="#06b6d4"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      {(statistics.failed > 0 || statistics.succeeded > 0) && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{ color: "#EDEDED", mb: 2, fontWeight: 600 }}
            id="actions-heading"
          >
            Quick Actions
          </Typography>
          <Box
            display="flex"
            gap={2}
            flexWrap="wrap"
            role="group"
            aria-labelledby="actions-heading"
          >
            {statistics.failed > 0 && (
              <Button
                variant="outlined"
                startIcon={<TbRefresh size={18} aria-hidden="true" />}
                onClick={onRequeueAllFailed}
                disabled={isRequeueingAllFailed}
                aria-label={`Requeue all ${statistics.failed} failed jobs`}
                sx={{
                  textTransform: "none",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: "#ef4444",
                  py: 1,
                  px: 3,
                  "&:hover": {
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.55)",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.7,
                  },
                  ...focusVisibleStyles,
                }}
              >
                {isRequeueingAllFailed
                  ? "Requeuing..."
                  : `Requeue All Failed (${statistics.failed})`}
              </Button>
            )}
            {statistics.succeeded > 0 && (
              <Button
                variant="outlined"
                startIcon={<TbTrash size={18} aria-hidden="true" />}
                onClick={handleClearSucceededClick}
                disabled={isDeletingAllSucceeded}
                aria-label={`Clear ${statistics.succeeded.toLocaleString()} succeeded jobs`}
                sx={{
                  textTransform: "none",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(107, 114, 128, 0.1)",
                  border: "1px solid rgba(107, 114, 128, 0.35)",
                  color: "#9ca3af",
                  py: 1,
                  px: 3,
                  "&:hover": {
                    backgroundColor: "rgba(107, 114, 128, 0.2)",
                    border: "1px solid rgba(107, 114, 128, 0.55)",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.7,
                  },
                  ...focusVisibleStyles,
                }}
              >
                {isDeletingAllSucceeded
                  ? "Clearing..."
                  : `Clear Succeeded (${statistics.succeeded.toLocaleString()})`}
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Server Health */}
      <Typography
        variant="h6"
        component="h2"
        sx={{ color: "#EDEDED", mb: 2, fontWeight: 600 }}
        id="servers-heading"
      >
        Server Health
      </Typography>
      <Grid
        container
        spacing={2}
        sx={{ mb: 4 }}
        role="list"
        aria-labelledby="servers-heading"
      >
        {servers.length === 0 ? (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: "#1a1a1a",
                border: "1px solid #313131",
                borderRadius: 2,
                textAlign: "center",
              }}
              role="alert"
            >
              <TbAlertCircle size={48} color="#f59e0b" aria-hidden="true" />
              <Typography sx={{ color: "#f59e0b", mt: 1 }}>
                No servers found
              </Typography>
            </Paper>
          </Grid>
        ) : (
          servers.map((server) => {
            const healthy = isServerHealthy(server);
            return (
              <Grid item xs={12} sm={6} md={4} key={server.name} role="listitem">
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "#1a1a1a",
                    border: `1px solid ${healthy ? "#10b981" : "#ef4444"}30`,
                    borderRadius: 2,
                  }}
                  aria-label={`Server ${server.name}: ${healthy ? "Healthy" : "Unhealthy"}`}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography
                      component="h3"
                      sx={{
                        color: "#EDEDED",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "70%",
                      }}
                    >
                      {server.name}
                    </Typography>
                    <Chip
                      label={healthy ? "Healthy" : "Unhealthy"}
                      size="small"
                      aria-label={`Status: ${healthy ? "Healthy" : "Unhealthy"}`}
                      icon={
                        healthy ? (
                          <TbCheck size={12} aria-hidden="true" />
                        ) : (
                          <TbX size={12} aria-hidden="true" />
                        )
                      }
                      sx={{
                        backgroundColor: healthy
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                        color: healthy ? "#10b981" : "#ef4444",
                        border: `1px solid ${healthy ? "#10b981" : "#ef4444"}`,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        "& .MuiChip-icon": {
                          color: healthy ? "#10b981" : "#ef4444",
                        },
                      }}
                    />
                  </Box>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Box>
                      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                        Workers
                      </Typography>
                      <Typography sx={{ color: "#EDEDED" }}>
                        {server.workersCount}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                        Queues
                      </Typography>
                      <Typography sx={{ color: "#EDEDED" }}>
                        {server.queues.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                        Heartbeat
                      </Typography>
                      <Tooltip
                        text={formatFullDate(server.heartbeat)}
                        placement="top"
                        useMui
                      >
                        <Typography
                          sx={{
                            color: healthy ? "#10b981" : "#ef4444",
                            cursor: "help",
                          }}
                        >
                          {formatRelativeTime(server.heartbeat)}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Queue Status */}
      <Typography
        variant="h6"
        component="h2"
        sx={{ color: "#EDEDED", mb: 2, fontWeight: 600 }}
        id="queues-heading"
      >
        Queue Status
      </Typography>
      <Grid container spacing={2} role="list" aria-labelledby="queues-heading">
        {queues.length === 0 ? (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: "#1a1a1a",
                border: "1px solid #313131",
                borderRadius: 2,
                textAlign: "center",
              }}
              role="status"
            >
              <TbHourglass size={48} color="#9ca3af" aria-hidden="true" />
              <Typography sx={{ color: "#9ca3af", mt: 1 }}>
                No queues found
              </Typography>
            </Paper>
          </Grid>
        ) : (
          queues.map((queue) => {
            const hasHighLength = queue.length > 100;
            return (
              <Grid item xs={12} sm={6} md={3} key={queue.name} role="listitem">
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "#1a1a1a",
                    border: `1px solid ${hasHighLength ? "#f59e0b" : "#313131"}`,
                    borderRadius: 2,
                  }}
                  aria-label={`Queue ${queue.name}: ${queue.length} jobs${hasHighLength ? " (high volume)" : ""}`}
                >
                  <Typography
                    component="h3"
                    sx={{
                      color: "#EDEDED",
                      fontWeight: 600,
                      mb: 1,
                      textTransform: "capitalize",
                    }}
                  >
                    {queue.name}
                  </Typography>
                  <Box display="flex" gap={3}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                        Length
                      </Typography>
                      <Typography
                        sx={{
                          color: hasHighLength ? "#f59e0b" : "#EDEDED",
                          fontWeight: hasHighLength ? 600 : 400,
                        }}
                      >
                        {queue.length.toLocaleString()}
                      </Typography>
                    </Box>
                    {queue.fetched !== null && (
                      <Box>
                        <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                          Fetched
                        </Typography>
                        <Typography sx={{ color: "#EDEDED" }}>
                          {queue.fetched.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Clear Succeeded Confirmation Dialog */}
      {showClearSucceededDialog && (
        <ConfirmActionDialog
          title="Clear Succeeded Jobs"
          message="Are you sure you want to clear the succeeded jobs history? This action cannot be undone."
          cancelBtn="Cancel"
          confirmBtn="Clear"
          open={showClearSucceededDialog}
          onCancel={handleClearSucceededCancel}
          onConfirm={handleClearSucceededConfirm}
          onClose={handleClearSucceededCancel}
          isLoading={isDeletingAllSucceeded}
        />
      )}
    </Box>
  );
};

export default HangfireDashboard;
