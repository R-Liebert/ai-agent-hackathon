import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  TbAlertTriangle,
  TbCheck,
  TbClock,
  TbEye,
  TbRefresh,
  TbSettings,
} from "react-icons/tb";
import { notificationsService } from "../../../../services/notificationsService";
import { launchpadSettingsAdminService } from "../../../../services/admin/launchpadSettingsService";
import type {
  BestySettings,
  LaunchpadSettingsValidationProblem,
  UpdateBestySettingsRequest,
} from "../../../../services/admin/types/launchpadSettings.types";
import {
  launchpadSettingsAdminKeys,
  useLaunchpadSettingsAdmin,
  useUpdateLaunchpadSettings,
} from "../../hooks/useLaunchpadSettingsQueries";

const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const switchStyles = {
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "#60a5fa",
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#60a5fa",
  },
};

const paperStyles = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #313131",
  borderRadius: 2,
};

const buttonStyles = {
  textTransform: "none",
  borderRadius: "9999px",
  py: 0.75,
  px: 2,
  fontSize: "0.95rem",
};

const availabilityToneStyles: Record<
  "success" | "warning" | "error",
  { backgroundColor: string; border: string; color: string }
> = {
  success: {
    backgroundColor: "rgba(34,197,94,0.16)",
    border: "1px solid rgba(34,197,94,0.45)",
    color: "#bbf7d0",
  },
  warning: {
    backgroundColor: "rgba(245,158,11,0.16)",
    border: "1px solid rgba(245,158,11,0.45)",
    color: "#fde68a",
  },
  error: {
    backgroundColor: "rgba(239,68,68,0.16)",
    border: "1px solid rgba(239,68,68,0.45)",
    color: "#fecaca",
  },
};

const normalizeGroupId = (value: string): string => value.trim().toLowerCase();

const areGroupListsEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;
  return left.every(
    (value, index) => normalizeGroupId(value) === normalizeGroupId(right[index])
  );
};

const buildBestyPatch = (
  base: BestySettings,
  draft: BestySettings
): UpdateBestySettingsRequest | null => {
  const patch: UpdateBestySettingsRequest = {};

  if (base.enabled !== draft.enabled) {
    patch.enabled = draft.enabled;
  }

  if (base.exposeInAgentCatalog !== draft.exposeInAgentCatalog) {
    patch.exposeInAgentCatalog = draft.exposeInAgentCatalog;
  }

  if (
    !areGroupListsEqual(base.allowedEntraGroupIds, draft.allowedEntraGroupIds)
  ) {
    patch.allowedEntraGroupIds = draft.allowedEntraGroupIds;
  }

  return Object.keys(patch).length > 0 ? patch : null;
};

const applyBestyPatch = (
  base: BestySettings,
  patch: UpdateBestySettingsRequest
): BestySettings => {
  return {
    enabled: patch.enabled ?? base.enabled,
    exposeInAgentCatalog: patch.exposeInAgentCatalog ?? base.exposeInAgentCatalog,
    allowedEntraGroupIds:
      patch.allowedEntraGroupIds ?? base.allowedEntraGroupIds,
  };
};

const extractProblemMessages = (
  error: AxiosError<LaunchpadSettingsValidationProblem | string>
): string[] => {
  const responseData = error.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return [responseData];
  }

  if (!responseData || typeof responseData !== "object") {
    return error.message ? [error.message] : [];
  }

  const messages: string[] = [];
  if (responseData.message) {
    messages.push(responseData.message);
  }
  if (responseData.detail) {
    messages.push(responseData.detail);
  }
  if (responseData.title) {
    messages.push(responseData.title);
  }
  if (responseData.errors) {
    Object.values(responseData.errors).forEach((fieldErrors) => {
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((message) => {
          if (message) messages.push(message);
        });
      }
    });
  }

  return Array.from(new Set(messages));
};

const formatTimestamp = (value?: string | null): string => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short",
  });
};

const LaunchpadSettingsBrowse: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    data: configuration,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLaunchpadSettingsAdmin();
  const updateMutation = useUpdateLaunchpadSettings();

  const [enabled, setEnabled] = useState(false);
  const [exposeInAgentCatalog, setExposeInAgentCatalog] = useState(false);
  const [allowedEntraGroupIds, setAllowedEntraGroupIds] = useState<string[]>(
    []
  );
  const [groupInput, setGroupInput] = useState("");
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);
  const skipNextConfigSyncRef = useRef(false);

  useEffect(() => {
    if (!configuration) return;
    if (skipNextConfigSyncRef.current) {
      skipNextConfigSyncRef.current = false;
      return;
    }
    setEnabled(configuration.agents.besty.enabled);
    setExposeInAgentCatalog(configuration.agents.besty.exposeInAgentCatalog);
    setAllowedEntraGroupIds(
      configuration.agents.besty.allowedEntraGroupIds
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    );
    setGroupInput("");
    setSaveErrors([]);
    setConflictNotice(null);
  }, [configuration]);

  const normalizedGroupIds = useMemo(
    () =>
      allowedEntraGroupIds
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    [allowedEntraGroupIds]
  );

  const duplicateCountById = useMemo(() => {
    const counts = new Map<string, number>();
    normalizedGroupIds.forEach((groupId) => {
      const key = normalizeGroupId(groupId);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [normalizedGroupIds]);

  const groupValidation = useMemo(
    () =>
      normalizedGroupIds.map((groupId, index) => {
        const normalizedId = normalizeGroupId(groupId);
        const isDuplicate = (duplicateCountById.get(normalizedId) ?? 0) > 1;
        const isValidGuid = GUID_REGEX.test(groupId);

        return {
          key: `${normalizedId}-${index}`,
          groupId,
          index,
          isDuplicate,
          isValidGuid,
        };
      }),
    [duplicateCountById, normalizedGroupIds]
  );

  const duplicateCount = useMemo(
    () => groupValidation.filter((entry) => entry.isDuplicate).length,
    [groupValidation]
  );
  const invalidCount = useMemo(
    () => groupValidation.filter((entry) => !entry.isValidGuid).length,
    [groupValidation]
  );
  const hasValidationErrors = duplicateCount > 0 || invalidCount > 0;

  const bestyDraft = useMemo<BestySettings>(
    () => ({
      enabled,
      exposeInAgentCatalog,
      allowedEntraGroupIds: normalizedGroupIds,
    }),
    [enabled, exposeInAgentCatalog, normalizedGroupIds]
  );

  const isDirty = useMemo(() => {
    if (!configuration) return false;
    return Boolean(buildBestyPatch(configuration.agents.besty, bestyDraft));
  }, [configuration, bestyDraft]);

  const canSave =
    Boolean(configuration) &&
    !hasValidationErrors &&
    isDirty &&
    !updateMutation.isPending;

  const availabilitySummary = useMemo(() => {
    if (!enabled) {
      return {
        title: "Besty is disabled",
        detail: "Enabled is off, so no users can access Besty.",
        tone: "error" as const,
      };
    }

    if (!exposeInAgentCatalog) {
      return {
        title: "Besty is hidden from catalog",
        detail: "Enable catalog exposure to make Besty discoverable.",
        tone: "warning" as const,
      };
    }

    if (normalizedGroupIds.length === 0) {
      return {
        title: "No users are currently eligible",
        detail: "Allowlist is empty, so Besty remains unavailable for everyone.",
        tone: "warning" as const,
      };
    }

    return {
      title: "Besty can be accessed by allowed users",
      detail:
        "Users in at least one allowed Entra group can see and use Besty in the catalog.",
      tone: "success" as const,
    };
  }, [enabled, exposeInAgentCatalog, normalizedGroupIds.length]);

  const handleRefresh = useCallback(async () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Refresh and discard local edits?"
      );
      if (!confirmed) return;
    }

    setConflictNotice(null);
    setSaveErrors([]);
    await refetch();
  }, [isDirty, refetch]);

  const handleReset = useCallback(() => {
    if (!configuration) return;
    setEnabled(configuration.agents.besty.enabled);
    setExposeInAgentCatalog(configuration.agents.besty.exposeInAgentCatalog);
    setAllowedEntraGroupIds(
      configuration.agents.besty.allowedEntraGroupIds
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    );
    setGroupInput("");
    setConflictNotice(null);
    setSaveErrors([]);
  }, [configuration]);

  const addGroupIdsFromInput = useCallback(() => {
    const tokens = groupInput
      .split(/[\s,;]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) return;

    setAllowedEntraGroupIds((previous) => [...previous, ...tokens]);
    setGroupInput("");
  }, [groupInput]);

  const handleGroupInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" || event.key === "," || event.key === ";") {
        event.preventDefault();
        addGroupIdsFromInput();
      }
    },
    [addGroupIdsFromInput]
  );

  const removeGroupId = useCallback((indexToDelete: number) => {
    setAllowedEntraGroupIds((previous) =>
      previous.filter((_, index) => index !== indexToDelete)
    );
  }, []);

  const rebaseAfterConflict = useCallback(
    async (pendingPatch: UpdateBestySettingsRequest) => {
      try {
        const latest = await launchpadSettingsAdminService.getConfiguration();
        skipNextConfigSyncRef.current = true;
        queryClient.setQueryData(launchpadSettingsAdminKeys.configuration(), latest);

        const rebasedDraft = applyBestyPatch(latest.agents.besty, pendingPatch);
        setEnabled(rebasedDraft.enabled);
        setExposeInAgentCatalog(rebasedDraft.exposeInAgentCatalog);
        setAllowedEntraGroupIds(rebasedDraft.allowedEntraGroupIds);
        setConflictNotice(
          "Settings were updated by someone else. Latest values were loaded and your edits were reapplied. Review and save again."
        );
      } catch {
        notificationsService.error(
          "Conflict detected, but latest settings could not be loaded. Refresh and retry."
        );
      }
    },
    [queryClient]
  );

  const handleSave = useCallback(async () => {
    if (!configuration) return;

    setConflictNotice(null);
    setSaveErrors([]);

    const patch = buildBestyPatch(configuration.agents.besty, bestyDraft);
    if (!patch) {
      notificationsService.info("No changes to save.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        expectedEtag: configuration.eTag ?? undefined,
        agents: {
          besty: patch,
        },
      });

      notificationsService.success("Launchpad settings updated successfully.");
    } catch (error) {
      const axiosError =
        error as AxiosError<LaunchpadSettingsValidationProblem | string>;
      const status = axiosError.response?.status;

      if (status === 409) {
        notificationsService.warn("Settings were updated by someone else.");
        await rebaseAfterConflict(patch);
        return;
      }

      if (status === 400) {
        const validationMessages = extractProblemMessages(axiosError);
        setSaveErrors(
          validationMessages.length > 0
            ? validationMessages
            : ["Validation failed. Fix issues and retry."]
        );
        notificationsService.error("Validation failed. Review fields and retry.");
        return;
      }

      if (status === 401) {
        notificationsService.error("Session expired. Sign in again and retry.");
        return;
      }

      const messages = extractProblemMessages(axiosError);
      notificationsService.error(
        messages[0] ?? "Failed to update Launchpad settings."
      );
    }
  }, [bestyDraft, configuration, rebaseAfterConflict, updateMutation]);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#EDEDED" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load Launchpad settings: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ color: "#EDEDED", fontWeight: 600, mb: 0.5 }}
          >
            Launchpad Settings
          </Typography>
          <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
            Manage Besty rollout, visibility, and Entra group access allowlist.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<TbRefresh size={18} />}
            onClick={handleRefresh}
            disabled={isFetching}
            sx={{
              ...buttonStyles,
              color: "#EDEDED",
              borderColor: "rgba(237, 237, 237, 0.3)",
              "&:hover": {
                borderColor: "#EDEDED",
                backgroundColor: "rgba(237, 237, 237, 0.08)",
              },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={!isDirty}
            sx={{
              ...buttonStyles,
              color: "#EDEDED",
              borderColor: "rgba(106, 106, 106, 0.45)",
              "&:hover": {
                borderColor: "#6a6a6a",
                backgroundColor: "rgba(106, 106, 106, 0.12)",
              },
            }}
          >
            Discard Changes
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!canSave}
            sx={{
              ...buttonStyles,
              backgroundColor: "#60a5fa",
              color: "#0f172a",
              "&:hover": {
                backgroundColor: "#3b82f6",
              },
              "&.Mui-disabled": {
                backgroundColor: "#1f2937",
                color: "#9ca3af",
              },
            }}
          >
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </Box>
      </Box>

      {isDirty && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            backgroundColor: "rgba(59,130,246,0.16)",
            border: "1px solid rgba(59,130,246,0.4)",
            color: "#bfdbfe",
          }}
        >
          You have unsaved changes.
        </Alert>
      )}

      {conflictNotice && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            backgroundColor: "rgba(245,158,11,0.16)",
            border: "1px solid rgba(245,158,11,0.45)",
            color: "#fcd34d",
          }}
        >
          {conflictNotice}
        </Alert>
      )}

      {saveErrors.length > 0 && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            backgroundColor: "rgba(239,68,68,0.16)",
            border: "1px solid rgba(239,68,68,0.45)",
            color: "#fecaca",
          }}
        >
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {saveErrors.map((message, index) => (
              <li key={`launchpad-validation-${index}`}>{message}</li>
            ))}
          </Box>
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0,2fr) minmax(0,1fr)" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper sx={paperStyles}>
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: "#EDEDED", fontWeight: 600, mb: 0.5 }}
              >
                Besty Availability
              </Typography>
              <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 3 }}>
                Control whether Besty is enabled and visible in the agent catalog.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "rgba(66,70,84,0.25)",
                    border: "1px solid rgba(106,106,106,0.3)",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enabled}
                        onChange={(event) => setEnabled(event.target.checked)}
                        sx={switchStyles}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ color: "#EDEDED", fontWeight: 500 }}>
                          Enabled
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                          Turns Besty on or off globally.
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>

                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "rgba(66,70,84,0.25)",
                    border: "1px solid rgba(106,106,106,0.3)",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exposeInAgentCatalog}
                        onChange={(event) =>
                          setExposeInAgentCatalog(event.target.checked)
                        }
                        sx={switchStyles}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ color: "#EDEDED", fontWeight: 500 }}>
                          Expose in Agent Catalog
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                          Makes Besty discoverable in the agent catalog.
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Box>
            </Box>
          </Paper>

          <Paper sx={paperStyles}>
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: "#EDEDED", fontWeight: 600, mb: 0.5 }}
              >
                Access Control
              </Typography>
              <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 2.5 }}>
                Add allowed Entra group GUIDs. Separate values with comma, space,
                or new line.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <TextField
                  fullWidth
                  label="Add group ID(s)"
                  value={groupInput}
                  onChange={(event) => setGroupInput(event.target.value)}
                  onKeyDown={handleGroupInputKeyDown}
                  placeholder="11111111-1111-1111-1111-111111111111"
                  size="small"
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
                    flex: 1,
                    minWidth: 260,
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={addGroupIdsFromInput}
                  sx={{
                    ...buttonStyles,
                    borderColor: "rgba(59,130,246,0.4)",
                    color: "#60a5fa",
                    "&:hover": {
                      borderColor: "#60a5fa",
                      backgroundColor: "rgba(59,130,246,0.16)",
                    },
                  }}
                >
                  Add
                </Button>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                  Invalid or duplicate GUIDs are blocked on save.
                </Typography>
              </Box>

              {groupValidation.length > 0 ? (
                <Box sx={{ mt: 2.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {groupValidation.map((entry) => {
                    const hasError = !entry.isValidGuid || entry.isDuplicate;
                    const backgroundColor = hasError
                      ? "rgba(239,68,68,0.16)"
                      : "rgba(59,130,246,0.16)";
                    const color = hasError ? "#fecaca" : "#bfdbfe";
                    const border = hasError
                      ? "1px solid rgba(239,68,68,0.45)"
                      : "1px solid rgba(59,130,246,0.35)";
                    const hint = !entry.isValidGuid
                      ? "Invalid GUID format"
                      : entry.isDuplicate
                        ? "Duplicate GUID"
                        : "";

                    return (
                      <Chip
                        key={entry.key}
                        label={
                          hint
                            ? `${entry.groupId} (${hint})`
                            : entry.groupId
                        }
                        onDelete={() => removeGroupId(entry.index)}
                        sx={{
                          backgroundColor,
                          color,
                          border,
                          maxWidth: "100%",
                          "& .MuiChip-label": {
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              ) : (
                <Paper
                  sx={{
                    mt: 2.5,
                    p: 2,
                    backgroundColor: "#111827",
                    border: "1px dashed #374151",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                    No allowed group IDs configured. Empty allowlist means no user
                    can use Besty.
                  </Typography>
                </Paper>
              )}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper sx={paperStyles}>
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: "#EDEDED", fontWeight: 600, mb: 2 }}
              >
                Runtime Summary
              </Typography>

              <Alert
                icon={
                  availabilitySummary.tone === "success" ? (
                    <TbCheck size={16} />
                  ) : (
                    <TbAlertTriangle size={16} />
                  )
                }
                severity={availabilitySummary.tone}
                sx={{
                  mb: 2,
                  ...availabilityToneStyles[availabilitySummary.tone],
                }}
              >
                <Typography sx={{ fontWeight: 600, mb: 0.25 }}>
                  {availabilitySummary.title}
                </Typography>
                <Typography variant="body2">{availabilitySummary.detail}</Typography>
              </Alert>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <TbSettings size={16} color={enabled ? "#34d399" : "#9ca3af"} />
                  <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                    Enabled: {enabled ? "Yes" : "No"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <TbEye
                    size={16}
                    color={exposeInAgentCatalog ? "#34d399" : "#9ca3af"}
                  />
                  <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                    Exposed in catalog: {exposeInAgentCatalog ? "Yes" : "No"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <TbCheck
                    size={16}
                    color={normalizedGroupIds.length > 0 ? "#34d399" : "#9ca3af"}
                  />
                  <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                    Allowed groups: {normalizedGroupIds.length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Paper sx={paperStyles}>
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: "#EDEDED", fontWeight: 600, mb: 2 }}
              >
                Configuration Metadata
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                    Updated by
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#EDEDED", textAlign: "right" }}
                  >
                    {configuration?.updatedBy || "Unknown"}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(106,106,106,0.3)" }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                    Updated at
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#EDEDED", textAlign: "right" }}
                  >
                    {formatTimestamp(configuration?.updatedAt)}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(106,106,106,0.3)" }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                    ETag
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#EDEDED", textAlign: "right", wordBreak: "break-all" }}
                  >
                    {configuration?.eTag || "N/A"}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(106,106,106,0.3)" }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                    Data source
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                    {configuration?.fromCache ? "Cache" : "Live"}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(106,106,106,0.3)" }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                    Schema version
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#EDEDED" }}>
                    {configuration?.schemaVersion ?? "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Paper sx={paperStyles}>
            <Box sx={{ p: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ color: "#EDEDED", fontWeight: 600, mb: 1.5 }}
              >
                Optimistic Concurrency
              </Typography>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                <TbClock size={18} color="#60a5fa" style={{ marginTop: 2 }} />
                <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                  Saves include the current ETag. If another admin updates settings
                  first, this page reloads the latest values and preserves your
                  pending edits for review.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default LaunchpadSettingsBrowse;
