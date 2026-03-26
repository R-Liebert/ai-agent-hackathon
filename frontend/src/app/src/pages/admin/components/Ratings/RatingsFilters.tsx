import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Collapse,
  Chip,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  TbRefresh,
  TbFilter,
  TbChevronDown,
  TbChevronUp,
  TbX,
} from "react-icons/tb";
import { UserRating } from "../../../../models/message-rating.types";
import { UI_TEXT } from "../../constants";

interface RatingsFiltersProps {
  createdAfter?: string;
  onCreatedAfterChange: (value: string | undefined) => void;
  createdBefore?: string;
  onCreatedBeforeChange: (value: string | undefined) => void;
  ratingType?: UserRating;
  onRatingTypeChange: (value: UserRating | undefined) => void;
  consent?: boolean;
  onConsentChange: (value: boolean | undefined) => void;
  generatedByAgent?: boolean;
  onGeneratedByAgentChange: (value: boolean | undefined) => void;
  agentName?: string;
  onAgentNameChange: (value: string | undefined) => void;
  userId?: string;
  onUserIdChange: (value: string | undefined) => void;
  onRefresh: () => void;
}

const RatingsFilters: React.FC<RatingsFiltersProps> = ({
  createdAfter,
  onCreatedAfterChange,
  createdBefore,
  onCreatedBeforeChange,
  ratingType,
  onRatingTypeChange,
  consent,
  onConsentChange,
  generatedByAgent,
  onGeneratedByAgentChange,
  agentName,
  onAgentNameChange,
  userId,
  onUserIdChange,
  onRefresh,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = [
    createdAfter,
    createdBefore,
    ratingType !== undefined,
    consent !== undefined,
    generatedByAgent !== undefined,
    agentName,
    userId,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onCreatedAfterChange(undefined);
    onCreatedBeforeChange(undefined);
    onRatingTypeChange(undefined);
    onConsentChange(undefined);
    onGeneratedByAgentChange(undefined);
    onAgentNameChange(undefined);
    onUserIdChange(undefined);
  };

  // Consistent select styling matching workspace filters
  const selectStyles = {
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
  };

  const menuProps = {
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
  };

  const datePickerStyles = {
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
    "& .MuiInputLabel-root": {
      color: "#9ca3af",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#a3a3a3",
    },
  };

  const textFieldStyles = {
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
    "& .MuiInputLabel-root": {
      color: "#9ca3af",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#a3a3a3",
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ mb: 3 }}>
        {/* Main Filter Bar */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            mb: 2,
          }}
        >
          {/* Rating Type Filter */}
          <Box>
            <Typography variant="caption" sx={{ color: "#9ca3af", mb: 0.5, display: "block" }}>
              Rating
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                displayEmpty
                value={ratingType ?? ""}
                onChange={(e) =>
                  onRatingTypeChange(
                    e.target.value === "" ? undefined : (Number(e.target.value) as UserRating)
                  )
                }
                sx={selectStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={UserRating.ThumbsUp}>{UI_TEXT.THUMBS_UP}</MenuItem>
                <MenuItem value={UserRating.ThumbsDown}>{UI_TEXT.THUMBS_DOWN}</MenuItem>
                <MenuItem value={UserRating.NotRated}>{UI_TEXT.NOT_RATED}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Consent Filter */}
          <Box>
            <Typography variant="caption" sx={{ color: "#9ca3af", mb: 0.5, display: "block" }}>
              Consent
            </Typography>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                displayEmpty
                value={consent === undefined ? "" : consent ? "true" : "false"}
                onChange={(e) =>
                  onConsentChange(
                    e.target.value === "" ? undefined : e.target.value === "true"
                  )
                }
                sx={selectStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">{UI_TEXT.CONSENTED}</MenuItem>
                <MenuItem value="false">{UI_TEXT.NO_CONSENT}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Agent Filter */}
          <Box>
            <Typography variant="caption" sx={{ color: "#9ca3af", mb: 0.5, display: "block" }}>
              Agent
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                displayEmpty
                value={generatedByAgent === undefined ? "" : generatedByAgent ? "true" : "false"}
                onChange={(e) =>
                  onGeneratedByAgentChange(
                    e.target.value === "" ? undefined : e.target.value === "true"
                  )
                }
                sx={selectStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="false">None</MenuItem>
                <MenuItem value="true">Any Agent</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Advanced Filters Toggle */}
          <Button
            variant="text"
            size="medium"
            startIcon={showAdvanced ? <TbChevronUp size={18} /> : <TbChevronDown size={18} />}
            endIcon={
              activeFilterCount > 0 && (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  sx={{
                    height: 24,
                    backgroundColor: "#1f1f1f",
                    color: "#bfbfbf",
                    fontSize: "0.8rem",
                    border: "1px solid #2a2a2a",
                    borderRadius: "9999px",
                    "& .MuiChip-label": {
                      px: 1.5,
                    },
                  }}
                />
              )
            }
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{
              color: activeFilterCount > 0 ? "#bfbfbf" : "#EDEDED",
              textTransform: "none",
              fontSize: "0.95rem",
              py: 1,
              px: 2,
              "&:hover": {
                backgroundColor: "#262626",
              },
            }}
          >
            <TbFilter className="mr-1" size={16} />
            Advanced
          </Button>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="text"
              size="medium"
              startIcon={<TbX size={16} />}
              onClick={handleClearFilters}
              sx={{
                color: "#9ca3af",
                textTransform: "none",
                minWidth: "auto",
                px: 2,
                py: 1,
                fontSize: "0.95rem",
                "&:hover": {
                  backgroundColor: "#262626",
                  color: "#d1d5db",
                },
              }}
            >
              Clear
            </Button>
          )}

          {/* Refresh Button */}
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
              fontSize: "0.95rem",
              minWidth: "auto",
              "&:hover": {
                backgroundColor: "rgba(59,130,246,0.25)",
                border: "1px solid rgba(59,130,246,0.55)",
              },
            }}
          >
            Refresh
          </Button>
        </Box>

        {/* Advanced Filters Panel */}
        <Collapse in={showAdvanced}>
          <Box
            sx={{
              p: 2.5,
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
                mb: 2.5,
                opacity: 0.8,
              }}
            >
              Additional Filters
            </Typography>

            <Box display="flex" gap={3} flexWrap="wrap" alignItems="flex-start">
              {/* Date Range */}
              <Box>
                <Typography variant="caption" sx={{ color: "#bfbfbf", mb: 1, display: "block" }}>
                  Created After
                </Typography>
                <DatePicker
                  value={createdAfter ? dayjs(createdAfter) : null}
                  onChange={(date: Dayjs | null) =>
                    onCreatedAfterChange(date ? date.toISOString() : undefined)
                  }
                  slotProps={{
                    actionBar: { actions: ["clear"] },
                    textField: {
                      size: "small",
                      placeholder: "Select date...",
                      sx: datePickerStyles,
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: "#bfbfbf", mb: 1, display: "block" }}>
                  Created Before
                </Typography>
                <DatePicker
                  value={createdBefore ? dayjs(createdBefore) : null}
                  onChange={(date: Dayjs | null) =>
                    onCreatedBeforeChange(date ? date.toISOString() : undefined)
                  }
                  slotProps={{
                    actionBar: { actions: ["clear"] },
                    textField: {
                      size: "small",
                      placeholder: "Select date...",
                      sx: datePickerStyles,
                    },
                  }}
                />
              </Box>

              {/* User ID Filter */}
              <Box>
                <Typography variant="caption" sx={{ color: "#bfbfbf", mb: 1, display: "block" }}>
                  User ID
                </Typography>
                <TextField
                  size="small"
                  placeholder="Filter by user..."
                  value={userId || ""}
                  onChange={(e) => onUserIdChange(e.target.value || undefined)}
                  sx={{ ...textFieldStyles, minWidth: 180 }}
                />
              </Box>

              {/* Agent Name Filter */}
              <Box>
                <Typography variant="caption" sx={{ color: "#bfbfbf", mb: 1, display: "block" }}>
                  Agent Name
                </Typography>
                <TextField
                  size="small"
                  placeholder="Exact agent name (case-insensitive)"
                  value={agentName || ""}
                  onChange={(e) => {
                    const nextValue = e.target.value.trim();
                    onAgentNameChange(nextValue ? nextValue : undefined);
                  }}
                  sx={{ ...textFieldStyles, minWidth: 180 }}
                />
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </LocalizationProvider>
  );
};

export default RatingsFilters;
