import React from "react";
import { TbAlertCircle, TbTransactionDollar } from "react-icons/tb";
import { useTranslation } from "react-i18next";

export interface EmptyStateNoticeProps {
  title?: string;
  description?: string;
  subscriptionName?: string;
}

export default function EmptyStateNotice({
  title,
  description,
}: EmptyStateNoticeProps) {
  const { t } = useTranslation("subscriptions");

  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-gray-700/80 border-2 border-gray-500 rounded-3xl flex flex-col items-center justify-center p-12 font-body gap-4 w-full"
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-[#E7B861]">
        <TbAlertCircle size={42} />
      </span>

      <div className="flex flex-col w-full items-center text-center gap-1">
        {title && <h3 className="text-lg font-normal">{title}</h3>}

        {description && (
          <p className="text-md font-body font-light">{description}</p>
        )}
      </div>
      <span className="text-gray-400">
        <TbTransactionDollar size={128} strokeWidth={1} />
      </span>
    </div>
  );
}
