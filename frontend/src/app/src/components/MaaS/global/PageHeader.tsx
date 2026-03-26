import React from "react";

interface SubscriptionPageTitleProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function SubscriptionPageTitle({
  title,
  subtitle,
  children,
}: SubscriptionPageTitleProps) {
  return (
    <div className="w-full flex flex-col mt-5 sm:mt-3 mb-8">
      <div className="flex items-center gap-6 w-full">
        <h1 className="text-3xl font-headers font-medium text-white-100 capitalize">
          {title}
        </h1>
        {children && (
          <div className="flex flex-1 gap-8 items-center">{children}</div>
        )}
      </div>
      {subtitle && (
        <p className="text-gray-300 text-lg font-body">{subtitle}</p>
      )}
    </div>
  );
}
