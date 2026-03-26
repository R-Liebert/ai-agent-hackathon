import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchEventSource } from '../services/fetch';
import { notificationsService } from '../services/notificationsService';
import { getLanguageConverted } from '../pages/feature-job-post-creator/utils';
import { TabKey } from '../types/trafficInformation';
import { useErrorHandler } from './useErrorHandler';

interface UseTabSpecificRegenerationProps {
  inputText: string;
}

interface UseTabSpecificRegenerationResult {
  isRegenerating: boolean;
  regenerateForTab: (tab: TabKey, language: 'Danish' | 'English', onContent: (content: string) => void) => Promise<void>;
}

export const useTabSpecificRegeneration = ({
  inputText
}: UseTabSpecificRegenerationProps): UseTabSpecificRegenerationResult => {
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regenerateForTab = useCallback(async (
    tab: TabKey, 
    language: 'Danish' | 'English',
    onContent: (content: string) => void
  ) => {
    if (isRegenerating) return;
    
    setIsRegenerating(true);
    let regeneratedContent = "";
    const controller = new AbortController();
    
    const displayLanguage = language === 'Danish' ? 'DA' : 'EN';
    // Convert to format expected by getLanguageConverted (full language names)
    const languageForAPI = language; // Use the original 'Danish' or 'English'
    
    console.log('🔄 [useTabSpecificRegeneration] Starting regeneration:', {
      tab,
      language,
      displayLanguage,
      languageForAPI,
      convertedLanguage: getLanguageConverted(languageForAPI),
      inputText: inputText.substring(0, 50) + '...'
    });
    
    try {
      await fetchEventSource(
        `${window.env.apiUrl}api/trafficInformationGenerator/content`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Platform: tab,
            OutputLanguage: getLanguageConverted(languageForAPI),
            TrafficInformation: inputText,
          }),
          signal: controller.signal,
          onmessage(event) {
            try {
              console.log('🔄 [useTabSpecificRegeneration] Raw SSE Event:', event);
              console.log('🔄 [useTabSpecificRegeneration] Event Data:', event.data);
              
              const data = JSON.parse(event.data);
              console.log('🔄 [useTabSpecificRegeneration] Parsed data:', data);
              
              // Handle stream end signal (using actual backend format with uppercase Content)
              if (data.Content === "stream-ended") {
                setIsRegenerating(false);
                notificationsService.success(
                  t("traffic-information:regenerateNotifications.success")
                );
                console.log('✅ [useTabSpecificRegeneration] Regeneration completed:', {
                  tab,
                  language,
                  finalContent: regeneratedContent.substring(0, 100) + '...',
                  contentLength: regeneratedContent.length
                });
              } else if (data.Content && data.Content !== "Processing..." && data.Content !== "stream-ended") {
                // Handle content data (using actual backend format with uppercase Content)
                regeneratedContent += data.Content;
                console.log('📝 [useTabSpecificRegeneration] Content received and accumulated:', {
                  tab,
                  language,
                  newChunk: data.Content.substring(0, 100) + '...',
                  totalLength: regeneratedContent.length,
                  accumulatedPreview: regeneratedContent.substring(0, 100) + '...'
                });
                // Call the callback with the updated content in real-time
                onContent(regeneratedContent);
              } else if (data.Content === "Processing...") {
                console.log('⏳ [useTabSpecificRegeneration] Processing...');
                // Don't add "Processing..." to content
              }
            } catch (err) {
              console.error('❌ [useTabSpecificRegeneration] Error parsing SSE data:', err);
              console.error('❌ [useTabSpecificRegeneration] Raw event data:', event.data);
              setIsRegenerating(false);
              handleError(err, 'regenerateTabContentParse');
            }
          },
          onerror(err) {
            setIsRegenerating(false);
            handleError(err, 'regenerateTabContentStream');
          },
          onclose() {
            setIsRegenerating(false);
          },
        }
      );
    } catch (err) {
      setIsRegenerating(false);
      handleError(err, 'regenerateTabContentRequest');
    }
  }, [inputText, handleError, t, isRegenerating]);

  return {
    isRegenerating,
    regenerateForTab
  };
};