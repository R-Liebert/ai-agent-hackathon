import React, { useRef, useState } from "react";
import { TbDotsVertical } from "react-icons/tb";
import { IconType } from "react-icons";
import Tooltip from "../../Global/Tooltip";
import DropdownMenuButton from "../../Global/DropdownMenuButton";
import { StyledPopover } from "../../StyledPopover";

export interface ActionMenuItem {
  label: string;
  Icon: IconType;
  onClick: () => void;
}

interface ActionsDropdownMenuProps {
  actions: ActionMenuItem[];
  ariaLabel?: string;
  tooltipText?: string;
  menuWidth?: string;
  iconSize?: number;
  buttonSize?: number;
  borderless?: boolean;
}

export default function ActionsDropdownMenu({
  actions,
  ariaLabel = "Actions",
  tooltipText = "Actions",
  menuWidth = "15.1rem",
  iconSize = 21,
  buttonSize = 22,
  borderless = false,
}: ActionsDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleActionClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  const baseBtn =
    "!relative w-9 h-9 rounded-lg items-center justify-center flex ml-auto mr-0 self-end focus:outline-none";
  const borderedBtn =
    "border-2 border-gray-500 bg-transparent hover:bg-gray-650";
  const borderlessBtn = "border-none bg-transparent hover:bg-gray-400";

  return (
    <>
      <Tooltip useMui text={tooltipText}>
        <button
          ref={anchorRef}
          onClick={(e) => {
            e.stopPropagation(); // prevent card onClick
            setIsOpen((prev) => !prev);
          }}
          className={[baseBtn, borderless ? borderlessBtn : borderedBtn].join(
            " ",
          )}
          aria-haspopup="menu"
          aria-label={ariaLabel}
          type="button"
        >
          <TbDotsVertical size={buttonSize} />
        </button>
      </Tooltip>

      {isOpen && (
        <StyledPopover
          open={isOpen}
          onClose={() => setIsOpen(false)}
          anchorEl={anchorRef.current}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          topMargin={16}
          sx={{ "& .MuiPopover-paper": { width: menuWidth } }}
        >
          {actions.map((action, index) => (
            <DropdownMenuButton
              key={index}
              Icon={action.Icon}
              iconSize={iconSize}
              label={action.label}
              gap={2}
              onClick={() => handleActionClick(action.onClick)}
            />
          ))}
        </StyledPopover>
      )}
    </>
  );
}
