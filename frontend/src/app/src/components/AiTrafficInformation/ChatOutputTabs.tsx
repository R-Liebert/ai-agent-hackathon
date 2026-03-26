import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatLoadingSkeleton from "./ChatLoadingSkeleton";
import { useTranslation } from "react-i18next";
import { ChatOutputTabProps } from "../../types/trafficInformation";
import { useMarkdownProcessor } from "../../hooks/useMarkdownProcessor";
import { getTabDisplayName } from "../../utils/tabDisplayNames";

const ChatOutputTab = React.memo<ChatOutputTabProps>(
  ({
    tabs,
    activeTab,
    onTabChange,
    isRegenerating = false,
    isLoading = false,
    contentOnlyLoading = false,
  }) => {
    const { t } = useTranslation();

    // Memoize active tab content lookup
    const activeTabContent = useMemo(
      () => tabs.find((tab) => tab.label === activeTab)?.content,
      [tabs, activeTab]
    );

    const shouldShowSkeleton = isRegenerating || isLoading || !activeTabContent;
    const shouldHideTabsAndInstructions =
      shouldShowSkeleton && !contentOnlyLoading;

    // Process the active tab content through markdown processor
    const { processedContent } = useMarkdownProcessor(
      typeof activeTabContent === "string"
        ? activeTabContent
        : String(activeTabContent || "")
    );

    return (
      <AnimatePresence>
        <motion.div
          key="chatOutputTab"
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {!shouldHideTabsAndInstructions && (
            <div className="my-3">
              {t("traffic-information:outputInstructions")}
            </div>
          )}

          {/* Tabs - Hide during full loading only */}
          {!shouldHideTabsAndInstructions && (
            <div
              className="py-4 space-x-4 flex"
              role="tablist"
              aria-label="Traffic information platforms"
            >
              {tabs.map((tab, index) => (
                <button
                  key={tab.label}
                  id={`tab-${tab.label}`}
                  role="tab"
                  tabIndex={activeTab === tab.label ? 0 : -1}
                  aria-selected={activeTab === tab.label}
                  aria-controls={`tabpanel-${tab.label}`}
                  className={`py-[.5rem] px-4 font-body text-md rounded-xl ${
                    activeTab === tab.label
                      ? "bg-superwhite font-semibold text-gray-700"
                      : "bg-gray-400 font-medium text-gray-300 hover:text-white-100"
                  }`}
                  onClick={() => onTabChange(tab.label)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft" && index > 0) {
                      e.preventDefault();
                      onTabChange(tabs[index - 1].label);
                    } else if (
                      e.key === "ArrowRight" &&
                      index < tabs.length - 1
                    ) {
                      e.preventDefault();
                      onTabChange(tabs[index + 1].label);
                    } else if (e.key === "Home") {
                      e.preventDefault();
                      onTabChange(tabs[0].label);
                    } else if (e.key === "End") {
                      e.preventDefault();
                      onTabChange(tabs[tabs.length - 1].label);
                    }
                  }}
                >
                  {getTabDisplayName(tab.label)}
                </button>
              ))}
            </div>
          )}

          <div
            className="py-3 bg-transparent w-full"
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {shouldShowSkeleton ? (
              <ChatLoadingSkeleton isRegenerating={isRegenerating} />
            ) : (
              // Show active tab content processed through markdown
              <div>
                {processedContent ?? (
                  <p> {t("traffic-information:noOutputContent")}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

ChatOutputTab.displayName = "ChatOutputTab";

export default ChatOutputTab;
