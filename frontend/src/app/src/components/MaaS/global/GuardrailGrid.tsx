import React from "react";
import { useTranslation } from "react-i18next";
import type {
  SubscriptionGuardrail,
  ModelGuardrail,
} from "../../../types/maasTypes";
import GuardrailCard from "./GuardrailCard";

type GuardrailGridScope = "SUBSCRIPTION" | "MODEL";

interface GuardrailGridProps {
  scope: GuardrailGridScope;
  guardrails: Array<SubscriptionGuardrail | ModelGuardrail>;
  hideHeading?: boolean;
}

const isSubscriptionGuardrail = (
  guardrail: SubscriptionGuardrail | ModelGuardrail,
): guardrail is SubscriptionGuardrail => guardrail?.scope === "SUBSCRIPTION";

const isModelGuardrail = (
  guardrail: SubscriptionGuardrail | ModelGuardrail,
): guardrail is ModelGuardrail => guardrail?.scope === "MODEL";

export default function GuardrailGrid({
  scope,
  guardrails,
  hideHeading = false,
}: GuardrailGridProps) {
  const { t } = useTranslation("subscriptions");

  // No filtering: show all guardrails
  const allGuardrails = guardrails || [];

  if (!allGuardrails || allGuardrails.length === 0) {
    return null;
  }

  const headingLabel =
    scope === "SUBSCRIPTION"
      ? t("subscriptionDetails.sectionTitles.guardrails")
      : t("modelDetails.sections.guardrails");

  return (
    <section className="flex flex-col" aria-labelledby="guardrails-section">
      {!hideHeading && (
        <h3
          id="guardrails-heading"
          className="text-lg font-normal font-body mb-6 text-white"
        >
          {headingLabel}
        </h3>
      )}
      <div className="grid gap-7 sm:grid-cols-1 md:grid-cols-2">
        {allGuardrails.map((guardrail) => (
          <GuardrailCard key={guardrail.key} guardrail={guardrail} />
        ))}
      </div>
    </section>
  );
}
