import React from "react";
import type { SubscriptionEntity } from "../../../types/maasTypes";
import { getSubscriptionTypeDetails } from "../../../utils/maas/getSubscriptionTypeDetails";

type Variant = "page" | "card";

interface SubscriptionTypeProps {
  type?: SubscriptionEntity["type"] | string;
  variant?: Variant;
}

const variantSizing: Record<Variant, string> = {
  page: "text-sm gap-2",
  card: "text-xs gap-1",
};

const iconSizeByVariant: Record<Variant, number> = {
  page: 20,
  card: 16,
};

const strokeWidthByVariant: Record<Variant, number> = {
  page: 2,
  card: 1.8,
};

const baseBadge =
  "flex items-center justify-center rounded-full capitalize border-2 border-gray-500 bg-gray-650 px-3 py-2";

export default function SubscriptionType({
  type = "SANDBOX",
  variant = "card",
}: SubscriptionTypeProps) {
  const v = {
    iconSize: iconSizeByVariant[variant],
    strokeWidth: strokeWidthByVariant[variant],
  };

  const { title, icon, color } = getSubscriptionTypeDetails(type as any, {
    size: v.iconSize,
    strokeWidth: v.strokeWidth,
  });

  return (
    <span
      className={`${baseBadge} ${variantSizing[variant]}`}
      style={{ color }}
      aria-label={`Subscription type: ${title}`}
      title={title}
    >
      {icon}
      {title}
    </span>
  );
}
