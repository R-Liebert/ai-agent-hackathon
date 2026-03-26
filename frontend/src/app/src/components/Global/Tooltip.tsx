import React, { ReactElement } from "react";
import { Tooltip as MuiTooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

type TooltipProps = {
  text: string;
  width?: string;
  position?: string;
  useMui?: boolean;
  children?: ReactElement;
  placement?: "top" | "bottom" | "left" | "right";
};

const tooltipStyle = {
  backgroundColor: "#0B0B0B!important",
  color: "#ffffff!importnat",
  fontSize: "13px!important",
  borderRadius: "10px!important",
  padding: "4px 8px!important",
  fontFamily: "'Nunito Sans', sans-serif!important",
  transform: "translateY(-9px)!important",
} as React.CSSProperties;

const Tooltip: React.FC<TooltipProps> = ({
  text,
  width,
  position,
  useMui = false,
  children,
  placement = "bottom",
}) => {
  const { t } = useTranslation();

  const titleNode = (
    <p
      className={`normal-case ${
        !width ? "whitespace-nowrap w-auto" : `${width} whitespace-normal`
      }`}
    >
      {t(text)}
    </p>
  );

  // Render MUI Tooltip
  if (useMui) {
    if (!children) {
      throw new Error(
        "MUI Tooltip requires a valid React element as children."
      );
    }
    return (
      <MuiTooltip
        title={titleNode}
        placement={placement}
        arrow={false}
        enterDelay={150}
        leaveDelay={100}
        TransitionProps={{ timeout: 200 }}
        slotProps={{
          popper: { sx: { zIndex: 100001 } },
          tooltip: {
            sx: {
              ...tooltipStyle,
            },
          },
        }}
      >
        {children}
      </MuiTooltip>
    );
  }

  // Render Custom Tooltip
  return (
    <div
      className={`flex invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-500 absolute ${position} bg-gray-950 text-white-100 text-[12.4px] rounded-lg py-1 px-2 font-body w-auto z-[100001]`}
    >
      {titleNode}
    </div>
  );
};

export default Tooltip;
