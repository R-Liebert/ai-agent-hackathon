import React, { useState } from "react";
import { TbTrendingUp } from "react-icons/tb";
import { AnimatePresence, easeInOut, motion } from "framer-motion";
import CircularProgress from "@mui/material/CircularProgress";
import AgentAvatar from "./AgentAvatar";
import { getAgentSecondaryText } from "../../models/agent-model";

type ItemId = string | number;
interface ListItem {
  id: ItemId;
  name: string;
  description?: string | null;
  image?: string | null;
}

interface ChatListProps {
  items: ListItem[];
  onItemClick: (id: ItemId, item: ListItem) => void;
  isModal?: boolean;
  selectedId?: ItemId | null;
  loading?: boolean;
  loadingMessage?: string;
}

const ChatList: React.FC<ChatListProps> = ({
  items,
  onItemClick,
  isModal,
  selectedId,
  loading,
  loadingMessage,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const showLoadingMessage = Boolean(loadingMessage);

  if (loading && items.length === 0 && !showLoadingMessage) {
    return (
      <CircularProgress
        size={26}
        className="!text-white-100 !flex !place-self-center !place-content-center !place-items-center !ml-3"
      />
    );
  }

  const isMobile = window.innerWidth < 768;

  const isPositionedTopToChatInput = isModal || isMobile;

  return (
    <AnimatePresence>
      <motion.div
        key="workspaces-wrapper"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: easeInOut }}
        className={`pt-4`}
      >
        <div
          className={`flex flex-col w-full max-h-64 xxl:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 ${
            isPositionedTopToChatInput
              ? `bg-gray-650 rounded-2xl border-2 border-gray-500 absolute bottom-full ${
                  isMobile ? "mb-2" : "mb-0"
                }`
              : "bg-transparent rounded-lg"
          }`}
        >
          {showLoadingMessage && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-white-100 border-b-2 border-b-gray-500">
              <CircularProgress size={16} className="!text-white-100" />
              <span>{loadingMessage}</span>
            </div>
          )}
          {items.map((item, index) => {
            const isHovered = hoveredIndex === index;
            const isPrevHovered = hoveredIndex === index + 1;
            const isLast = index === items.length - 1;
            const hideBottomBorder = isHovered || isPrevHovered || isLast;
            const isSelected = selectedId === item.id;
            const secondaryText = getAgentSecondaryText(item);

            return (
              <button
                key={item.id ?? index}
                type="button"
                onClick={() => onItemClick(item.id, item)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                className={[
                  "group w-full flex items-center font-body space-x-3 px-3 py-2 transition ease-in duration-200",
                  isHovered
                    ? isPositionedTopToChatInput
                      ? "bg-gray-400"
                      : "bg-gray-600"
                    : "bg-transparent",
                  hideBottomBorder
                    ? "border-b-2 border-b-transparent"
                    : "border-b-2 border-b-gray-500",
                  isPositionedTopToChatInput
                    ? "rounded-none hover:rounded-none"
                    : "rounded-xs hover:rounded-xl",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-700",
                  isSelected ? "bg-gray-700/60" : "",
                ].join(" ")}
                aria-selected={isSelected}
              >
                <AgentAvatar
                  image={item.image}
                  name={item.name}
                  alt={`${item.name} avatar`}
                  textClassName="text-sm"
                  className="h-6 w-6 rounded-full object-cover"
                />

                <span className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate text-md text-white-100">
                    {item.name}
                  </span>
                  {secondaryText && (
                    <span className="truncate text-xs text-white-100 opacity-70">
                      {secondaryText}
                    </span>
                  )}
                </span>

                <TbTrendingUp
                  size={26}
                  strokeWidth={1.8}
                  className={`transform transition-transform duration-200 ${
                    isHovered ? "rotate-45" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatList;
