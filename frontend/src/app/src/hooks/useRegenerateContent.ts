import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchEventSource } from '../services/fetch';
import { notificationsService } from '../services/notificationsService';
import { getLanguageConverted } from '../pages/feature-job-post-creator/utils';
import { TabKey } from '../types/trafficInformation';
import { useErrorHandler } from './useErrorHandler';

interface UseRegenerateContentProps {
  activeTab: TabKey;
  displayLanguage: 'DA' | 'EN';
  inputText: string;
}

interface RegenerateContentResult {
  isRegenerating: boolean;
  regeneratedContents: string[];
  regenerateContent: (fromModal?: boolean) => Promise<void>;
  addRegeneratedContent: (content: string) => void;
  clearRegeneratedContents: () => void;
}

export const useRegenerateContent = ({
  activeTab,
  displayLanguage,
  inputText
}: UseRegenerateContentProps): RegenerateContentResult => {
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratedContents, setRegeneratedContents] = useState<string[]>([]);

  const addRegeneratedContent = useCallback((content: string) => {
    setRegeneratedContents(prev => {
      if (!prev.includes(content)) {
        return [content, ...prev];
      }
      return prev;
    });
  }, []);

  const clearRegeneratedContents = useCallback(() => {
    setRegeneratedContents([]);
  }, []);

  const regenerateContent = useCallback(async (fromModal: boolean = false) => {
    setIsRegenerating(true);
    let regeneratedContent = "";
    const controller = new AbortController();
    
    try {
      await fetchEventSource(
        `${window.env.apiUrl}api/trafficInformationGenerator/content`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Platform: activeTab,
            OutputLanguage: getLanguageConverted(displayLanguage),
            TrafficInformation: inputText,
          }),
          signal: controller.signal,
          onmessage(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.content === "stream-ended") {
                setIsRegenerating(false);
                notificationsService.success(
                  t("traffic-information:regenerateNotifications.success")
                );
              } else if (data.content !== undefined) {
                regeneratedContent += data.content;
                if (fromModal) {
                  setRegeneratedContents((prev) => {
                    if (!prev.includes(regeneratedContent)) {
                      return [...prev, regeneratedContent];
                    }
                    return prev;
                  });
                }
              }
            } catch (err) {
              setIsRegenerating(false);
              handleError(err, 'regenerateContentParse');
            }
          },
          onerror(err) {
            setIsRegenerating(false);
            handleError(err, 'regenerateContentStream');
          },
          onclose() {
            setIsRegenerating(false);
          },
        }
      );
    } catch (err) {
      setIsRegenerating(false);
      handleError(err, 'regenerateContentRequest');
    }
  }, [activeTab, displayLanguage, inputText, handleError]);

  return {
    isRegenerating,
    regeneratedContents,
    regenerateContent,
    addRegeneratedContent,
    clearRegeneratedContents
  };
};