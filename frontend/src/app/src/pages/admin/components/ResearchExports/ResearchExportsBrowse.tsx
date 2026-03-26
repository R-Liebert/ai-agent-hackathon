import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  TbAlertTriangle,
  TbCheck,
  TbClock,
  TbCopy,
  TbDatabase,
  TbDownload,
  TbRefresh,
} from "react-icons/tb";
import { useSearchParams } from "react-router-dom";
import { notificationsService } from "../../../../services/notificationsService";
import {
  CreateResearchExportRequest,
  ResearchExportStatus,
  ResearchExportStatusValue,
} from "../../../../services/admin/types/adminResearchExports.types";
import {
  useCreateResearchExport,
  useDownloadInsightsResearchExport,
  useDownloadRawResearchExport,
  useResearchExportStatus,
} from "../../hooks/useResearchExportQueries";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_WINDOW_DAYS = 90;
const DEFAULT_WINDOW_DAYS = 7;

type ToggleField =
  | "includeRawBundle"
  | "includeInsightsWorkbook"
  | "includeSessionEvents"
  | "includeDerivedSessions"
  | "includeChatSummary";

interface FormState {
  fromUtc: string;
  toUtc: string;
  includeRawBundle: boolean;
  includeInsightsWorkbook: boolean;
  includeSessionEvents: boolean;
  includeDerivedSessions: boolean;
  includeChatSummary: boolean;
}

const textFieldStyles = {
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
};

const statusStyles: Record<
  ResearchExportStatusValue,
  { bg: string; color: string; border: string }
> = {
  queued: {
    bg: "rgba(59, 130, 246, 0.2)",
    color: "#60a5fa",
    border: "rgba(96, 165, 250, 0.5)",
  },
  running: {
    bg: "rgba(245, 158, 11, 0.2)",
    color: "#f59e0b",
    border: "rgba(245, 158, 11, 0.45)",
  },
  completed: {
    bg: "rgba(34, 197, 94, 0.2)",
    color: "#22c55e",
    border: "rgba(34, 197, 94, 0.45)",
  },
  failed: {
    bg: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    border: "rgba(239, 68, 68, 0.45)",
  },
  expired: {
    bg: "rgba(249, 115, 22, 0.2)",
    color: "#f97316",
    border: "rgba(249, 115, 22, 0.45)",
  },
};

const toUtcInputValue = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const parseUtcInputValue = (value: string): Date | null => {
  if (!value) return null;
  const parts = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );
  if (!parts) return null;

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const hour = Number(parts[4]);
  const minute = Number(parts[5]);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatUtcDateTime = (value?: string | null): string => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const createInitialFormState = (): FormState => {
  const now = new Date();
  const from = new Date(now.getTime() - DEFAULT_WINDOW_DAYS * DAY_MS);

  return {
    fromUtc: toUtcInputValue(from),
    toUtc: toUtcInputValue(now),
    includeRawBundle: true,
    includeInsightsWorkbook: false,
    includeSessionEvents: true,
    includeDerivedSessions: true,
    includeChatSummary: true,
  };
};

const requestFromStatus = (
  status: ResearchExportStatus
): CreateResearchExportRequest => ({
  fromUtc: status.fromUtc,
  toUtc: status.toUtc,
  includeRawBundle: status.includeRawBundle,
  includeInsightsWorkbook: status.includeInsightsWorkbook,
  includeSessionEvents: status.includeSessionEvents,
  includeDerivedSessions: status.includeDerivedSessions,
  includeChatSummary: status.includeChatSummary,
});

const toFormStateFromRequest = (request: CreateResearchExportRequest): FormState => {
  const from = new Date(request.fromUtc);
  const to = new Date(request.toUtc);

  return {
    fromUtc: Number.isNaN(from.getTime()) ? "" : toUtcInputValue(from),
    toUtc: Number.isNaN(to.getTime()) ? "" : toUtcInputValue(to),
    includeRawBundle: request.includeRawBundle ?? true,
    includeInsightsWorkbook: request.includeInsightsWorkbook ?? false,
    includeSessionEvents: request.includeSessionEvents ?? true,
    includeDerivedSessions: request.includeDerivedSessions ?? true,
    includeChatSummary: request.includeChatSummary ?? true,
  };
};

const renderToggleChip = (enabled: boolean): React.ReactElement => (
  <Chip
    label={enabled ? "Yes" : "No"}
    size="small"
    sx={{
      backgroundColor: enabled
        ? "rgba(34, 197, 94, 0.2)"
        : "rgba(156, 163, 175, 0.2)",
      color: enabled ? "#22c55e" : "#9ca3af",
      border: `1px solid ${enabled ? "#22c55e66" : "#9ca3af66"}`,
      minWidth: 52,
    }}
  />
);

const isTerminalStatus = (status: ResearchExportStatusValue): boolean =>
  status === "completed" || status === "failed" || status === "expired";

const ResearchExportsBrowse: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formState, setFormState] = useState<FormState>(() =>
    createInitialFormState()
  );
  const [activeExportId, setActiveExportId] = useState<string | null>(
    () => searchParams.get("researchExportId")
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastSubmittedRequest, setLastSubmittedRequest] =
    useState<CreateResearchExportRequest | null>(null);

  const createMutation = useCreateResearchExport();
  const statusQuery = useResearchExportStatus(activeExportId, Boolean(activeExportId));
  const downloadRawMutation = useDownloadRawResearchExport();
  const downloadInsightsMutation = useDownloadInsightsResearchExport();

  useEffect(() => {
    const current = searchParams.get("researchExportId");
    if (activeExportId === current) return;

    const next = new URLSearchParams(searchParams);
    if (activeExportId) {
      next.set("researchExportId", activeExportId);
    } else {
      next.delete("researchExportId");
    }
    setSearchParams(next, { replace: true });
  }, [activeExportId, searchParams, setSearchParams]);

  const fromDate = useMemo(
    () => parseUtcInputValue(formState.fromUtc),
    [formState.fromUtc]
  );
  const toDate = useMemo(
    () => parseUtcInputValue(formState.toUtc),
    [formState.toUtc]
  );

  const windowDays = useMemo(() => {
    if (!fromDate || !toDate) return null;
    const diffMs = toDate.getTime() - fromDate.getTime();
    if (diffMs <= 0) return null;
    return diffMs / DAY_MS;
  }, [fromDate, toDate]);

  const validateForm = useCallback((): string | null => {
    if (!formState.fromUtc || !formState.toUtc) {
      return "From (UTC) and To (UTC) are required.";
    }
    if (!fromDate || !toDate) {
      return "Invalid datetime format. Use YYYY-MM-DDTHH:mm (UTC).";
    }
    if (fromDate >= toDate) {
      return "From (UTC) must be earlier than To (UTC).";
    }
    if (windowDays && windowDays > MAX_WINDOW_DAYS) {
      return `Requested export window exceeds ${MAX_WINDOW_DAYS} days.`;
    }

    const hasArtifact = formState.includeRawBundle || formState.includeInsightsWorkbook;
    if (!hasArtifact) {
      return "Select at least one export artifact.";
    }

    const hasSource =
      formState.includeSessionEvents ||
      formState.includeDerivedSessions ||
      formState.includeChatSummary;
    if (!hasSource) {
      return "Select at least one export data source.";
    }

    return null;
  }, [formState, fromDate, toDate, windowDays]);

  const buildRequest = useCallback((): CreateResearchExportRequest | null => {
    if (!fromDate || !toDate) return null;
    return {
      fromUtc: fromDate.toISOString(),
      toUtc: toDate.toISOString(),
      includeRawBundle: formState.includeRawBundle,
      includeInsightsWorkbook: formState.includeInsightsWorkbook,
      includeSessionEvents: formState.includeSessionEvents,
      includeDerivedSessions: formState.includeDerivedSessions,
      includeChatSummary: formState.includeChatSummary,
    };
  }, [formState, fromDate, toDate]);

  const queueExport = useCallback(
    async (request: CreateResearchExportRequest) => {
      setValidationError(null);
      const queued = await createMutation.mutateAsync(request);
      setLastSubmittedRequest(request);
      setActiveExportId(queued.exportId);
    },
    [createMutation]
  );

  const handleCreateExport = useCallback(async () => {
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    const request = buildRequest();
    if (!request) {
      setValidationError("Unable to build request payload.");
      return;
    }

    try {
      await queueExport(request);
    } catch {
      // Error feedback is handled by mutation notifications
    }
  }, [buildRequest, queueExport, validateForm]);

  const handleRetryWithSameSettings = useCallback(async () => {
    const retryRequest =
      lastSubmittedRequest ??
      (statusQuery.data ? requestFromStatus(statusQuery.data) : null);

    if (!retryRequest) {
      notificationsService.error("No previous export settings available.");
      return;
    }

    setFormState(toFormStateFromRequest(retryRequest));
    try {
      await queueExport(retryRequest);
    } catch {
      // Error feedback is handled by mutation notifications
    }
  }, [lastSubmittedRequest, queueExport, statusQuery.data]);

  const handleCopyExportId = useCallback(async () => {
    if (!activeExportId) return;
    try {
      await navigator.clipboard.writeText(activeExportId);
      notificationsService.success("Export ID copied");
    } catch {
      notificationsService.error("Failed to copy export ID");
    }
  }, [activeExportId]);

  const handleToggle = useCallback((field: ToggleField, checked: boolean) => {
    setFormState((prev) => ({ ...prev, [field]: checked }));
  }, []);

  const handleDownloadRaw = useCallback(() => {
    if (!statusQuery.data) return;
    downloadRawMutation.mutate({
      exportId: statusQuery.data.exportId,
      fallbackFileName: statusQuery.data.rawBundleFileName,
    });
  }, [downloadRawMutation, statusQuery.data]);

  const handleDownloadInsights = useCallback(() => {
    if (!statusQuery.data) return;
    downloadInsightsMutation.mutate({
      exportId: statusQuery.data.exportId,
      fallbackFileName: statusQuery.data.insightsWorkbookFileName,
    });
  }, [downloadInsightsMutation, statusQuery.data]);

  const status = statusQuery.data;
  const canRetry = status ? status.status === "failed" || status.status === "expired" : false;
  const isBusy =
    createMutation.isPending ||
    downloadRawMutation.isPending ||
    downloadInsightsMutation.isPending;

  return (
    <Box sx={{ px: 3, backgroundColor: "transparent" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <TbDatabase size={24} color="#EDEDED" />
            <Typography
              variant="h4"
              component="h1"
              className="font-headers text-white-100"
              sx={{ mb: 0.5 }}
            >
              Research Exports
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#bfbfbf" }}>
            Queue UTC-window research exports, track status, and download ZIP/XLSX artifacts.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="medium"
          startIcon={<TbRefresh size={18} />}
          onClick={() => statusQuery.refetch()}
          disabled={!activeExportId || statusQuery.isFetching}
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
              opacity: 0.6,
              color: "#9ca3af",
              border: "1px solid rgba(156,163,175,0.3)",
            },
          }}
        >
          Refresh Status
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: "#1f1f1f",
              border: "1px solid #3A3A3D",
            }}
          >
            <Typography variant="h6" sx={{ color: "#EDEDED", mb: 0.5 }}>
              Create Export
            </Typography>
            <Typography variant="body2" sx={{ color: "#9ca3af", mb: 3 }}>
              All timestamps are UTC.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="From (UTC)"
                  type="datetime-local"
                  value={formState.fromUtc}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, fromUtc: event.target.value }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldStyles}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="To (UTC)"
                  type="datetime-local"
                  value={formState.toUtc}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, toUtc: event.target.value }))
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldStyles}
                />
              </Grid>
            </Grid>

            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 1.5,
                border: "1px solid #3A3A3D",
                backgroundColor: "#171717",
              }}
            >
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                Window length
              </Typography>
              <Typography sx={{ color: "#EDEDED", fontWeight: 600 }}>
                {windowDays ? `${windowDays.toFixed(2)} days` : "N/A"}
              </Typography>
              {windowDays && windowDays > MAX_WINDOW_DAYS && (
                <Typography variant="caption" sx={{ color: "#f97316" }}>
                  Exceeds {MAX_WINDOW_DAYS}-day backend limit.
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "#EDEDED", mb: 1, textTransform: "uppercase" }}
              >
                Artifacts
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.includeRawBundle}
                    onChange={(event) =>
                      handleToggle("includeRawBundle", event.target.checked)
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#60a5fa" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#60a5fa",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: "#EDEDED" }}>
                    Include raw research bundle (ZIP)
                  </Typography>
                }
              />
              <Tooltip title="Aggregated analytics only; no raw rows.">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formState.includeInsightsWorkbook}
                      onChange={(event) =>
                        handleToggle("includeInsightsWorkbook", event.target.checked)
                      }
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#60a5fa" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: "#60a5fa",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: "#EDEDED" }}>
                      Include insights workbook (XLSX)
                    </Typography>
                  }
                />
              </Tooltip>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "#EDEDED", mb: 1, textTransform: "uppercase" }}
              >
                Sources
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.includeSessionEvents}
                    onChange={(event) =>
                      handleToggle("includeSessionEvents", event.target.checked)
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#60a5fa" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#60a5fa",
                      },
                    }}
                  />
                }
                label={<Typography sx={{ color: "#EDEDED" }}>Session events</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.includeDerivedSessions}
                    onChange={(event) =>
                      handleToggle("includeDerivedSessions", event.target.checked)
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#60a5fa" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#60a5fa",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: "#EDEDED" }}>
                    Derived activity windows
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.includeChatSummary}
                    onChange={(event) =>
                      handleToggle("includeChatSummary", event.target.checked)
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#60a5fa" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#60a5fa",
                      },
                    }}
                  />
                }
                label={<Typography sx={{ color: "#EDEDED" }}>Chat summary</Typography>}
              />
            </Box>

            {validationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {validationError}
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 1.5, mt: 3, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                onClick={handleCreateExport}
                disabled={isBusy}
                sx={{
                  backgroundColor: "#60a5fa",
                  color: "#0f172a",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#3b82f6" },
                }}
              >
                {createMutation.isPending ? "Creating..." : "Create Export"}
              </Button>
              {canRetry && (
                <Button
                  variant="outlined"
                  onClick={handleRetryWithSameSettings}
                  disabled={createMutation.isPending}
                  sx={{
                    textTransform: "none",
                    color: "#EDEDED",
                    borderColor: "rgba(237,237,237,0.35)",
                    "&:hover": {
                      borderColor: "#EDEDED",
                      backgroundColor: "rgba(237,237,237,0.08)",
                    },
                  }}
                >
                  Retry with same settings
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: "#1f1f1f",
              border: "1px solid #3A3A3D",
              minHeight: 560,
            }}
          >
            <Typography variant="h6" sx={{ color: "#EDEDED", mb: 2 }}>
              Latest Export Status
            </Typography>

            {!activeExportId ? (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: "1px dashed #3A3A3D",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                Queue an export to start tracking status and downloads.
              </Box>
            ) : statusQuery.isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 240,
                }}
              >
                <CircularProgress sx={{ color: "#60a5fa" }} />
              </Box>
            ) : statusQuery.isError ? (
              <Alert severity="error">
                {statusQuery.error?.message || "Failed to load export status."}
              </Alert>
            ) : status ? (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Chip
                    label={status.status.toUpperCase()}
                    icon={
                      status.status === "completed" ? (
                        <TbCheck size={14} />
                      ) : status.status === "failed" || status.status === "expired" ? (
                        <TbAlertTriangle size={14} />
                      ) : (
                        <TbClock size={14} />
                      )
                    }
                    sx={{
                      backgroundColor: statusStyles[status.status].bg,
                      color: statusStyles[status.status].color,
                      border: `1px solid ${statusStyles[status.status].border}`,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      Export ID:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#EDEDED", fontFamily: "monospace" }}
                    >
                      {status.exportId}
                    </Typography>
                    <Tooltip title="Copy export ID">
                      <IconButton
                        size="small"
                        onClick={handleCopyExportId}
                        sx={{ color: "#9ca3af" }}
                      >
                        <TbCopy size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                      Requested (UTC)
                    </Typography>
                    <Typography sx={{ color: "#EDEDED", fontSize: "0.95rem" }}>
                      {formatUtcDateTime(status.requestedAtUtc)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                      Started (UTC)
                    </Typography>
                    <Typography sx={{ color: "#EDEDED", fontSize: "0.95rem" }}>
                      {formatUtcDateTime(status.startedAtUtc)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                      Completed (UTC)
                    </Typography>
                    <Typography sx={{ color: "#EDEDED", fontSize: "0.95rem" }}>
                      {formatUtcDateTime(status.completedAtUtc)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                      Window (UTC)
                    </Typography>
                    <Typography sx={{ color: "#EDEDED", fontSize: "0.95rem" }}>
                      {formatUtcDateTime(status.fromUtc)} to {formatUtcDateTime(status.toUtc)}
                    </Typography>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: "1px solid #3A3A3D",
                    backgroundColor: "#171717",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Timeline:
                  </Typography>
                  <Chip
                    size="small"
                    label="Queued"
                    sx={{
                      backgroundColor:
                        status.status === "queued" ||
                        status.status === "running" ||
                        isTerminalStatus(status.status)
                          ? "#60a5fa33"
                          : "#6b728033",
                      color:
                        status.status === "queued" ||
                        status.status === "running" ||
                        isTerminalStatus(status.status)
                          ? "#60a5fa"
                          : "#9ca3af",
                    }}
                  />
                  <Chip
                    size="small"
                    label="Running"
                    sx={{
                      backgroundColor:
                        status.status === "running" || isTerminalStatus(status.status)
                          ? "#f59e0b33"
                          : "#6b728033",
                      color:
                        status.status === "running" || isTerminalStatus(status.status)
                          ? "#f59e0b"
                          : "#9ca3af",
                    }}
                  />
                  <Chip
                    size="small"
                    label={status.status === "expired" ? "Expired" : status.status === "failed" ? "Failed" : "Completed"}
                    sx={{
                      backgroundColor: statusStyles[status.status].bg,
                      color: statusStyles[status.status].color,
                      border: `1px solid ${statusStyles[status.status].border}`,
                    }}
                  />
                </Box>

                {(status.errorMessage || status.insightsErrorMessage) && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {status.errorMessage || status.insightsErrorMessage}
                  </Alert>
                )}

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        backgroundColor: "#171717",
                        border: "1px solid #3A3A3D",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: "#EDEDED", mb: 1 }}>
                        Requested Artifacts
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                          Raw bundle
                        </Typography>
                        {renderToggleChip(status.includeRawBundle)}
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                          Insights workbook
                        </Typography>
                        {renderToggleChip(status.includeInsightsWorkbook)}
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        backgroundColor: "#171717",
                        border: "1px solid #3A3A3D",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: "#EDEDED", mb: 1 }}>
                        Included Sources
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                          Session events
                        </Typography>
                        {renderToggleChip(status.includeSessionEvents)}
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                          Derived sessions
                        </Typography>
                        {renderToggleChip(status.includeDerivedSessions)}
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                          Chat summary
                        </Typography>
                        {renderToggleChip(status.includeChatSummary)}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#171717",
                    border: "1px solid #3A3A3D",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#EDEDED", mb: 1 }}>
                    Row Counts
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      Session events
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                      {status.sessionEventsRowCount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      Derived activity windows
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                      {status.derivedSessionsRowCount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      Chat summary
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                      {status.chatSummaryRowCount.toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>

                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#171717",
                    border: "1px solid #3A3A3D",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#EDEDED", mb: 1.5 }}>
                    Artifacts
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                    <Chip
                      size="small"
                      label={status.rawBundleReady ? "Raw ZIP ready" : "Raw ZIP pending"}
                      sx={{
                        backgroundColor: status.rawBundleReady
                          ? "rgba(34,197,94,0.2)"
                          : "rgba(107,114,128,0.2)",
                        color: status.rawBundleReady ? "#22c55e" : "#9ca3af",
                        border: `1px solid ${status.rawBundleReady ? "#22c55e66" : "#9ca3af66"}`,
                      }}
                    />
                    <Chip
                      size="small"
                      label={
                        status.insightsWorkbookReady
                          ? "Insights XLSX ready"
                          : "Insights XLSX pending"
                      }
                      sx={{
                        backgroundColor: status.insightsWorkbookReady
                          ? "rgba(34,197,94,0.2)"
                          : "rgba(107,114,128,0.2)",
                        color: status.insightsWorkbookReady ? "#22c55e" : "#9ca3af",
                        border: `1px solid ${status.insightsWorkbookReady ? "#22c55e66" : "#9ca3af66"}`,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    {status.includeRawBundle && (
                      <Button
                        variant="outlined"
                        startIcon={<TbDownload size={16} />}
                        disabled={!status.rawBundleReady || downloadRawMutation.isPending}
                        onClick={handleDownloadRaw}
                        sx={{
                          textTransform: "none",
                          color: "#EDEDED",
                          borderColor: "rgba(237,237,237,0.35)",
                          "&:hover": {
                            borderColor: "#EDEDED",
                            backgroundColor: "rgba(237,237,237,0.08)",
                          },
                        }}
                      >
                        {downloadRawMutation.isPending
                          ? "Downloading..."
                          : "Download Raw ZIP"}
                      </Button>
                    )}
                    {status.includeInsightsWorkbook && (
                      <Button
                        variant="outlined"
                        startIcon={<TbDownload size={16} />}
                        disabled={
                          !status.insightsWorkbookReady || downloadInsightsMutation.isPending
                        }
                        onClick={handleDownloadInsights}
                        sx={{
                          textTransform: "none",
                          color: "#EDEDED",
                          borderColor: "rgba(237,237,237,0.35)",
                          "&:hover": {
                            borderColor: "#EDEDED",
                            backgroundColor: "rgba(237,237,237,0.08)",
                          },
                        }}
                      >
                        {downloadInsightsMutation.isPending
                          ? "Downloading..."
                          : "Download Insights XLSX"}
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Box>
            ) : (
              <Typography sx={{ color: "#9ca3af" }}>No status data available.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResearchExportsBrowse;
