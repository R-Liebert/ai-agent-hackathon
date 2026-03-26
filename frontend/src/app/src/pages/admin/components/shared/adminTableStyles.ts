import { SxProps, Theme } from "@mui/material/styles";
import React from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

export const getAdminTableContainerStyles = (): SxProps<Theme> => ({
  backgroundImage: "none",
  backgroundColor: "#1a1a1a",
  border: "1px solid #313131",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  overflowX: "auto",
  "&::-webkit-scrollbar": {
    height: 8,
    backgroundColor: "rgba(66, 70, 84, 0.3)",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#6a6a6a",
    borderRadius: 4,
  },
});

// Custom sort icon component that shows proper state
export const getSortIcon = (
  isActive: boolean,
  sortDirection: "asc" | "desc" | null,
  accentColor: string = "#f92a4b"
) => {
  const baseStyles = {
    marginLeft: "4px",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    fontSize: "0.75rem",
  };

  if (!isActive) {
    return React.createElement(FaSort, {
      style: {
        ...baseStyles,
        color: "#9ca3af",
        opacity: 0.6,
      }
    });
  }

  const IconComponent = sortDirection === "desc" ? FaSortDown : FaSortUp;
  return React.createElement(IconComponent, {
    style: {
      ...baseStyles,
      color: accentColor,
      opacity: 1,
      transform: "scale(1.1)",
    }
  });
};

export const getAdminTableSortHeaderStyles = (
  isActive: boolean,
  accentColor: string = "#f92a4b",
  centered: boolean = false
): SxProps<Theme> => ({
  color: isActive ? `${accentColor} !important` : "#EDEDED !important",
  fontWeight: 600,
  fontSize: "0.875rem",
  letterSpacing: "0.025em",
  textTransform: "none",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: centered ? "center" : "inherit",
  userSelect: "none",
  "&:hover": {
    color: `${accentColor} !important`,
    transform: "translateY(-1px)",
    "& .sort-icon": {
      opacity: 1,
      color: `${accentColor} !important`,
      transform: isActive ? "scale(1.15)" : "scale(1.05)",
    },
  },
  "&:active": {
    transform: "translateY(0px)",
  },
});

export const getAdminTableRowHoverStyles = (): SxProps<Theme> => ({
  "&:hover": { 
    backgroundColor: "rgba(66, 70, 84, 0.4) !important" 
  }
});

export const getAdminTableHeaderCellStyles = (): SxProps<Theme> => ({
  backgroundColor: "#171717",
  borderBottom: "2px solid #2a2a2a",
  borderRight: "1px solid #2a2a2a",
  py: 2.5,
  px: 2,
  "&:last-child": {
    borderRight: "none",
  },
});

export const getAdminTableHeaderTextStyles = (): SxProps<Theme> => ({
  color: "#EDEDED",
  fontWeight: 700,
  fontSize: "0.875rem",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  fontFamily: '"Nunito Sans", sans-serif',
});

export const getAdminTableBodyStyles = (): SxProps<Theme> => ({
  backgroundColor: "#262626",
});

export const adminTableClasses = {
  container: "!rounded-xl",
  table: "!bg-transparent",
  headerRow: "!bg-transparent",
  headerCell: "!font-body",
  bodyCell: "!font-body !text-white-100",
  hoverRow: "hover:!bg-gray-600 transition-colors duration-200",
} as const;

export const getAdminTableCellBorderStyles = (isLastRow?: boolean): SxProps<Theme> => ({
  borderColor: "#313131",
  ...(isLastRow && {
    borderBottom: "none",
  }),
});

export const getStatusChipStyles = (
  status: string,
  statusColors: Record<string, { bg: string; fg: string; border: string }>
) => {
  const colors = statusColors[status] || statusColors.default || {
    bg: "#1f1f1f",
    fg: "#a3a3a3", 
    border: "#a3a3a3"
  };
  
  return {
    backgroundColor: colors.bg,
    color: colors.fg,
    border: `1px solid ${colors.border}`,
    fontFamily: '"Nunito Sans", sans-serif',
    fontSize: "0.75rem",
    fontWeight: 600,
    "& .MuiChip-icon": {
      color: colors.fg,
    },
  };
};

// Common button styles for admin tables
export const getAdminButtonStyles = (variant: "primary" | "secondary" = "primary"): SxProps<Theme> => ({
  textTransform: "none",
  borderRadius: "9999px",
  py: 0.75,
  px: 2,
  fontSize: '0.95rem',
  ...(variant === "primary" && {
    backgroundColor: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.35)",
    color: "#60a5fa",
    '&:hover': {
      backgroundColor: "rgba(59,130,246,0.25)",
      border: "1px solid rgba(59,130,246,0.55)",
    },
    '&.Mui-disabled': {
      backgroundColor: "rgba(59,130,246,0.1)",
      border: "1px solid rgba(59,130,246,0.25)",
      color: "#60a5fa",
      opacity: 0.7,
    },
  }),
  ...(variant === "secondary" && {
    backgroundColor: "transparent",
    border: "1px solid rgba(106, 106, 106, 0.4)",
    color: "#EDEDED",
    '&:hover': {
      backgroundColor: "#262626",
      borderColor: "#3a3a3a",
      color: "#d1d5db",
    },
  }),
});