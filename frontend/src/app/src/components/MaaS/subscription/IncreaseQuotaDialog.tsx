import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import ModalContainer from "../../Global/ModalContainer";
import FormLabel from "../../Global/FormLabel";
import FormTextarea from "../../Global/FormTextarea";
import DialogActionButtons from "../../Global/DialogActionButtons";

interface IncreaseQuotaDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    newTokenLimit: number;
    newRateLimit: number;
    newRequestLimit: number;
    justification: string;
  }) => Promise<void> | void;
  currentGrantedTokens: number;
  currentRateLimit?: number;
  currentRequestLimit?: number;
}

export default function IncreaseQuotaDialog({
  open,
  onClose,
  onSubmit,
  currentGrantedTokens,
  currentRateLimit = 0,
  currentRequestLimit = 0,
}: IncreaseQuotaDialogProps) {
  const { t } = useTranslation("subscriptions");

  // Constants for step sizes
  const TOKEN_STEP = 500_000;
  const RATE_STEP = 1_000;
  const REQUEST_STEP = 10_000;
  const justificationMaxLen = 200;

  // Initialize fields with current state (can be the same at dialog open)
  const [newTokenLimit, setNewTokenLimit] =
    useState<number>(currentGrantedTokens);
  const [newRateLimit, setNewRateLimit] = useState<number>(currentRateLimit);
  const [newRequestLimit, setNewRequestLimit] =
    useState<number>(currentRequestLimit);
  const [justification, setJustification] = useState<string>("");

  useEffect(() => {
    if (open) {
      // Reset on open to latest values
      setNewTokenLimit(currentGrantedTokens);
      setNewRateLimit(currentRateLimit);
      setNewRequestLimit(currentRequestLimit);
      setJustification("");
    }
  }, [open, currentGrantedTokens, currentRateLimit, currentRequestLimit]);

  // Helpers
  const clampNonNegative = (n: number) => Math.max(0, Math.floor(n));
  const formatNumber = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);

  // Derived deltas and percentages
  const tokenDelta = Math.max(0, newTokenLimit - currentGrantedTokens);
  const tokenPct =
    currentGrantedTokens > 0
      ? (tokenDelta / currentGrantedTokens) * 100
      : undefined;

  const rateDelta = Math.max(0, newRateLimit - currentRateLimit);
  const ratePct =
    currentRateLimit > 0 ? (rateDelta / currentRateLimit) * 100 : undefined;

  const requestDelta = Math.max(0, newRequestLimit - currentRequestLimit);
  const requestPct =
    currentRequestLimit > 0
      ? (requestDelta / currentRequestLimit) * 100
      : undefined;

  // Button handlers
  const decToken = () =>
    setNewTokenLimit((v) => clampNonNegative(v - TOKEN_STEP));
  const incToken = () =>
    setNewTokenLimit((v) => clampNonNegative(v + TOKEN_STEP));

  const decRate = () => setNewRateLimit((v) => clampNonNegative(v - RATE_STEP));
  const incRate = () => setNewRateLimit((v) => clampNonNegative(v + RATE_STEP));

  const decRequest = () =>
    setNewRequestLimit((v) => clampNonNegative(v - REQUEST_STEP));
  const incRequest = () =>
    setNewRequestLimit((v) => clampNonNegative(v + REQUEST_STEP));

  const handleTokenInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = clampNonNegative(Number(e.target.value || 0));
    setNewTokenLimit(next);
  };

  const handleRateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = clampNonNegative(Number(e.target.value || 0));
    setNewRateLimit(next);
  };

  const handleRequestInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = clampNonNegative(Number(e.target.value || 0));
    setNewRequestLimit(next);
  };

  const disableSubmit =
    justification.trim().length === 0 ||
    justification.length > justificationMaxLen ||
    newTokenLimit <= 0; // require a positive token limit

  const preventArrowAndWheel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  };

  const handleSubmit = async () => {
    if (disableSubmit) return;
    await onSubmit({
      newTokenLimit,
      newRateLimit,
      justification: justification.trim(),
      newRequestLimit,
    });
    onClose();
  };

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      title={t("subscriptionDetails.requestQuotaIncreaseDialog.title")}
      width="max-w-lg"
    >
      <div className="flex flex-col gap-6 mt-3">
        {/* New Token Limit */}
        <div className="flex flex-col">
          <FormLabel
            label={t(
              "subscriptionDetails.requestQuotaIncreaseDialog.buttons.newTokenLimit",
            )}
            size="sm"
          />
          <div className="flex items-center w-full bg-gray-900/60 rounded-xl py-[12px] px-4">
            <button
              type="button"
              className="bg-transparent outline-none border-none text-white-100 flex items-center justify-center"
              title={t(
                "subscriptionDetails.requestQuotaIncreaseDialog.buttons.tooltips.decrease",
              )}
              onClick={decToken}
            >
              <TbChevronLeft size={20} strokeWidth={1.4} />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={TOKEN_STEP}
              value={newTokenLimit}
              onChange={handleTokenInput}
              onWheel={(e) => e.currentTarget.blur()}
              onKeyDown={preventArrowAndWheel}
              className="no-number-spin text-sm flex-1 min-w-0 bg-transparent tracking-[0.07em] font-light items-center justify-center text-white-100 border-none outline-none text-center"
              aria-label={t(
                "subscriptionDetails.requestQuotaIncreaseDialog.buttons.newTokenLimit",
              )}
            />
            <button
              type="button"
              className="bg-transparent outline-none border-none text-white-100 flex items-center justify-center"
              title={t(
                "subscriptionDetails.requestQuotaIncreaseDialog.buttons.tooltips.increase",
              )}
              onClick={incToken}
            >
              <TbChevronRight size={20} strokeWidth={1.4} />
            </button>
          </div>

          <div className="flex justify-between text-xs text-gray-300 mt-2">
            <div className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-600 text-white-100">
              Change: +{formatNumber(tokenDelta)} &nbsp;
              {t("subscriptionDetails.requestCard.labels.newTokenLimit")}
            </div>
            <span className="text-xs text-gray-300">
              {typeof tokenPct === "number" ? `${tokenPct.toFixed(2)}%` : "N/A"}
            </span>
          </div>
        </div>

        {/* Rate + Request row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {/* Rate */}
          <div className="min-w-0 flex flex-col">
            <FormLabel
              label={t(
                "subscriptionDetails.requestQuotaIncreaseDialog.buttons.newRateLimit",
              )}
              size="sm"
            />
            <div className="flex items-center w-full bg-gray-900/60 rounded-xl py-[12px] px-4">
              <button
                type="button"
                className="bg-transparent outline-none border-none text-white-100 flex items-center justify-center"
                title={t(
                  "subscriptionDetails.requestQuotaIncreaseDialog.buttons.tooltips.decrease",
                )}
                onClick={decRate}
              >
                <TbChevronLeft size={20} strokeWidth={1.4} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={RATE_STEP}
                value={newRateLimit}
                onChange={handleRateInput}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={preventArrowAndWheel}
                className="no-number-spin text-sm flex-1 min-w-0 bg-transparent tracking-[0.07em] font-light text-white-100 border-none outline-none text-center"
                aria-label={t(
                  "subscriptionDetails.requestQuotaIncreaseDialog.buttons.newRateLimit",
                )}
              />
              <button
                type="button"
                className="bg-transparent outline-none border-none text-white-100 flex items-center justify-center"
                title={t(
                  "subscriptionDetails.requestQuotaIncreaseDialog.buttons.tooltips.increase",
                )}
                onClick={incRate}
              >
                <TbChevronRight size={20} strokeWidth={1.4} />
              </button>
            </div>
            <div className="inline-flex w-fit shrink-0 self-start items-center text-xs px-2 py-1 rounded-full bg-gray-600 text-white-100 mt-2">
              Change: +{formatNumber(rateDelta)} &nbsp;
              {t("subscriptionDetails.requestCard.labels.newRateLimit")}
            </div>
          </div>

          {/* Request */}
          <div className="min-w-0 flex flex-col">
            <FormLabel
              label={t(
                "subscriptionDetails.requestQuotaIncreaseDialog.buttons.newRequestLimit",
              )}
              size="sm"
            />
            <div className="flex items-center w-full bg-gray-900/60 rounded-xl py-[12px] px-4">
              <button
                type="button"
                className="bg-transparent outline-none border-none text-white-100 flex items-center justify-center"
                title={t(
                  "subscriptionDetails.requestQuotaIncreaseDialog.buttons.tooltips.decrease",
                )}
                onClick={decRequest}
              >
                <TbChevronLeft size={20} strokeWidth={1.4} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={REQUEST_STEP}
                value={newRequestLimit}
                onChange={handleRequestInput}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={preventArrowAndWheel}
                className="no-number-spin text-sm flex-1 min-w-0 bg-transparent tracking-[0.07em] font-light text-white-100 border-none outline-none text-center"
                aria-label={t(
                  "subscriptionDetails.requestQuotaIncreaseDialog.buttons.newRequestLimit",
                )}
              />
              <button
                type="button"
                className="bg-transparent outline-none border-none text-white-100 flex items-center justify-center"
                title={t(
                  "subscriptionDetails.requestQuotaIncreaseDialog.buttons.tooltips.increase",
                )}
                onClick={incRequest}
              >
                <TbChevronRight size={20} strokeWidth={1.4} />
              </button>
            </div>
            <div className="inline-flex w-fit shrink-0 self-start items-center text-xs px-2 py-1 rounded-full bg-gray-600 text-white-100 mt-2">
              Change: +{formatNumber(requestDelta)} &nbsp;
              {t("subscriptionDetails.requestCard.labels.newRequestLimit")}
            </div>
          </div>
        </div>

        {/* Justification */}
        <div className="flex flex-col">
          <FormLabel
            label={t(
              "subscriptionDetails.requestQuotaIncreaseDialog.justifyQuotaIncrease.label",
            )}
            size="sm"
          />
          <FormTextarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder={t(
              "subscriptionDetails.requestQuotaIncreaseDialog.justifyQuotaIncrease.placeholder",
            )}
            maxLength={1500}
            size="sm"
          />
          <div className="text-xs text-gray-300">
            {justification.length}/{justificationMaxLen}
          </div>
        </div>

        {/* Actions */}
        <DialogActionButtons
          cancelText={t(
            "subscriptionDetails.requestQuotaIncreaseDialog.buttons.cancel",
          )}
          confirmText={t(
            "subscriptionDetails.requestQuotaIncreaseDialog.buttons.requestAccess",
          )}
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmDisabled={disableSubmit}
        />
      </div>
    </ModalContainer>
  );
}
