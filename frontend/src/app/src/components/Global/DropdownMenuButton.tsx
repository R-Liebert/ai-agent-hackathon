import React from "react";
import { IconType } from "react-icons";
import { useNavigate } from "react-router-dom";

interface DropdownMenuButtonProps {
  Icon: React.ReactElement | IconType;
  label: string;
  onClick?: () => void;
  redirectTo?: string;
  gap?: number;
  disabled?: boolean;
  variant?: string;
  iconSize?: number;
}

function isIconType(icon: React.ReactElement | IconType): icon is IconType {
  return typeof icon === "function";
}

function DropdownMenuButton({
  Icon,
  label,
  onClick,
  redirectTo,
  gap = 3,
  disabled = false,
  variant = "default",
  iconSize = 23,
}: DropdownMenuButtonProps & { variant?: "delete" | "default" }) {
  const navigate = useNavigate();
  const gapClass = `gap-${gap}`;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (redirectTo) {
      if (redirectTo.startsWith("https")) {
        window.open(redirectTo, "_blank");
      } else {
        navigate(redirectTo);
      }
    }
  };

  // Conditional styles for delete variant
  const variantClasses =
    variant === "delete"
      ? "text-red-100 hover:bg-red-100/15 focus:bg-red-100/15"
      : "hover:bg-gray-450 focus:bg-gray-450 text-white-100";

  return (
    <button
      aria-label={label}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      onKeyDown={(e) => {
        // Optional: prevent bubbling for keyboard triggers too
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
        }
      }}
      className={`p-2 pr-3 w-full flex ${variantClasses} rounded-lg ${gapClass}
        items-center text-sm`}
      disabled={disabled}
    >
      <div className="flex text-center shrink-0">
        {isIconType(Icon) ? <Icon strokeWidth={1.4} size={iconSize} /> : Icon}
      </div>
      <span className="flex flex-1 text-left w-auto truncate">{label}</span>
    </button>
  );
}

export default DropdownMenuButton;
