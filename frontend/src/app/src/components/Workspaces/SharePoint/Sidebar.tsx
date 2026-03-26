import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { FaClock, FaUsers, FaFolder } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { DriveItem, JoinedTeam } from "./types";
import { FileIcon } from "react-file-icon";
import { getFileExtension, getFileIconProps } from "./utils";

interface SidebarProps {
  sidebarTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  recentFiles: DriveItem[];
  loadingRecent: boolean;
  joinedTeams: JoinedTeam[];
  loadingTeams: boolean;
  selectedTeamId: string | null;
  onFileClick: (file: DriveItem) => void;
  onTeamClick: (team: JoinedTeam) => void;
  selectedFiles: DriveItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarTab,
  onTabChange,
  recentFiles,
  loadingRecent,
  joinedTeams,
  loadingTeams,
  selectedTeamId,
  onFileClick,
  onTeamClick,
  selectedFiles,
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

  return (
    <Box className="w-[300px] flex-shrink-0 border-r border-[rgba(237,237,237,0.1)] bg-transparent flex flex-col">
      <Tabs
        value={sidebarTab}
        onChange={onTabChange}
        aria-label="sidebar tabs"
        className="border-b border-[rgba(237,237,237,0.1)]"
        variant="fullWidth"
        sx={{
          minHeight: "52px",
          "& .MuiTabs-indicator": {
            backgroundColor: "white",
          },
          "& .MuiTabs-flexContainer": {
            height: "100%",
          },
          "& .MuiTab-root": {
            color: "rgba(255, 255, 255, 0.7)",
            minHeight: "52px",
            width: "50%",
            "&.Mui-selected": {
              color: "white",
              backgroundColor: "#424242",
            },
          },
        }}
      >
        <Tab
          icon={<FaClock size={16} />}
          label={t("common:sharePointPicker:tabs:recent")}
          className="!font-body !text-sm !min-h-[52px] !flex !items-center !justify-center"
          iconPosition="start"
          sx={{
            "& .MuiTab-iconWrapper": {
              marginRight: "8px",
              marginBottom: "0 !important",
            },
          }}
        />
        <Tab
          icon={<FaUsers size={16} />}
          label={t("common:sharePointPicker:tabs:teams")}
          className="!font-body !text-sm !min-h-[52px] !flex !items-center !justify-center"
          iconPosition="start"
          sx={{
            "& .MuiTab-iconWrapper": {
              marginRight: "8px",
              marginBottom: "0 !important",
            },
          }}
        />
      </Tabs>

      <Box className="flex-1 overflow-auto min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(237,237,237,0.1)] hover:scrollbar-thumb-[rgba(237,237,237,0.2)]">
        {sidebarTab === 0 ? (
          loadingRecent ? (
            <Box className="flex justify-center items-center h-full animate-[fadeIn_200ms_ease-in-out]">
              <CircularProgress size={48} sx={{ color: "white" }} />
            </Box>
          ) : (
            <List dense className="p-0 !font-body ">
              {recentFiles.map((file) => {
                const isAllowed = file.isAllowed;
                return (
                  <ListItem
                    key={file.id}
                    className={`!py-3.5 min-h-[48px] !font-body  ${
                      isAllowed
                        ? "hover:bg-[rgba(237,237,237,0.05)] aria-selected:bg-[rgba(237,237,237,0.1)] active:bg-[rgba(237,237,237,0.1)] transition-all duration-200 ease-in-out cursor-pointer"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    button
                    onClick={() => onFileClick(file)}
                    selected={selectedFiles.some((f) => f.id === file.id)}
                  >
                    <ListItemIcon className="min-w-[40px] flex items-center ml-1 -mr-3">
                      {file.folder ? (
                        <FaFolder className="text-white-100" size={24} />
                      ) : (
                        renderFileIcon(file.name)
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      primaryTypographyProps={{
                        sx: { fontWeight: 500, fontFamily: "Nunito Sans" },
                      }}
                      className={`truncate font-body text-sm ${
                        isAllowed ? "text-white-100" : "text-white-100/50"
                      }`}
                    />
                  </ListItem>
                );
              })}
            </List>
          )
        ) : loadingTeams ? (
          <Box className="flex justify-center items-center h-full animate-[fadeIn_200ms_ease-in-out]">
            <CircularProgress size={48} sx={{ color: "white" }} />
          </Box>
        ) : (
          <List dense className="p-0">
            {joinedTeams.map((team) => (
              <ListItem
                key={team.id}
                className={`!py-3.5 min-h-[48px] !font-body transition-all duration-200 ease-in-out animate-[fadeIn_200ms_ease-in-out] ${
                  selectedTeamId === team.id
                    ? "bg-[rgba(237,237,237,0.1)]"
                    : "hover:bg-[rgba(237,237,237,0.05)]"
                }`}
                button
                onClick={() => onTeamClick(team)}
                selected={selectedTeamId === team.id}
              >
                <ListItemIcon className="min-w-[40px] flex items-center ml-1 -mr-1">
                  {team.photoUrl ? (
                    <div className="w-8 h-8 rounded-md overflow-hidden">
                      <img
                        src={team.photoUrl}
                        alt={team.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <FaUsers className="text-white-100" size={24} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={team.displayName}
                  primaryTypographyProps={{
                    sx: { fontWeight: 600, fontFamily: "Nunito Sans" },
                  }}
                  className="truncate font-body text-sm text-white-100"
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};
