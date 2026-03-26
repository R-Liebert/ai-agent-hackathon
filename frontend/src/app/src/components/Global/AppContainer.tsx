import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useScrollToTop from "../../hooks/useScrollToTop";

interface AppContainerProps {
  children: React.ReactNode;
}

const GlobalContainer: React.FC<AppContainerProps> = ({ children }) => {
  const { scrollableFeedRef, scrollToTop } = useScrollToTop();
  const location = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [location, scrollToTop]);

  return (
    <AnimatePresence>
      <motion.main
        className="flex w-full overflow-x-hidden pt-[2rem]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          ref={scrollableFeedRef}
          className="content grow overflow-y-auto mt-[1rem]"
          style={{ maxHeight: "100vh", overflowY: "auto" }}
        >
          {children}
        </div>
      </motion.main>
    </AnimatePresence>
  );
};

export default GlobalContainer;
