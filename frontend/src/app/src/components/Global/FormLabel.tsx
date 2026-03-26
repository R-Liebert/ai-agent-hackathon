import React from "react";
import { IoHelpCircleSharp } from "react-icons/io5";
import Tooltip from "./FormTooltip";

interface FormLabelProps {
  label: string;
  tooltipText?: string;
  size?: "sm" | "md";
}

const FormLabel: React.FC<FormLabelProps> = ({
  label,
  tooltipText,
  size = "md",
}) => {
  const textSizeClass = size === "sm" ? "text-sm mt-4" : "text-md mt-8";

  return (
    <div
      className={`flex gap-2 mb-2 items-center w-full font-body text-white-100 ${textSizeClass}`}
    >
      <span>{label}</span>
      {tooltipText && (
        <Tooltip text={tooltipText}>
          <IoHelpCircleSharp size={22} />
        </Tooltip>
      )}
    </div>
  );
};

export default FormLabel;
