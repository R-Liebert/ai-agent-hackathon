import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./meeting-notes.css";
import { ChatMessageComponent } from "../Chat/ChatMessage";
import { HiMiniNewspaper } from "react-icons/hi2";
import LoadingSkeleton from "../Global/AppLoadingSkeleton";
import { ChatMessage } from "../../models/chat-message";
import PlaceholderContent from "../Global/AppPlaceholderContent";
import MeetingNotesDownloadButton from "./MeetingNotesDownloadButton";
import OutputHeader from "../Global/AppOutputHeader";
import Footer from "../Global/AppFooter";
import useSidebarStore from "../../stores/navigationStore";
import { useMediaQuery } from "../../hooks/useMediaQuery";

interface MeetingNotesOutputProps {
  contentData: string;
  loadingMeetingNotes: boolean;
  display: boolean;
  isStreaming: boolean;
  actionMessageContent: ChatMessage;
  actionMessageInkey: number;
  summaryMessageContent: ChatMessage;
  summaryMessageInkey: number;
  actionsError: boolean;
  summaryError: boolean;
  textToDownload: string;
  handleStartStreams: () => void;
  isDesktop: boolean;
}

const MeetingNotesOutput: React.FC<MeetingNotesOutputProps> = ({
  loadingMeetingNotes,
  display,
  isStreaming,
  actionMessageContent,
  actionMessageInkey,
  summaryMessageContent,
  summaryMessageInkey,
  actionsError,
  summaryError,
  textToDownload,
  contentData,
  handleStartStreams,
  isDesktop,
}) => {
  const { isSidebarOpen } = useSidebarStore();
  const isAbove700px = useMediaQuery("(min-width: 700px)");
  const { t } = useTranslation();
  const [maxHeightClass, setMaxHeightClass] = useState("max-h-auto");

  const actionMessageRef = useRef<HTMLDivElement>(null);
  const summaryMessageRef = useRef<HTMLDivElement>(null);
  const [htmlToCopy, setHtmlToCopy] = useState<string>("");

  useEffect(() => {
    if (actionMessageRef.current && summaryMessageRef.current) {
      const combinedHTML = `
        ${summaryMessageRef.current.innerHTML}
        <br/><br/>
        ${actionMessageRef.current.innerHTML}
      `;
      setHtmlToCopy(combinedHTML);
    }
  }, [actionMessageContent, summaryMessageContent]);

  useEffect(() => {
    const updateMaxHeight = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width > 2200 && height < 1800) {
        setMaxHeightClass("max-h-100vh]");
      } else if (width > 1500 && width < 2200) {
        if (height > 900) {
          setMaxHeightClass("max-h-[90vh]");
        } else if (height < 900) {
          setMaxHeightClass("max-h-[82.4vh]");
        }
      } else if (width > 1200 && width < 1500 && height < 900) {
        setMaxHeightClass("max-h-[82vh]");
      } else {
        setMaxHeightClass("max-h-[90vh]");
      }
    };

    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);

    return () => {
      window.removeEventListener("resize", updateMaxHeight);
    };
  }, []);

  return (
    <div
      className={`w-full md:w-[50%] h-full overflow-hidden flex flex-col md:flex-row
    ${
      !isDesktop && (contentData || isStreaming)
        ? `fixed ${
            isSidebarOpen && isAbove700px
              ? "translate-x-[7.6rem]" // Sidebar open
              : "translate-x-0 md:translate-x-[2rem]" // Sidebar closed
          } transition-all duration-700 ease-in-out transform bg-gray-800 z-1 inset-0 flex justify-center items-center px-4`
        : "relative"
    }`}
    >
      <div
        className={`flex ${
          isAbove700px
            ? isSidebarOpen && !isDesktop
              ? "w-[calc(100vw-18rem)]" // Sidebar open, above 700px
              : "md:w-[calc(100vw-8rem)]" // Sidebar closed, above 700px
            : "w-[calc(100vw-2rem)]"
        } lg:w-full flex-col h-full overflow-hidden md:pt-0 pt-20`}
      >
        <OutputHeader
          contentData={contentData}
          loadingState={loadingMeetingNotes}
          title={t("meeting-note-generator:outputHeader")}
          htmlToCopy={htmlToCopy}
          isStreaming={isStreaming}
          handleStartStreams={handleStartStreams}
          isDesktop={isDesktop}
        />
        {!loadingMeetingNotes && !display ? (
          <PlaceholderContent
            Icon={HiMiniNewspaper}
            welcomeText={t("meeting-note-generator:welcomeText")}
            isDesktop={isDesktop}
          />
        ) : (
          <>
            {/* Generated Content */}
            {loadingMeetingNotes && isStreaming ? (
              <LoadingSkeleton />
            ) : (
              <div className="w-full overflow-y-auto lg:pr-10 pr-0 pb-10 xxl:mb-20 lg:mb-14 mb-4 lg:mt-2 md:mt-4 mt-6 xxxl:mt-4 text-white-100 flex flex-col meeting-notes-output">
                <ChatMessageComponent
                  ref={summaryMessageRef}
                  agentAvatarColor="#f4ac36"
                  message={summaryMessageContent}
                  inkey={summaryMessageInkey}
                  loading={false}
                  error={summaryError}
                  isChat={false}
                  moduleName={t("meeting-note-generator:moduleName")}
                  chatType={"MeetingNotes"}
                />
                <ChatMessageComponent
                  ref={actionMessageRef}
                  agentAvatarColor="#f4ac36"
                  message={actionMessageContent}
                  inkey={actionMessageInkey}
                  loading={false}
                  error={actionsError}
                  isChat={false}
                  moduleName={t("meeting-note-generator:moduleName")}
                  chatType={"MeetingNotes"}
                />
              </div>
            )}
            <MeetingNotesDownloadButton
              loadingMeetingNotes={loadingMeetingNotes}
              isStreaming={isStreaming}
              textToDownload={textToDownload}
              actionsError={actionsError}
              summaryError={summaryError}
            />
          </>
        )}
      </div>
      {!isDesktop && (contentData || isStreaming) && <Footer />}
    </div>
  );
};

export default MeetingNotesOutput;
