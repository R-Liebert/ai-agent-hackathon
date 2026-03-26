import type { TFunction } from "i18next";
import type { IconType } from "react-icons";
import {
  TbAntennaBars5,
  TbActivity,
  TbTransactionDollar,
  TbSparkles,
  TbCircleCheck,
  TbCircleX,
} from "react-icons/tb";
import type {
  SubscriptionEntity,
  SubscriptionModel,
  MetrixKey,
  MetrixItem,
} from "../../types/maasTypes";

/**
 * Shared metric keys across subscription and model views.
 */

export const METRIX_ICON_MAP: Record<MetrixKey, IconType> = {
  // Subscription-level
  totalTokens: TbAntennaBars5,
  totalRequests: TbActivity,
  totalCost: TbTransactionDollar,
  averageTokensPerRequest: TbSparkles,
  successfulRequests: TbCircleCheck,
  failedRequests: TbCircleX,
  // Model-level
  contextWindow: TbAntennaBars5,
  inputPricePerThousand: TbTransactionDollar,
  outputPricePerThousand: TbTransactionDollar,
  activeSubscriptionsForModel: TbActivity,
};

export const METRIX_ICON_COLOR_MAP: Record<MetrixKey, string> = {
  // Subscription-level
  totalTokens: "#DF5FCE",
  totalRequests: "#787AFF",
  totalCost: "#F89973",
  averageTokensPerRequest: "#B7E561",
  successfulRequests: "#22C55E",
  failedRequests: "#EF4444",
  // Model-level
  contextWindow: "#DF5FCE",
  inputPricePerThousand: "#B7E561",
  outputPricePerThousand: "#F89973",
  activeSubscriptionsForModel: "#787AFF",
};

/** Formatting helpers (exported for reuse) */
export const formatInt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("da-DK") : "—";

export const formatTokensPerRequest = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString("da-DK", { maximumFractionDigits: 2 })
    : "—";

export const formatCurrencyDKK = (amount: number) =>
  Number.isFinite(amount)
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 2,
      }).format(amount)
    : "—";

export type MetrixColorOverrides = Partial<Record<MetrixKey, string>>;

/** Subscription cost estimate helper */
export const estimateCostFromModels = (
  models: SubscriptionModel[] | undefined,
  totalTokens: number,
): number => {
  if (!models || models.length === 0) return 0;
  const firstEnabled = models.find((m) => m.enabled) ?? models[0];
  const blendedPerThousand =
    (firstEnabled.pricingInput + firstEnabled.pricingOutput) / 2;
  return blendedPerThousand * (totalTokens / 1000);
};

/* =========================
   Subscription-level builder
   ========================= */

/**
 * Builds the four subscription metrics:
 * - totalTokens
 * - totalRequests
 * - totalCost (stored or estimated)
 * - averageTokensPerRequest
 */

const isSuccessfulStatus = (status: unknown): boolean => {
  if (typeof status === "number") return status >= 200 && status < 400;
  if (typeof status === "string") {
    const s = status.toUpperCase();
    // Expand this set if backend adds more success labels
    return s === "SUCCESS" || s === "OK" || s === "ACCEPTED";
  }
  return false;
};

export const buildSubscriptionMetrix = (
  subscription: SubscriptionEntity,
  t: TFunction<"subscriptions">,
  colorOverrides?: MetrixColorOverrides,
): MetrixItem[] => {
  const totalTokens = subscription?.tokenUsage?.used ?? 0;

  // Prefer authoritative total if present, else count apiRequests
  const apiReqs = Array.isArray(subscription?.apiRequests)
    ? subscription.apiRequests
    : [];
  const derivedTotalFromApi = apiReqs.length;

  const totalRequests =
    subscription?.requestStats?.totalRequests ??
    (Number.isFinite(derivedTotalFromApi) ? derivedTotalFromApi : 0);

  // Derive successes from apiRequests when possible; else use requestStats.successfulRequests if provided.
  const derivedSuccessFromApi = apiReqs.reduce(
    (acc, r: any) => acc + (isSuccessfulStatus(r?.responseStatus) ? 1 : 0),
    0,
  );

  const successfulRequests =
    subscription?.requestStats?.successfulRequests ??
    (derivedTotalFromApi > 0 ? derivedSuccessFromApi : 0);

  // Failures: prefer explicit requestStats.failedRequests, else derive from statuses if api present,
  // else fall back to (total - success), clamped at 0.
  const derivedFailedFromApi =
    derivedTotalFromApi > 0
      ? derivedTotalFromApi - derivedSuccessFromApi
      : Number.NaN;

  const failedRequests =
    subscription?.requestStats?.failedRequests ??
    (Number.isFinite(derivedFailedFromApi)
      ? derivedFailedFromApi
      : Math.max((totalRequests ?? 0) - (successfulRequests ?? 0), 0));

  // Cost and averages unchanged
  const totalCost = estimateCostFromModels(subscription?.models, totalTokens);
  const avg = totalRequests > 0 ? totalTokens / totalRequests : Number.NaN;

  const colorFor = (key: MetrixKey) =>
    colorOverrides?.[key] ?? METRIX_ICON_COLOR_MAP[key];

  return [
    {
      key: "totalTokens",
      label: t("subscriptionDetails.metrix.totalTokens"),
      value: formatInt(totalTokens),
      Icon: METRIX_ICON_MAP.totalTokens,
      iconColor: colorFor("totalTokens"),
    },
    {
      key: "totalRequests",
      label: t("subscriptionDetails.metrix.totalRequests"),
      value: formatInt(totalRequests),
      Icon: METRIX_ICON_MAP.totalRequests,
      iconColor: colorFor("totalRequests"),
    },
    {
      key: "successfulRequests",
      label: t("subscriptionDetails.metrix.successfulRequests"),
      value: formatInt(successfulRequests),
      Icon: METRIX_ICON_MAP.successfulRequests,
      iconColor: colorFor("successfulRequests"),
    },
    {
      key: "failedRequests",
      label: t("subscriptionDetails.metrix.failedRequests"),
      value: formatInt(failedRequests),
      Icon: METRIX_ICON_MAP.failedRequests,
      iconColor: colorFor("failedRequests"),
    },
    /*{
      key: "totalCost",
      label: t("subscriptionDetails.metrix.totalCost"),
      value: formatCurrencyDKK(totalCost),
      Icon: METRIX_ICON_MAP.totalCost,
      iconColor: colorFor("totalCost"),
    },
    {
      key: "averageTokensPerRequest",
      label: t("subscriptionDetails.metrix.averageTokensPerRequest"),
      value: formatTokensPerRequest(avg),
      Icon: METRIX_ICON_MAP.averageTokensPerRequest,
      iconColor: colorFor("averageTokensPerRequest"),
    },*/
  ];
};

/* =========================
   Admin-level builder
   ========================= */

export const buildAdminMetrix = (
  subscriptions: SubscriptionEntity[] | undefined,
  t: TFunction<"subscriptions">,
  colorOverrides?: MetrixColorOverrides,
): MetrixItem[] => {
  const subs = Array.isArray(subscriptions) ? subscriptions : [];

  let totalTokens = 0;
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let totalCost = 0;

  for (const s of subs) {
    const used = s?.tokenUsage?.used ?? 0;
    totalTokens += used;

    const tr = s?.requestStats?.totalRequests ?? 0;
    const sr = s?.requestStats?.successfulRequests ?? 0;
    const fr = s?.requestStats?.failedRequests ?? 0;

    totalRequests += tr;
    successfulRequests += sr;
    failedRequests += fr;

    // Keep behavior consistent with subscription builder: estimate from tokens & models
    totalCost += estimateCostFromModels(s?.models, used);
  }

  const avg = totalRequests > 0 ? totalTokens / totalRequests : Number.NaN;

  const colorFor = (key: MetrixKey) =>
    (colorOverrides?.[key] ?? METRIX_ICON_COLOR_MAP[key]) as string;

  return [
    {
      key: "totalTokens",
      label: t("adminDashboard.metrix.totalTokens"),
      value: formatInt(totalTokens),
      Icon: METRIX_ICON_MAP.totalTokens,
      iconColor: colorFor("totalTokens"),
    },
    {
      key: "totalRequests",
      label: t("adminDashboard.metrix.totalRequests"),
      value: formatInt(totalRequests),
      Icon: METRIX_ICON_MAP.totalRequests,
      iconColor: colorFor("totalRequests"),
    },
    {
      key: "successfulRequests",
      label: t("adminDashboard.metrix.successfulRequests"),
      value: formatInt(successfulRequests),
      Icon: METRIX_ICON_MAP.successfulRequests,
      iconColor: colorFor("successfulRequests"),
    },
    {
      key: "failedRequests",
      label: t("adminDashboard.metrix.failedRequests"),
      value: formatInt(failedRequests),
      Icon: METRIX_ICON_MAP.failedRequests,
      iconColor: colorFor("failedRequests"),
    },
    /*{
      key: "totalCost",
      label: t("adminDashboard.metrix.totalCost"),
      value: formatCurrencyDKK(totalCost),
      Icon: METRIX_ICON_MAP.totalCost,
      iconColor: colorFor("totalCost"),
    },
    {
      key: "averageTokensPerRequest",
      label: t("adminDashboard.metrix.averageTokensPerRequest"),
      value: formatTokensPerRequest(avg),
      Icon: METRIX_ICON_MAP.averageTokensPerRequest,
      iconColor: colorFor("averageTokensPerRequest"),
    },*/
  ];
};

/* =====================
   Model-level builder
   ===================== */

export interface BuildModelMetrixItemsArgs {
  model: {
    key: string;
    name: string;
    provider: string;
    contextWindow?: number;
    pricingInput?: number; // DKK per 1K tokens
    pricingOutput?: number; // DKK per 1K tokens
  };
  t: TFunction<"subscriptions">;
  // Active subscriptions that include this model
  associatedActiveSubscriptions: Array<SubscriptionEntity>;
  // Optional: active subscriptions where the model is enabled
  enabledInActiveSubscriptions?: Array<SubscriptionEntity>;
  colorOverrides?: MetrixColorOverrides;
}

const pricePerThousand = (amount?: number): string => {
  if (!Number.isFinite(amount!)) return "—";
  return `${amount} / 1K tokens`;
};

/**
 * Builds the four model metrics:
 * - contextWindow
 * - inputPricePerThousand
 * - outputPricePerThousand
 * - activeSubscriptionsForModel
 */

export const buildModelMetrix = ({
  model,
  t,
  associatedActiveSubscriptions,
  enabledInActiveSubscriptions,
  colorOverrides,
}: BuildModelMetrixItemsArgs): MetrixItem[] => {
  const contextWindow = Number.isFinite(model.contextWindow!)
    ? model.contextWindow!
    : Number.NaN;
  const inputPrice = Number.isFinite(model.pricingInput!)
    ? model.pricingInput!
    : Number.NaN;
  const outputPrice = Number.isFinite(model.pricingOutput!)
    ? model.pricingOutput!
    : Number.NaN;

  const activeAssociatedCount = associatedActiveSubscriptions?.length ?? 0;
  const activeEnabledCount = enabledInActiveSubscriptions?.length ?? 0;

  const colorFor = (key: MetrixKey) =>
    colorOverrides?.[key] ?? METRIX_ICON_COLOR_MAP[key];

  return [
    {
      key: "contextWindow",
      label: t("modelDetails.metrix.contextWindow"),
      value: formatInt(contextWindow),
      Icon: METRIX_ICON_MAP.contextWindow,
      iconColor: colorFor("contextWindow"),
    },
    {
      key: "inputPricePerThousand",
      label: t("modelDetails.metrix.inputPricePerThousand"),
      value: pricePerThousand(inputPrice),
      Icon: METRIX_ICON_MAP.inputPricePerThousand,
      iconColor: colorFor("inputPricePerThousand"),
    },
    {
      key: "outputPricePerThousand",
      label: t("modelDetails.metrix.outputPricePerThousand"),
      value: pricePerThousand(outputPrice),
      Icon: METRIX_ICON_MAP.outputPricePerThousand,
      iconColor: colorFor("outputPricePerThousand"),
    },
    {
      key: "activeSubscriptionsForModel",
      label: t("modelDetails.metrix.activeSubscriptionsForModel"),
      value: formatInt(activeAssociatedCount),
      Icon: METRIX_ICON_MAP.activeSubscriptionsForModel,
      iconColor: colorFor("activeSubscriptionsForModel"),
    },
  ];
};

export const buildMetrixItems = buildSubscriptionMetrix;
