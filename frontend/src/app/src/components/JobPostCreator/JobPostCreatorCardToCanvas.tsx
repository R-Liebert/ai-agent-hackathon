import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { TbFileDescription } from "react-icons/tb";
import { IconType } from "react-icons";
import { useTranslation } from "react-i18next";
import Canvas from "../../components/Canvas/Canvas";
import { useCanvas } from "../../hooks/useCanvas";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import useSidebarStore from "../../stores/navigationStore";

gsap.registerPlugin(Flip);

interface CardToCanvasProps {
  formSubmitted: boolean;
  showHeader?: boolean;
  agentAvatarColor?: string;
  iconSize?: number;
  moduleName?: string;
  Icon: IconType;
  jobPostHeaders: string[];
  isGeneratedJobPost?: boolean;
  skipAnimation?: boolean;
}

const CardToCanvas: React.FC<CardToCanvasProps> = ({
  formSubmitted,
  agentAvatarColor,
  iconSize = 20,
  moduleName,
  Icon,
  jobPostHeaders,
  isGeneratedJobPost,
  skipAnimation,
}) => {
  const { canvasTitle, isStreamingCanvasContent } = useCanvas();
  const { isSidebarOpen } = useSidebarStore();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const smallContentRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const [currentWidth, setCurrentWidth] = useState<string>("100%");

  const [showCanvasContent, setShowCanvasContent] = useState<boolean>(
    !!isGeneratedJobPost
  );
  const { t } = useTranslation();

  const colorTweenRef = useRef<gsap.core.Timeline | null>(null);

  // Guard to prevent duplicate animations
  const isAnimatingRef = useRef(false);
  // Keep track of timeline to kill on cleanup
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Responsive detection via hook (tablet and below)
  const isStandardDesktop = useMediaQuery("(min-width: 1500px)");

  const isSmallDesktop = useMediaQuery("(max-width: 1200px)");
  // const isAbove700px = useMediaQuery("(min-width: 700px)");
  const isMobileOrTablet = useMediaQuery("(max-width: 899px)");

  // Helper: compute final width/position/transformOrigin according to breakpoint
  const getTargetPosition = (isSidebarOpen: boolean) => {
    if (isMobileOrTablet) {
      return {
        position: "static",
        top: "0",
        left: "0",
        right: "0",
        width: "100vw", // Full width for mobile
        height: "100vh",
        backgroundColor: "#212121", // Mobile background color
        transformOrigin: "center center",
      } as const;
    }

    if (isSidebarOpen && isStandardDesktop) {
      return {
        position: "fixed",
        left: "auto",
        right: "0",
        width: "55vw", // Static width when sidebar is open // 55vw for desktop
        height: "100vh",
        backgroundColor: "#2F2F2F", // Desktop background color
        transformOrigin: "right center",
      } as const;
    }

    if (isSidebarOpen && !isStandardDesktop) {
      return {
        position: "fixed",
        left: "auto",
        right: "0",
        width: "45vw", // Static width when sidebar is open // 55vw for desktop
        height: "100vh",
        backgroundColor: "#2F2F2F", // Desktop background color
        transformOrigin: "right center",
      } as const;
    }

    if (isSmallDesktop) {
      return {
        position: "fixed",
        left: "auto",
        right: "0",
        width: "50vw", // Dynamic width for desktop
        height: "100vh",
        backgroundColor: "#2F2F2F", // Desktop background color
        transformOrigin: "right center",
      } as const;
    }

    return {
      position: "fixed",
      left: "auto",
      right: "0",
      width: "62.6vw", // Dynamic width for desktop
      height: "100vh",
      backgroundColor: "#2F2F2F", // Desktop background color
      transformOrigin: "right center",
    } as const;
  };

  // Only trigger the animation when formSubmitted / isGeneratedJobPost change.
  useEffect(() => {
    if (isGeneratedJobPost || (skipAnimation && cardRef.current)) {
      if (!isAnimatingRef.current) skipCardAndShowCanvas();
    } else if (formSubmitted && cardRef.current) {
      if (!isAnimatingRef.current) handleCanvasExpand();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSubmitted, isGeneratedJobPost]);

  useEffect(() => {
    if (!cardRef.current || isAnimatingRef.current) return;

    const cardEl = cardRef.current;

    // Get the target position based on `isSidebarOpen`
    const { width, height, left, right, backgroundColor, transformOrigin } =
      getTargetPosition(isSidebarOpen);

    // Apply the styles dynamically
    cardEl.style.position = "fixed";
    cardEl.style.top = "0";
    cardEl.style.left = left;
    cardEl.style.right = right;
    cardEl.style.width = width;
    cardEl.style.height = height;
    cardEl.style.backgroundColor = backgroundColor;
    cardEl.style.transformOrigin = transformOrigin;

    // Optionally animate the transition
    gsap.to(cardEl, {
      width, // Animate the width
      backgroundColor, // Animate the background color
      duration: 0.5,
      ease: "power2.inOut",
    });
  }, [isSidebarOpen, isMobileOrTablet]); // Recalculate on sidebar or device type change

  // The core animation routine:
  const handleCanvasExpand = () => {
    if (isAnimatingRef.current) return;

    const cardEl = cardRef.current!;
    const smallContentEl = smallContentRef.current!;
    const headerEl = headerRef.current!;
    const textEl = textRef.current!;

    // Mobile-specific behavior: Show the small card without expanding
    if (isMobileOrTablet) {
      // Ensure the card is visible
      cardEl.style.position = "relative";
      cardEl.style.width = "auto";
      cardEl.style.height = "auto";
      cardEl.style.borderRadius = "8px"; // Keep the small card's rounded corners
      //cardEl.style.backgroundColor = "#212121"; // Ensure the background color matches

      // Hide the small card content after a short delay and show the canvas
      setTimeout(() => {
        // Hide the small card content
        if (headerEl) headerEl.style.display = "none";
        if (textEl) textEl.style.display = "none";
        if (smallContentEl) smallContentEl.style.display = "none";

        setShowCanvasContent(true);
      }, 600); // Adjust the delay as needed

      return;
    }

    // Desktop-specific behavior: Run the full expand animation
    isAnimatingRef.current = true;

    // Kill any previous timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Set transform origin BEFORE capturing state (transformOrigin doesn't change layout).
    const transformOrigin = getTargetPosition(isSidebarOpen).transformOrigin;
    if (cardEl) cardEl.style.transformOrigin = transformOrigin;

    // Capture the start state BEFORE we set final fixed/width positions
    const startState = Flip.getState(cardEl);

    // Build timeline for fade-out pieces
    const tl = gsap.timeline();
    timelineRef.current = tl;

    tl.to(headerEl, {
      delay: 0.5,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
    })
      .to(textEl, { opacity: 0, duration: 0.5, ease: "power2.out" }, "<")
      .to(
        smallContentEl,
        { opacity: 0, duration: 0.5, ease: "power2.out" },
        "-=0.2"
      );

    // After fade, set final layout THEN run Flip.from
    tl.add(() => {
      const {
        left,
        right,
        width,
        height,
        backgroundColor,
        transformOrigin: newOrigin,
      } = getTargetPosition(isSidebarOpen);

      if (cardEl) {
        cardEl.style.transformOrigin = newOrigin;
        cardEl.style.position = "fixed";
        cardEl.style.top = "0";
        cardEl.style.left = left;
        cardEl.style.right = right;
        cardEl.style.width = width;
        cardEl.style.height = height;
        cardEl.style.borderRadius = "0";

        // Animate background color
        gsap.to(cardEl, {
          backgroundColor,
          border: "none",
          duration: 0.5,
          ease: "power2.inOut",
        });
      }

      // Perform flipped animation from the previously captured start state
      Flip.from(startState, {
        duration: 0.9,
        ease: "power2.inOut",
        onComplete: () => {
          // small delay so layout settles, then show canvas content and release guard
          gsap.delayedCall(0.6, () => {
            setShowCanvasContent(true);
            isAnimatingRef.current = false;
          });
        },
      });
    });

    // End: hide the small pieces from layout
    tl.to(headerEl, { display: "none", ease: "none" }, "-=0.05")
      .to(textEl, { display: "none", ease: "none" })
      .to(smallContentEl, { display: "none", ease: "none" });
  };

  // Immediate (no-flip) path used when `isGeneratedJobPost` is true on mount:
  const skipCardAndShowCanvas = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    if (!cardRef.current) {
      isAnimatingRef.current = false;
      return;
    }

    const cardEl = cardRef.current;
    const { left, right, width, height, backgroundColor, transformOrigin } =
      getTargetPosition(isSidebarOpen);

    // Set final layout directly (no flip)
    cardEl.style.position = "fixed";
    cardEl.style.top = "0";
    cardEl.style.left = left;
    cardEl.style.right = right;
    cardEl.style.width = width;
    cardEl.style.height = height;
    cardEl.style.borderRadius = "0";
    cardEl.style.border = "none";
    cardEl.style.padding = "0";
    cardEl.style.transformOrigin = transformOrigin;
    //cardEl.style.backgroundColor = "#2F2F2F";

    // Animate background color
    if (isMobileOrTablet) {
      gsap.killTweensOf(cardEl, "backgroundColor");
      gsap.to(cardEl, {
        backgroundColor,
        duration: 0.05,
        ease: "power1.out",
      });
    } else {
      gsap.to(cardEl, {
        backgroundColor,
        duration: 0.5,
        ease: "power2.inOut",
      });
    }

    if (headerRef.current) headerRef.current.style.display = "none";
    if (textRef.current) textRef.current.style.display = "none";
    if (smallContentRef.current) smallContentRef.current.style.display = "none";

    setShowCanvasContent(true);

    // clear guard after next tick
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 0);
  };

  // Cleanup timeline on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      isAnimatingRef.current = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`h-full !relative inline-flex flex-col lg:bg-gray-800 z-[99] ${
        showCanvasContent
          ? isMobileOrTablet
            ? "w-full"
            : "w-full md:w-[50vw] lg:w-[65vw]"
          : "w-auto ml-0 md:ml-[9rem] mr-auto"
      }`}
    >
      {formSubmitted && (
        <div className="flex flex-col mt-[3rem] ml-0 mr-auto w-auto gap-4 w-full">
          <div ref={headerRef} className="flex">
            <div
              className="mr-4 -mt-[1.8px] rounded-full w-7 h-7 flex items-center justify-center"
              style={{ backgroundColor: agentAvatarColor }}
            >
              <Icon size={iconSize} />
            </div>
            <div className="author font-semibold text-white-100">
              {moduleName}
            </div>
          </div>

          {/* Card to Canvas */}
          <div
            ref={cardRef}
            className={`${
              showCanvasContent
                ? "p-0 bg-transparent md:bg-gray-600 transition-width duration-[400ms] ease-[cubic-bezier(0.25, 0.8, 0.25, 1)]"
                : "py-3 px-3 bg-gray-600 border-2 border-gray-500"
            } inline-flex relative rounded-lg text-white-100 place-items-center place-content-center z-[102]`}
          >
            {/* Small Card Content */}
            <div
              ref={smallContentRef}
              className="inline-flex w-full place-items-center place-content-center gap-3 opacity-1"
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

            {/* Canvas Content: only rendered AFTER expand completes */}
            {showCanvasContent && (
              <div style={{ width: "100%", height: "100vh" }}>
                <Canvas jobPostHeaders={jobPostHeaders} />
              </div>
            )}
          </div>

          {/* Streaming Text */}
          <div ref={textRef} className="ml-1 font-body">
            {t("job-post-creator:streamingChatNotification")}...
          </div>
        </div>
      )}
    </div>
  );
};

export default CardToCanvas;
