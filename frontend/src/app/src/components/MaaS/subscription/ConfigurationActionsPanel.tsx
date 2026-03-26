import React from "react";
import { useTranslation } from "react-i18next";
import type { SubscriptionEntity } from "../../../types/maasTypes";

interface ConfigurationActionsPanelProps {
  entity: SubscriptionEntity;
  onAction: (
    action: "deactivate" | "delete" | "reactivate",
    subscription: SubscriptionEntity,
  ) => void;
}

const ConfigurationActionsPanel: React.FC<ConfigurationActionsPanelProps> = ({
  entity,
  onAction,
}) => {
  const { t } = useTranslation("subscriptions");

  const isDeactivated = entity.status === "BLOCKED";

  return (
    <div className="flex flex-col gap-8">
      {/* Reactivate or Deactivate Action */}
      <div className="inline-flex justify-between items-center border-b-2 border-gray-500 pb-6">
        <div className="flex flex-col font-body">
          <span className="text-lg font-normal">
            {isDeactivated
              ? t(
                  "subscription-configuration.sections.actions.reactivate.title",
                  { defaultValue: "Reactivate Subscription" },
                )
              : t(
                  "subscription-configuration.sections.actions.deactivate.title",
                  { defaultValue: "Deactivate Subscription" },
                )}
          </span>
          <span className="text-md text-gray-300">
            {isDeactivated
              ? t(
                  "subscription-configuration.sections.actions.reactivate.description",
                  {
                    defaultValue:
                      "Reactivate this subscription to make it active again.",
                  },
                )
              : t(
                  "subscription-configuration.sections.actions.deactivate.description",
                  {
                    defaultValue:
                      "Deactivate this subscription to prevent further usage.",
                  },
                )}
          </span>
        </div>
        <button
          type="button"
          className={`inline-flex self-start w-full sm:w-auto mt-4 sm:mt-0 rounded-full px-3 py-2 text-[14px] bg-gray-400 hover:bg-gray-600
           text-white-100 font-normal transition-colors duration-300 ease-in-out items-center justify-center`}
          onClick={() =>
            onAction(isDeactivated ? "reactivate" : "deactivate", entity)
          }
        >
          {isDeactivated
            ? t(
                "subscription-configuration.sections.actions.reactivate.button",
                { defaultValue: "Reactivate" },
              )
            : t(
                "subscription-configuration.sections.actions.deactivate.button",
                { defaultValue: "Deactivate" },
              )}
        </button>
      </div>

      {/* Delete Action */}
      <div className="inline-flex justify-between items-center">
        <div className="flex flex-col font-body">
          <span className="text-lg font-normal">
            {t("subscription-configuration.sections.actions.delete.title", {
              defaultValue: "Delete Subscription",
            })}
          </span>
          <span className="text-md text-gray-300">
            {t(
              "subscription-configuration.sections.actions.delete.description",
              {
                defaultValue:
                  "Permanently delete this subscription. This action cannot be undone.",
              },
            )}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex self-start w-full sm:w-auto mt-4 sm:mt-0 rounded-full px-3 py-2 text-[14px] bg-red-700 text-white-100 font-normal transition-colors duration-300 ease-in-out items-center justify-center"
          onClick={() => onAction("delete", entity)}
        >
          {t("subscription-configuration.sections.actions.delete.button", {
            defaultValue: "Delete",
          })}
        </button>
      </div>
    </div>
  );
};

export default ConfigurationActionsPanel;
