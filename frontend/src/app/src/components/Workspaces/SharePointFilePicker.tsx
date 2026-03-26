import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMsGraphApi } from "../../services/graph";
import axiosInstance from "../../services/axiosInstance";
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
  Box,
  Typography,
  FormLabel,
  LinearProgress,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  Drawer,
} from "@mui/material";
import {
  FaFolder,
  FaClock,
  FaSearch,
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaHome,
  FaUsers,
  FaChevronRight,
  FaChevronDown,
} from "react-icons/fa";
import { PiArrowElbowLeftUpBold } from "react-icons/pi";
import { useTranslation } from "react-i18next";
import ModalContainer from "../Global/ModalContainer";
import { FileIcon, defaultStyles } from "react-file-icon";
import { format } from "date-fns";
import { BiErrorCircle } from "react-icons/bi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { debounce } from "lodash";
import { notificationsService } from "../../services/notificationsService";
import {
  DriveItem,
  JoinedTeam,
  PathHistoryItem,
  BreadcrumbItem,
} from "./SharePoint/types";
import { FileTypeFilter } from "./SharePoint/FileTypeFilter";
import { SearchBar } from "./SharePoint/SearchBar";
import { Breadcrumbs } from "./SharePoint/Breadcrumbs";
import { FileList } from "./SharePoint/FileList";
import { SelectedFiles } from "./SharePoint/SelectedFiles";
import { Sidebar } from "./SharePoint/Sidebar";
import { fileTypeGroups } from "./SharePoint/utils";
import { BsFillCloudyFill } from "react-icons/bs";
import { FileListHeader } from "./SharePoint/FileListHeader";
import { useQuery } from "@tanstack/react-query";
import {
  useChannelFolders,
  useSiteLibraryFolders,
} from "../../hooks/useTeamFolders";
import FileUploadModal from "./file-upload-modal";
import {
  GraphFileDownloadRequest,
  FileWithSharePointMetadata,
} from "../../types/sharepoint-types";

/**
 * SharePointFilePicker Component
 *
 * UPDATED: This component now sends file metadata to the backend for downloading
 * instead of handling downloads directly in the frontend. The frontend prepares
 * download URLs and metadata which are sent to the backend API.
 */

interface DriveItemWithReplace extends DriveItem {
  replace?: boolean;
  sharePointMetadata?: GraphFileDownloadRequest;
}

interface SharePointFilePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  allowedFileTypes?: { contentType: string; fileExtension: string }[];
  existingFiles?: string[];
}

const DRAWER_WIDTH = 300;

interface Channel {
  id: string;
  displayName: string;
}

const getFileExtension = (filename: string): string => {
  return filename
    .slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
    .toLowerCase();
};

const getFileIconProps = (extension: string) => {
  // Return default styles if they exist for this extension
  if (extension in defaultStyles) {
    return defaultStyles[extension as keyof typeof defaultStyles];
  }

  // Default mappings for common file types
  const typeMap: { [key: string]: any } = {
    // Documents
    doc: { type: "document", color: "#2B579A" },
    docx: { type: "document", color: "#2B579A" },
    pdf: { type: "acrobat", color: "#D93831" },
    txt: { type: "document", color: "#798082" },

    // Spreadsheets
    xls: { type: "spreadsheet", color: "#217346" },
    xlsx: { type: "spreadsheet", color: "#217346" },
    csv: { type: "spreadsheet", color: "#217346" },

    // Presentations
    ppt: { type: "presentation", color: "#B7472A" },
    pptx: { type: "presentation", color: "#B7472A" },

    // Images
    jpg: { type: "image", color: "#D4AF37" },
    jpeg: { type: "image", color: "#D4AF37" },
    png: { type: "image", color: "#D4AF37" },
    gif: { type: "image", color: "#D4AF37" },
    svg: { type: "vector", color: "#FF9A00" },

    // Code
    json: { type: "code", color: "#F1E05A" },
    js: { type: "code", color: "#F1E05A" },
    ts: { type: "code", color: "#3178C6" },
    html: { type: "code", color: "#E44D26" },
    css: { type: "code", color: "#264DE4" },

    // Archives
    zip: { type: "compressed", color: "#906030" },
    rar: { type: "compressed", color: "#906030" },
    "7z": { type: "compressed", color: "#906030" },

    // Audio/Video
    mp3: { type: "audio", color: "#1ED760" },
    wav: { type: "audio", color: "#1ED760" },
    mp4: { type: "video", color: "#FF4081" },
    mov: { type: "video", color: "#FF4081" },
  };

  return typeMap[extension] || { type: "document", color: "#798082" };
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

type SortField = "name" | "size" | "lastModified";
type SortDirection = "asc" | "desc";

export const SharePointFilePicker: React.FC<SharePointFilePickerProps> = ({
  isOpen,
  onClose,
  onFilesSelected,
  allowedFileTypes = [],
  existingFiles = [],
}) => {
  const { t } = useTranslation();
  const {
    getOneDriveFiles,
    getRecentFiles,
    downloadOneDriveFile,
    downloadDriveItemContent,
    baseUrl,
    getHeaders,
    searchFiles,
    getJoinedTeams,
    getTeamDrive,
    getTeamDriveContents,
    getTeamPhoto,
    getTeamChannels,
    getChannelFiles,
  } = useMsGraphApi();

  // State
  const [files, setFiles] = useState<DriveItem[]>([]);
  const [recentFiles, setRecentFiles] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(25);
  const [totalResults, setTotalResults] = useState(0);
  const [persistentOneDrivePath, setPersistentOneDrivePath] = useState<string>(
    "/me/drive/root/children"
  );
  const [persistentTeamsPaths, setPersistentTeamsPaths] = useState<
    Record<string, string>
  >({});
  const [persistentTeamId, setPersistentTeamId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(
    persistentOneDrivePath
  );
  const [selectedFiles, setSelectedFiles] = useState<DriveItem[]>([]);
  const [pathHistory, setPathHistory] = useState<PathHistoryItem[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, { progress: number; total: number; buffer: number }>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DriveItem[]>([]);
  const [rawSearchResults, setRawSearchResults] = useState<DriveItem[]>([]);
  const [searchError, setSearchError] = useState<boolean>(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [sidebarTab, setSidebarTab] = useState(0);
  const [joinedTeams, setJoinedTeams] = useState<JoinedTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [cachedHeaders, setCachedHeaders] = useState<Headers | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [channelsByTeam, setChannelsByTeam] = useState<
    Record<string, Channel[]>
  >({});
  const [accordionState, setAccordionState] = useState({
    channels: true,
    siteLibrary: true,
  });
  const [teamMainDriveId, setTeamMainDriveId] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMoreResults, setLoadingMoreResults] = useState(false);

  // Add state for duplicate file handling
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState<DriveItem[]>([]);
  const [pendingDownloads, setPendingDownloads] = useState<
    DriveItemWithReplace[]
  >([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState(0);
  const [applyToAll, setApplyToAll] = React.useState<boolean>(false);
  const [actionToApply, setActionToApply] = React.useState<
    "add" | "replace" | "ignore" | null
  >(null);

  // Add React Query hooks
  const { data: channelFoldersData, isLoading: isLoadingChannelFolders } =
    useChannelFolders(
      selectedTeamId,
      selectedTeamId ? channelsByTeam[selectedTeamId] || [] : []
    );

  const currentDriveId = currentPath.match(/\/drives\/([^/]+)/)?.[1] || null;
  const { data: siteLibraryFolders, isLoading: isLoadingSiteLibrary } =
    useSiteLibraryFolders(selectedTeamId, teamMainDriveId);

  // Effects
  useEffect(() => {
    if (isOpen && !cachedHeaders) {
      getHeaders().then((headers) => {
        setCachedHeaders(headers);
        // Initial load after getting headers
        if (sidebarTab === 1) {
          loadJoinedTeams(headers);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCachedHeaders(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setFiles([]);
      setRecentFiles([]);
      setDownloadProgress({});
      setIsDownloading(false);
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && sidebarTab === 1 && cachedHeaders) {
      loadJoinedTeams();
    }
  }, [isOpen, sidebarTab, cachedHeaders]);

  useEffect(() => {
    if (isOpen) {
      if (!persistentTeamId) {
        // No team selected, force OneDrive tab
        if (sidebarTab !== 0) {
          setSidebarTab(0);
        }
        loadRecentFiles();
        if (searchQuery.length < 3) {
          loadFiles();
        }
      } else if (sidebarTab === 1 && cachedHeaders) {
        loadJoinedTeams().then(() => {
          setSelectedTeamId(persistentTeamId);
          loadFiles();
        });
      } else {
        loadRecentFiles();
        if (sidebarTab === 0 && searchQuery.length < 3) {
          loadFiles();
        }
      }
    }
  }, [isOpen, cachedHeaders]);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [currentPath]);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      debouncedSearch(searchQuery);
    }
  }, [fileTypeFilter]);

  // Handlers
  const handleFileTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string
  ) => {
    if (newFilter !== null) {
      setFileTypeFilter(newFilter);
    }
  };

  const handleApplyToAllChange = (apply: boolean) => {
    setApplyToAll(apply);
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setSearchResults([]);
        setRawSearchResults([]);
        setSearchError(false);
        setNextPageToken(undefined);
        setTotalResults(0);
        setCurrentPage(1);
        return;
      }

      setIsSearching(true);
      setSearchError(false);
      try {
        const skipCount = (currentPage - 1) * resultsPerPage;
        const response = await searchFiles(
          query,
          skipCount.toString(),
          resultsPerPage,
          sortField,
          sortDirection,
          fileTypeFilter
        );
        const resultsWithAllowed = response.hits.map((item) => ({
          ...item,
          isAllowed: item.folder || isFileTypeAllowed(item),
        }));
        setRawSearchResults(resultsWithAllowed);
        setSearchResults(resultsWithAllowed);
        setNextPageToken(response.nextPage);
        setTotalResults(response.totalResults);
      } catch (error) {
        console.error("Search error:", error);
        setSearchError(true);
        setSearchResults([]);
        setRawSearchResults([]);
        setNextPageToken(undefined);
        setTotalResults(0);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [currentPage, resultsPerPage, fileTypeFilter, sortField, sortDirection]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  // Add effect after the debouncedSearch definition
  useEffect(() => {
    // Only trigger search if query is 3 or more characters
    if (searchQuery.length >= 3) {
      debouncedSearch(searchQuery);
    }
  }, [currentPage, resultsPerPage]);

  // Add a separate effect for handling search query changes
  useEffect(() => {
    if (searchQuery.length < 3) {
      // Clear search state immediately when query is too short
      setSearchResults([]);
      setRawSearchResults([]);
      setSearchError(false);
      setNextPageToken(undefined);
      setTotalResults(0);
      setCurrentPage(1);
    } else {
      // Trigger debounced search for valid queries
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleFileClick = async (file: DriveItem) => {
    if (file.folder) {
      if (file.isChannel && file.channelId && selectedTeamId) {
        // Handle channel folder click directly using the parentReference from channelFoldersData
        const channelFolder = channelFoldersData?.[file.channelId];
        if (channelFolder?.parentReference?.driveId) {
          const newPath = `/drives/${channelFolder.parentReference.driveId}/items/${channelFolder.id}/children`;
          setPathHistory((prev) => [
            ...prev,
            { path: newPath, name: file.name, isChannel: true },
          ]);
          updatePathForTab(sidebarTab, newPath);
        }
        return;
      }

      // For navigation within a channel folder or site library
      const driveId =
        file.parentReference?.driveId ||
        currentPath.match(/\/drives\/([^/]+)/)?.[1];
      if (!driveId) {
        console.error("No driveId found for folder navigation");
        return;
      }

      const newPath = `/drives/${driveId}/items/${file.id}/children`;
      setFiles([]);
      setPathHistory((prev) => [...prev, { path: newPath, name: file.name }]);
      updatePathForTab(sidebarTab, newPath);
      return;
    }

    if (!isFileTypeAllowed(file)) return;

    const isSelected = selectedFiles.some((f) => f.id === file.id);
    if (isSelected) {
      setSelectedFiles(selectedFiles.filter((f) => f.id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  const handleBack = () => {
    if (pathHistory.length > 0) {
      const newHistory = pathHistory.slice(0, -1);
      setPathHistory(newHistory);

      // If we're going back to root from a channel folder, ensure we use teamMainDriveId
      const lastHistoryItem = pathHistory[pathHistory.length - 1];
      const previousPath =
        newHistory.length > 0
          ? newHistory[newHistory.length - 1].path
          : selectedTeamId && currentPath.includes("/drives/")
          ? `/drives/${teamMainDriveId}/root/children`
          : "/me/drive/root/children";
      updatePathForTab(sidebarTab, previousPath);
    }
  };

  const handleHomeClick = () => {
    setSidebarTab(0);
    const newPath = "/me/drive/root/children";
    updatePathForTab(0, newPath);
    setPathHistory([]);
    setSelectedTeamId(null);
    setPersistentTeamId(null);
    setTeamMainDriveId(null);
    // Clear search state
    setSearchQuery("");
    setSearchResults([]);
    setRawSearchResults([]);
    setIsSearching(false);
    // Ensure files are loaded
    loadFiles();
  };

  const handleTeamClick = async (team: JoinedTeam) => {
    if (!team.driveId) return;
    setSelectedTeamId(team.id);
    setPersistentTeamId(team.id);
    setTeamMainDriveId(team.driveId);

    // Clear search state
    setSearchQuery("");
    setSearchResults([]);
    setRawSearchResults([]);
    setIsSearching(false);

    // Update path first, which will trigger loadFiles through the useEffect
    const defaultTeamPath = `/drives/${team.driveId}/root/children`;
    updatePathForTab(1, defaultTeamPath);
    setPathHistory([]);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSidebarTab(newValue);
    if (newValue === 1) {
      if (persistentTeamId) {
        const resumedPath = persistentTeamsPaths[persistentTeamId];
        if (resumedPath) {
          updatePathForTab(1, resumedPath);
        } else {
          const team = joinedTeams.find((t) => t.id === persistentTeamId);
          if (team?.driveId) {
            updatePathForTab(1, `/drives/${team.driveId}/root/children`);
          }
        }
      }
    }
  };

  const handleConfirm = async () => {
    if (selectedFiles.length === 0) return;

    try {
      // Check for duplicates before downloading
      const potentialDuplicates = selectedFiles.filter((file) =>
        existingFiles.includes(file.name)
      );

      if (potentialDuplicates.length > 0) {
        // Store all selected files for later processing
        setPendingDownloads(selectedFiles as DriveItemWithReplace[]);
        // Store duplicates for confirmation
        setDuplicateFiles(potentialDuplicates);
        // Reset duplicate index
        setCurrentDuplicateIndex(0);
        // Show duplicate confirmation modal
        setDuplicateModalOpen(true);
        return;
      }

      // No duplicates, proceed with downloading
      await downloadAndProcessFiles(selectedFiles);
    } catch (error) {
      console.error("Error processing files:", error);
    }
  };

  // Update the sendFilesToBackend function
  const sendFilesToBackend = async (filesToSend: DriveItem[]) => {
    console.log("Preparing SharePoint files:", filesToSend);

    if (filesToSend.length === 0) {
      console.log("No files to send");
      notificationsService.info(
        t(
          "workspaces:common:sharePointPicker:notifications:noFilesAdded",
          "No files were added"
        )
      );
      return;
    }

    try {
      // Process all files to prepare them for the edit form
      const processedFiles: File[] = [];

      for (const file of filesToSend) {
        try {
          // Create the request payload according to the C# GraphFileDownloadRequest model
          const sharePointMetadata: GraphFileDownloadRequest = {
            fileName: file.name,
            replace: (file as DriveItemWithReplace).replace || false,
            // Initialize with empty strings - will be properly set below if available
            driveId: "",
            itemId: "",
          };

          // Always use driveId + itemId when available
          if (file.parentReference?.driveId && file.id) {
            sharePointMetadata.driveId = file.parentReference.driveId;
            sharePointMetadata.itemId = file.id;
          } else {
            console.error(
              `Unable to determine download method for file: ${file.name}. Missing driveId or itemId.`
            );
            throw new Error(
              `Cannot download file ${file.name}: missing required driveId or itemId properties`
            );
          }

          // Create a File object with the sharePointMetadata property
          const fileObj = new File([new Blob()], file.name, {
            type: "application/octet-stream",
          });

          // Add the metadata to the file object
          Object.defineProperty(fileObj, "sharePointMetadata", {
            value: sharePointMetadata,
            writable: true,
            enumerable: true,
            configurable: true,
          });

          // Add replace flag if needed
          if ((file as DriveItemWithReplace).replace) {
            Object.defineProperty(fileObj, "replace", {
              value: true,
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }

          processedFiles.push(fileObj);
        } catch (error: any) {
          console.error(`Error preparing file ${file.name}:`, error);
          notificationsService.error(
            t("workspaces:common:sharePointPicker:notifications:fileError", {
              fileName: file.name,
              error: error.message || "Unknown error",
            }),
            5000
          );
        }
      }

      // If any files were processed successfully, call the callback with them
      if (processedFiles.length > 0) {
        onFilesSelected(processedFiles);
        notificationsService.success(
          t("workspaces:common:sharePointPicker:notifications:filesAdded")
        );
        onClose();
      } else {
        // No files could be processed
        notificationsService.error(
          t(
            "workspaces:common:sharePointPicker:notifications:noFilesProcessed"
          ) || "No files could be processed",
          4000
        );
      }
    } catch (error: any) {
      console.error("Error preparing SharePoint files:", error);
      notificationsService.error(
        t(
          "workspaces:common:sharePointPicker:notifications:errorProcessingFiles",
          "Error processing files from SharePoint"
        )
      );
    }
  };

  // Replace downloadAndProcessFiles function
  const downloadAndProcessFiles = async (filesToDownload: DriveItem[]) => {
    // Call the new function instead
    await sendFilesToBackend(filesToDownload);
  };

  // Handle adding a duplicate file with a new version
  const handleAddDuplicate = () => {
    if (applyToAll) {
      const updatedPendingDownloads = [...pendingDownloads];
      for (let i = currentDuplicateIndex; i < duplicateFiles.length; i++) {
        const currentDuplicate = duplicateFiles[i];
        console.log("Adding duplicate file:", currentDuplicate.name);

        // Create a versioned filename.
        const fileExtensionMatch = currentDuplicate.name.match(/(\.[^/.]+)$/);
        const fileExtension = fileExtensionMatch ? fileExtensionMatch[0] : "";
        const fileNameWithoutExtension = currentDuplicate.name.replace(
          fileExtension,
          ""
        );
        let version = 2;
        let newFileName = `${fileNameWithoutExtension}_v${version}${fileExtension}`;
        while (existingFiles.includes(newFileName)) {
          version++;
          newFileName = `${fileNameWithoutExtension}_v${version}${fileExtension}`;
        }
        console.log("New versioned filename:", newFileName);

        // Update the file in pendingDownloads.
        const fileIndex = updatedPendingDownloads.findIndex(
          (f) => f.id === currentDuplicate.id
        );
        if (fileIndex !== -1) {
          updatedPendingDownloads[fileIndex] = {
            ...updatedPendingDownloads[fileIndex],
            name: newFileName,
          };
        }
      }
      // Update state and reset duplicate handling.
      setPendingDownloads(updatedPendingDownloads);
      setDuplicateModalOpen(false);
      setCurrentDuplicateIndex(0);
      // Send a single summary notification for all added files.
      notificationsService.success(
        t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.addFilesSummary"
        ),
        4000
      );
    } else {
      // Process just the current duplicate.
      const currentDuplicate = duplicateFiles[currentDuplicateIndex];
      console.log("Adding duplicate file:", currentDuplicate.name);

      const fileExtensionMatch = currentDuplicate.name.match(/(\.[^/.]+)$/);
      const fileExtension = fileExtensionMatch ? fileExtensionMatch[0] : "";
      const fileNameWithoutExtension = currentDuplicate.name.replace(
        fileExtension,
        ""
      );
      let version = 2;
      let newFileName = `${fileNameWithoutExtension}_v${version}${fileExtension}`;
      while (existingFiles.includes(newFileName)) {
        version++;
        newFileName = `${fileNameWithoutExtension}_v${version}${fileExtension}`;
      }
      console.log("New versioned filename:", newFileName);

      const updatedPendingDownloads = [...pendingDownloads];
      const fileIndex = updatedPendingDownloads.findIndex(
        (f) => f.id === currentDuplicate.id
      );
      if (fileIndex !== -1) {
        updatedPendingDownloads[fileIndex] = {
          ...updatedPendingDownloads[fileIndex],
          name: newFileName,
        };
        setPendingDownloads(updatedPendingDownloads);
        console.log("Updated pendingDownloads:", updatedPendingDownloads);
      }
      // Send individual notification.
      notificationsService.success(
        `${t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.add"
        )} ${newFileName}`,
        4000
      );
      handleNextDuplicate();
    }
  };

  // Handle replacing an existing file duplicate
  const handleReplaceDuplicate = () => {
    if (applyToAll) {
      // Process all remaining duplicates.
      const updatedPendingDownloads = [...pendingDownloads];
      for (let i = currentDuplicateIndex; i < duplicateFiles.length; i++) {
        const currentFile = duplicateFiles[i];
        console.log("Replacing file:", currentFile.name);

        // Update the file in pendingDownloads to set replace = true
        const fileIndex = updatedPendingDownloads.findIndex(
          (f) => f.id === currentFile.id
        );
        if (fileIndex !== -1) {
          updatedPendingDownloads[fileIndex] = {
            ...updatedPendingDownloads[fileIndex],
            replace: true,
          };
        }
      }
      setPendingDownloads(updatedPendingDownloads);
      setDuplicateModalOpen(false);
      setCurrentDuplicateIndex(0);
      // Send a single summary notification for all replaced files.
      notificationsService.success(
        t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.replaceFilesSummary"
        ),
        4000
      );
    } else {
      // Process only the current duplicate.
      const currentFile = duplicateFiles[currentDuplicateIndex];
      console.log("Replacing file:", currentFile.name);

      // Update the file in pendingDownloads to set replace = true
      const updatedPendingDownloads = [...pendingDownloads];
      const fileIndex = updatedPendingDownloads.findIndex(
        (f) => f.id === currentFile.id
      );
      if (fileIndex !== -1) {
        updatedPendingDownloads[fileIndex] = {
          ...updatedPendingDownloads[fileIndex],
          replace: true,
        };
        setPendingDownloads(updatedPendingDownloads);
      }

      notificationsService.success(
        `${t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.replace.textOne"
        )} ${currentFile.name} ${t(
          "workspaces:singleWorkspace.modals.filesUploadModal.notifications.replace.textTwo"
        )}`,
        4000
      );
      handleNextDuplicate();
    }
  };

  // Handle ignoring a duplicate file
  const handleIgnoreDuplicate = () => {
    if (applyToAll) {
      // Remove all remaining duplicates from pendingDownloads.
      const remainingIds = duplicateFiles
        .slice(currentDuplicateIndex)
        .map((f) => f.id);
      const updatedPendingDownloads = pendingDownloads.filter(
        (f) => !remainingIds.includes(f.id)
      );
      setPendingDownloads(updatedPendingDownloads);
      console.log(
        "Updated pendingDownloads after ignore:",
        updatedPendingDownloads
      );
      setDuplicateModalOpen(false);
      setCurrentDuplicateIndex(0);
    } else {
      // Process only the current duplicate.
      const currentFile = duplicateFiles[currentDuplicateIndex];
      console.log("Ignoring file:", currentFile.name);
      const updatedPendingDownloads = pendingDownloads.filter(
        (f) => f.id !== currentFile.id
      );
      setPendingDownloads(updatedPendingDownloads);
      console.log(
        "Updated pendingDownloads after ignore:",
        updatedPendingDownloads
      );
      handleNextDuplicate();
    }
  };

  // Move to the next duplicate or finish the process
  const handleNextDuplicate = () => {
    const nextIndex = currentDuplicateIndex + 1;
    if (nextIndex < duplicateFiles.length) {
      setCurrentDuplicateIndex(nextIndex);
      console.log("Moving to next duplicate, index:", nextIndex);
    } else {
      // No more duplicates to process, close modal.
      setDuplicateModalOpen(false);
      console.log("All duplicates handled, modal closed");
    }
  };
  // Add a useEffect to watch for changes to duplicateModalOpen
  // This ensures we have the latest pendingDownloads state when the modal is closed
  useEffect(() => {
    if (
      !duplicateModalOpen &&
      pendingDownloads.length > 0 &&
      duplicateFiles.length > 0
    ) {
      // Only run this when the modal is closed after handling duplicates
      console.log("Modal closed, proceeding with download");
      console.log("Final pendingDownloads:", pendingDownloads);

      // Clear the duplicate files to prevent this from running again
      setDuplicateFiles([]);

      // Download and process the remaining files
      downloadAndProcessFiles(pendingDownloads);
    }
  }, [duplicateModalOpen]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortFiles = (files: DriveItem[]) => {
    return [...files].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "size":
          return multiplier * ((a.size || 0) - (b.size || 0));
        case "lastModified":
          const dateA = new Date(a.lastModifiedDateTime || 0).getTime();
          const dateB = new Date(b.lastModifiedDateTime || 0).getTime();
          return multiplier * (dateA - dateB);
        default:
          return 0;
      }
    });
  };

  // Helper functions
  // Note: Download functionality is now handled by the backend using driveId and itemId.
  // The streamDownload function has been removed as it's no longer used.

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // This will trigger a new search due to the dependency in debouncedSearch
  };

  const handleResultsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newResultsPerPage = parseInt(event.target.value, 10);
    setResultsPerPage(newResultsPerPage);
    setCurrentPage(1); // Reset to first page when changing results per page
  };

  const loadMoreResults = async () => {
    if (!nextPageToken || loadingMoreResults || searchQuery.length < 3) return;

    try {
      setLoadingMoreResults(true);
      const response = await searchFiles(
        searchQuery,
        nextPageToken,
        resultsPerPage,
        sortField,
        sortDirection
      );
      const newResultsWithAllowed = response.hits.map((item) => ({
        ...item,
        isAllowed: item.folder || isFileTypeAllowed(item),
      }));

      setRawSearchResults((prev) => [...prev, ...newResultsWithAllowed]);
      setNextPageToken(response.nextPage);
      setSearchResults((prev) => [
        ...prev,
        ...filterFilesByType(newResultsWithAllowed),
      ]);
    } catch (error) {
      console.error("Error loading more results:", error);
      notificationsService.error(
        t(
          "workspaces:common:sharePointPicker:notifications:errorLoadingMoreResults"
        )
      );
    } finally {
      setLoadingMoreResults(false);
    }
  };

  const isFileTypeAllowed = (file: DriveItem) => {
    if (file.folder) return true;
    if (!allowedFileTypes?.length) return true;

    const extension = file.name.split(".").pop()?.toLowerCase();
    return allowedFileTypes.some(
      (type) => type.fileExtension.toLowerCase() === `.${extension}`
    );
  };

  const filterFilesByType = (files: DriveItem[]) => {
    if (fileTypeFilter === "all") return files;

    // Convert the fileTypeFilter to lowercase to match the keys in fileTypeGroups
    const key = fileTypeFilter.toLowerCase();
    const group = fileTypeGroups[key as keyof typeof fileTypeGroups];
    if (!group) return files;

    const extensions = group.extensions;
    return files.filter((file) => {
      if (file.folder) return true;
      const fileName = file.name.toLowerCase();
      return extensions.some((ext) => fileName.endsWith(ext));
    });
  };

  const updatePathForTab = (targetTab: number, newPath: string) => {
    setCurrentPath(newPath);
    if (targetTab === 0) {
      setPersistentOneDrivePath(newPath);
    } else if (targetTab === 1 && persistentTeamId) {
      setPersistentTeamsPaths((prev) => ({
        ...prev,
        [persistentTeamId]: newPath,
      }));
    }
  };

  const throttleRequests = async <T,>(
    items: any[],
    batchSize: number,
    requestFn: (item: any) => Promise<T>
  ): Promise<T[]> => {
    const results: T[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(requestFn));
      results.push(...batchResults);
      // Add a small delay between batches if needed
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return results;
  };

  const loadFiles = async () => {
    if (!cachedHeaders) return;

    try {
      setLoading(true);
      setFiles([]);

      // If we're in a team context and at root level
      if (selectedTeamId && currentPath.endsWith("/root/children")) {
        if (!channelsByTeam[selectedTeamId]) {
          try {
            const channelsData = await fetch(
              `${baseUrl}/teams/${selectedTeamId}/channels`,
              { headers: cachedHeaders }
            )
              .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch channels");
                return res.json();
              })
              .then((data) => data.value as Channel[]);

            // Update channelsByTeam for the selected team to trigger useChannelFolders
            setChannelsByTeam((prev) => ({
              ...prev,
              [selectedTeamId]: channelsData,
            }));
          } catch (error) {
            console.error("Error loading channels:", error);
            setChannelsByTeam((prev) => ({
              ...prev,
              [selectedTeamId]: [],
            }));
          }
        } else {
          // Channels already loaded for this team, do nothing
          console.log(
            `Channels for team ${selectedTeamId} are already loaded.`
          );
        }
      } else {
        // Regular file loading for non-root or non-team paths
        const response = await fetch(`${baseUrl}${currentPath}`, {
          headers: cachedHeaders,
        });
        const data = await response.json();
        const items = data.value;

        const itemsWithAllowed = items.map((item: DriveItem) => ({
          ...item,
          isAllowed: item.folder || isFileTypeAllowed(item),
        }));
        setFiles(itemsWithAllowed);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      notificationsService.error(
        t("workspaces:common:sharePointPicker:notifications:errorLoadingFiles")
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRecentFiles = async () => {
    try {
      setLoadingRecent(true);
      const items = await getRecentFiles();
      const itemsWithAllowed = items.map((item) => ({
        ...item,
        isAllowed: item.folder || isFileTypeAllowed(item),
      }));
      setRecentFiles(itemsWithAllowed);
    } catch (error) {
      console.error("Error loading recent files:", error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const loadJoinedTeams = async (headers?: Headers) => {
    if (!headers && !cachedHeaders) return;
    const useHeaders = headers || cachedHeaders!;

    try {
      setLoadingTeams(true);

      const teamsResponse = await fetch(`${baseUrl}/me/joinedTeams`, {
        headers: useHeaders,
      });
      if (!teamsResponse.ok) {
        throw new Error("Failed to fetch joined teams");
      }
      const teamsData = await teamsResponse.json();
      const teams = teamsData.value;

      const teamsWithDrives = await Promise.all(
        teams.map(async (team: JoinedTeam) => {
          try {
            const [driveResponse, photoResponse] = await Promise.all([
              fetch(`${baseUrl}/groups/${team.id}/drive`, {
                headers: useHeaders,
              }),
              fetch(`${baseUrl}/teams/${team.id}/photo/$value`, {
                headers: useHeaders,
              }),
            ]);

            const driveData = driveResponse.ok
              ? await driveResponse.json()
              : null;
            const photoBlob =
              photoResponse.status === 200 ? await photoResponse.blob() : null;
            const photoUrl = photoBlob
              ? URL.createObjectURL(photoBlob)
              : undefined;

            return {
              ...team,
              driveId: driveData?.id,
              photoUrl,
            };
          } catch (error) {
            console.error(`Error fetching data for team ${team.id}:`, error);
            return team;
          }
        })
      );

      setJoinedTeams(teamsWithDrives);
    } catch (error) {
      console.error("Error loading joined teams:", error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (searchQuery.length >= 3) return [];

    let items: BreadcrumbItem[] = [];
    const driveId = currentPath.match(/\/drives\/([^/]+)/)?.[1];

    if (selectedTeamId && driveId) {
      const selectedTeam = joinedTeams.find(
        (team) => team.id === selectedTeamId
      );
      if (selectedTeam) {
        items.push({
          label: selectedTeam.displayName,
          path: `/drives/${driveId}/root/children`,
          isLast: pathHistory.length === 0,
        });
      }
    } else {
      items.push({
        label: t("common:sharePointPicker:breadcrumbs:myFiles"),
        path: "/me/drive/root/children",
        isLast: pathHistory.length === 0,
      });
    }

    pathHistory.forEach((historyItem, index) => {
      items.push({
        label: historyItem.name,
        path: historyItem.path,
        isLast: index === pathHistory.length - 1,
      });
    });

    return items;
  };

  const handleBreadcrumbClick = (path: string) => {
    if (path === "/me/drive/root/children" || path.endsWith("/root/children")) {
      setPathHistory([]);
    } else {
      const index = pathHistory.findIndex((item) => item.path === path);
      if (index !== -1) {
        setPathHistory(pathHistory.slice(0, index + 1));
      }
    }
    updatePathForTab(sidebarTab, path);
  };

  if (!isOpen) return null;

  return (
    <ModalContainer
      open={isOpen}
      onClose={onClose}
      title={t("workspaces:common.sharePointPicker.title")}
      width="max-w-7xl"
    >
      <div className="flex flex-col h-[calc(90vh-80px)] sm:h-[calc(95vh-60px)] md:h-[calc(90vh-70px)]">
        <div className="flex-1 min-h-0">
          <Box className="flex h-full">
            <Sidebar
              sidebarTab={sidebarTab}
              onTabChange={handleTabChange}
              recentFiles={recentFiles}
              loadingRecent={loadingRecent}
              joinedTeams={joinedTeams}
              loadingTeams={loadingTeams}
              selectedTeamId={selectedTeamId}
              onFileClick={handleFileClick}
              onTeamClick={handleTeamClick}
              selectedFiles={selectedFiles}
            />

            {/* Main content */}
            <Box className="flex flex-col flex-grow min-h-0 min-w-0">
              {/* Top header with buttons and search */}
              <Box className="border-b border-[rgba(237,237,237,0.1)] h-[52px] flex items-center justify-between bg-gray-600">
                <div className="flex items-center h-full">
                  <button
                    onClick={handleHomeClick}
                    className="text-white-100 hover:text-white-100 font-body text-sm flex items-center gap-2 px-4 h-full animate-[fadeIn_200ms_ease-in-out]"
                  >
                    <BsFillCloudyFill size={20} />
                    OneDrive
                  </button>
                  <div />
                  {pathHistory.length > 0 && searchQuery.length < 3 && (
                    <button
                      onClick={handleBack}
                      className="h-[78%] border border-[rgba(237,237,237,0.1)] bg-gray-400 rounded-lg text-white-100 hover:text-white-100 font-body text-sm flex items-center gap-2 px-4 animate-[fadeIn_200ms_ease-in-out]"
                    >
                      <PiArrowElbowLeftUpBold size={20} />
                      {t("workspaces:common:sharePointPicker:back")}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 px-4">
                  <FileTypeFilter
                    fileTypeFilter={fileTypeFilter}
                    onFilterChange={handleFileTypeChange}
                  />
                  <SearchBar
                    searchQuery={searchQuery}
                    isSearching={isSearching}
                    onSearchChange={handleSearchChange}
                    onClearSearch={handleClearSearch}
                  />
                </div>
              </Box>

              {/* Breadcrumbs */}
              {!isSearching && (
                <div className="flex items-center w-full px-4 py-2 border-b border-[rgba(237,237,237,0.1)] text-sm font-body bg-gray-600">
                  <Breadcrumbs
                    items={getBreadcrumbs()}
                    loading={loading}
                    onBreadcrumbClick={handleBreadcrumbClick}
                  />
                </div>
              )}

              {/* File List */}
              <Box className="flex flex-col flex-1 min-h-0">
                <FileListHeader
                  loading={loading}
                  isSearching={isSearching}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <Box className="flex-1 overflow-auto min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(237,237,237,0.1)] hover:scrollbar-thumb-[rgba(237,237,237,0.2)]">
                  {selectedTeamId &&
                  currentPath.endsWith("/root/children") &&
                  searchQuery.length < 3 ? (
                    <Box className="p-4 space-y-2">
                      <Accordion
                        expanded={accordionState.channels}
                        onChange={(_, isExpanded) =>
                          setAccordionState((prev) => ({
                            ...prev,
                            channels: isExpanded,
                          }))
                        }
                        sx={{
                          background: "transparent",
                          boxShadow: "none",
                          "&:before": { display: "none" },
                          "& .MuiAccordionSummary-root": {
                            minHeight: "48px",
                            height: "48px",
                            "&.Mui-expanded": {
                              minHeight: "48px",
                              height: "48px",
                            },
                            padding: "0 16px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(237,237,237,0.05)",
                            "&:hover": {
                              backgroundColor: "rgba(237,237,237,0.1)",
                            },
                          },
                          "& .MuiAccordionSummary-content": {
                            margin: "8px 0",
                            "&.Mui-expanded": {
                              margin: "8px 0",
                            },
                          },
                          "& .MuiAccordionDetails-root": {
                            padding: 0,
                          },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={
                            <FaChevronDown className="text-white-100 text-sm" />
                          }
                          className="border-b border-[rgba(237,237,237,0.1)]"
                        >
                          <Typography className="text-white-100 font-body text-sm font-medium">
                            {t("workspaces:common:sharePointPicker:inChannels")}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <FileList
                            files={sortFiles(
                              (channelsByTeam[selectedTeamId] || [])
                                .map(
                                  (channel) => channelFoldersData?.[channel.id]
                                )
                                .filter(
                                  (folder): folder is DriveItem =>
                                    folder !== undefined
                                )
                                .map((folder) => ({
                                  ...folder,
                                  isAllowed: true, // Force folders to be allowed
                                }))
                            )}
                            selectedFiles={selectedFiles}
                            loading={isLoadingChannelFolders}
                            isDownloading={isDownloading}
                            downloadProgress={downloadProgress}
                            isSearching={false}
                            searchError={false}
                            searchQuery=""
                            searchResults={[]}
                            onFileClick={handleFileClick}
                          />
                        </AccordionDetails>
                      </Accordion>
                      <Accordion
                        expanded={accordionState.siteLibrary}
                        onChange={(_, isExpanded) =>
                          setAccordionState((prev) => ({
                            ...prev,
                            siteLibrary: isExpanded,
                          }))
                        }
                        sx={{
                          background: "transparent",
                          boxShadow: "none",
                          "&:before": { display: "none" },
                          "& .MuiAccordionSummary-root": {
                            minHeight: "48px",
                            height: "48px",
                            "&.Mui-expanded": {
                              minHeight: "48px",
                              height: "48px",
                            },
                            padding: "0 16px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(237,237,237,0.05)",
                            "&:hover": {
                              backgroundColor: "rgba(237,237,237,0.1)",
                            },
                          },
                          "& .MuiAccordionSummary-content": {
                            margin: "8px 0",
                            "&.Mui-expanded": {
                              margin: "8px 0",
                            },
                          },
                          "& .MuiAccordionDetails-root": {
                            padding: 0,
                          },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={
                            <FaChevronDown className="text-white-100 text-sm" />
                          }
                          className="border-b border-[rgba(237,237,237,0.1)]"
                        >
                          <Typography className="text-white-100 font-body text-sm font-medium">
                            {t(
                              "workspaces:common:sharePointPicker:inSiteLibrary"
                            )}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {searchQuery.length >= 3 ? (
                            <FileList
                              files={sortFiles(searchResults)}
                              selectedFiles={selectedFiles}
                              loading={loading}
                              isDownloading={isDownloading}
                              downloadProgress={downloadProgress}
                              isSearching={isSearching}
                              searchError={searchError}
                              searchQuery={searchQuery}
                              searchResults={searchResults}
                              onFileClick={handleFileClick}
                            />
                          ) : (
                            <FileList
                              files={sortFiles(
                                filterFilesByType(siteLibraryFolders || [])
                              )}
                              selectedFiles={selectedFiles}
                              loading={isLoadingSiteLibrary}
                              isDownloading={isDownloading}
                              downloadProgress={downloadProgress}
                              isSearching={isSearching}
                              searchError={searchError}
                              searchQuery={searchQuery}
                              searchResults={searchResults}
                              onFileClick={handleFileClick}
                            />
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  ) : (
                    <FileList
                      files={sortFiles(
                        searchQuery.length >= 3
                          ? searchResults
                          : filterFilesByType(files)
                      )}
                      selectedFiles={selectedFiles}
                      loading={loading}
                      isDownloading={isDownloading}
                      downloadProgress={downloadProgress}
                      isSearching={isSearching}
                      searchError={searchError}
                      searchQuery={searchQuery}
                      searchResults={searchResults}
                      onFileClick={handleFileClick}
                    />
                  )}
                </Box>
                {searchQuery.length >= 3 &&
                  !searchError &&
                  searchResults.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t border-[rgba(237,237,237,0.1)] bg-gray-600">
                      <div className="flex items-center gap-4">
                        <select
                          value={resultsPerPage}
                          onChange={handleResultsPerPageChange}
                          className="bg-gray-400 text-white-100 rounded-lg px-3 py-2 text-sm font-body"
                        >
                          <option value={25}>25 per page</option>
                          <option value={50}>50 per page</option>
                          <option value={100}>100 per page</option>
                        </select>
                        <span className="text-white-100 text-sm font-body">
                          {t(
                            "workspaces:common:sharePointPicker:pagination:showing",
                            {
                              start: (currentPage - 1) * resultsPerPage + 1,
                              end: Math.min(
                                currentPage * resultsPerPage,
                                totalResults
                              ),
                              total: totalResults,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 rounded-lg bg-gray-400 text-white-100 hover:bg-gray-650 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t(
                            "workspaces:common:sharePointPicker:pagination:previous"
                          )}
                        </button>
                        <span className="text-white-100 text-sm font-body">
                          {t(
                            "workspaces:common:sharePointPicker:pagination:page",
                            {
                              current: currentPage,
                              total: Math.ceil(totalResults / resultsPerPage),
                            }
                          )}
                        </span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={
                            currentPage >=
                            Math.ceil(totalResults / resultsPerPage)
                          }
                          className="px-3 py-2 rounded-lg bg-gray-400 text-white-100 hover:bg-gray-650 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t(
                            "workspaces:common:sharePointPicker:pagination:next"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
              </Box>
            </Box>
          </Box>
        </div>

        {/* Selected Files */}
        <SelectedFiles
          selectedFiles={selectedFiles}
          onRemoveFile={(fileId) =>
            setSelectedFiles(selectedFiles.filter((f) => f.id !== fileId))
          }
        />

        {/* Buttons Section */}
        <div className="flex justify-end gap-3 p-4 border-t border-[rgba(237,237,237,0.1)]">
          <button
            onClick={onClose}
            className="flex place-content-center rounded-full px-6 py-3 bg-gray-400 text-white-100 hover:bg-gray-650 hover:text-white-100
              focus:bg-gray-650 focus:text-white-100 font-body transition-all duration-300 ease-in-out place-items-center"
          >
            {t("workspaces:common.sharePointPicker.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedFiles.length === 0 || loading}
            className="flex place-content-center rounded-full px-6 py-3 bg-white-200 hover:bg-red-700 hover:text-white-100 font-body text-gray-600 font-semibold transition-all duration-300 ease-in-out place-items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("workspaces:common.sharePointPicker.confirm")}
          </button>
        </div>

        {/* Duplicate File Modal */}
        {duplicateModalOpen && duplicateFiles.length > 0 && (
          <FileUploadModal
            open={duplicateModalOpen}
            duplicateFileName={
              duplicateFiles[currentDuplicateIndex]?.name || ""
            }
            onAdd={handleAddDuplicate}
            onIgnore={handleIgnoreDuplicate}
            onReplace={handleReplaceDuplicate}
            onClose={() => setDuplicateModalOpen(false)}
            onApplyToAllChange={handleApplyToAllChange}
          />
        )}
      </div>
    </ModalContainer>
  );
};
