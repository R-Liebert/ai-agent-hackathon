import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  useMemo,
} from "react";
import { IconButton } from "@mui/material";
import { TbDownload } from "react-icons/tb";
import { HiOutlinePhoto } from "react-icons/hi2";
import { useTranslation } from "react-i18next";
import { useAuthenticatedImageUrl } from "../../hooks/useAuthenticatedImageUrl";
import Tooltip from "../Global/Tooltip";

// 1x1 transparent GIF as fallback
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const TRANSITION_SETTLE_MS = 220;
const COMPLETION_FLASH_START_MS = 180;
const COMPLETION_HIDE_MS = 780;
const PREVIEW_BASE_SIZE_PX = 400;
const DEFAULT_PREVIEW_ASPECT_RATIO = 1;
const MIN_PREVIEW_ASPECT_RATIO = 0.5;
const MAX_PREVIEW_ASPECT_RATIO = 2;
const TEMPORARY_IMAGE_ALT = "temporary image";

// Define the animation styles
const animationStyles = `
  @keyframes bounce-and-spin {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    25% {
      transform: translateY(-15px) rotate(5deg);
    }
    50% {
      transform: translateY(0) rotate(0deg);
      opacity: 0.8;
    }
    75% {
      transform: translateY(-10px) rotate(-5deg);
    }
  }
  .animate-bounce-spin {
    animation: bounce-and-spin 2s infinite ease-in-out;
  }

  @keyframes spinner-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spinner-rotate {
    animation: spinner-rotate 0.8s linear infinite;
  }

  @keyframes indeterminate-progress {
    0% { transform: translateX(-130%); }
    100% { transform: translateX(260%); }
  }
  .animate-indeterminate-progress {
    animation: indeterminate-progress 1.25s ease-in-out infinite;
  }

  @keyframes progress-soft-pattern {
    from { background-position: 0 0; }
    to { background-position: 40px 0; }
  }
  .progress-soft-pattern {
    background-image: linear-gradient(
      90deg,
      rgba(76, 88, 104, 0.2) 0%,
      rgba(109, 122, 142, 0.34) 50%,
      rgba(76, 88, 104, 0.2) 100%
    );
    background-size: 40px 100%;
    animation: progress-soft-pattern 1.8s linear infinite;
  }

  @keyframes progress-wave {
    0% { transform: translateX(0%); opacity: 0.2; }
    50% { opacity: 0.45; }
    100% { transform: translateX(230%); opacity: 0.2; }
  }
  .progress-wave {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(172, 185, 204, 0.45) 48%,
      transparent 100%
    );
    filter: blur(0.2px);
    animation: progress-wave 1.35s ease-in-out infinite;
  }

  @keyframes completion-flash {
    0% { filter: brightness(1); }
    35% { filter: brightness(1.28); }
    100% { filter: brightness(1); }
  }
  .animate-completion-flash {
    animation: completion-flash 0.5s ease-out 1;
  }
`;

interface ImagePreviewProps {
  /**
   * URL of the image to display
   */
  imageUrl?: string;

  /**
   * Alt text for the image
   * When set to "temporary image", the loading state will be shown
   * When changed to anything else, the loading state will be turned off
   */
  alt?: string;

  /**
   * Whether the image is currently loading - optional override
   * If not provided, loading is determined by the alt text value
   */
  loading?: boolean;

  /**
   * Optional progress value (0 to 1) for image generation progress bar
   */
  progress?: number;

  /**
   * Partial frame index for preview generation
   */
  partialIndex?: number;

  /**
   * Total expected preview frames
   */
  totalPartials?: number;

  /**
   * Whether image generation is currently streaming for this card
   */
  streaming?: boolean;

  /**
   * Optional custom class name
   */
  className?: string;

  /**
   * Optional callback when download button is clicked
   * If not provided, it will use the default download behavior
   */
  onDownload?: () => void;
}

/**
 * Component that displays an image with loading state and download functionality
 * with smoother transitions between partial and final generations.
 */
const ImagePreviewComponent: React.FC<ImagePreviewProps> = ({
  imageUrl,
  alt = TEMPORARY_IMAGE_ALT,
  loading,
  progress,
  partialIndex,
  totalPartials,
  streaming = false,
  className = "",
  onDownload,
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [generationIntentLatched, setGenerationIntentLatched] =
    useState<boolean>(loading === true || alt === TEMPORARY_IMAGE_ALT);
  const [hasRenderedFrame, setHasRenderedFrame] = useState<boolean>(false);
  const [displayedUrl, setDisplayedUrl] = useState<string | undefined>(
    undefined
  );
  const [incomingUrl, setIncomingUrl] = useState<string | undefined>(undefined);
  const [isDisplayedLoaded, setIsDisplayedLoaded] = useState<boolean>(false);
  const [isIncomingLoaded, setIsIncomingLoaded] = useState<boolean>(false);
  const [showCompletionBar, setShowCompletionBar] = useState<boolean>(false);
  const [completionBarFading, setCompletionBarFading] =
    useState<boolean>(false);
  const [previewAspectRatio, setPreviewAspectRatio] = useState<number>(
    DEFAULT_PREVIEW_ASPECT_RATIO
  );
  const displayedImgRef = useRef<HTMLImageElement>(null);
  const incomingImgRef = useRef<HTMLImageElement>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const completionFadeTimerRef = useRef<number | null>(null);
  const completionHideTimerRef = useRef<number | null>(null);
  const prevStreamingRef = useRef<boolean>(false);
  const incomingUrlRef = useRef<string | undefined>(undefined);

  // Use the shared hook to get authenticated image URL
  const { url: authenticatedImageUrl, isLoading: isLoadingAuth } =
    useAuthenticatedImageUrl(imageUrl);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (loading === true || alt === TEMPORARY_IMAGE_ALT) {
      setGenerationIntentLatched(true);
    }
  }, [loading, alt]);

  // Handle placeholder URLs
  const actualImageUrl = useMemo(() => {
    if (!authenticatedImageUrl) return undefined;

    return authenticatedImageUrl.includes("placeholder.com") ||
      authenticatedImageUrl === "https://www.example.com"
      ? TRANSPARENT_PIXEL
      : authenticatedImageUrl;
  }, [authenticatedImageUrl]);

  // Keep current frame visible while the next frame loads, then crossfade.
  useEffect(() => {
    if (!actualImageUrl) return;

    if (!displayedUrl) {
      setDisplayedUrl(actualImageUrl);
      setIsDisplayedLoaded(false);
      setIncomingUrl(undefined);
      setIsIncomingLoaded(false);
      incomingUrlRef.current = undefined;
      return;
    }

    if (
      displayedUrl === actualImageUrl ||
      incomingUrlRef.current === actualImageUrl
    ) {
      return;
    }

    setIncomingUrl(actualImageUrl);
    setIsIncomingLoaded(false);
    incomingUrlRef.current = actualImageUrl;
  }, [actualImageUrl, displayedUrl]);

  useEffect(() => {
    if (displayedImgRef.current?.complete) {
      const img = displayedImgRef.current;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        setPreviewAspectRatio(
          Math.max(
            MIN_PREVIEW_ASPECT_RATIO,
            Math.min(MAX_PREVIEW_ASPECT_RATIO, aspectRatio)
          )
        );
      }
      setIsDisplayedLoaded(true);
    }
  }, [displayedUrl]);

  useEffect(() => {
    if (incomingImgRef.current?.complete) {
      const img = incomingImgRef.current;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        setPreviewAspectRatio(
          Math.max(
            MIN_PREVIEW_ASPECT_RATIO,
            Math.min(MAX_PREVIEW_ASPECT_RATIO, aspectRatio)
          )
        );
      }
      setIsIncomingLoaded(true);
    }
  }, [incomingUrl]);

  // Promote incoming image to displayed after crossfade starts.
  useEffect(() => {
    if (!isIncomingLoaded || !incomingUrlRef.current) return;

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = window.setTimeout(() => {
      const nextUrl = incomingUrlRef.current;
      if (!nextUrl) return;

      setDisplayedUrl(nextUrl);
      setIsDisplayedLoaded(true);
      setIncomingUrl(undefined);
      setIsIncomingLoaded(false);
      incomingUrlRef.current = undefined;
    }, TRANSITION_SETTLE_MS);

    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, [isIncomingLoaded]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
      if (completionFadeTimerRef.current) {
        window.clearTimeout(completionFadeTimerRef.current);
      }
      if (completionHideTimerRef.current) {
        window.clearTimeout(completionHideTimerRef.current);
      }
    };
  }, []);

  const updatePreviewAspectRatio = useCallback((img: HTMLImageElement) => {
    if (img.naturalWidth <= 0 || img.naturalHeight <= 0) return;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setPreviewAspectRatio(
      Math.max(
        MIN_PREVIEW_ASPECT_RATIO,
        Math.min(MAX_PREVIEW_ASPECT_RATIO, aspectRatio)
      )
    );
  }, []);

  const handleDisplayedLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      updatePreviewAspectRatio(e.currentTarget);
      setIsDisplayedLoaded(true);
      setHasRenderedFrame(true);
    },
    [updatePreviewAspectRatio]
  );

  const handleIncomingLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      updatePreviewAspectRatio(e.currentTarget);
      setIsIncomingLoaded(true);
      setHasRenderedFrame(true);
    },
    [updatePreviewAspectRatio]
  );

  const handleDisplayedError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      console.error("Image load error, using fallback");
      const target = e.target as HTMLImageElement;
      target.src = TRANSPARENT_PIXEL;
      setIsDisplayedLoaded(true);
      setHasRenderedFrame(true);
    },
    []
  );

  const handleIncomingError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      console.error("Incoming image load error, using fallback");
      const target = e.target as HTMLImageElement;
      target.src = TRANSPARENT_PIXEL;
      setIsIncomingLoaded(true);
      setHasRenderedFrame(true);
    },
    []
  );

  // Mouse event handlers - memoized to prevent unnecessary re-renders
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Memoize the download handler to prevent unnecessary re-renders
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
      return;
    }

    const urlToDownload =
      incomingUrl || authenticatedImageUrl || displayedUrl || imageUrl;

    if (!urlToDownload) {
      console.error("Download failed: Image URL is missing.");
      alert(t("components:imagePreview.download.missingUrl"));
      return;
    }

    const filename = `image-${Date.now()}.png`;

    try {
      const link = document.createElement("a");
      link.href = urlToDownload;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Image download failed:", e);
      alert(t("components:imagePreview.download.failed"));
    }
  }, [imageUrl, authenticatedImageUrl, displayedUrl, incomingUrl, onDownload, t]);

  const isGenerationLoading =
    loading !== undefined ? loading : alt === TEMPORARY_IMAGE_ALT;
  const shouldPreferGeneratingCopy = generationIntentLatched && !hasRenderedFrame;
  const isImageStreamingActive =
    streaming || isGenerationLoading || shouldPreferGeneratingCopy;
  const hasRenderableImage = !!displayedUrl || !!incomingUrl;
  const isTransitioning = !!incomingUrl;

  const derivedStepProgress = useMemo(() => {
    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

    if (typeof partialIndex === "number" && Number.isFinite(partialIndex)) {
      const resolvedTotal =
        typeof totalPartials === "number" && totalPartials > 0
          ? totalPartials
          : 4;

      // Handle both 1-based and 0-based indexes from backend payloads.
      let normalizedIndex = partialIndex;
      if (partialIndex >= 1 && partialIndex <= resolvedTotal) {
        normalizedIndex = partialIndex;
      } else if (partialIndex >= 0 && partialIndex < resolvedTotal) {
        normalizedIndex = partialIndex + 1;
      }

      return clamp01(normalizedIndex / resolvedTotal);
    }

    if (typeof progress === "number" && Number.isFinite(progress)) {
      return clamp01(progress);
    }

    return undefined;
  }, [partialIndex, totalPartials, progress]);

  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;

    if (!isImageStreamingActive && wasStreaming && hasRenderableImage) {
      setShowCompletionBar(true);
      setCompletionBarFading(false);

      if (completionFadeTimerRef.current) {
        window.clearTimeout(completionFadeTimerRef.current);
      }
      if (completionHideTimerRef.current) {
        window.clearTimeout(completionHideTimerRef.current);
      }

      completionFadeTimerRef.current = window.setTimeout(() => {
        setCompletionBarFading(true);
      }, COMPLETION_FLASH_START_MS);

      completionHideTimerRef.current = window.setTimeout(() => {
        setShowCompletionBar(false);
        setCompletionBarFading(false);
      }, COMPLETION_HIDE_MS);
    }

    if (isImageStreamingActive && showCompletionBar) {
      setShowCompletionBar(false);
      setCompletionBarFading(false);
    }

    prevStreamingRef.current = isImageStreamingActive;
  }, [isImageStreamingActive, hasRenderableImage, showCompletionBar]);

  const showHardLoading =
    !hasRenderableImage &&
    (isGenerationLoading || isLoadingAuth || shouldPreferGeneratingCopy);
  const showPlaceholderOverlay =
    showHardLoading || (!isDisplayedLoaded && !isIncomingLoaded);
  const showSoftOverlay =
    hasRenderableImage &&
    hasRenderedFrame &&
    (isImageStreamingActive || isLoadingAuth || isTransitioning);
  const loadingText =
    shouldPreferGeneratingCopy || isGenerationLoading
      ? t("components:imagePreview.labels.generating")
      : t("components:imagePreview.labels.loading");
  const softOverlayText =
    shouldPreferGeneratingCopy || isGenerationLoading
      ? t("components:imagePreview.labels.generating")
      : t("components:imagePreview.labels.updatingPreview");
  const shouldShowProgressBar =
    hasRenderableImage && (isImageStreamingActive || showCompletionBar);
  const progressFillFraction = showCompletionBar ? 1 : derivedStepProgress;
  const progressFillWidthPercent = Math.max(
    10,
    Math.round(((progressFillFraction ?? 0.18) * 100))
  );
  const previewDisplayWidth = useMemo(() => {
    if (previewAspectRatio > 1) {
      return Math.round(PREVIEW_BASE_SIZE_PX * previewAspectRatio);
    }
    return PREVIEW_BASE_SIZE_PX;
  }, [previewAspectRatio]);

  // Don't render anything if no image URL and not in loading state
  if (!hasRenderableImage && !showHardLoading) {
    return null;
  }

  return (
    <div
      className={`imagePreview relative mt-3 mb-6 rounded-2xl overflow-hidden flex items-center justify-center bg-[#2F2F2F] transition-all duration-300 ${
        isMounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.985]"
      } ${className}`}
      style={{
        aspectRatio: previewAspectRatio,
        width: `${previewDisplayWidth}px`,
        maxWidth: "100%",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Add the animation styles */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <div className="absolute inset-0">
        {displayedUrl && (
          <img
            ref={displayedImgRef}
            src={displayedUrl}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isDisplayedLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleDisplayedLoad}
            onError={handleDisplayedError}
            loading="eager"
          />
        )}

        {incomingUrl && (
          <img
            ref={incomingImgRef}
            src={incomingUrl}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out ${
              isIncomingLoaded
                ? "opacity-100 scale-100 blur-0"
                : "opacity-0 scale-[1.02] blur-[0.5px]"
            }`}
            onLoad={handleIncomingLoad}
            onError={handleIncomingError}
            loading="eager"
          />
        )}

        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-[#2F2F2F] transition-opacity duration-300 ${
            showPlaceholderOverlay ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <HiOutlinePhoto size={64} className="text-white animate-bounce-spin" />
          <div className="text-white mt-4 text-sm opacity-80">{loadingText}</div>
        </div>
      </div>

      {showSoftOverlay && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/15 to-black/5 transition-opacity duration-300">
          <div className="absolute bottom-6 left-3 inline-flex items-center gap-2.5 text-[12.5px] font-medium tracking-[0.01em] text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
            {isImageStreamingActive && (
              <span className="h-[15px] w-[15px] rounded-full border-[1.8px] border-white/80 border-t-transparent animate-spinner-rotate drop-shadow-[0_0_2px_rgba(0,0,0,0.35)]" />
            )}
            {softOverlayText}
          </div>
        </div>
      )}

      {/* Progress bar for partial image generation */}
      {shouldShowProgressBar && (
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
          <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-[#1E2430]/85 shadow-[0_1px_3px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.28)]">
            <div
              className={`absolute inset-y-0 left-0 rounded-full overflow-hidden transition-all duration-500 ease-out ${
                completionBarFading ? "opacity-0 scale-y-[0.8]" : "opacity-100"
              } ${showCompletionBar ? "animate-completion-flash" : ""}`}
              style={{ width: `${progressFillWidthPercent}%` }}
            >
              <div className="absolute inset-0 bg-[#5F6D80]/75" />
              <div className="absolute inset-0 progress-soft-pattern opacity-85" />
              <div className="absolute inset-y-0 -left-[45%] w-[72%] progress-wave" />
            </div>
            <div className="absolute inset-y-0 w-[38%] bg-gradient-to-r from-transparent via-[#A9B4C5]/45 to-transparent opacity-75 animate-indeterminate-progress" />
          </div>
        </div>
      )}

      {/* Download button */}
      {(isDisplayedLoaded || isIncomingLoaded) && isHovered && (
        <div className="absolute top-3 right-3">
          <Tooltip text={t("components:imagePreview.download.tooltip")} useMui>
            <IconButton
              onClick={handleDownload}
              className="!bg-gray-800 hover:!bg-gray-700"
              size="medium"
              sx={{
                padding: "10px",
                color: "white",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              <TbDownload size={22} />
            </IconButton>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ImagePreview = memo(ImagePreviewComponent);

export default ImagePreview;
