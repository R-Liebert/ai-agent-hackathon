import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTrafficInformationContext } from "../../contexts/TrafficInformationContext";
import PromptSettingsActionDialog from "./PromptSettingsActionDialog";
import { TrafficMessageDisplay } from "./TrafficMessageDisplay";
import { TrafficInputForm } from "./TrafficInputForm";
import useScrollToBottom from "../../hooks/useScrollToBottom";
import ScrollableFeed from "react-scrollable-feed";

interface TrafficInformationInterfaceProps {
  accentColor?: string;
}

const TrafficInformationInterfaceContent: React.FC<
  TrafficInformationInterfaceProps
> = ({ accentColor = "#13717A" }) => {
  const { t } = useTranslation();
  const {
    inputText,
    setInputText,
    activeTab,
    setActiveTab,
    tabContents,
    isGenerating,
    generateContent,
    stopGeneration,
    error,
    clearError,
    isLoadingPrompts,
    systemPrompts,
    updateSystemPrompts,
    refreshSystemPrompts,
  } = useTrafficInformationContext();
  const { scrollableFeedRef, scrollToBottom } = useScrollToBottom();

  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const clearAllTabMemoryRef = useRef<(() => void) | null>(null);

  const handleClearAllMemory = (clearAllMemory: () => void) => {
    console.log(
      "🎯 [TrafficInformationInterface] Received clearAllTabMemory function"
    );
    clearAllTabMemoryRef.current = clearAllMemory;
  };

  const handleGenerate = async (text?: string) => {
    clearError();
    await generateContent(text);
  };

  // Check if we have any content to display
  const hasContent =
    Object.values(tabContents).some(
      (tab) => tab.content.Danish || tab.content.English || tab.isLoading
    ) || isGenerating;

  useEffect(() => {
    if (isGenerating) {
      scrollableFeedRef.current?.scrollToBottom();
    }
  }, [isGenerating]);

  return (
    <div
      className={`flex flex-col items-center flex-1 mt-[2em] w-full overflow-y-hidden ${
        hasContent ? "" : "justify-center"
      }`}
    >
      <ScrollableFeed
        ref={scrollableFeedRef}
        className="content grow overflow-y-auto px-4 py-8 w-full overflow-x-hidden h-screen"
        forceScroll={false}
      >
        {/* Input Form Component */}
        <TrafficInputForm
          inputText={inputText}
          setInputText={setInputText}
          isGenerating={isGenerating}
          hasContent={hasContent}
          onGenerate={handleGenerate}
          onShowSettings={() => setShowPromptSettings(true)}
          isLoadingPrompts={isLoadingPrompts}
          error={error}
          clearError={clearError}
          clearAllTabMemory={clearAllTabMemoryRef.current || (() => {})}
        />
        {/* Traffic Message Display */}
        <AnimatePresence>
          {hasContent && (
            <motion.div
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TrafficMessageDisplay
                tabContents={tabContents}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                inputText={inputText}
                onClearAllMemory={handleClearAllMemory}
                isGenerating={isGenerating}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Settings Modal */}
        <PromptSettingsActionDialog
          open={showPromptSettings}
          title={t("traffic-information:promptSettingsActionDialog.title")}
          cancelBtn={t(
            "traffic-information:promptSettingsActionDialog.cancelBtn"
          )}
          confirmBtn={t(
            "traffic-information:promptSettingsActionDialog.confirmBtn"
          )}
          onCancel={() => setShowPromptSettings(false)}
          onConfirm={() => setShowPromptSettings(false)}
          onClose={() => setShowPromptSettings(false)}
          systemPrompts={systemPrompts}
          updateSystemPrompts={updateSystemPrompts}
          isLoadingPrompts={isLoadingPrompts}
          refreshSystemPrompts={refreshSystemPrompts}
        />
      </ScrollableFeed>
    </div>
  );
};

export const TrafficInformationInterface: React.FC<
  TrafficInformationInterfaceProps
> = (props) => {
  return <TrafficInformationInterfaceContent {...props} />;
};
