import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { TbChevronDown } from "react-icons/tb";

interface FormDropdownSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}

const FormDropdownSelector: React.FC<FormDropdownSelectorProps> = ({
  value,
  onChange,
  options,
  label,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const selectorRef = useRef<HTMLDivElement>(null);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Calculate dropdown position relative to the selector field
  useEffect(() => {
    if (selectorRef.current && isOpen) {
      const rect = selectorRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY, // Position below the field
        left: rect.left + window.scrollX, // Align with the field's left edge
        width: rect.width, // Match the width of the field
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Dropdown content rendered via portal
  const dropdownContent = (
    <ul
      className="absolute z-50 bg-gray-600 border-2 border-gray-500 rounded-xl shadow-lg overflow-hidden"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        position: "absolute",
      }}
    >
      {options.map((option) => (
        <li
          key={option.value}
          className={`p-2 text-md font-body cursor-pointer hover:bg-gray-400 hover:text-white-100 ${
            option.value === value
              ? "bg-gray-400 text-white-100"
              : "text-gray-300"
          }`}
          onClick={() => handleOptionClick(option.value)}
        >
          {option.label}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={`relative flex flex-col w-full ${className}`}
      ref={selectorRef}
    >
      {/* Label */}
      {label && (
        <label className="mb-2 text-white-100 font-body">{label}</label>
      )}

      {/* Dropdown Button */}
      <div
        className="flex items-center justify-between w-full border-2 border-gray-500 rounded-xl text-md p-4 text-white-100 bg-gray-700 font-body cursor-pointer focus:border-white-200"
        onClick={toggleDropdown}
      >
        {/* Selected Value */}
        <span>
          {options.find((option) => option.value === value)?.label ||
            "Select an option"}
        </span>

        {/* Chevron Icon */}
        <TbChevronDown
          size={20}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Render Dropdown Content via Portal */}
      {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default FormDropdownSelector;
