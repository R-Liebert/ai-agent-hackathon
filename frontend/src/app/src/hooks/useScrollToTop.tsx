import { useRef, useCallback } from "react";
import ScrollableFeed from "react-scrollable-feed";

const useScrollToTop = () => {
  // Create a ref for the scrollable container
  const scrollableFeedRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    // Access the scrollable container and scroll it to the top
    if (scrollableFeedRef.current) {
      scrollableFeedRef.current.scrollTop = 0; // Scroll to top manually
    }
  }, []);

  return {
    scrollableFeedRef,
    scrollToTop,
  };
};

export default useScrollToTop;
