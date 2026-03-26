import React from "react";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useTranslation } from "react-i18next";

interface FileTypeFilterProps {
  fileTypeFilter: string;
  onFilterChange: (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string
  ) => void;
}

export const FileTypeFilter: React.FC<FileTypeFilterProps> = ({
  fileTypeFilter,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  return (
    <ToggleButtonGroup
      value={fileTypeFilter}
      exclusive
      onChange={onFilterChange}
      aria-label="file type filter"
      size="small"
      sx={{
        "& .MuiToggleButton-root": {
          color: "rgba(255, 255, 255, 0.7)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          textTransform: "none",
          fontFamily: "Nunito Sans",
          fontWeight: "400",
          "&.Mui-selected": {
            color: "#fff",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.15)",
            },
          },
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            color: "#fff",
          },
        },
      }}
    >
      <ToggleButton
        className="!px-3"
        value="all"
        sx={{ borderRadius: "8px 0 0 8px" }}
      >
        {t("workspaces:common:sharePointPicker:filters:viewAll")}
      </ToggleButton>
      <ToggleButton className="!px-3" value="word">
        {t("workspaces:common:sharePointPicker:filters:word")}
      </ToggleButton>
      <ToggleButton className="!px-3" value="spreadsheet">
        {t("workspaces:common:sharePointPicker:filters:spreadsheets")}
      </ToggleButton>
      <ToggleButton
        className="!px-3"
        value="pdf"
        sx={{ borderRadius: "0 8px 8px 0" }}
      >
        {t("workspaces:common:sharePointPicker:filters:pdfs")}
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
