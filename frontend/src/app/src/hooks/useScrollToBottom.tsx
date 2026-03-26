import { useRef, useCallback } from "react";
import ScrollableFeed from "react-scrollable-feed";

const useScrollToBottom = () => {
  const scrollableFeedRef = useRef<ScrollableFeed>(null);

  const scrollToBottom = useCallback(() => {
    scrollableFeedRef.current?.scrollToBottom();
  }, []);

  return {
    scrollableFeedRef,
    scrollToBottom,
  };
};

export default useScrollToBottom;
