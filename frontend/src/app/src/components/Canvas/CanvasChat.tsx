import React, { useState } from "react";
import ChatInput from "../../components/Chat/ChatInput";
import { ChatdialogueBox } from "../../components/Chat/ChatDialogueBox";
import { ChatFooter } from "../../components/Chat/ChatFooter";
import { IconType } from "react-icons";
import ScrollableFeed from "react-scrollable-feed";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSource } from "../../contexts/CanvasContext";
import { useCanvas } from "../../hooks/useCanvas";
import useSidebarStore from "../../stores/navigationStore";
import { useMediaQuery } from "../../hooks/useMediaQuery";

interface CanvasChatProps {
  chatType: string;
  displayName: string;
  moduleName?: string;
  accentColor?: string;
  agentAvatarColor?: string;
  loading: boolean;
  loadingMessages: boolean;
  reasoningTags?: string[];
  isModelSelectable?: boolean;
  selectedValue?: string;
  totalFileCount?: number;
  resetFiles?: boolean;
  setResetFiles?: (val: boolean) => void;
  setTotalFileCount?: (val: number) => void;
  setImageGenerationEnabled?: (val: boolean) => void;
  Icon?: React.ReactElement | IconType;
  isEditing?: boolean;
  setIsEditing?: React.Dispatch<React.SetStateAction<boolean>>;
}

const CanvasChat: React.FC<CanvasChatProps> = ({
  chatType,
  displayName,
  moduleName,
  accentColor,
  agentAvatarColor,
  loading,
  loadingMessages,
  reasoningTags,
  isModelSelectable,
  selectedValue,
  totalFileCount,
  resetFiles,
  setResetFiles,
  setTotalFileCount,
  setImageGenerationEnabled,
  Icon,
  isEditing,
  setIsEditing,
}) => {
  const {
    currentChatMessages,
    handleSendCanvasMessage,
    setIsStreamingCanvasChatMessages,
    isStreamingCanvasChatMessages,
    isStreamingCanvasContent,
    handleStopStreaming,
  } = useCanvas();

  const { isSidebarOpen } = useSidebarStore();
  const isTablet = useMediaQuery("(min-width: 900px)");
  const [showFullDialogue, setShowFullDialogue] = useState<boolean>(isTablet);

  const handleSendMessage = async (inputValue: string) => {
    if (inputValue.trim() === "") return;

    await handleSendCanvasMessage({
      inputValue,
      source:
        chatType === "HighlightCard"
          ? MessageSource.HighlightCard
          : MessageSource.ChatInput,
    });
  };

  const handleShowFullDialogue = () => {
    setShowFullDialogue(!showFullDialogue);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="canvas-chat-panel"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: {
            duration: 1,
            ease: "easeInOut",
            //delay: 2,
          },
        }}
        exit={{
          opacity: 0,
          transition: {
            duration: 1,
            ease: "easeInOut",
          },
        }}
      >
        <div
          className={`${
            isSidebarOpen && isTablet
              ? "pl-[17rem] w-[54vw] xl:w-[44.6vw]"
              : " md:pl-[3.8rem] w-auto md:w-[49.7vw] lg:w-[37vw]"
          } transition-all duration-[400ms] ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] z-[100]  md:z-[99] inset-x-0 bg-blue-500 fixed bottom-0 md:!top-0 !left-0 bg-gray-800 ${
            showFullDialogue ? "pt-14 h-screen" : "pt-0 h-auto"
          } md:!h-full p-0 md:pt-[4rem] flex flex-col justify-between`}
        >
          {/* Scrollable Chat Feed */}
          {(isTablet || showFullDialogue) && (
            <ScrollableFeed
              className={`flex-grow overflow-y-auto w-full relative`}
              forceScroll={false}
            >
              <div className="w-full px-5 max-w-[39rem] lg:max-w-none mx-auto lg:mx-0">
                <div className="flex flex-col w-full overflow-x-hidden overflow-y-hidden">
                  <ChatdialogueBox
                    dialogue={currentChatMessages}
                    displayName={displayName}
                    key={1}
                    loading={isStreamingCanvasChatMessages}
                    loadingMessages={loadingMessages}
                    displayPlaceholder={false}
                    moduleName={moduleName}
                    agentAvatarColor={agentAvatarColor}
                    chatType={chatType}
                    Icon={Icon}
                    reasoningTags={reasoningTags}
                    handleSendMessage={handleSendMessage}
                    chatId="canvas-chat"
                  />
                </div>
              </div>
            </ScrollableFeed>
          )}

          {/* Chat Input + Footer */}
          <div className="relative w-full pb-4 px-5 max-w-[40rem] lg:max-w-none mx-auto lg:mx-0 h-auto">
            <ChatInput
              sendMessage={handleSendMessage}
              handleCloseStream={handleStopStreaming}
              isLoading={
                isStreamingCanvasChatMessages || isStreamingCanvasContent
              }
              accentColor={accentColor}
              isAttachmentEnabled={
                isModelSelectable &&
                (selectedValue === "GPT-4o" ||
                  selectedValue === "GPT-4o mini") &&
                (totalFileCount || 0) <= 20
              }
              chatId="canvas-chat"
              resetFiles={resetFiles}
              onResetComplete={() => setResetFiles && setResetFiles(false)}
              totalFileCount={totalFileCount || 0}
              onTotalFileCountChange={setTotalFileCount}
              onImageGenerationChange={setImageGenerationEnabled}
              chatType={chatType}
              selectedModel={selectedValue}
              moduleName={moduleName}
              handleShowFullDialogue={handleShowFullDialogue}
              showExpandIcon={!isTablet}
            />
            <ChatFooter />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CanvasChat;
