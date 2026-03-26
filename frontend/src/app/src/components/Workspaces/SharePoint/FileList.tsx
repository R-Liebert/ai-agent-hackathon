import React from "react";
import {
  List,
  ListItem,
  Box,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { FaFolder } from "react-icons/fa";
import { FileIcon } from "react-file-icon";
import { format } from "date-fns";
import { BiErrorCircle } from "react-icons/bi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { DriveItem, DownloadProgress } from "./types";
import { getFileExtension, getFileIconProps, formatFileSize } from "./utils";

interface FileListProps {
  files: DriveItem[];
  selectedFiles: DriveItem[];
  loading: boolean;
  isDownloading: boolean;
  downloadProgress: DownloadProgress;
  isSearching: boolean;
  searchError: boolean;
  searchQuery: string;
  searchResults: DriveItem[];
  onFileClick: (file: DriveItem) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFiles,
  loading,
  isDownloading,
  downloadProgress,
  isSearching,
  searchError,
  searchQuery,
  searchResults,
  onFileClick,
}) => {
  const { t } = useTranslation();

  const renderFileIcon = (filename: string) => {
    const extension = getFileExtension(filename);
    const iconProps = getFileIconProps(extension);

    return (
      <div className="w-6" style={{ lineHeight: 0 }}>
        <FileIcon
          extension={extension}
          {...iconProps}
          radius={3}
          style={{ display: "block", height: "100%" }}
        />
      </div>
    );
  };

  if (
    (loading && !isDownloading && Object.keys(downloadProgress).length === 0) ||
    (isSearching &&
      searchQuery.length >= 3 &&
      !isDownloading &&
      Object.keys(downloadProgress).length === 0)
  ) {
    return (
      <Box className="flex justify-center items-center pt-8 pb-6 h-full animate-[fadeIn_200ms_ease-in-out]">
        <CircularProgress size={64} sx={{ color: "white" }} />
      </Box>
    );
  }

  if (isDownloading && Object.keys(downloadProgress).length > 0) {
    return (
      <Box className="flex flex-col gap-3 justify-center items-center h-full px-4 animate-[fadeIn_200ms_ease-in-out]">
        {selectedFiles.map((file) => (
          <div
            key={file.id}
            className="flex flex-col w-full max-w-lg transition-opacity duration-200 ease-in-out"
          >
            <span className="text-white-100 mb-1 text-xs">
              {file.name} -{" "}
              {Math.round(downloadProgress[file.id]?.progress || 0)}%
            </span>
            <LinearProgress
              variant="buffer"
              value={downloadProgress[file.id]?.progress || 0}
              valueBuffer={downloadProgress[file.id]?.buffer || 10}
              className="bg-white/10"
              sx={{
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "white",
                },
                "& .MuiLinearProgress-dashed": {
                  backgroundImage:
                    "radial-gradient(rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.3) 16%, transparent 42%)",
                },
              }}
            />
          </div>
        ))}
      </Box>
    );
  }

  if (searchError && searchQuery.length >= 3) {
    return (
      <Box className="flex flex-col items-center justify-center h-full gap-4 animate-[fadeIn_200ms_ease-in-out]">
        <BiErrorCircle size={64} className="text-red-500" />
        <div className="text-white-100 text-center">
          <p className="text-lg font-semibold mb-1">
            {t(
              "workspaces:common:sharePointPicker:sharePointsearch:errorTitle"
            )}
          </p>
          <p className="text-sm opacity-80">
            {t(
              "workspaces:common:sharePointPicker:sharePointsearch:errorMessage"
            )}
          </p>
        </div>
      </Box>
    );
  }

  if (searchQuery.length >= 3 && searchResults.length === 0 && !loading) {
    return (
      <Box className="flex flex-col items-center justify-center h-full gap-4 animate-[fadeIn_200ms_ease-in-out]">
        <HiOutlineDocumentSearch size={64} className="text-white-100/50" />
        <div className="text-white-100 text-center">
          <p className="text-lg font-semibold mb-1">
            {t(
              "workspaces:common:sharePointPicker:sharePointsearch:noResultsTitle"
            )}
          </p>
          <p className="text-sm opacity-80">
            {t(
              "workspaces:common:sharePointPicker:sharePointsearch:noResultsMessage"
            )}
          </p>
        </div>
      </Box>
    );
  }

  const displayFiles = searchQuery.length >= 3 ? searchResults : files;

  return (
    <div className="relative h-full">
      <List className="p-0">
        {displayFiles.map((file) => {
          const isAllowed = file.isAllowed;
          return (
            <ListItem
              key={file.id}
              className={`!py-3.5 min-h-[48px] ${
                isAllowed
                  ? "hover:bg-[rgba(237,237,237,0.05)] aria-selected:bg-[rgba(237,237,237,0.1)] transition-all duration-200 ease-in-out cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              button
              onClick={() => onFileClick(file)}
              selected={selectedFiles.some((f) => f.id === file.id)}
            >
              <div className="flex items-center w-full">
                <div className="flex items-center min-w-[40px] ml-1">
                  {file.folder ? (
                    <FaFolder className="text-white-100" size={24} />
                  ) : (
                    renderFileIcon(file.name)
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <span
                    className={`truncate font-body block ${
                      isAllowed ? "text-white-100" : "text-white-100/50"
                    }`}
                  >
                    {file.name}
                  </span>
                </div>
                <div className="flex-shrink-0 w-24 text-right pr-4">
                  <span
                    className={`text-sm font-body ${
                      isAllowed ? "text-white-100/70" : "text-white-100/30"
                    }`}
                  >
                    {formatFileSize(file.size || 0)}
                  </span>
                </div>
                <div className="flex-shrink-0 w-40 text-right">
                  <span
                    className={`text-sm font-body ${
                      isAllowed ? "text-white-100/70" : "text-white-100/30"
                    }`}
                  >
                    {format(
                      new Date(file.lastModifiedDateTime || new Date()),
                      "MMM d, yyyy"
                    )}
                  </span>
                </div>
              </div>
            </ListItem>
          );
        })}
      </List>
    </div>
  );
};
