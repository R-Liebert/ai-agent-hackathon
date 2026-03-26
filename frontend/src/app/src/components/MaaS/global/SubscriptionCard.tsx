import { useMemo, useState, useCallback } from "react";
import type { SubscriptionEntity, AdminAction } from "../../../types/maasTypes";
import { useTranslation } from "react-i18next";
import { getSubscriptionTypeDetails } from "../../../utils/maas/getSubscriptionTypeDetails";
import SubscriptionStatus from "./Status";
import SubscriptionType from "./SubscriptionType";
import AdminActionButton from "./ActionButton";
import {
  TbCalendarClock,
  TbTrash,
  TbBan,
  TbCheckbox,
  TbSettings,
} from "react-icons/tb";
import { useRouteChanger } from "../../../utils/navigation";
import { formatDate } from "../../../utils/maas/maasConfigs";

type SubscriptionCardProps = {
  subscription: SubscriptionEntity;
  onClick?: () => void;
  mode?: "user" | "admin";
  onAction?: (
    action: AdminAction,
    args: { subscription: SubscriptionEntity; justification?: string },
  ) => void | Promise<void>;
};

const formatInt = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);

function getAdminStatusBucket(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "PENDING_APPROVAL":
      return "PENDING";
    case "ACTIVE":
      return "APPROVED";
    case "CANCELLED":
    case "FAILED":
      return "REJECTED";
    case "DEACTIVATED":
    case "BLOCKED":
      return "OTHER"; // Deactivated tab groups both DEACTIVATED and BLOCKED
    default:
      return "OTHER";
  }
}

export default function SubscriptionCard({
  subscription,
  onClick,
  mode = "user",
  onAction,
}: SubscriptionCardProps) {
  const { t } = useTranslation("subscriptions");
  const { changeRoute } = useRouteChanger();

  const adminActions = subscription.adminActions ?? [];
  const latestAdminAction = adminActions[0];

  // Labels for admin actions*
  const actionLabelKeyMap: Record<AdminAction, string> = {
    approve: "subscriptionCard.labelsForAdminActions.approve",
    approveAgain: "subscriptionCard.labelsForAdminActions.approve",
    reject: "subscriptionCard.labelsForAdminActions.reject",
    deactivate: "subscriptionCard.labelsForAdminActions.deactivate",
    delete: "subscriptionCard.labelsForAdminActions.delete",
    expiryDateUpdate: "subscriptionCard.labelsForAdminActions.expiryDateUpdate",
    reactivate: "subscriptionCard.labelsForAdminActions.reactivate",
  };

  const latestActionLabel = latestAdminAction
    ? t(actionLabelKeyMap[latestAdminAction.type])
    : undefined;

  const granted = subscription.tokenUsage?.granted ?? 0;
  const used = subscription.tokenUsage?.used ?? 0;
  const utilization =
    granted > 0 ? Math.min(100, Math.round((used / granted) * 100)) : 0;

  const activeModels = Array.isArray(subscription.models)
    ? subscription.models.filter((m) => m.enabled && m.status === "ACTIVE")
        .length
    : 0;

  // Keep this if it initializes iconography or returns cached details used elsewhere
  getSubscriptionTypeDetails(subscription.type, { size: 19, strokeWidth: 1.6 });

  const statusBucket = getAdminStatusBucket(subscription.status);

  const handleApproveClick = () => {
    onAction?.("approve", { subscription });
  };

  const handleRejectClick = () => {
    onAction?.("reject", { subscription });
  };

  const adminMenuLinks = useMemo(() => {
    const links = [
      {
        label: t("adminDashboard.actions.configure") || "Configure",
        Icon: TbSettings,
        onClick: () => {
          changeRoute(`/maas/${subscription.id}/configure`);
        },
      },
      {
        label: t("adminDashboard.actions.delete"),
        Icon: TbTrash,
        onClick: () => onAction?.("delete", { subscription }),
      },
      {
        label: t("adminDashboard.actions.deactivate"),
        Icon: TbBan,
        onClick: () => onAction?.("deactivate", { subscription }),
      },
      {
        label: t("adminDashboard.actions.expiryDateUpdate"),
        Icon: TbCalendarClock,
        onClick: () => onAction?.("expiryDateUpdate", { subscription }),
      },
    ];
    if (
      subscription.status === "CANCELLED" ||
      subscription.status === "FAILED"
    ) {
      links.push({
        label: t("adminDashboard.actions.approve"),
        Icon: TbCheckbox,
        onClick: () => onAction?.("approve", { subscription }),
      });
    }
    if (
      subscription.status === "DEACTIVATED" ||
      subscription.status === "BLOCKED"
    ) {
      links.push({
        label:
          t("adminDashboard.actions.approveAgain") ||
          t("adminDashboard.actions.approve"),
        Icon: TbCheckbox,
        onClick: () => onAction?.("approveAgain", { subscription }),
      });
    }

    return links;
  }, [t, subscription, onClick, onAction, changeRoute]);

  // NEW: build a display string for application reference
  const applicationDisplay =
    subscription.type === "NORMAL"
      ? subscription.applicationReference
        ? `${subscription.applicationReference.name} (${subscription.applicationReference.applicationId})`
        : "-"
      : subscription.applicationRefFreeText || "-";

  return (
    <article
      className={`relative flex flex-col font-body border border-gray-600 bg-gray-700/90 rounded-xl gap-2 px-5 py-4 transition-colors ${
        onClick ? "cursor-pointer hover:bg-gray-750" : ""
      }`}
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-labelledby={`sub-${subscription.id}`}
    >
      {/* Header: name + type + status (admin hides these badges per current design) */}
      <div className="flex items-start justify-between gap-3 !font-body">
        <h4
          id={`sub-${subscription.id}`}
          className="text-base font-semibold text-white-100 truncate capitalize"
        >
          {subscription.name}
        </h4>
        {/* Actions */}
        {mode === "admin" ? (
          <AdminActionButton
            actions={adminMenuLinks}
            ariaLabel={t("subscriptionDetails.actionsBtn")}
            tooltipText={t("subscriptionDetails.actionsBtn")}
            borderless
          />
        ) : (
          <div className="flex gap-3">
            <SubscriptionType type={subscription.type} />
            <SubscriptionStatus
              status={subscription.status}
              scope="subscription"
            />
          </div>
        )}
      </div>

      {/* Admin metadata line */}
      {mode === "admin" && (
        <div className="flex flex-col gap-4 my-4">
          <div className="flex flex-wrap justify-between gap-x-12 gap-y-4 font-body">
            {/* SubscriptionId */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">
                {t("subscriptionCard.id")}:
              </span>
              <span className="text-white-100 text-sm">{subscription.id}</span>
            </div>
            {/* Application Ref */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">
                {t("subscriptionCard.applicationRef")}:
              </span>
              <span className="text-white-100 text-sm">
                {applicationDisplay}
              </span>
            </div>
            {/* User Details */}
            {subscription.user && (
              <div className="flex flex-col">
                <span className="text-sm text-gray-300">
                  {t("subscriptionCard.userLabel")}:
                </span>
                <span className="text-white-100 text-sm">
                  {subscription.user}
                </span>
              </div>
            )}
            {/* Created At */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">
                {t("subscriptionCard.created")}:
              </span>
              <span className="text-white-100 text-sm">
                {formatDate(subscription.createdAt)}
              </span>
            </div>
            {/* Expiry Date */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">
                {t("subscriptionCard.expiryDate")}:
              </span>
              {subscription.expirationDate !== undefined ? (
                <span className="text-white-100 text-sm">
                  {formatDate(subscription.expirationDate)}
                </span>
              ) : (
                <span>Unlimited</span>
              )}
            </div>
            {/* Environment */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">
                {t("subscriptionCard.environment")}:
              </span>
              <span className="text-white-100 text-sm">
                {subscription.environment}
              </span>
            </div>
            {/* Purpose */}
            {subscription.subscriptionPurpose && (
              <div className="flex flex-col">
                <span className="text-sm text-gray-300">
                  {t("subscriptionCard.purpose")}:
                </span>
                <span className="text-white-100 text-sm">
                  {subscription.subscriptionPurpose}
                </span>
              </div>
            )}
          </div>

          {/* Latest Admin Action */}
          {mode === "admin" && latestAdminAction && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="font-body">
                <span className="flex gap-2 justify-between">
                  <span className="text-sm text-gray-300">
                    {latestActionLabel
                      ? `${latestActionLabel}:`
                      : t("subscriptionCard.labelsForAdminActions.approve")}
                  </span>
                  <span className="text-xs text-gray-300">
                    {formatDate(latestAdminAction.timestamp)}
                  </span>
                </span>
                <p className="mt-1 text-sm text-white-100">
                  {latestAdminAction.justification ||
                    t("subscriptionCard.noRejectionReason")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Models */}
      {activeModels > 0 && Array.isArray(subscription.models) && (
        <div className="flex flex-col font-body gap-1 mb-2">
          <span className="text-sm capitalize text-gray-300">
            {t("discovery.cards.activeModels")}:
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {subscription.models
              .filter((m) => m.enabled && m.status === "ACTIVE")
              .map((model, index) => (
                <span
                  key={index}
                  className="text-sm px-3 py-[6px] flex-inline justify-center rounded-full bg-gray-600 text-white-100 capitalize"
                >
                  {model.name}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Admin vs user view */}
      {mode === "admin" ? (
        <>
          {/* Pending: Approve/Reject (no tokens) */}
          {statusBucket === "PENDING" && (
            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRejectClick();
                  }}
                  className="flex w-[48%] sm:w-auto place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite focus:bg-gray-650 focus:text-white-100 font-body"
                >
                  {t("adminDashboard.actions.reject")}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproveClick();
                  }}
                  className="flex w-full sm:w-auto mt-4 sm:mt-0 place-content-center rounded-full px-3 py-2 text-[14px] font-body font-semibold transition-color transition-background duration-300 ease-in-out place-items-center place-content-center bg-white-100 text-gray-600 hover:bg-red-700 hover:text-white-100"
                >
                  {t("adminDashboard.actions.approve")}
                </button>
              </div>
            </div>
          )}

          {/* Approved: tokens */}
          {statusBucket === "APPROVED" && (
            <div className="flex flex-col mb-1 mt-auto">
              <div className="flex justify-between font-body">
                <span className="text-sm text-gray-300">
                  {t("discovery.cards.tokensUsage")}
                </span>
                <div className="flex items-end">
                  <span className="text-sm text-gray-300">
                    {formatInt(used)}/
                  </span>
                  <span className="text-sm text-gray-300">
                    {formatInt(granted)}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <ProgressBar utilization={utilization} />
              </div>
            </div>
          )}
        </>
      ) : (
        // User view
        <div className="flex flex-col mb-1">
          <div className="flex justify-between font-body">
            <span className="text-sm text-gray-300">
              {t("discovery.cards.tokensUsage")}
            </span>
            <div className="flex items-end">
              <span className="text-sm text-gray-300">{formatInt(used)}/</span>
              <span className="text-sm text-gray-300">
                {formatInt(granted)}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar utilization={utilization} />
          </div>
        </div>
      )}
    </article>
  );
}

function ProgressBar({ utilization }: { utilization: number }) {
  return (
    <div
      className="w-full h-2 rounded-full bg-gray-600 overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={utilization}
      aria-label="Tokens utilization"
    >
      <div
        className="h-full bg-white-100 transition-all"
        style={{ width: `${utilization}%` }}
      />
    </div>
  );
}
