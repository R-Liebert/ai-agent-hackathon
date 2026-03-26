import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@mui/material";
import ChatBotIcon from "@mui/icons-material/Chat";
import { TabKey } from "../../types/trafficInformation";
import ChatOutputTabs from "./ChatOutputTabs";
import ChatMessageActionIcons from "../Chat/ChatMessageActionIcons";
import EdtTabOutputActionDialog from "./EdtTabOutputActionDialog";
import { notificationsService } from "../../services/notificationsService";
import attachCopyEventListener from "../../utils/attachCopyEventListener";
import handleCopyContent from "../../utils/handleCopyContent";
import { useRegenerateContent } from "../../hooks/useRegenerateContent";
import { useTabMemory } from "../../hooks/useTabMemory";
import { useTabSpecificRegeneration } from "../../hooks/useTabSpecificRegeneration";
import { useTrafficInformationContext } from "../../contexts/TrafficInformationContext";
import { getTabDisplayName } from "../../utils/tabDisplayNames";
import { marked } from "marked";

/**
 * Converts markdown string to HTML using marked parser.
 * Defined outside component to avoid recreation on each render.
 */
const mdToHtml = async (md: string): Promise<string> => {
  const html = await marked.parse(md ?? "", { breaks: true });
  return typeof html === "string" ? html : String(html);
};

interface TrafficMessageDisplayProps {
  tabContents: Record<
    TabKey,
    { content: { Danish: string; English: string }; isLoading: boolean }
  >;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  inputText: string;
  agentAvatarColor?: string;
  onClearAllMemory?: (clearAllMemory: () => void) => void;
  isGenerating: boolean;
}

export const TrafficMessageDisplay: React.FC<TrafficMessageDisplayProps> = ({
  tabContents,
  activeTab,
  setActiveTab,
  inputText,
  agentAvatarColor = "#357087",
  onClearAllMemory,
  isGenerating,
}) => {
  const { t } = useTranslation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(
    null
  );
  const tabContentRef = useRef<HTMLDivElement>(null);

  // Get the context to access updateTabContent and tab languages
  const { updateTabContent, tabLanguages, setTabLanguage } =
    useTrafficInformationContext();

  // Get current language for active tab
  const currentLanguage = tabLanguages[activeTab];

  // Track tab-specific regeneration state
  const [regeneratingTab, setRegeneratingTab] = useState<TabKey | null>(null);

  // Language mapping for display
  const displayLanguage = currentLanguage === "Danish" ? "DA" : "EN";

  // Use tab-specific memory for regenerated content
  const {
    getMemoryForTab,
    addToMemory,
    updateLastInMemory,
    updateMemoryAtIndex,
    clearMemoryForTab,
    clearAllMemory,
  } = useTabMemory();

  // Expose clearAllMemory function to parent component
  useEffect(() => {
    console.log(
      "🔗 [TrafficMessageDisplay] Exposing clearAllMemory function:",
      {
        onClearAllMemory: typeof onClearAllMemory,
        clearAllMemory: typeof clearAllMemory,
      }
    );
    if (onClearAllMemory) {
      onClearAllMemory(clearAllMemory);
      console.log(
        "🔗 [TrafficMessageDisplay] Successfully passed clearAllMemory to parent"
      );
    }
  }, [onClearAllMemory, clearAllMemory]);

  // Use regeneration hook for global regeneration
  const {
    isRegenerating,
    regeneratedContents,
    regenerateContent,
    addRegeneratedContent,
    clearRegeneratedContents,
  } = useRegenerateContent({
    activeTab,
    displayLanguage,
    inputText,
  });

  // Use tab-specific regeneration hook for popup regeneration
  const { isRegenerating: isTabRegenerating, regenerateForTab } =
    useTabSpecificRegeneration({
      inputText,
    });

  // Get memory for current tab and language
  const currentTabMemory = useMemo(
    () => getMemoryForTab(activeTab, currentLanguage),
    [getMemoryForTab, activeTab, currentLanguage]
  );

  // Watch for content changes and add to memory automatically
  useEffect(() => {
    const currentContent =
      displayLanguage === "DA"
        ? tabContents[activeTab]?.content?.Danish
        : tabContents[activeTab]?.content?.English;

    if (currentContent && currentContent.trim()) {
      addToMemory(activeTab, currentLanguage, currentContent);
    }
  }, [tabContents, activeTab, currentLanguage, displayLanguage, addToMemory]);

  // Memoize tabs array for ChatOutputTabs
  const tabsArray = useMemo(
    () =>
      (Object.keys(tabContents) as TabKey[]).map((key) => {
        const content =
          displayLanguage === "DA"
            ? tabContents[key].content.Danish
            : tabContents[key].content.English;

        return {
          label: key,
          content: content || "",
        };
      }),
    [tabContents, displayLanguage]
  );

  const handleOpenEditModal = useCallback(() => {
    const currentContent =
      displayLanguage === "DA"
        ? tabContents[activeTab].content.Danish
        : tabContents[activeTab].content.English;

    console.log("📝 [TrafficMessageDisplay] Opening edit modal:", {
      activeTab,
      currentLanguage,
      displayLanguage,
      currentContent: currentContent?.substring(0, 50) + "...",
      hasContent: !!currentContent?.trim(),
      currentMemorySize: currentTabMemory.length,
    });

    // Add current content to tab-specific memory if it's not already there
    if (currentContent.trim()) {
      addToMemory(activeTab, currentLanguage, currentContent);
    }

    setShowEditModal(true);
  }, [
    displayLanguage,
    tabContents,
    activeTab,
    currentLanguage,
    addToMemory,
    currentTabMemory.length,
  ]);

  const handleRegenerateContent = useCallback(
    async (fromModal: boolean = false) => {
      if (fromModal) {
        await regenerateContent(fromModal);
      } else {
        // Tab-specific regeneration with memory clearing
        const targetTab = activeTab;
        const targetLanguage = currentLanguage;

        console.log(
          "🔄 [TrafficMessageDisplay] Starting tab-specific regeneration with memory clear:",
          {
            tab: targetTab,
            language: targetLanguage,
          }
        );

        // Clear existing memory for this tab/language
        clearMemoryForTab(targetTab, targetLanguage);

        // Set regenerating state for this specific tab
        setRegeneratingTab(targetTab);

        try {
          await regenerateForTab(
            targetTab,
            targetLanguage,
            (streamedContent) => {
              // Add the new content to memory (this will be the only version)
              addToMemory(targetTab, targetLanguage, streamedContent);

              // Update the main tab content with the streamed content
              const currentContent = { ...tabContents[targetTab].content };
              currentContent[targetLanguage] = streamedContent;
              updateTabContent(targetTab, currentContent);
            }
          );

          console.log(
            "🔄 [TrafficMessageDisplay] Tab-specific regeneration completed successfully"
          );
        } catch (error) {
          console.error(
            "🔄 [TrafficMessageDisplay] Tab-specific regeneration failed:",
            error
          );
        } finally {
          setRegeneratingTab(null);
        }
      }
    },
    [
      regenerateContent,
      activeTab,
      currentLanguage,
      clearMemoryForTab,
      regenerateForTab,
      addToMemory,
      tabContents,
      updateTabContent,
    ]
  );

  const handleSaveOutput = useCallback(
    (
      updatedContent: string,
      tab?: TabKey,
      language?: "Danish" | "English",
      editingIndex?: number
    ) => {
      // Use provided tab/language or fall back to current values
      const targetTab = tab || activeTab;
      const targetLanguage = language || currentLanguage;
      const memoryIndex = editingIndex ?? currentEditingIndex;

      console.log("💾 [TrafficMessageDisplay] Saving updated content:", {
        tab: targetTab,
        language: targetLanguage,
        memoryIndex,
        content: updatedContent.substring(0, 100) + "...",
        originalContent:
          (targetLanguage === "Danish"
            ? tabContents[targetTab].content.Danish
            : tabContents[targetTab].content.English
          ).substring(0, 100) + "...",
      });

      if (memoryIndex !== null && memoryIndex >= 0) {
        // Update the specific memory entry
        updateMemoryAtIndex(
          targetTab,
          targetLanguage,
          memoryIndex,
          updatedContent
        );

        // Always update the main tab content when user explicitly saves from modal
        // This makes the saved content become the displayed content regardless of which version was edited
        const currentContent = { ...tabContents[targetTab].content };
        currentContent[targetLanguage] = updatedContent;
        updateTabContent(targetTab, currentContent);

        console.log(
          "💾 [TrafficMessageDisplay] Updated both memory and main tab content:",
          {
            memoryIndex,
            tab: targetTab,
            language: targetLanguage,
            contentPreview: updatedContent.substring(0, 100) + "...",
          }
        );
      } else {
        // Fallback: just update the main tab content (shouldn't happen normally)
        const currentContent = { ...tabContents[targetTab].content };
        currentContent[targetLanguage] = updatedContent;
        updateTabContent(targetTab, currentContent);
      }

      // Show success notification
      notificationsService.success(
        t("traffic-information:editTabOutputActionDialog.saveSuccess", {
          tab: targetTab,
          language: targetLanguage,
        })
      );

      // Close the modal and reset editing index
      setShowEditModal(false);
      setCurrentEditingIndex(null);
    },
    [
      tabContents,
      activeTab,
      currentLanguage,
      currentEditingIndex,
      updateTabContent,
      updateMemoryAtIndex,
      getMemoryForTab,
      t,
    ]
  );

  const handleRegenerateForTab = useCallback(
    async (tab?: TabKey, language?: "Danish" | "English") => {
      const targetTab = tab || activeTab;
      const targetLanguage = language || currentLanguage;

      console.log(
        "🔄 [TrafficMessageDisplay] Starting tab-specific regeneration:",
        {
          tab: targetTab,
          language: targetLanguage,
          currentMemorySize: getMemoryForTab(targetTab, targetLanguage).length,
        }
      );

      let finalContent = "";
      let contentAdded = false;

      // Use tab-specific regeneration that will stream content directly to the popup
      await regenerateForTab(targetTab, targetLanguage, (streamedContent) => {
        finalContent = streamedContent;

        if (!contentAdded) {
          // Add to memory only on first content chunk (not on button click)
          addToMemory(targetTab, targetLanguage, streamedContent);
          contentAdded = true;
          console.log(
            "🔄 [TrafficMessageDisplay] Added new entry to memory, new size:",
            getMemoryForTab(targetTab, targetLanguage).length
          );
        } else {
          // Update the last item in memory with the streamed content in real-time
          updateLastInMemory(targetTab, targetLanguage, streamedContent);
        }
      });

      console.log("🔄 [TrafficMessageDisplay] Regeneration complete:", {
        finalContentLength: finalContent.length,
        finalMemorySize: getMemoryForTab(targetTab, targetLanguage).length,
      });
    },
    [
      regenerateForTab,
      activeTab,
      currentLanguage,
      addToMemory,
      updateLastInMemory,
      getMemoryForTab,
    ]
  );

  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === "Danish" ? "English" : "Danish";
    setTabLanguage(activeTab, newLanguage);
  };

  const activeTabContent = useMemo(
    () =>
      displayLanguage === "DA"
        ? tabContents[activeTab].content.Danish
        : tabContents[activeTab].content.English,
    [displayLanguage, tabContents, activeTab]
  );

  const handleCopyContentWrapper = useCallback(
    async ({
      setMessageCopyOk,
      htmlToCopy,
      copyType,
    }: {
      setMessageCopyOk: React.Dispatch<React.SetStateAction<boolean>>;
      htmlToCopy: string;
      copyType?: "activeTab" | "entireMessage";
    }) => {
      try {
        let html: string;

        if (copyType === "activeTab") {
          const sourceText =
            displayLanguage === "DA"
              ? tabContents[activeTab].content.Danish
              : tabContents[activeTab].content.English;
          html = await mdToHtml(sourceText);
        } else {
          html = htmlToCopy?.trim()
            ? htmlToCopy
            : await mdToHtml(activeTabContent);
        }

        await handleCopyContent({
          htmlToCopy: html,
          setMessageCopyOk,
          errorMessage: t("common:copyContent.error"),
          successMessage: t("common:copyContent.success"),
          defaultFont: {
            fontFamily: "Calibri, Arial, sans-serif",
            fontSize: "15px",
            color: "#000",
          },
        });
      } catch (error) {
        console.error("[handleCopyContentWrapper] Copy failed:", error);
        notificationsService.error(t("common:copyContent.error"));
      }
    },
    [activeTab, displayLanguage, tabContents, t, activeTabContent]
  );

  const textForTTS = activeTabContent || "";

  return (
    <div className="w-full py-2 msg !font-body text-white-100 agent">
      <div className="mx-auto my-0 max-w-3xl pl-2 md:pl-4 pr-0">
        <div className="flex flex-col message font-body text-white-100 message-group">
          {/* Main content */}
          <div
            className={`flex flex-col leading-7 message-text ${
              regeneratingTab === activeTab ? "mb-3" : ""
            }`}
            ref={tabContentRef}
          >
            <div className="flex flex-col w-auto">
              <div className="flex w-full">
                <div className="w-full">
                  <ChatOutputTabs
                    tabs={tabsArray}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isRegenerating={
                      isRegenerating || regeneratingTab === activeTab
                    }
                    isLoading={Object.values(tabContents).some(
                      (tab) => tab.isLoading
                    )}
                    contentOnlyLoading={regeneratingTab === activeTab}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action icons */}
          {!isGenerating && (
            <ChatMessageActionIcons
              isUserMessage={false}
              isTabbedChat={true}
              hasImages={false}
              alwaysShowActions={true}
              selectedIcon={null}
              onIconClick={(_iconType, _userMessage, _consent, _editedMessage) =>
                {}
              }
              onRegenerate={() => handleRegenerateContent(false)}
              onEdit={handleOpenEditModal}
              isRegenerating={isRegenerating}
              handleCopyContent={handleCopyContentWrapper}
              onToggleLanguage={handleLanguageToggle}
              language={currentLanguage === "Danish" ? "DA" : "EN"}
              activeTab={activeTab}
              htmlToCopy=""
              textForTTS={textForTTS}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EdtTabOutputActionDialog
          open={showEditModal}
          title={`${t(
            "traffic-information:editTabOutputActionDialog.title"
          )} - ${getTabDisplayName(activeTab)} (${t(
            `traffic-information:languages.${currentLanguage}`
          )})`}
          initialContent={activeTabContent}
          activeTab={activeTab}
          currentLanguage={currentLanguage}
          regeneratedContents={currentTabMemory}
          isRegenerating={isTabRegenerating}
          cancelBtn={t(
            "traffic-information:editTabOutputActionDialog.cancelBtn"
          )}
          confirmBtn={t(
            "traffic-information:editTabOutputActionDialog.confirmBtn"
          )}
          onCancel={() => setShowEditModal(false)}
          onConfirm={handleSaveOutput}
          onRegenerate={handleRegenerateForTab}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};
