import React, { useState, useEffect } from "react";
import { ChatMessage } from "../../models/chat-message";
import { v4 as uuidv4 } from "uuid";
import useManualSSEStream from "./meetingNotesStream";
import { useTranslation } from "react-i18next";
import { MessageRole, MessageRoleString } from "../../models/chat-message-role";
import AppHeader from "../../components/Global/AppHeader";
import { notificationsService } from "../../services/notificationsService";
import MeetingNotesMainSection from "../../components/MeetingNotes/MeetingNotesMainSection";
import { Helmet } from "react-helmet-async";
import GlobalContainer from "../../components/Global/AppContainer";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";

function createChatMessage(content: string) {
  return {
    uuid: uuidv4(), // Assumed you have a uuid function
    text: content,
    timestamp: new Date().toISOString(),
    inkey: Math.random(), // or any other logic to generate a unique key
  };
}

export const MeetingNotesPage: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState("Danish");
  const [actionsData, setActionsData] = useState<string>("");
  const [summaryData, setSummaryData] = useState<string>("");
  const [display, setDisplay] = useState<boolean>(false);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [showContent, setShowContent] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const { t } = useTranslation();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: string | null
  ) => {
    if (value === null) {
      return;
    }
    setLanguage(value);
  };

  const {
    loading: actionsLoading,
    error: actionsError,
    startStream: startActionsStream,
  } = useManualSSEStream();

  const {
    loading: summaryLoading,
    error: summaryError,
    startStream: startSummaryStream,
  } = useManualSSEStream();

  const loadingMeetingNotes = actionsLoading || summaryLoading;
  const contentData = actionsData || summaryData;
  const textToDownload = summaryData + "\n" + "\n" + actionsData;

  useEffect(() => {
    if (summaryData && actionsData) {
      const timer = setTimeout(() => {
        setIsStreaming(false);
      }, 3400);
      return () => clearTimeout(timer);
    }
  }, [actionsData, summaryData]);

  const handleStartStreams = async () => {
    if (inputText.trim() === "") {
      notificationsService.error(
        t("meeting-note-generator:errorTranscription")
      );
      return;
    }
    if (tokenCount > 128000) {
      notificationsService.error(t("meeting-note-generator:errorTokenCount"));
      return;
    }

    notificationsService.success(t("meeting-note-generator:startGenerate"));

    const actionsUrl = `${window.env.apiUrl}api/generator/meeting-notes-actions`;
    const summaryUrl = `${window.env.apiUrl}api/generator/meeting-notes-summary`;
    setIsStreaming(true);
    setActionsData("");
    setSummaryData("");
    setDisplay(true);
    startActionsStream({
      url: actionsUrl,
      bodyParams: { prompt: inputText, language },
      setData: setActionsData,
    });
    startSummaryStream({
      url: summaryUrl,
      bodyParams: { prompt: inputText, language },
      setData: setSummaryData,
    });
  };

  const actionsMessage = createChatMessage(actionsData);
  const summaryMessage = createChatMessage(summaryData);

  function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return function (...args: Parameters<T>) {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setInputText(text); // Immediate state update for typing
    debouncedTokenCount(text); // Debounced function for token counting
  };

  const debouncedTokenCount = debounce(async (text: string) => {
    try {
      // Dynamically import tiktoken only when needed
      const { encoding_for_model } = await import("tiktoken");
      const enc = encoding_for_model("gpt-4-turbo-2024-04-09");
      const tokens = enc.encode(text);
      setTokenCount(tokens.length);
    } catch {
      // Fallback token counting method if tokenizer load fails.
      setTokenCount(Math.ceil(text.length / 4)); // Simple approximation
    }
  }, 700);

  const actionMessageContent = new ChatMessage(
    uuidv4(),
    actionsData,
    MessageRoleString[MessageRole.Assistant],
    new Date().toISOString()
  );
  const summaryMessageContent = new ChatMessage(
    uuidv4(),
    summaryData,
    MessageRoleString[MessageRole.Assistant],
    new Date().toISOString()
  );

  const handleReset = () => {
    setDisplay(false);
    setActionsData("");
    setSummaryData("");
    setInputText("");
    setShowContent(false);
    setIsStreaming(false);
  };

  return (
    <>
      <Helmet>
        <title>Meeting Notes - AI Launchpad</title>
        <meta name="description" content="Meeting Notes Page" />
      </Helmet>
      <AppHeader
        file={null}
        showContent={showContent}
        title={t("meeting-note-generator:moduleName")}
        handleReset={handleReset}
        moduleName={t("meeting-note-generator:moduleName")}
        returnBtnText={t("codechat:menuLink")}
        resetMeetingNotes={display}
      />
      <PageTransitionContainer>
        <GlobalContainer>
          <MeetingNotesMainSection
            language={language}
            handleChange={handleChange}
            inputText={inputText}
            handleInputChange={handleInputChange}
            tokenCount={tokenCount}
            handleStartStreams={handleStartStreams}
            loadingMeetingNotes={loadingMeetingNotes}
            display={display}
            isStreaming={isStreaming}
            actionMessageContent={actionMessageContent}
            actionMessageInkey={actionsMessage.inkey}
            summaryMessageContent={summaryMessageContent}
            summaryMessageInkey={summaryMessage.inkey}
            actionsError={actionsError}
            summaryError={summaryError}
            textToDownload={textToDownload}
            contentData={contentData}
          />
        </GlobalContainer>
      </PageTransitionContainer>
    </>
  );
};
