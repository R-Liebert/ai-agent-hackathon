import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ModalContainer from "../../Global/ModalContainer";
import type { AdminAction } from "../../../types/maasTypes";
import { motion } from "framer-motion";
import dayjs, { Dayjs } from "dayjs";
import ExpiryDateUpdateSection, {
  ExpiryMode,
} from "../global/ExpiryDateUpdateSection";
import FormLabel from "../../Global/FormLabel";
import FormTextarea from "../../Global/FormTextarea";
import DialogActionButtons from "../../Global/DialogActionButtons";

interface AdminConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  actionType: AdminAction;
  subscriptionName: string;
  subscriptionConsumer?: string;

  onConfirm: (params: {
    justification: string;
    expiryTs?: number;
    clear?: boolean;
  }) => Promise<void> | void;
  minJustificationLength?: number;
}

export default function AdminConfirmationDialog({
  open,
  onClose,
  actionType,
  subscriptionName,
  subscriptionConsumer,
  onConfirm,
  minJustificationLength = 10,
}: AdminConfirmationDialogProps) {
  const { t } = useTranslation("subscriptions");
  const [justification, setJustification] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expiryMode, setExpiryMode] = useState<ExpiryMode>("setDate");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const base = "adminDashboard.adminActionModal";

  // Title mapping
  const titleKeyMap: Record<AdminAction, string> = {
    approve: `${base}.titles.approve`,
    approveAgain: `${base}.titles.approveAgain`,
    reject: `${base}.titles.reject`,
    deactivate: `${base}.titles.deactivate`,
    delete: `${base}.titles.delete`,
    expiryDateUpdate: `${base}.titles.expiryDateUpdate`,
    reactivate: `${base}.titles.reactivate`,
  };

  // Info mapping for actions
  const infoKeyMap: Record<
    AdminAction,
    string | { intro: string; points?: string; summary?: string }
  > = {
    approve: `${base}.approveInfo`,
    approveAgain: `${base}.approveAgainInfo`,
    reject: `${base}.rejectInfo`,
    deactivate: `${base}.deactivateInfo`,
    delete: {
      intro: `${base}.deleteInfo.intro`,
      points: `${base}.deleteInfo.points`, // This is a string key, not a string[]
      summary: `${base}.deleteInfo.summary`,
    },
    expiryDateUpdate: `${base}.expiryInfo`,
    reactivate: `${base}.reactivateInfo`,
  };

  // Dynamically fetch title
  const title = useMemo(() => t(titleKeyMap[actionType]), [t, actionType]);

  // Dynamically fetch info text (handles both string and object cases)
  const infoText = useMemo(() => {
    const info = infoKeyMap[actionType];

    if (typeof info === "string") {
      // For simple actions like approve, reject, etc.
      return t(info, { subscriptionName, subscriptionConsumer });
    }

    if (typeof info === "object") {
      // For delete action, render intro, points, and summary
      const intro = t(info.intro, { subscriptionName, subscriptionConsumer });
      const points = info.points
        ? (t(info.points, { returnObjects: true }) as string[])
        : [];
      const summary = info.summary ? t(info.summary) : null;

      return (
        <>
          <p>{intro}</p>
          {points.length > 0 && (
            <ul className="list-disc ml-6 mt-2">
              {points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          )}
          {summary && <p className="mt-4 font-semibold">{summary}</p>}
        </>
      );
    }

    return null;
  }, [t, actionType, subscriptionName, subscriptionConsumer]);

  // Placeholders and labels
  const justifyPlaceholder = useMemo(
    () => t(`${base}.justifyPlaceholder`),
    [t],
  );
  const cancelLabel = useMemo(() => t(`${base}.buttons.cancel`), [t]);
  const confirmLabel = useMemo(() => t(`${base}.buttons.confirm`), [t]);

  // Expiry tabs for expiry date update
  const expiryTabs = useMemo<ReadonlyArray<{ key: ExpiryMode; label: string }>>(
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

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setError(null);
      setJustification("");
      setSelectedDate(null);
      setExpiryMode("setDate");
      setTouched(false);
    }
  }, [open]);

  // Validation
  const justificationOk = justification.trim().length >= minJustificationLength;
  const expiryValidForConfirm =
    actionType !== "expiryDateUpdate"
      ? true
      : expiryMode === "unlimited"
        ? true
        : !!selectedDate;

  const canConfirm = !submitting;

  // Handle modal close
  const handleClose = () => {
    if (submitting) return;
    setError(null);
    setJustification("");
    setSelectedDate(null);
    setExpiryMode("setDate");
    setTouched(false);
    onClose();
  };

  // Handle confirm action
  const handleConfirm = async () => {
    const value = justification.trim();
    if (value.length < minJustificationLength) {
      setError(t("common.validation.justification"));
      setTouched(true);
      return;
    }

    const payload: {
      justification: string;
      expiryTs?: number;
      clear?: boolean;
    } = { justification: value };

    if (actionType === "expiryDateUpdate") {
      if (expiryMode === "unlimited") {
        payload.clear = true;
      } else {
        if (!selectedDate) {
          setError(
            t("common.validation.required", {
              defaultValue: "This field is required.",
            }),
          );
          setTouched(true);
          return;
        }
        const endTs = selectedDate
          .hour(23)
          .minute(59)
          .second(59)
          .millisecond(999)
          .valueOf();
        if (endTs <= Date.now()) {
          setError(
            t("common.validation.futureDate", {
              defaultValue: "Please select a future date.",
            }),
          );
          setTouched(true);
          return;
        }
        payload.expiryTs = endTs;
      }
    }

    try {
      setSubmitting(true);
      await onConfirm(payload);
      setSubmitting(false);
      setJustification("");
      setSelectedDate(null);
      setExpiryMode("setDate");
      setError(null);
      setTouched(false);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      onClose={handleClose}
      title={title}
      width="max-w-lg"
    >
      <motion.div
        key={expiryMode}
        initial={{ height: "auto" }}
        animate={{ height: "auto" }}
        exit={{ height: "auto" }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="flex flex-col gap-4 mt-3"
      >
        <div className="text-sm text-white-100 whitespace-pre-wrap">
          {infoText}
        </div>

        {/* Expiry Date Update */}
        {actionType === "expiryDateUpdate" && (
          <ExpiryDateUpdateSection
            expiryMode={expiryMode}
            onModeChange={(mode) => {
              setExpiryMode(mode);
              if (mode === "unlimited") setSelectedDate(null);
              if (error) setError(null);
            }}
            selectedDate={selectedDate}
            onDateChange={(date) => {
              setSelectedDate(date);
              if (error) setError(null);
            }}
            onClearError={() => error && setError(null)}
          />
        )}

        {/* Justification */}
        <div className="flex flex-col">
          <FormLabel label={justifyPlaceholder} size="sm" />
          <FormTextarea
            id="admin-justification"
            name="admin-justification"
            value={justification}
            onChange={(e) => {
              setJustification(e.target.value);
              if (error) setError(null);
            }}
            onBlur={() => setTouched(true)}
            placeholder={justifyPlaceholder}
            maxLength={1500}
            size="sm"
            formTouched={touched}
            formError={error || undefined}
          />
          <div className="text-xs text-gray-300 font-body mt-1">
            {justification.length}/1500
          </div>
        </div>

        {/* Actions */}
        <DialogActionButtons
          cancelText={cancelLabel}
          confirmText={confirmLabel}
          onCancel={handleClose}
          onConfirm={handleConfirm}
          confirmDisabled={!canConfirm}
        />
      </motion.div>
    </ModalContainer>
  );
}
