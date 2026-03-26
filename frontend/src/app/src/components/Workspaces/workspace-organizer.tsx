import { useState, FC } from "react";
import { FiChevronDown } from "react-icons/fi";
import { StyledPopover } from "../StyledPopover";

interface WorkspaceOrganizerProps {
  options: string[];
  selectedOption: string;
  onOptionChange: (option: string) => void;
  label: string;
  anchorElRef: React.RefObject<HTMLButtonElement>;
  position: { vertical: "top" | "bottom"; horizontal: "left" | "right" };
}

const WorkspaceOrganizer: FC<WorkspaceOrganizerProps> = ({
  options,
  selectedOption,
  onOptionChange,
  label,
  anchorElRef,
  position,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div>
      <button
        ref={anchorElRef}
        onClick={toggleDropdown}
        className={`relative w-full text-white-100 flex items-center justify-end text-right px-4 py-2 rounded-lg duration-300 transition-all transform ${
          isOpen
            ? "bg-gray-600 text-superwhite"
            : "hover:bg-gray-600 hover:text-superwhite active:bg-gray-600 active:text-superwhite"
        }`}
      >
        {label}
        {selectedOption && ":"} {selectedOption}
        <FiChevronDown
          className={`ml-2 transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <StyledPopover
          open={isOpen}
          onClose={() => setIsOpen(false)}
          anchorEl={anchorElRef.current}
          anchorOrigin={position}
          transformOrigin={{
            vertical: position.vertical === "top" ? "bottom" : "top",
            horizontal: position.horizontal,
          }}
          topMargin={8}
          disableScrollLock={true}
        >
          <div className="flex flex-col gap-1">
            {options.map((option) => (
              <div
                key={option}
                className={`p-2 text-white-100 rounded-lg cursor-pointer flex items-center duration-300 transition-all transform ${
                  selectedOption === option
                    ? "bg-gray-400 text-superwhite"
                    : "hover:bg-gray-400 hover:text-superwhite"
                }`}
                onClick={() => {
                  onOptionChange(option);
                  setIsOpen(false);
                }}
              >
                <span>{option}</span>
              </div>
            ))}
          </div>
        </StyledPopover>
      )}
    </div>
  );
};

export default WorkspaceOrganizer;
