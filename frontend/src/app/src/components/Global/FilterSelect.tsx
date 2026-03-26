import React from "react";
import { SelectBase, SelectOption } from "./SelectBase";

type FilterSelectProps = {
  id?: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  isSubscriptionElement?: boolean;
  onValueChange: (v: string) => void;
  dropdownMode?: "container" | "clamp" | "content";
  minDropdownPx?: number;
  maxDropdownPx?: number;
};

const FilterSelect: React.FC<FilterSelectProps> = ({
  id,
  value,
  options,
  placeholder,
  disabled,
  ariaLabel,
  isSubscriptionElement,
  onValueChange,
  dropdownMode = "content",
  minDropdownPx,
  maxDropdownPx,
}) => {
  return (
    <SelectBase
      id={id}
      value={value}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      ariaLabel={ariaLabel}
      isSubscriptionElement={isSubscriptionElement}
      dense
      dropdownMode={dropdownMode}
      minDropdownPx={minDropdownPx}
      maxDropdownPx={maxDropdownPx}
      onSelect={onValueChange}
    />
  );
};

export default FilterSelect;
