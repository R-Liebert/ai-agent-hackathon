import React from "react";
import { useTranslation } from "react-i18next";
import SubscriptionCard from "../global/SubscriptionCard";
import type { SubscriptionEntity } from "../../../types/maasTypes";

export interface ModelActiveSubscriptionsProps {
  enabledInActiveSubscriptions: SubscriptionEntity[];
  hasActiveSubscriptions: boolean;
  onNavigateToSubscription: (subscriptionId: string) => void;
  onCreateSubscription: () => void;
  onRequestAccess: () => void;
}

const ModelActiveSubscriptions: React.FC<ModelActiveSubscriptionsProps> = ({
  enabledInActiveSubscriptions,
  hasActiveSubscriptions,
  onNavigateToSubscription,
  onCreateSubscription,
  onRequestAccess,
}) => {
  const { t } = useTranslation("subscriptions");

  return (
    <div
      id="tab-panel-subscriptions"
      aria-labelledby="subscriptions-heading"
      className="flex flex-col gap-5"
    >
      <h3 id="subscriptions-heading" className="text-lg font-normal font-body">
        {t("modelDetails.sections.activeSubscriptions")}
      </h3>

      {enabledInActiveSubscriptions.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {enabledInActiveSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onClick={() => onNavigateToSubscription(subscription.id)}
            />
          ))}
        </div>
      ) : !hasActiveSubscriptions ? (
        <div className="flex items-center justify-between border-2 border-gray-500 rounded-xl p-6  bg-gray-700">
          <p className="text-md text-gray-300 mb-4">
            {t("modelDetails.noActiveSubscriptions")}
          </p>
          <button
            data-testid="create-subscription-button"
            className="ml-auto mr-0 mt-aut text-sm font-body px-4 py-2 flex bg-white-100 hover:bg-red-600 hover:text-white-100 text-gray-700 font-semibold
            transition-color duration-300 ease-out rounded-full w-auto text-center place-content-center"
            onClick={onCreateSubscription}
            aria-label={t("modelDetails.actions.createSubscription")}
          >
            {t("modelDetails.actions.createSubscription")}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between border-2 border-gray-500 rounded-xl p-6  bg-gray-700">
          <p className="text-md text-gray-300 mb-4">
            {t("modelDetails.noModelActiveSubscriptions")}
          </p>
          <button
            data-testid="create-subscription-button"
            className="ml-auto mr-0 mt-aut text-sm font-body px-4 py-2 flex bg-white-100 hover:bg-red-600 hover:text-white-100 text-gray-700 font-semibold
          transition-color duration-300 ease-out rounded-full w-auto text-center place-content-center"
            onClick={onRequestAccess}
            aria-label={t("modelDetails.actions.requestAccess")}
          >
            {t("modelDetails.actions.requestAccess")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ModelActiveSubscriptions;
