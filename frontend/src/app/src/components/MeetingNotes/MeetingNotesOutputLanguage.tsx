import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";

interface OutputLanguageProps {
  language: string;
  handleChange: (
    event: React.MouseEvent<HTMLElement>,
    value: string | null
  ) => void;
}

const MeetingNotesOutputLanguage: React.FC<OutputLanguageProps> = ({
  language,
  handleChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <label className="relative font-body text-md w-full text-white-100 group capitalize mb-3">
        {t("meeting-note-generator:chatDialogueBox.selectLanguage")}
      </label>
      <ToggleButtonGroup
        color="primary"
        value={language}
        exclusive
        onChange={handleChange}
        aria-label="Language Output Setting"
      >
        <div className="flex w-full justify-between gap-3 mb-8 flex-wrap xs:flex-nowrap">
          <ToggleButton
            data-testid="language-output-danish"
            value="Danish"
            className="!font-body !text-[16px] !w-full !text-gray-300 !border-2 !border-gray-500 !rounded-xl !py-3 !px-4 !capitalize"
            sx={{
              "&:focus": {
                color: "#EDEDED!important",
                backgroundColor: "#2F2F2F!important",
                borderColor: "#2F2F2F!important",
              },
              "&:hover": {
                color: "#EDEDED!important",
                backgroundColor: "#2F2F2F!important",
                borderColor: "#2F2F2F!important",
              },
              "&.Mui-selected": {
                color: "#EDEDED!important",
                backgroundColor: "#2F2F2F",
                borderColor: "#2F2F2F!important",
              },
            }}
          >
            {t("common:languageOptions.danish")}
          </ToggleButton>
          <ToggleButton
            value="English"
            data-testid="language-output-english"
            className="!font-body !text-[16px] !w-full !text-gray-300 !border-2 !border-gray-500 !rounded-xl !py-3 !px-4 !capitalize"
            sx={{
              "&:focus": {
                color: "#EDEDED!important",
                backgroundColor: "#2F2F2F!important",
                borderColor: "#2F2F2F!important",
              },
              "&:hover": {
                color: "#EDEDED!important",
                backgroundColor: "#2F2F2F!important",
                borderColor: "#2F2F2F!important",
              },
              "&.Mui-selected": {
                color: "#EDEDED!important",
                backgroundColor: "#2F2F2F",
                borderColor: "#2F2F2F!important",
              },
            }}
          >
            {t("common:languageOptions.english")}
          </ToggleButton>
        </div>
      </ToggleButtonGroup>
    </div>
  );
};

export default MeetingNotesOutputLanguage;
