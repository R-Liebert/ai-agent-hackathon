import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { TbPencil, TbChevronDown } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import { FiX } from "react-icons/fi";
import Tooltip from "../Global/Tooltip";
import { useCanvas } from "../../hooks/useCanvas";
import useSidebarStore from "../../stores/navigationStore";
import { StyledPopover } from "../StyledPopover";
import DropdownMenuButton from "../Global/DropdownMenuButton";

interface CanvasHeaderTitleProps {
  handleCloseCanvas?: () => void;
  onRename?: (updatedTitle: string) => void;
}

const CanvasHeaderTitle: React.FC<CanvasHeaderTitleProps> = ({
  handleCloseCanvas,
  onRename,
}) => {
  const { t } = useTranslation();
  const { canvasTitle, setCanvasTitle } = useCanvas();
  const [internalTitle, setInternalTitle] = useState(canvasTitle || "");
  const [isEditing, setIsEditing] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const { isSidebarOpen } = useSidebarStore();
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(window.innerWidth > 475);

  const safeHandleCloseCanvas = handleCloseCanvas || (() => {});

  useEffect(() => {
    setInternalTitle(canvasTitle || "");
  }, [canvasTitle]);

  // Focus and select text when entering edit mode
  useLayoutEffect(() => {
    if (isEditing && spanRef.current) {
      const el = spanRef.current;
      el.focus();

      // Place the cursor at the end
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false); // Collapse to end

      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleTitleBlur = () => {
    const updatedTitle = spanRef.current?.textContent || "";
    setInternalTitle(updatedTitle);
    setCanvasTitle(updatedTitle);
    setIsEditing(false);
    if (onRename) {
      onRename(updatedTitle);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      spanRef.current?.blur();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    console.log("User input:", e.currentTarget.textContent);
  };

  const handleOpenPopover = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isEditing) {
        setAnchorEl(event.currentTarget);
      }
    },
    [isEditing]
  );

  const handleClosePopover = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleRenameClick = () => {
    handleClosePopover();
    setTimeout(() => {
      setIsEditing(true); // Delay to ensure dropdown is fully closed
    }, 0);
  };

  // Update visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      setIsVisible(window.innerWidth > 475);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`top-0 ${
        isSidebarOpen
          ? "md:left-[55vw] xl:left-[45vw]"
          : "left-8 sm:left-12 md:left-[50vw] lg:left-[37.5vw]"
      } transition-all duration-[400ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] fixed flex gap-1 lg:gap-3 items-start !z-[102] pl-4`}
    >
      <button
        aria-label="Close Modal Button"
        className="mt-[1.1rem] flex relative group"
        onClick={safeHandleCloseCanvas}
      >
        <FiX className="text-lg lg:text-2xl" />
        <Tooltip text="Close Canvas" position="-left-1 top-8" />
      </button>

      <div className="flex flex-col !w-auto mt-4">
        <div
          onClick={(e) => {
            if (!isEditing) {
              handleOpenPopover(e);
            }
          }}
          aria-label={internalTitle}
          className="mb-3 relative group flex items-center gap-2 font-body text-md lg:text-lg font-semibold text-white-100 !w-auto cursor-pointer"
        >
          {isEditing ? (
            <span
              ref={spanRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              onBlur={handleTitleBlur}
              dangerouslySetInnerHTML={{ __html: internalTitle }}
              className="!w-auto px-1 bg-blue-500 border-none !selection:bg-blue-500 !selection:text-superwhite focus:outline-none text-superwhite"
            />
          ) : (
            <span className="px-1 capitalize font-body">{internalTitle}</span>
          )}
          <span
            className={`${
              anchorEl ? "rotate-180" : ""
            } transition-all ease-out duration-200`}
          >
            <TbChevronDown className="text-md lg:text-xl" />
          </span>
        </div>

        <StyledPopover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClosePopover}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          topMargin={8}
        >
          <DropdownMenuButton
            Icon={<TbPencil fontSize={20} strokeWidth={1.6} />}
            label={t("common:canvasTitleEdit")}
            onClick={handleRenameClick}
            gap={2}
          />
        </StyledPopover>
      </div>
    </div>
  );
};

export default CanvasHeaderTitle;
