import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import { TbTrash, TbRefresh, TbAlertTriangle, TbClock } from "react-icons/tb";
import { RetryState } from "../../../../models/subscription-models";
import { formatDateTime } from "../Workspaces/utils";
import Tooltip from "../../../../components/Global/Tooltip";

interface PendingRetriesTableProps {
  retries: RetryState[];
  loading?: boolean;
  onClearRetry?: (subscriptionId: string, resource: string) => void;
  onRetryNow?: (subscriptionId: string, resource: string) => void;
  isDeleting?: boolean;
  isRetrying?: boolean;
}

const PendingRetriesTable: React.FC<PendingRetriesTableProps> = ({
  retries,
  loading,
  onClearRetry,
  onRetryNow,
  isDeleting,
  isRetrying,
}) => {
  const getRetryCountChipColor = (count: number) => {
    if (count <= 2) return { bg: "#977A24", color: "#EDEDED" }; // warning
    if (count <= 4) return { bg: "#A6363D", color: "#EDEDED" }; // error
    return { bg: "#424242", color: "#EDEDED" }; // default
  };

  // Use shared formatter

  if (loading) {
    return (
      <Box sx={{ width: "100%" }}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  if (retries.length === 0) {
    return (
      <Paper
        className="!bg-transparent !border-2 !border-gray-500 !shadow-none"
        sx={{
          p: 4,
          textAlign: "center",
          backgroundImage: "none",
        }}
      >
        <TbClock size={48} className="text-gray-300 mb-4" />
        <Typography
          variant="h6"
          className="!text-white-100 !font-body"
          gutterBottom
        >
          No pending retries
        </Typography>
        <Typography variant="body2" className="!text-gray-300 !font-body">
          All subscriptions are healthy or have been processed successfully.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      className="!bg-transparent !border-2 !border-gray-500 !shadow-none !rounded-xl"
      sx={{
        maxHeight: 400,
        overflowX: "auto",
        backgroundImage: "none",
      }}
    >
      <Table
        stickyHeader
        size="small"
        className="!bg-transparent"
        sx={{ minWidth: 800 }}
      >
        <TableHead>
          <TableRow className="!bg-gray-600">
            <TableCell
              className="!font-body !font-semibold !text-white-100 !border-gray-500"
              sx={{ minWidth: 120 }}
            >
              Subscription ID
            </TableCell>
            <TableCell
              className="!font-body !font-semibold !text-white-100 !border-gray-500"
              sx={{ minWidth: 200 }}
            >
              Resource
            </TableCell>
            <TableCell
              className="!font-body !font-semibold !text-white-100 !border-gray-500"
              sx={{ minWidth: 100 }}
            >
              Retry Count
            </TableCell>
            <TableCell
              className="!font-body !font-semibold !text-white-100 !border-gray-500"
              sx={{ minWidth: 140 }}
            >
              Next Retry
            </TableCell>
            <TableCell
              className="!font-body !font-semibold !text-white-100 !border-gray-500"
              sx={{ minWidth: 200 }}
            >
              Failure Reason
            </TableCell>
            <TableCell
              className="!font-body !font-semibold !text-white-100 !border-gray-500"
              sx={{ minWidth: 100 }}
            >
              Status
            </TableCell>
            <TableCell
              align="right"
              className="!font-body !font-semibold !text-white-100 !border-gray-500"
              sx={{ minWidth: 120 }}
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {retries.map((retry) => (
            <TableRow
              key={retry.subscriptionId}
              className="hover:!bg-gray-600 transition-colors duration-200"
              sx={{
                opacity: isDeleting || isRetrying ? 0.5 : 1,
              }}
            >
              <TableCell className="!font-body !text-white-100 !border-gray-500">
                <Typography
                  variant="body2"
                  className="!font-mono !text-white-100"
                >
                  {retry.subscriptionId.substring(0, 8)}...
                </Typography>
              </TableCell>
              <TableCell className="!font-body !text-white-100 !border-gray-500">
                <Tooltip text={retry.resource} useMui>
                  <Typography
                    variant="body2"
                    className="!text-white-100 !font-body"
                    sx={{
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {retry.resource}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell className="!font-body !text-white-100 !border-gray-500">
                <Chip
                  label={retry.retryCount}
                  size="small"
                  sx={{
                    backgroundColor: getRetryCountChipColor(retry.retryCount)
                      .bg,
                    color: getRetryCountChipColor(retry.retryCount).color,
                    fontWeight: 600,
                  }}
                />
              </TableCell>
              <TableCell className="!font-body !text-white-100 !border-gray-500">
                {formatDateTime(retry.nextRetryAt)}
              </TableCell>
              <TableCell className="!font-body !text-white-100 !border-gray-500">
                <Typography
                  variant="body2"
                  className="!text-white-100 !font-body"
                  sx={{
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {retry.lastFailureReason}
                </Typography>
              </TableCell>
              <TableCell className="!font-body !text-white-100 !border-gray-500">
                {retry.isOverdue ? (
                  <Chip
                    icon={<TbAlertTriangle />}
                    label="Overdue"
                    size="small"
                    sx={{
                      backgroundColor: "#A6363D",
                      color: "#EDEDED",
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  <Chip
                    label="Scheduled"
                    size="small"
                    sx={{
                      backgroundColor: "#424242",
                      color: "#EDEDED",
                      fontWeight: 600,
                    }}
                  />
                )}
              </TableCell>
              <TableCell
                align="right"
                className="!font-body !text-white-100 !border-gray-500"
              >
                <Tooltip text="Retry Now" useMui>
                  <IconButton
                    size="small"
                    onClick={() =>
                      onRetryNow?.(retry.subscriptionId, retry.resource)
                    }
                    disabled={!onRetryNow || isRetrying || isDeleting}
                  >
                    <TbRefresh />
                  </IconButton>
                </Tooltip>
                <Tooltip text="Clear Retry State" useMui>
                  <IconButton
                    size="small"
                    onClick={() =>
                      onClearRetry?.(retry.subscriptionId, retry.resource)
                    }
                    disabled={!onClearRetry || isDeleting || isRetrying}
                    color="error"
                  >
                    <TbTrash />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PendingRetriesTable;
