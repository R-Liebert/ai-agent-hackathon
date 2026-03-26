import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ModalContainer from "../../Global/ModalContainer";
import FormLabel from "../../Global/FormLabel";
import FormTextarea from "../../Global/FormTextarea";
import DialogActionButtons from "../../Global/DialogActionButtons";

interface SubscriptionActionDialogProps {
  open: boolean;
  onClose: () => void;
  subscriptionName: string;
  actionType: "activate" | "deactivate";
  onConfirmWithReason: (params: {
    justification: string;
  }) => Promise<void> | void;
}

export default function SubscriptionActionDialog({
  open,
  onClose,
  subscriptionName,
  actionType,
  onConfirmWithReason,
}: SubscriptionActionDialogProps) {
  const { t } = useTranslation("subscriptions");
  const isDeactivation = actionType === "deactivate";

  // Local state for justification (text-sm by default)
  const [justification, setJustification] = useState("");
  const [touched, setTouched] = useState(false);
  const maxLen = 200;

  useEffect(() => {
    if (open) {
      setJustification("");
      setTouched(false);
    }
  }, [open]);

  const description = isDeactivation
    ? t("subscriptionDetails.deactivateSubscriptionDialog.description", {
        subscriptionName,
      })
    : t("subscriptionDetails.activateSubscriptionDialog.description", {
        subscriptionName,
      });

  const rawBulletPoints = isDeactivation
    ? t("subscriptionDetails.deactivateSubscriptionDialog.bulletPoints", {
        returnObjects: true,
      })
    : t("subscriptionDetails.activateSubscriptionDialog.bulletPoints", {
        returnObjects: true,
      });

  // Normalize bullet points to string[]
  const bulletPoints: string[] = Array.isArray(rawBulletPoints)
    ? rawBulletPoints.map(String)
    : typeof rawBulletPoints === "string"
      ? [rawBulletPoints]
      : rawBulletPoints && typeof rawBulletPoints === "object"
        ? Object.values(rawBulletPoints as Record<string, unknown>).map(String)
        : [];

  const confirmMessage = isDeactivation
    ? t("subscriptionDetails.deactivateSubscriptionDialog.confirmationMessage")
    : undefined;

  const trimmed = justification.trim();
  const tooLong = justification.length > maxLen;
  const empty = trimmed.length === 0;

  // Always require justification for activate/deactivate
  const formError =
    touched && empty
      ? t(
          "subscriptionDetails.deactivateSubscriptionDialog.justification.required",
          "Please provide a justification.",
        )
      : touched && tooLong
        ? t(
            "subscriptionDetails.deactivateSubscriptionDialog.justification.maxLength",
            "Too long.",
          )
        : undefined;

  const disableConfirm = empty || tooLong;

  const handleConfirm = async () => {
    if (disableConfirm) return;
    try {
      await onConfirmWithReason({ justification: trimmed });
      onClose();
    } catch {
      // Dialog stays open so the user can retry.
      // Error notification is handled by the caller.
    }
  };

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      title={
        isDeactivation
          ? t("subscriptionDetails.deactivateSubscriptionDialog.title")
          : t("subscriptionDetails.activateSubscriptionDialog.title")
      }
      width="max-w-lg"
    >
      <div className="flex flex-col gap-4 mt-3">
        <p className="text-sm text-white-100">{description}</p>

        {Array.isArray(bulletPoints) && bulletPoints.length > 0 && (
          <ul className="list-disc pl-6 text-sm text-white-100">
            {bulletPoints.map((bp, i) => (
              <li key={i} className="mb-1">
                {bp}
              </li>
            ))}
          </ul>
        )}

        {confirmMessage && (
          <div className="text-sm text-gray-200">{confirmMessage}</div>
        )}

        {/* Justification (FormLabel + FormTextarea, text-sm) */}
        <div className="flex flex-col">
          <FormLabel
            label={
              isDeactivation
                ? t(
                    "subscriptionDetails.deactivateSubscriptionDialog.justification.label",
                    "Reason for deactivation",
                  )
                : t(
                    "subscriptionDetails.activateSubscriptionDialog.justification.label",
                    "Reason for activation",
                  )
            }
            size="sm"
          />
          <FormTextarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={
              isDeactivation
                ? t(
                    "subscriptionDetails.deactivateSubscriptionDialog.justification.placeholder",
                    "Provide a brief justification",
                  )
                : t(
                    "subscriptionDetails.activateSubscriptionDialog.justification.placeholder",
                    "Provide a brief justification",
                  )
            }
            maxLength={1500}
            size="sm"
            formTouched={touched}
            formError={formError}
          />
          <div className="text-xs text-gray-300 font-body mt-1">
            {justification.length}/{maxLen}
          </div>
        </div>

        <DialogActionButtons
          cancelText={t(
            "subscriptionDetails.deactivateSubscriptionDialog.buttons.cancel",
          )}
          confirmText={
            isDeactivation
              ? t(
                  "subscriptionDetails.deactivateSubscriptionDialog.buttons.confirm",
                )
              : t(
                  "subscriptionDetails.activateSubscriptionDialog.buttons.confirm",
                )
          }
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmDisabled={disableConfirm}
        />
      </div>
    </ModalContainer>
  );
}
