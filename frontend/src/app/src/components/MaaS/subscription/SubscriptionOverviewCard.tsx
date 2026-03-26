import React from "react";
import { useTranslation } from "react-i18next";
import { SubscriptionEntity } from "../../../types/maasTypes";
import { formatDate } from "../../../utils/maas/maasConfigs";

interface SubscriptionOverviewCardProps {
  subscription: SubscriptionEntity;
}

const SubscriptionOverviewCard: React.FC<SubscriptionOverviewCardProps> = ({
  subscription,
}) => {
  const { t } = useTranslation("subscriptions");

  const {
    id: subscriptionId,
    createdAt,
    expirationDate,
    department,
    environment,
    applicationReference,
    applicationRefFreeText,
    adGroupReference,
    subscriptionPurpose,
  } = subscription;

  const formattedCreated = formatDate(createdAt);

  const formattedExpiry =
    expirationDate == null
      ? t("subscriptionDetails.overviewDetails.expiryUnlimited", {
          defaultValue: "Unlimited",
        })
      : formatDate(expirationDate);

  // NEW: labels for application + ad group
  const applicationLabel = applicationReference
    ? `${applicationReference.name} (${applicationReference.applicationId})`
    : applicationRefFreeText || "-";

  const adGroupLabel = adGroupReference
    ? `${adGroupReference.name} (${adGroupReference.id})`
    : "-";

  return (
    <div className="border-2 border-gray-500 rounded-xl px-6 py-8 bg-gray-700 mt-3">
      <div className="flex flex-wrap gap-x-10 gap-y-4 justify-between !font-body flex-wrap">
        {/* Subscription ID */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-300">
            {t("subscriptionDetails.overviewDetails.subscriptionId")}
          </span>
          <span className="text-md !font-light text-white-100">
            {subscriptionId}
          </span>
        </div>

        {/* Application Reference */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-300">
            {t("subscriptionDetails.overviewDetails.applicationReference")}
          </span>
          <span className="text-md !font-light text-white-100">
            {applicationLabel}
          </span>
        </div>

        {/* Created At */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-300">
            {t("subscriptionDetails.overviewDetails.dateCreated")}
          </span>
          <span className="text-md !font-light text-white-100">
            {formattedCreated}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-300">
            {t("subscriptionDetails.overviewDetails.expiryDate")}
          </span>
          {/* Expiry Date */}
          {expirationDate !== undefined ? (
            <span className="text-md !font-light text-white-100">
              {formattedExpiry}
            </span>
          ) : (
            <span>Unlimited</span>
          )}
        </div>

        {/* AD Group Reference */}
        {adGroupReference && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-300">
              {t("subscriptionDetails.overviewDetails.adGroup")}
            </span>
            <span className="text-md !font-light text-white-100">
              {adGroupLabel}
            </span>
          </div>
        )}

        {/* Department */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-300">
            {t("subscriptionDetails.overviewDetails.department")}
          </span>
          <span className="text-md !font-light text-white-100">
            {department || "-"}
          </span>
        </div>

        {/* Environment */}
        {environment && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-300">
              {t("subscriptionDetails.overviewDetails.environment")}
            </span>
            <span className="text-md !font-light text-white-100">
              {environment}
            </span>
          </div>
        )}
        {/* Subscription Purpose*/}
        {subscriptionPurpose && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-300">
              {t("subscriptionDetails.overviewDetails.subscriptionPurpose")}
            </span>
            <span className="text-md !font-light text-white-100">
              {subscriptionPurpose}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionOverviewCard;
