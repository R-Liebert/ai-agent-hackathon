import React, { useRef, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface SuggestionChipsRowProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

// Animation variants for staggered entrance
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const chipVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
};

// Helper function to create color object
const createColorObject = (r: number, g: number, b: number) => ({
  bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
  border: `rgba(${r}, ${g}, ${b}, 0.3)`,
  hover: `rgba(${r}, ${g}, ${b}, 0.25)`,
  glow: `0 0 12px rgba(${r}, ${g}, ${b}, 0.15)`,
});

// Use consistent blue color for all follow-ups
const getChipColor = (prompt: string, index: number) => {
  return createColorObject(59, 130, 246); // Blue for all chips
};

export const SuggestionChipsRow: React.FC<SuggestionChipsRowProps> = ({
  prompts,
  onSelect,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  // Calculate proportional widths that use exact available space
  const calculateProportionalWidths = (
    prompts: string[],
    containerWidth: number = 500
  ) => {
    if (prompts.length === 0) return [];

    const totalChars = prompts.reduce((sum, prompt) => sum + prompt.length, 0);
    const minWidth = 60; // Minimum chip width (reduced for better space utilization)
    const gap = 8; // Gap between chips
    const totalGaps = (prompts.length - 1) * gap;
    const padding = 8; // Container padding
    const exactAvailableWidth = containerWidth - totalGaps - padding;

    // Ensure we have enough space for minimum widths
    const minimumTotalWidth = prompts.length * minWidth;
    const workingWidth = Math.max(minimumTotalWidth, exactAvailableWidth);

    // Calculate proportional widths based on character count
    const proportionalWidths = prompts.map((prompt) => {
      if (totalChars === 0) return workingWidth / prompts.length;
      return (prompt.length / totalChars) * workingWidth;
    });

    // Apply minimum width constraints and track adjustments
    let totalAdjustedWidth = 0;
    const adjustedWidths = proportionalWidths.map((width) => {
      const adjustedWidth = Math.max(minWidth, width);
      totalAdjustedWidth += adjustedWidth;
      return adjustedWidth;
    });

    // Scale all widths to exactly fill the available space
    const scaleFactor = workingWidth / totalAdjustedWidth;
    const finalWidths = adjustedWidths.map((width) => width * scaleFactor);

    // Ensure the total exactly matches available width (handle rounding)
    const totalFinalWidth = finalWidths.reduce((sum, width) => sum + width, 0);
    const widthDifference = workingWidth - totalFinalWidth;
    if (Math.abs(widthDifference) > 0.1) {
      // Distribute the difference to the largest chip
      const largestIndex = finalWidths.indexOf(Math.max(...finalWidths));
      finalWidths[largestIndex] += widthDifference;
    }

    return prompts.map((prompt, index) => {
      const baseWidth = Math.max(minWidth, Math.round(finalWidths[index]));
      const charsPerPixel = 7; // Approximate character width
      const maxTruncatedChars = Math.floor((baseWidth - 32) / charsPerPixel); // Account for padding

      return {
        baseWidth,
        expandedWidth: Math.min(prompt.length * 8 + 32, baseWidth * 2.5), // Reasonable expansion limit
        truncatedText:
          maxTruncatedChars < prompt.length && maxTruncatedChars > 0
            ? prompt.substring(0, Math.max(1, maxTruncatedChars - 3)) + "..."
            : prompt,
      };
    });
  };

  // Get container width (or use a reasonable default)
  const [containerWidth, setContainerWidth] = useState(500);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Get the actual available width of the container
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);
      }
    };

    updateWidth();

    // Use ResizeObserver for more accurate container size tracking
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(containerRef.current);
    } else {
      // Fallback to window resize event
      window.addEventListener("resize", updateWidth);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", updateWidth);
      }
    };
  }, [prompts]);

  // Calculate all chip dimensions
  const chipDimensions = calculateProportionalWidths(prompts, containerWidth);

  // Calculate dynamic width that maintains constant total width
  const calculateDynamicWidth = (
    chipIndex: number,
    isHovered: boolean,
    someChipHovered: boolean,
    hoveredIndex: number | null
  ) => {
    if (!someChipHovered) {
      // No hover state - return base width
      return chipDimensions[chipIndex].baseWidth;
    }

    if (isHovered) {
      // This chip is hovered - expand it
      const maxExpansion = Math.min(
        chipDimensions[chipIndex].expandedWidth,
        chipDimensions[chipIndex].baseWidth * 2 // Don't expand more than 2x base width
      );
      return maxExpansion;
    }

    // This chip is not hovered - calculate how much it should shrink
    if (hoveredIndex !== null) {
      const hoveredChip = chipDimensions[hoveredIndex];
      const hoveredBaseWidth = hoveredChip.baseWidth;
      const hoveredExpandedWidth = Math.min(
        hoveredChip.expandedWidth,
        hoveredBaseWidth * 2
      );
      const expansionNeeded = hoveredExpandedWidth - hoveredBaseWidth;

      // Calculate total base width of non-hovered chips
      const nonHoveredChips = chipDimensions.filter(
        (_, index) => index !== hoveredIndex
      );
      const totalNonHoveredBaseWidth = nonHoveredChips.reduce(
        (sum, chip) => sum + chip.baseWidth,
        0
      );

      // Distribute the shrinkage proportionally among non-hovered chips
      const currentChipBaseWidth = chipDimensions[chipIndex].baseWidth;
      const shrinkageRatio = currentChipBaseWidth / totalNonHoveredBaseWidth;
      const shrinkageAmount = expansionNeeded * shrinkageRatio;

      // Ensure minimum width of 60px
      const minWidth = 60;
      const newWidth = Math.max(
        minWidth,
        currentChipBaseWidth - shrinkageAmount
      );

      return newWidth;
    }

    return chipDimensions[chipIndex].baseWidth;
  };

  // Focus management for keyboard navigation
  const focusChip = (index: number) => {
    const chips = containerRef.current?.querySelectorAll("[data-chip-index]");
    const chip = chips?.[index] as HTMLElement;
    chip?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        focusChip(Math.max(0, index - 1));
        break;
      case "ArrowRight":
        event.preventDefault();
        focusChip(Math.min(prompts.length - 1, index + 1));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!disabled) {
          onSelect(prompts[index]);
        }
        break;
    }
  };

  const handleChipClick = (prompt: string, index: number) => {
    if (!disabled) {
      setClickedIndex(index);
      // Add slight delay for animation feedback
      setTimeout(() => {
        onSelect(prompt);
        setClickedIndex(null);
      }, 150);
    }
  };

  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          width: "100%",
        }}
        className="suggestion-chips-container"
      >
        <motion.div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "nowrap", // Never wrap to new line
            paddingBottom: "4px",
            paddingLeft: "4px",
            paddingRight: "4px",
            alignItems: "center",
            width: "100%",
          }}
        >
          {prompts.map((prompt, index) => {
            const colors = getChipColor(prompt, index);
            const isHovered = hoveredIndex === index;
            const isClicked = clickedIndex === index;
            const someChipHovered = hoveredIndex !== null;
            const isOtherChipHovered = someChipHovered && !isHovered;
            const chipDimension = chipDimensions[index];
            const displayText = isHovered
              ? prompt
              : chipDimension.truncatedText;

            return (
              <motion.div
                key={`${prompt}-${index}`}
                variants={chipVariants}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                animate={{
                  width: calculateDynamicWidth(
                    index,
                    isHovered,
                    someChipHovered,
                    hoveredIndex
                  ),
                  scale: isOtherChipHovered ? 0.95 : 1,
                  opacity: isOtherChipHovered ? 0.7 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  duration: 0.4,
                }}
                whileTap={{
                  scale: disabled
                    ? isOtherChipHovered
                      ? 0.95
                      : 1
                    : isOtherChipHovered
                    ? 0.9
                    : 0.98,
                }}
                style={{
                  filter: isClicked ? "brightness(1.2)" : "none",
                  transformOrigin: "center",
                  zIndex: isHovered ? 10 : 1,
                  position: "relative",
                }}
              >
                <Box
                  component="button"
                  data-chip-index={index}
                  onClick={() => handleChipClick(prompt, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  tabIndex={0}
                  disabled={disabled}
                  sx={{
                    // Modern glassmorphism design
                    background: disabled
                      ? "rgba(47, 47, 47, 0.6)"
                      : `linear-gradient(135deg, ${colors.bg} 0%, rgba(255, 255, 255, 0.05) 100%)`,
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "16px",

                    // Modern typography
                    fontFamily: "'Nunito Sans', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    color: disabled ? "#89898E" : "#FFFFFF",

                    // Layout
                    padding: "8px 16px",
                    minHeight: "36px",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    whiteSpace: "nowrap",

                    // Interactions
                    cursor: disabled ? "not-allowed" : "pointer",
                    outline: "none",
                    userSelect: "none",
                    WebkitTapHighlightColor: "transparent",

                    // Modern shadow system
                    boxShadow: disabled
                      ? "0 2px 8px rgba(0, 0, 0, 0.1)"
                      : `
                        0 4px 16px rgba(0, 0, 0, 0.15),
                        0 2px 4px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                      `,

                    // Smooth transitions
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

                    // Hover effects
                    "&:hover": disabled
                      ? {}
                      : {
                          background: `linear-gradient(135deg, ${colors.hover} 0%, rgba(255, 255, 255, 0.1) 100%)`,
                          borderColor: colors.border,
                          boxShadow: `
                        0 8px 32px rgba(0, 0, 0, 0.2),
                        0 4px 8px rgba(0, 0, 0, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2),
                        ${colors.glow}
                                             `,
                        },

                    // Focus styles for accessibility
                    "&:focus-visible": {
                      borderColor: "#FFFFFF",
                      boxShadow: `
                        0 0 0 2px rgba(255, 255, 255, 0.5),
                        0 8px 32px rgba(0, 0, 0, 0.2),
                        ${colors.glow}
                      `,
                    },

                    // Active state
                    "&:active": disabled
                      ? {}
                      : {
                          transform: "translateY(0px) scale(0.98)",
                          boxShadow: `
                        0 2px 8px rgba(0, 0, 0, 0.2),
                        inset 0 2px 4px rgba(0, 0, 0, 0.1)
                      `,
                        },

                    // Disabled state
                    "&:disabled": {
                      opacity: 0.5,
                      cursor: "not-allowed",
                      transform: "none",
                      "&:hover": {
                        transform: "none",
                      },
                    },
                  }}
                  aria-label={`Suggestion ${index + 1} of ${
                    prompts.length
                  }: ${prompt}`}
                  role="button"
                >
                  {displayText}
                </Box>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
