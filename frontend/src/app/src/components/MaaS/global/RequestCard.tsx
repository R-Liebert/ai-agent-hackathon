import React from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import {
  TbSparkles,
  TbChartDots3,
  TbCalendarClock,
  TbActivity,
} from "react-icons/tb";
import {
  SubmittedRequest,
  QuotaIncreasePayload,
  ModelAccessPayload,
  ExtendSubscriptionPayload,
  ActivateSubscriptionPayload,
  DeactivateSubscriptionPayload,
} from "../../../types/maasTypes";
import { useSubscriptionsStore } from "../../../stores/maasStore";
import RequestStatus from "./Status";

export interface RequestCardProps {
  request: SubmittedRequest;

  // Admin mode extras (optional; defaults to "user")
  mode?: "user" | "admin";
  subscriptionName?: string; // display in admin card header
  subscriptionId?: string; // required to invoke onApprove/onDecline
  onApprove?: (args: {
    subscriptionId: string;
    requestId: string;
    request: SubmittedRequest;
  }) => void | Promise<void>;
  onDecline?: (args: {
    subscriptionId: string;
    requestId: string;
    request: SubmittedRequest;
  }) => void | Promise<void>;
}

const formatDateTime = (ts?: number) => {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Safe numeric formatter (prevents undefined.toLocaleString crashes)
const fmtNum = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) ? n.toLocaleString() : "—";

const formatExpiry = (ts?: number) =>
  typeof ts === "number" ? dayjs(ts).format("YYYY-MM-DD") : "—";

export default function RequestCard({
  request,
  mode = "user",
  subscriptionName,
  subscriptionId,
  onApprove,
  onDecline,
}: RequestCardProps) {
  const { t } = useTranslation("subscriptions");
  const modelsCatalog = useSubscriptionsStore((s) => s.modelsCatalog);

  const isQuota = request.type === "QUOTA_INCREASE";
  const isModelAccess = request.type === "MODEL_ACCESS";
  const isExtend = request.type === "EXTEND_SUBSCRIPTION";
  const isActivate = request.type === "ACTIVATE_SUBSCRIPTION";
  const isDeactivate = request.type === "DEACTIVATE_SUBSCRIPTION";

  const Icon = isQuota
    ? TbChartDots3
    : isModelAccess
      ? TbSparkles
      : isExtend
        ? TbCalendarClock
        : TbActivity; // activate/deactivate fallback

  const title = isQuota
    ? t("subscriptionDetails.requestCard.labels.quotaIncrease")
    : isModelAccess
      ? t("subscriptionDetails.requestCard.labels.modelAccess")
      : isExtend
        ? t(
            "subscriptionDetails.requestCard.labels.extendSubscription",
            "Extend subscription",
          )
        : isActivate
          ? t(
              "subscriptionDetails.requestCard.labels.activateSubscription",
              "Activate subscription",
            )
          : t(
              "subscriptionDetails.requestCard.labels.deactivateSubscription",
              "Deactivate subscription",
            );

  const statusLabel =
    request.status === "PENDING"
      ? t("subscriptionDetails.requestCard.status.pending")
      : request.status === "APPROVED"
        ? t("subscriptionDetails.requestCard.status.approved")
        : t("subscriptionDetails.requestCard.status.declined");

  // Narrow payloads (safe)
  const quota = isQuota
    ? (request.payload as QuotaIncreasePayload | undefined)
    : undefined;
  const models = isModelAccess
    ? (request.payload as ModelAccessPayload | undefined)
    : undefined;
  const extend = isExtend
    ? (request.payload as ExtendSubscriptionPayload | undefined)
    : undefined;
  const act = isActivate
    ? (request.payload as ActivateSubscriptionPayload | undefined)
    : undefined;
  const deact = isDeactivate
    ? (request.payload as DeactivateSubscriptionPayload | undefined)
    : undefined;

  // Resolve model names for MODEL_ACCESS (fallback to key if name not found)
  const modelNames =
    (models?.modelKeys || []).map((k) => modelsCatalog[k]?.name ?? k) ?? [];

  // Admin decision buttons: only when pending, not activate/deactivate, and subscriptionId present
  const canDecide =
    mode === "admin" &&
    request.status === "PENDING" &&
    !isActivate &&
    !isDeactivate &&
    !!subscriptionId;

  const handleApprove = async () => {
    if (!onApprove || !subscriptionId) return;
    await onApprove({
      subscriptionId,
      requestId: request.id,
      request,
    });
  };

  const handleDecline = async () => {
    if (!onDecline || !subscriptionId) return;
    await onDecline({
      subscriptionId,
      requestId: request.id,
      request,
    });
  };

  // Pick justification from the union payload (if present)
  const justification =
    quota?.justification ??
    models?.justification ??
    extend?.justification ??
    act?.justification ??
    deact?.justification ??
    undefined;

  return (
    <div className="border-2 border-gray-500 gap-8 rounded-xl p-4 bg-gray-700 text-white-100 font-body">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white-100">
          <Icon size={24} strokeWidth={1.6} />
          <h5 className="text-md font-normal font-body">{title}</h5>
        </div>
        <RequestStatus scope="request" status={request.status} variant="card" />
      </div>

      {/* Admin subscription info */}
      {mode === "admin" && subscriptionName && subscriptionId && (
        <div className="mt-1 text-xs text-gray-300">
          <strong>
            {t(
              "subscriptionDetails.requestCard.labels.subscription",
              "Subscription",
            )}
            :
          </strong>{" "}
          {subscriptionName} ({subscriptionId})
        </div>
      )}

      {/* Details */}
      <div className="mt-3 text-sm">
        {isQuota && (
          <div className="flex flex-col gap-2 font-body">
            <span className="text-sm text-gray-300">
              {t(
                "subscriptionDetails.requestCard.labels.requestType.quota",
              )}{" "}
            </span>
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center text-xs px-4 py-2 !font-body rounded-full bg-gray-650 text-white-100">
                +{fmtNum(quota?.newTokenLimit)}&nbsp;
                {t("subscriptionDetails.requestCard.labels.newTokenLimit")}
              </span>
              <span className="flex items-center text-xs px-4 py-2 !font-body rounded-full bg-gray-650 text-white-100">
                +{fmtNum(quota?.newRateLimit)}
                &nbsp;
                {t("subscriptionDetails.requestCard.labels.newRateLimit")}
              </span>
              {quota?.newRequestLimit !== undefined && (
                <span className="flex items-center text-xs px-4 py-2 !font-body rounded-full bg-gray-650 text-white-100">
                  +{fmtNum(quota?.newRequestLimit)}
                  &nbsp;
                  {t("subscriptionDetails.requestCard.labels.newRequestLimit")}
                </span>
              )}
            </div>
          </div>
        )}

        {isModelAccess && (
          <div className="flex flex-col gap-2 font-body">
            <span className="text-sm text-gray-300">
              {t(
                "subscriptionDetails.requestCard.labels.requestType.models",
              )}{" "}
            </span>
            <div className="flex gap-2 flex-wrap">
              {modelNames.map((name, idx) => (
                <span
                  key={`${name}-${idx}`}
                  className="flex items-center text-xs px-4 py-2 rounded-full bg-gray-650 text-white-100"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {isExtend && (
          <div className="flex flex-col gap-2 font-body">
            <span className="text-sm text-gray-300">
              {t(
                "subscriptionDetails.requestCard.labels.requestType.extend",
                "Extension request",
              )}{" "}
            </span>
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center text-xs px-4 py-2 rounded-full bg-gray-650 text-white-100">
                {t(
                  "subscriptionDetails.requestCard.labels.requestedExpiry",
                  "Requested expiry",
                )}
                : {formatExpiry(extend?.expiryTs)}
              </span>
            </div>
          </div>
        )}

        {isActivate && (
          <div className="flex flex-col gap-2 font-body">
            <span className="text-sm text-gray-300">
              {t(
                "subscriptionDetails.requestCard.labels.requestType.activate",
                "Activation",
              )}{" "}
            </span>
          </div>
        )}

        {isDeactivate && (
          <div className="flex flex-col gap-2 font-body">
            <span className="text-sm text-gray-300">
              {t(
                "subscriptionDetails.requestCard.labels.requestType.deactivate",
                "Deactivation",
              )}{" "}
            </span>
          </div>
        )}
      </div>

      {/* Justification */}
      {justification ? (
        <span className="flex mt-4 text-sm">{justification}</span>
      ) : null}

      {/* Meta line */}
      <span className="mt-2 ml-auto mr-0 text-xs text-gray-300 w-full flex justify-end">
        {t("subscriptionDetails.requestCard.labels.createdAt")}{" "}
        {formatDateTime(request.createdAt)}
      </span>

      {/* Admin decision actions (hidden for activate/deactivate) */}
      {canDecide && (
        <div className="flex gap-3 justify-end mt-3">
          <button
            type="button"
            className="flex w-[48%] sm:w-auto place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite focus:bg-gray-650 focus:text-white-100 font-body"
            onClick={handleDecline}
          >
            {t("adminDashboard.requests.buttons.decline", "Decline")}
          </button>
          <button
            type="button"
            className="flex w-full sm:w-auto mt-4 sm:mt-0 place-content-center rounded-full px-3 py-2 text-[14px] font-body font-semibold transition-color transition-background duration-300 ease-in-out place-items-center place-content-center bg-white-200 text-gray-600 hover:bg-red-700 hover:text-white-100"
            onClick={handleApprove}
          >
            {t("adminDashboard.requests.buttons.approve", "Approve")}
          </button>
        </div>
      )}
    </div>
  );
}
