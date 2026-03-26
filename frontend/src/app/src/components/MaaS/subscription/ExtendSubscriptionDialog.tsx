import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ModalContainer from "../../Global/ModalContainer";
import FormLabel from "../../Global/FormLabel";
import FormTextarea from "../../Global/FormTextarea";
import DialogActionButtons from "../../Global/DialogActionButtons";
import ExpiryDateUpdateSection, {
  ExpiryMode,
} from "../global/ExpiryDateUpdateSection";
import dayjs, { Dayjs } from "dayjs";
import { notificationsService } from "../../../services/notificationsService";

interface ExtendSubscriptionRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    expiryTs: number;
    justification: string;
  }) => Promise<void> | void;
}

export default function ExtendSubscriptionRequestDialog({
  open,
  onClose,
  onSubmit,
}: ExtendSubscriptionRequestDialogProps) {
  const { t } = useTranslation("subscriptions");

  const [expiryMode, setExpiryMode] = useState<ExpiryMode>("setDate");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [justification, setJustification] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const maxLen = 200;
  const [dateTouched, setDateTouched] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setExpiryMode("setDate");
      setSelectedDate(null);
      setJustification("");
      setTouched(false);
      setDateTouched(false);
      setDateError(null);
      setSubmitting(false);
    }
  }, [open]);

  const trimmed = justification.trim();
  const tooLong = justification.length > maxLen;
  const empty = trimmed.length === 0;

  const handleConfirm = async () => {
    if (submitting) return;
    const trimmed = justification.trim();
    let hasError = false;
    if (trimmed.length === 0 || justification.length > maxLen) {
      setTouched(true);
      hasError = true;
    }
    if (!selectedDate) {
      setDateTouched(true);
      setDateError(
        t("common.validation.required", {
          defaultValue: "Please select a date.",
        }),
      );
      hasError = true;
    } else if (selectedDate.valueOf() <= Date.now()) {
      setDateTouched(true);
      setDateError(
        t("common.validation.futureDate", {
          defaultValue: "Please select a future date.",
        }),
      );
      hasError = true;
    }
    if (hasError) {
      return;
    }
    const expiryTs = selectedDate!
      .hour(23)
      .minute(59)
      .second(59)
      .millisecond(999)
      .valueOf();
    try {
      setSubmitting(true);
      await onSubmit({ expiryTs, justification: trimmed });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      title={t("subscriptionDetails.extendSubscriptionDialog.title")}
      width="max-w-lg"
    >
      <div className="flex flex-col">
        <p className="text-sm text-white-100 whitespace-pre-wrap">
          {t("subscriptionDetails.extendSubscriptionDialog.description")}
        </p>

        {/* Date only (option tabs hidden) */}
        <ExpiryDateUpdateSection
          expiryMode="setDate"
          onModeChange={() => {}}
          selectedDate={selectedDate}
          onDateChange={(d) => setSelectedDate(d)}
          showTabs={false}
          allowUnlimited={false}
        />

        <div className="flex flex-col">
          <FormLabel
            label={t(
              "subscriptionDetails.extendSubscriptionDialog.justificationLabel",
            )}
            size="sm"
          />
          <FormTextarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={t(
              "subscriptionDetails.extendSubscriptionDialog.justificationPlaceholder",
            )}
            maxLength={1500}
            size="sm"
            formTouched={touched}
            formError={
              touched && empty
                ? t("common.validation.justification")
                : touched && tooLong
                  ? t("common.validation.maxLength")
                  : undefined
            }
          />
          <div className="text-xs text-gray-300 font-body mt-1">
            {justification.length}/{maxLen}
          </div>
        </div>

        <DialogActionButtons
          cancelText={t(
            "subscriptionDetails.extendSubscriptionDialog.buttons.cancel",
          )}
          confirmText={t(
            "subscriptionDetails.extendSubscriptionDialog.buttons.confirm",
          )}
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmDisabled={!submitting}
        />
      </div>
    </ModalContainer>
  );
}
