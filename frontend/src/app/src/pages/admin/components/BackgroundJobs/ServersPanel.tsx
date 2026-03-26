import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from "@mui/material";
import {
  TbServer,
  TbList,
  TbClock,
  TbUsers,
  TbAlertCircle,
  TbCheck,
  TbX,
} from "react-icons/tb";
import {
  HangfireServer,
  HangfireQueue,
} from "../../../../services/admin/types/hangfire.types";
import {
  getAdminTableContainerStyles,
  getAdminTableHeaderCellStyles,
  getAdminTableRowHoverStyles,
  getAdminTableCellBorderStyles,
  adminTableClasses,
} from "../shared/adminTableStyles";
import Tooltip from "../../../../components/Global/Tooltip";

interface ServersPanelProps {
  servers: HangfireServer[];
  queues: HangfireQueue[];
}

const isServerHealthy = (server: HangfireServer): boolean => {
  if (!server.heartbeat) return false;
  const lastHeartbeat = new Date(server.heartbeat);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastHeartbeat.getTime()) / 60000;
  return diffMinutes < 2;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  return formatDate(dateString);
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

const ServersPanel: React.FC<ServersPanelProps> = ({ servers, queues }) => {
  const healthyServers = servers.filter(isServerHealthy);
  const unhealthyServers = servers.filter((s) => !isServerHealthy(s));
  const totalWorkers = servers.reduce((sum, s) => sum + s.workersCount, 0);
  const totalQueueLength = queues.reduce((sum, q) => sum + q.length, 0);

  return (
    <Box role="region" aria-label="Servers and queues panel">
      {/* Summary Cards */}
      <Grid
        container
        spacing={2}
        sx={{ mb: 4 }}
        role="list"
        aria-label="Server summary statistics"
      >
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <Paper
            sx={{
              p: 3,
              backgroundColor: "#1a1a1a",
              border: "1px solid #313131",
              borderRadius: 2,
            }}
            aria-label={`Total servers: ${servers.length}`}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "rgba(96, 165, 250, 0.2)",
                }}
                aria-hidden="true"
              >
                <TbServer size={24} color="#60a5fa" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Total Servers
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "#EDEDED", fontWeight: 600 }}
                >
                  {servers.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <Paper
            sx={{
              p: 3,
              backgroundColor: "#1a1a1a",
              border: `1px solid ${
                unhealthyServers.length > 0 ? "#ef4444" : "#313131"
              }`,
              borderRadius: 2,
            }}
            aria-label={`Healthy servers: ${healthyServers.length}, Unhealthy servers: ${unhealthyServers.length}`}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor:
                    unhealthyServers.length > 0
                      ? "rgba(239, 68, 68, 0.2)"
                      : "rgba(16, 185, 129, 0.2)",
                }}
                aria-hidden="true"
              >
                {unhealthyServers.length > 0 ? (
                  <TbAlertCircle size={24} color="#ef4444" />
                ) : (
                  <TbCheck size={24} color="#10b981" />
                )}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Healthy / Unhealthy
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color:
                      unhealthyServers.length > 0 ? "#ef4444" : "#10b981",
                    fontWeight: 600,
                  }}
                >
                  {healthyServers.length} / {unhealthyServers.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <Paper
            sx={{
              p: 3,
              backgroundColor: "#1a1a1a",
              border: "1px solid #313131",
              borderRadius: 2,
            }}
            aria-label={`Total workers: ${totalWorkers}`}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                }}
                aria-hidden="true"
              >
                <TbUsers size={24} color="#8b5cf6" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Total Workers
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "#EDEDED", fontWeight: 600 }}
                >
                  {totalWorkers}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3} role="listitem">
          <Paper
            sx={{
              p: 3,
              backgroundColor: "#1a1a1a",
              border: `1px solid ${totalQueueLength > 100 ? "#f59e0b" : "#313131"}`,
              borderRadius: 2,
            }}
            aria-label={`Total queue length: ${totalQueueLength.toLocaleString()}${totalQueueLength > 100 ? " (high volume)" : ""}`}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor:
                    totalQueueLength > 100
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(6, 182, 212, 0.2)",
                }}
                aria-hidden="true"
              >
                <TbList
                  size={24}
                  color={totalQueueLength > 100 ? "#f59e0b" : "#06b6d4"}
                />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Queue Length
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: totalQueueLength > 100 ? "#f59e0b" : "#EDEDED",
                    fontWeight: 600,
                  }}
                >
                  {totalQueueLength.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Servers Section */}
      <Typography
        variant="h6"
        component="h2"
        sx={{ color: "#EDEDED", mb: 2, fontWeight: 600 }}
        id="servers-table-heading"
      >
        Servers
      </Typography>
      {servers.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            backgroundColor: "#1a1a1a",
            border: "1px solid #313131",
            borderRadius: 2,
            textAlign: "center",
            mb: 4,
          }}
          role="status"
          aria-label="No servers found"
        >
          <TbAlertCircle size={48} color="#f59e0b" aria-hidden="true" />
          <Typography sx={{ color: "#f59e0b", mt: 2 }}>
            No servers found
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ ...getAdminTableContainerStyles(), mb: 4 }}
          className={adminTableClasses.container}
        >
          <Table aria-labelledby="servers-table-heading">
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
                    Server Name
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
                    Status
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
                    Workers
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
                    Queues
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
                    Started
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
                    Last Heartbeat
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ backgroundColor: "#262626" }}>
              {servers.map((server, index) => {
                const healthy = isServerHealthy(server);
                const isLastRow = index === servers.length - 1;

                return (
                  <TableRow
                    key={server.name}
                    sx={getAdminTableRowHoverStyles()}
                    aria-label={`Server ${server.name}: ${healthy ? "Healthy" : "Unhealthy"}`}
                  >
                    <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                      <Typography
                        sx={{
                          color: "#EDEDED",
                          fontWeight: 500,
                          wordBreak: "break-all",
                        }}
                      >
                        {server.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                      <Chip
                        icon={
                          healthy ? (
                            <TbCheck size={14} aria-hidden="true" />
                          ) : (
                            <TbX size={14} aria-hidden="true" />
                          )
                        }
                        label={healthy ? "Healthy" : "Unhealthy"}
                        size="small"
                        aria-label={`Status: ${healthy ? "Healthy" : "Unhealthy"}`}
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
                    </TableCell>
                    <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                      <Typography
                        sx={{ color: "#EDEDED" }}
                        aria-label={`Workers: ${server.workersCount}`}
                      >
                        {server.workersCount}
                      </Typography>
                    </TableCell>
                    <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {server.queues.map((queue) => (
                          <Chip
                            key={queue}
                            label={queue}
                            size="small"
                            aria-label={`Queue: ${queue}`}
                            sx={{
                              backgroundColor: "#424242",
                              color: "#EDEDED",
                              fontSize: "0.7rem",
                              height: 22,
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                      <Tooltip text={formatFullDate(server.startedAt)} placement="top" useMui>
                        <Typography
                          sx={{ color: "#9ca3af", fontSize: "0.8rem", cursor: "help" }}
                          aria-label={`Started: ${formatFullDate(server.startedAt)}`}
                        >
                          {formatDate(server.startedAt)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={getAdminTableCellBorderStyles(isLastRow)}>
                      <Tooltip text={formatFullDate(server.heartbeat)} placement="top" useMui>
                        <Typography
                          sx={{
                            color: healthy ? "#10b981" : "#ef4444",
                            fontSize: "0.8rem",
                            cursor: "help",
                          }}
                          aria-label={`Last heartbeat: ${formatFullDate(server.heartbeat)}`}
                        >
                          {formatRelativeTime(server.heartbeat)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Queues Section */}
      <Typography
        variant="h6"
        component="h2"
        sx={{ color: "#EDEDED", mb: 2, fontWeight: 600 }}
        id="queues-section-heading"
      >
        Queues
      </Typography>
      {queues.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            backgroundColor: "#1a1a1a",
            border: "1px solid #313131",
            borderRadius: 2,
            textAlign: "center",
          }}
          role="status"
          aria-label="No queues found"
        >
          <TbList size={48} color="#9ca3af" aria-hidden="true" />
          <Typography sx={{ color: "#9ca3af", mt: 2 }}>
            No queues found
          </Typography>
        </Paper>
      ) : (
        <Grid
          container
          spacing={2}
          role="list"
          aria-labelledby="queues-section-heading"
        >
          {queues.map((queue) => {
            const isHighLength = queue.length > 100;
            const maxLength = Math.max(...queues.map((q) => q.length), 1);
            const progressValue = (queue.length / maxLength) * 100;

            return (
              <Grid item xs={12} sm={6} md={4} key={queue.name} role="listitem">
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "#1a1a1a",
                    border: `1px solid ${isHighLength ? "#f59e0b" : "#313131"}`,
                    borderRadius: 2,
                  }}
                  aria-label={`Queue ${queue.name}: ${queue.length.toLocaleString()} jobs${isHighLength ? " (high volume)" : ""}`}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography
                      component="h3"
                      sx={{
                        color: "#EDEDED",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {queue.name}
                    </Typography>
                    {isHighLength && (
                      <Chip
                        label="High"
                        size="small"
                        aria-label="High volume queue"
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

                  <Box display="flex" gap={3} mb={1.5}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                        Length
                      </Typography>
                      <Typography
                        sx={{
                          color: isHighLength ? "#f59e0b" : "#EDEDED",
                          fontWeight: isHighLength ? 600 : 400,
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

                  <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    aria-label={`Queue ${queue.name} is ${Math.round(progressValue)}% of max queue length`}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#3A3A3D",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: isHighLength ? "#f59e0b" : "#60a5fa",
                        borderRadius: 2,
                      },
                    }}
                  />
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ServersPanel;
