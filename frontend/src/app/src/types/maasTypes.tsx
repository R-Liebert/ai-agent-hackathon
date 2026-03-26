import type { IconType } from "react-icons";

/* ============================
 *  Subscription & Model Status
 * ============================ */

export type SubscriptionStatus =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "FAILED"
  | "CANCELLED"
  | "DEACTIVATED"
  | "BLOCKED";

export type ModelStatus = "ACTIVE" | "DISABLED";

/* ============================
 *  Model Keys
 * ============================ */

export type ModelKey = string;

/* ============================
 *  Admin
 * ============================ */

export interface AdminState {
  isAdmin: boolean;
  setAdmin: (value: boolean) => void;
}

/* ============================
 *  Notifications (shared base)
 * ============================ */

export interface NotificationItem {
  id: string;
  text?: string;
  timestamp: number;
  firstSeenAt?: number;
  dismissed?: boolean;
  i18nKey?: string;
  i18nParams?: Record<string, unknown>;
  scope?: "SUBSCRIPTION" | "MODEL";
  subscriptionId?: string;
  modelKey?: ModelKey;
  category?: "system" | "usage" | "guardrail" | "maintenance";
}

export interface SubscriptionNotification extends NotificationItem {
  scope: "SUBSCRIPTION";
  subscriptionId: string;
}

export interface ModelNotification extends NotificationItem {
  scope: "MODEL";
  modelKey: ModelKey;
}

/* ============================
 *  Guardrails
 * ============================ */

// Allow any guardrail key string
export type GuardrailKey = string;

export interface GuardrailParamMeta {
  name: string;
  type: "number" | "boolean" | "string" | "unknown";
  description?: string;
}

export interface Guardrail {
  key: GuardrailKey;
  defaultEnabledSubscription: boolean;
  defaultEnforcedModel: boolean;
  params?: GuardrailParamMeta[];
}

export interface ModelGuardrail extends Guardrail {
  scope: "MODEL";
  modelKey: ModelKey;
  enforced: boolean;
}

export interface SubscriptionGuardrail extends Guardrail {
  scope: "SUBSCRIPTION";
  subscriptionId: string;
  enabled: boolean;
}

/* ============================
 *  Catalog Model (Discovery / Model Details)
 * ============================ */

export interface Model {
  key: ModelKey;
  name: string;
  description: string;
  provider: string;
  status: ModelStatus;
  endpointUrl: string;
  capabilities: string[];
  contextWindow: number;
  pricingInput: number; // DKK per 1k tokens
  pricingOutput: number; // DKK per 1k tokens
  dateCreated: number;
  guardrails?: ModelGuardrail[];
  notifications?: ModelNotification[];
}

/* ============================
 *  Subscription Model Instance
 * ============================ */

export interface SubscriptionModel extends Model {
  enabled: boolean;
}

/* ============================
 *  Token / Usage / Cost
 * ============================ */

export interface TokenUsage {
  granted: number;
  used: number;
  period?: "monthly" | "rolling_30d";
}

export interface RequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export interface CostStats {
  totalCost: number;
  currency: string;
}

/* DTO for aggregated subscription usage details */
export type SubscriptionUsage = {
  tokenUsage: TokenUsage;
  requestStats: RequestStats;
  costStats: CostStats;
};

/* ============================
 *  API Key
 * ============================ */

export interface ApiKeyMeta {
  secretId: string;
  last4: string;
  createdAt: number;
  status: "ACTIVE" | "REVOKED";
}

/* ====================
 *  Submitted Requests
 * ==================== */

export type RequestType =
  | "QUOTA_INCREASE"
  | "MODEL_ACCESS"
  | "EXTEND_SUBSCRIPTION"
  | "ACTIVATE_SUBSCRIPTION"
  | "DEACTIVATE_SUBSCRIPTION";

export type RequestStatus = "PENDING" | "APPROVED" | "DECLINED";

export interface ApplicationReference {
  id: string;
  name: string;
  applicationId: string;
}

export interface AdGroupReference {
  id: string;
  name: string;
}

export interface QuotaIncreasePayload {
  newTokenLimit: number;
  newRateLimit: number;
  newRequestLimit: number;
  justification: string;
}

export interface ModelAccessPayload {
  modelKeys: ModelKey[];
  justification: string;
}

export interface ExtendSubscriptionPayload {
  justification: string;
  expiryTs: number;
}

export interface ActivateSubscriptionPayload {
  justification?: string;
}

export interface DeactivateSubscriptionPayload {
  justification?: string;
}

export type SubmittedRequestPayload =
  | QuotaIncreasePayload
  | ModelAccessPayload
  | ExtendSubscriptionPayload
  | ActivateSubscriptionPayload
  | DeactivateSubscriptionPayload;

export interface SubmittedRequest {
  id: string;
  subscriptionId: string;
  type: RequestType;
  createdAt: number;
  status: RequestStatus;
  payload: SubmittedRequestPayload;
}

export type ApiResponseStatus = "SUCCESS" | "ERROR";

export interface ApiRequestLog {
  id: string;
  subscriptionId: string;
  timestamp: number;
  modelKey: ModelKey;
  tokensUsed: number;
  responseTimeMs: number;
  responseStatus: ApiResponseStatus;
}

/* ============================
 *  Admin Transactions (side-effect actions posted to the Management API)
 * ============================ */

export type SubscriptionAdminAction =
  | "APPROVE"
  | "CANCEL"
  | "DELETE"
  | "DISABLE"
  | "ENABLE"
  | "EXTEND";

export interface TransactionRequest {
  subscriptionId: string;
  action: SubscriptionAdminAction;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface TransactionResponse extends TransactionRequest {
  id: string;
  performedBy: string;
  performedAt: string;
  status: string;
}

/* ============================
 *  Admin Actions (Audit)
 * ============================ */

export type AdminAction =
  | "approve"
  | "approveAgain"
  | "reject"
  | "deactivate" // admin path → BLOCKED
  | "delete"
  | "expiryDateUpdate"
  | "reactivate";

export interface AdminActionEntry {
  id: string;
  type: AdminAction;
  timestamp: number;
  justification?: string;
}

export type AdminTab =
  | "pending"
  | "approved"
  | "sandbox"
  | "rejected"
  | "deactivated"
  | "models"
  | "guardrails"
  | "requests";

/* ============================
 *  Subscription Entity
 * ============================ */

export interface SubscriptionEntity {
  id: string;
  type: "NORMAL" | "SANDBOX";
  status: SubscriptionStatus;
  createdAt: number;
  updatedAt: number;
  name: string;
  subscriptionPurpose: string;
  environment?: "PROD" | "NON_PROD";
  applicationReference?: ApplicationReference;
  applicationRefFreeText?: string;
  department?: string;
  adGroupReference?: AdGroupReference;
  tokenUsage: TokenUsage;
  models: SubscriptionModel[];
  guardrails?: SubscriptionGuardrail[]; // TRANSFERRED TO MODEL LEVEL
  requestStats?: RequestStats;
  costStats?: CostStats;
  apiKeyMeta?: ApiKeyMeta;
  notifications?: SubscriptionNotification[];
  submittedRequests?: SubmittedRequest[];
  apiRequests?: ApiRequestLog[];
  user: string;
  expirationDate?: number;
  adminActions?: AdminActionEntry[];
  /** Frontend-only flag. Indicates the subscription was loaded via the admin endpoint and is not in the user's own managed list */
  _loadedViaAdmin?: boolean;
}

/* ============================
 *  Forms
 * ============================ */

export interface NormalFormValues {
  subscriptionName: string;
  department: string;
  subscriptionPurpose: string;
  environment: "PROD" | "NON_PROD";
  applicationReference: ApplicationReference | null;
  applicationOther?: string;
  adGroupReference: AdGroupReference | null;
}

export interface SandboxFormValues {
  subscriptionName: string;
  department: string;
  subscriptionPurpose: string;
  applicationRefFreeText: string;
}

/* ============================
 *  Derived Types & Guards
 * ============================ */

export type ApprovedNormalSubscription = SubscriptionEntity & {
  status: "ACTIVE";
  type: "NORMAL";
};

export type ApprovedSandboxSubscription = SubscriptionEntity & {
  status: "ACTIVE";
  type: "SANDBOX";
};

export type PendingSubscription = SubscriptionEntity & {
  status: "PENDING_APPROVAL";
};

export type RejectedSubscription = SubscriptionEntity & {
  status: "CANCELLED" | "FAILED";
};

export type DeactivatedSubscription = SubscriptionEntity & {
  status: "DEACTIVATED" | "BLOCKED";
};

export const isApprovedNormal = (
  s: SubscriptionEntity,
): s is ApprovedNormalSubscription =>
  s.status === "ACTIVE" && s.type === "NORMAL";

export const isApprovedSandbox = (
  s: SubscriptionEntity,
): s is ApprovedSandboxSubscription =>
  s.status === "ACTIVE" && s.type === "SANDBOX";

export const isPending = (s: SubscriptionEntity): s is PendingSubscription =>
  s.status === "PENDING_APPROVAL";

export const isRejected = (s: SubscriptionEntity): s is RejectedSubscription =>
  s.status === "CANCELLED" || s.status === "FAILED";

export const isDeactivated = (
  s: SubscriptionEntity,
): s is DeactivatedSubscription =>
  s.status === "DEACTIVATED" || s.status === "BLOCKED";

/* ============================
 *  Metrix
 * ============================ */

export type MetrixKey =
  | "totalTokens"
  | "totalRequests"
  | "totalCost"
  | "averageTokensPerRequest"
  | "successfulRequests"
  | "failedRequests"
  | "contextWindow"
  | "inputPricePerThousand"
  | "outputPricePerThousand"
  | "activeSubscriptionsForModel";

export interface MetrixItem {
  key: MetrixKey;
  label: string;
  value: string;
  Icon: IconType;
  iconColor: string;
  tooltip?: string;
}

/* ============================
 *  ServiceNow Application
 * ============================ */
export interface ServiceNowApplication {
  id: string;
  name: string;
  applicationId: string;
}

/* ============================
 *  AD group
 * ============================ */
export interface AdGroup {
  id: string;
  name: string;
}

/* ============================
 *  Paginated response
 * ============================ */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ============================
 *  Subscription Detail Enricher
 * ============================ */

export enum SubscriptionEnricherKey {
  Models = "models",
  Usage = "usage",
  ApiKeyMeta = "apiKeyMeta",
}

export type SubscriptionEnricher = {
  key: SubscriptionEnricherKey;
  fn: (id: string) => Promise<Partial<SubscriptionEntity>>;
};

/* ============================
 *  Guardrail Notification Buffer Entry
 * ============================ */

export type GuardrailNotificationBufferEntry = {
  timeoutId?: number;
  added: string[]; // labels for guardrails that ended up enabled
  removed: string[]; // labels for guardrails that ended up disabled
};
