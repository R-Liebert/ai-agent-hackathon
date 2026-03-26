import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { TbCopy, TbCopyCheck } from "react-icons/tb";
import { IconType } from "react-icons";
import Tooltip from "./Tooltip";

interface AppContentCopyProps {
  handleCopyContent?: (params: {
    setMessageCopyOk: React.Dispatch<React.SetStateAction<boolean>>;
    htmlToCopy: string;
    copyType?: "activeTab" | "entireMessage";
  }) => void;

  customClass: string;
  tooltipPosition: string;
  iconSize: number;
  ariaLabel?: string;
  copiedAriaLabel?: string;
  icon?: IconType;
  copiedIcon?: IconType;

  /**
   * If the parent might pass undefined, let's do: htmlToCopy?: string
   * Then we fallback to an empty string.
   */
  htmlToCopy?: string;
  isStreaming?: boolean;
  tooltipText: string;
  copyType?: "activeTab" | "entireMessage";
}

const AppContentCopy: React.FC<AppContentCopyProps> = ({
  handleCopyContent,
  customClass,
  tooltipPosition,
  iconSize,
  ariaLabel,
  copiedAriaLabel,
  icon,
  copiedIcon,
  htmlToCopy,
  isStreaming,
  tooltipText,
  copyType,
}) => {
  const [messageCopyOk, setMessageCopyOk] = useState(false);
  const { t } = useTranslation();

  // Fallback to empty string if undefined
  const finalHtmlToCopy = htmlToCopy ?? "";
  const defaultAriaLabel = ariaLabel ?? t("components:codeCopyBtn.icon.label");
  const successAriaLabel =
    copiedAriaLabel ?? t("components:codeCopyBtn.message");
  const DefaultIcon = icon ?? TbCopy;
  const SuccessIcon = copiedIcon ?? TbCopyCheck;

  // Unified click handler
  const onCopyClick = () => {
    handleCopyContent?.({
      setMessageCopyOk,
      htmlToCopy: finalHtmlToCopy,
      copyType,
    });
    setMessageCopyOk(true);

    setTimeout(() => {
      setMessageCopyOk(false);
    }, 2000);
  };

  return (
    <>
      {messageCopyOk ? (
        <Tooltip text={tooltipText} useMui>
          <button
            disabled={isStreaming}
            aria-label={successAriaLabel}
            className={`group relative ${customClass} ${
              isStreaming ? "cursor-not-allowed" : "cursor-pointer"
            } rounded-lg flex place-items-center place-content-center text-center mr-0`}
            onClick={onCopyClick}
          >
            <SuccessIcon size={iconSize} />
          </button>
        </Tooltip>
      ) : (
        <Tooltip text={tooltipText} useMui>
          <button
            disabled={isStreaming}
            aria-label={defaultAriaLabel}
            className={`group relative ${customClass} ${
              isStreaming ? "cursor-not-allowed" : "cursor-pointer"
            } rounded-lg flex place-items-center place-content-center text-center mr-0`}
            onClick={onCopyClick}
          >
            <DefaultIcon size={iconSize} />
          </button>
        </Tooltip>
      )}
    </>
  );
};

export default AppContentCopy;
