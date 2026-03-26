import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  TabKey,
  SystemPrompts,
  TabContent,
  TrafficInformationError,
  PlatformContentResponse,
} from "../types/trafficInformation";
import * as trafficService from "../services/trafficInformationGenerator";
import { notificationsService } from "../services/notificationsService";

interface UseTrafficInformationReturn {
  // State
  inputText: string;
  activeTab: TabKey;
  tabContents: Record<TabKey, TabContent>;
  isGenerating: boolean;
  systemPrompts: SystemPrompts;
  isLoadingPrompts: boolean;
  error: TrafficInformationError | null;
  tabLanguages: Record<TabKey, "Danish" | "English">;

  // Actions
  setInputText: (text: string) => void;
  setActiveTab: (tab: TabKey) => void;
  generateContent: () => Promise<void>;
  regenerateContent: (
    tab: TabKey,
    language?: "Danish" | "English"
  ) => Promise<void>;
  stopGeneration: () => void;
  updateSystemPrompts: (prompts: SystemPrompts) => Promise<void>;
  updateTabContent: (
    tab: TabKey,
    content: { Danish: string; English: string }
  ) => void;
  clearError: () => void;
  refreshSystemPrompts: () => Promise<void>;
  resetAll: () => void;
  setTabLanguage: (tab: TabKey, language: "Danish" | "English") => void;
}

export const useTrafficInformation = (): UseTrafficInformationReturn => {
  const { t } = useTranslation();

  // State
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem("traffic-info-active-tab");
    return (saved as TabKey) || "DSB.dk";
  });

  const [tabContents, setTabContents] = useState<Record<TabKey, TabContent>>({
    "DSB.dk": {
      platform: "DSB.dk",
      content: { Danish: "", English: "" },
      isLoading: false,
      regenerationHistory: [],
    },
    "Tavle 7": {
      platform: "Tavle 7",
      content: { Danish: "", English: "" },
      isLoading: false,
      regenerationHistory: [],
    },
    Infoskaerm: {
      platform: "Infoskaerm",
      content: { Danish: "", English: "" },
      isLoading: false,
      regenerationHistory: [],
    },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompts>({
    "DSB.dk": "",
    "Tavle 7": "",
    Infoskaerm: "",
  });
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [error, setError] = useState<TrafficInformationError | null>(null);
  const [tabLanguages, setTabLanguages] = useState<
    Record<TabKey, "Danish" | "English">
  >({
    "DSB.dk": "Danish",
    "Tavle 7": "Danish",
    Infoskaerm: "Danish",
  });

  // Refs for managing abort controllers
  const streamControllers = useRef<Map<TabKey, AbortController>>(new Map());
  const mainGenerationController = useRef<AbortController | null>(null);

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem("traffic-info-active-tab", activeTab);
  }, [activeTab]);

  // Load system prompts on mount
  useEffect(() => {
    refreshSystemPrompts();
  }, []);

  // Cleanup function for aborting streams
  const cleanupStreams = useCallback(() => {
    streamControllers.current.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    streamControllers.current.clear();

    if (
      mainGenerationController.current &&
      !mainGenerationController.current.signal.aborted
    ) {
      mainGenerationController.current.abort();
      mainGenerationController.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStreams();
    };
  }, [cleanupStreams]);

  const handleError = useCallback(
    (err: any, context: string, platform?: TabKey) => {
      console.error(`Error in ${context}:`, err);

      const trafficError: TrafficInformationError =
        err instanceof Error
          ? (err as TrafficInformationError)
          : new Error(typeof err === "string" ? err : "Unknown error");

      trafficError.platform = platform;
      setError(trafficError);

      const errorMessage = trafficService.getErrorMessage(
        trafficError,
        context,
        t
      );
      notificationsService.error(errorMessage);
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshSystemPrompts = useCallback(async () => {
    setIsLoadingPrompts(true);
    setError(null);

    try {
      const prompts = await trafficService.getSystemPrompts();
      setSystemPrompts(prompts);
    } catch (err) {
      handleError(err, "loading system prompts");
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [handleError]);

  const updateSystemPrompts = useCallback(
    async (prompts: SystemPrompts) => {
      try {
        // Send all current system prompts from state
        await trafficService.setSystemPrompts(prompts);
        setSystemPrompts(prompts);
      } catch (err) {
        handleError(err, "updating system prompts");
        throw err; // Re-throw so UI can handle it
      }
    },
    [handleError]
  );

  const updateTabContent = useCallback(
    (tab: TabKey, content: { Danish: string; English: string }) => {
      setTabContents((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          content,
        },
      }));
    },
    []
  );

  const generateContent = useCallback(
    async (text?: string) => {
      const textToUse = text || inputText;
      if (!textToUse.trim() || isGenerating) return;

      console.log("🎯 [TrafficInformation Hook] Starting content generation:", {
        textParameter: text ? text.substring(0, 50) + "..." : "none",
        currentInputText: inputText.substring(0, 50) + "...",
        textToUse:
          textToUse.substring(0, 100) + (textToUse.length > 100 ? "..." : ""),
        inputLength: textToUse.length,
        isGenerating,
        activeTab,
      });

      setIsGenerating(true);
      setError(null);
      cleanupStreams();

      // Create new controller for this generation
      mainGenerationController.current = new AbortController();

      // Reset all tab contents and set loading states
      const tabs: TabKey[] = ["DSB.dk", "Tavle 7", "Infoskaerm"];

      setTabContents((prev) => {
        const updated = { ...prev };
        tabs.forEach((tab) => {
          updated[tab] = {
            ...updated[tab],
            content: { Danish: "", English: "" },
            isLoading: true,
            error: undefined,
          };
        });
        return updated;
      });

      try {
        // Generate content using the single endpoint that handles all platforms
        await trafficService.generateTrafficContentStream({
          payload: { TrafficInformation: textToUse },
          onContent: (response: PlatformContentResponse) => {
            console.log("📝 [TrafficInformation Hook] Content received:", {
              platform: response.platform,
              content: response.content,
              activeTab,
              timestamp: new Date().toISOString(),
            });

            // Map backend section names to frontend TabKey
            const platformMapping: Record<string, TabKey> = {
              DsbDk: "DSB.dk",
              Tavle7: "Tavle 7",
              Infoskaerm: "Infoskaerm",
            };

            const targetTab =
              platformMapping[response.platform] ||
              (response.platform as TabKey);

            if (targetTab) {
              setTabContents((prev) => ({
                ...prev,
                [targetTab]: {
                  ...prev[targetTab],
                  content: {
                    Danish: response.content.Danish,
                    English: response.content.English,
                  },
                  isLoading: false,
                },
              }));
            }
          },
          onError: (err) => {
            console.error(
              "❌ [TrafficInformation Hook] Generation error:",
              err
            );
            handleError(err, "generating content");
            setTabContents((prev) => {
              const updated = { ...prev };
              tabs.forEach((tab) => {
                updated[tab] = {
                  ...updated[tab],
                  isLoading: false,
                  error: err,
                };
              });
              return updated;
            });
          },
          onDone: () => {
            console.log("✅ [TrafficInformation Hook] Generation completed");
            // Just stop loading states, don't clear content
            setTabContents((prev) => {
              const updated = { ...prev };
              tabs.forEach((tab) => {
                updated[tab] = {
                  ...updated[tab],
                  isLoading: false,
                };
              });
              return updated;
            });
          },
          signal: mainGenerationController.current.signal,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleError(err, "generating content");
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [inputText, isGenerating, activeTab, cleanupStreams, handleError]
  );

  const regenerateContent = useCallback(
    async (tab: TabKey, language: "Danish" | "English" = "Danish") => {
      if (!inputText.trim() || tabContents[tab].isLoading) return;

      setError(null);

      // Abort existing stream for this tab if any
      const existingController = streamControllers.current.get(tab);
      if (existingController && !existingController.signal.aborted) {
        existingController.abort();
      }

      // Create new controller for this tab
      const controller = new AbortController();
      streamControllers.current.set(tab, controller);

      // Set loading state for this specific tab
      setTabContents((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          isLoading: true,
          error: undefined,
        },
      }));

      try {
        await trafficService.regenerateTrafficContentStream({
          payload: {
            TrafficInformation: inputText,
            Platform: tab,
            OutputLanguage: language,
          },
          onContent: (content) => {
            console.log(
              "📝 [useTrafficInformation] Regeneration content received:",
              {
                tab,
                language,
                contentLength: content.length,
                contentPreview: content.substring(0, 100) + "...",
              }
            );

            setTabContents((prev) => {
              // Update the specific language content for this tab
              const updatedContent = {
                ...prev[tab].content,
                [language]: content, // Replace the content for the specific language
              };

              // Add to regeneration history if it's not already there
              const existingHistory = prev[tab].regenerationHistory || [];
              const newHistory = existingHistory.includes(content)
                ? existingHistory
                : [...existingHistory, content];

              return {
                ...prev,
                [tab]: {
                  ...prev[tab],
                  content: updatedContent,
                  regenerationHistory: newHistory,
                },
              };
            });
          },
          onError: (err) => {
            handleError(err, "regenerating content", tab);
            setTabContents((prev) => ({
              ...prev,
              [tab]: {
                ...prev[tab],
                isLoading: false,
                error: err,
              },
            }));
          },
          onDone: () => {
            setTabContents((prev) => ({
              ...prev,
              [tab]: {
                ...prev[tab],
                isLoading: false,
              },
            }));
            notificationsService.success(`Content regenerated for ${tab}`);
          },
          signal: controller.signal,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleError(err, "regenerating content", tab);
        }

        setTabContents((prev) => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            isLoading: false,
            error: err,
          },
        }));
      }
    },
    [inputText, tabContents, handleError]
  );

  const stopGeneration = useCallback(() => {
    cleanupStreams();
    setIsGenerating(false);

    // Set all tabs to not loading
    setTabContents((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((tab) => {
        updated[tab as TabKey] = {
          ...updated[tab as TabKey],
          isLoading: false,
        };
      });
      return updated;
    });
  }, [cleanupStreams]);

  const resetAll = useCallback(() => {
    // Stop any ongoing generation
    cleanupStreams();
    setIsGenerating(false);

    // Reset all state to initial values
    setInputText("");
    setActiveTab("DSB.dk");
    setTabContents({
      "DSB.dk": {
        platform: "DSB.dk",
        content: { Danish: "", English: "" },
        isLoading: false,
        regenerationHistory: [],
      },
      "Tavle 7": {
        platform: "Tavle 7",
        content: { Danish: "", English: "" },
        isLoading: false,
        regenerationHistory: [],
      },
      Infoskaerm: {
        platform: "Infoskaerm",
        content: { Danish: "", English: "" },
        isLoading: false,
        regenerationHistory: [],
      },
    });
    setError(null);
    setTabLanguages({
      "DSB.dk": "Danish",
      "Tavle 7": "Danish",
      Infoskaerm: "Danish",
    });

    // Clear localStorage
    localStorage.removeItem("traffic-info-active-tab");
  }, [cleanupStreams]);

  const setTabLanguage = useCallback(
    (tab: TabKey, language: "Danish" | "English") => {
      setTabLanguages((prev) => ({
        ...prev,
        [tab]: language,
      }));
    },
    []
  );

  return {
    // State
    inputText,
    activeTab,
    tabContents,
    isGenerating,
    systemPrompts,
    isLoadingPrompts,
    error,
    tabLanguages,

    // Actions
    setInputText,
    setActiveTab,
    generateContent,
    regenerateContent,
    stopGeneration,
    updateSystemPrompts,
    updateTabContent,
    clearError,
    refreshSystemPrompts,
    setTabLanguage,
    resetAll,
  };
};
