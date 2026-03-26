import React, { useState, useRef, useEffect, forwardRef } from "react";
import {
  BoldIcon,
  ItalicsIcon,
  IniztializeChatIcon,
} from "../../assets/icons/canvasIcons";
import { AnimatePresence, easeIn, motion } from "framer-motion";

interface CanvasTextEditCardProps {
  position: { x: number; y: number };
  onClose: () => void;
  canvasRect: DOMRect | undefined;
  handleInitializeChat: (e: React.MouseEvent<HTMLButtonElement>) => void;
  applyBoldFormatting: () => void;
  applyItalicFormatting: () => void;
}

const CanvasTextEditCard: React.FC<CanvasTextEditCardProps> = ({
  position,
  onClose,
  canvasRect,
  handleInitializeChat,
  applyBoldFormatting,
  applyItalicFormatting,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        className="flex absolute shadow-xl rounded-xl bg-gray-400 p-2 shadow-lg gap-2"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: easeIn }}
      >
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInitializeChat}
          className={`flex gap-2 place-content-center !hover:text-superwhite p-2 text-center transform transition-all duration-200 ease-in-out border-transparent hover:bg-gray-350 rounded-xl relative group`}
        >
          <IniztializeChatIcon size={24} />
          <span className="text-md font-medium !hover:text-superwhite">
            Ask DSB Chat
          </span>
        </button>
        <div className="flex gap-1 place-content-center place-items-center pl-2 border-l-2 border-gray-500">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyBoldFormatting}
            className={`flex place-content-center p-2 !hover:text-superwhite text-center transform transition-all duration-200 ease-in-out border-transparent hover:bg-gray-350 rounded-lg relative group`}
          >
            <BoldIcon size={16} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyItalicFormatting}
            className={`flex place-content-center p-2 !hover:text-superwhite text-center transform transition-all duration-200 ease-in-out border-transparent hover:bg-gray-350 rounded-lg relative group`}
          >
            <ItalicsIcon size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CanvasTextEditCard;
