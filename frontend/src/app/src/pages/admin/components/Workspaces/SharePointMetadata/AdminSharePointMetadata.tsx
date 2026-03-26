import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Box,
  Link,
} from "@mui/material";
import {
  CloudOutlined,
  BusinessOutlined,
  PersonOutlined,
  ErrorOutline,
  RefreshOutlined,
} from "@mui/icons-material";
import { WorkspaceFileDto } from "../../../../../services/admin/types/adminWorkspace.types";
import { useAdminSharePointMetadata } from "../../../hooks/useAdminSharePointMetadata";
import { formatBytes, formatDateTime } from "../utils";
import Tooltip from "../../../../../components/Global/Tooltip";

interface AdminSharePointMetadataProps {
  files: WorkspaceFileDto[];
  workspaceId: string;
}

const AdminSharePointMetadata: React.FC<AdminSharePointMetadataProps> = ({
  files,
  workspaceId,
}) => {
  const {
    filesWithMetadata,
    isLoading,
    driveInfoLoading,
    fileMetadataLoading,
    driveInfoError,
    fileMetadataError,
    refreshDriveInfo,
    refreshFileMetadata,
  } = useAdminSharePointMetadata(files);

  // Using shared formatters

  const getDriveTypeIcon = (
    driveType: "personal" | "business" | "documentLibrary"
  ) => {
    switch (driveType) {
      case "personal":
        return <PersonOutlined fontSize="small" />;
      case "business":
        return <BusinessOutlined fontSize="small" />;
      case "documentLibrary":
        return <CloudOutlined fontSize="small" />;
      default:
        return <CloudOutlined fontSize="small" />;
    }
  };

  const renderDriveInfo = (file: (typeof filesWithMetadata)[0]) => {
    if (file.driveInfoLoading) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={16} sx={{ color: "#f92a4b" }} />
          <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
            Loading...
          </Typography>
        </Box>
      );
    }

    if (file.driveInfoError) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <ErrorOutline fontSize="small" sx={{ color: "#ef4444" }} />
          <Tooltip text={file.driveInfoError}>
            <Typography variant="body2" sx={{ color: "#ef4444" }}>
              Drive Error
            </Typography>
          </Tooltip>
          <RefreshOutlined
            fontSize="small"
            sx={{ color: "#9ca3af", cursor: "pointer" }}
            onClick={() => file.driveId && refreshDriveInfo(file.driveId)}
          />
        </Box>
      );
    }

    if (file.driveInfo) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          {getDriveTypeIcon(file.driveInfo.driveType)}
          <Typography variant="body2" sx={{ color: "#ffffff" }}>
            {file.driveInfo.name}
          </Typography>
          <Chip
            label={file.driveInfo.driveType}
            size="small"
            sx={{
              backgroundColor: "#2a2a2a",
              color: "#9ca3af",
              fontSize: "0.7rem",
              height: "20px",
            }}
          />
        </Box>
      );
    }

    return (
      <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
        {file.driveId || "Unknown Drive"}
      </Typography>
    );
  };

  const renderFileMetadata = (file: (typeof filesWithMetadata)[0]) => {
    if (file.fileMetadataLoading) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={16} sx={{ color: "#f92a4b" }} />
          <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
            Loading...
          </Typography>
        </Box>
      );
    }

    if (file.fileMetadataError) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <ErrorOutline fontSize="small" sx={{ color: "#ef4444" }} />
          <Tooltip text={file.fileMetadataError} useMui>
            <Typography variant="body2" sx={{ color: "#ef4444" }}>
              Metadata Error
            </Typography>
          </Tooltip>
          <RefreshOutlined
            fontSize="small"
            sx={{ color: "#9ca3af", cursor: "pointer" }}
            onClick={() =>
              file.driveId &&
              file.itemId &&
              refreshFileMetadata(file.driveId, file.itemId)
            }
          />
        </Box>
      );
    }

    if (file.graphMetadata) {
      return (
        <Typography variant="body2" sx={{ color: "#ffffff" }}>
          {formatDateTime(file.graphMetadata.lastModifiedDateTime)}
        </Typography>
      );
    }

    return (
      <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
        No metadata
      </Typography>
    );
  };

  const renderModifiedBy = (file: (typeof filesWithMetadata)[0]) => {
    if (file.graphMetadata?.lastModifiedBy?.user) {
      return (
        <Tooltip
          text={file.graphMetadata.lastModifiedBy.user.email || ""}
          useMui
        >
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            {file.graphMetadata.lastModifiedBy.user.displayName}
          </Typography>
        </Tooltip>
      );
    }
    return (
      <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
        -
      </Typography>
    );
  };

  if (filesWithMetadata.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
          No SharePoint files found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {(driveInfoError || fileMetadataError) && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #ef4444",
            borderRadius: 1,
          }}
        >
          {driveInfoError && (
            <Typography variant="body2" sx={{ color: "#ef4444", mb: 1 }}>
              Drive Info Error: {driveInfoError}
            </Typography>
          )}
          {fileMetadataError && (
            <Typography variant="body2" sx={{ color: "#ef4444" }}>
              File Metadata Error: {fileMetadataError}
            </Typography>
          )}
        </Box>
      )}

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
          "& .MuiTable-root": { minWidth: 650 },
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                "& .MuiTableCell-head": {
                  backgroundColor: "#2a2a2a",
                  color: "#ffffff",
                  fontWeight: 600,
                },
              }}
            >
              <TableCell>File Name</TableCell>
              <TableCell>Drive</TableCell>
              <TableCell>Last Modified (Graph)</TableCell>
              <TableCell>Uploaded At (Backend)</TableCell>
              <TableCell>Modified By</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filesWithMetadata.map((file) => (
              <TableRow
                key={file.id}
                sx={{
                  "&:hover": { backgroundColor: "#2a2a2a" },
                  "& .MuiTableCell-body": {
                    color: "#ffffff",
                    borderBottom: "1px solid #2a2a2a",
                  },
                }}
              >
                <TableCell>
                  {file.graphMetadata?.webUrl ? (
                    <Link
                      href={file.graphMetadata.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: "#3b82f6",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {file.fileName}
                    </Link>
                  ) : (
                    <Typography variant="body2">{file.fileName}</Typography>
                  )}
                </TableCell>

                <TableCell>{renderDriveInfo(file)}</TableCell>

                <TableCell>{renderFileMetadata(file)}</TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                    {formatDateTime(file.uploadedAt)}
                  </Typography>
                </TableCell>

                <TableCell>{renderModifiedBy(file)}</TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                    {formatBytes(file.contentLength)}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={file.status}
                    size="small"
                    sx={{
                      backgroundColor:
                        file.status === "Indexed"
                          ? "rgba(34, 197, 94, 0.2)"
                          : file.status === "Failed"
                          ? "rgba(239, 68, 68, 0.2)"
                          : file.status === "Processing"
                          ? "rgba(251, 191, 36, 0.2)"
                          : "rgba(156, 163, 175, 0.2)",
                      color:
                        file.status === "Indexed"
                          ? "#22c55e"
                          : file.status === "Failed"
                          ? "#ef4444"
                          : file.status === "Processing"
                          ? "#fbbf24"
                          : "#9ca3af",
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
          <CircularProgress size={20} sx={{ color: "#f92a4b", mr: 1 }} />
          <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
            Loading SharePoint metadata...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AdminSharePointMetadata;
