import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useScrollToTop from "../../hooks/useScrollToTop";
import ScrollableFeed from "react-scrollable-feed";
import useScrollToBottom from "../../hooks/useScrollToBottom";

interface AppContainerChatProps {
  children: React.ReactNode;
}

const GlobalChatContainer: React.FC<AppContainerChatProps> = ({ children }) => {
  const location = useLocation();
  const { scrollableFeedRef, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    scrollToBottom();
  }, [location, scrollToBottom]);

  return (
    <AnimatePresence>
      <motion.main
        className="flex w-full overflow-x-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ScrollableFeed
          ref={scrollableFeedRef}
          className="content grow overflow-y-auto"
          forceScroll={false}
        >
          {children}
        </ScrollableFeed>
      </motion.main>
    </AnimatePresence>
  );
};

export default GlobalChatContainer;
