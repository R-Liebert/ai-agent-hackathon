import React, { useState, useEffect } from "react";
import { IoPlay } from "react-icons/io5";
import { motion } from "framer-motion";

interface VideoCardProps {
  thumbnailUrl: string;
  thumbnailBase64: string;
  title: string;
  onClick: () => void;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(
  ({ thumbnailUrl, thumbnailBase64, title, onClick }) => {
    const [hovered, setHovered] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 900);

    // Update screen size state on window resize
    useEffect(() => {
      const handleResize = () => {
        setIsDesktop(window.innerWidth > 1200);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
      <div
        className="relative cursor-pointer w-full max-w-sm sm:max-w-md mx-auto flex flex-col rounded-2xl bg-gray-650 border-2 border-gray-500 min-h-2000"
        onMouseEnter={() => isDesktop && setHovered(true)}
        onMouseLeave={() => isDesktop && setHovered(false)}
        onClick={onClick}
      >
        <div
          className={`relative pb-[56.25%] rounded-t-2xl overflow-hidden ${
            hovered && isDesktop ? "bg-black-950 bg-opacity-90" : ""
          }`}
        >
          <div className="bg-opacity-20 absolute inset-0 bg-gray-950 w-full h-full object-cover z-10"></div>

          {thumbnailBase64 && (
            <img
              src={`data:image/png; base64, ${thumbnailBase64}`}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover z-1"
            />
          )}
          {!thumbnailBase64 && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover z-1"
            />
          )}

          {(hovered && isDesktop) || !isDesktop ? (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <button className="w-20 h-20 bg-gray-900/60 rounded-full flex items-center justify-center">
                <IoPlay size={44} className="text-center pl-1 m-0 flex" />
              </button>
            </motion.div>
          ) : null}
        </div>
        <div className="p-4 text-white-100 text-md w-full font-body">
          <h3>{title}</h3>
        </div>
      </div>
    );
  }
);

// Add display name for better debugging
VideoCard.displayName = "VideoCard";

export default VideoCard;
