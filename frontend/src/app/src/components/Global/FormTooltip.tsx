import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbTriangleInvertedFilled } from "react-icons/tb";

type TooltipProps = {
  text: string;
  children: React.ReactNode;
};

const Tooltip = ({ text, children }: TooltipProps) => {
  const { t } = useTranslation();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{
    left: string;
    top: string;
    transform: string;
  }>({
    left: "50%",
    top: "-100%",
    transform: "translateX(-50%)",
  });
  const [showTriangleIcon, setShowTriangleIcon] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setShowTriangleIcon(window.innerWidth >= 1160);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!tooltipRef.current || !parentRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const parentRect = parentRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;

    const tooltipWidth = tooltipRect.width;
    const parentLeft = parentRect.left;
    const parentWidth = parentRect.width;
    const parentCenter = parentLeft + parentWidth / 2;

    let leftPx = parentWidth / 30 - tooltipWidth / 30;
    let topPx = -tooltipRect.height - 10;
    let transform = "translateX(0%)";

    // Calculate absolute tooltip left position relative to viewport if positioned at default leftPx
    const absoluteTooltipLeft = parentLeft + leftPx;

    // Max left to keep tooltip inside viewport with 8px margin
    const maxLeft = screenWidth - tooltipWidth - 20;

    if (absoluteTooltipLeft > maxLeft) {
      // If overflow on right, clamp tooltip's absolute left to maxLeft
      leftPx = maxLeft - parentLeft - 30;
      transform = "translateX(0%)";
      topPx = -tooltipRect.height - 14;
    }

    if (parentCenter - tooltipWidth / 2 < 8) {
      // overflow left side - pin to parent's left edge
      leftPx = -30;
      transform = "translateX(0%)";
      topPx = -tooltipRect.height - 4;
    }

    setPosition({ left: `${leftPx}px`, top: `${topPx}px`, transform });
  }, [visible, text]);

  return (
    <div
      ref={parentRef}
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onTouchStart={() => setVisible(true)}
      onTouchEnd={() => setTimeout(() => setVisible(false), 1200)}
    >
      <div
        ref={tooltipRef}
        className={`absolute whitespace-pre-line z-[100001] bg-gray-900 text-white text-sm rounded-2xl px-3 py-2 font-body transition-opacity duration-200 w-[12rem] md:w-[16rem] lg:w-[18rem]
            ${visible ? "opacity-100 visible" : "opacity-0 invisible"}
            `}
        style={{
          top: position.top,
          left: position.left,
          transform: `${position.transform}`,
        }}
      >
        <p className="normal-case">{t(text)}</p>
      </div>
      {children}
    </div>
  );
};
export default Tooltip;
