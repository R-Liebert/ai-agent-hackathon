import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { TbCalendarSearch } from "react-icons/tb";

export type ExpiryMode = "setDate" | "unlimited";

interface ExpiryDateUpdateSectionProps {
  expiryMode: ExpiryMode;
  onModeChange: (mode: ExpiryMode) => void;
  selectedDate: Dayjs | null;
  onDateChange: (date: Dayjs | null) => void;
  onClearError?: () => void;
  showTabs?: boolean;
  allowUnlimited?: boolean;
  showLabel?: boolean;
  variant?: "default" | "configuration";
}

export default function ExpiryDateUpdateSection({
  expiryMode,
  onModeChange,
  selectedDate,
  onDateChange,
  onClearError,
  showTabs = true,
  allowUnlimited = true,
  showLabel = true,
  variant = "default",
}: ExpiryDateUpdateSectionProps) {
  const { t } = useTranslation("subscriptions");

  const allTabs = useMemo<ReadonlyArray<{ key: ExpiryMode; label: string }>>(
    () => [
      {
        key: "setDate",
        label: t("subscriptionDetails.expiryDialog.setExpiryDate", {
          defaultValue: "Set expiry date",
        }),
      },
      {
        key: "unlimited",
        label: t("subscriptionDetails.expiryDialog.unlimited", {
          defaultValue: "Unlimited",
        }),
      },
    ],
    [t],
  );

  const expiryTabs = allowUnlimited
    ? allTabs
    : allTabs.filter((t) => t.key === "setDate");

  const effectiveLabel = showLabel
    ? t("adminDashboard.adminActionModal.expiryDateLabel")
    : undefined;

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs row (hidden for user flows) */}
      {showTabs && (
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Expiry mode"
        >
          {expiryTabs.map((link) => {
            const active = expiryMode === link.key;
            return (
              <button
                key={link.key}
                type="button"
                role="tab"
                onClick={() => {
                  onModeChange(link.key);
                  if (link.key === "unlimited") {
                    onDateChange(null);
                  }
                  onClearError?.();
                }}
                className={`px-4 py-2 !font-body rounded-lg border text-sm ${
                  active
                    ? "bg-gray-400 border-gray-500 text-white-100"
                    : "bg-gray-650 border-transparent text-gray-300"
                } hover:bg-gray-650 focus:outline-none transition-colors duration-300 ease-in`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Date row:
         - If tabs are hidden → always show the date picker.
         - If tabs are shown → show only when expiryMode === "setDate". */}
      {(!showTabs || expiryMode === "setDate") && (
        <div className="flex items-center gap-3">
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="da">
            <DatePicker<Dayjs>
              className={`w-full rounded-xl ${
                variant === "configuration"
                  ? "!bg-gray-650" // new background for config page
                  : "!bg-gray-900/60 !mt-4 mb-3"
              }`}
              label={effectiveLabel}
              value={selectedDate}
              onChange={(newValue: Dayjs | null) => {
                onDateChange(newValue);
                onClearError?.();
              }}
              sx={{
                "& .MuiInputLabel-root": {
                  color: "#89898E",
                  fontFamily: "'Nunito Sans', sans-serif",
                  fontSize: "14px",
                  padding: "0 4px",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#DEDEDE",
                  fontSize: "18px",
                  backgroundColor: "transparent!important",
                  paddingRight: "8px",
                },
                "& .MuiInputLabel-root.MuiInputLabel-shrink": {
                  color: "#DEDEDE",
                  fontSize: "18px",
                  backgroundColor: "#232323",
                  paddingRight: "8px",
                },
                "& .MuiOutlinedInput-root": {
                  fontSize: "14px",
                  borderRadius: "14px",
                  color: "#DEDEDE",
                  outline: "none",
                  fontFamily: "'Nunito Sans', sans-serif",
                  border: "transparent",
                  padding: "0 6px",
                  "& fieldset": {
                    borderColor: "#2F2F2F!important",
                    borderWidth: "1.6px",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#DEDEDE",
                    borderWidth: "1.8px",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  paddingTop: 3.2,
                  paddingBottom: 3.2,
                  paddingLeft: 1.4,
                  paddingRight: 2,
                  boxSizing: "border-box",
                },
              }}
              slots={{
                openPickerIcon: () => (
                  <TbCalendarSearch
                    style={{
                      color: "white",
                      fontSize: "24px",
                      strokeWidth: "1.2px",
                      marginRight: "14px",
                    }}
                  />
                ),
              }}
              slotProps={{
                //remove placeholder when we hide label
                textField: showLabel
                  ? {}
                  : {
                      placeholder: "", // no placeholder
                      InputLabelProps: { shrink: false }, // ensure no label space
                    },
                popper: {
                  sx: {
                    zIndex: 9999,
                    "& .MuiPaper-root": {
                      backgroundColor: "#212121",
                      borderColor: "#3A3A3D",
                      borderWidth: "1.8px",
                      color: "#dedede",
                      borderRadius: "14px",
                      marginTop: "10px",
                    },
                    "& .MuiPickersDay-root": {
                      fontFamily: "'Nunito Sans', sans-serif",
                      color: "#7D7E8B",
                      "&.Mui-selected": {
                        backgroundColor: "#424242",
                        color: "#DEDEDE",
                      },
                      "&:hover": {
                        backgroundColor: "#424242",
                      },
                      "&.MuiPickersDay-today": {
                        color: "#7D7E8B",
                        backgroundColor: "#292929",
                        borderColor: "#292929",
                      },
                    },
                    "& .MuiTypography-root": {
                      fontFamily: "'Nunito Sans', sans-serif",
                      color: "#DEDEDE",
                      fontWeight: "500",
                    },
                    "& .MuiPickersCalendarHeader-root": {
                      fontFamily: "'Nunito Sans', sans-serif",
                      color: "#DEDEDE",
                    },
                    "& .MuiPickersCalendarHeader-labelContainer": {
                      fontFamily: "'Nunito Sans', sans-serif",
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "#DEDEDE",
                    },
                    "& .MuiButtonBase-root": {
                      color: "#dedede",
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </div>
      )}
    </div>
  );
}
