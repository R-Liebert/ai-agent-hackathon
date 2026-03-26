import React, { useMemo } from "react";
import { TbExclamationCircle, TbTrash } from "react-icons/tb";
import Tooltip from "../../Global/Tooltip";
import { useTranslation } from "react-i18next";

export type NotificationRow = {
  id: string | number;
  timestamp: number | string | Date;
  text?: string;
  i18nKey?: string;
  i18nParams?: Record<string, unknown>;
};

export type NotificationItemProps = {
  items: NotificationRow[];
  locale?: string;
  onMarkSeen?: (ids: Array<string | number>) => void;
  onDismiss?: (id: string | number) => void;
  onItemClick?: (id: string | number) => void;
};

const toDate = (d: number | string | Date) => {
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? new Date() : date; // fallback to now
};

const formatAbsolute = (date: Date, locale?: string) => {
  try {
    return new Intl.DateTimeFormat(locale || undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const formatRelative = (date: Date, now = new Date(), locale?: string) => {
  const diff = date.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const minute = 60_000,
    hour = 60 * minute,
    day = 24 * hour;

  try {
    const rtf = new Intl.RelativeTimeFormat(locale || undefined, {
      numeric: "auto",
    });
    if (abs < minute) return rtf.format(Math.round(diff / 1000), "second");
    if (abs < hour) return rtf.format(Math.round(diff / minute), "minute");
    if (abs < day) return rtf.format(Math.round(diff / hour), "hour");
    return rtf.format(Math.round(diff / day), "day");
  } catch {
    const mins = Math.round(abs / minute);
    if (mins < 60) return `${mins}m ${diff < 0 ? "ago" : "from now"}`;
    const hrs = Math.round(abs / hour);
    if (hrs < 24) return `${hrs}h ${diff < 0 ? "ago" : "from now"}`;
    const days = Math.round(abs / day);
    return `${days}d ${diff < 0 ? "ago" : "from now"}`;
  }
};

// Keys (relative to 'subscriptions' namespace)
const K_DETAILS_UPDATED =
  "subscription-configuration.consumerNotifications.notificationsTexts.detailsUpdated";
const K_MODELS_UPDATED =
  "subscription-configuration.consumerNotifications.notificationsTexts.modelsUpdated";

// Structured helpers
type DetailsChange = { labelKey: string; value: string };

export const NotificationItem: React.FC<NotificationItemProps> = ({
  items,
  locale,
  onDismiss,
  onItemClick,
}) => {
  const interactive = typeof onItemClick === "function";
  const { t } = useTranslation("subscriptions");

  // Accept entries that have either i18nKey OR legacy text and a timestamp
  const validItems = useMemo(
    () =>
      items.filter(
        (it) =>
          it.id != null && (it.i18nKey || it.text) && it.timestamp != null,
      ),
    [items],
  );

  if (validItems.length === 0) return null;

  return (
    <div className="bg-gray-700/80 border-2 gap-1 border-gray-500 rounded-xl px-3 py-2 mb-2 text-white-100 flex flex-col">
      {validItems.map((it) => {
        const d = toDate(it.timestamp);
        const abs = formatAbsolute(d, locale);
        const timeRef = formatRelative(d, new Date(), locale);

        const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
          e,
        ) => {
          if (!interactive) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onItemClick?.(it.id);
          }
        };

        // Prefer i18n; fall back to text
        const title = it.i18nKey
          ? (t(it.i18nKey, it.i18nParams as any) as string)
          : it.text || "";

        // Structured rendering - details
        const changes: DetailsChange[] = Array.isArray(it.i18nParams?.changes)
          ? (it.i18nParams!.changes as DetailsChange[])
          : [];
        const detailsInline =
          it.i18nKey === K_DETAILS_UPDATED && changes.length > 0
            ? changes.map((c) => `${t(c.labelKey)} ${c.value}`).join(" · ")
            : "";

        // Structured rendering - models
        const added = Array.isArray(it.i18nParams?.added)
          ? (it.i18nParams!.added as string[])
          : [];
        const removed = Array.isArray(it.i18nParams?.removed)
          ? (it.i18nParams!.removed as string[])
          : [];
        const addedLabel =
          typeof it.i18nParams?.addedLabelKey === "string"
            ? (t(it.i18nParams!.addedLabelKey as string) as string)
            : "";
        const removedLabel =
          typeof it.i18nParams?.removedLabelKey === "string"
            ? (t(it.i18nParams!.removedLabelKey as string) as string)
            : "";
        const modelsInline =
          it.i18nKey === K_MODELS_UPDATED &&
          (added.length > 0 || removed.length > 0)
            ? [
                added.length ? `${addedLabel} ${added.join(", ")}` : null,
                removed.length ? `${removedLabel} ${removed.join(", ")}` : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : "";

        return (
          <div
            key={it.id}
            className={`group relative w-full flex items-center pl-3 pr-0 mr-0 py-2 text-left rounded-xl hover:bg-gray-600 hover:mr-2 transition-all duration-150 ease-in`}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => onItemClick?.(it.id) : undefined}
            onKeyDown={handleKeyDown}
          >
            <span
              className="inline-flex text-[#E7B861] mr-4"
              aria-hidden="true"
            >
              <TbExclamationCircle size={26} strokeWidth={1.6} />
            </span>

            <div className="w-full flex flex-col justify-between items-start">
              {detailsInline && (
                <p className="m-0 text-md leading-6 w-full">
                  {title}: {detailsInline}
                </p>
              )}

              {modelsInline && (
                <p className="m-0 text-md leading-6 w-full">
                  {title}: {modelsInline}
                </p>
              )}
              {!detailsInline && !modelsInline && (
                <p className="m-0 text-md leading-6 w-full" title={title}>
                  {title}
                </p>
              )}

              <time
                className="inline-flex w-auto font-body text-sm text-gray-300 mr-1 mt-1"
                dateTime={d.toISOString()}
                title={abs}
                aria-label={`Reported ${abs}`}
              >
                {timeRef}
              </time>
            </div>

            {onDismiss ? (
              <Tooltip
                useMui
                text={t("subscriptionDetails.dismissNotification")}
              >
                <button
                  type="button"
                  className="opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity duration-150
                             inline-flex items-center justify-center h-6 w-6 text-white-100 focus-visible:outline-none mr-2"
                  aria-label={t("subscriptionDetails.dismissNotification")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(it.id);
                  }}
                >
                  <TbTrash size={18} strokeWidth={1.4} />
                </button>
              </Tooltip>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
