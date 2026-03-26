import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ModalContainer from "../../Global/ModalContainer";
import FormLabel from "../../Global/FormLabel";
import FormTextarea from "../../Global/FormTextarea";
import DialogActionButtons from "../../Global/DialogActionButtons";
import FormSelect from "../../Global/FormSelect";
import type { SelectOption } from "../../Global/SelectBase";

export interface ModelOption {
  key: string;
  name: string;
}

export interface SubscriptionOption {
  id: string;
  name: string;
}

type Props = {
  open: boolean;
  onClose: () => void;

  // Models
  availableModels?: ModelOption[]; // optional when preselectedModelKey is provided
  preselectedModelKey?: string; // locks to a single model when provided
  maxSelectable?: number; // default 4

  // Subscription
  subscriptionOptions?: SubscriptionOption[]; // show select only if no initialSubscriptionId
  initialSubscriptionId?: string; // lock the subscription if provided

  // Justification (ALWAYS required)
  justificationMaxLen?: number; // default 200
  justificationLabelOverride?: string;
  justificationPlaceholderOverride?: string;

  // Submit shape is unified
  onSubmit: (params: {
    subscriptionId: string;
    selectedModelKeys: string[];
    justification: string;
  }) => Promise<void> | void;

  // Optional: override title
  titleOverride?: string;
};

export default function RequestModelAccessDialog({
  open,
  onClose,
  availableModels,
  preselectedModelKey,
  maxSelectable = 4,
  subscriptionOptions,
  initialSubscriptionId,
  justificationMaxLen = 200,
  justificationLabelOverride,
  justificationPlaceholderOverride,
  onSubmit,
  titleOverride,
}: Props) {
  const { t, i18n } = useTranslation("subscriptions");

  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>(
    initialSubscriptionId ?? "",
  );
  const [subscriptionTouched, setSubscriptionTouched] = useState(false);

  const [selectedModelKeys, setSelectedModelKeys] = useState<string[]>(
    preselectedModelKey ? [preselectedModelKey] : [],
  );
  const [justification, setJustification] = useState<string>("");

  // Reset dialog state on open
  useEffect(() => {
    if (!open) return;
    setSubscriptionTouched(false);
    setJustification("");
    setSelectedSubscriptionId(initialSubscriptionId ?? "");
    setSelectedModelKeys(preselectedModelKey ? [preselectedModelKey] : []);
  }, [open, initialSubscriptionId, preselectedModelKey]);

  const sortedModels = useMemo(
    () =>
      (availableModels ?? [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, i18n.language)),
    [availableModels, i18n.language],
  );

  const sortedSubs = useMemo(
    () =>
      (subscriptionOptions ?? [])
        .slice()
        .sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", i18n.language),
        ),
    [subscriptionOptions, i18n.language],
  );

  const subSelectOptions: SelectOption[] = useMemo(
    () =>
      sortedSubs.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` })),
    [sortedSubs],
  );

  const subscriptionLocked = !!initialSubscriptionId;
  const modelLocked = !!preselectedModelKey;

  const remaining = (maxSelectable ?? 0) - selectedModelKeys.length;

  const mustHaveModels =
    modelLocked ||
    (Array.isArray(availableModels) && availableModels.length > 0);

  const justificationOk =
    justification.trim().length > 0 &&
    justification.length <= justificationMaxLen;

  const canSubmit =
    !!selectedSubscriptionId &&
    selectedModelKeys.length > 0 &&
    justificationOk &&
    mustHaveModels;

  const dynamicTitle =
    titleOverride ??
    (modelLocked
      ? t("modelDetails.requestAccessDialog.title", "Request Access to Model")
      : t(
          "subscriptionDetails.requestAccessToModelsDialog.title",
          "Request Access to Models",
        ));

  const onChangeSubscription = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubscriptionId(e.target.value);
  };
  const onBlurSubscription = () => setSubscriptionTouched(true);

  const subscriptionError =
    !subscriptionLocked && subscriptionTouched && !selectedSubscriptionId
      ? t(
          "modelDetails.requestAccessDialog.validation.subscriptionRequired",
          "Please select a subscription.",
        )
      : undefined;

  const handleToggleModel = (key: string) => {
    if (modelLocked) return;
    setSelectedModelKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= (maxSelectable ?? 0)) return prev;
      return [...prev, key];
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      subscriptionId: selectedSubscriptionId,
      selectedModelKeys,
      justification: justification.trim(),
    });
    onClose();
  };

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      title={dynamicTitle}
      width="max-w-lg"
    >
      <div className="flex flex-col gap-2 !font-body">
        {/* Subscription selection (only if not locked) */}
        {!subscriptionLocked && (
          <div className="flex flex-col">
            <FormLabel
              label={t(
                "modelDetails.requestAccessDialog.selectSubscription.label",
                "Select Subscription",
              )}
              size="sm"
            />
            {subSelectOptions.length > 0 ? (
              <FormSelect
                id="subscriptionId"
                name="subscriptionId"
                value={selectedSubscriptionId}
                options={subSelectOptions}
                placeholder={t(
                  "modelDetails.requestAccessDialog.selectSubscription.placeholder",
                  "Choose subscription",
                )}
                ariaLabel={t(
                  "modelDetails.requestAccessDialog.selectSubscription.aria",
                  "Choose subscription",
                )}
                isSubscriptionElement={false}
                onChange={onChangeSubscription}
                onBlur={onBlurSubscription}
                formTouched={subscriptionTouched}
                formError={subscriptionError}
                density="cozy"
              />
            ) : (
              <div className="flex items-center justify-between border-2 border-gray-500 rounded-xl p-3 bg-gray-700">
                <p className="text-sm text-gray-300 font-body">
                  {t(
                    "modelDetails.requestAccessDialog.selectSubscription.empty",
                    "You have no active subscriptions.",
                  )}
                </p>
                <span className="text-xs text-gray-300 font-body">
                  {t(
                    "modelDetails.requestAccessDialog.selectSubscription.hint",
                    "Create a subscription to request access.",
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Model selection */}
        <div className="flex flex-col gap-2">
          {modelLocked ? null : (availableModels?.length ?? 0) > 0 ? (
            <div className="flex flex-col gap-2 mb-2">
              <FormLabel
                label={t(
                  "subscriptionDetails.requestAccessToModelsDialog.chooseModelsTitle",
                )}
                size="sm"
              />
              <div className="flex flex-wrap gap-2">
                {sortedModels.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => handleToggleModel(m.key)}
                    className={`px-4 py-2 font-body rounded-lg border text-sm text-white-100 ${
                      selectedModelKeys.includes(m.key)
                        ? "bg-gray-600 border-transparent"
                        : "bg-gray-900/50 border-gray-600"
                    } hover:bg-gray-600`}
                    disabled={
                      !selectedModelKeys.includes(m.key) && remaining === 0
                    }
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 font-body rounded-lg border text-sm text-white-100 bg-gray-900/50 border-gray-600">
              {t(
                "subscriptionDetails.requestAccessToModelsDialog.noModels",
                "No models available to request.",
              )}
            </div>
          )}
        </div>

        {/* Justification (ALWAYS visible and required) */}
        <div className="flex flex-col">
          <FormLabel
            label={
              justificationLabelOverride ??
              t(
                "subscriptionDetails.requestAccessToModelsDialog.justifyAccessNeed.label",
                "Describe why you need access",
              )
            }
            size="sm"
          />
          <FormTextarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder={
              justificationPlaceholderOverride ??
              t(
                "subscriptionDetails.requestAccessToModelsDialog.justifyAccessNeed.placeholder",
                "Provide a short justification",
              )
            }
            maxLength={justificationMaxLen}
            size="sm"
          />
          <div className="text-xs text-gray-300">
            {justification.length}/{justificationMaxLen}
          </div>
        </div>

        {/* Actions */}
        <DialogActionButtons
          cancelText={t("common.cancel", "Cancel")}
          confirmText={t("common.requestAccess", "Request access")}
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmDisabled={!canSubmit}
        />
      </div>
    </ModalContainer>
  );
}
