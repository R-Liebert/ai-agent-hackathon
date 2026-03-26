import React from "react";
import {
  Button,
  IconButton,
  styled,
  TextField,
  Tooltip,
  tooltipClasses,
  TooltipProps,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import "./input-change-field-component.css";
import { useTranslation } from "react-i18next";

interface InputChangeFieldProps {
  value: string;
  title: string;
  placeholder: string;
  isError: boolean;
  handleInputChange: (value: string) => void;
  isVisible: boolean;
}

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: "rgba(0, 0, 0, 0.87)",
    boxShadow: theme.shadows[1],
    fontSize: 11,
    padding: "10px",
  },
}));

const InputChangeField = ({
  value,
  title,
  placeholder,
  isError,
  handleInputChange,
  isVisible,
}: InputChangeFieldProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(event.target.value);
  };

  const { t } = useTranslation();

  return (
    <>
      <div
        className={`input-change-field-wrapper relative ${
          isError && "no-valid"
        } ${isVisible && "visible"}`}
      >
        <div className="input-edit-state">
          <p className="text-[#A1A1AA] text-[13px]">
            {title}
            <HtmlTooltip
              title={
                <span style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
                  {placeholder}
                </span>
              }
              placement="left"
            >
              <InfoOutlinedIcon
                sx={{
                  fontSize: 16,
                  marginBottom: "2px",
                  paddingLeft: "3px",
                  visibility: value?.length == 0 ? "hidden" : "visible",
                }}
              />
            </HtmlTooltip>
          </p>
          <TextField
            inputProps={{
              style: { color: "#F0F1F5", width: "calc(100%-54px)" },
            }}
            value={value}
            className="text-field-input border-0 no-margin-padding"
            placeholder={placeholder}
            multiline
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              handleChange(event)
            }
          />
        </div>
      </div>
      {isError && (
        <p className="no-valid-message">
          {t("components:inputChangeField.errorMessage")}
        </p>
      )}
    </>
  );
};

export default InputChangeField;
