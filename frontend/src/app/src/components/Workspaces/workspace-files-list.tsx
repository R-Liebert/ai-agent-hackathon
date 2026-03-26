import React, { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi";
import { WorkspaceFileDto } from "../../models/workspace-model";
import { byteConverter } from "../../utils/fileUtils";
import {
  Chip,
  createTheme,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
  TablePagination,
  CircularProgress,
  TableSortLabel,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import ConfirmActionDialog from "../Global/ConfirmActionDialog";
import Tooltip from "../Global/Tooltip";
import { TbSortAscending } from "react-icons/tb";
import { TbSortDescending } from "react-icons/tb";
import { format, formatDistanceToNow, isToday } from "date-fns";

export type WorkspaceFilesListProps = {
  workspaceFiles: WorkspaceFileDto[];
  onRemoveWorkspaceFile: (workspaceFile: WorkspaceFileDto) => void;
  onRemoveAllWorkspaceFiles: () => void;
};

export const WorkspaceFilesList: React.FC<WorkspaceFilesListProps> = ({
  workspaceFiles,
  onRemoveWorkspaceFile,
  onRemoveAllWorkspaceFiles,
}) => {
  const { t } = useTranslation();

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showDeleteAllFilesDialog, setShowDeleteAllFilesDialog] =
    useState<boolean>(false);
  // Separate sort directions for each column
  const [sortDirections, setSortDirections] = useState<{
    [key: string]: "asc" | "desc";
  }>({
    fileName: "asc",
    contentType: "asc",
    contentLength: "asc",
    uploadedAt: "asc",
    status: "asc",
  });
  const [sortBy, setSortBy] = useState<keyof WorkspaceFileDto | null>(null);

  if (!workspaceFiles || workspaceFiles.length === 0) {
    return null;
  }

  const STATUS_UPLOADED = "UPLOADED";
  const STATUS_IN_PROGRESS = "INPROGRESS";
  const STATUS_PROCESSING = "PROCESSING";
  const STATUS_INDEXED = "INDEXED";
  const STATUS_CANCELLED = "CANCELLED";
  const STATUS_FAILED = "FAILED";
  const PENDING = "PENDING";

  const statusColorMap: {
    [key: string]:
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning";
  } = {
    [STATUS_UPLOADED]: "info",
    [STATUS_IN_PROGRESS]: "warning",
    [STATUS_PROCESSING]: "warning",
    [STATUS_INDEXED]: "success",
    [STATUS_CANCELLED]: "warning",
    [STATUS_FAILED]: "error",
    [PENDING]: "info",
  };

  const darkTheme = createTheme({
    palette: {
      mode: "dark",
    },
    typography: {
      fontFamily: '"Nunito Sans", sans-serif!important',
    },
  });

  // Add this function to check if a file is a replacement
  const isReplacement = (workspaceFile: WorkspaceFileDto): boolean => {
    return (workspaceFile as any).isReplacement === true;
  };

  // Update the getStatusLabel function to handle replacement status
  const getStatusLabel = (status: string, workspaceFile?: WorkspaceFileDto) => {
    // If this is a replacement file, show "Replacing" instead of "Pending"
    if (status === "Pending" && workspaceFile && isReplacement(workspaceFile)) {
      return t("workspaces:common.status.replacing") || "Replacing...";
    }

    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      case STATUS_UPLOADED:
        return t("workspaces:common.status.uploaded");
      case STATUS_IN_PROGRESS:
        return t("workspaces:common.status.inProgress");
      case STATUS_PROCESSING:
        return t("workspaces:common.status.processing");
      case STATUS_INDEXED:
        return t("workspaces:common.status.indexed");
      case STATUS_CANCELLED:
        return t("workspaces:common.status.cancelled");
      case STATUS_FAILED:
        return t("workspaces:common.status.failed");
      case PENDING:
        return t("workspaces:common.status.pending");
      default:
        return status;
    }
  };

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (property: keyof WorkspaceFileDto) => {
    setSortBy(property);
    setSortDirections((prev) => ({
      ...prev,
      [property]: prev[property] === "asc" ? "desc" : "asc",
    }));
  };

  function getFileType(fileName: string) {
    return fileName.split(".").pop()?.toLowerCase() || "unknown";
  }

  const sortedFiles = [...workspaceFiles].sort((a, b) => {
    if (!sortBy) return 0;

    let aValue: string | number = "";
    let bValue: string | number = "";

    if (sortBy === "contentLength") {
      aValue = a.contentLength;
      bValue = b.contentLength;
    } else if (sortBy === "contentType") {
      aValue = getFileType(a.fileName) || "";
      bValue = getFileType(b.fileName) || "";
    } else if (sortBy === "status") {
      aValue = a.status.toUpperCase();
      bValue = b.status.toUpperCase();
    } else if (sortBy === "uploadedAt") {
      aValue = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      bValue = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    } else {
      aValue = String(a[sortBy] ?? "").toLowerCase();
      bValue = String(b[sortBy] ?? "").toLowerCase();
    }

    // Re-added date sorting logic for uploadedAt
    if (sortBy === "uploadedAt" && a.uploadedAt && b.uploadedAt) {
      const dateA = new Date(a.uploadedAt).getTime();
      const dateB = new Date(b.uploadedAt).getTime();
      if (dateA < dateB) return sortDirections.uploadedAt === "asc" ? -1 : 1;
      if (dateA > dateB) return sortDirections.uploadedAt === "asc" ? 1 : -1;
      return 0;
    }

    if (aValue < bValue) return sortDirections[sortBy] === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirections[sortBy] === "asc" ? 1 : -1;
    return 0;
  });

  const getFileNameWithoutExtension = (fileName: string): string => {
    return fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
  };

  const paginatedWorkspaceFiles = sortedFiles.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const CustomSortIcon = ({ direction }: { direction: "asc" | "desc" }) => {
    const Icon = direction === "asc" ? TbSortAscending : TbSortDescending;
    return (
      <Icon
        className="ml-1 text-white-100"
        size={20}
        style={{ strokeWidth: 1.8 }}
      />
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <TableContainer
        component={Paper}
        sx={{
          backgroundImage: "none",
          fontFamily: '"Nunito Sans", sans-serif!important',
        }}
        className="mt-3 !shadow-none !rounded-xl !border-2 border-gray-500 !bg-transparent"
      >
        <Table
          sx={{ minWidth: 650, tableLayout: "fixed" }}
          aria-label="files table"
          className="!bg-transparent"
          data-testid="workspace-files"
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "35%", paddingLeft: "26px" }}>
                <TableSortLabel
                  active={sortBy === "fileName"}
                  direction={sortDirections.fileName}
                  onClick={() => handleSort("fileName")}
                  hideSortIcon={false}
                  IconComponent={() => (
                    <CustomSortIcon direction={sortDirections.fileName} />
                  )}
                  sx={{
                    "& .MuiTableSortLabel-icon": {
                      opacity: 1,
                    },
                  }}
                >
                  {t("workspaces:common.table.headers.name")}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ width: "14%" }}>
                <TableSortLabel
                  active={sortBy === "contentType"}
                  direction={sortDirections.contentType}
                  onClick={() => handleSort("contentType")}
                  hideSortIcon={false}
                  IconComponent={() => (
                    <CustomSortIcon direction={sortDirections.contentType} />
                  )}
                  sx={{
                    "& .MuiTableSortLabel-icon": {
                      opacity: 1,
                    },
                  }}
                >
                  {t("workspaces:common.table.headers.type")}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ width: "16%" }}>
                <TableSortLabel
                  active={sortBy === "contentLength"}
                  direction={sortDirections.contentLength}
                  onClick={() => handleSort("contentLength")}
                  hideSortIcon={false}
                  IconComponent={() => (
                    <CustomSortIcon direction={sortDirections.contentLength} />
                  )}
                  sx={{
                    "& .MuiTableSortLabel-icon": {
                      opacity: 1,
                    },
                  }}
                >
                  {t("workspaces:common.table.headers.size")}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ width: "23%" }}>
                <TableSortLabel
                  active={sortBy === "status"}
                  direction={sortDirections.status}
                  onClick={() => handleSort("status")}
                  hideSortIcon={false}
                  IconComponent={() => (
                    <CustomSortIcon direction={sortDirections.status} />
                  )}
                  sx={{ "& .MuiTableSortLabel-icon": { opacity: 1 } }}
                >
                  {t("workspaces:common.table.headers.status")}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ width: "12%" }}>
                <IconButton
                  aria-label="Delete all files"
                  onClick={() => setShowDeleteAllFilesDialog(true)}
                  className="mx-4 relative group"
                >
                  <HiOutlineTrash
                    className="w-6 h-6 stroke-current"
                    style={{ strokeWidth: 1.4 }}
                  />
                  <Tooltip
                    text="components:tooltips.deleteAllFiles"
                    position="right-0 top-14"
                  />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedWorkspaceFiles.map(
              (workspaceFile: WorkspaceFileDto, idx: number) => {
                const statusColor =
                  statusColorMap[workspaceFile.status.toUpperCase()] ||
                  "default";
                let formattedDate = "-";
                if (workspaceFile.uploadedAt) {
                  const uploadedDate = new Date(workspaceFile.uploadedAt);
                  if (isToday(uploadedDate)) {
                    formattedDate = formatDistanceToNow(uploadedDate, {
                      addSuffix: true,
                    });
                  } else {
                    formattedDate = format(uploadedDate, "PPpp");
                  }
                }
                return (
                  <TableRow key={`${workspaceFile.fileName}_${idx}`}>
                    {/* File Name Column */}
                    <TableCell
                      sx={{
                        width: "35%",
                        paddingLeft: "26px",
                        position: "relative",
                        verticalAlign: "top",
                      }}
                    >
                      <div className="flex flex-col">
                        <div className="relative group flex items-center">
                          <span className="truncate block">
                            {getFileNameWithoutExtension(
                              workspaceFile.fileName
                            )}
                          </span>
                          <Tooltip
                            text={workspaceFile.fileName}
                            position="-left-1 top-8"
                          />
                        </div>
                        <span className="text-xs text-gray-300">
                          {formattedDate}
                        </span>
                      </div>
                    </TableCell>
                    {/* File Type Column */}
                    <TableCell
                      align="center"
                      sx={{ width: "14%", fontSize: "13px" }}
                    >
                      {getFileType(workspaceFile.fileName)}
                    </TableCell>

                    {/* File Size Column */}
                    <TableCell
                      align="center"
                      sx={{ width: "16%", fontSize: "13px" }}
                    >
                      {byteConverter(workspaceFile.contentLength, 2, "KB")}
                    </TableCell>

                    {/* Status Column */}
                    <TableCell align="center" sx={{ width: "23%" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Chip
                          label={getStatusLabel(
                            workspaceFile.status,
                            workspaceFile
                          )}
                          color={statusColor}
                          size="medium"
                          sx={{
                            fontFamily: '"Nunito Sans", sans-serif!important',
                            fontWeight: "600",
                            fontSize: "14px",
                          }}
                        />
                        {(workspaceFile.status === "Pending" ||
                          workspaceFile.status.toUpperCase() ===
                            STATUS_PROCESSING) && (
                          <CircularProgress
                            size={16}
                            sx={{
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell align="center" sx={{ width: "12%" }}>
                      <IconButton
                        aria-label="Delete file"
                        onClick={() =>
                          onRemoveWorkspaceFile &&
                          onRemoveWorkspaceFile(workspaceFile)
                        }
                      >
                        <HiOutlineTrash
                          className="w-6 h-6 stroke-current"
                          style={{ strokeWidth: 1.4 }}
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              }
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={workspaceFiles.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <ConfirmActionDialog
        title={t("workspaces:workspaceFiles:modals:deletAllFilesModal.title")}
        message={t(
          "workspaces:workspaceFiles:modals:deletAllFilesModal.message"
        )}
        cancelBtn={t(
          "workspaces:workspaceFiles:modals:deletAllFilesModal.cancelBtn"
        )}
        confirmBtn={t(
          "workspaces:workspaceFiles:modals:deletAllFilesModal.deleteBtn"
        )}
        onConfirm={() => {
          try {
            onRemoveAllWorkspaceFiles();
          } finally {
            setShowDeleteAllFilesDialog(false);
          }
        }}
        onClose={() => setShowDeleteAllFilesDialog(false)}
        onCancel={() => setShowDeleteAllFilesDialog(false)}
        open={showDeleteAllFilesDialog}
      />
    </ThemeProvider>
  );
};
