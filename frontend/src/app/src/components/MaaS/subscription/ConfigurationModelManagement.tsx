import React from "react";
import { useTranslation } from "react-i18next";
import ToggleComponent from "../../app-toggle-button";
import type { Model, ModelKey, GuardrailKey } from "../../../types/maasTypes";
import { TbChevronRight, TbSettings } from "react-icons/tb";
import getModelDisplayName from "../../../utils/maas/modelDisplay";

interface ConfigurationModelManagementProps {
  availableModels: Model[];
  modelToggles: Partial<Record<string, boolean>>;
  modelsValid: boolean;
  modelsTouched: boolean;
  onToggleModel: (modelKey: ModelKey) => void;
  selectedModelKey: ModelKey | null;
  onSelectedModelChange: (modelKey: ModelKey | null) => void;
  guardrailToggles: Partial<Record<GuardrailKey, boolean>>;
  onToggleGuardrail: (guardrailKey: GuardrailKey) => void;
}

const ConfigurationModelManagement: React.FC<
  ConfigurationModelManagementProps
> = ({
  availableModels,
  modelToggles,
  modelsValid,
  modelsTouched,
  onToggleModel,
  selectedModelKey,
  onSelectedModelChange,
  guardrailToggles,
  onToggleGuardrail,
}) => {
  const { t } = useTranslation("subscriptions");

  return (
    <div className="w-full grid grid-cols-1 gap-6">
      {availableModels.map((model) => {
        const modelKey = model.key as ModelKey;
        const isModelActive = !!modelToggles[modelKey];
        const guardrails = model.guardrails ?? [];
        const isGuardrailsOpen = selectedModelKey === modelKey;

        return (
          <div
            key={model.key}
            className="flex flex-col bg-gray-700 border-2 border-gray-500 grid w-full rounded-2xl"
          >
            <div
              className={`flex w-full items-center justify-between rounded-t-2xl p-6 pr-8 gap-4 ${
                isGuardrailsOpen
                  ? "border-b-2 border-gray-500 bg-gray-650/50"
                  : ""
              }`}
            >
              <button
                title="Show Guardrails"
                className={
                  isGuardrailsOpen
                    ? "rotate-90 transition-transform"
                    : "transition-transform"
                }
                onClick={() =>
                  onSelectedModelChange(isGuardrailsOpen ? null : modelKey)
                }
              >
                <TbChevronRight size={24} />
              </button>

              <div className="flex w-full items-start justify-between">
                <ToggleComponent
                  dataTestId={`configure-subscription-toggle-${model.key}`}
                  text={getModelDisplayName(model)}
                  description={
                    model.description ||
                    "No description is available for this model"
                  }
                  isToggled={isModelActive}
                  onToggle={() => onToggleModel(modelKey)}
                  disabled={false}
                  alignRight
                  size="small"
                  provider={model.provider}
                  status="Active"
                  showStatus
                />
              </div>
            </div>

            {isGuardrailsOpen && guardrails && (
              <div className="w-full flex flex-col px-6 py-4 gap-4 mb-4">
                <div className="flex gap-4 items-center py-3">
                  <TbSettings size={24} strokeWidth={1.4} />
                  <p className="text-lg">Guardrail Configuration</p>
                </div>

                {guardrails.map((g) => {
                  const key = g.key as GuardrailKey;
                  // For the selected model, guardrailToggles has local overrides; otherwise fallback to model.guardrails
                  const isOn = guardrailToggles[key] ?? g.enforced;

                  const title = t(`common.guardrails.${key}.title`, key);
                  const description = t(
                    `common.guardrails.${key}.description`,
                    "",
                  ) as string;

                  return (
                    <div
                      key={`${g.key}-${key}`}
                      className={`${
                        isOn ? "bg-gray-650" : "bg-gray-700"
                      } p-6 border-2 border-gray-500 rounded-2xl flex items-center justify-between`}
                    >
                      <div
                        title={
                          !isModelActive
                            ? t(
                                "subscription-configuration.tooltips.activateModelFirst",
                                {
                                  defaultValue:
                                    "Model should be activated first",
                                },
                              )
                            : undefined
                        }
                        className={
                          !isModelActive
                            ? "cursor-not-allowed w-full"
                            : "w-full"
                        }
                      >
                        <ToggleComponent
                          dataTestId={`configure-subscription-toggle-${key}`}
                          text={title || key}
                          description={
                            description ||
                            "No description is available for this guardrail"
                          }
                          isToggled={isOn}
                          onToggle={() => onToggleGuardrail(key)}
                          disabled={!isModelActive}
                          alignRight
                          size="small"
                          status="Enabled"
                          showStatus
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {availableModels.length === 0 && (
        <p className="text-md text-gray-300">
          {t("common.emptyStatesDescriptions.noModels")}
        </p>
      )}

      {!modelsValid && modelsTouched && (
        <p
          className="text-sm text-red-200 mt-1"
          role="alert"
          aria-live="polite"
          data-testid="configure-subscription-models-error"
        >
          {t("subscription-configuration.validationMessages.noModelSelected")}
        </p>
      )}
    </div>
  );
};

export default ConfigurationModelManagement;
