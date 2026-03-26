import React from "react";
import { useTranslation } from "react-i18next";
import type {
  SubscriptionGuardrail,
  ModelGuardrail,
} from "../../../types/maasTypes";

interface GuardrailCardProps {
  guardrail: SubscriptionGuardrail | ModelGuardrail;
}
export default function GuardrailCard({ guardrail }: GuardrailCardProps) {
  const { t } = useTranslation("subscriptions");

  // Title / description now come from translations based on guardrail.key
  const title = t(`common.guardrails.${guardrail.key}.title`);
  const description = t(`common.guardrails.${guardrail.key}.description`);

  return (
    <article
      className="flex flex-col border-2 border-gray-500 bg-gray-700 rounded-xl px-5 py-4 font-body"
      aria-labelledby={`guardrail-${guardrail.key}`}
    >
      <h4
        id={`guardrail-${guardrail.key}`}
        className="text-lg text-white-100 truncate font-light font-body"
      >
        {title}
      </h4>

      {description && (
        <p className="text-md text-gray-300 mt-2">{description}</p>
      )}
    </article>
  );
}
