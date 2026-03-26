import React from "react";
import FormLabel from "../../components/Global/FormLabel";

interface SelectorProps {
  options: { value: string; label: string }[];
  value: string;
  label: string;
  tooltipText?: string;
  onChange: (value: string) => void;
  renderOption?: (
    option: { value: string; label: string },
    selectedValue: string
  ) => React.ReactNode;
  hasErrorValidation?: boolean;
  fieldTouched?: boolean;
  fieldError?: string;
}

const FormTabSelector: React.FC<SelectorProps> = ({
  options,
  value,
  label,
  tooltipText,
  onChange,
  renderOption,
  hasErrorValidation = false,
  fieldTouched,
  fieldError,
}) => {
  return (
    <div className="flex flex-col w-full">
      {/* Label with Tooltip */}
      <FormLabel label={label} tooltipText={tooltipText} />

      {/* Dynamic Options */}
      <div className={`flex flex-wrap gap-3 w-full justify-between`}>
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            data-testid={`selector-${option.value}`}
            onClick={() => onChange(option.value)}
            className={` font-body text-md flex-grow w-auto border-2 rounded-xl py-3 px-6 xs:px-10 sm:px-1 capitalize transition-all duration-200 ${
              value === option.value
                ? "bg-gray-600 border-gray-600 text-white-100"
                : "bg-transparent text-gray-300 border-gray-500 hover:bg-[#2F2F2F] hover:border-[#2F2F2F] hover:text-[#EDEDED]"
            }`}
          >
            {renderOption ? renderOption(option, value) : option.label}
          </button>
        ))}
      </div>

      {/* Error Validation */}
      {hasErrorValidation && fieldTouched && fieldError && (
        <p className="text-red-400 mt-2 text-md font-body">{fieldError}</p>
      )}
    </div>
  );
};

export default FormTabSelector;
