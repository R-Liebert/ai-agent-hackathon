import {
  maasService,
  subscriptionDetailEnrichers,
  enricherStatus,
  enricherCacheKey,
  invalidateAllSubscriptionEnrichers,
  invalidateSubscriptionEnrichers,
  postSubscriptionAdminTransaction,
} from "../services/maasService";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  SubscriptionEntity,
  SubscriptionStatus,
  NormalFormValues,
  SandboxFormValues,
  AdminState,
  Model,
  SubscriptionModel,
  NotificationItem,
  SubscriptionNotification,
  ModelNotification,
  ModelKey,
  Guardrail,
  SubmittedRequest,
  RequestStatus,
  RequestType,
  ApiRequestLog,
  GuardrailKey,
  ModelGuardrail,
  AdminActionEntry,
  AdminAction,
  ApplicationReference,
  AdGroupReference,
  SubscriptionEnricherKey,
  GuardrailNotificationBufferEntry,
} from "../types/maasTypes";
import { estimateCostFromModels } from "../utils/maas/buildMetrix";
import {
  getDefaultsForType,
  buildGuardrailFromApi,
  GUARDRAILS_CATALOG,
  GUARDRAIL_NAME_TO_KEY,
} from "../utils/maas/maasConfigs";
import { generateApiKey as genKey } from "../utils/maas/generateSubscriptionApiKey";
import { secretsVault } from "../utils/maas/subscriptionSecretVaults";
import { buildModelSlug } from "../utils/slugify";
import { useUserStore } from "./userStore";

type Id = string;

const NOTIFICATION_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const now = () => Date.now();
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const wait = async (min: number, max: number) => {
  const d = Math.floor(Math.random() * (max - min + 1)) + min;
  await sleep(d);
};
const genId = (): Id => uuidv4();

const addMonths = (ts: number, months: number): number => {
  const d = new Date(ts);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
};

const isExpired = (n: NotificationItem, nowTs: number) =>
  typeof n.firstSeenAt === "number" &&
  nowTs - n.firstSeenAt >= NOTIFICATION_TTL_MS;

const notificationCache = new Map<
  string,
  { result: any[]; timestamp: number }
>();
const CACHE_DURATION = 100;

const MAX_API_REQUEST_LOGS = 1000; // cap to avoid localStorage bloat

const getCurrentUserEmail = (): string => {
  const user = useUserStore.getState().profile;
  return user?.email || "unknown@example.com";
};

const guardrailNotificationBuffer = new Map<
  string,
  GuardrailNotificationBufferEntry
>();

const queueGuardrailNotification = (
  subscriptionId: string,
  label: string, // e.g. "GPT-4 / SAFE_OUTPUT"
  enforced: boolean, // true => enabled, false => disabled
  get: () => SubscriptionsState,
) => {
  let entry = guardrailNotificationBuffer.get(subscriptionId);
  if (!entry) {
    entry = { added: [], removed: [] };
    guardrailNotificationBuffer.set(subscriptionId, entry);
  }

  if (enforced) {
    entry.added.push(label);
  } else {
    entry.removed.push(label);
  }

  // Already scheduled a flush for this subscription: just accumulate
  if (entry.timeoutId != null) return;

  // Schedule one flush for all pending guardrail changes for this subscription
  entry.timeoutId = window.setTimeout(() => {
    const current = guardrailNotificationBuffer.get(subscriptionId);
    if (!current) return;

    guardrailNotificationBuffer.delete(subscriptionId);

    const { added, removed } = current;

    // Helper to render lists nicely
    const formatList = (items: string[]): string => {
      if (!items.length) return "";
      if (items.length === 1) return items[0];
      return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
    };

    let text = "Guardrails updated.";
    const parts: string[] = [];

    if (added.length) {
      parts.push(`enabled: ${formatList(added)}`);
    }
    if (removed.length) {
      parts.push(`disabled: ${formatList(removed)}`);
    }

    if (parts.length) {
      text = `Guardrails updated (${parts.join("; ")}).`;
    }

    get().addNotification(subscriptionId, { text });
  }, 250); // 250 ms batching window; adjust as needed
};

/* ============================
 * NEW: Success classifier used for stats updates and migration
 * ============================ */
const isSuccessfulStatus = (status: unknown): boolean => {
  if (typeof status === "number") return status >= 200 && status < 400;
  if (typeof status === "string") {
    const s = status.toUpperCase();
    return (
      s === "SUCCESS" ||
      s === "OK" ||
      s === "ACCEPTED" ||
      s === "COMPLETED" ||
      s === "DONE"
    );
  }
  return false;
};

// Helpers to pick only that model which has name and description by default

const modelHasNameAndDescription = (model: Model): boolean => {
  const name = (model.name ?? "").trim();
  const description = (model.description ?? "").trim();
  return name.length > 0 && description.length > 0;
};

const pickFirstEligibleModel = (
  catalog: Record<string, Model>,
): Model | undefined => {
  return Object.values(catalog)
    .filter((m) => m.status === "ACTIVE" && modelHasNameAndDescription(m))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))[0];
};

interface SubscriptionsState {
  subscriptions: SubscriptionEntity[];
  lastCreatedId?: Id;
  config: { delayRangeMs: [number, number]; failureRate: number };
  admin: AdminState;
  fetchSubscriptions: () => Promise<void>;
  fetchAdminSubscriptions: () => Promise<void>;
  fetchModels: () => Promise<void>;
  beginCreateFlow: () => { id: Id; path: string };
  getCreateRouteForId: (id: Id) => string;
  addSubscription: (subscription: SubscriptionEntity) => void;
  createNormal: (
    values: NormalFormValues,
    idOverride?: Id,
  ) => Promise<SubscriptionEntity>;
  createSandbox: (
    values: SandboxFormValues,
    idOverride?: Id,
  ) => Promise<SubscriptionEntity>;
  updateStatus: (
    id: Id,
    status: SubscriptionStatus,
    justification?: string,
  ) => void;
  cancel: (id: Id) => void;
  getById: (id: Id) => SubscriptionEntity | undefined;
  resetLastCreated: () => void;
  incrementRequestCount: (id: Id, delta?: number) => void;
  setTotalCost: (id: Id, totalCost: number) => void;
  setTokenGranted: (id: Id, granted: number) => void;
  setTokenUsed: (id: Id, used: number) => void;
  adjustTokenUsed: (id: Id, deltaUsed: number) => void;
  generateApiKey: (
    id: string,
  ) => Promise<{ raw: string; last4: string; secretId: string }>;
  revealApiKey: (id: string) => string | null;
  regenerateApiKey: (
    id: string,
  ) => Promise<{ raw: string; last4: string; secretId: string }>;
  revokeApiKey: (id: string) => void;
  getModelRouteForKey: (modelKey: ModelKey) => string;
  getModelBySlug: (slug: string) => Model | undefined;
  addNotification: (
    subscriptionId: Id,
    input: Omit<
      NotificationItem,
      "id" | "timestamp" | "scope" | "subscriptionId"
    >,
  ) => void;
  markNotificationsSeen: (subscriptionId: Id, ids: string[]) => void;
  dismissNotification: (subscriptionId: Id, notificationId: string) => void;
  pruneNotifications: (subscriptionId: Id) => void;
  getActiveNotificationsForSubscription: (
    subscriptionId: Id,
  ) => SubscriptionNotification[];
  getActiveUnreadCount: (subscriptionId: Id) => number;
  hydrateNotifications: () => void;
  hydrateAdminActions: () => void;
  dismissSubscriptionNotification: (
    subscriptionId: Id,
    notificationId: string,
  ) => void;

  modelsCatalog: Record<string, Model>;
  getActiveModelNotifications: (modelKey: ModelKey) => ModelNotification[];
  dismissModelNotification: (
    modelKey: ModelKey,
    notificationId: string,
  ) => void;

  getMetrixById: (id: Id) =>
    | {
        totalTokens: number;
        totalRequests: number;
        totalCost: number;
        averageTokensPerRequest: number | null;
      }
    | undefined;

  activateSubscription: (id: string, justification?: string) => Promise<void>;
  deactivateSubscription: (
    id: Id,
    opts?: { justification?: string },
  ) => Promise<void>;
  reactivateSubscription: (
    id: Id,
    opts?: { justification?: string },
  ) => Promise<void>;

  // Requests
  submitRequest: (
    id: string,
    request: Omit<
      SubmittedRequest,
      "id" | "createdAt" | "status" | "subscriptionId"
    >,
  ) => void;
  getSubmittedRequests: (
    id: string,
    opts?: {
      type?: RequestType;
      status?: RequestStatus;
      sort?: "asc" | "desc";
    },
  ) => SubmittedRequest[];

  requestQuotaIncrease: (
    id: Id,
    payload: {
      newTokenLimit: number;
      newRateLimit: number;
      newRequestLimit: number;
      justification: string;
    },
  ) => Promise<void>;

  requestModelsAccess: (
    id: Id,
    modelKeys: ModelKey[],
    opts: { justification: string },
  ) => Promise<void>;
  // API Requests (local-only)
  logApiRequest: (
    id: Id,
    entry: Omit<ApiRequestLog, "id" | "subscriptionId" | "timestamp">,
  ) => void;
  getApiRequests: (id: Id) => ApiRequestLog[];
  clearApiRequests: (id: Id) => void;

  // Simulation helper (no backend): generate a fake request for UI/testing
  simulateApiRequest: (
    id: Id,
    modelKey: ModelKey,
    opts?: {
      tokensUsedMin?: number;
      tokensUsedMax?: number;
      latencyMinMs?: number;
      latencyMaxMs?: number;
      successRate?: number; // 0..1
    },
  ) => Promise<ApiRequestLog>;
  updateSubscriptionName: (id: Id, nextName: string) => Promise<void>;
  updateSubscriptionExpiration: (
    id: string,
    newTs: number,
    justification?: string,
  ) => Promise<void>;
  deleteSubscription: (id: string, justification?: string) => Promise<void>;
  setModelEnabled: (
    subscriptionId: string,
    modelKey: ModelKey,
    enabled: boolean,
  ) => Promise<void>;
  updateRequestStatus: (
    subscriptionId: string,
    requestId: string,
    status: "APPROVED" | "DECLINED",
  ) => Promise<void>;
  /*setSubscriptionGuardrailEnabled: (
    subscriptionId: string,
    guardrailKey: GuardrailKey,
    enabled: boolean,
  ) => Promise<void>;
  setModelGuardrailEnforced: (
    modelKey: ModelKey,
    guardrailKey: GuardrailKey,
    enforced: boolean,
  ) => Promise<void>;*/
  setModelGuardrailEnabledForSubscription: (
    subscriptionId: string,
    modelKey: ModelKey, // Add the modelKey parameter
    guardrailKey: GuardrailKey,
    enabled: boolean,
  ) => Promise<void>;
  blockSubscription: (id: string, justification?: string) => Promise<void>;
  appendAdminAction: (
    id: string,
    input: { type: AdminAction; justification?: string; timestamp?: number },
  ) => void;
  clearSubscriptionExpiration: (
    id: string,
    justification?: string,
  ) => Promise<void>;
  requestExtendSubscription: (
    id: string,
    payload: {
      expiryTs: number;
      justification: string;
    },
  ) => Promise<void>;
  updateSubscriptionDetails: (
    id: string,
    input: {
      type: "NORMAL" | "SANDBOX";
      subscriptionName: string;
      subscriptionPurpose: string;
      department: string;
      environment?: "PROD" | "NON_PROD"; // NORMAL only
      applicationReference?: ApplicationReference; // NORMAL only
      applicationRefFreeText?: string; // SANDBOX only
      adGroupReference?: AdGroupReference; // NORMAL only
    },
  ) => Promise<SubscriptionEntity>;
  updateSubscriptionModels: (
    subscriptionId: string,
    enabledByKey: Partial<Record<ModelKey, boolean>>,
  ) => Promise<void>;
  updateSubscriptionGuardrails: (
    subscriptionId: string,
    changes: {
      modelKey: ModelKey;
      guardrailKey: GuardrailKey;
      enforced: boolean;
    }[],
  ) => Promise<void>;
}

/** Convert a value (timestamp number or ISO string) to milliseconds */
const toMs = (v: any): number | undefined => {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isNaN(v) ? undefined : v;
  if (typeof v === "string") {
    const ms = Date.parse(v);
    return Number.isNaN(ms) ? undefined : ms;
  }
  return undefined;
};

/** Normalize raw subscription data from the backend into SubscriptionEntity[] */
const normalizeSubscriptions = (
  raw: SubscriptionEntity[],
): SubscriptionEntity[] =>
  raw.map((s: SubscriptionEntity) => {
    const type: "SANDBOX" | "NORMAL" =
      s.type === "SANDBOX" || s.type === "NORMAL" ? s.type : "NORMAL";

    const defaults = getDefaultsForType(type);
    const defaultUsage = defaults.tokenUsage;
    const backendUsage = s.tokenUsage || {};

    const tokenUsage = {
      granted:
        typeof backendUsage.granted === "number"
          ? backendUsage.granted
          : defaultUsage.granted,
      used:
        typeof backendUsage.used === "number"
          ? backendUsage.used
          : defaultUsage.used,
      period: backendUsage.period ?? defaultUsage.period,
    };

    return {
      ...s,
      createdAt: toMs(s.createdAt) ?? Date.now(),
      updatedAt: toMs(s.updatedAt) ?? Date.now(),
      expirationDate: toMs(s.expirationDate),
      models: Array.isArray(s.models) ? s.models : [],
      tokenUsage,
    } as SubscriptionEntity;
  });

export const useSubscriptionsStore = create<SubscriptionsState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      modelsCatalog: {} as Record<string, Model>,
      lastCreatedId: undefined,
      admin: {
        isAdmin: true,
        setAdmin: (value) =>
          set((s) => ({ admin: { ...s.admin, isAdmin: value } })),
      },
      config: { delayRangeMs: [400, 800], failureRate: 0.1 },

      fetchSubscriptions: async () => {
        try {
          const data = await maasService.getUserManagedSubscriptions();
          console.log("getUserManagedSubscriptions RAW response:", data);
          set({ subscriptions: normalizeSubscriptions(data) });
          invalidateAllSubscriptionEnrichers();
        } catch (error: any) {
          throw new Error("Failed to fetch subscriptions. " + error?.message);
        }
      },

      fetchAdminSubscriptions: async () => {
        const [userManagedSubscriptions, allSubscriptions] = await Promise.all([
          maasService.getUserManagedSubscriptions(),
          maasService.getAdminSubscriptions(),
        ]);

        for (const subscription of allSubscriptions) {
          if (!userManagedSubscriptions.find((s) => s.id === subscription.id)) {
            subscription._loadedViaAdmin = true;
          }
        }

        set({ subscriptions: normalizeSubscriptions(allSubscriptions) });
        invalidateAllSubscriptionEnrichers();
      },

      fetchModels: async () => {
        try {
          const modelsFromApi: any[] = await maasService.getAllModels();

          const modelsWithGuardrails: Model[] = modelsFromApi.map(
            (rawModel) => {
              const modelKey = rawModel.key as ModelKey;
              const rawGuardrails = rawModel.guardrails;

              let normalizedGuardrails: ModelGuardrail[] = [];

              // Case 1: If guardrails is an empty object or undefined, assign 4 default guardrails
              if (
                !rawGuardrails ||
                (typeof rawGuardrails === "object" &&
                  Object.keys(rawGuardrails).length === 0)
              ) {
                normalizedGuardrails = Object.values(GUARDRAILS_CATALOG).map(
                  (meta) => ({
                    ...meta,
                    scope: "MODEL" as const,
                    modelKey,
                    enforced: meta.defaultEnforcedModel,
                  }),
                );
              }

              // Case 2: If guardrails exist (non-empty), normalize them
              else if (
                Array.isArray(rawGuardrails) &&
                rawGuardrails.length > 0
              ) {
                normalizedGuardrails = rawGuardrails.map((g: any) => {
                  // Case 2.1: Backend sends a plain string (e.g., "Safety Alignment")
                  if (typeof g === "string") {
                    const displayName = g;

                    // Map display name -> internal key if known, otherwise use the string as the key
                    const mappedKey: GuardrailKey =
                      GUARDRAIL_NAME_TO_KEY[displayName] ?? displayName;

                    // Look up catalog metadata; if not found, fall back to generic defaults
                    const base: Guardrail = GUARDRAILS_CATALOG[mappedKey] ?? {
                      key: mappedKey,
                      defaultEnabledSubscription: false,
                      defaultEnforcedModel: false,
                    };

                    return {
                      ...base,
                      scope: "MODEL" as const,
                      modelKey,
                      enforced: base.defaultEnforcedModel,
                    };
                  }

                  // Case 2.2: Backend sends structured guardrail objects
                  // Use key/id/name as possible identifiers
                  const keyFromApi = (g.key ?? g.id ?? g.name) as GuardrailKey;

                  // Build Guardrail from API (safe for unknown keys now)
                  const meta = buildGuardrailFromApi(keyFromApi, g);

                  const enforced: boolean =
                    typeof g.enforced === "boolean"
                      ? g.enforced
                      : meta.defaultEnforcedModel;

                  return {
                    ...meta,
                    scope: "MODEL" as const,
                    modelKey,
                    enforced,
                  };
                });
              }

              // IMPORTANT: If guardrails exist but are empty, we do not assign defaults.
              // If a model has no guardrails in the API, its guardrails array is empty.
              const model: Model = {
                ...rawModel,
                guardrails: normalizedGuardrails,
              };

              return model;
            },
          );

          const modelsByModelKey: Record<string, Model> = {};
          for (const model of modelsWithGuardrails) {
            modelsByModelKey[model.key] = model;
          }

          set({ modelsCatalog: modelsByModelKey });
        } catch (error: any) {
          throw new Error("Failed to fetch models. " + error?.message);
        }
      },

      beginCreateFlow: () => {
        const id = genId();
        return { id, path: `/maas/${id}/create` };
      },
      getCreateRouteForId: (id) => `/maas/${id}/create`,
      addSubscription: (subscription) =>
        set((state) => ({
          subscriptions: [subscription, ...state.subscriptions],
        })),
      getById: (id) => {
        const sub = get().subscriptions.find((s) => s.id === id);
        if (!sub) return undefined;

        // If a subscription is in pending state, we do not have a team or any useful information in the Litellm API yet
        if (sub.status === "PENDING_APPROVAL") {
          return sub;
        }

        // Invoke enrichers that haven't been fetched (or previously failed) for this subscription
        for (const enricher of subscriptionDetailEnrichers) {
          const cacheKey = enricherCacheKey(id, enricher.key);
          if (enricherStatus.has(cacheKey)) continue; // already pending or done

          enricherStatus.set(cacheKey, "pending");
          enricher
            .fn(id)
            .then((partial) => {
              enricherStatus.set(cacheKey, "done");
              set((state) => ({
                subscriptions: state.subscriptions.map((s) =>
                  s.id === id ? { ...s, ...partial } : s,
                ),
              }));
            })
            .catch(() => {
              // Clear so next getById call retries this enricher
              enricherStatus.delete(cacheKey);
            });
        }

        return sub;
      },
      updateStatus: async (
        id: string,
        status: SubscriptionStatus,
        justification?: string,
      ) => {
        if (status === "CANCELLED") {
          // no try catch here - if the backend call fails, we don't want to update the local state
          await postSubscriptionAdminTransaction(id, {
            subscriptionId: id,
            action: "CANCEL",
            description: justification ?? "",
          });
        } else {
          console.warn(
            `updateStatus to ${status} is currently not implemented`,
          );
        }

        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, status, updatedAt: now() } : s,
          ),
        }));
      },

      cancel: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, status: "CANCELLED", updatedAt: now() } : s,
          ),
        })),
      resetLastCreated: () => set({ lastCreatedId: undefined }),
      createNormal: async (values, idOverride) => {
        const { delayRangeMs, failureRate } = get().config;

        // Simulate delay
        await wait(delayRangeMs[0], delayRangeMs[1]);

        // Simulate failure based on failure rate
        if (Math.random() < failureRate) {
          throw new Error("Subscription creation failed (NORMAL)");
        }

        // Generate ID or use the provided override
        const id = idOverride || genId();

        // Get default configuration for NORMAL type
        const defaults = getDefaultsForType("NORMAL");

        // Get user email and current timestamp
        const email = getCurrentUserEmail();
        const ts = now();

        // Validate required fields
        if (!values.applicationReference) {
          throw new Error(
            "applicationReference is required for NORMAL subscriptions.",
          );
        }
        if (!values.adGroupReference) {
          throw new Error(
            "adGroupReference is required for NORMAL subscriptions.",
          );
        }

        // Pick the first active model from the dynamic models catalog which has declared name and descrption
        const catalog = get().modelsCatalog;
        const firstEligibleModel = pickFirstEligibleModel(catalog);

        const subscriptionModels: SubscriptionModel[] = firstEligibleModel
          ? [{ ...firstEligibleModel, enabled: true }]
          : [];

        // Local source-of-truth entity (numeric timestamps)
        const entity: SubscriptionEntity = {
          id,
          type: "NORMAL",
          status: "PENDING_APPROVAL",
          createdAt: ts,
          updatedAt: ts,
          name: values.subscriptionName.trim(),
          department: values.department,
          subscriptionPurpose: values.subscriptionPurpose,
          environment: values.environment,
          applicationReference: values.applicationReference,
          adGroupReference: values.adGroupReference,
          tokenUsage: defaults.tokenUsage,
          models: subscriptionModels,
          guardrails: [],
          requestStats: defaults.requestStats,
          costStats: defaults.costStats,
          expirationDate: undefined, // No expiration date for NORMAL subscriptions
          user: email,
        };

        // Best-effort backend call; do not overwrite local entity with its response
        try {
          await maasService.addSubscription(entity);
        } catch (error: any) {
          console.warn(
            "maasService.addSubscription (NORMAL) failed; using local entity only.",
            error,
          );
          throw error;
        }

        // Store the locally constructed entity (with numeric dates)
        set((state) => ({
          subscriptions: [entity, ...state.subscriptions],
          lastCreatedId: entity.id,
        }));

        return entity;
      },

      createSandbox: async (values, idOverride) => {
        const { delayRangeMs, failureRate } = get().config;

        // Simulate delay
        await wait(delayRangeMs[0], delayRangeMs[1]);

        // Simulate failure based on failure rate
        if (Math.random() < failureRate) {
          throw new Error("Subscription creation failed (SANDBOX)");
        }

        // Generate ID or use the provided override
        const id = idOverride || genId();

        // Get default configuration for SANDBOX type
        const defaults = getDefaultsForType("SANDBOX");

        // Get timestamp and user
        const ts = now();
        const email = getCurrentUserEmail();

        // Pick the first active model from the dynamic models catalog which has declared name and descrption
        const catalog = get().modelsCatalog;
        const firstEligibleModel = pickFirstEligibleModel(catalog);

        const subscriptionModels: SubscriptionModel[] = firstEligibleModel
          ? [{ ...firstEligibleModel, enabled: true }]
          : [];

        // Local source-of-truth entity (no environment for SANDBOX)
        const entity: SubscriptionEntity = {
          id,
          type: "SANDBOX",
          status: "ACTIVE",
          createdAt: ts,
          updatedAt: ts,
          name: values.subscriptionName.trim(),
          department: values.department,
          subscriptionPurpose: values.subscriptionPurpose,
          applicationRefFreeText: values.applicationRefFreeText.trim(),
          tokenUsage: defaults.tokenUsage,
          models: subscriptionModels,
          guardrails: [],
          requestStats: defaults.requestStats,
          costStats: defaults.costStats,
          expirationDate: addMonths(ts, 6), // 6-month expiration for SANDBOX
          user: email,
        };

        // Best-effort backend call; do not fail local creation if backend rejects SANDBOX
        try {
          await maasService.addSubscription(entity);
        } catch (error: any) {
          console.warn(
            "maasService.addSubscription (SANDBOX) failed; using local entity only.",
            error,
          );
          throw error;
        }

        // Store the locally constructed entity (with numeric dates)
        set((state) => ({
          subscriptions: [entity, ...state.subscriptions],
          lastCreatedId: entity.id,
        }));

        return entity;
      },

      incrementRequestCount: (id, delta = 1) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  requestStats: (() => {
                    const prev = s.requestStats ?? {
                      totalRequests: 0,
                      successfulRequests: 0,
                      failedRequests: 0,
                    };
                    return {
                      totalRequests: Math.max(0, prev.totalRequests + delta),
                      successfulRequests: prev.successfulRequests,
                      failedRequests: prev.failedRequests,
                    };
                  })(),
                  updatedAt: now(),
                }
              : s,
          ),
        })),
      setTotalCost: (id, totalCost) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  costStats: {
                    ...s.costStats,
                    totalCost,
                    currency: s.costStats?.currency ?? "USD",
                  },
                  updatedAt: now(),
                }
              : s,
          ),
        })),
      setTokenGranted: (id, granted) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  tokenUsage: {
                    ...s.tokenUsage,
                    granted: Math.max(0, Math.floor(granted)),
                  },
                  updatedAt: now(),
                }
              : s,
          ),
        })),
      setTokenUsed: (id, used) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  tokenUsage: {
                    ...s.tokenUsage,
                    used: Math.max(0, Math.floor(used)),
                  },
                  updatedAt: now(),
                }
              : s,
          ),
        })),
      adjustTokenUsed: (id, deltaUsed) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  tokenUsage: {
                    ...s.tokenUsage,
                    used: Math.max(0, (s.tokenUsage?.used ?? 0) + deltaUsed),
                  },
                  updatedAt: now(),
                }
              : s,
          ),
        })),

      // API Key handling
      generateApiKey: async (id) => {
        const s = get().getById(id);
        if (!s) throw new Error("Subscription not found");
        const { raw, last4, secretId } = genKey("sk-test", 24);

        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  apiKeyMeta: {
                    secretId,
                    last4,
                    createdAt: now(),
                    status: "ACTIVE",
                  },
                  updatedAt: now(),
                }
              : sub,
          ),
        }));

        secretsVault.set(secretId, raw);
        invalidateSubscriptionEnrichers(id, [
          SubscriptionEnricherKey.ApiKeyMeta,
        ]);
        return { raw, last4, secretId };
      },
      revealApiKey: (id) => {
        const s = get().getById(id);
        if (!s?.apiKeyMeta) return null;
        return secretsVault.get(s.apiKeyMeta.secretId);
      },
      regenerateApiKey: async (id) => {
        const s = get().getById(id);
        if (!s) throw new Error("Subscription not found");

        if (s.apiKeyMeta?.secretId) secretsVault.remove(s.apiKeyMeta.secretId);
        const { raw, last4, secretId } = genKey("sk-test", 24);

        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  apiKeyMeta: {
                    secretId,
                    last4,
                    createdAt: now(),
                    status: "ACTIVE",
                  },
                  updatedAt: now(),
                }
              : sub,
          ),
        }));

        secretsVault.set(secretId, raw);
        invalidateSubscriptionEnrichers(id, [
          SubscriptionEnricherKey.ApiKeyMeta,
        ]);
        return { raw, last4, secretId };
      },
      revokeApiKey: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id && sub.apiKeyMeta
              ? {
                  ...sub,
                  apiKeyMeta: { ...sub.apiKeyMeta, status: "REVOKED" },
                  updatedAt: now(),
                }
              : sub,
          ),
        }));

        invalidateSubscriptionEnrichers(id, [
          SubscriptionEnricherKey.ApiKeyMeta,
        ]);
      },

      // Models
      getModelRouteForKey: (modelKey: ModelKey) => {
        const catalog = get().modelsCatalog;
        const model = catalog[modelKey];

        if (!model) {
          return "/maas/model/not-found";
        }

        // If name is empty, fall back to key for slug stability
        const nameForSlug =
          model.name && model.name.trim().length > 0 ? model.name : model.key;

        return `/maas/model/${buildModelSlug(model.provider, nameForSlug)}`;
      },

      getModelBySlug: (slug) => {
        const catalog = get().modelsCatalog;

        return Object.values(catalog).find((m) => {
          const nameForSlug =
            m.name && m.name.trim().length > 0 ? m.name : m.key;

          return buildModelSlug(m.provider, nameForSlug) === slug;
        });
      },
      addNotification: (subscriptionId, input) => {
        const n: SubscriptionNotification = {
          ...input,
          id: genId(),
          subscriptionId,
          scope: "SUBSCRIPTION",
          timestamp: now(),
          dismissed: false,
        };
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === subscriptionId
              ? {
                  ...s,
                  notifications: [n, ...(s.notifications ?? [])],
                  updatedAt: now(),
                }
              : s,
          ),
        }));
      },

      markNotificationsSeen: (subscriptionId, ids) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === subscriptionId
              ? {
                  ...s,
                  notifications: (s.notifications ?? []).map((n) =>
                    ids.includes(n.id) && n.firstSeenAt == null
                      ? { ...n, firstSeenAt: now() }
                      : n,
                  ),
                  updatedAt: now(),
                }
              : s,
          ),
        })),

      dismissNotification: (subscriptionId, notificationId) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === subscriptionId
              ? {
                  ...s,
                  notifications: (s.notifications ?? []).map((n) =>
                    n.id === notificationId ? { ...n, dismissed: true } : n,
                  ),
                  updatedAt: now(),
                }
              : s,
          ),
        })),

      pruneNotifications: (subscriptionId) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) => {
            if (s.id !== subscriptionId) return s;
            const nowTs = now();
            const kept = (s.notifications ?? []).filter(
              (n) => !n.dismissed && !isExpired(n, nowTs),
            );
            return { ...s, notifications: kept, updatedAt: nowTs };
          }),
        })),

      getActiveNotificationsForSubscription: (subscriptionId) => {
        const cacheKey = `sub-${subscriptionId}`;
        const cached = notificationCache.get(cacheKey);
        const currentTime = Date.now();

        if (cached && currentTime - cached.timestamp < CACHE_DURATION) {
          return cached.result;
        }

        const s = get().getById(subscriptionId);
        if (!s) {
          const emptyResult: SubscriptionNotification[] = [];
          notificationCache.set(cacheKey, {
            result: emptyResult,
            timestamp: currentTime,
          });
          return emptyResult;
        }

        const nowTs = currentTime;
        const result = (s.notifications ?? [])
          .filter(
            (n) =>
              !n.dismissed && // Exclude dismissed notifications
              !isExpired(n, nowTs) &&
              n.scope === "SUBSCRIPTION",
          )
          .sort((a, b) => b.timestamp - a.timestamp);

        notificationCache.set(cacheKey, { result, timestamp: currentTime });
        return result;
      },
      getActiveModelNotifications: (modelKey) => {
        const cacheKey = `model-${modelKey}`;
        const cached = notificationCache.get(cacheKey);
        const currentTime = Date.now();

        if (cached && currentTime - cached.timestamp < CACHE_DURATION) {
          return cached.result;
        }

        const model = get().modelsCatalog[modelKey];
        if (!model?.notifications) {
          const emptyResult: ModelNotification[] = [];
          notificationCache.set(cacheKey, {
            result: emptyResult,
            timestamp: currentTime,
          });
          return emptyResult;
        }

        const nowTs = currentTime;
        const result = model.notifications
          .filter((n) => !n.dismissed && !isExpired(n, nowTs))
          .sort((a, b) => b.timestamp - a.timestamp);

        notificationCache.set(cacheKey, { result, timestamp: currentTime });
        return result;
      },

      getActiveUnreadCount: (subscriptionId) =>
        get().getActiveNotificationsForSubscription(subscriptionId).length,
      hydrateNotifications: () =>
        set((state) => {
          const nowTs = now();
          const updated = state.subscriptions.map((s) => ({
            ...s,
            notifications: (s.notifications ?? []).filter(
              (n) => !n.dismissed && !isExpired(n, nowTs),
            ),
          }));
          return { subscriptions: updated };
        }),
      hydrateAdminActions: () =>
        set((state) => {
          const nowTs = now();
          const updatedSubs = state.subscriptions.map((s) => {
            const actions = (s.adminActions ?? []).map((a) => ({
              ...a,
              id: a.id ?? genId(),
              timestamp: typeof a.timestamp === "number" ? a.timestamp : nowTs,
              justification:
                (a.justification ?? "").trim().length > 0
                  ? (a.justification ?? "").trim()
                  : undefined,
            }));
            const sorted = actions
              .slice()
              .sort((x, y) => y.timestamp - x.timestamp);
            return { ...s, adminActions: sorted };
          });
          return { subscriptions: updatedSubs };
        }),

      dismissSubscriptionNotification: (
        subscriptionId: Id,
        notificationId: string,
      ) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === subscriptionId
              ? {
                  ...s,
                  updatedAt: now(),
                  notifications: (s.notifications ?? []).map((n) =>
                    n.scope === "SUBSCRIPTION" && n.id === notificationId
                      ? { ...n, dismissed: true }
                      : n,
                  ),
                }
              : s,
          ),
        })),

      dismissModelNotification: (modelKey, notificationId) =>
        set((state) => {
          const model = state.modelsCatalog[modelKey];
          if (!model?.notifications) return state;

          const updatedNotifications = model.notifications.map((n) =>
            n.id === notificationId ? { ...n, dismissed: true } : n,
          );

          return {
            ...state,
            modelsCatalog: {
              ...state.modelsCatalog,
              [modelKey]: { ...model, notifications: updatedNotifications },
            },
          };
        }),

      getMetrixById: (id) => {
        const s = get().getById(id);
        if (!s) return undefined;
        const totalTokens = s.tokenUsage?.used ?? 0;
        const totalRequests = s.requestStats?.totalRequests ?? 0;
        const totalCost = estimateCostFromModels(s.models, totalTokens);
        const averageTokensPerRequest =
          totalRequests > 0 ? totalTokens / totalRequests : null;
        return {
          totalTokens,
          totalRequests,
          totalCost,
          averageTokensPerRequest,
        };
      },
      activateSubscription: async (id, justification) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        // no try catch here - if the backend call fails, we don't want to update the local state
        await postSubscriptionAdminTransaction(id, {
          subscriptionId: id,
          action: "APPROVE",
          description: justification ?? "",
        });

        const ts = now();
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, status: "ACTIVE", updatedAt: ts } : s,
          ),
        }));

        get().addNotification(id, {
          i18nKey:
            "subscription-configuration.consumerNotifications.notificationsTexts.subscriptionActivated",
          i18nParams: { justification },
        });
      },

      deactivateSubscription: async (id, opts) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        // no try catch here - if the backend call fails, we don't want to update the local state
        await postSubscriptionAdminTransaction(id, {
          subscriptionId: id,
          action: "DISABLE",
          description: opts?.justification ?? "",
        });

        const ts = now();
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "DEACTIVATED",
                  updatedAt: ts,
                }
              : s,
          ),
        }));
      },
      reactivateSubscription: async (id, opts) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        // no try catch here - if the backend call fails, we don't want to update the local state
        await postSubscriptionAdminTransaction(id, {
          subscriptionId: id,
          action: "ENABLE",
          description: opts?.justification ?? "",
        });

        const ts = now();
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, status: "ACTIVE", updatedAt: ts } : s,
          ),
        }));
      },
      submitRequest: (id, request) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        const ts = now();
        const req: SubmittedRequest = {
          id: genId(),
          subscriptionId: id,
          type: request.type,
          createdAt: ts,
          status: "PENDING",
          payload: request.payload, // payload is required by type
        };

        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  updatedAt: ts,
                  submittedRequests: [req, ...(s.submittedRequests ?? [])],
                }
              : s,
          ),
        }));
      },

      getSubmittedRequests: (id, opts) => {
        const s = get().getById(id);
        if (!s) return [];

        const sortDir = opts?.sort === "asc" ? "asc" : "desc";

        let list = s.submittedRequests ?? [];

        if (opts?.type) {
          list = list.filter((r) => r.type === opts.type);
        }
        if (opts?.status) {
          list = list.filter((r) => r.status === opts.status);
        }

        // Return a new array sorted by createdAt
        return list
          .slice()
          .sort((a, b) =>
            sortDir === "asc"
              ? a.createdAt - b.createdAt
              : b.createdAt - a.createdAt,
          );
      },

      requestQuotaIncrease: async (
        id,
        { newTokenLimit, newRateLimit, newRequestLimit, justification },
      ) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        get().submitRequest(id, {
          type: "QUOTA_INCREASE",
          payload: {
            newTokenLimit,
            newRateLimit,
            newRequestLimit,
            justification: justification.trim(),
          },
        });
      },

      requestModelsAccess: async (id, modelKeys, opts) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        get().submitRequest(id, {
          type: "MODEL_ACCESS",
          payload: {
            modelKeys,
            justification: opts.justification.trim(),
          },
        });
      },
      logApiRequest: (id, entry) => {
        const s = get().getById(id);
        if (!s) throw new Error("Subscription not found");

        const ts = now();
        const log: ApiRequestLog = {
          id: genId(),
          subscriptionId: id,
          timestamp: ts,
          modelKey: entry.modelKey,
          tokensUsed: Math.max(0, Math.floor(entry.tokensUsed ?? 0)),
          responseTimeMs: Math.max(0, Math.floor(entry.responseTimeMs ?? 0)),
          responseStatus: entry.responseStatus,
        };

        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id !== id) return sub;

            // Append log and cap list length
            const prevLogs = sub.apiRequests ?? [];
            const nextLogs =
              prevLogs.length >= MAX_API_REQUEST_LOGS
                ? [log, ...prevLogs.slice(0, MAX_API_REQUEST_LOGS - 1)]
                : [log, ...prevLogs];

            // Update usage
            const nextTokenUsage = {
              ...sub.tokenUsage,
              used: Math.max(0, (sub.tokenUsage?.used ?? 0) + log.tokensUsed),
            };

            // UPDATED: Compute success/failure and update complete stats
            const prevStats = sub.requestStats ?? {
              totalRequests: 0,
              successfulRequests: 0,
              failedRequests: 0,
            };
            const success = isSuccessfulStatus(log.responseStatus);
            const nextRequestStats = {
              totalRequests: prevStats.totalRequests + 1,
              successfulRequests:
                prevStats.successfulRequests + (success ? 1 : 0),
              failedRequests: prevStats.failedRequests + (success ? 0 : 1),
            };

            return {
              ...sub,
              apiRequests: nextLogs,
              tokenUsage: nextTokenUsage,
              requestStats: nextRequestStats,
              updatedAt: ts,
            };
          }),
        }));
      },

      getApiRequests: (id) => {
        const s = get().getById(id);
        return (s?.apiRequests ?? [])
          .slice()
          .sort((a, b) => b.timestamp - a.timestamp);
      },

      clearApiRequests: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, apiRequests: [], updatedAt: now() } : sub,
          ),
        }));

        invalidateSubscriptionEnrichers(id, [SubscriptionEnricherKey.Usage]);
      },

      simulateApiRequest: async (id, modelKey, opts) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");
        const model = get().modelsCatalog[modelKey];
        if (!model) throw new Error("Model not found");

        // Use config failureRate as a baseline
        const baseFailureRate = get().config.failureRate ?? 0.1;
        const tokensMin = opts?.tokensUsedMin ?? 200;
        const tokensMax = opts?.tokensUsedMax ?? 2000;
        const latencyMin = opts?.latencyMinMs ?? 50;
        const latencyMax = opts?.latencyMaxMs ?? 1500;
        const successRate = opts?.successRate ?? 1 - baseFailureRate;

        // Random helpers
        const randBetween = (min: number, max: number) =>
          Math.floor(Math.random() * (max - min + 1)) + min;

        const tokensUsed = randBetween(tokensMin, tokensMax);
        const responseTimeMs = randBetween(latencyMin, latencyMax);
        const isSuccess = Math.random() < successRate;

        // Log it (this also updates usage/stats)
        get().logApiRequest(id, {
          modelKey,
          tokensUsed,
          responseTimeMs,
          responseStatus: isSuccess ? "SUCCESS" : "ERROR",
        });

        // Return the last inserted log (convenience)
        const latest = get().getApiRequests(id)[0];
        return latest!;
      },
      updateSubscriptionName: async (id, nextName) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        const trimmed = (nextName ?? "").trim();
        const min = 3;
        const max = 50;

        if (trimmed.length < min)
          throw new Error(`Name must be at least ${min} characters.`);
        if (trimmed.length > max)
          throw new Error(`Name must be at most ${max} characters.`);
        if (trimmed === sub.name?.trim()) return;

        const { delayRangeMs, failureRate } = get().config;
        await wait(delayRangeMs[0], delayRangeMs[1]);
        if (Math.random() < failureRate)
          throw new Error("Failed to update subscription name.");

        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, name: trimmed, updatedAt: now() } : s,
          ),
        }));

        get().addNotification(id, {
          i18nKey:
            "subscription-configuration.consumerNotifications.notificationsTexts.consumerSubscriptionNameUpdate",
          i18nParams: { name: trimmed },
        });
      },

      updateSubscriptionExpiration: async (
        id: string,
        newTs: number,
        justification?: string,
      ) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        if (typeof newTs !== "number" || newTs <= Date.now()) {
          throw new Error("Expiration date must be in the future.");
        }
        // no try catch here - if the backend call fails, we don't want to update the local state
        await postSubscriptionAdminTransaction(id, {
          subscriptionId: id,
          action: "EXTEND",
          parameters: { new_expiry_date: new Date(newTs).toISOString() },
          description: justification?.trim() ?? "",
        });
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, expirationDate: newTs, updatedAt: now() } : s,
          ),
        }));

        const dateStr = new Date(newTs).toLocaleString("da-DK", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });

        get().addNotification(id, {
          i18nKey:
            "subscription-configuration.consumerNotifications.notificationsTexts.expiryDateUpdate",
          i18nParams: { date: dateStr },
        });
      },

      deleteSubscription: async (id: string, justification?: string) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        // no try catch here - if the backend call fails, we don't want to update the local state
        await postSubscriptionAdminTransaction(id, {
          subscriptionId: id,
          action: "DELETE",
          description: justification?.trim() ?? "",
        });

        set((state) => ({
          subscriptions: state.subscriptions
            .filter((s) => s.id !== id) // Remove the subscription
            .map((s) => ({
              ...s,
              submittedRequests: (s.submittedRequests ?? []).filter(
                (request) => request.subscriptionId !== id, // Remove associated requests
              ),
            })),
        }));
      },

      setModelEnabled: async (subscriptionId, modelKey, enabled) => {
        const sub = get().getById(subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        const { delayRangeMs, failureRate } = get().config;
        await wait(delayRangeMs[0], delayRangeMs[1]);
        if (Math.random() < failureRate)
          throw new Error("Failed to update model enabled state.");

        set((state) => ({
          subscriptions: state.subscriptions.map((s) => {
            if (s.id !== subscriptionId) return s;
            const models = (s.models ?? []).map((m) =>
              m.key === modelKey ? { ...m, enabled } : m,
            );
            return { ...s, models, updatedAt: now() };
          }),
        }));
        invalidateSubscriptionEnrichers(subscriptionId, [
          SubscriptionEnricherKey.Models,
          SubscriptionEnricherKey.Usage,
        ]);
      },

      updateRequestStatus: async (subscriptionId, requestId, status) => {
        const sub = get().getById(subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        debugger;

        const { delayRangeMs, failureRate } = get().config;
        await wait(delayRangeMs[0], delayRangeMs[1]);
        if (Math.random() < failureRate)
          throw new Error("Failed to update request status.");

        set((state) => ({
          subscriptions: state.subscriptions.map((s) => {
            if (s.id !== subscriptionId) return s;
            const updated = (s.submittedRequests ?? []).map((r) =>
              r.id === requestId ? { ...r, status } : r,
            );
            return { ...s, submittedRequests: updated, updatedAt: now() };
          }),
        }));
      },
      setModelGuardrailEnabledForSubscription: async (
        subscriptionId: string,
        modelKey: ModelKey,
        guardrailKey: GuardrailKey,
        enforced: boolean,
      ) => {
        const sub = get().getById(subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        const { delayRangeMs, failureRate } = get().config;

        try {
          // Simulate delay
          await wait(delayRangeMs[0], delayRangeMs[1]);

          // Simulate failure
          if (Math.random() < failureRate) {
            throw new Error("Failed to update guardrail.");
          }

          // Apply the change to the subscription models/guardrails
          set((state) => ({
            subscriptions: state.subscriptions.map((s) => {
              if (s.id !== subscriptionId) return s;

              const updatedModels = (s.models ?? []).map((model) => {
                if (model.key !== modelKey) return model;

                const updatedGuardrails = (model.guardrails ?? []).map(
                  (guardrail) =>
                    guardrail.key === guardrailKey
                      ? { ...guardrail, enforced }
                      : guardrail,
                );

                return { ...model, guardrails: updatedGuardrails };
              });

              return { ...s, models: updatedModels, updatedAt: now() };
            }),
          }));

          invalidateSubscriptionEnrichers(subscriptionId, [
            SubscriptionEnricherKey.Models,
          ]);

          // Build a human-friendly label: "<modelName or key> / <guardrailKey>"
          const modelName =
            get().modelsCatalog[modelKey]?.name ||
            sub.models?.find((m) => m.key === modelKey)?.name ||
            modelKey;

          const label = `${modelName} / ${guardrailKey}`;

          // Queue this change for aggregated notification
          queueGuardrailNotification(subscriptionId, label, enforced, get);
        } catch (error) {
          // We still want to show errors immediately per failure
          get().addNotification(subscriptionId, {
            text: `Failed to update guardrail "${guardrailKey}" for model "${modelKey}". Please try again.`,
          });
          throw error;
        }
      },

      blockSubscription: async (id: string, justification?: string) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        // no try catch here - if the backend call fails, we don't want to update the local state
        await postSubscriptionAdminTransaction(id, {
          subscriptionId: id,
          action: "DISABLE",
          description: justification?.trim() ?? "",
        });

        const ts = now();
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, status: "BLOCKED", updatedAt: ts } : s,
          ),
        }));
        get().addNotification(id, {
          i18nKey:
            "subscription-configuration.consumerNotifications.notificationsTexts.subscriptionBlocked",
          i18nParams: { justification },
        });
      },

      appendAdminAction: (id, input) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) => {
            if (s.id !== id) return s;
            const newEntry: AdminActionEntry = {
              id: genId(),
              type: input.type,
              timestamp: input.timestamp ?? now(),
              justification: (input.justification ?? "").trim() || undefined,
            };
            const next = [newEntry, ...(s.adminActions ?? [])].sort(
              (a, b) => b.timestamp - a.timestamp,
            );
            return { ...s, adminActions: next, updatedAt: now() };
          }),
        })),

      clearSubscriptionExpiration: async (id, justification?: string) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        // no try catch here - if the backend call fails, we don't want to update the local state
        await postSubscriptionAdminTransaction(id, {
          subscriptionId: id,
          action: "EXTEND",
          parameters: { new_expiry_date: "unlimited" },
          description: justification?.trim() ?? "",
        });

        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id
              ? { ...s, expirationDate: undefined, updatedAt: now() }
              : s,
          ),
        }));
      },

      requestExtendSubscription: async (id, payload) => {
        const sub = get().getById(id);
        if (!sub) throw new Error("Subscription not found");

        const justification = (payload.justification || "").trim();
        if (!justification) throw new Error("Justification is required.");

        if (
          typeof payload.expiryTs !== "number" ||
          payload.expiryTs <= Date.now()
        ) {
          throw new Error("Provide a future target date.");
        }

        get().submitRequest(id, {
          type: "EXTEND_SUBSCRIPTION",
          payload: {
            justification,
            expiryTs: payload.expiryTs,
          },
        });
      },
      updateSubscriptionDetails: async (id, input) => {
        const existing = get().getById(id);
        if (!existing) throw new Error("Subscription not found");

        const { delayRangeMs, failureRate } = get().config;

        // Simulate delay and failure
        await wait(delayRangeMs[0], delayRangeMs[1]);
        if (Math.random() < failureRate) {
          throw new Error("Failed to update subscription configuration.");
        }

        const isNormal = input.type === "NORMAL";

        // Normalize input fields
        const trimmed = {
          name: (input.subscriptionName || "").trim(),
          purpose: (input.subscriptionPurpose || "").trim(),
          dept: (input.department || "").trim(),
          env: isNormal ? (input.environment as any) || "NON_PROD" : undefined,
          appRef: isNormal ? input.applicationReference : undefined,
          appRefFreeText: !isNormal
            ? (input.applicationRefFreeText || "").trim()
            : undefined,
          adGroupRef: isNormal ? input.adGroupReference : undefined,
        };

        // Track changes for notifications
        const labelBase =
          "subscription-configuration.consumerNotifications.subscriptionFieldLabels";
        const changes: Array<{ labelKey: string; value: string }> = [];

        if (existing.type !== input.type) {
          changes.push({ labelKey: `${labelBase}.type`, value: input.type });
        }
        if (existing.name !== trimmed.name) {
          changes.push({ labelKey: `${labelBase}.name`, value: trimmed.name });
        }
        if (existing.subscriptionPurpose !== trimmed.purpose) {
          changes.push({
            labelKey: `${labelBase}.purpose`,
            value: trimmed.purpose,
          });
        }
        if (existing.department !== trimmed.dept) {
          changes.push({
            labelKey: `${labelBase}.departmnet`, // NOTE: typo in key matches existing usage
            value: trimmed.dept,
          });
        }

        if (isNormal) {
          // Environment
          if (existing.environment !== trimmed.env) {
            changes.push({
              labelKey: `${labelBase}.environment`,
              value: String(trimmed.env || ""),
            });
          }

          // Application reference: compare by id
          const existingAppId = existing.applicationReference?.id ?? "";
          const nextAppId = trimmed.appRef?.id ?? "";
          if (existingAppId !== nextAppId) {
            changes.push({
              labelKey: `${labelBase}.applicationRef`,
              value: trimmed.appRef?.name || nextAppId,
            });
          }

          // AD group reference: compare by id
          const existingAdGroupId = existing.adGroupReference?.id ?? "";
          const nextAdGroupId = trimmed.adGroupRef?.id ?? "";
          if (existingAdGroupId !== nextAdGroupId) {
            changes.push({
              labelKey: `${labelBase}.adGroup`,
              value: trimmed.adGroupRef?.name || nextAdGroupId,
            });
          }
        } else {
          // SANDBOX: free-text application reference
          if (existing.applicationRefFreeText !== trimmed.appRefFreeText) {
            changes.push({
              labelKey: `${labelBase}.applicationRefText`,
              value: trimmed.appRefFreeText || "",
            });
          }
        }

        // Determine the new token usage
        const defaultsForNewType = getDefaultsForType(input.type);
        const nextTokenUsage =
          existing.type !== input.type
            ? defaultsForNewType.tokenUsage // Reset tokens if type changes
            : existing.tokenUsage; // Keep existing tokens if type stays the same

        // No-op: nothing changed → no write, no notification
        if (changes.length === 0) {
          return existing;
        }

        // Build the updated subscription entity
        const ts = now();
        const next: SubscriptionEntity = {
          ...existing,
          type: input.type,
          name: trimmed.name,
          subscriptionPurpose: trimmed.purpose,
          department: trimmed.dept,
          environment: isNormal ? trimmed.env : undefined,
          applicationReference: isNormal ? trimmed.appRef : undefined,
          applicationRefFreeText: !isNormal
            ? trimmed.appRefFreeText
            : undefined,
          adGroupReference: isNormal ? trimmed.adGroupRef : undefined,
          tokenUsage: nextTokenUsage, // Updated token usage
          updatedAt: ts,
        };

        // Update the store
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? next : s,
          ),
        }));

        // Add a notification for the changes
        get().addNotification(id, {
          i18nKey:
            "subscription-configuration.consumerNotifications.notificationsTexts.detailsUpdated",
          i18nParams: {
            changes,
          },
        });

        return next;
      },

      updateSubscriptionModels: async (
        subscriptionId: string,
        enabledByKey: Partial<Record<ModelKey, boolean>>,
      ) => {
        const subBefore = get().getById(subscriptionId);
        if (!subBefore) throw new Error("Subscription not found");

        const { delayRangeMs, failureRate } = get().config;
        await wait(delayRangeMs[0], delayRangeMs[1]);
        if (Math.random() < failureRate)
          throw new Error("Failed to update models.");

        const toEnable = new Set<ModelKey>();
        const toDisable = new Set<ModelKey>();

        (Object.keys(enabledByKey) as ModelKey[]).forEach((k) => {
          const v = enabledByKey[k];
          if (v === true) toEnable.add(k);
          if (v === false) toDisable.add(k);
        });

        if (toEnable.size === 0 && toDisable.size === 0) return;

        set((state) => ({
          subscriptions: state.subscriptions.map((s) => {
            if (s.id !== subscriptionId) return s;

            // Map existing models by key
            const existingByKey = new Map<ModelKey, SubscriptionModel>(
              (s.models ?? []).map((m) => [m.key as ModelKey, m]),
            );

            // ENABLE models (create if needed)
            toEnable.forEach((k) => {
              const current = existingByKey.get(k);
              if (current) {
                existingByKey.set(k, { ...current, enabled: true });
              } else {
                const catalogModel = get().modelsCatalog[k];
                if (catalogModel) {
                  existingByKey.set(k, {
                    ...catalogModel,
                    enabled: true,
                    guardrails: catalogModel.guardrails ?? [],
                  });
                }
              }
            });

            // DISABLE models (keep them, but mark enabled=false)
            toDisable.forEach((k) => {
              const current = existingByKey.get(k);
              if (current) {
                existingByKey.set(k, { ...current, enabled: false });
              }
            });

            const nextModels = Array.from(existingByKey.values());

            return { ...s, models: nextModels, updatedAt: now() };
          }),
        }));

        invalidateSubscriptionEnrichers(subscriptionId, [
          SubscriptionEnricherKey.Models,
          SubscriptionEnricherKey.Usage,
        ]);

        // Build added/removed labels with name OR key (fallback)
        const catalog = get().modelsCatalog;
        const subAfter = get().getById(subscriptionId) ?? subBefore;

        const added = Array.from(toEnable).map((key) => {
          const modelName =
            catalog[key]?.name ||
            subAfter.models?.find((m) => m.key === key)?.name ||
            key;
          return modelName;
        });

        const removed = Array.from(toDisable).map((key) => {
          const modelName =
            catalog[key]?.name ||
            subAfter.models?.find((m) => m.key === key)?.name ||
            key;
          return modelName;
        });

        const labelBase =
          "subscription-configuration.consumerNotifications.subscriptionFieldLabels";

        get().addNotification(subscriptionId, {
          i18nKey:
            added.length > 0 || removed.length > 0
              ? "subscription-configuration.consumerNotifications.notificationsTexts.modelsUpdated"
              : "subscription-configuration.consumerNotifications.notificationsTexts.modelsUpdatedGeneral",
          i18nParams: {
            addedLabelKey: `${labelBase}.added`,
            removedLabelKey: `${labelBase}.removed`,
            added,
            removed,
          },
        });
      },

      updateSubscriptionGuardrails: async (
        subscriptionId: string,
        changes: {
          modelKey: ModelKey;
          guardrailKey: GuardrailKey;
          enforced: boolean;
        }[],
      ) => {
        const subBefore = get().getById(subscriptionId);
        if (!subBefore) throw new Error("Subscription not found");

        if (!changes || changes.length === 0) return;

        const { delayRangeMs, failureRate } = get().config;
        await wait(delayRangeMs[0], delayRangeMs[1]);
        if (Math.random() < failureRate) {
          throw new Error("Failed to update guardrails.");
        }

        // 1) Build a lookup map: modelKey -> guardrailKey -> enforced
        const modelUpdates = new Map<ModelKey, Map<GuardrailKey, boolean>>();

        for (const { modelKey, guardrailKey, enforced } of changes) {
          if (!modelUpdates.has(modelKey)) {
            modelUpdates.set(modelKey, new Map<GuardrailKey, boolean>());
          }
          modelUpdates.get(modelKey)!.set(guardrailKey, enforced);
        }

        // 2) Apply state updates
        set((state) => ({
          subscriptions: state.subscriptions.map((s) => {
            if (s.id !== subscriptionId) return s;

            const nextModels = (s.models ?? []).map((m) => {
              const guardrailMap = modelUpdates.get(m.key as ModelKey);
              if (!guardrailMap || !m.guardrails) return m;

              const nextGuardrails = m.guardrails.map((g) => {
                const key = g.key as GuardrailKey;
                if (!guardrailMap.has(key)) return g;
                return {
                  ...g,
                  enforced: guardrailMap.get(key)!,
                };
              });

              return { ...m, guardrails: nextGuardrails };
            });

            return { ...s, models: nextModels, updatedAt: now() };
          }),
        }));

        invalidateSubscriptionEnrichers(subscriptionId, [
          SubscriptionEnricherKey.Models,
        ]);

        // 3) Build ONE aggregated notification for all changes
        const addedLabels: string[] = [];
        const removedLabels: string[] = [];
        const catalog = get().modelsCatalog;
        const subAfter = get().getById(subscriptionId) ?? subBefore;

        changes.forEach(({ modelKey, guardrailKey, enforced }) => {
          const modelName =
            catalog[modelKey]?.name ||
            subAfter.models?.find((m) => m.key === modelKey)?.name ||
            modelKey;

          const label = `${modelName} / ${guardrailKey}`;

          if (enforced) {
            addedLabels.push(label);
          } else {
            removedLabels.push(label);
          }
        });

        const formatList = (items: string[]): string => {
          if (!items.length) return "";
          if (items.length === 1) return items[0];
          return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
        };

        let text = "Guardrails updated.";
        const parts: string[] = [];

        if (addedLabels.length) {
          parts.push(`enabled: ${formatList(addedLabels)}`);
        }
        if (removedLabels.length) {
          parts.push(`disabled: ${formatList(removedLabels)}`);
        }

        if (parts.length) {
          text = `Guardrails updated (${parts.join("; ")}).`;
        }

        // 4) Store-level notification (not notificationsService)
        get().addNotification(subscriptionId, { text });
      },
    }),

    {
      name: "maas-store",
      partialize: (state) => ({
        subscriptions: state.subscriptions,
        lastCreatedId: state.lastCreatedId,
        config: state.config,
        admin: { isAdmin: state.admin.isAdmin },
      }),
    },
  ),
);
