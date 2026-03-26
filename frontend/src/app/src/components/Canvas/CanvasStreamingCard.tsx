import React, { useRef } from "react";
import { TbFileDescription } from "react-icons/tb";
import { motion } from "framer-motion";
import { useCanvas } from "../../hooks/useCanvas";

const CanvasStreamingCard: React.FC = ({}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);
  const { canvasTitle, isStreamingCanvasContent } = useCanvas();

  return (
    <motion.div
      ref={cardRef}
      layout
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="inline-flex bg-gray-600 border-2 border-gray-500 rounded-lg text-white-100 p-3 place-items-center place-content-center mt-2"
    >
      <div
        ref={cardContentRef}
        className="w-full flex place-items-center place-content-center gap-3"
      >
        <TbFileDescription size={26} strokeWidth={1.4} />
        {isStreamingCanvasContent ? (
          <div className="dot-pulse-container">
            <div className="dot-pulse" />
          </div>
        ) : null}

        <span
          className={`${
            isStreamingCanvasContent ? "ml-5 mr-2" : ""
          } text-md capitalize font-body`}
        >
          {canvasTitle}
        </span>
      </div>
    </motion.div>
  );
};

export default CanvasStreamingCard;
