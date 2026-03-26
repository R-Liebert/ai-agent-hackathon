import React from "react";
import type {
  SubscriptionStatus as SubscriptionStatusType,
  ModelStatus,
  RequestStatus,
} from "../../../types/maasTypes";
import { useTranslation } from "react-i18next";
import { labelForStatusScoped } from "../../../utils/maas/maasConfigs";

// ...

type Variant = "page" | "card";
type StatusPillProps =
  | {
      scope: "subscription";
      status?: SubscriptionStatusType;
      variant?: Variant;
    }
  | { scope: "model"; status?: ModelStatus; variant?: Variant }
  | { scope: "request"; status?: RequestStatus; variant?: Variant };

const SubscriptionStatus: React.FC<StatusPillProps> = ({
  scope,
  status,
  variant = "card",
}) => {
  const { t } = useTranslation("subscriptions");

  const variantSizing: Record<Variant, string> = {
    page: "text-sm",
    card: "text-xs",
  };

  // Centralized style palette;
  const statusStyles = {
    ACTIVE: "bg-transparent border-2 border-[#66CA6D] text-[#66CA6D]",
    APPROVED: "bg-transparent border-2 border-[#66CA6D] text-[#66CA6D]",
    PENDING_APPROVAL: "bg-transparent border-2 border-[#E7B861] text-[#E7B861]",
    PENDING: "bg-transparent border-2 border-[#E7B861] text-[#E7B861]",
    DECLINED: "bg-transparent border-2 border-[#F26B6B] text-[#F26B6B]",
    FAILED: "bg-transparent border-2 border-[#F26B6B] text-[#F26B6B]",
    CANCELLED: "bg-transparent border-2 border-red-200 text-red-200",
    DEACTIVATED: "bg-transparent border-2 border-gray-350 text-gray-300",
    BLOCKED: "bg-transparent border-2 border-gray-350 text-gray-300",
    DISABLED: "bg-transparent border-2 border-gray-350 text-gray-300",
    DEFAULT: "bg-gray-700 text-white-100",
  } as const;

  const rawDefault =
    scope === "subscription" || scope === "model" ? "ACTIVE" : "PENDING";

  const raw = String(status ?? rawDefault);
  const label = labelForStatusScoped(t, raw, scope);
  const statusClass =
    (statusStyles as Record<string, string>)[raw] ?? statusStyles.DEFAULT;

  return (
    <span
      className={`flex items-center justify-center rounded-full capitalize px-3 py-2 ${variantSizing[variant]} ${statusClass}`}
    >
      {label}
    </span>
  );
};

export default SubscriptionStatus;
