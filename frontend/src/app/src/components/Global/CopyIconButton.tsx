import React from "react";
import { IconButton } from "@mui/material";
import Tooltip from "./Tooltip";
import { TbCopy, TbCheck } from "react-icons/tb";

interface CopyIconButtonProps {
  text: string;
  copyKey: string;
  isCopied: boolean;
  onCopy: (text: string, key: string) => Promise<boolean>;
  size?: "small" | "medium" | "large";
  tooltipText?: string;
}

const CopyIconButton: React.FC<CopyIconButtonProps> = ({
  text,
  copyKey,
  isCopied,
  onCopy,
  size = "small",
  tooltipText = "Copy to clipboard",
}) => {
  const handleClick = () => {
    onCopy(text, copyKey);
  };

  return (
    <Tooltip text={isCopied ? "Copied!" : tooltipText} useMui>
      <IconButton
        size={size}
        onClick={handleClick}
        sx={{
          color: isCopied ? "#4ade80" : "#bfbfbf",
          transition: "color 0.2s ease",
          "&:hover": {
            color: isCopied ? "#4ade80" : "#ffffff",
          },
        }}
      >
        {isCopied ? <TbCheck size={16} /> : <TbCopy size={16} />}
      </IconButton>
    </Tooltip>
  );
};

export default CopyIconButton;
