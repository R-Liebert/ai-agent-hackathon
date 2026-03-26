import React, { useEffect, useState, useRef } from "react";
import {
  TbListDetails,
  TbFileSymlink,
  TbUsersPlus,
  TbSettingsSpark,
} from "react-icons/tb";
import { useTranslation } from "react-i18next";
import useSidebarStore from "../../stores/navigationStore";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const tabs = [
  {
    id: "general",
    label: "workspaces:common:form:navigationTabs.general",
    icon: <TbListDetails size={22} />,
  },
  {
    id: "files",
    label: "workspaces:common:form:navigationTabs.files",
    icon: <TbFileSymlink size={22} />,
  },
  {
    id: "members",
    label: "workspaces:common:form:navigationTabs.members",
    icon: <TbUsersPlus size={22} />,
  },
  {
    id: "advanced",
    label: "workspaces:common:form:navigationTabs.advanced",
    icon: <TbSettingsSpark size={22} />,
  },
];

export default function FormTabsNavigation() {
  const { isSidebarOpen } = useSidebarStore();
  const [activeTab, setActiveTab] = useState("general");
  const [isSticky, setIsSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Gate sticky mode above 546px
  const canStick = useMediaQuery("(min-width: 546px)");
  // Gate animation above 700px (same as PageTransition)
  const canAnimate = useMediaQuery("(min-width: 700px)");

  // Only use sticky when both: sentinel says so AND viewport is >= 546px
  const stickyActive = canStick && isSticky;

  // Sentinel controls the "should be sticky" state, but we'll only apply it when canStick is true
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Active section detection
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-70% 0px -20% 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveTab(entry.target.id);
      });
    }, observerOptions);

    tabs.forEach((tab) => {
      const el = document.getElementById(tab.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Reset active on top
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop === 0) setActiveTab("general");
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (!element) {
      console.log("Element not found!");
      return;
    }
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveTab(id);
  };

  // Transform:
  // - Only apply when stickyActive
  // - Keep your 7rem extra left shift for sidebar only above 700px (canAnimate)
  const translateX = stickyActive
    ? isSidebarOpen && canAnimate
      ? "translateX(calc(-50% + 9rem))"
      : "translateX(-47%)"
    : undefined;

  // Transition:
  // - Enable only above 700px (canAnimate), otherwise snap
  const transitionClass = canAnimate
    ? "transition-transform duration-300 ease-out"
    : "transition-none duration-0";

  return (
    <>
      <div ref={sentinelRef} className="h-0"></div>
      <div
        ref={navRef}
        className={`mx-auto ${
          stickyActive
            ? `fixed w-[calc(100vw-13rem)] lg:w-auto top-6 lg:top-1 left-1/2 z-[99] ${transitionClass}`
            : "static flex w-auto place-items-center place-content-center mx-auto"
        } flex my-4 pb-2 lg:bg-transparent lg:pb-0`}
        style={{ transform: translateX }}
      >
        <div className="w-full flex-wrap gap-2 mx-auto flex place-items-center place-content-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleClick(tab.id)}
              className={`flex font-body text-md rounded-xl items-center gap-2 py-[.66rem] px-4 transition-colors duration-300 ${
                activeTab === tab.id
                  ? "bg-white-100 text-gray-700 font-semibold"
                  : "text-gray-300 bg-gray-600 font-medium"
              }`}
            >
              {React.cloneElement(tab.icon, {
                strokeWidth: activeTab === tab.id ? 2.4 : 1.8,
              })}
              <span>{t(tab.label)}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
