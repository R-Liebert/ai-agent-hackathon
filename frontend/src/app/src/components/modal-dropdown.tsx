import React, { useState } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import FileIcon from "../../../assets/icons/file_icon.png";

interface DropdownProps {
  label: string;
  options: Array<{ label: string; value: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
}

const ModalDropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <button
        aria-label={`Choose ${label} Option`}
        className="flex items-center justify-end w-full bg-gray-700 text-white-100 py-2 rounded-md focus:outline-none"
        onClick={toggleDropdown}
      >
        {options.find((option) => option.value === selectedValue)?.label ||
          selectedValue}
        <div className="mt-[.6px] ml-1">
          <FiChevronDown strokeWidth={1.4} />
        </div>
      </button>
      {isOpen && (
        <div
          className="absolute w-[14em] top-[-.7em] xs:right-0 md:right-[-7.2em] p-2 z-1 flex bg-gray-600 rounded-2xl flex-col 
          border-2 border-gray-500"
        >
          {options.map((option, index) => (
            <div
              key={index}
              className="flex justify-between py-2 px-3 hover:bg-gray-400 active:bg-gray-400 focus:bg-gray-400 
              rounded-lg cursor-pointer place-items-center"
              onClick={() => handleSelect(option.value)}
            >
              <p>{option.label}</p>
              <div
                className={`w-4 h-4 rounded-full flex place-items-center 
                  ${
                    selectedValue === option.value
                      ? "bg-white-200"
                      : "border-2 border-white"
                  }`}
              >
                {selectedValue === option.value && (
                  <div className="w-3 h-3 rounded-full bg-gray-200 flex justify-center items-center mx-auto">
                    <FiCheck strokeWidth={4} color="#212121" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModalDropdown;
