import React, { useState, useEffect, useRef } from "react";
import Logo from "./Logo";
import Profile from "./Profile";
import { TbLayoutSidebar } from "react-icons/tb";
import Tooltip from "../Global/Tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { IconType } from "react-icons";
import { ChatHistoryDto } from "../../interfaces/interfaces";
import { ChatHistoryComponent } from "../Chat/ChatHistory";
import { useRouteChanger } from "../../utils/navigation";
import { useScrollStore } from "../../stores/scrollStore";

interface SidebarProps {
  isOpen?: boolean;
  handleSidebarClose: () => void;
  handleSidebarOpen: () => void;
  mainNavLinks: Array<{
    label: string;
    Icon: IconType;
    onClick: () => void;
    tooltipText: string;
  }>;
  historyTitle: React.ReactNode;
  type?: string;
  workspaceId?: string;
  onSelectChat?: (chat: ChatHistoryDto) => void;
  onDeleteChat?: (chat: ChatHistoryDto) => void;
  handleChatExport?: (
    chatId: string,
    chatType: string,
    workspaceId?: string,
    fileName?: string
  ) => Promise<void>;
  recentWorkspaces?: React.ReactNode;
  historyRef?: React.Ref<any>;
  profileName?: string | null;
  profilePhoto?: string | null;
  userId: string;
  isHistoryVisible?: boolean;
}

export default function Sidebar({
  isOpen = false,
  handleSidebarClose,
  handleSidebarOpen,
  mainNavLinks,
  historyTitle,
  type,
  workspaceId,
  onSelectChat,
  onDeleteChat,
  handleChatExport,
  recentWorkspaces,
  historyRef,
  profileName,
  profilePhoto,
  userId,
  isHistoryVisible = false,
}: SidebarProps) {
  const { changeRoute } = useRouteChanger();

  // Mobile detection hook - initialize immediately to prevent flicker
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768; //  breakpoint the same as OpenAi
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // sm breakpoint
    };

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const openWidth = 260;
  const closedWidth = 54;
  const mobileWidth = 280;

  // Theme colors from tailwind.config.js (extended gray palette)
  const colors = {
    bgOpen: "#181818", // gray-850
    bgClosed: "#212121", // gray-800
    borderOpen: "transparent",
    borderClosed: "#2F2F2F", // gray-600
  } as const;

  const { showProfileBorder, setShowProfileBorder, setScrollPosition } =
    useScrollStore();

  const historyScrollRef = useRef<HTMLDivElement | null>(null);

  const BORDER_OFFSET_PX = 400;

  useEffect(() => {
    const el = historyScrollRef.current;
    if (!el || !isOpen) {
      setShowProfileBorder(false);
      setScrollPosition(0);
      return;
    }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;

        const scrollTop = el.scrollTop;
        const clientHeight = el.clientHeight;

        const threshold = Math.max(clientHeight - BORDER_OFFSET_PX, 0);
        const beyond = scrollTop >= threshold;

        setShowProfileBorder(beyond);
        setScrollPosition(scrollTop);
      });
    };

    // Initialize state correctly on mount
    onScroll();

    el.addEventListener("scroll", onScroll, { passive: true });

    // Recompute on window resize because clientHeight changes
    const onResize = () => onScroll();
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isOpen, setShowProfileBorder, setScrollPosition]);

  return (
    <>
      <motion.div
        initial={false}
        animate={{
          // Mobile: slide from off-screen; Desktop: existing behavior
          width: isMobile
            ? isOpen
              ? mobileWidth
              : 0
            : isOpen
            ? openWidth
            : closedWidth,
          x: isMobile ? (isOpen ? 0 : -mobileWidth) : 0,
          opacity: isMobile ? (isOpen ? 1 : 0) : 1,
          backgroundColor: isOpen ? colors.bgOpen : colors.bgClosed,
          borderRightColor: isOpen ? colors.borderOpen : colors.borderClosed,
        }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`${
          isOpen ? "" : "border-r-2"
        } fixed top-0 left-0 h-screen py-2 px-1 flex flex-col !z-[99999] ${
          !isOpen && !isMobile ? "cursor-pointer" : ""
        } ${isMobile && !isOpen ? "pointer-events-none" : ""}`}
        role="navigation"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === "Escape" && isOpen) {
            e.stopPropagation();
            handleSidebarClose();
          }
        }}
        onClick={() => {
          // Desktop only: click to open when closed; Mobile: controlled by hamburger
          if (!isOpen && !isMobile) handleSidebarOpen();
        }}
        style={{
          pointerEvents: isMobile && !isOpen ? "none" : "auto",
          visibility: isMobile && !isOpen ? "hidden" : "visible",
        }}
      >
        <div className="flex w-full justify-between px-1">
          {/* Left side: Logo (always visible); slot matches link icons */}
          <button
            className={`group relative flex items-center justify-center h-9 w-9 ${
              isOpen ? "hover:bg-gray-600" : "hover:bg-gray-400"
            } rounded-lg`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOpen) {
                handleSidebarOpen();
              } else {
                changeRoute("/");
              }
            }}
            aria-label={
              isOpen
                ? "components:mainNavigation.menu.tooltipText"
                : "components:mainNavigation.sidebar.open"
            }
          >
            <span className="relative inline-flex items-center justify-center transition-opacity duration-200 w-full">
              <div className={`${isOpen ? "" : "group-hover:hidden"}`}>
                <Logo />
              </div>
              {isOpen ? null : (
                <TbLayoutSidebar
                  size={23}
                  strokeWidth={1.2}
                  className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              )}
            </span>
            {isOpen ? null : (
              <Tooltip
                text={
                  isOpen
                    ? "components:mainNavigation.menu.tooltipText"
                    : "components:mainNavigation.sidebar.open"
                }
                position={`bottom-1 !z-[99999]
                           ${isOpen ? "" : "-right-[7rem]"}
                         `}
              />
            )}
          </button>

          {/* Right side: Close button (only when open) */}
          {isOpen && (
            <button
              className={`group relative flex items-center justify-center h-9 w-9 ${
                isOpen ? "hover:bg-gray-600" : "hover:bg-gray-400"
              } hover:text-superwhite rounded-lg`}
              onClick={(e) => {
                e.stopPropagation();
                handleSidebarClose();
              }}
              aria-label="components:mainNavigation.sidebar.close"
            >
              <TbLayoutSidebar size={23} strokeWidth={1.2} />
              <Tooltip
                text="components:mainNavigation.sidebar.close"
                position="-left-7 top-12"
              />
            </button>
          )}
        </div>

        {/* Main nav links */}
        <div className="mt-3 mx-1 flex flex-col">
          {mainNavLinks.map((link, index) => (
            <button
              key={index}
              className={`group relative flex font-body items-center h-9 w-full ${
                isOpen ? "hover:bg-gray-600" : "hover:bg-gray-400"
              } hover:text-superwhite rounded-lg`}
              onClick={(e) => {
                e.stopPropagation();
                link.onClick();
                // Close sidebar on mobile after navigation
                if (isMobile) {
                  handleSidebarClose();
                }
              }}
              aria-label={link.label}
            >
              <span className="inline-flex items-center justify-center w-9 h-9 shrink-0">
                <link.Icon
                  strokeWidth={1.4}
                  size={21}
                  className="transition-opacity duration-200"
                />
              </span>
              <motion.span
                animate={{
                  opacity: isOpen || (isMobile && isOpen) ? 1 : 0,
                }}
                transition={{ duration: 0.1, delay: isOpen ? 0.08 : 0 }}
                style={{
                  maxWidth: isOpen || (isMobile && isOpen) ? "100%" : "0px",
                }}
                className="ml-[2px] text-sm text-left whitespace-nowrap overflow-hidden"
              >
                {link.label}
              </motion.span>
              {!isOpen && (
                <Tooltip
                  text={link.tooltipText}
                  position="left-[3.6rem] bottom-1"
                />
              )}
            </button>
          ))}
        </div>

        {/* History and extras only when open */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="history"
              ref={historyScrollRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 mt-2 overflow-y-auto scroll-smooth snap-y snap-mandatory"
              style={{ contain: "content" }}
              onClick={(e) => e.stopPropagation()}
            >
              {recentWorkspaces}
              {historyTitle}
              {isHistoryVisible &&
              type &&
              onSelectChat &&
              onDeleteChat &&
              handleChatExport ? (
                <ChatHistoryComponent
                  key={`${type}-${workspaceId}`}
                  ref={historyRef as any}
                  onSelectChat={onSelectChat}
                  onNewChat={() => {}}
                  DeleteSelectChat={onDeleteChat}
                  type={type}
                  workspaceId={workspaceId}
                  handleChatExport={handleChatExport}
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile control (avatar visible when closed; name fades in when open) */}
        <div
          className={`mt-auto shrink-0 pt-1 ${
            showProfileBorder ? "border-t-[1.4px] border-gray-700" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Profile
            profileName={profileName}
            profilePhoto={profilePhoto}
            userId={userId}
            showProfileDetails={isOpen}
            isInSidebar={true}
            isMobile={isMobile}
            onMobileMenuItemClick={isMobile ? handleSidebarClose : undefined}
          />
        </div>
      </motion.div>

      {/* Mobile backdrop - only shows when sidebar is open on mobile */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[99998]"
            onClick={handleSidebarClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
