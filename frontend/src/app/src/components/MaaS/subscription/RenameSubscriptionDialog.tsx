import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ModalContainer from "../../Global/ModalContainer";

interface RenameSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  currentName: string;
  onSubmit: (newName: string) => Promise<void> | void;
}

export default function RenameSubscriptionDialog({
  open,
  onClose,
  currentName,
  onSubmit,
}: RenameSubscriptionDialogProps) {
  const { t } = useTranslation("subscriptions");
  const [name, setName] = useState(currentName ?? "");
  const [touched, setTouched] = useState(false);
  const min = 3;
  const max = 50;

  useEffect(() => {
    if (open) {
      setName((currentName ?? "").trim());
      setTouched(false);
    }
  }, [open, currentName]);

  const trimmed = useMemo(() => name.trim(), [name]);
  const isUnchanged = trimmed === (currentName ?? "").trim();
  const tooShort = trimmed.length < min;
  const tooLong = trimmed.length > max;

  const errorMsg =
    touched && tooShort
      ? t("subscriptionDetails.renameSubscriptionDialog.validation.minLength", {
          minLength: min,
        })
      : touched && tooLong
        ? t(
            "subscriptionDetails.renameSubscriptionDialog.validation.maxLength",
            {
              maxLength: max,
            },
          )
        : "";

  const disableSave = tooShort || tooLong || isUnchanged;

  const handleSubmit = async () => {
    if (disableSave) return;
    await onSubmit(trimmed);
    onClose();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      title={t("subscriptionDetails.renameSubscriptionDialog.title")}
      width="max-w-lg"
    >
      <div className="flex flex-col gap-4 mt-3 !font-body">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white-200">
            {t("subscriptionDetails.renameSubscriptionDialog.label")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("subscriptionDetails.rename.placeholder")}
            className="w-full text-sm rounded-xl bg-gray-900/60 text-white-100 placeholder:text-white-100/30 font-body p-3 border border-gray-650"
          />
          {errorMsg ? (
            <div className="text-xs text-red-400">{errorMsg}</div>
          ) : (
            <div className="text-xs text-gray-300">
              {trimmed.length}/{max}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mb-2">
          <button
            type="button"
            className="flex w-[48%] sm:w-auto place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite focus:bg-gray-650 focus:text-white-100 font-body"
            onClick={onClose}
          >
            {t("subscriptionDetails.renameSubscriptionDialog.buttons.cancel")}
          </button>

          <button
            type="button"
            className={`flex w-full sm:w-auto mt-4 sm:mt-0 place-content-center rounded-full px-3 py-2 text-[14px] font-body font-semibold transition-color transition-background duration-300 ease-in-out place-items-center place-content-center
              bg-white-100 text-gray-600 hover:bg-red-700 hover:text-white-100 ${
                disableSave ? "opacity-20 pointer-events-none" : ""
              }`}
            onClick={handleSubmit}
            disabled={disableSave}
          >
            {t("subscriptionDetails.renameSubscriptionDialog.buttons.save")}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
