import React, { useEffect, useRef, useState } from "react";
import { styled } from "@mui/material/styles";
import Popover from "@mui/material/Popover";

interface StyledPopoverProps {
  topMargin?: number;
}

export const StyledPopover = styled((props: StyledPopoverProps & any) => {
  const { topMargin = 0, ...rest } = props;
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverHeight, setPopoverHeight] = useState<number>(0);

  // Measure the height of the Popover dynamically
  useEffect(() => {
    if (popoverRef.current) {
      const updateHeight = () => {
        const height = popoverRef.current?.offsetHeight || 0;
        setPopoverHeight(height);
      };

      // Initial height calculation
      updateHeight();

      // Add a resize observer to handle dynamic changes
      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(popoverRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Calculate the borderRadius based on the height
  const dynamicBorderRadius = popoverHeight > 20 ? "1.2rem" : "12px";

  return (
    <Popover
      {...rest}
      ref={(node) => {
        popoverRef.current = node?.querySelector(".MuiPaper-root") || null;
      }}
      style={{
        "--dynamic-border-radius": dynamicBorderRadius, // Pass dynamic borderRadius as a CSS variable
      }}
    />
  );
})(({ topMargin = 0 }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "rgba(53, 53, 53)",
    borderRadius: "var(--dynamic-border-radius, 12px)", // Dynamic borderRadius with a fallback
    border: "1.8px solid rgba(58, 58, 61, 0.4)",
    boxShadow:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    fontSize: "0.875rem",
    color: "white",
    marginTop: topMargin,
    padding: "0.36rem",
    transition: "border-radius 0.2s ease",
    width: "fit-content!important",
  },
}));
