import React from "react";
import { useTranslation } from "react-i18next";
import {
  TbRepeat,
  TbArrowForwardUp,
  TbArrowBackUp,
  TbDownload,
} from "react-icons/tb";
import Tooltip from "../Global/Tooltip";
import ContentCopy from "../Global/AppContentCopy";
import { AnimatePresence, motion } from "framer-motion";
import { useCanvas } from "../../hooks/useCanvas";
import CanvasOptionButton from "./CanvasOptionButton";
import { useMediaQuery } from "../../hooks/useMediaQuery";

interface CanvasNavButtonProps {
  moduleName?: string;
}

export const CanvasNavButtons: React.FC<CanvasNavButtonProps> = ({
  moduleName,
}) => {
  const { t } = useTranslation();
  const isMobileAndTablet = useMediaQuery("(max-width: 900px)");
  const {
    regenerateActiveCanvasContent,
    goToPreviousCanvasContentVersion,
    goToNextCanvasContentVersion,
    copyCurrentCanvasContent,
    downloadCurrentCanvasContent,
    isStreamingCanvasContent,
    hasPreviousContent,
    hasNextContent,
  } = useCanvas();

  // const hasPreviousContent = pointsToVersionIndex !=  currentVersionIndex;
  // const hasNextContent = currentVersionIndex < maxVersionIndex;

  // ADD ONCLICK FUNCTIONALITY
  return (
    <AnimatePresence>
      <motion.div
        className="flex gap-0 md:gap-1 absolute top-[.5em] right-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isMobileAndTablet ? (
          <CanvasOptionButton moduleName={moduleName} size={20} />
        ) : null}
        {/*Regenerate*/}
        <button
          onClick={regenerateActiveCanvasContent}
          disabled={isStreamingCanvasContent}
          className={`flex place-content-center my-auto p-2 text-center transform transition-all duration-200 ease-in-out ${
            isStreamingCanvasContent
              ? " text-gray-300 cursor-not-allowed"
              : `${
                  isMobileAndTablet ? "hover:bg-gray-600" : "hover:bg-gray-400"
                }`
          } rounded-lg relative group`}
          aria-label={t("common:canvasNavigationIconButtons.regenerate")}
        >
          <TbRepeat strokeWidth={1.6} size={20} />
          <Tooltip
            text="common:canvasNavigationIconButtons.regenerate"
            position="left-0 top-10"
          />
        </button>
        {/*Previous*/}
        <button
          onClick={goToPreviousCanvasContentVersion}
          disabled={isStreamingCanvasContent || !hasPreviousContent}
          className={`flex place-content-center my-auto p-2 text-center transform transition-all duration-200 ease-in-out ${
            isStreamingCanvasContent || !hasPreviousContent
              ? " text-gray-300 cursor-not-allowed"
              : `${
                  isMobileAndTablet ? "hover:bg-gray-600" : "hover:bg-gray-400"
                }`
          } rounded-lg relative group`}
          aria-label={
            isStreamingCanvasContent || !hasPreviousContent
              ? t("common:canvasNavigationIconButtons.noPrevious")
              : t("common:canvasNavigationIconButtons.previous")
          }
        >
          <TbArrowBackUp strokeWidth={1.6} size={20} />
          <Tooltip
            text={`${
              isStreamingCanvasContent || !hasPreviousContent
                ? "common:canvasNavigationIconButtons.noPrevious"
                : "common:canvasNavigationIconButtons.previous"
            }`}
            position="left-0 top-10"
          />
        </button>
        {/*Next*/}
        <button
          onClick={goToNextCanvasContentVersion}
          disabled={isStreamingCanvasContent || !hasNextContent}
          className={`flex place-content-center my-auto p-2 text-center transform transition-all duration-200 ease-in-out ${
            isStreamingCanvasContent || !hasNextContent
              ? " text-gray-300 cursor-not-allowed"
              : `${
                  isMobileAndTablet ? "hover:bg-gray-600" : "hover:bg-gray-400"
                }`
          } rounded-lg relative group`}
          aria-label={
            isStreamingCanvasContent || !hasNextContent
              ? t("common:canvasNavigationIconButtons.noNext")
              : t("common:canvasNavigationIconButtons.next")
          }
        >
          <TbArrowForwardUp strokeWidth={1.6} size={20} />
          <Tooltip
            text={`${
              isStreamingCanvasContent || !hasNextContent
                ? "common:canvasNavigationIconButtons.noNext"
                : "common:canvasNavigationIconButtons.next"
            }`}
            position="left-0 top-10"
          />
        </button>
        {/*Copy Button Component*/}
        <ContentCopy
          handleCopyContent={copyCurrentCanvasContent}
          customClass={`${
            isMobileAndTablet ? "hover:bg-gray-600" : "hover:bg-gray-400"
          } flex place-content-center my-auto p-2 text-center transform transition-all duration-200 ease-in-out rounded-lg relative group`}
          htmlToCopy=""
          iconSize={20}
          tooltipText={t("common:canvasNavigationIconButtons.copy")}
          tooltipPosition="-left-[0.35rem] -bottom-[3.4rem]"
        />
        {/*Download*/}
        <button
          onClick={downloadCurrentCanvasContent}
          disabled={isStreamingCanvasContent}
          className={`${
            isStreamingCanvasContent ? "cursor-not-allowed" : "cursor-pointer"
          } ${
            isMobileAndTablet ? "hover:bg-gray-600" : "hover:bg-gray-400"
          } flex place-content-center my-auto p-2 text-center mr-12 transform transition-all duration-200 ease-in-out rounded-lg relative group`}
          aria-label={t("common:canvasNavigationIconButtons.download")}
        >
          <TbDownload strokeWidth={1.6} size={20} />
          <Tooltip
            text="common:canvasNavigationIconButtons.download"
            position="left-0 top-10"
          />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default CanvasNavButtons;
