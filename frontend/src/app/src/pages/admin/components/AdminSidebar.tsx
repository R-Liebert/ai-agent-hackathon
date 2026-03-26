import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";
import {
  TbGraph,
  TbClock,
  TbChartBar,
  TbSettings,
  TbChevronDown,
  TbChevronRight,
  TbShare,
  TbHome,
  TbBuildingCommunity,
  TbEye,
  TbTool,
  TbMessageStar,
  TbThumbUp,
  TbServer,
  TbListCheck,
  TbBell,
  TbDatabase,
  TbDownload,
} from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Tooltip from "../../../components/Global/Tooltip";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ReactElement;
  items?: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactElement;
  description?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const menuSections: MenuSection[] = [
    {
      id: "overview",
      title: "Overview",
      icon: <TbTool size={22} />,
      items: [
        {
          id: "landing",
          title: "Dashboard",
          icon: <TbHome size={20} />,
          description: "Admin dashboard overview",
        },
      ],
    },
    {
      id: "sharepoint-sync",
      title: "SharePoint Sync",
      icon: <TbShare size={22} />,
      items: [
        {
          id: "graph-subscriptions",
          title: "Graph Subscriptions",
          icon: <TbGraph size={20} />,
          description: "Manage Microsoft Graph subscriptions",
        },
        {
          id: "retry-management",
          title: "Retry Management",
          icon: <TbClock size={20} />,
          description: "Monitor and manage failed retry attempts",
        },
        {
          id: "statistics",
          title: "Statistics",
          icon: <TbChartBar size={20} />,
          description: "View comprehensive analytics and metrics",
        },
        {
          id: "job-control",
          title: "Job Control",
          icon: <TbSettings size={20} />,
          description: "Execute maintenance and cleanup operations",
        },
      ],
    },
    {
      id: "workspaces",
      title: "Workspaces",
      icon: <TbBuildingCommunity size={22} />,
      items: [
        {
          id: "workspaces-browse",
          title: "Browse",
          icon: <TbEye size={20} />,
          description: "Browse and manage workspaces",
        },
      ],
    },
    {
      id: "feedback",
      title: "Feedback & Analytics",
      icon: <TbMessageStar size={22} />,
      items: [
        {
          id: "message-ratings",
          title: "Message Ratings",
          icon: <TbThumbUp size={20} />,
          description: "View and export message feedback",
        },
      ],
    },
    {
      id: "system",
      title: "System",
      icon: <TbServer size={22} />,
      items: [
        {
          id: "background-jobs",
          title: "Background Jobs",
          icon: <TbListCheck size={20} />,
          description: "Monitor and manage background jobs",
        },
        {
          id: "research-exports",
          title: "Research Exports",
          icon: <TbDownload size={20} />,
          description: "Queue and download research exports",
        },
        {
          id: "launchpad-settings",
          title: "Launchpad Settings",
          icon: <TbSettings size={20} />,
          description: "Manage Launchpad feature rollout settings",
        },
        {
          id: "migrations",
          title: "Migrations",
          icon: <TbDatabase size={20} />,
          description: "Run data migrations and backfills",
        },
        {
          id: "maintenance-alerts",
          title: "Maintenance & Alerts",
          icon: <TbBell size={20} />,
          description: "Manage site-wide alerts and maintenance messages",
        },
      ],
    },
  ];

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleItemClick = (itemId: string) => {
    onSectionChange(itemId);
  };

  const sidebarContent = (
    <Box sx={{ width: 280, height: "100%", overflowX: "hidden" }}>
      {/* Header */}
      <Box
        className="!bg-gray-600"
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Tooltip text="Return to Home" placement="right" useMui>
          <IconButton
            onClick={() => navigate("/")}
            size="small"
            sx={{
              color: "#EDEDED",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
              },
            }}
          >
            <TbHome size={20} />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" className="!text-white-100 !font-headers">
          Admin Dashboard
        </Typography>
        <Box sx={{ width: 28 }} /> {/* Spacer for centering */}
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <List disablePadding>
          {menuSections.map((section) => (
            <React.Fragment key={section.id}>
              {/* Section Header */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleSectionToggle(section.id)}
                  className="hover:!bg-gray-650"
                  sx={{
                    py: 1.5,
                    borderLeft: "3px solid transparent",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box className="text-white-100">{section.icon}</Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        className="!text-white-100 !font-body"
                        fontWeight={500}
                      >
                        {section.title}
                      </Typography>
                    }
                  />
                  <Box className="text-white-100">
                    {expandedSections.includes(section.id) ? (
                      <TbChevronDown size={16} />
                    ) : (
                      <TbChevronRight size={16} />
                    )}
                  </Box>
                </ListItemButton>
              </ListItem>

              {/* Section Items */}
              {section.items && (
                <Collapse
                  in={expandedSections.includes(section.id)}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {section.items.map((item) => (
                      <ListItem key={item.id} disablePadding>
                        <ListItemButton
                          selected={activeSection === item.id}
                          onClick={() => handleItemClick(item.id)}
                          className="hover:!bg-gray-650"
                          sx={{
                            pl: 4,
                            py: 1,
                            borderLeft: "3px solid",
                            borderColor:
                              activeSection === item.id
                                ? "#60a5fa"
                                : "transparent",
                            backgroundColor:
                              activeSection === item.id
                                ? "#404040"
                                : "transparent",
                            maxWidth: "100%",
                            overflow: "hidden",
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box
                              sx={{
                                color:
                                  activeSection === item.id
                                    ? "#60a5fa"
                                    : "#EDEDED",
                              }}
                            >
                              {item.icon}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            sx={{
                              overflow: "hidden",
                              wordWrap: "break-word",
                              minWidth: 0,
                            }}
                            primary={
                              <Typography
                                sx={{
                                  color:
                                    activeSection === item.id
                                      ? "#FFFFFF"
                                      : "#EDEDED",
                                  fontWeight:
                                    activeSection === item.id ? 500 : 400,
                                  wordWrap: "break-word",
                                }}
                                className="!font-body"
                              >
                                {item.title}
                              </Typography>
                            }
                            secondary={
                              item.description && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color:
                                      activeSection === item.id
                                        ? "#bfbfbf"
                                        : "#9ca3af",
                                    wordWrap: "break-word",
                                  }}
                                  className="!font-body"
                                >
                                  {item.description}
                                </Typography>
                              )
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {/* Divider after section */}
              <Divider sx={{ borderColor: "#3A3A3D", mx: 2, my: 1 }} />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      className="!bg-transparent"
      sx={{
        width: 280,
        flexShrink: 0,
        overflow: "hidden",
        "& .MuiDrawer-paper": {
          width: 280,
          boxSizing: "border-box",
          backgroundColor: "#1a1a1a",
          backgroundImage: "none",
          border: "1px solid #3A3A3D",
          borderLeft: "none",
          borderTop: "none",
          borderBottom: "none",
          position: "fixed",
          height: "100vh",
          top: 0,
          left: 0,
          zIndex: 1200,
          overflow: "hidden",
          overflowY: "auto",
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default AdminSidebar;
