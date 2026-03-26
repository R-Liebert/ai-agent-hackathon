import React from "react";
import { SelectBase, SelectOption } from "./SelectBase";
import FormFieldValidationMessage from "../Global/FormFieldValidationMessage";

type FormSelectProps = {
  id?: string;
  name: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  isSubscriptionElement?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  formTouched?: boolean;
  formError?: string;
  dense?: boolean;
  density?: "default" | "compact" | "cozy";
  onSearch?: (search: string) => void;
  searchable?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
};

const FormSelect: React.FC<FormSelectProps> = ({
  id,
  name,
  value,
  options,
  placeholder,
  disabled,
  className,
  ariaLabel,
  isSubscriptionElement,
  onChange,
  onBlur,
  formTouched,
  formError,
  dense = false,
  density,
  onSearch,
  searchable = false,
  isLoading,
  hasMore,
  onLoadMore,
}) => {
  const emitChange = (nextValue: string) => {
    const syntheticEvent = {
      target: { name, value: nextValue },
    } as unknown as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
  };

  return (
    <div className={`w-full ${className || ""}`}>
      {/* Select Dropdown */}
      <SelectBase
        id={id}
        value={value}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        ariaLabel={ariaLabel}
        isSubscriptionElement={isSubscriptionElement}
        dense={dense}
        density={density}
        dropdownMode="container"
        onSelect={emitChange}
        searchable={searchable}
        onSearch={onSearch}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />

      {/* Validation Message */}
      {formTouched && formError && (
        <FormFieldValidationMessage
          formTouched={formTouched}
          formError={formError}
        />
      )}
    </div>
  );
};

export default FormSelect;
