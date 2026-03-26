import React, { useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Collapse,
  Typography,
  Chip,
  SelectChangeEvent,
  OutlinedInput,
  IconButton,
} from "@mui/material";
import { TbSearch, TbRefresh, TbChevronDown, TbChevronUp, TbFilter, TbX } from "react-icons/tb";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { WorkspaceFiltersProps } from "./types";
import { WorkspaceProcessingStatus } from "../../../../services/admin/types/adminWorkspace.types";

const WorkspaceFilters: React.FC<WorkspaceFiltersProps> = ({
  searchTerm,
  onSearchChange,
  forceRefresh,
  onForceRefreshChange,
  showCitations,
  onShowCitationsChange,
  advancedFileAnalysis,
  onAdvancedFileAnalysisChange,
  isConservative,
  onIsConservativeChange,
  isFileAccessRestrictedForMembers,
  onIsFileAccessRestrictedForMembersChange,
  emailNotificationsDisabled,
  onEmailNotificationsDisabledChange,
  createdAfter,
  onCreatedAfterChange,
  createdBefore,
  onCreatedBeforeChange,
  processingStatus,
  onProcessingStatusChange,
  onRefresh,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters = () => {
    return (
      showCitations !== undefined ||
      advancedFileAnalysis !== undefined ||
      isConservative !== undefined ||
      isFileAccessRestrictedForMembers !== undefined ||
      emailNotificationsDisabled !== undefined ||
      createdAfter !== undefined ||
      createdBefore !== undefined ||
      (processingStatus && processingStatus.length > 0)
    );
  };

  const activeFilterCount = () => {
    let count = 0;
    // Count configuration filters as one if any are active
    if (showCitations !== undefined || 
        advancedFileAnalysis !== undefined || 
        isConservative !== undefined || 
        isFileAccessRestrictedForMembers !== undefined || 
        emailNotificationsDisabled !== undefined) count++;
    if (createdAfter !== undefined) count++;
    if (createdBefore !== undefined) count++;
    if (processingStatus && processingStatus.length > 0) count++;
    return count;
  };

  const handleTriStateCheckbox = (
    currentValue: boolean | undefined,
    onChange: (value: boolean | undefined) => void
  ) => {
    if (currentValue === undefined) {
      onChange(true);
    } else if (currentValue === true) {
      onChange(false);
    } else {
      onChange(undefined);
    }
  };

  const handleClearFilters = () => {
    onShowCitationsChange(undefined);
    onAdvancedFileAnalysisChange(undefined);
    onIsConservativeChange(undefined);
    onIsFileAccessRestrictedForMembersChange(undefined);
    onEmailNotificationsDisabledChange(undefined);
    onCreatedAfterChange(undefined);
    onCreatedBeforeChange(undefined);
    onProcessingStatusChange(undefined);
  };

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <TextField
          size="small"
          placeholder="Search workspaces..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 0 }}>
                <Box 
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    pl: 2.5,
                    pr: 2,
                    mr: 2,
                    borderRight: "1px solid #404040",
                    borderTopLeftRadius: "inherit",
                    borderBottomLeftRadius: "inherit",
                  }}
                >
                  <TbSearch size={18} style={{ color: "#60a5fa" }} />
                </Box>
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end" sx={{ mr: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => onSearchChange("")}
                  sx={{
                    color: "#6a6a6a",
                    p: 0.5,
                    '&:hover': {
                      color: '#EDEDED',
                      backgroundColor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  <TbX size={18} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 420,
            height: 44,
            "& .MuiInputBase-root": {
              backgroundColor: "#171717",
              color: "#EDEDED",
              fontSize: "1.1rem",
              fontWeight: 500,
              borderRadius: "18px",
              border: "1px solid #313131",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.03)",
              height: "100%",
              pl: 0,
              pr: 3,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: "#1f1f1f",
                borderColor: "#404040",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.05)",
                transform: "translateY(-1px)",
              },
              "&.Mui-focused": {
                backgroundColor: "#1f1f1f",
                borderColor: "rgba(59,130,246,0.5)",
                boxShadow: "0 0 0 3px rgba(59,130,246,0.1), 0 4px 8px rgba(0, 0, 0, 0.15)",
                transform: "translateY(-1px)",
              },
            },
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "& .MuiInputBase-input": {
              height: "100%",
              py: 0,
              "&::placeholder": {
                color: "#9ca3af",
                opacity: 1,
                fontWeight: 400,
                fontSize: "1.1rem",
              },
            },
            "& .MuiInputAdornment-root": {
              height: "100%",
              maxHeight: "none",
              ml: 0,
            },
          }}
        />

        <Box flex={1} />

        <Button
          variant="text"
          size="medium"
          startIcon={showAdvancedFilters ? <TbChevronUp size={18} /> : <TbChevronDown size={18} />}
          endIcon={
            hasActiveFilters() && (
              <Chip
                label={activeFilterCount()}
                size="medium"
                sx={{
                  height: 28,
                  backgroundColor: "#1f1f1f",
                  color: "#bfbfbf",
                  fontSize: "0.875rem",
                  border: "1px solid #2a2a2a",
                  borderRadius: "9999px",
                  "& .MuiChip-label": {
                    px: 2.5,
                    fontSize: "0.875rem",
                  },
                }}
              />
            )
          }
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          sx={{
            color: hasActiveFilters() ? "#bfbfbf" : "#EDEDED",
            textTransform: "none",
            fontSize: "1rem",
            py: 1.5,
            px: 2,
            "&:hover": {
              backgroundColor: "#262626",
            },
            "& .MuiButton-endIcon>*:nth-of-type(1)": {
              fontSize: "inherit",
            },
          }}
        >
          <TbFilter className="mr-1" size={16} />
          Advanced Filters
        </Button>

        {hasActiveFilters() && (
          <Button
            variant="text"
            size="medium"
            startIcon={<TbX size={16} />}
            onClick={handleClearFilters}
            sx={{
              color: "#bfbfbf",
              textTransform: "none",
              minWidth: "auto",
              px: 2,
              py: 1.5,
              fontSize: "1rem",
              "&:hover": {
                backgroundColor: "#262626",
                color: "#d1d5db",
              },
            }}
          >
            Clear
          </Button>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={forceRefresh}
              onChange={(e) => onForceRefreshChange(e.target.checked)}
              size="medium"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#e5e7eb",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#737373",
                },
              }}
            />
          }
          label={
            <Typography variant="body1" sx={{ color: "#fff", fontSize: "1rem" }}>
              Force Refresh
            </Typography>
          }
        />

        <Button
          variant="outlined"
          size="medium"
          startIcon={<TbRefresh size={18} />}
          onClick={onRefresh}
          sx={{
            textTransform: "none",
            borderRadius: "9999px",
            backgroundColor: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.35)",
            color: "#60a5fa",
            py: 1,
            px: 3,
            fontSize: '1rem',
            minWidth: "auto",
            '&:hover': {
              backgroundColor: "rgba(59,130,246,0.25)",
              border: "1px solid rgba(59,130,246,0.55)",
            },
          }}
        >
          Refresh
        </Button>
      </Box>

      <Collapse in={showAdvancedFilters}>
        <Box
          sx={{
            mt: 0,
            p: 1,
            mb: 0,
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "12px",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: "none",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "none",
            },
            "&::after": {
              content: "none",
              position: "absolute",
              top: 0,
              left: "50%",
              width: "600px",
              height: "600px",
              background: "none",
              transform: "translateX(-50%) translateY(-50%)",
              pointerEvents: "none",
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            {/* All Filters in One Row */}
            <Box
              sx={{
                p: 2.5,
                mb: 3,
                backgroundColor: "#1a1a1a",
                borderRadius: "8px",
                border: "1px solid #2a2a2a",
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: "#a3a3a3",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  mb: 3,
                  opacity: 0.8,
                }}
              >
                Filter Options
              </Typography>
              
              <Box display="flex" gap={3} flexWrap="wrap" alignItems="flex-start">
                {/* Configuration Options */}
                <Box>
                  <Typography variant="caption" sx={{ color: "#bfbfbf", mb: 1, display: "block" }}>
                    Configuration
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 320 }}>
                  <Select
                    displayEmpty
                    multiple
                    value={(() => {
                      const values = [];
                      if (showCitations === true) values.push("showCitations-true");
                      if (showCitations === false) values.push("showCitations-false");
                      if (advancedFileAnalysis === true) values.push("advancedFileAnalysis-true");
                      if (advancedFileAnalysis === false) values.push("advancedFileAnalysis-false");
                      if (isConservative === true) values.push("isConservative-true");
                      if (isConservative === false) values.push("isConservative-false");
                      if (isFileAccessRestrictedForMembers === true) values.push("isFileAccessRestrictedForMembers-true");
                      if (isFileAccessRestrictedForMembers === false) values.push("isFileAccessRestrictedForMembers-false");
                      if (emailNotificationsDisabled === true) values.push("emailNotificationsDisabled-true");
                      if (emailNotificationsDisabled === false) values.push("emailNotificationsDisabled-false");
                      return values;
                    })()}
                    onChange={(event: SelectChangeEvent<string[]>) => {
                      const values = event.target.value as string[];
                      
                      // Reset all to undefined first
                      const citationsTrue = values.includes("showCitations-true");
                      const citationsFalse = values.includes("showCitations-false");
                      onShowCitationsChange(citationsTrue ? true : citationsFalse ? false : undefined);
                      
                      const advancedTrue = values.includes("advancedFileAnalysis-true");
                      const advancedFalse = values.includes("advancedFileAnalysis-false");
                      onAdvancedFileAnalysisChange(advancedTrue ? true : advancedFalse ? false : undefined);
                      
                      const conservativeTrue = values.includes("isConservative-true");
                      const conservativeFalse = values.includes("isConservative-false");
                      onIsConservativeChange(conservativeTrue ? true : conservativeFalse ? false : undefined);
                      
                      const restrictedTrue = values.includes("isFileAccessRestrictedForMembers-true");
                      const restrictedFalse = values.includes("isFileAccessRestrictedForMembers-false");
                      onIsFileAccessRestrictedForMembersChange(restrictedTrue ? true : restrictedFalse ? false : undefined);
                      
                      const emailDisabledTrue = values.includes("emailNotificationsDisabled-true");
                      const emailDisabledFalse = values.includes("emailNotificationsDisabled-false");
                      onEmailNotificationsDisabledChange(emailDisabledTrue ? true : emailDisabledFalse ? false : undefined);
                    }}
                    input={<OutlinedInput />}
                    renderValue={(selected) => {
                      if (!selected || (selected as string[]).length === 0) {
                        return <Typography sx={{ color: "#9ca3af" }}>Select configuration options...</Typography>;
                      }
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => {
                            const [key, state] = value.split('-');
                            const isEnabled = state === 'true';
                            const labels: Record<string, string> = {
                              showCitations: isEnabled ? "Citations ✓" : "No Citations ✗",
                              advancedFileAnalysis: isEnabled ? "Advanced ✓" : "Basic ✗",
                              isConservative: isEnabled ? "Conservative ✓" : "Not Conservative ✗",
                              isFileAccessRestrictedForMembers: isEnabled ? "Restricted ✓" : "Unrestricted ✗",
                              emailNotificationsDisabled: isEnabled ? "No Email ✓" : "Email Enabled ✗",
                            };
                            return (
                              <Chip
                                key={value}
                                label={labels[key]}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  backgroundColor: isEnabled ? 
                                    (key === "showCitations" || key === "advancedFileAnalysis" ? "rgba(34, 197, 94, 0.2)" :
                                     key === "isConservative" ? "rgba(245, 158, 11, 0.2)" :
                                     key === "isFileAccessRestrictedForMembers" || key === "emailNotificationsDisabled" ? "rgba(239, 68, 68, 0.2)" :
                                     "#1f1f1f") :
                                    "#1f1f1f",
                                  color: isEnabled ?
                                    (key === "showCitations" || key === "advancedFileAnalysis" ? "#22c55e" :
                                     key === "isConservative" ? "#f59e0b" :
                                     key === "isFileAccessRestrictedForMembers" || key === "emailNotificationsDisabled" ? "#ef4444" :
                                     "#a3a3a3") :
                                    "#a3a3a3",
                                  border: `1px solid ${isEnabled ?
                                    (key === "showCitations" || key === "advancedFileAnalysis" ? "#22c55e" :
                                     key === "isConservative" ? "#f59e0b" :
                                     key === "isFileAccessRestrictedForMembers" || key === "emailNotificationsDisabled" ? "#ef4444" :
                                     "#a3a3a3") :
                                    "#a3a3a3"}`,
                                }}
                              />
                            );
                          })}
                        </Box>
                      );
                    }}
                    sx={{
                      backgroundColor: "#1f1f1f",
                      color: "#EDEDED",
                      borderRadius: "6px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#2a2a2a",
                        transition: "all 0.2s ease",
                      },
                      "&:hover": {
                        backgroundColor: "#262626",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3a3a3a",
                        },
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#a3a3a3",
                        borderWidth: "1px",
                      },
                      "& .MuiSelect-icon": {
                        color: "#9ca3af",
                      },
                      "&:hover .MuiSelect-icon": {
                        color: "#bfbfbf",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: "#141414",
                          border: "1px solid #2a2a2a",
                          borderRadius: "6px",
                          maxHeight: 400,
                          "& .MuiMenuItem-root": {
                            color: "#EDEDED",
                            fontSize: "0.875rem",
                            py: 1,
                            "&:hover": {
                              backgroundColor: "#262626",
                            },
                            "&.Mui-selected": {
                              backgroundColor: "#232323",
                              "&:hover": {
                                backgroundColor: "#2b2b2b",
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="showCitations-true">Citations Enabled</MenuItem>
                    <MenuItem value="showCitations-false">Citations Disabled</MenuItem>
                    <MenuItem value="advancedFileAnalysis-true">Advanced File Analysis Enabled</MenuItem>
                    <MenuItem value="advancedFileAnalysis-false">Advanced File Analysis Disabled</MenuItem>
                    <MenuItem value="isConservative-true">Conservative Mode Enabled</MenuItem>
                    <MenuItem value="isConservative-false">Conservative Mode Disabled</MenuItem>
                    <MenuItem value="isFileAccessRestrictedForMembers-true">File Access Restricted</MenuItem>
                    <MenuItem value="isFileAccessRestrictedForMembers-false">File Access Unrestricted</MenuItem>
                    <MenuItem value="emailNotificationsDisabled-true">Email Notifications Disabled</MenuItem>
                    <MenuItem value="emailNotificationsDisabled-false">Email Notifications Enabled</MenuItem>
                  </Select>
                  </FormControl>
                </Box>
                
                {/* Processing Status */}
                <Box>
                  <Typography variant="caption" sx={{ color: "#bfbfbf", mb: 1, display: "block" }}>
                    Status
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 240 }}>
                  <Select
                    displayEmpty
                    multiple
                    value={processingStatus || []}
                    onChange={(event: SelectChangeEvent<WorkspaceProcessingStatus[]>) => {
                      const value = event.target.value as WorkspaceProcessingStatus[];
                      onProcessingStatusChange(value.length > 0 ? value : undefined);
                    }}
                    input={<OutlinedInput />}
                    renderValue={(selected) => {
                      if (!selected || (selected as WorkspaceProcessingStatus[]).length === 0) {
                        return <Typography sx={{ color: "#9ca3af" }}>Select status...</Typography>;
                      }
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as WorkspaceProcessingStatus[]).map((value) => (
                            <Chip
                              key={value}
                              label={value}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                backgroundColor: 
                                  value === "Completed" ? "rgba(34, 197, 94, 0.2)" :
                                  value === "Failed" ? "rgba(239, 68, 68, 0.2)" :
                                  value === "Processing" ? "rgba(245, 158, 11, 0.2)" :
                                  "#1f1f1f",
                                color:
                                  value === "Completed" ? "#22c55e" :
                                  value === "Failed" ? "#ef4444" :
                                  value === "Processing" ? "#f59e0b" :
                                  "#a3a3a3",
                                border: `1px solid ${
                                  value === "Completed" ? "#22c55e" :
                                  value === "Failed" ? "#ef4444" :
                                  value === "Processing" ? "#f59e0b" :
                                  "#a3a3a3"
                                }`,
                              }}
                            />
                          ))}
                        </Box>
                      );
                    }}
                    sx={{
                      backgroundColor: "#1f1f1f",
                      color: "#EDEDED",
                      borderRadius: "6px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#2a2a2a",
                        transition: "all 0.2s ease",
                      },
                      "&:hover": {
                        backgroundColor: "#262626",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3a3a3a",
                        },
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#a3a3a3",
                        borderWidth: "1px",
                      },
                      "& .MuiSelect-icon": {
                        color: "#9ca3af",
                      },
                      "&:hover .MuiSelect-icon": {
                        color: "#bfbfbf",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: "#141414",
                          border: "1px solid #2a2a2a",
                          borderRadius: "6px",
                          "& .MuiMenuItem-root": {
                            color: "#EDEDED",
                            fontSize: "0.875rem",
                            py: 1,
                            "&:hover": {
                              backgroundColor: "#262626",
                            },
                            "&.Mui-selected": {
                              backgroundColor: "#232323",
                              "&:hover": {
                                backgroundColor: "#2b2b2b",
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Processing">Processing</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Failed">Failed</MenuItem>
                  </Select>
                  </FormControl>
                </Box>
                
                {/* Date Range */}
                <Box>
                  <Typography variant="caption" sx={{ color: "#bfbfbf", mb: 1, display: "block" }}>
                    Created After
                  </Typography>
                  <DatePicker
                  slotProps={{
                    actionBar: {
                      actions: ['clear'],
                    },
                    textField: {
                      size: "small",
                      placeholder: "Created after...",
                      sx: {
                        "& .MuiInputBase-root": {
                          backgroundColor: "#1f1f1f",
                          color: "#EDEDED",
                          borderRadius: "6px",
                          "&:hover": {
                            backgroundColor: "#262626",
                          },
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#2a2a2a",
                          transition: "all 0.2s ease",
                        },
                        "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3a3a3a",
                        },
                        "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#a3a3a3",
                          borderWidth: "1px",
                        },
                        "& .MuiIconButton-root": {
                          color: "#9ca3af",
                          "&:hover": {
                            color: "#bfbfbf",
                          },
                        },
                        "& .MuiSvgIcon-root": {
                          color: "#9ca3af",
                        },
                      },
                    },
                  }}
                  value={createdAfter ? dayjs(createdAfter) : null}
                  onChange={(v: Dayjs | null) => onCreatedAfterChange(v ? v.toDate().toISOString() : undefined)}
                  />
                </Box>
                
                <Box>
                  <Typography variant="caption" sx={{ color: "#bfbfbf", mb: 1, display: "block" }}>
                    Created Before
                  </Typography>
                  <DatePicker
                  slotProps={{
                    actionBar: {
                      actions: ['clear'],
                    },
                    textField: {
                      size: "small",
                      placeholder: "Created before...",
                      sx: {
                        "& .MuiInputBase-root": {
                          backgroundColor: "#1f1f1f",
                          color: "#EDEDED",
                          borderRadius: "6px",
                          "&:hover": {
                            backgroundColor: "#262626",
                          },
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#2a2a2a",
                          transition: "all 0.2s ease",
                        },
                        "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3a3a3a",
                        },
                        "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#a3a3a3",
                          borderWidth: "1px",
                        },
                        "& .MuiIconButton-root": {
                          color: "#9ca3af",
                          "&:hover": {
                            color: "#bfbfbf",
                          },
                        },
                        "& .MuiSvgIcon-root": {
                          color: "#9ca3af",
                        },
                      },
                    },
                  }}
                  value={createdBefore ? dayjs(createdBefore) : null}
                  onChange={(v: Dayjs | null) => onCreatedBeforeChange(v ? v.toDate().toISOString() : undefined)}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default WorkspaceFilters;