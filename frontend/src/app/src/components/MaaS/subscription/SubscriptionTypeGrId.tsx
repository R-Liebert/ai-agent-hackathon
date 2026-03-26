import React from "react";
import { useTranslation } from "react-i18next";
import { TbChecks } from "react-icons/tb";
import { getSubscriptionTypeDetails } from "../../../utils/maas/getSubscriptionTypeDetails";

export type SubscriptionType = "NORMAL" | "SANDBOX";

type Props = {
  value: SubscriptionType;
  onChange: (next: SubscriptionType) => void;
  className?: string;
  showFeatures?: boolean;
};

export default function SubscriptionTypeCards({
  value,
  onChange,
  className = "",
  showFeatures = true,
}: Props) {
  const { t } = useTranslation("subscriptions");

  const normalFeatures =
    (t("createSubscription.subscriptionTypeCards.NORMAL.features", {
      returnObjects: true,
    }) as string[]) || [];
  const sandboxFeatures =
    (t("createSubscription.subscriptionTypeCards.SANDBOX.features", {
      returnObjects: true,
    }) as string[]) || [];

  const buildCard = (id: SubscriptionType) => {
    const {
      icon,
      color,
      title: defaultTitle,
    } = getSubscriptionTypeDetails(id, {
      size: 24,
      strokeWidth: 1.2,
    });

    const title =
      t(`createSubscription.subscriptionTypeCards.${id}.title`) ||
      defaultTitle ||
      id;

    const features = id === "SANDBOX" ? sandboxFeatures : normalFeatures;

    return { id, title, icon, color, features };
  };

  const cards = [buildCard("SANDBOX"), buildCard("NORMAL")];

  const select = (id: SubscriptionType) => onChange(id);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const order: SubscriptionType[] = ["NORMAL", "SANDBOX"];
    const idx = order.indexOf(value);
    const next =
      e.key === "ArrowRight"
        ? order[(idx + 1) % order.length]
        : order[(idx - 1 + order.length) % order.length];
    onChange(next);
  };

  return (
    <div className={className}>
      <p className="text-white-100 text-md font-body mb-4">
        {showFeatures
          ? t("createSubscription.subscriptionTypeCards.label")
          : "Subscription Type"}
      </p>

      <div
        role="radiogroup"
        aria-label={t("createSubscription.subscriptionTypeCards.label")}
        className="grid grid-cols-[repeat(auto-fit,minmax(205px,1fr))] gap-4 xl:gap-8"
        onKeyDown={onKeyDown}
      >
        {cards.map((c) => {
          const selected = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(c.id)}
              aria-label={String(c.title)}
              data-selected={selected ? "true" : "false"}
              className={[
                "text-left border-gray-500 rounded-xl border-2 transition focus:outline-none hover:bg-gray-650",
                showFeatures ? "p-4" : "p-3",
                selected ? "bg-gray-600" : "bg-transparent",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: c.color }}>{c.icon}</span>
                <div className="text-white-100 font-medium">{c.title}</div>
                {/* Optional: visually hidden text so SRs announce selection */}
                <span className="sr-only">{selected ? " (valgt)" : ""}</span>
              </div>
              {showFeatures && (
                <ul className="mt-4 ml-1 space-y-1">
                  {Array.isArray(c.features) &&
                    c.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <TbChecks
                          size={16}
                          strokeWidth={1.2}
                          className="!text-[#66CA6D]"
                        />
                        <span
                          className={`text-sm ${
                            selected ? "text-white-100" : "text-gray-300"
                          } text-body`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
