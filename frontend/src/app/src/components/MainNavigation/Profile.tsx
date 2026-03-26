import React, { useCallback, useRef, useState, useEffect } from "react";
import DropdownMenuButton from "../Global/DropdownMenuButton";
import SettingsModal from "./components/SettingsModal";
import CustomizeChatGPT from "./components/CustomizeChatGPT";
import MobileProfileModal from "./MobileProfileModal";
import {
  TbMessage2Heart,
  TbFileText,
  TbStack2,
  TbSettings,
  TbMessage2Cog,
  TbVocabulary,
  TbCalendarHeart,
  TbDashboard,
} from "react-icons/tb";
import ErrorBoundary from "../../utils/error-boundary";
import FallbackComponent from "./components/FallbackComponent";
import { StyledPopover } from "../StyledPopover";
import Tooltip from "../Global/Tooltip";
import { useTranslation } from "react-i18next";
import launchpadMetrics from "../../services/launchpadMetrics";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "../../contexts/AuthProvider";

interface ProfileDropdownProps {
  profileName?: string | null;
  profilePhoto?: string | null;
  userId: string;
  showProfileDetails?: boolean;
  isInSidebar?: boolean;
  isMobile?: boolean;
  onMobileMenuItemClick?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  profileName,
  profilePhoto,
  userId,
  showProfileDetails = false,
  isInSidebar = false,
  isMobile = false,
  onMobileMenuItemClick,
}) => {
  const isAdmin = useIsAdmin();
  const [profileDropdown, setProfileDropdown] = useState<boolean>(false);
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [openPopupPersonaConfig, setOpenPopupPersonaConfig] =
    useState<boolean>(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const showProfileOptions = () => {
    // Mobile + Sidebar: show full-screen modal; Desktop: show popover
    if (isMobile && isInSidebar) {
      setShowMobileModal(true);
    } else {
      setProfileDropdown(!profileDropdown);
    }
  };

  const openProfileModal = (onClick: () => void) => {
    onClick();
    setProfileDropdown(false);
  };

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
    launchpadMetrics.track({
      metric: "launchpad_ui_button_click_count",
      labels: {
        page: "home-page",
        button: "SettingsModalOpen",
      },
    });
  };

  const toggleSettingsModal = () => {
    setIsSettingsModalOpen(!isSettingsModalOpen);
  };

  const handleClickPersonaConfigOpen = () => {
    setOpenPopupPersonaConfig(true);
    launchpadMetrics.track({
      metric: "launchpad_ui_button_click_count",
      labels: {
        page: "home-page",
        button: "CustomizeChatModalOpen",
      },
    });
  };

  const handlePopupPersonaConfigClose = () => {
    setOpenPopupPersonaConfig(false);
  };

  const getFirstNameLetter = (): string => {
    if (!profileName) return "";
    return profileName.charAt(0).toUpperCase();
  };

  const handleGiveFeedback = () => {
    navigate("/give-feedback");
    launchpadMetrics.track({
      metric: "launchpad_ui_button_click_count",
      labels: {
        page: "home-page",
        button: "FeedbackModalOpen",
      },
    });
  };

  const handleClose = useCallback(() => {
    setProfileDropdown(false);
  }, []);

  const baseMenuItems = [
    {
      label: "components:profileTabLinks:workspacesLink",
      Icon: TbStack2,
      onClick: () => {
        launchpadMetrics
          .track({
            metric: "launchpad_ui_button_click_count",
            labels: {
              page: "home-page",
              button: "MyWorkspaces",
            },
          })
          .then(() => {
            navigate("/workspaces");
          });
      },
    },
    {
      label: "components:profileTabLinks:customizeChatLink",
      Icon: TbMessage2Cog,
      onClick: () => handleClickPersonaConfigOpen(),
    },
    {
      label: "components:profileTabLinks:settingsLink",
      Icon: TbSettings,
      onClick: () => openSettingsModal(),
    },
    {
      label: "components:profileTabLinks:feedbackLink",
      Icon: TbMessage2Heart,
      onClick: () => handleGiveFeedback(),
    },
    {
      label: "components:profileTabLinks:guidelinesLink",
      Icon: TbVocabulary,
      onClick: () => {
        launchpadMetrics
          .track({
            metric: "launchpad_ui_button_click_count",
            labels: {
              page: "home-page",
              button: "Guidelines",
            },
          })
          .then(() => {
            window.location.replace(
              "https://dsbintranet.sharepoint.com/sites/trAIn_/SitePages/Guidelines-for-ansvarlig-brug-af-AI.aspx?web=1"
            );
          });
      },
    },
    {
      label: "components:profileTabLinks:releaseNotesLink",
      Icon: TbFileText,
      onClick: () => {
        launchpadMetrics
          .track({
            metric: "launchpad_ui_button_click_count",
            labels: {
              page: "home-page",
              button: "ReleaseNotes",
            },
          })
          .then(() => {
            window.location.replace(
              "https://dsbintranet.sharepoint.com/sites/trAIn_/SitePages/Release-notes.aspx"
            );
          });
      },
    },
    {
      label: "components:profileTabLinks:eventsLink",
      Icon: TbCalendarHeart,
      onClick: () => {
        launchpadMetrics
          .track({
            metric: "launchpad_ui_button_click_count",
            labels: {
              page: "home-page",
              button: "UpcomingEvents",
            },
          })
          .then(() => {
            window.location.replace(
              "https://dsbintranet.sharepoint.com/sites/trAIn_/SitePages/AI-Aktiviteter.aspx"
            );
          });
      },
    },
  ];

  // Add admin menu item if user is authorized
  const adminMenuItem = isAdmin
    ? [
        {
          label: "components:profileTabLinks:adminDashboardLink",
          Icon: TbDashboard,
          onClick: () => {
            launchpadMetrics
              .track({
                metric: "launchpad_ui_button_click_count",
                labels: {
                  page: "home-page",
                  button: "AdminDashboard",
                },
              })
              .then(() => {
                navigate("/admin");
              });
          },
        },
      ]
    : [];

  // Combine base menu items with conditional items
  const profileDropdownMenuData = [...baseMenuItems, ...adminMenuItem];

  // Sidebar button classes (always full width to avoid jump)
  const sidebarButtonClasses = `group relative flex items-center h-10 ${
    showProfileDetails ? "w-[97%] hover:bg-gray-600" : "w-10 hover:bg-gray-400"
  } ${profileDropdown ? "bg-gray-600" : ""} mx-[3px]  rounded-lg`;

  const defaultButtonClasses = `bg-transparent active:ring-blue-500 active:rounded-full flex items-center cursor-pointer outline-none height-auto w-auto ${
    isInSidebar ? "" : "fixed left-[10px] z-[9999]"
  } ${
    isInSidebar ? "" : showProfileDetails ? "bottom-[.6em]" : "bottom-[1em]"
  } active:outline-none active:ring-6 active:ring-opacity-30`;

  const containerClasses = isInSidebar
    ? sidebarButtonClasses
    : defaultButtonClasses;

  return (
    <>
      <button
        className={containerClasses}
        aria-label={`account of ${profileName}`}
        onClick={showProfileOptions}
      >
        <div
          ref={anchorRef}
          className="flex items-center relative group w-full"
        >
          <span className="inline-flex items-center justify-center w-10 h-9 shrink-0">
            <ErrorBoundary
              fallback={<FallbackComponent profileName={profileName} />}
            >
              {profilePhoto ? (
                <img
                  className="rounded-full w-[1.6rem] h-[1.6rem] "
                  alt={`Profile photo of ${profileName}`}
                  src={profilePhoto}
                />
              ) : profileName ? (
                <div className="rounded-full flex justify-center items-center text-center text-xl bg-purple p-0  w-[1.6rem] h-[1.6rem] font-bold leading-relaxed">
                  {profileName.charAt(0).toUpperCase()}
                </div>
              ) : null}
            </ErrorBoundary>
          </span>
          {showProfileDetails && (
            <span className="ml-1 text-sm text-left whitespace-nowrap overflow-hidden">
              {profileName}
            </span>
          )}
          {!showProfileDetails && isInSidebar && (
            <Tooltip
              text="components:tooltips:profileIcon"
              position="left-[3.6rem] bottom-1"
            />
          )}
        </div>
      </button>

      {profileDropdown && (
        <div>
          <StyledPopover
            open={profileDropdown}
            onClose={handleClose}
            anchorEl={anchorRef.current}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            topMargin={-34}
            sx={{
              "& .MuiPopover-paper": {
                width: "15.1rem",
                left: "8px!important",
              },
            }}
          >
            {profileDropdownMenuData.map((item, index) => (
              <DropdownMenuButton
                key={index}
                Icon={item.Icon}
                iconSize={21}
                label={t(item.label)}
                gap={2}
                onClick={
                  item.onClick
                    ? () => openProfileModal(item.onClick)
                    : undefined
                }
              />
            ))}
          </StyledPopover>
        </div>
      )}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={toggleSettingsModal}
        userId={userId}
      />
      <CustomizeChatGPT
        openPopupPersonaConfig={openPopupPersonaConfig}
        onClose={handlePopupPersonaConfigClose}
        isOpen={openPopupPersonaConfig}
      />
      {/* Mobile full-screen profile modal */}
      {isMobile && (
        <MobileProfileModal
          isOpen={showMobileModal}
          onClose={() => setShowMobileModal(false)}
          profileName={profileName}
          profilePhoto={profilePhoto}
          menuItems={profileDropdownMenuData}
          onMenuItemClick={onMobileMenuItemClick}
        />
      )}
    </>
  );
};

export default ProfileDropdown;
