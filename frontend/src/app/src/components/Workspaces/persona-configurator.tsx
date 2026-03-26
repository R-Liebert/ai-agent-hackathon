import {
  Typography,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  FormLabel,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { PersonaConfigurationDto } from "../../models/workspace-model";
import Tooltip from "../Global/Tooltip";
import { IoHelpCircleSharp } from "react-icons/io5";
import {
  interactionStyleToString,
  detailLevelToString,
} from "../../utils/personaConverters";

type PersonaConfiguratorProps = {
  labelInstructions: string;
  placeholderInstructions: string;
  labelTone: string;
  labelLength: string;
  persona: PersonaConfigurationDto;
  systemMessageOverride?: boolean;
  onChange: (persona: PersonaConfigurationDto) => void;
};

const PersonaConfigurator = ({
  labelInstructions,
  placeholderInstructions,
  labelTone,
  labelLength,
  persona,
  systemMessageOverride = false,
  onChange,
}: PersonaConfiguratorProps) => {
  const { t } = useTranslation();

  const { systemMessage } = persona;
  const isOverrideEnabled = Boolean(systemMessageOverride);
  const isSystemMessageEmpty =
    isOverrideEnabled && (!systemMessage || systemMessage.trim().length === 0);
  const toneControlsDisabled = isOverrideEnabled;

  // Ensure we always work with string values in the UI (properly capitalized)
  // The ToggleButton values are "Default", "Casual", "Confident", "Enthusiastic"
  const interactionStyle = interactionStyleToString(persona.interactionStyle);
  const detailLevel = detailLevelToString(persona.detailLevel);

  const handleInteractionStyleChanged = (newValue: string | null) => {
    // When clicking on an already selected option, newValue is null
    // In this case, we simply keep the current selection (do nothing)
    if (newValue === null) {
      return;
    }
    onChange({ ...persona, interactionStyle: newValue });
  };

  //detail level
  const detailLevels: { [key: number]: { value: string; label: string } } = {
    0: {
      value: "Default",
      label: t(
        "components:chatHistoryComponent.popupPersonaConfig.responseLength.default"
      ),
    },
    1: {
      value: "Concise",
      label: t(
        "components:chatHistoryComponent.popupPersonaConfig.responseLength.concise"
      ),
    },
    2: {
      value: "Long",
      label: t(
        "components:chatHistoryComponent.popupPersonaConfig.responseLength.long"
      ),
    },
  };

  const getDetailLevelLabel = (value: number): string => {
    return detailLevels[value].label;
  };

  const getDetailLevelValue = (detailLevel: string): number => {
    const entry = Object.entries(detailLevels).find(
      ([_, item]) => item.value === detailLevel
    );
    return entry ? parseInt(entry[0], 10) : 0; // Ensure a number is returned
  };

  const handleDetailLevelChanged = (level: number | number[]) => {
    if (typeof level == "number") {
      const entry = detailLevels[level];
      onChange({ ...persona, detailLevel: entry?.value || "Default" });
    }
  };

  return (
    <div className="flex flex-col w-full mt-4">
      <FormLabel className="flex gap-2 place-items-center relative !font-body !text-md !w-full !text-white-100 mt-10 mb-2 group !cursor-pointer">
        {labelInstructions}
        <Tooltip
          width="w-56"
          text="workspaces:common:tooltips:customInstruction"
          position="left-[8.2rem] bottom-7"
        />
        <IoHelpCircleSharp size={22} />
      </FormLabel>
      <textarea
        data-testid="system-message"
        value={systemMessage}
        onChange={(e) =>
          onChange({ ...persona, systemMessage: e.target.value })
        }
        className="w-full border-2 !border-gray-500 rounded-xl font-body text-md p-4 text-white-100 outline-none bg-transparent resize-none focus:!border-white-100 focus:outline-none placeholder-gray-300"
        rows={5}
        placeholder={placeholderInstructions}
      />
      {isOverrideEnabled && (
        <Typography
          variant="caption"
          className="!font-body !text-gray-300 !mt-2 !text-xs"
        >
          {t("workspaces:common:form:systemMessageOverride.note")}
        </Typography>
      )}
      {isSystemMessageEmpty && (
        <Typography
          variant="caption"
          role="alert"
          className="!font-body !text-yellow-400 !mt-1 !text-xs"
        >
          {t("workspaces:common:form:systemMessageOverride.emptyWarning")}
        </Typography>
      )}
      <Typography
        variant="caption"
        className="!font-body !text-gray-300 !mt-2 !text-xs"
      >
        {systemMessage?.length || 0} characters
      </Typography>
      <FormLabel className="flex gap-2 place-items-center relative !font-body !text-md !w-full !text-white-100 mt-10 mb-4 group !cursor-pointer">
        {labelTone}
        <Tooltip
          width="w-56"
          text="workspaces:common:tooltips:toneOfVoice"
          position="left-[6.4rem] bottom-7"
        />
        <IoHelpCircleSharp size={22} />
      </FormLabel>
      {toneControlsDisabled && (
        <Typography
          variant="caption"
          className="!font-body !text-gray-300 !-mt-2 !mb-2 !text-xs"
        >
          {t("workspaces:common:form:systemMessageOverride.toneLengthDisabled")}
        </Typography>
      )}
      <div className={toneControlsDisabled ? "opacity-50" : ""}>
        <ToggleButtonGroup
          color="primary"
          value={interactionStyle}
          exclusive
          onChange={(e, value) => handleInteractionStyleChanged(value)}
          aria-label="Platform"
          disabled={toneControlsDisabled}
          className="flex !w-full justify-between gap-3 mb-8 flex-wrap sm:flex-nowrap"
        >
          <ToggleButton
            data-testid="interactionStyle-default"
            value="Default"
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
            {t(
              "components:chatHistoryComponent.popupPersonaConfig.preferedTone.default"
            )}
          </ToggleButton>
          <ToggleButton
            value="Casual"
            data-testid="interactionStyle-casual"
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
            {t(
              "components:chatHistoryComponent.popupPersonaConfig.preferedTone.casual"
            )}
          </ToggleButton>

          <ToggleButton
            value="Confident"
            data-testid="interactionStyle-confident"
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
            {t(
              "components:chatHistoryComponent.popupPersonaConfig.preferedTone.confident"
            )}
          </ToggleButton>
          <ToggleButton
            value="Enthusiastic"
            data-testid="interactionStyle-enthusiastic"
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
            {t(
              "components:chatHistoryComponent.popupPersonaConfig.preferedTone.enthusiastic"
            )}
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <FormLabel className="flex !font-body !text-md !w-full !text-white-100 mt-6">
        {labelLength}
      </FormLabel>
      <div
        className={`p-2 flex w-[90%] sm:w-[60%] !font-body !text-md !font-semobold ${
          toneControlsDisabled ? "opacity-50" : ""
        }`}
      >
        <Slider
          data-testid="detail-level-slider"
          aria-labelledby="detail-level-slider"
          value={getDetailLevelValue(detailLevel)} // This now correctly returns a number
          onChange={(_, value) => handleDetailLevelChanged(value)}
          disabled={toneControlsDisabled}
          step={1}
          marks={Object.entries(detailLevels).map(([index, item]) => ({
            value: parseInt(index, 10),
            label: item.label,
          }))}
          min={0}
          max={2}
          sx={{
            "& .MuiSlider-markLabel": {
              color: "#89898E", // Default grey color for all labels
              fontSize: "15.4px",
              marginLeft: "14px",
            },
            "& .MuiSlider-markLabelActive": {
              color: "#EDEDED", // White color when the label is active
            },
          }}
          className="!text-white-100 !ml-2"
          valueLabelFormat={getDetailLevelLabel}
          valueLabelDisplay="auto"
        />
      </div>
    </div>
  );
};

export default PersonaConfigurator;
