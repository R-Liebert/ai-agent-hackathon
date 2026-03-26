import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Collapse,
  Checkbox,
  FormControlLabel,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  TbDownload,
  TbChevronDown,
  TbChevronUp,
  TbFileSpreadsheet,
  TbInfoCircle,
  TbFileTypeCsv,
  TbFileTypeXls,
} from "react-icons/tb";

export type ExportFormat = "csv" | "excel";

interface ExportRatingsPanelProps {
  onExport: (params: ExportParams) => void;
  isExporting: boolean;
}

export interface ExportParams {
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
  includeContent: boolean;
}

const ExportRatingsPanel: React.FC<ExportRatingsPanelProps> = ({
  onExport,
  isExporting,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [includeContent, setIncludeContent] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const validateDates = useCallback(
    (start: Dayjs | null, end: Dayjs | null): boolean => {
      if (start && end && start.isAfter(end)) {
        setDateError("Start date must be before end date");
        return false;
      }
      setDateError(null);
      return true;
    },
    []
  );

  const handleStartDateChange = (date: Dayjs | null) => {
    setStartDate(date);
    validateDates(date, endDate);
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setEndDate(date);
    validateDates(startDate, date);
  };

  const handleFormatChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFormat: ExportFormat | null
  ) => {
    if (newFormat !== null) {
      setFormat(newFormat);
    }
  };

  const handleExport = () => {
    if (!validateDates(startDate, endDate)) return;

    onExport({
      format,
      startDate: startDate ? startDate.startOf("day").toISOString() : undefined,
      endDate: endDate ? endDate.endOf("day").toISOString() : undefined,
      includeContent,
    });
  };

  const handleClearDates = () => {
    setStartDate(null);
    setEndDate(null);
    setDateError(null);
  };

  const hasDateRange = startDate || endDate;

  const datePickerStyles = {
    width: 180,
    "& .MuiInputBase-root": {
      backgroundColor: "#1f1f1f",
      color: "#EDEDED",
      borderRadius: "6px",
      fontSize: "0.875rem",
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
      borderColor: "#60a5fa",
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
      fontSize: "1.1rem",
    },
    "& .MuiInputLabel-root": {
      color: "#9ca3af",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#60a5fa",
    },
  };

  const toggleButtonStyles = {
    color: "#9ca3af",
    borderColor: "#2a2a2a",
    textTransform: "none",
    fontSize: "0.85rem",
    px: 2,
    py: 0.75,
    "&:hover": {
      backgroundColor: "#262626",
      borderColor: "#3a3a3a",
    },
    "&.Mui-selected": {
      backgroundColor: "rgba(59, 130, 246, 0.15)",
      borderColor: "rgba(59, 130, 246, 0.4)",
      color: "#60a5fa",
      "&:hover": {
        backgroundColor: "rgba(59, 130, 246, 0.25)",
      },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          mb: 3,
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* Header - Always visible */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 2,
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            "&:hover": {
              backgroundColor: "#1f1f1f",
            },
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <TbFileSpreadsheet size={20} className="text-blue-400" />
            <Typography
              sx={{
                color: "#EDEDED",
                fontWeight: 500,
                fontSize: "0.95rem",
              }}
            >
              Export Ratings
            </Typography>
            <Typography
              sx={{
                color: "#6a6a6a",
                fontSize: "0.85rem",
                ml: 1,
              }}
            >
              Download message ratings as CSV or Excel
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isExpanded ? (
              <TbChevronUp size={18} className="text-gray-400" />
            ) : (
              <TbChevronDown size={18} className="text-gray-400" />
            )}
          </Box>
        </Box>

        {/* Expandable Content */}
        <Collapse in={isExpanded}>
          <Box
            sx={{
              px: 2.5,
              pb: 2.5,
              pt: 1,
              borderTop: "1px solid #2a2a2a",
            }}
          >
            {/* Info text */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                mb: 3,
                p: 1.5,
                backgroundColor: "rgba(59, 130, 246, 0.08)",
                borderRadius: "6px",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <TbInfoCircle
                size={16}
                className="text-blue-400 mt-0.5 flex-shrink-0"
              />
              <Typography
                sx={{
                  color: "#9ca3af",
                  fontSize: "0.8rem",
                  lineHeight: 1.5,
                }}
              >
                Export message ratings data. Optionally specify a date range to
                filter the export. Leave dates empty to export all ratings.
                Large exports may take some time to process.
              </Typography>
            </Box>

            {/* Format Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  color: "#a3a3a3",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  mb: 1.5,
                }}
              >
                Export Format
              </Typography>

              <ToggleButtonGroup
                value={format}
                exclusive
                onChange={handleFormatChange}
                aria-label="export format"
                size="small"
              >
                <ToggleButton value="csv" aria-label="CSV" sx={toggleButtonStyles}>
                  <TbFileTypeCsv size={18} className="mr-1.5" />
                  CSV
                </ToggleButton>
                <ToggleButton value="excel" aria-label="Excel" sx={toggleButtonStyles}>
                  <TbFileTypeXls size={18} className="mr-1.5" />
                  Excel
                </ToggleButton>
              </ToggleButtonGroup>

              <Typography
                sx={{
                  color: "#6a6a6a",
                  fontSize: "0.75rem",
                  mt: 1,
                }}
              >
                {format === "csv"
                  ? "Lightweight format, easy to process programmatically"
                  : "Rich formatting, opens directly in Excel"}
              </Typography>
            </Box>

            {/* Date Range Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  color: "#a3a3a3",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  mb: 2,
                }}
              >
                Date Range (Optional)
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#bfbfbf", mb: 0.5, display: "block" }}
                  >
                    From
                  </Typography>
                  <DatePicker
                    value={startDate}
                    onChange={handleStartDateChange}
                    maxDate={endDate || undefined}
                    slotProps={{
                      actionBar: { actions: ["clear"] },
                      textField: {
                        size: "small",
                        placeholder: "Start date",
                        sx: datePickerStyles,
                        error: !!dateError,
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    pt: 3.5,
                    color: "#6a6a6a",
                  }}
                >
                  <Typography sx={{ fontSize: "0.85rem" }}>to</Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#bfbfbf", mb: 0.5, display: "block" }}
                  >
                    To
                  </Typography>
                  <DatePicker
                    value={endDate}
                    onChange={handleEndDateChange}
                    minDate={startDate || undefined}
                    slotProps={{
                      actionBar: { actions: ["clear"] },
                      textField: {
                        size: "small",
                        placeholder: "End date",
                        sx: datePickerStyles,
                        error: !!dateError,
                      },
                    }}
                  />
                </Box>

                {hasDateRange && (
                  <Box sx={{ pt: 3 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleClearDates}
                      sx={{
                        color: "#9ca3af",
                        textTransform: "none",
                        fontSize: "0.8rem",
                        minWidth: "auto",
                        px: 1.5,
                        "&:hover": {
                          backgroundColor: "#262626",
                          color: "#bfbfbf",
                        },
                      }}
                    >
                      Clear dates
                    </Button>
                  </Box>
                )}
              </Box>

              {dateError && (
                <Typography
                  sx={{
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    mt: 1,
                  }}
                >
                  {dateError}
                </Typography>
              )}
            </Box>

            {/* Options */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  color: "#a3a3a3",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  mb: 1.5,
                }}
              >
                Options
              </Typography>

              <Tooltip
                title="Include the full message content in the export. This may significantly increase the file size and export time."
                placement="right"
                arrow
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeContent}
                      onChange={(e) => setIncludeContent(e.target.checked)}
                      size="small"
                      sx={{
                        color: "#6a6a6a",
                        "&.Mui-checked": {
                          color: "#60a5fa",
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography
                        sx={{
                          color: "#EDEDED",
                          fontSize: "0.875rem",
                        }}
                      >
                        Include message content
                      </Typography>
                      <Typography
                        sx={{
                          color: "#6a6a6a",
                          fontSize: "0.75rem",
                        }}
                      >
                        Export will include full message text (larger file size)
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: "flex-start", ml: 0 }}
                />
              </Tooltip>
            </Box>

            {/* Export Button */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                pt: 2,
                borderTop: "1px solid #2a2a2a",
              }}
            >
              <Button
                variant="contained"
                onClick={handleExport}
                disabled={isExporting || !!dateError}
                startIcon={
                  isExporting ? (
                    <CircularProgress size={16} sx={{ color: "inherit" }} />
                  ) : (
                    <TbDownload size={18} />
                  )
                }
                sx={{
                  textTransform: "none",
                  borderRadius: "6px",
                  backgroundColor: "#60a5fa",
                  color: "#000",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  py: 1,
                  px: 3,
                  "&:hover": {
                    backgroundColor: "#3b82f6",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "#2a2a2a",
                    color: "#6a6a6a",
                  },
                }}
              >
                {isExporting
                  ? "Exporting..."
                  : `Export to ${format === "csv" ? "CSV" : "Excel"}`}
              </Button>

              {/* Summary text */}
              <Typography
                sx={{
                  color: "#6a6a6a",
                  fontSize: "0.8rem",
                }}
              >
                {startDate || endDate ? (
                  <>
                    Exporting ratings
                    {startDate && ` from ${startDate.format("MMM D, YYYY")}`}
                    {endDate && ` to ${endDate.format("MMM D, YYYY")}`}
                  </>
                ) : (
                  "Exporting all ratings"
                )}
                {includeContent && " (with content)"}
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </LocalizationProvider>
  );
};

export default ExportRatingsPanel;
