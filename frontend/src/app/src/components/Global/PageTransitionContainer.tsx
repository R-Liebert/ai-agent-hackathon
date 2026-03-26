import React from "react";
import { motion } from "framer-motion";
import useSidebarStore from "../../stores/navigationStore";
import { useMediaQuery } from "../../hooks/useMediaQuery";

interface PageTransitionContainerProps {
  children: React.ReactNode;
}

const PageTransitionContainer: React.FC<PageTransitionContainerProps> = ({
  children,
}) => {
  const { isSidebarOpen } = useSidebarStore();
  const isWide = useMediaQuery("(min-width: 768px)");
  const isMobile = useMediaQuery("(max-width: 767px)"); // sm breakpoint

  const basePadding = "3.4rem";
  const openPadding = "18.4rem";
  const mobilePadding = "0rem"; // No padding on mobile - sidebar slides over content

  return (
    <motion.main
      // Mobile: 0 padding (sidebar slides over); Desktop: animate between closed/open
      animate={
        isMobile
          ? { paddingLeft: mobilePadding }
          : isWide
          ? { paddingLeft: isSidebarOpen ? openPadding : basePadding }
          : { paddingLeft: basePadding }
      }
      // Avoid initial mount animation; go straight to target
      initial={false}
      // Disable transition on mobile and below 700px
      transition={
        isMobile || !isWide
          ? { duration: 0 }
          : { duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }
      }
      className="overflow-x-hidden"
    >
      {children}
    </motion.main>
  );
};

export default PageTransitionContainer;
