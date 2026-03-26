import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  TbThumbUp,
  TbThumbDown,
  TbQuestionMark,
  TbCheck,
  TbX,
  TbRobot,
  TbMessage,
  TbCopy,
} from "react-icons/tb";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { notificationsService } from "../../../../services/notificationsService";
import { AdminRatingSummaryDto } from "../../../../services/admin/types/adminRatings.types";
import { UserRating } from "../../../../models/message-rating.types";
import { UI_TEXT, STYLES } from "../../constants";
import { getAdminTableContainerStyles } from "../shared/adminTableStyles";

interface RatingsTableProps {
  ratings: AdminRatingSummaryDto[];
  onRatingClick: (id: string, userId: string) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalCount?: number | null;
  sortBy: "CreatedAt" | "UserRating";
  sortDescending: boolean;
  onSortChange: (field: "CreatedAt" | "UserRating", descending: boolean) => void;
}

const RatingsTable: React.FC<RatingsTableProps> = ({
  ratings,
  onRatingClick,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  totalCount,
  sortBy,
  sortDescending,
  onSortChange,
}) => {
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

  const getRatingIcon = (rating: UserRating) => {
    switch (rating) {
      case UserRating.ThumbsUp:
        return <TbThumbUp size={16} color={STYLES.SUCCESS_COLOR} />;
      case UserRating.ThumbsDown:
        return <TbThumbDown size={16} color={STYLES.ERROR_COLOR} />;
      default:
        return <TbQuestionMark size={16} color={STYLES.WARNING_COLOR} />;
    }
  };

  const getRatingLabel = (rating: UserRating): string => {
    switch (rating) {
      case UserRating.ThumbsUp:
        return UI_TEXT.THUMBS_UP;
      case UserRating.ThumbsDown:
        return UI_TEXT.THUMBS_DOWN;
      default:
        return UI_TEXT.NOT_RATED;
    }
  };

  const handleSort = (field: "CreatedAt" | "UserRating") => {
    if (sortBy === field) {
      onSortChange(field, !sortDescending);
    } else {
      onSortChange(field, true);
    }
  };

  const getSortIcon = (field: "CreatedAt" | "UserRating") => {
    if (sortBy !== field) {
      return <FaSort size={12} style={{ marginLeft: 4, opacity: 0.5 }} />;
    }
    return sortDescending ? (
      <FaSortDown size={12} style={{ marginLeft: 4, color: "#60a5fa" }} />
    ) : (
      <FaSortUp size={12} style={{ marginLeft: 4, color: "#60a5fa" }} />
    );
  };

  const copyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        notificationsService.success(`${label} copied`);
      }).catch(() => {});
    }
  };

  if (ratings.length === 0 && !isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          px: 4,
          backgroundColor: "#1a1a1a",
          borderRadius: 2,
          border: "1px solid #3A3A3D",
        }}
      >
        <TbMessage size={48} style={{ color: "#6a6a6a", marginBottom: 16 }} />
        <Typography variant="h6" sx={{ color: "#EDEDED", mb: 1 }}>
          {UI_TEXT.NO_RATINGS}
        </Typography>
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          No ratings match the current filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Results count */}
      {totalCount !== undefined && totalCount !== null && (
        <Typography variant="body2" sx={{ color: "#9ca3af", mb: 2 }}>
          Showing {ratings.length} of {totalCount} ratings
        </Typography>
      )}

      <TableContainer component={Paper} sx={getAdminTableContainerStyles()}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: "#171717",
                  borderBottom: "2px solid #2a2a2a",
                  borderRight: "1px solid #2a2a2a",
                  py: 2.5,
                  px: 2,
                  cursor: "pointer",
                  color: sortBy === "CreatedAt" ? "#60a5fa" : "#EDEDED",
                  "&:hover": { color: "#60a5fa" },
                }}
                onClick={() => handleSort("CreatedAt")}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Date
                  </Typography>
                  {getSortIcon("CreatedAt")}
                </Box>
              </TableCell>
              <TableCell sx={{ backgroundColor: "#171717", borderBottom: "2px solid #2a2a2a", borderRight: "1px solid #2a2a2a", py: 2.5, px: 2 }}>
                <Typography sx={{ color: "#EDEDED", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  User ID
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "#171717",
                  borderBottom: "2px solid #2a2a2a",
                  borderRight: "1px solid #2a2a2a",
                  py: 2.5,
                  px: 2,
                  cursor: "pointer",
                  color: sortBy === "UserRating" ? "#60a5fa" : "#EDEDED",
                  "&:hover": { color: "#60a5fa" },
                }}
                onClick={() => handleSort("UserRating")}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Rating
                  </Typography>
                  {getSortIcon("UserRating")}
                </Box>
              </TableCell>
              <TableCell sx={{ backgroundColor: "#171717", borderBottom: "2px solid #2a2a2a", borderRight: "1px solid #2a2a2a", py: 2.5, px: 2 }}>
                <Typography sx={{ color: "#EDEDED", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Consent
                </Typography>
              </TableCell>
              <TableCell sx={{ backgroundColor: "#171717", borderBottom: "2px solid #2a2a2a", py: 2.5, px: 2 }}>
                <Typography sx={{ color: "#EDEDED", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Agent
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ratings.map((rating, index) => (
              <TableRow
                key={rating.id}
                onClick={() => onRatingClick(rating.id, rating.userId)}
                sx={{
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "rgba(66, 70, 84, 0.4)" },
                  borderColor: "#313131",
                  ...(index === ratings.length - 1 && { borderBottom: "none" }),
                }}
              >
                <TableCell sx={{ borderBottom: "1px solid #2a2a2a", py: 1.5 }}>
                  <Typography sx={{ color: "#EDEDED", fontSize: "0.9rem" }}>
                    {formatDate(rating.createdDate)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderBottom: "1px solid #2a2a2a", py: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        color: "#bfbfbf",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {rating.userId.length > 20
                        ? `${rating.userId.substring(0, 20)}...`
                        : rating.userId}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => copyToClipboard(rating.userId, "User ID", e)}
                      sx={{
                        color: "#6a6a6a",
                        p: 0.5,
                        "&:hover": {
                          color: "#EDEDED",
                          backgroundColor: "rgba(255,255,255,0.08)",
                        },
                      }}
                    >
                      <TbCopy size={16} />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell sx={{ borderBottom: "1px solid #2a2a2a", py: 1.5 }}>
                  <Chip
                    icon={getRatingIcon(rating.userRating)}
                    label={getRatingLabel(rating.userRating)}
                    size="small"
                    sx={{
                      height: 28,
                      backgroundColor:
                        rating.userRating === UserRating.ThumbsUp
                          ? "rgba(34, 197, 94, 0.15)"
                          : rating.userRating === UserRating.ThumbsDown
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(245, 158, 11, 0.15)",
                      border: `1px solid ${
                        rating.userRating === UserRating.ThumbsUp
                          ? "rgba(34, 197, 94, 0.3)"
                          : rating.userRating === UserRating.ThumbsDown
                          ? "rgba(239, 68, 68, 0.3)"
                          : "rgba(245, 158, 11, 0.3)"
                      }`,
                      color:
                        rating.userRating === UserRating.ThumbsUp
                          ? "#22c55e"
                          : rating.userRating === UserRating.ThumbsDown
                          ? "#ef4444"
                          : "#f59e0b",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      "& .MuiChip-icon": { marginLeft: "6px" },
                      "& .MuiChip-label": { paddingRight: "10px" },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ borderBottom: "1px solid #2a2a2a", py: 1.5 }}>
                  <Chip
                    icon={
                      rating.consent ? (
                        <TbCheck size={14} color="#22c55e" />
                      ) : (
                        <TbX size={14} color="#ef4444" />
                      )
                    }
                    label={rating.consent ? "Yes" : "No"}
                    size="small"
                    sx={{
                      height: 28,
                      backgroundColor: rating.consent
                        ? "rgba(34, 197, 94, 0.15)"
                        : "rgba(239, 68, 68, 0.15)",
                      border: `1px solid ${
                        rating.consent
                          ? "rgba(34, 197, 94, 0.3)"
                          : "rgba(239, 68, 68, 0.3)"
                      }`,
                      color: rating.consent ? "#22c55e" : "#ef4444",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      "& .MuiChip-icon": { marginLeft: "6px" },
                      "& .MuiChip-label": { paddingRight: "10px" },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ borderBottom: "1px solid #2a2a2a", py: 1.5 }}>
                  {rating.generatedByAgent ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TbRobot size={18} color="#60a5fa" />
                      <Typography sx={{ color: "#EDEDED", fontSize: "0.9rem" }}>
                        {rating.agentName || "Agent"}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography sx={{ color: "#6a6a6a", fontSize: "0.9rem" }}>
                      —
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Load More Button */}
      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            variant="outlined"
            size="medium"
            onClick={onLoadMore}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : undefined}
            sx={{
              textTransform: "none",
              borderRadius: "9999px",
              backgroundColor: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.35)",
              color: "#60a5fa",
              py: 1,
              px: 4,
              fontSize: "0.95rem",
              "&:hover": {
                backgroundColor: "rgba(59,130,246,0.25)",
                border: "1px solid rgba(59,130,246,0.55)",
              },
              "&.Mui-disabled": {
                backgroundColor: "#1f1f1f",
                borderColor: "#2a2a2a",
                color: "#6a6a6a",
              },
            }}
          >
            {isLoading ? "Loading..." : UI_TEXT.LOAD_MORE}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RatingsTable;
