import React, { useState } from "react";
import Dropdown from "../../modal-dropdown";
import { useUserConfiguration } from "../../../contexts/UserConfigurationProvider";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import { usePermissions } from "../../../contexts/AuthProvider";
import { notificationsService } from "../../../services/notificationsService";
import { TbSettingsSpark } from "react-icons/tb";

interface SettingsContentProps {
  userId?: string;
  onDeleteAllChats: () => void;
  onCloseSettingsModal: () => void;
}

const SettingsContent: React.FC<SettingsContentProps> = ({
  onDeleteAllChats,
  userId,
  onCloseSettingsModal,
}) => {
  const [theme, setTheme] = useState("Dark");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useTranslation();
  const { refetchPermissions } = usePermissions();

  const languages = [
    {
      label: t("components:settingsModal.languageSetting.english.label"),
      code: t("components:settingsModal.languageSetting.english.code"),
    },
    {
      label: t("components:settingsModal.languageSetting.danish.label"),
      code: t("components:settingsModal.languageSetting.danish.code"),
    },
  ];

  const { activeLanguage, changeLanguage } = useUserConfiguration();

  const changeLanguageHandler = (selectedLanguageCode: string) => {
    changeLanguage(selectedLanguageCode); // call changeLanguage from context

    setTimeout(() => {
      onCloseSettingsModal();
    }, 300);
  };

  const handleRefreshPermissions = async () => {
    setIsRefreshing(true);
    try {
      await refetchPermissions();
      notificationsService.success(
        t(
          "components:settingsModal.advancedSection.refreshPermissions.success"
        ) || "Permissions refreshed successfully"
      );
    } catch (error) {
      notificationsService.error(
        t(
          "components:settingsModal.advancedSection.refreshPermissions.error"
        ) || "Failed to refresh permissions"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="w-full flex flex-col text-md">
      {/* theme setting => full functionality pending*/}
      <div className="flex py-4 w-full justify-between text-sm border-b-2 border-gray-500 align-center place-content-center">
        <p>{t("components:settingsModal.themeSetting.label")}</p>
        <div className="flex place-content-center">
          {t("components:settingsModal.themeSetting.dark")}
        </div>
      </div>

      {/* language setting */}
      <div className="flex py-2 w-full justify-between text-sm border-b-0 border-gray-500 align-center place-items-center z-20">
        <p>{t("components:settingsModal.languageSetting.label")}</p>
        <Dropdown
          label="Language"
          options={languages.map((lang) => ({
            label: lang.label,
            value: lang.code,
          }))}
          selectedValue={activeLanguage}
          onSelect={changeLanguageHandler}
        />
      </div>

      {/* Advanced Section */}
      <div className="my-2">
        <Accordion
          sx={{
            backgroundColor: "transparent",
            color: "inherit",
            "&:before": {
              display: "none",
            },
            boxShadow: "none",
            "& .MuiAccordion-root": {
              backgroundColor: "transparent",
            },
          }}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon sx={{ color: "#9ca3af", fontSize: "20px" }} />
            }
            aria-controls="advanced-content"
            id="advanced-header"
            sx={{
              backgroundColor: "transparent",
              padding: "0",
              minHeight: "unset",
              "& .MuiAccordionSummary-content": {
                margin: "0",
              },
              "& .MuiAccordionSummary-expandIconWrapper": {
                marginRight: "0",
              },
            }}
            className="py-4 border-b-2 border-gray-500"
          >
            <div className="flex items-center gap-3">
              <TbSettingsSpark size={20} className="text-white-100" />
              <p className="text-md font-semibold">
                {t("components:settingsModal.advancedSection.title") ||
                  "Advanced"}
              </p>
            </div>
          </AccordionSummary>
          <AccordionDetails sx={{ padding: "0" }}>
            <div className="flex flex-col">
              {/* Refresh Permissions */}
              <div className="flex pt-4 w-full justify-between text-sm align-center place-items-center">
                <div className="flex flex-col">
                  <p>
                    {t(
                      "components:settingsModal.advancedSection.refreshPermissions.label"
                    ) || "Refresh Permissions"}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    {t(
                      "components:settingsModal.advancedSection.refreshPermissions.description"
                    ) || "Update your access permissions"}
                  </p>
                </div>
                <button
                  aria-label="Refresh Permissions"
                  className="text-gray-700 hover:text-white-100 !text-md font-body flex place-content-center place-items-center rounded-full px-3 py-2 text-[14px] bg-white-100 hover:bg-red-600 font-semibold transition-color duration-300 ease-in-out"
                  onClick={handleRefreshPermissions}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <>
                      <CircularProgress size={16} sx={{ color: "inherit" }} />
                      <span className="ml-1">
                        {t(
                          "components:settingsModal.advancedSection.refreshPermissions.refreshing"
                        ) || "Refreshing..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshIcon sx={{ fontSize: "20px" }} />
                      <span className="ml-1">
                        {t(
                          "components:settingsModal.advancedSection.refreshPermissions.button"
                        ) || "Refresh"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  );
};

export default SettingsContent;
