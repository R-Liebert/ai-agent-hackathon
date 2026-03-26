import React, { memo, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  Avatar,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { FiMoreHorizontal } from "react-icons/fi";
import {
  TbClock,
  TbGraph,
  TbAlertCircle,
  TbCheck,
  TbX,
  TbRefresh,
  TbFolder,
  TbDatabase,
  TbFiles,
  TbBrandOffice,
  TbLink,
} from "react-icons/tb";
import { NotificationSubscription } from "../../../models/subscription-models";
import { getDatePartsWithUrgency, formatDateTime } from "./Workspaces/utils";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";
import CopyIconButton from "../../../components/Global/CopyIconButton";
import {
  getAdminTableContainerStyles,
  getAdminTableSortHeaderStyles,
  getSortIcon,
  getAdminTableRowHoverStyles,
  getAdminTableHeaderCellStyles,
  getAdminTableHeaderTextStyles,
  getAdminTableCellBorderStyles,
  adminTableClasses,
} from "./shared/adminTableStyles";
import Tooltip from "../../../components/Global/Tooltip";

interface SubscriptionTableProps {
  subscriptions: NotificationSubscription[];
  onShowOptions: (
    event: React.MouseEvent<HTMLButtonElement>,
    subscriptionId: string
  ) => void;
  refreshButton?: React.ReactNode;
  renewAllButton?: React.ReactNode;
}

type SortField =
  | "uniqueFileCount"
  | "workspaceCount"
  | "totalMappings"
  | "expirationDateTime"
  | null;
type SortDirection = "asc" | "desc";

const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onShowOptions,
  refreshButton,
  renewAllButton,
}) => {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showOnlyTrackedFiles, setShowOnlyTrackedFiles] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAndFilteredSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];

    // Apply filter for tracked files
    if (showOnlyTrackedFiles) {
      filtered = filtered.filter((sub) => (sub.uniqueFileCount ?? 0) > 0);
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        // Handle dates
        if (sortField === "expirationDateTime") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        // Handle numbers (default to 0 if undefined)
        if (typeof aValue === "undefined") aValue = 0;
        if (typeof bValue === "undefined") bValue = 0;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [subscriptions, sortField, sortDirection, showOnlyTrackedFiles]);
  return (
    <>
      {/* Filter Controls */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={3}>
          <FormControlLabel
            control={
              <Switch
                checked={showOnlyTrackedFiles}
                onChange={(e) => setShowOnlyTrackedFiles(e.target.checked)}
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
              <Typography
                variant="body1"
                sx={{ color: "#fff", fontSize: "1rem" }}
              >
                Show only entries with tracked files
              </Typography>
            }
          />
          {refreshButton}
          {renewAllButton}
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        className={adminTableClasses.container}
        sx={{
          ...getAdminTableContainerStyles(),
          maxHeight: 600,
        }}
      >
        <Table className={adminTableClasses.table}>
          <TableHead>
            <TableRow className={adminTableClasses.headerRow}>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{ ...getAdminTableHeaderCellStyles(), minWidth: 200 }}
              >
                <Typography sx={getAdminTableHeaderTextStyles()}>
                  Subscription
                </Typography>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{ ...getAdminTableHeaderCellStyles(), minWidth: 250 }}
              >
                <Typography sx={getAdminTableHeaderTextStyles()}>
                  Resource Path
                </Typography>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 180,
                  textAlign: "center",
                }}
              >
                <Box
                  onClick={() => handleSort("expirationDateTime")}
                  sx={getAdminTableSortHeaderStyles(
                    sortField === "expirationDateTime",
                    "#f92a4b"
                  )}
                >
                  <Typography sx={getAdminTableHeaderTextStyles()}>
                    Expiration date
                  </Typography>
                  {getSortIcon(
                    sortField === "expirationDateTime",
                    sortField === "expirationDateTime" ? sortDirection : null,
                    "#f92a4b"
                  )}
                </Box>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 140,
                  textAlign: "center",
                }}
              >
                <Typography sx={getAdminTableHeaderTextStyles()}>
                  Graph Health
                </Typography>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 200,
                  textAlign: "center",
                }}
              >
                <Typography sx={getAdminTableHeaderTextStyles()}>
                  Drive ID
                </Typography>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 100,
                  textAlign: "center",
                }}
              >
                <Box
                  onClick={() => handleSort("uniqueFileCount")}
                  sx={getAdminTableSortHeaderStyles(
                    sortField === "uniqueFileCount",
                    "#f92a4b"
                  )}
                >
                  <Typography sx={getAdminTableHeaderTextStyles()}>
                    Unique Files
                  </Typography>
                  {getSortIcon(
                    sortField === "uniqueFileCount",
                    sortField === "uniqueFileCount" ? sortDirection : null,
                    "#f92a4b"
                  )}
                </Box>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 100,
                  textAlign: "center",
                }}
              >
                <Box
                  onClick={() => handleSort("workspaceCount")}
                  sx={getAdminTableSortHeaderStyles(
                    sortField === "workspaceCount",
                    "#f92a4b"
                  )}
                >
                  <Typography sx={getAdminTableHeaderTextStyles()}>
                    Workspaces
                  </Typography>
                  {getSortIcon(
                    sortField === "workspaceCount",
                    sortField === "workspaceCount" ? sortDirection : null,
                    "#f92a4b"
                  )}
                </Box>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 100,
                  textAlign: "center",
                }}
              >
                <Box
                  onClick={() => handleSort("totalMappings")}
                  sx={getAdminTableSortHeaderStyles(
                    sortField === "totalMappings",
                    "#f92a4b"
                  )}
                >
                  <Typography sx={getAdminTableHeaderTextStyles()}>
                    Total Mappings
                  </Typography>
                  {getSortIcon(
                    sortField === "totalMappings",
                    sortField === "totalMappings" ? sortDirection : null,
                    "#f92a4b"
                  )}
                </Box>
              </TableCell>
              <TableCell
                className={adminTableClasses.headerCell}
                sx={{
                  ...getAdminTableHeaderCellStyles(),
                  minWidth: 160,
                  textAlign: "center",
                }}
              >
                <Typography sx={getAdminTableHeaderTextStyles()}>
                  Retry Information
                </Typography>
              </TableCell>
              <TableCell
                className={`${adminTableClasses.headerCell} w-[60px]`}
                sx={{ ...getAdminTableHeaderCellStyles(), textAlign: "center" }}
              >
                <Typography sx={getAdminTableHeaderTextStyles()}>
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAndFilteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  align="center"
                  className="!font-body !text-white-100"
                  sx={{ py: 6 }}
                >
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={2}
                  >
                    <TbGraph size={48} className="text-gray-400" />
                    <Typography
                      variant="h6"
                      className="!text-white-100 !font-body"
                    >
                      No subscriptions found
                    </Typography>
                    <Typography
                      variant="body2"
                      className="!text-gray-300 !font-body"
                    >
                      {showOnlyTrackedFiles
                        ? "No subscriptions with tracked files found. Try disabling the filter."
                        : "There are currently no Microsoft Graph subscriptions to display"}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredSubscriptions.map((subscription, index) => {
                const getGraphStatusColor = (status: string) => {
                  switch (status) {
                    case "Active":
                      return "#16692D"; // success green
                    case "NotFound":
                      return "#A6363D"; // error red
                    case "ValidationError":
                      return "#977A24"; // warning yellow
                    default:
                      return "#424242"; // info gray
                  }
                };

                const getGraphStatusIcon = (status: string) => {
                  switch (status) {
                    case "Active":
                      return <TbCheck size={16} />;
                    case "NotFound":
                      return <TbX size={16} />;
                    case "ValidationError":
                      return <TbAlertCircle size={16} />;
                    default:
                      return <TbGraph size={16} />;
                  }
                };

                const getGraphStatusLabel = (status: string) => {
                  switch (status) {
                    case "Active":
                      return "Active";
                    case "NotFound":
                      return "Not Found";
                    case "ValidationError":
                      return "Unknown";
                    default:
                      return status;
                  }
                };

                const getRetryStatusColor = (retryCount: number) => {
                  if (retryCount === 0) return "#16692D"; // success green
                  if (retryCount < 3) return "#977A24"; // warning yellow
                  return "#A6363D"; // error red
                };

                const expirationInfo = getDatePartsWithUrgency(
                  subscription.expirationDateTime
                );
                const resourceParts = subscription.resource.split("/");
                const resourceName =
                  resourceParts[resourceParts.length - 1] || "root";
                const resourcePath = resourceParts.slice(0, -1).join("/");

                return (
                  <TableRow
                    key={subscription.subscriptionId}
                    className="hover:!bg-gray-600 transition-colors duration-200"
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(66, 70, 84, 0.4) !important",
                      },
                    }}
                  >
                    {/* Subscription */}
                    <TableCell
                      className="!font-body !text-white-100"
                      sx={getAdminTableCellBorderStyles(
                        index === sortedAndFilteredSubscriptions.length - 1
                      )}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box flex={1}>
                          <Tooltip text={subscription.subscriptionId} useMui>
                            <Typography
                              variant="body2"
                              className="!text-white-100 !font-mono"
                              sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                            >
                              {subscription.subscriptionId.substring(0, 32)}...
                            </Typography>
                          </Tooltip>
                        </Box>
                        <CopyIconButton
                          text={subscription.subscriptionId}
                          copyKey={`${subscription.subscriptionId}-id`}
                          isCopied={isCopied(
                            `${subscription.subscriptionId}-id`
                          )}
                          onCopy={copyToClipboard}
                          tooltipText="Copy subscription ID to clipboard"
                        />
                      </Box>
                    </TableCell>

                    {/* Resource Path */}
                    <TableCell
                      className="!font-body !text-white-100"
                      sx={getAdminTableCellBorderStyles(
                        index === sortedAndFilteredSubscriptions.length - 1
                      )}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box flex={1}>
                          <Tooltip text={subscription.resource} useMui>
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={0.5}
                            >
                              <TbFolder size={16} className="text-blue-400" />
                              <Typography
                                variant="caption"
                                className="!text-gray-300 !font-mono"
                                sx={{
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "320px",
                                }}
                              >
                                {resourcePath || "/"}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Box>
                        <CopyIconButton
                          text={subscription.resource}
                          copyKey={`${subscription.subscriptionId}-resource`}
                          isCopied={isCopied(
                            `${subscription.subscriptionId}-resource`
                          )}
                          onCopy={copyToClipboard}
                          tooltipText="Copy resource path to clipboard"
                        />
                      </Box>
                    </TableCell>

                    {/* Expiration Date */}
                    <TableCell
                      className="!font-body !text-white-100"
                      sx={{
                        ...getAdminTableCellBorderStyles(
                          index === sortedAndFilteredSubscriptions.length - 1
                        ),
                        textAlign: "center",
                      }}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={0.5}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <TbClock
                            size={16}
                            className={
                              expirationInfo.isUrgent
                                ? "text-red-400"
                                : "text-blue-400"
                            }
                          />
                          <Typography
                            variant="body2"
                            className={
                              expirationInfo.isUrgent
                                ? "!text-red-300"
                                : "!text-white-100"
                            }
                            sx={{ fontWeight: 600 }}
                          >
                            {expirationInfo.date} {expirationInfo.time}
                          </Typography>
                        </Box>
                        {expirationInfo.isUrgent && (
                          <Chip
                            label="Urgent"
                            size="small"
                            sx={{
                              height: 18,
                              backgroundColor: "#A6363D",
                              color: "white",
                              fontSize: "0.65rem",
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Graph Health */}
                    <TableCell
                      className="!font-body !text-white-100"
                      sx={{
                        ...getAdminTableCellBorderStyles(
                          index === sortedAndFilteredSubscriptions.length - 1
                        ),
                        textAlign: "center",
                      }}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={1}
                      >
                        <Chip
                          icon={getGraphStatusIcon(subscription.graphStatus)}
                          label={getGraphStatusLabel(subscription.graphStatus)}
                          size="small"
                          sx={{
                            backgroundColor: getGraphStatusColor(
                              subscription.graphStatus
                            ),
                            color: "white",
                            fontFamily: '"Nunito Sans", sans-serif',
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            "& .MuiChip-icon": {
                              color: "white",
                            },
                          }}
                        />
                        {subscription.isActiveInGraph !== null &&
                          ((subscription.graphStatus === "Active" &&
                            !subscription.isActiveInGraph) ||
                            (subscription.graphStatus !== "Active" &&
                              subscription.isActiveInGraph)) && (
                            <Typography
                              variant="caption"
                              className="!text-gray-300"
                              sx={{ fontSize: "0.7rem", textAlign: "center" }}
                            >
                              Graph:{" "}
                              {subscription.isActiveInGraph
                                ? "Active"
                                : "Inactive"}
                            </Typography>
                          )}
                      </Box>
                    </TableCell>

                    {/* File Tracking - Drive ID */}
                    <TableCell
                      className="!font-body !text-white-100"
                      sx={getAdminTableCellBorderStyles(
                        index === sortedAndFilteredSubscriptions.length - 1
                      )}
                    >
                      {subscription.driveId ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box flex={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <TbDatabase size={16} className="text-blue-400" />
                              <Tooltip text={subscription.driveId} useMui>
                                <Typography
                                  variant="caption"
                                  className="!text-white-100 !font-mono"
                                  sx={{
                                    fontSize: "0.75rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "250px",
                                    display: "block",
                                  }}
                                >
                                  {subscription.driveId.length > 30
                                    ? `${subscription.driveId.substring(
                                        0,
                                        30
                                      )}...`
                                    : subscription.driveId}
                                </Typography>
                              </Tooltip>
                            </Box>
                          </Box>
                          <CopyIconButton
                            text={subscription.driveId!}
                            copyKey={`${subscription.subscriptionId}-driveId`}
                            isCopied={isCopied(
                              `${subscription.subscriptionId}-driveId`
                            )}
                            onCopy={copyToClipboard}
                            tooltipText="Copy drive ID to clipboard"
                          />
                        </Box>
                      ) : (
                        <Typography
                          variant="caption"
                          className="!text-gray-500"
                          sx={{ fontStyle: "italic" }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Unique Files */}
                    <TableCell
                      className="!font-body !text-white-100"
                      sx={{
                        ...getAdminTableCellBorderStyles(
                          index === sortedAndFilteredSubscriptions.length - 1
                        ),
                        textAlign: "center",
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={0.5}
                      >
                        <TbFiles
                          size={16}
                          className={
                            subscription.driveId
                              ? "text-blue-400"
                              : "text-gray-500"
                          }
                        />
                        <Typography
                          variant="body2"
                          className={
                            subscription.driveId
                              ? "!text-white-100"
                              : "!text-gray-500"
                          }
                          sx={{ fontWeight: 600 }}
                        >
                          {subscription.uniqueFileCount ?? 0}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Workspaces */}
                    <TableCell
                      className="!font-body !text-white-100"
                      sx={{
                        ...getAdminTableCellBorderStyles(
                          index === sortedAndFilteredSubscriptions.length - 1
                        ),
                        textAlign: "center",
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={0.5}
                      >
                        <TbBrandOffice
                          size={16}
                          className={
                            subscription.driveId
                              ? "text-blue-400"
                              : "text-gray-500"
                          }
                        />
                        <Typography
                          variant="body2"
                          className={
                            subscription.driveId
                              ? "!text-white-100"
                              : "!text-gray-500"
                          }
                          sx={{ fontWeight: 600 }}
                        >
                          {subscription.workspaceCount ?? 0}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Total Mappings */}
                    <TableCell
                      className="!font-body !text-white-100"
                      sx={{
                        ...getAdminTableCellBorderStyles(
                          index === sortedAndFilteredSubscriptions.length - 1
                        ),
                        textAlign: "center",
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={0.5}
                      >
                        <TbLink
                          size={16}
                          className={
                            subscription.driveId
                              ? "text-blue-400"
                              : "text-gray-500"
                          }
                        />
                        <Tooltip
                          text={
                            subscription.driveId
                              ? "Total file-workspace associations"
                              : "Metrics unavailable - drive ID not resolved"
                          }
                          useMui
                        >
                          <Typography
                            variant="body2"
                            className={
                              subscription.driveId
                                ? "!text-white-100"
                                : "!text-gray-500"
                            }
                            sx={{ fontWeight: 600 }}
                          >
                            {subscription.totalMappings ?? 0}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </TableCell>

                    {/* Retry Information */}
                    <TableCell
                      className="!font-body !text-white-100"
                      sx={{
                        ...getAdminTableCellBorderStyles(
                          index === sortedAndFilteredSubscriptions.length - 1
                        ),
                        textAlign: "center",
                      }}
                    >
                      {subscription.retryCount > 0 ? (
                        <Box
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          gap={1}
                        >
                          <Chip
                            label={`${subscription.retryCount} ${
                              subscription.retryCount === 1
                                ? "retry"
                                : "retries"
                            }`}
                            size="small"
                            sx={{
                              backgroundColor: getRetryStatusColor(
                                subscription.retryCount
                              ),
                              color: "white",
                              fontFamily: '"Nunito Sans", sans-serif',
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          />
                          {subscription.nextRetryAt && (
                            <Typography
                              variant="caption"
                              className="!text-gray-300"
                              sx={{ fontSize: "0.7rem", textAlign: "center" }}
                            >
                              Next:{" "}
                              {
                                formatDateTime(subscription.nextRetryAt).split(
                                  ", "
                                )[1]
                              }
                            </Typography>
                          )}
                          {subscription.lastFailureReason && (
                            <Tooltip
                              text={subscription.lastFailureReason}
                              useMui
                            >
                              <Typography
                                variant="caption"
                                className="!text-red-300"
                                sx={{
                                  fontSize: "0.65rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "180px",
                                  display: "block",
                                  textAlign: "center",
                                }}
                              >
                                {subscription.lastFailureReason}
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="center">
                          <Chip
                            icon={<TbCheck size={16} />}
                            label="Healthy"
                            size="small"
                            sx={{
                              backgroundColor: getRetryStatusColor(0),
                              color: "white",
                              fontFamily: '"Nunito Sans", sans-serif',
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              "& .MuiChip-icon": {
                                color: "white",
                              },
                            }}
                          />
                        </Box>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell
                      className="!font-body !text-white-100 w-[60px]"
                      sx={{
                        textAlign: "center",
                        ...getAdminTableCellBorderStyles(
                          index === sortedAndFilteredSubscriptions.length - 1
                        ),
                      }}
                    >
                      <IconButton
                        aria-label="More options"
                        onClick={(e) =>
                          onShowOptions(e, subscription.subscriptionId)
                        }
                        className="!text-white-100 hover:!bg-gray-500"
                        size="small"
                        sx={{
                          transition: "all 0.2s",
                          "&:hover": {
                            backgroundColor: "rgba(66, 70, 84, 0.6) !important",
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        <FiMoreHorizontal size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default memo(SubscriptionTable);
