import React from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionsStore } from "../../../stores/maasStore";
import { Model } from "../../../types/maasTypes";
import AppContentCopy from "../../Global/AppContentCopy";
import handleCopyContent from "../../../utils/handleCopyContent";
import { useTranslation } from "react-i18next";
import MetrixGrid from "./MetrixGrid";
import type { MetrixItem } from "../../../types/maasTypes";
import getModelDisplayName from "../../../utils/maas/modelDisplay";

interface ModelCardProps {
  model: Model;
  iconButtonClass?: string;
  variant?: "detail" | "discovery" | "modelDetail";
  modelMetrixItems?: MetrixItem[];
}

export default function ModelCard({
  model,
  iconButtonClass = "",
  variant = "detail",
  modelMetrixItems,
}: ModelCardProps) {
  const { t } = useTranslation("subscriptions");
  const navigate = useNavigate();

  // Get the route generator function from the store
  const getModelRouteForKey = useSubscriptionsStore(
    (state) => (state as any).getModelRouteForKey,
  );

  // Handle card click to navigate to the model detail page
  const handleModelCardClick = () => {
    const path = getModelRouteForKey(model.key);
    navigate(path);
  };

  const formatPricePerK = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "DKK",
      maximumFractionDigits: 2,
    }).format(v) + " / 1k tokens";

  const formatPrice = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "DKK",
      maximumFractionDigits: 3,
    }).format(v);

  const activeSubscriptionGuardrails = Array.isArray(model.guardrails)
    ? model.guardrails.filter((guardrail) => guardrail.enforced)
    : [];

  const displayName = getModelDisplayName(model);

  // Discovery variant
  if (variant === "discovery") {
    return (
      <article
        className={`flex flex-col gap-4 border border-gray-600 bg-gray-700 rounded-xl px-5 py-4 transition-colors hover:bg-gray-750 cursor-pointer`}
        aria-labelledby={`model-${model.key}-disc`}
        onClick={handleModelCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleModelCardClick();
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col !font-body">
            <h4
              id={`model-${model.key}-disc`}
              className="font-normal text-white-100 capitalize"
            >
              {displayName}
            </h4>
            <span className="text-xs text-gray-300 whitespace-nowrap">
              {formatPricePerK(model.pricingInput)}
            </span>
          </div>
          <span className="text-xs px-3 py-2 flex items-center justify-center rounded-full capitalize bg-gray-600 text-white-100 mt-2">
            {model.provider.toLowerCase()}
          </span>
        </div>
        <p className="text-[15px] !font-body text-gray-300">
          {model.description}
        </p>
        {model.capabilities?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {model.capabilities.map((c, i) => (
              <span
                key={i}
                className="text-xs px-3 py-[6px] rounded-full bg-gray-600 text-white-100 capitalize"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </article>
    );
  }

  // Model Details variant
  if (variant === "modelDetail") {
    return (
      <article
        className="flex flex-col border-2 border-gray-500 bg-gray-700 rounded-2xl px-6 py-8 cursor-pointer"
        aria-labelledby={`model-detail-${model.key}`}
        onClick={handleModelCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleModelCardClick();
          }
        }}
      >
        {/* Endpoint URL */}
        <div className="flex justify-between items-center pb-6 w-full border-b-2 border-gray-500">
          <div className="flex flex-col">
            <h5 className="text-md font-light font-body text-white-100">
              {t("modelDetails.sections.endpointUrl")}
            </h5>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-sm px-4 py-2 rounded-lg font-mono bg-gray-600 text-white-100 border border-gray-600">
              {model.endpointUrl}
            </span>
            <AppContentCopy
              handleCopyContent={({ setMessageCopyOk }) =>
                handleCopyContent({
                  htmlToCopy: model.endpointUrl!,
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
              htmlToCopy={model.endpointUrl}
              tooltipText={t("subscriptionDetails.apiAccess.actions.copy")}
            />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col pt-6 gap-4">
          <h5 className="text-md font-light font-body text-white-100">
            {t("modelDetails.sections.capabilities")}
          </h5>
          <p className="text-md !font-body text-gray-300 w-full">
            {model.description}
          </p>
          {model.capabilities?.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {model.capabilities.map((capability, index) => (
                <span
                  key={index}
                  className="text-sm px-4 py-2 !font-body rounded-full capitalize bg-gray-600 text-white-100"
                >
                  {capability}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    );
  }

  // Subscription Details page model card (detail variant)
  return (
    <article
      className="flex flex-col border-2 border-gray-500 bg-gray-700 rounded-2xl px-6 py-5 cursor-pointer"
      aria-labelledby={`model-${model.key}`}
      onClick={handleModelCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleModelCardClick();
        }
      }}
    >
      {/* Name, description, status, provider */}
      <div className="flex justify-between items-start pb-8 border-b-2 border-gray-500">
        <div className="flex flex-col">
          <h4
            id={`model-${model.key}`}
            className="text-lg font-normal font-body text-white-100 truncate"
          >
            {model.name}
          </h4>
          <p className="text-md font-body text-gray-300 mt-4">
            {model.description}
          </p>
        </div>
        <div className="flex gap-4 items-end">
          <span
            className={`text-sm px-4 py-2 rounded-full capitalize ${
              model.status === "ACTIVE"
                ? "bg-gray-600 text-white-100"
                : "bg-red-600 text-white"
            }`}
          >
            {model.status.toLowerCase()}
          </span>
          <span className="text-sm px-4 py-2 rounded-full capitalize bg-gray-600 text-white-100 mt-2">
            {model.provider.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Endpoint URL */}
      <div className="flex justify-between items-center py-6 w-full border-b-2 border-gray-500">
        <div className="flex flex-col">
          <h4 className="text-md font-light font-body text-white-100 truncate">
            {t("subscriptionDetails.sectionTitles.endpointUrl")}
          </h4>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-md px-4 py-2 rounded-lg flex items-center w-auto capitalize bg-gray-600 text-white-100">
            {model.endpointUrl}
          </span>
          <AppContentCopy
            handleCopyContent={({ setMessageCopyOk }) =>
              handleCopyContent({
                htmlToCopy: model.endpointUrl!,
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
            htmlToCopy={model.endpointUrl}
            tooltipText={t("subscriptionDetails.apiAccess.actions.copy")}
          />
        </div>
      </div>

      {/* Capabilities */}
      {model.capabilities?.length > 0 && (
        <div className="flex justify-between items-center pt-4 pb-7 border-b-2 border-gray-500">
          <div className="flex flex-col">
            <h4 className="text-md font-light font-body text-white-100 truncate">
              {t("subscriptionDetails.sectionTitles.capabilities")}
            </h4>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex gap-4 text-xs text-gray-400 mt-3">
              {model.capabilities.map((item, index) => (
                <span
                  key={index}
                  className="text-sm gap-4 px-4 py-2 rounded-full capitalize bg-gray-600 text-white-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Model Guardrails */}
      {activeSubscriptionGuardrails.length > 0 && (
        <div className="flex justify-between items-center pt-4 pb-7 border-b-2 border-gray-500">
          <div className="flex flex-col">
            <h4 className="text-md font-light font-body text-white-100 truncate">
              {t("subscriptionDetails.sectionTitles.activeGuardrails")}
            </h4>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex gap-4 text-xs text-gray-400 mt-3">
              {activeSubscriptionGuardrails.map((guardrail, index) => {
                const name = t(
                  `common.guardrails.${guardrail.key}.title`,
                  guardrail.key,
                );
                return (
                  <span
                    key={index}
                    className="text-sm gap-4 px-4 py-2 rounded-full capitalize bg-gray-600 text-white-100"
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Metrics (provided by parent) */}
      {modelMetrixItems && modelMetrixItems.length > 0 && (
        <div className="flex flex-col pt-8 pb-4">
          <MetrixGrid items={modelMetrixItems} />
        </div>
      )}
    </article>
  );
}
