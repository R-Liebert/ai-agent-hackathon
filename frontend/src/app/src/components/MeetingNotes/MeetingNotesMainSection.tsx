import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MeetingNotesTranscription from "./MeetingNotesTranscription";
import { ChatMessage } from "../../models/chat-message";
import Footer from "../Global/AppFooter";
import MeetingNotesOutput from "./MeetingNotesOutput";

interface MeetingNotesMainProps {
  language: string;
  handleChange: (
    event: React.MouseEvent<HTMLElement>,
    value: string | null
  ) => void;
  inputText: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  tokenCount: number;
  handleStartStreams: () => void;
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
}

const MeetingNotesMainSection: React.FC<MeetingNotesMainProps> = ({
  language,
  handleChange,
  inputText,
  handleInputChange,
  tokenCount,
  handleStartStreams,
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
}) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 900);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 900);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="xxxl:w-[102rem] xxl:w-[90rem] lg:w-[76vw] w-[92%] mx-auto xxl:!h-[95vh] lg:!h-[90vh] !h-screen pt-[1rem] xxl:pt-[2rem] pb-4 xxl:pb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full flex md:flex-row flex-col justify-between h-full mx-auto">
          <MeetingNotesTranscription
            language={language}
            handleChange={handleChange}
            inputText={inputText}
            handleInputChange={handleInputChange}
            tokenCount={tokenCount}
            handleStartStreams={handleStartStreams}
            contentData={contentData}
            isDesktop={isDesktop}
            display={display}
            isStreaming={isStreaming}
          />
          <MeetingNotesOutput
            loadingMeetingNotes={loadingMeetingNotes}
            display={display}
            isStreaming={isStreaming}
            actionMessageContent={actionMessageContent}
            actionMessageInkey={actionMessageInkey}
            summaryMessageContent={summaryMessageContent}
            summaryMessageInkey={summaryMessageInkey}
            actionsError={actionsError}
            summaryError={summaryError}
            textToDownload={textToDownload}
            contentData={contentData}
            handleStartStreams={handleStartStreams}
            isDesktop={isDesktop}
          />
        </div>
        {isDesktop ? <Footer /> : !display && !isStreaming && <Footer />}
      </motion.div>
    </AnimatePresence>
  );
};

export default MeetingNotesMainSection;
