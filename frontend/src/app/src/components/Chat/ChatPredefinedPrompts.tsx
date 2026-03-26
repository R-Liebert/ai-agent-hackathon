import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

type PredefinedItem = {
  description: string;
};

interface PredefinedPromptsChatProps {
  predefinedPrompts: PredefinedItem[];
  isMobile: boolean;
  handleClickPrompt: (prompt: string, promptIndex: number) => void;
  chatType?: string;
}

const ChatPredefinedPrompts = ({
  predefinedPrompts,
  isMobile,
  handleClickPrompt,
  chatType,
}: PredefinedPromptsChatProps) => {
  const onClickPrompt = (item: PredefinedItem, promptIndex: number) => {
    handleClickPrompt(item.description, promptIndex);
  };

  const { t } = useTranslation();

  return (
    <div
      className={`${
        isMobile ? "fixed bottom-20 left-0 right-0 z-50" : "relative"
      } flex flex-col w-full max-w-3xl justify-center mx-auto px-4 lg:px-0 my-6 z-20`}
    >
      {chatType === "Feedback" ? (
        <span className="flex text-md text-center font-body place-content-center w-full mb-4 mx-auto">
          {t("feedback:chatDialogueBox.promptsTitle")}
        </span>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {predefinedPrompts.map((item: PredefinedItem, index: number) => {
          return (
            <StarterButton key={index} item={item} onClick={onClickPrompt} />
          );
        })}
      </div>
    </div>
  );
};

const StarterButton = ({
  item,
  onClick,
}: {
  item: PredefinedItem;
  onClick: (item: PredefinedItem, index: number) => void;
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      // Check if the text is overflowing its container
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [item.description]);

  return (
    <div className="relative group">
      <button
        aria-label={item.description}
        className={`truncate max-w-screen-xs xxs:max-w-[90vw]  sm:max-w-[40vw] md:max-w-[18rem] lg:max-w-[23.6rem] text-white-100 hover:text-superwhite flex-grow flex items-center justify-center border-2 py-[9px] px-5 border-gray-500 hover:border-gray-600 gap-2 font-body rounded-full hover:bg-gray-600 relative z-3 
                     w-auto transition-all duration-300 ease-in-out text-[14.4px]`}
        onClick={() => onClick(item, 0)}
      >
        <span
          ref={textRef}
          className="truncate"
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {item.description}
        </span>
      </button>
      {/* Tooltip only if the text is truncated */}
      {isTruncated && (
        <div
          className="absolute left-0 top-full mt-2 hidden group-hover:block bg-gray-900 text-white-100 text-sm rounded-md px-3 py-1 shadow-lg z-10"
          style={{ whiteSpace: "nowrap" }}
        >
          {item.description}
        </div>
      )}
    </div>
  );
};

export default ChatPredefinedPrompts;
