import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  ForwardedRef,
} from "react";
import { AnimatePresence, easeIn, motion } from "framer-motion";
import { TbArrowUp } from "react-icons/tb";
import { useCanvas } from "../../hooks/useCanvas";
import { MessageSource } from "../../contexts/CanvasContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import useSidebarStore from "../../stores/navigationStore";

interface CanvasInitializeChatCardProps {
  position?: { x: number; y: number };
  onClose: () => void;
  setShowTextEditCard?: React.Dispatch<React.SetStateAction<boolean>>;
  dialogueHeaderRef?: string;
  dialogueSelectedText?: string;
  dialogueMessageId?: string;
  showInitializeChatCard?: boolean;
  selectionRef?: React.RefObject<Range>;
  closeAllCards: () => void;
  selectionContext?: { beforeText: string; afterText: string }; // Phase 0: Surrounding context
}

const CanvasInitializeChatCard = forwardRef<
  HTMLDivElement,
  CanvasInitializeChatCardProps
>(
  (
    {
      position,
      onClose,
      setShowTextEditCard,
      dialogueHeaderRef,
      dialogueSelectedText,
      dialogueMessageId,
      showInitializeChatCard,
      selectionRef,
      closeAllCards,
      selectionContext,
    },
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const { handleSendCanvasMessage } = useCanvas(); // Use the context function
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [inputValue, setInputValue] = useState("");
    const [textAreaHeight, setTextAreaHeight] = useState(20);
    const isMobileAndTablet = useMediaQuery("(max-width: 1200px)");
    const isBetween1200And1500 = useMediaQuery(
      "(min-width: 1200px) and (max-width: 1500px)"
    );
    const { isSidebarOpen } = useSidebarStore();

    useEffect(() => {
      adjustTextAreaHeight();
    }, [inputValue]);

    // Auto-focus the textarea when the component opens
    useEffect(() => {
      if (showInitializeChatCard && textAreaRef.current) {
        // Small delay to ensure the component is fully rendered
        const timeoutId = setTimeout(() => {
          textAreaRef.current?.focus();
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }, [showInitializeChatCard]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          ref &&
          "current" in ref &&
          ref.current &&
          !ref.current.contains(event.target as Node)
        ) {
          onClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [onClose, ref]);

    const getSelectedTextFallback = (): string => {
      if (!dialogueMessageId) return "";
      const contentEl = document.querySelector(
        `[data-message-id="${dialogueMessageId}"] [data-section-content]`
      ) as HTMLElement | null;
      return contentEl ? contentEl.innerText.trim() : "";
    };

    const handleMessageSend = async () => {
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      // Fallback to full section text if dialogueSelectedText is empty
      const selectedTextSafe =
        dialogueSelectedText && dialogueSelectedText.trim().length > 0
          ? dialogueSelectedText
          : getSelectedTextFallback();

      if (!dialogueHeaderRef && !selectedTextSafe) {
        console.warn("CanvasInitializeChatCard: Missing text reference.");
        return;
      }

      // Close the popup IMMEDIATELY before starting the streaming
      closeAllCards();
      setInputValue("");
      onClose();
      if (setShowTextEditCard) setShowTextEditCard(false);

      // Send the message (don't await - let it stream in the background)
      handleSendCanvasMessage({
        inputValue: trimmed,
        source: MessageSource.HighlightCard,
        sectionId: dialogueMessageId,
        sectionRef: dialogueHeaderRef,
        selectedText: selectedTextSafe,
        beforeText: selectionContext?.beforeText,
        afterText: selectionContext?.afterText,
      });
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setInputValue(newValue);
    };

    const adjustTextAreaHeight = () => {
      if (textAreaRef.current) {
        textAreaRef.current.style.height = "auto";
        textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        setTextAreaHeight(textAreaRef.current.scrollHeight);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && inputValue.trim()) {
        e.preventDefault();
        handleMessageSend();
      }
    };

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          className={`absolute shadow-xl max-w-xs px-3 flex flex-col bg-gray-400 overflow-visible max-h-[30rem] rounded-3xl ${
            position
              ? ""
              : isMobileAndTablet || (isSidebarOpen && isBetween1200And1500)
              ? "left-4 right-auto top-0 z-[999999]"
              : "-right-[18rem] top-10 z-[99]"
          }`}
          style={
            position
              ? {
                  left: position.x,
                  top: position.y,
                }
              : undefined
          }
          initial={{ height: "auto", opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: easeIn }}
        >
          <textarea
            ref={textAreaRef}
            value={inputValue}
            onChange={(e) => {
              handleChange(e);
              adjustTextAreaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI..."
            className="w-full outline-none font-body placeholder:text-gray-300 text-white-100 placeholder-gray-300 bg-transparent focus:outline-none focus:text-white-100 resize-none pl-2 pr-8 mt-3 mb-3 max-h-[30rem]"
            rows={1}
          />
          <button
            onClick={handleMessageSend}
            className={`absolute top-[7px] right-2 rounded-full p-[5.8px] outline-none border-none ${
              !inputValue.trim()
                ? "bg-gray-300 text-gray-800/70"
                : "bg-white-200 text-gray-800"
            }`}
          >
            <TbArrowUp strokeWidth={2.2} size={22} />
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }
);

export default CanvasInitializeChatCard;
