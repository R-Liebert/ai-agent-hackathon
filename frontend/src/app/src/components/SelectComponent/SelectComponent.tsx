import React from "react";
import { Select, MenuItem, styled, useTheme } from "@mui/material";
import { InputBase } from "@mui/material";

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(3),
  },
  "& .MuiInputBase-input": {
    padding: "15px",
  },
  "& .MuiInputBase-input:hover": {
    background: "#2f2f2f",
  },
}));

const WhiteDropdownSelect = styled(Select)(({ theme }) => ({
  "& .MuiSelect-icon": {
    color: "white",
    transition: "opacity 0.3s ease-in-out",

    // Hide the icon on screens below 420px
    "@media (max-width: 435px)": {
      opacity: 0,
      visibility: "hidden",
    },
  },
}));

export const SelectComponent = ({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: any;
  onChange: any;
  options: any[];
  label: string;
  className?: string; // Making className optional
}) => {
  const theme = useTheme();

  return (
    <WhiteDropdownSelect
      className={`${className} hidden sm:block`}
      labelId={`${label}-label`}
      value={value}
      onChange={onChange}
      fullWidth
      input={<BootstrapInput />}
      style={{
        backgroundColor: "transparent",
        color: "gray",
        borderRadius: ".75rem",
        maxWidth: "100%",
        marginBottom: "15px",
        border: "1px solid #4b4b4b",
        fontSize: "13.3px",
        fontWeight: 400,
        lineHeight: 1.25,
      }}
      renderValue={
        (selected) =>
          selected ? (
            <div className="flex flex-col flex-start flex-wrap gap-1">
              <span
                className="chat-option-btn"
                style={{ color: "#ececec", lineHeight: "1" }}
              >
                {label}
              </span>
              <span
                className="chat-option-btn"
                style={{ color: "white", opacity: ".5" }}
              >
                {options.find((option) => option.value === selected)?.label}
              </span>
            </div>
          ) : (
            label
          ) // Show the label when no option is selected
      }
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </WhiteDropdownSelect>
  );
};

export default SelectComponent;
