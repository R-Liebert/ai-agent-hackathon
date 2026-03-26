import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Switch,
  TextField,
  FormControlLabel,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import {
  TbBell,
  TbRefresh,
  TbAlertTriangle,
  TbInfoCircle,
} from "react-icons/tb";
import { GoAlert } from "react-icons/go";
import {
  useSiteAlertAdmin,
  useUpdateSiteAlert,
} from "../../hooks/useSiteAlertQueries";
import {
  SiteAlertSeverity,
  ALERT_SEVERITY_STYLES,
} from "../../../../services/admin/types/siteAlert.types";

const MaintenanceAlertsBrowse: React.FC = () => {
  const { data: config, isLoading, error, refetch } = useSiteAlertAdmin();
  const updateMutation = useUpdateSiteAlert();

  // Local form state
  const [enabled, setEnabled] = useState(false);
  const [messageEn, setMessageEn] = useState("");
  const [messageDa, setMessageDa] = useState("");
  const [severity, setSeverity] = useState<SiteAlertSeverity>("warning");
  const [isDirty, setIsDirty] = useState(false);
  const [previewLang, setPreviewLang] = useState<"en" | "da">("en");

  // Sync form state when data loads
  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setMessageEn(config.messageEn);
      setMessageDa(config.messageDa);
      setSeverity(config.severity);
      setIsDirty(false);
    }
  }, [config]);

  // Track dirty state
  useEffect(() => {
    if (config) {
      const hasChanges =
        enabled !== config.enabled ||
        messageEn !== config.messageEn ||
        messageDa !== config.messageDa ||
        severity !== config.severity;
      setIsDirty(hasChanges);
    }
  }, [enabled, messageEn, messageDa, severity, config]);

  const handleSubmit = useCallback(() => {
    updateMutation.mutate({ enabled, messageEn, messageDa, severity });
  }, [enabled, messageEn, messageDa, severity, updateMutation]);

  const handleReset = useCallback(() => {
    if (config) {
      setEnabled(config.enabled);
      setMessageEn(config.messageEn);
      setMessageDa(config.messageDa);
      setSeverity(config.severity);
      setIsDirty(false);
    }
  }, [config]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Validation
  const isValid = !enabled || (messageEn.trim() !== "" && messageDa.trim() !== "");
  const previewMessage = previewLang === "en" ? messageEn : messageDa;

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
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
          Failed to load site alert configuration: {error.message}
        </Alert>
      </Box>
    );
  }

  const previewStyles = ALERT_SEVERITY_STYLES[severity];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TbBell size={24} color="#EDEDED" />
          <Typography variant="h5" sx={{ color: "#EDEDED", fontWeight: 600 }}>
            Maintenance & Alerts
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<TbRefresh size={18} />}
          onClick={handleRefresh}
          sx={{
            color: "#EDEDED",
            borderColor: "rgba(237, 237, 237, 0.3)",
            "&:hover": {
              borderColor: "#EDEDED",
              backgroundColor: "rgba(237, 237, 237, 0.1)",
            },
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Alert Preview */}
      <Paper
        sx={{
          mb: 3,
          backgroundColor: "#2a2a2a",
          border: "1px solid rgba(106, 106, 106, 0.3)",
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid rgba(106, 106, 106, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: "#9CA3AF", fontWeight: 500 }}
          >
            Preview
          </Typography>
          <Tabs
            value={previewLang}
            onChange={(_, val) => setPreviewLang(val)}
            sx={{
              minHeight: 32,
              "& .MuiTabs-indicator": {
                backgroundColor: "#60a5fa",
              },
            }}
          >
            <Tab
              value="en"
              label="English"
              sx={{
                color: "#9CA3AF",
                minHeight: 32,
                py: 0,
                "&.Mui-selected": { color: "#EDEDED" },
              }}
            />
            <Tab
              value="da"
              label="Danish"
              sx={{
                color: "#9CA3AF",
                minHeight: 32,
                py: 0,
                "&.Mui-selected": { color: "#EDEDED" },
              }}
            />
          </Tabs>
        </Box>
        <Box sx={{ p: 2 }}>
          {enabled && previewMessage ? (
            <div
              className="p-2 rounded-lg flex items-center justify-center gap-3 text-center"
              style={{
                backgroundColor: previewStyles.backgroundColor,
                color: previewStyles.color,
              }}
            >
              <GoAlert className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{previewMessage}</span>
            </div>
          ) : (
            <Box
              sx={{
                p: 2,
                textAlign: "center",
                color: "#6B7280",
                backgroundColor: "#1a1a1a",
                borderRadius: 1,
              }}
            >
              Alert is disabled or message is empty
            </Box>
          )}
        </Box>
      </Paper>

      {/* Configuration Form */}
      <Paper
        sx={{
          backgroundColor: "#2a2a2a",
          border: "1px solid rgba(106, 106, 106, 0.3)",
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(106, 106, 106, 0.3)" }}>
          <Typography
            variant="subtitle2"
            sx={{ color: "#9CA3AF", fontWeight: 500 }}
          >
            Configuration
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          {/* Enable Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
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
            label={
              <Typography sx={{ color: "#EDEDED" }}>
                Enable site-wide alert
              </Typography>
            }
            sx={{ mb: 3 }}
          />

          {/* Severity Dropdown */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              sx={{
                color: "#9CA3AF",
                "&.Mui-focused": { color: "#60a5fa" },
              }}
            >
              Severity
            </InputLabel>
            <Select
              value={severity}
              label="Severity"
              onChange={(e) => setSeverity(e.target.value as SiteAlertSeverity)}
              sx={{
                color: "#EDEDED",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(106, 106, 106, 0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(106, 106, 106, 0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#60a5fa",
                },
                ".MuiSvgIcon-root": { color: "#EDEDED" },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "#2a2a2a",
                    border: "1px solid rgba(106, 106, 106, 0.3)",
                  },
                },
              }}
            >
              <MenuItem value="info" sx={{ color: "#EDEDED" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TbInfoCircle size={18} color="#3b82f6" />
                  Info (Blue)
                </Box>
              </MenuItem>
              <MenuItem value="warning" sx={{ color: "#EDEDED" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TbAlertTriangle size={18} color="#ca8a04" />
                  Warning (Yellow)
                </Box>
              </MenuItem>
              <MenuItem value="error" sx={{ color: "#EDEDED" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <GoAlert size={18} color="#dc2626" />
                  Error (Red)
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* English Message Text Field */}
          <TextField
            fullWidth
            label={`English Message${enabled ? " *" : ""}`}
            multiline
            rows={3}
            value={messageEn}
            onChange={(e) => setMessageEn(e.target.value)}
            placeholder="Enter the alert message in English..."
            inputProps={{ maxLength: 1000 }}
            helperText={`${messageEn.length}/1000`}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                color: "#EDEDED",
                "& fieldset": {
                  borderColor: "rgba(106, 106, 106, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(106, 106, 106, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#60a5fa",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#9CA3AF",
                "&.Mui-focused": {
                  color: "#60a5fa",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "#6B7280",
                textAlign: "right",
              },
            }}
          />

          {/* Danish Message Text Field */}
          <TextField
            fullWidth
            label={`Danish Message${enabled ? " *" : ""}`}
            multiline
            rows={3}
            value={messageDa}
            onChange={(e) => setMessageDa(e.target.value)}
            placeholder="Indtast besked på dansk..."
            inputProps={{ maxLength: 1000 }}
            helperText={`${messageDa.length}/1000`}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                color: "#EDEDED",
                "& fieldset": {
                  borderColor: "rgba(106, 106, 106, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(106, 106, 106, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#60a5fa",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#9CA3AF",
                "&.Mui-focused": {
                  color: "#60a5fa",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "#6B7280",
                textAlign: "right",
              },
            }}
          />

          {/* Validation Warning */}
          {enabled && (!messageEn.trim() || !messageDa.trim()) && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Both English and Danish messages are required when alert is
              enabled
            </Alert>
          )}

          {/* Last Updated Info */}
          {config?.updatedAt && (
            <Typography variant="body2" sx={{ color: "#6B7280", mb: 3 }}>
              Last updated: {formatDate(config.updatedAt)}
              {config.updatedBy && ` by ${config.updatedBy}`}
            </Typography>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!isDirty || !isValid || updateMutation.isPending}
              sx={{
                backgroundColor: "#60a5fa",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#3b82f6",
                },
                "&.Mui-disabled": {
                  backgroundColor: "rgba(96, 165, 250, 0.3)",
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              {updateMutation.isPending ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={!isDirty}
              sx={{
                color: "#EDEDED",
                borderColor: "rgba(237, 237, 237, 0.3)",
                "&:hover": {
                  borderColor: "#EDEDED",
                  backgroundColor: "rgba(237, 237, 237, 0.1)",
                },
                "&.Mui-disabled": {
                  color: "rgba(237, 237, 237, 0.3)",
                  borderColor: "rgba(237, 237, 237, 0.1)",
                },
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default MaintenanceAlertsBrowse;
