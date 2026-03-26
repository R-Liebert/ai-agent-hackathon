import { useEffect, useRef, useState } from "react";
import { TbArrowDown, TbArrowUp } from "react-icons/tb";
import { useScrollStore } from "../../stores/scrollStore";
import useSidebarStore from "../../stores/navigationStore";

interface ChatScrollArrowProps {
  isMobile: boolean;
}

const ChatScrollArrow: React.FC<ChatScrollArrowProps> = ({ isMobile }) => {
  const { showArrow, scrollPosition } = useScrollStore();
  const { isSidebarOpen } = useSidebarStore();

  const lastPosRef = useRef<number>(0);
  const [isScrollingUp, setIsScrollingUp] = useState<boolean>(false);

  // Detect scroll direction from Zustand scrollPosition
  useEffect(() => {
    const up = scrollPosition < lastPosRef.current;
    setIsScrollingUp(up);
    lastPosRef.current = scrollPosition;
  }, [scrollPosition]);

  const getScrollContainer = (): HTMLElement => {
    const el = document.querySelector<HTMLElement>(".content");
    return el || document.documentElement;
  };

  const scrollToBottom = () => {
    const el = getScrollContainer();
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const scrollToTop = () => {
    const el = getScrollContainer();
    el.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClick = () => {
    if (isScrollingUp) {
      scrollToTop();
    } else {
      scrollToBottom();
    }
  };

  if (!showArrow) return null;

  return (
    <button
      onClick={handleClick}
      aria-label={isScrollingUp ? "Scroll to top" : "Scroll to bottom"}
      className={`${
        isSidebarOpen && !isMobile ? "ml-[7.7rem]" : "ml-[1.6rem]"
      } ${
        isMobile ? "-ml-[.78rem]" : ""
      } left-1/2 -translate-x-1/2 fixed bottom-[6.2rem] z-50 hover:bg-gray-900 border-2 border-gray-500 text-white p-[6px] rounded-full shadow-lg bg-gray-800 transition-all duration-300 ease-in-out`}
    >
      {isScrollingUp ? <TbArrowUp size={21} /> : <TbArrowDown size={21} />}
    </button>
  );
};

export default ChatScrollArrow;
