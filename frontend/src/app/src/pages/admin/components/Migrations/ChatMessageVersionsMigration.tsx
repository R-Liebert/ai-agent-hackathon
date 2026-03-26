import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { TbDatabase, TbPlayerPlay, TbClock } from "react-icons/tb";
import { adminMigrationsService } from "../../../../services/admin/adminMigrationsService";
import {
  ChatMessageVersionsMigrationParams,
  ChatMessageVersionsQueuedResponse,
  ChatMessageVersionsRunNowResponse,
} from "../../../../services/admin/types/adminMigrations.types";
import { notificationsService } from "../../../../services/notificationsService";

const parseOptionalInt = (value: string): number | undefined => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return undefined;
  return Math.max(0, Math.floor(parsed));
};

const normalizeNonNegativeInt = (value: string): string => {
  if (value.trim() === "") return "";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "";
  return String(Math.max(0, Math.floor(parsed)));
};

const ChatMessageVersionsMigration: React.FC = () => {
  const [pageSize, setPageSize] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [preflightOnly, setPreflightOnly] = useState(false);
  const [delayBetweenItemsMs, setDelayBetweenItemsMs] = useState("");
  const [delayBetweenPagesMs, setDelayBetweenPagesMs] = useState("");
  const [globalMaxItemsPerSecond, setGlobalMaxItemsPerSecond] = useState("");
  const [runNowResult, setRunNowResult] =
    useState<ChatMessageVersionsRunNowResponse | null>(null);
  const [queuedResult, setQueuedResult] =
    useState<ChatMessageVersionsQueuedResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRunningInline, setIsRunningInline] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);

  const pageSizeValue = useMemo(() => parseOptionalInt(pageSize), [pageSize]);
  const showLargePageSizeWarning = useMemo(
    () => (pageSizeValue ?? 0) > 1000,
    [pageSizeValue]
  );

  const buildParams = (): ChatMessageVersionsMigrationParams => {
    const params: ChatMessageVersionsMigrationParams = {};
    const pageSizeParsed = parseOptionalInt(pageSize);
    const delayBetweenItemsParsed = parseOptionalInt(delayBetweenItemsMs);
    const delayBetweenPagesParsed = parseOptionalInt(delayBetweenPagesMs);
    const globalMaxItemsParsed = parseOptionalInt(globalMaxItemsPerSecond);

    if (pageSizeParsed !== undefined) params.pageSize = pageSizeParsed;
    if (delayBetweenItemsParsed !== undefined)
      params.delayBetweenItemsMs = delayBetweenItemsParsed;
    if (delayBetweenPagesParsed !== undefined)
      params.delayBetweenPagesMs = delayBetweenPagesParsed;
    if (globalMaxItemsParsed !== undefined)
      params.globalMaxItemsPerSecond = globalMaxItemsParsed;

    if (preflightOnly) params.preflightOnly = true;
    if (dryRun || preflightOnly) params.dryRun = true;

    return params;
  };

  const getErrorMessage = (error: unknown): string => {
    const response = (error as any)?.response;
    const status = response?.status;
    const data = response?.data;

    if (status === 400) {
      return data?.message || data?.title || "Invalid request parameters.";
    }
    if (status === 499) {
      return "Request canceled.";
    }
    if (status === 500) {
      return "Server error. Please try again later.";
    }
    return (error as any)?.message || "Failed to run migration.";
  };

  const handlePreflightToggle = (value: boolean) => {
    setPreflightOnly(value);
    if (value) {
      setDryRun(true);
    }
  };

  const handleRunInline = async () => {
    setIsRunningInline(true);
    setErrorMessage(null);
    setRunNowResult(null);
    try {
      const result = await adminMigrationsService.runChatMessageVersionsMigration(
        buildParams()
      );
      setRunNowResult(result);
      notificationsService.success("Inline migration completed.");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      notificationsService.error(message);
    } finally {
      setIsRunningInline(false);
    }
  };

  const handleQueueJob = async () => {
    setIsQueuing(true);
    setErrorMessage(null);
    setQueuedResult(null);
    try {
      const result = await adminMigrationsService.queueChatMessageVersionsMigration(
        buildParams()
      );
      setQueuedResult(result);
      notificationsService.success("Migration job queued.");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      notificationsService.error(message);
    } finally {
      setIsQueuing(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2,
        }}
      >
        <TbDatabase size={24} color="#EDEDED" />
        <Typography variant="h5" sx={{ color: "#EDEDED", fontWeight: 600 }}>
          Chat Message Versions Backfill
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: "#9ca3af", mb: 3 }}>
        Backfill assistant message versions with preflight and dry-run support.
        Use inline runs for immediate results or queue a background job for larger
        migrations.
      </Typography>

      <Paper
        sx={{
          p: 3,
          backgroundColor: "#1f1f1f",
          border: "1px solid #3A3A3D",
          mb: 3,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            mb: 2,
          }}
        >
          Run Settings
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preflightOnly}
                  onChange={(event) => handlePreflightToggle(event.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#60a5fa",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#60a5fa",
                    },
                  }}
                />
              }
              label="Preflight Only"
              sx={{ color: "#EDEDED" }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={dryRun}
                  onChange={(event) => setDryRun(event.target.checked)}
                  disabled={preflightOnly}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#60a5fa",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#60a5fa",
                    },
                  }}
                />
              }
              label="Dry Run"
              sx={{ color: "#EDEDED" }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Page Size"
              type="number"
              value={pageSize}
              onChange={(event) =>
                setPageSize(normalizeNonNegativeInt(event.target.value))
              }
              placeholder="200"
              inputProps={{ min: 1 }}
              fullWidth
              sx={{
                "& .MuiInputBase-root": { color: "#EDEDED" },
                "& .MuiInputLabel-root": { color: "#9ca3af" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3A3A3D",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Delay Between Items (ms)"
              type="number"
              value={delayBetweenItemsMs}
              onChange={(event) =>
                setDelayBetweenItemsMs(normalizeNonNegativeInt(event.target.value))
              }
              placeholder="0"
              inputProps={{ min: 0 }}
              fullWidth
              sx={{
                "& .MuiInputBase-root": { color: "#EDEDED" },
                "& .MuiInputLabel-root": { color: "#9ca3af" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3A3A3D",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Delay Between Pages (ms)"
              type="number"
              value={delayBetweenPagesMs}
              onChange={(event) =>
                setDelayBetweenPagesMs(normalizeNonNegativeInt(event.target.value))
              }
              placeholder="0"
              inputProps={{ min: 0 }}
              fullWidth
              sx={{
                "& .MuiInputBase-root": { color: "#EDEDED" },
                "& .MuiInputLabel-root": { color: "#9ca3af" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3A3A3D",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Global Max Items Per Second"
              type="number"
              value={globalMaxItemsPerSecond}
              onChange={(event) =>
                setGlobalMaxItemsPerSecond(
                  normalizeNonNegativeInt(event.target.value)
                )
              }
              placeholder="0"
              inputProps={{ min: 0 }}
              fullWidth
              sx={{
                "& .MuiInputBase-root": { color: "#EDEDED" },
                "& .MuiInputLabel-root": { color: "#9ca3af" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3A3A3D",
                },
              }}
            />
          </Grid>
        </Grid>

        {showLargePageSizeWarning && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Page sizes above 1000 can increase Cosmos RU usage. Consider running a
            preflight or adding throttling before executing.
          </Alert>
        )}

        <Divider sx={{ borderColor: "#3A3A3D", my: 3 }} />

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<TbPlayerPlay size={18} />}
            onClick={handleRunInline}
            disabled={isRunningInline || isQueuing}
            sx={{
              backgroundColor: "#60a5fa",
              color: "#0f172a",
              "&:hover": { backgroundColor: "#3b82f6" },
            }}
          >
            {isRunningInline ? "Running..." : "Run Inline"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<TbClock size={18} />}
            onClick={handleQueueJob}
            disabled={isRunningInline || isQueuing}
            sx={{
              color: "#EDEDED",
              borderColor: "rgba(237, 237, 237, 0.3)",
              "&:hover": {
                borderColor: "#EDEDED",
                backgroundColor: "rgba(237, 237, 237, 0.1)",
              },
            }}
          >
            {isQueuing ? "Queuing..." : "Queue Job"}
          </Button>
        </Box>

        <Typography variant="caption" sx={{ color: "#9ca3af", mt: 2, display: "block" }}>
          Queued jobs run in Hangfire and do not return results immediately.
        </Typography>
      </Paper>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {(runNowResult || queuedResult) && (
        <Paper
          sx={{
            p: 3,
            backgroundColor: "#1a1a1a",
            border: "1px solid #3A3A3D",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              mb: 2,
            }}
          >
            Latest Result
          </Typography>

          {runNowResult && (
            <Box sx={{ mb: queuedResult ? 3 : 0 }}>
              <Typography variant="body1" sx={{ color: "#EDEDED", mb: 1 }}>
                Inline Run Summary
              </Typography>
              <Grid container spacing={1}>
                {[
                  ["Processed", runNowResult.processed],
                  ["Messages With Active Version", runNowResult.messagesWithActiveVersion],
                  ["Messages Missing Active Version", runNowResult.messagesMissingActiveVersion],
                  ["Active Version Missing Document", runNowResult.activeVersionMissingDocument],
                  ["Planned Created Versions", runNowResult.plannedCreatedVersions],
                  ["Planned Patched Messages", runNowResult.plannedPatchedMessages],
                  ["Created Versions", runNowResult.createdVersions],
                  ["Patched Messages", runNowResult.patchedMessages],
                  ["Dry Run", String(runNowResult.dryRun)],
                  ["Preflight Only", String(runNowResult.preflightOnly)],
                ].map(([label, value]) => (
                  <Grid item xs={12} md={6} key={label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                        {label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                        {value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {queuedResult && (
            <Box>
              <Typography variant="body1" sx={{ color: "#EDEDED", mb: 1 }}>
                Queued Job
              </Typography>
              <Grid container spacing={1}>
                {[
                  ["Job ID", queuedResult.jobId],
                  ["Message", queuedResult.message],
                  ["Page Size", queuedResult.pageSize],
                  ["Dry Run", String(queuedResult.dryRun)],
                  ["Preflight Only", String(queuedResult.preflightOnly)],
                  ["Delay Between Items (ms)", queuedResult.delayBetweenItemsMs],
                  ["Delay Between Pages (ms)", queuedResult.delayBetweenPagesMs],
                  ["Global Max Items / sec", queuedResult.globalMaxItemsPerSecond],
                ].map(([label, value]) => (
                  <Grid item xs={12} md={6} key={label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                        {label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "#EDEDED", fontFamily: "monospace" }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ChatMessageVersionsMigration;
