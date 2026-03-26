import React from "react";
import { TbFlask2, TbRocket } from "react-icons/tb";

export type SubscriptionType = "SANDBOX" | "NORMAL";

type IconOpts = {
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
};

type SubscriptionTypeEntry = {
  title: string;
  defaultColor: string;
  render: (opts: {
    size: number;
    strokeWidth: number;
    color: string;
    className?: string;
  }) => React.ReactElement;
};

const SUBSCRIPTION_TYPE_MAP: Record<SubscriptionType, SubscriptionTypeEntry> = {
  SANDBOX: {
    title: "Sandbox",
    defaultColor: "#787AFF",
    render: ({ size, strokeWidth, color, className }) => (
      <TbFlask2
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        className={className}
      />
    ),
  },
  NORMAL: {
    title: "Application",
    defaultColor: "#DC9173",
    render: ({ size, strokeWidth, color, className }) => (
      <TbRocket
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        className={className}
      />
    ),
  },
};

export function getSubscriptionTypeDetails(
  type: SubscriptionType,
  opts: IconOpts = {}
): { title: string; icon: React.ReactElement; color: string } {
  const entry = SUBSCRIPTION_TYPE_MAP[type];

  const size = opts.size ?? 24;
  const strokeWidth = opts.strokeWidth ?? 1.2;
  // IMPORTANT: resolved color defaults to the type’s defaultColor unless explicitly overridden
  const color = opts.color ?? entry.defaultColor;

  const icon = entry.render({
    size,
    strokeWidth,
    color,
    className: opts.className,
  });

  return { title: entry.title, icon, color };
}
