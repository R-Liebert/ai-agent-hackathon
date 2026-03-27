import React, { useState, useEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import {
  Box,
  CircularProgress,
  Slider,
  Typography,
  ToggleButtonGroup,
  FormLabel,
  ToggleButton,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { FiCheckCircle } from "react-icons/fi";
import axiosInstance from "../../../services/axiosInstance";
import { PersonaConfig, UserSettings } from "../../../models/persona-config";
import { useMsal } from "../../hooks/useMsalMock";
import { useUserConfiguration } from "../../../contexts/UserConfigurationProvider";
import ModalContainer from "../../Global/ModalContainer";
import { motion, AnimatePresence } from "framer-motion";
import {
  interactionStyleToNumber,
  interactionStyleToString,
  detailLevelToNumber,
  detailLevelToString,
} from "../../../utils/personaConverters";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface CustomizeChatGPTProps {
  openPopupPersonaConfig: boolean;
  onClose: () => void;
  isOpen?: boolean;
}

const CustomizeChatGPT: React.FC<CustomizeChatGPTProps> = ({
  openPopupPersonaConfig,
  onClose,
  isOpen,
}) => {
  const { t } = useTranslation();
  const {
    activeLanguage,
    userSettings,
    updateUserSettings,
    isLoading: contextLoading,
  } = useUserConfiguration();
  const [userPersonality, setUserPersonality] = useState<string>("");
  const [interactionStyle, setInteractionStyle] = useState<string>("default");
  const [detailLevel, setDetailLevel] = useState<string>("default");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const { accounts } = useMsal();
  const [isSent, setSentStatus] = useState(false);
  const [isError, setErrorStatus] = useState(false);
  const SUCCESS_STATE_DURATION_MS = 4200;
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleModalClose = () => {
    clearCloseTimer();
    setSaveLoading(false);
    setSentStatus(false);
    setErrorStatus(false);
    onClose();
  };

  const scheduleAutoClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      handleModalClose();
    }, SUCCESS_STATE_DURATION_MS);
  };

  useEffect(() => {
    if (openPopupPersonaConfig && userSettings?.chatPersona) {
      console.log("User settings from backend:", userSettings);
      console.log("Chat persona:", userSettings.chatPersona);
      console.log(
        "Interaction style type:",
        typeof userSettings.chatPersona?.interactionStyle
      );
      console.log(
        "Interaction style value:",
        userSettings.chatPersona?.interactionStyle
      );

      console.log("User settings from backend:", userSettings);
      console.log("Chat persona:", userSettings.chatPersona);
      console.log(
        "Interaction style type:",
        typeof userSettings.chatPersona?.interactionStyle
      );
      console.log(
        "Interaction style value:",
        userSettings.chatPersona?.interactionStyle
      );

      setUserPersonality(userSettings.chatPersona?.systemMessage ?? "");

      // Convert numeric values from backend to string values for UI
      const interactionStr = interactionStyleToString(
        userSettings.chatPersona?.interactionStyle
      );
      setInteractionStyle(interactionStr.toLowerCase());

      const detailLevelValue = userSettings.chatPersona?.detailLevel;
      console.log(
        "Detail level from backend:",
        detailLevelValue,
        "type:",
        typeof detailLevelValue
      );
      const detailLevelStr = detailLevelToString(detailLevelValue);
      console.log("Setting detail level to:", detailLevelStr);
      setDetailLevel(detailLevelStr.toLowerCase());
    }
  }, [openPopupPersonaConfig, userSettings]);

  useEffect(() => {
    if (isOpen) {
      setSentStatus(false);
      setErrorStatus(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  const handleToggleSelected = (value: string): boolean => {
    return value === interactionStyle;
  };

  const getSliderValue = (level: string | number): number => {
    console.log("getSliderValue input:", level);
    return detailLevelToNumber(level);
  };

  const valueLabelFormat = (value: number): string => {
    return detailLevelToString(value).toLowerCase();
  };

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    console.log("Slider changed to:", newValue);
    if (typeof newValue === "number") {
      const newDetailLevel = detailLevelToString(newValue).toLowerCase();
      console.log("Setting detail level from slider to:", newDetailLevel);
      setDetailLevel(newDetailLevel);
    }
  };

  const handleReset = () => {
    setUserPersonality("");
    setInteractionStyle("default");
    setDetailLevel("default");
    saveUserSettings(true);
  };

  const saveUserSettings = async (reset: boolean = false) => {
    try {
      setSaveLoading(true);
      setErrorStatus(false);
      setSentStatus(false);

      const newUserSettings: UserSettings = new UserSettings(
        accounts[0].localAccountId,
        new PersonaConfig(
          reset ? null : userPersonality,
          reset ? "0" : interactionStyleToNumber(interactionStyle).toString(),
          reset ? "0" : detailLevelToNumber(detailLevel).toString()
        ),
        activeLanguage
      );

      // Encode systemMessage as base64 to avoid firewall issues
      const requestBody = {
        ...newUserSettings,
        chatPersona: {
          ...newUserSettings.chatPersona,
          systemMessage: newUserSettings.chatPersona.systemMessage
            ? btoa(
                unescape(
                  encodeURIComponent(newUserSettings.chatPersona.systemMessage)
                )
              )
            : null,
        },
      };

      console.log("Sending user settings:", requestBody);
      console.log(
        "InteractionStyle (string):",
        interactionStyle,
        "-> (number):",
        interactionStyleToNumber(interactionStyle)
      );
      console.log(
        "DetailLevel (string):",
        detailLevel,
        "-> (number):",
        detailLevelToNumber(detailLevel)
      );

      const response = await axiosInstance.post("/persona", requestBody);

      console.log("Response status:", response.status);

      if (response.status === 200 || response.status === 201) {
        updateUserSettings(newUserSettings);
        console.log("Settings updated successfully");
        setSentStatus(true);
        scheduleAutoClose();
      } else {
        throw new Error("Failed to update user settings");
      }
    } catch (error) {
      setErrorStatus(true);
      console.error("Error uploading user settings:", error);
      scheduleAutoClose();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSave = () => {
    saveUserSettings(false);
  };

  const toneOptions = [
    { value: "default", label: "default" },
    { value: "casual", label: "casual" },
    { value: "confident", label: "confident" },
    { value: "enthusiastic", label: "enthusiastic" },
  ];

  if (!isOpen) return null;

  if (contextLoading) {
    return (
      <Dialog
        open={openPopupPersonaConfig}
        TransitionComponent={Transition}
        keepMounted
        onClose={onClose}
      >
        <Box
          sx={{ display: "flex", justifyContent: "center", padding: "20px" }}
        >
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  return (
    <ModalContainer
      open={isOpen}
      title={t("components:chatHistoryComponent.popupPersonaConfig.title")}
      onClose={handleModalClose}
      width="max-w-lg"
    >
      <div className="py-2 w-full flex flex-col mt-2">
        <AnimatePresence mode="wait" initial={false}>
          {isError ? (
            <motion.div
              key="error-state"
              className="flex flex-col py-2 px-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <p className="font-body text-[16px] py-3 px-3 mb-1 rounded-xl border border-red-900/60 bg-red-950/30 text-red-100">
                {t(
                  "components:chatHistoryComponent.popupPersonaConfig.feedbackMessages.isError"
                )}
                .
              </p>
            </motion.div>
          ) : isSent ? (
            <motion.div
              key="success-state"
              className="w-full flex flex-col items-center text-center py-4 px-2 min-h-[190px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              role="status"
              aria-live="polite"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-700/70 bg-emerald-950/40 text-emerald-200">
                <FiCheckCircle size={24} />
              </div>
              <p className="font-body text-[16px] py-2 mb-1 leading-6 text-superwhite">
                {t(
                  "components:chatHistoryComponent.popupPersonaConfig.feedbackMessages.isSent"
                )}
                .
              </p>
              <div className="mt-4 h-[4px] w-full rounded-full bg-gray-600 overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-400"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{
                    duration: SUCCESS_STATE_DURATION_MS / 1000,
                    ease: "linear",
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form-state"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
            <div className="overflow-y-auto max-h-[44vh] md:max-h-[70vh] flex flex-col">
              <FormLabel className="relative !font-body !text-[15px] !w-full !text-white-100 mb-4 group">
                {t(
                  "components:chatHistoryComponent.popupPersonaConfig.systemMessage"
                )}
              </FormLabel>

              <textarea
                maxLength={1500}
                value={userPersonality}
                onChange={(e) => setUserPersonality(e.target.value)}
                className="w-full border-2 min-h-[9em] !border-gray-500 rounded-xl font-body !text-[15px] p-4 text-white-100 outline-none bg-transparent resize-none focus:!border-white-100 focus:outline-none placeholder-gray-300"
                rows={5}
                placeholder={t(
                  "components:chatHistoryComponent.popupPersonaConfig.placeholderText"
                )}
              />

              <Typography
                variant="caption"
                color={
                  userPersonality && userPersonality.length > 1500
                    ? "error"
                    : "inherit"
                }
                className="!font-body !mt-1 !text-gray-300 !text-[10px]"
              >
                {userPersonality.length}/{1500}
              </Typography>
              <FormLabel className="!font-body !text-[15px] !w-full !text-white-100 mt-6 mb-2">
                {t(
                  "components:chatHistoryComponent.popupPersonaConfig.preferedTone.label"
                )}
              </FormLabel>
              <ToggleButtonGroup
                color="primary"
                value={interactionStyle}
                exclusive
                onChange={(e, value) => {
                  if (value !== null) {
                    setInteractionStyle(String(value).toLowerCase());
                  }
                }}
                aria-label="Platform"
              >
                <div className="flex w-full justify-between gap-2 mb-8 flex-wrap lg:flex-nowrap">
                  {toneOptions.map(({ value, label }) => (
                    <ToggleButton
                      key={value}
                      value={value}
                      selected={handleToggleSelected(value)}
                      className="!font-body !text-sm lg:!w-full !w-[48%] !text-gray-300 !border-2 !border-gray-500 !rounded-xl !py-2 !px-3 !capitalize"
                      sx={{
                        "&:focus": {
                          color: "#EDEDED!important",
                          backgroundColor: "#424242!important",
                          borderColor: "#424242!important",
                        },
                        "&:hover": {
                          color: "#EDEDED!important",
                          backgroundColor: "#424242!important",
                          borderColor: "#424242!important",
                        },
                        "&.Mui-selected": {
                          color: "#EDEDED!important",
                          backgroundColor: "#424242",
                          borderColor: "#424242!important",
                        },
                      }}
                    >
                      {t(
                        `components:chatHistoryComponent.popupPersonaConfig.preferedTone.${label}`
                      )}
                    </ToggleButton>
                  ))}
                </div>
              </ToggleButtonGroup>

              <FormLabel className="!font-body !text-[15px] !w-full !text-white-100">
                {t(
                  "components:chatHistoryComponent.popupPersonaConfig.responseLength.label"
                )}
              </FormLabel>
              <div className="p-2 flex w-[86%] !font-body !text-sm !font-semobold">
                <Slider
                  aria-labelledby="detail-level-slider"
                  value={getSliderValue(detailLevel)}
                  onChange={handleSliderChange}
                  step={1}
                  marks={[
                    {
                      value: 0,
                      label: t(
                        "components:chatHistoryComponent.popupPersonaConfig.responseLength.default"
                      ),
                    },
                    {
                      value: 1,
                      label: t(
                        "components:chatHistoryComponent.popupPersonaConfig.responseLength.concise"
                      ),
                    },
                    {
                      value: 2,
                      label: t(
                        "components:chatHistoryComponent.popupPersonaConfig.responseLength.long"
                      ),
                    },
                  ]}
                  min={0}
                  max={2}
                  sx={{
                    "& .MuiSlider-markLabel": {
                      color: "#89898E",
                      fontSize: "14px",
                      marginLeft: "11px",
                    },
                    "& .MuiSlider-markLabelActive": {
                      color: "#EDEDED",
                    },
                  }}
                  className="!text-white-100 !ml-1"
                  valueLabelFormat={valueLabelFormat}
                  valueLabelDisplay="auto"
                />
              </div>
            </div>
            <div className="flex w-full sm:justify-end justify-between sm:ml-auto ml-0 sm:gap-3 gap-0 mt-6 md:mt-10 flex-wrap sm:flex-nowrap">
              <button
                aria-label={t(
                  "components:chatHistoryComponent.popupPersonaConfig.buttons.reset"
                )}
                className="flex w-[48%] sm:w-auto place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite
              focus:bg-gray-650 focus:text-white-100 font-body"
                onClick={handleReset}
                disabled={saveLoading}
              >
                {t(
                  "components:chatHistoryComponent.popupPersonaConfig.buttons.reset"
                )}
              </button>
              <button
                aria-label={t(
                  "components:chatHistoryComponent.popupPersonaConfig.buttons.cancel"
                )}
                className="flex w-[48%] sm:w-auto place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite
              focus:bg-gray-650 focus:text-white-100 font-body"
                onClick={handleModalClose}
                disabled={saveLoading}
              >
                {t(
                  "components:chatHistoryComponent.popupPersonaConfig.buttons.cancel"
                )}
              </button>
              <button
                aria-label={t(
                  "components:chatHistoryComponent.popupPersonaConfig.buttons.customize"
                )}
                className="flex w-full sm:w-auto mt-4 sm:mt-0 place-content-center rounded-full px-3 py-2 text-[14px] bg-white-200 hover:bg-red-700 hover:text-white-100 font-body text-gray-600 font-semibold transition-color transition-background duration-300 ease-in-out place-items-center place-content-center"
                onClick={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <>
                    <CircularProgress
                      size={14}
                      sx={{ color: "#424242", mr: 1 }}
                    />
                    {t("common:saving")}
                  </>
                ) : (
                  t(
                    "components:chatHistoryComponent.popupPersonaConfig.buttons.customize"
                  )
                )}
              </button>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalContainer>
  );
};

export default CustomizeChatGPT;
