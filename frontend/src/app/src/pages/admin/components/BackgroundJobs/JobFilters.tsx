import React, { useState, useId } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  TbFilter,
  TbRefresh,
  TbX,
  TbChevronDown,
  TbChevronUp,
} from "react-icons/tb";
import Tooltip from "../../../../components/Global/Tooltip";

interface JobFiltersProps {
  jobName: string;
  onJobNameChange: (value: string) => void;
  jobType: string;
  onJobTypeChange: (value: string) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  onClear: () => void;
  onRefresh: () => void;
  activeFilterCount: number;
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
  "& .MuiInputAdornment-root": {
    color: "#9ca3af",
  },
};

const focusVisibleStyles = {
  "&:focus-visible": {
    outline: "2px solid rgba(96, 165, 250, 0.7)",
    outlineOffset: 2,
  },
};

const JobFilters: React.FC<JobFiltersProps> = ({
  jobName,
  onJobNameChange,
  jobType,
  onJobTypeChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  onClear,
  onRefresh,
  activeFilterCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const filterPanelId = useId();
  const filterDescriptionId = useId();

  // Build active filters description for screen readers
  const getActiveFiltersDescription = (): string => {
    const filters: string[] = [];
    if (jobName) filters.push(`job name: ${jobName}`);
    if (jobType) filters.push(`job type: ${jobType}`);
    if (fromDate) filters.push(`from: ${new Date(fromDate).toLocaleDateString()}`);
    if (toDate) filters.push(`to: ${new Date(toDate).toLocaleDateString()}`);
    return filters.length > 0
      ? `Active filters: ${filters.join(", ")}`
      : "No active filters";
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 3,
        backgroundColor: "#1a1a1a",
        border: "1px solid #313131",
        borderRadius: 2,
      }}
      role="search"
      aria-label="Job filters"
    >
      {/* Hidden description for screen readers */}
      <span id={filterDescriptionId} className="sr-only">
        {getActiveFiltersDescription()}
      </span>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={showAdvanced ? 2 : 0}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <TbFilter size={20} color="#9ca3af" aria-hidden="true" />
          <Typography
            component="span"
            sx={{ color: "#EDEDED", fontWeight: 500 }}
            id={`${filterPanelId}-label`}
          >
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Tooltip
              text={getActiveFiltersDescription()}
              placement="top"
              useMui
            >
              <Chip
                label={activeFilterCount}
                size="small"
                aria-label={`${activeFilterCount} active filters`}
                sx={{
                  backgroundColor: "#60a5fa",
                  color: "#fff",
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "help",
                }}
              />
            </Tooltip>
          )}
        </Box>

        <Box display="flex" gap={1} role="group" aria-label="Filter actions">
          <Button
            size="small"
            startIcon={<TbRefresh size={16} aria-hidden="true" />}
            onClick={onRefresh}
            aria-label="Refresh job list"
            sx={{
              textTransform: "none",
              color: "#60a5fa",
              "&:hover": {
                backgroundColor: "rgba(96, 165, 250, 0.1)",
              },
              ...focusVisibleStyles,
            }}
          >
            Refresh
          </Button>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              startIcon={<TbX size={16} aria-hidden="true" />}
              onClick={onClear}
              aria-label="Clear all filters"
              sx={{
                textTransform: "none",
                color: "#9ca3af",
                "&:hover": {
                  backgroundColor: "rgba(156, 163, 175, 0.1)",
                },
                ...focusVisibleStyles,
              }}
            >
              Clear
            </Button>
          )}
          <Tooltip
            text={showAdvanced ? "Collapse filters" : "Expand filters"}
            placement="top"
            useMui
          >
            <IconButton
              size="small"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
              aria-controls={filterPanelId}
              aria-label={showAdvanced ? "Collapse filter panel" : "Expand filter panel"}
              sx={{
                color: "#9ca3af",
                "&:hover": {
                  backgroundColor: "rgba(156, 163, 175, 0.1)",
                },
                ...focusVisibleStyles,
              }}
            >
              {showAdvanced ? (
                <TbChevronUp size={18} aria-hidden="true" />
              ) : (
                <TbChevronDown size={18} aria-hidden="true" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Collapse in={showAdvanced}>
        <Box
          id={filterPanelId}
          role="group"
          aria-labelledby={`${filterPanelId}-label`}
          aria-describedby={filterDescriptionId}
          display="grid"
          gridTemplateColumns={{
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr 1fr",
          }}
          gap={2}
        >
          <TextField
            label="Job Name"
            value={jobName}
            onChange={(e) => onJobNameChange(e.target.value)}
            placeholder="Search by job name..."
            size="small"
            fullWidth
            inputProps={{
              "aria-label": "Filter by job name",
            }}
            sx={textFieldStyles}
          />
          <TextField
            label="Job Type"
            value={jobType}
            onChange={(e) => onJobTypeChange(e.target.value)}
            placeholder="Search by job type..."
            size="small"
            fullWidth
            inputProps={{
              "aria-label": "Filter by job type",
            }}
            sx={textFieldStyles}
          />
          <TextField
            label="From Date"
            type="datetime-local"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              "aria-label": "Filter from date",
            }}
            sx={textFieldStyles}
          />
          <TextField
            label="To Date"
            type="datetime-local"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              "aria-label": "Filter to date",
            }}
            sx={textFieldStyles}
          />
        </Box>
      </Collapse>
    </Paper>
  );
};

export default JobFilters;
