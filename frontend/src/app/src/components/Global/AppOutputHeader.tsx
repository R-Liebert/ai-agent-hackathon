import React, { useState, useEffect, useRef } from "react";
import ContentCopy from "../Global/AppContentCopy";
import handleCopyContent from "../../utils/handleCopyContent";
import { Skeleton } from "@mui/material";
import { TbRepeat } from "react-icons/tb";
import Tooltip from "./Tooltip";
import { useTranslation } from "react-i18next";
import attachCopyEventListener from "../../utils/attachCopyEventListener";

type ContentItem = {
  text: string;
  type: "text" | "error";
};

interface AppOutputHeaderProps {
  contentData: ContentItem[] | string;
  loadingState: boolean;
  title: string;
  htmlToCopy: string;
  isStreaming: boolean;
  handleStartStreams: () => void;
  isDesktop?: boolean;
}

const AppOutputHeader: React.FC<AppOutputHeaderProps> = ({
  contentData,
  loadingState,
  title,
  htmlToCopy,
  isStreaming,
  handleStartStreams,
  isDesktop,
}) => {
  const { t } = useTranslation();
  const [iconSize, setIconSize] = useState(24);

  const outputHeaderRef = useRef<HTMLDivElement>(null);

  // Attach the copy event listener for manual text selection
  useEffect(() => {
    const { attachListener, detachListener } =
      attachCopyEventListener(outputHeaderRef);

    attachListener();

    return () => {
      detachListener();
    };
  }, [contentData]);

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 600) {
        setIconSize(20);
      } else {
        setIconSize(24);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleCopyContentWrapper = ({
    htmlToCopy,
    setMessageCopyOk,
    timeout,
  }: {
    htmlToCopy: string;
    setMessageCopyOk: React.Dispatch<React.SetStateAction<boolean>>;
    timeout?: number;
  }) => {
    handleCopyContent({
      htmlToCopy,
      setMessageCopyOk,
      timeout,
      errorMessage: t("common:copyContent.error"),
      successMessage: t("common:copyContent.success"),
    });
  };

  return (
    <div
      ref={outputHeaderRef}
      className="flex flex-col xs:flex-row w-full justify-between"
    >
      <>
        {isDesktop ? (
          <h2 className="xxl:text-[24px] lg:text-[20px] text-[22px] font-medium pb-4 sm:w-[65%] x-full">
            {title}
          </h2>
        ) : loadingState || contentData.length > 0 ? (
          <h2 className="xxl:text-[24px] lg:text-[20px] text-[22px] font-medium pb-4 sm:w-[65%] x-full">
            {title}
          </h2>
        ) : null}
      </>
      {contentData.length > 0 && (!loadingState || isStreaming) && (
        <div className="flex ml-auto mr-0">
          <Tooltip text={t("components:tooltips.regenerate")} useMui>
            <button
              aria-label={t("components:tooltips.regenerate")}
              className="relative bg-transparent hover:bg-gray-600  rounded-lg sm:w-12 sm:h-12 w-10 h-10
              flex items-center justify-center sm:mr-2 mr-0 group"
              onClick={handleStartStreams}
            >
              <TbRepeat size={iconSize} />
            </button>
          </Tooltip>
          <ContentCopy
            handleCopyContent={handleCopyContentWrapper}
            customClass="relative bg-transparent hover:bg-gray-600  rounded-lg sm:w-12 sm:h-12 w-10 h-10
              flex items-center justify-center sm:mr-2 mr-0 group"
            tooltipPosition="-left-[0.35rem] -bottom-[3.4rem]"
            iconSize={iconSize}
            htmlToCopy={htmlToCopy}
            isStreaming={isStreaming}
            tooltipText={t("components:codeCopyBtn.copy")}
          />
        </div>
      )}
      {!contentData.length && (loadingState || isStreaming) && (
        <div className="!rounded-full !bg-gray-650 overflow-hidden w-12 h-12">
          {" "}
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="pulse"
          />
        </div>
      )}
    </div>
  );
};

export default AppOutputHeader;
