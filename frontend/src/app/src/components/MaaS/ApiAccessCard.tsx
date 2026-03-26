import React, { useMemo, useState } from "react";
import AppContentCopy from "../../components/Global/AppContentCopy";
import handleCopyContent from "../../utils/handleCopyContent";
import { TbEye, TbEyeOff, TbRefresh, TbKey } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import Tooltip from "../Global/Tooltip";

interface ApiAccessCardProps {
  endpointUrl?: string;
  apiKeyLast4?: string;
  apiKeyStatus?: "ACTIVE" | "REVOKED";
  createdAt?: number;
  onViewFullKey: () => Promise<string>;
  onRegenerateKey: () => Promise<{ last4: string; secretId: string }>;

  title?: string;
  iconButtonClass: string;
}

export default function ApiAccessCard({
  endpointUrl,
  apiKeyLast4,
  apiKeyStatus,
  createdAt,
  onViewFullKey,
  onRegenerateKey,
  title = "API Access",
  iconButtonClass,
}: ApiAccessCardProps) {
  const [showFullKey, setShowFullKey] = useState(false);
  const [fullKey, setFullKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { t } = useTranslation("subscriptions");

  const maskedKey = useMemo(() => {
    if (!apiKeyLast4) return null;
    return `••••••••••••••••••••••••••••${apiKeyLast4}`;
  }, [apiKeyLast4]);

  // Generate or reveal the key; used for both “Generate” and “View full”
  const handleGenerateOrReveal = async () => {
    try {
      setIsLoadingKey(true);
      const key = await onViewFullKey();
      setFullKey(key);
      setShowFullKey(true);
    } finally {
      setIsLoadingKey(false);
    }
  };

  const handleToggleView = async () => {
    if (!showFullKey) {
      await handleGenerateOrReveal();
    } else {
      setShowFullKey(false);
      setFullKey(null);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      await onRegenerateKey();
      setIsLoadingKey(true);
      const key = await onViewFullKey();
      setFullKey(key);
      setShowFullKey(true);
    } finally {
      setIsLoadingKey(false);
      setIsRegenerating(false);
    }
  };

  const handleCopyApiKey = async ({
    setMessageCopyOk,
  }: {
    setMessageCopyOk: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    try {
      // Use current revealed key if present; otherwise fetch/generate it
      const key = fullKey ?? (await onViewFullKey());
      await handleCopyContent({
        htmlToCopy: key,
        setMessageCopyOk,
        errorMessage: t(
          "subscriptionDetails.apiAccess.notifications.copyAPIKey.error",
        ),
        successMessage: t(
          "subscriptionDetails.apiAccess.notifications.copyAPIKey.success",
        ),
      });
    } catch {
      console.error("Failed to copy API key");
    }
  };
  return (
    <section
      className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full border-2 border-gray-500 rounded-xl p-6 pb-7 bg-gray-700"
      aria-labelledby="api-access-heading"
    >
      {/* API Key */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <h4 className="text-md font-light font-body text-white-100 truncate">
            {t("subscriptionDetails.apiAccess.label")}
          </h4>
          {/* When a key already exists (metadata present) */}
          {apiKeyLast4 ? (
            <div className="flex gap-4 w-full justify-between">
              <span className="text-md w-full px-4 py-2 rounded-lg bg-gray-650 text-white-100 truncate inline-block break-all">
                {showFullKey && fullKey ? fullKey : maskedKey}
              </span>
              {/* Actions (only when a key exists) */}
              {apiKeyLast4 && (
                <div className="flex items-end gap-3">
                  {/* Regenerate */}
                  <Tooltip
                    text={
                      isRegenerating
                        ? t(
                            "subscriptionDetails.apiAccess.actions.regenerating",
                          )
                        : t("subscriptionDetails.apiAccess.actions.regenerate")
                    }
                    useMui
                  >
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className={iconButtonClass}
                      aria-label={t(
                        "subscriptionDetails.apiAccess.actions.regenerate",
                      )}
                    >
                      {" "}
                      <TbRefresh size={20} strokeWidth={1.4} />
                    </button>
                  </Tooltip>
                  {/* Hide */}
                  <Tooltip
                    text={
                      showFullKey
                        ? t("subscriptionDetails.apiAccess.actions.hideKey")
                        : t("subscriptionDetails.apiAccess.actions.viewFull")
                    }
                    useMui
                  >
                    <button
                      type="button"
                      onClick={handleToggleView}
                      disabled={isLoadingKey}
                      className={iconButtonClass}
                      aria-label={
                        showFullKey
                          ? t("subscriptionDetails.apiAccess.actions.hideKey")
                          : t("subscriptionDetails.apiAccess.actions.viewFull")
                      }
                    >
                      {showFullKey ? (
                        <TbEyeOff size={20} strokeWidth={1.4} />
                      ) : (
                        <TbEye size={20} strokeWidth={1.4} />
                      )}
                    </button>
                  </Tooltip>
                  {/* Copy API Key*/}
                  <AppContentCopy
                    handleCopyContent={({ setMessageCopyOk }) =>
                      handleCopyApiKey({ setMessageCopyOk })
                    }
                    customClass={iconButtonClass}
                    tooltipPosition="top"
                    iconSize={20}
                    tooltipText={t(
                      "subscriptionDetails.apiAccess.actions.copyAPIKey",
                    )}
                  />
                </div>
              )}
            </div>
          ) : (
            // No metadata yet → show a hint and a Generate CTA
            <div className="flex gap-4 w-full justify-between">
              <span className="text-md flex-1 flex px-4 py-2 rounded-lg bg-gray-650 text-gray-300 inline-block break-all">
                {t("subscriptionDetails.apiAccess.noAPIKeyText")}
              </span>
              <button
                type="button"
                onClick={handleGenerateOrReveal}
                disabled={isLoadingKey}
                className="inline-flex items-center gap-2 px-3 py-1 font-body rounded-xl border-2 border-gray-500 text-white-100 bg-gray-700 hover:bg-gray-600 disabled:opacity-60"
              >
                <TbKey size={18} strokeWidth={1.4} />
                {isLoadingKey
                  ? t("subscriptionDetails.apiAccess.actions.generating")
                  : t("subscriptionDetails.apiAccess.actions.generate")}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Endpoint URL */}
      {endpointUrl && (
        <div className="flex flex-col gap-3 justify-between w-full">
          <h4 className="text-md font-light font-body text-white-100 truncate">
            {t("subscriptionDetails.sectionTitles.endpointUrl")}
          </h4>
          <div className="flex gap-4 items-center">
            <span className="text-md w-full px-4 py-2 rounded-lg flex items-center w-auto capitalize bg-gray-650 text-white-100">
              {endpointUrl}
            </span>
            {/* Copy Icon Button */}
            <AppContentCopy
              handleCopyContent={({ setMessageCopyOk }) =>
                handleCopyContent({
                  htmlToCopy: endpointUrl!,
                  setMessageCopyOk,
                  errorMessage: t(
                    "subscriptionDetails.apiAccess.notifications.copyEndpointUrl.error",
                  ),
                  successMessage: t(
                    "subscriptionDetails.apiAccess.notifications.copyEndpointUrl.success",
                  ),
                })
              }
              customClass={iconButtonClass}
              tooltipPosition="top"
              iconSize={20}
              htmlToCopy={endpointUrl}
              tooltipText={t("subscriptionDetails.apiAccess.actions.copy")}
            />
          </div>
        </div>
      )}
    </section>
  );
}
