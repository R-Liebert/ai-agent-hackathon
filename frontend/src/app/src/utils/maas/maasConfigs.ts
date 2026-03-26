import {
  Model,
  ModelKey,
  TokenUsage,
  Guardrail,
  RequestStats,
  CostStats,
  ModelStatus,
  RequestStatus,
  GuardrailParamMeta,
} from "../../types/maasTypes";
import type {
  SubscriptionStatus as SubscriptionStatusType,
  NotificationItem,
  GuardrailKey,
  SubscriptionGuardrail,
  ModelGuardrail,
  SubscriptionNotification,
} from "../../types/maasTypes";
import type { TFunction } from "i18next";

/* Token usage defaults per subscription type */
export const DEFAULT_TOKEN_USAGE: Record<"SANDBOX" | "NORMAL", TokenUsage> = {
  SANDBOX: { granted: 100_000, used: 0, period: "rolling_30d" },
  NORMAL: { granted: 1_000_000, used: 0, period: "monthly" },
};

/* Guardrails */

export const GUARDRAILS_CATALOG: Record<GuardrailKey, Guardrail> = {
  "azure-prompt-shield": {
    key: "azure-prompt-shield",
    defaultEnabledSubscription: false,
    defaultEnforcedModel: false,
  },
  "azure-text-moderation": {
    key: "azure-text-moderation",
    defaultEnabledSubscription: false,
    defaultEnforcedModel: false,
  },
  "litellm-content-filter": {
    key: "litellm-content-filter",
    defaultEnabledSubscription: false,
    defaultEnforcedModel: true,
  },
  "bedrock-pre-guard": {
    key: "bedrock-pre-guard",
    defaultEnabledSubscription: false,
    defaultEnforcedModel: true,
  },
  "safety-alignment": {
    key: "safety-alignment",
    defaultEnabledSubscription: false,
    defaultEnforcedModel: false,
  },
  "embedding-quality-assurance": {
    key: "embedding-quality-assurance",
    defaultEnabledSubscription: false,
    defaultEnforcedModel: false,
  },
};
export const GUARDRAIL_NAME_TO_KEY: Record<string, GuardrailKey> = {
  "Azure Prompt Shield": "azure-prompt-shield",
  "Azure Text Moderation": "azure-text-moderation",
  "LiteLLM Content Filter": "litellm-content-filter",
  "Bedrock Pre Guard": "bedrock-pre-guard",
  "Safety Alignment": "safety-alignment",
  "Embedding Quality Assurance": "embedding-quality-assurance",
};

export const makeSubscriptionGuardrails = (
  subscriptionId: string,
): SubscriptionGuardrail[] =>
  Object.values(GUARDRAILS_CATALOG).map((meta) => ({
    ...meta,
    scope: "SUBSCRIPTION" as const,
    subscriptionId,
    enabled: meta.defaultEnabledSubscription,
  }));

export const makeModelGuardrails = (modelKey: ModelKey): ModelGuardrail[] =>
  Object.values(GUARDRAILS_CATALOG).map((meta) => ({
    ...meta,
    scope: "MODEL" as const,
    modelKey,
    enforced: meta.defaultEnforcedModel,
  }));

export const mapApiParamTypeToMetaType = (
  apiType: string,
): GuardrailParamMeta["type"] => {
  const t = apiType.toLowerCase();
  if (["float", "double", "int", "integer", "number"].includes(t))
    return "number";
  if (t === "boolean" || t === "bool") return "boolean";
  if (t === "string") return "string";
  return "unknown";
};

export const mapApiParamsToMeta = (
  params: any[] | undefined,
): GuardrailParamMeta[] => {
  if (!Array.isArray(params)) return [];
  return params.map((p) => ({
    name: String(p.name),
    type: mapApiParamTypeToMetaType(String(p.type)),
    description: typeof p.description === "string" ? p.description : undefined,
  }));
};

export function buildGuardrailFromApi(
  key: GuardrailKey,
  apiGuardrail: any,
): Guardrail {
  const base = GUARDRAILS_CATALOG[key];
  const params = mapApiParamsToMeta(apiGuardrail.guardrail_info?.params);

  // Guardrail key is NOT in the static catalog – build a generic one
  if (!base) {
    const guardrail: Guardrail = {
      key,
      defaultEnabledSubscription: false,
      defaultEnforcedModel: false,
    };

    if (params.length > 0) {
      guardrail.params = params;
    }

    return guardrail;
  }

  // Guardrail key is in the static catalog – enrich it with params if present
  return {
    ...base,
    ...(params.length > 0 ? { params } : {}),
  };
}

export const formatDate = (ts?: number) => {
  if (typeof ts !== "number" || Number.isNaN(ts)) return "-";
  try {
    return new Date(ts).toLocaleDateString("da-DK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

export const DEFAULT_REQUEST_STATS: Record<"SANDBOX" | "NORMAL", RequestStats> =
  {
    SANDBOX: { totalRequests: 0, successfulRequests: 0, failedRequests: 0 },
    NORMAL: { totalRequests: 0, successfulRequests: 0, failedRequests: 0 },
  };

export const DEFAULT_COST_STATS: Record<"SANDBOX" | "NORMAL", CostStats> = {
  SANDBOX: { currency: "USD", totalCost: 0 },
  NORMAL: { currency: "USD", totalCost: 0 },
};

const STATUS_LABEL_KEYS: Record<SubscriptionStatusType, string> = {
  ACTIVE: "subscriptionDetails.subscriptionStatusLabel.active",
  PENDING_APPROVAL:
    "subscriptionDetails.subscriptionStatusLabel.pendingApproval",
  FAILED: "subscriptionDetails.subscriptionStatusLabel.failed",
  CANCELLED: "subscriptionDetails.subscriptionStatusLabel.cancelled",
  DEACTIVATED: "subscriptionDetails.subscriptionStatusLabel.deactivated",
  BLOCKED: "subscriptionDetails.subscriptionStatusLabel.blocked",
};

const MODEL_STATUS_LABEL_KEYS: Record<ModelStatus, string> = {
  ACTIVE: "modelDetails.statusLabel.active",
  DISABLED: "modelDetails.statusLabel.disabled",
};

const REQUEST_STATUS_LABEL_KEYS: Record<RequestStatus, string> = {
  PENDING: "subscriptionDetails.requestCard.status.pending",
  APPROVED: "subscriptionDetails.requestCard.status.approved",
  DECLINED: "subscriptionDetails.requestCard.status.declined",
};

export const labelForRequestStatus = (t: TFunction, status: string): string => {
  const key = REQUEST_STATUS_LABEL_KEYS[status as RequestStatus];
  if (key) return t(key);

  // Fallback for unknown values
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
};

export const labelForModelStatus = (t: TFunction, status: string): string => {
  const key = MODEL_STATUS_LABEL_KEYS[status as ModelStatus];
  if (key) return t(key);

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
};

export const labelForStatus = (t: TFunction, status: string): string => {
  if (status === "ALL") {
    // Special filter value
    return t("discovery.filters.all");
  }
  const key = STATUS_LABEL_KEYS[status as SubscriptionStatusType];
  if (key) return t(key);

  // Graceful fallback for unknown values
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
};

/* ============================
 * Unified Scoped Helper (SIMPLE)
 * ============================ */
export const labelForStatusScoped = (
  t: TFunction,
  status: string,
  scope: "subscription" | "model" | "request",
): string => {
  switch (scope) {
    case "subscription":
      return labelForStatus(t, status);
    case "model":
      return labelForModelStatus(t, status);
    case "request":
      return labelForRequestStatus(t, status);
    default:
      // Graceful fallback
      return status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase());
  }
};

/* ============================
 *  Notifications
 * ============================ */

// Demo-friendly timestamps relative to "now"
const NOW_TS = Date.now();

export const DEFAULT_NOTIFICATIONS: Record<
  "SANDBOX" | "NORMAL",
  NotificationItem[]
> = {
  SANDBOX: [
    {
      id: "sb-001",
      text: "Sandbox token grants reset completed successfully.",
      timestamp: NOW_TS - 90 * 60 * 1000,
    },
    {
      id: "sb-002",
      text: "Input validation blocked an unsafe pattern in a prompt.",
      timestamp: NOW_TS - 3 * 60 * 60 * 1000,
    },
  ],
  NORMAL: [
    {
      id: "demo-001",
      text: "Usage is approaching your monthly token grant.",
      timestamp: NOW_TS - 25 * 60 * 1000,
    },
    {
      id: "demo-002",
      text: "Model gpt-5 is experiencing elevated latency in eu-west-1.",
      timestamp: NOW_TS - 2 * 60 * 60 * 1000,
    },
  ],
};

export const getDefaultNotificationsForType = (
  type: "SANDBOX" | "NORMAL",
): NotificationItem[] => DEFAULT_NOTIFICATIONS[type] ?? [];

export const makeSubscriptionNotifications = (
  subscriptionId: string,
  type: "SANDBOX" | "NORMAL",
): SubscriptionNotification[] =>
  getDefaultNotificationsForType(type).map((n) => ({
    ...n,
    scope: "SUBSCRIPTION",
    subscriptionId,
  }));

/* ============================
 *  Default Assembly (requires subscriptionId)
 * ============================ */

// Overloads
export function getDefaultsForType(
  type: "SANDBOX" | "NORMAL",
  subscriptionId: string,
): {
  models: Model[];
  tokenUsage: TokenUsage;
  guardrails: SubscriptionGuardrail[] | Guardrail[];
  requestStats: RequestStats;
  costStats: CostStats;
  notifications: SubscriptionNotification[] | NotificationItem[];
};

export function getDefaultsForType(type: "SANDBOX" | "NORMAL"): {
  models: Model[];
  tokenUsage: TokenUsage;
  guardrails: Guardrail[]; // base templates
  requestStats: RequestStats;
  costStats: CostStats;
  notifications: NotificationItem[]; // base templates
};

// Implementation
export function getDefaultsForType(
  type: "SANDBOX" | "NORMAL",
  subscriptionId?: string,
) {
  if (subscriptionId) {
    return {
      tokenUsage: DEFAULT_TOKEN_USAGE[type],
      guardrails: [] as SubscriptionGuardrail[], // no subscription-level defaults
      requestStats: DEFAULT_REQUEST_STATS[type],
      costStats: DEFAULT_COST_STATS[type],
    };
  }

  // Backward-compat mode (return base templates)
  // NOTE: Log a deprecation warning in dev if you like.
  return {
    ///models: getDefaultModelsForType(type),
    tokenUsage: DEFAULT_TOKEN_USAGE[type],
    // Base templates, to be mapped by the store
    guardrails: Object.values(GUARDRAILS_CATALOG),
    requestStats: DEFAULT_REQUEST_STATS[type],
    costStats: DEFAULT_COST_STATS[type],
    notifications: getDefaultNotificationsForType(type),
  };
}
