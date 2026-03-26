import { FormControlLabel, Checkbox } from "@mui/material";
import { ChangeEvent } from "react";

type CheckBoxControlProps = {
  label: string;
  description?: string;
  value: boolean | undefined;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const CheckBoxControl = ({ label, description, value, onChange }: CheckBoxControlProps) => {
  return (
    <FormControlLabel
      control={<Checkbox checked={value} onChange={onChange} />}
      label={label}
      title={description}
      className="!font-body !text-md !w-full !text-gray-300"
    />
  );
};

export default CheckBoxControl;
