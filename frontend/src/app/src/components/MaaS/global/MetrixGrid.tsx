import React from "react";
import { MetrixItem } from "../../../types/maasTypes";

interface MetrixGridProps {
  items: MetrixItem[];
  loading?: boolean;
  onItemClick?: (item: MetrixItem) => void;
}

/* Skeleton matches the card layout 1:1 to avoid layout shift */
function SkeletonCard() {
  return (
    <article
      className="flex border-2 border-gray-500 bg-gray-700 rounded-xl p-4 animate-pulse min-h-[88px]"
      aria-hidden="true"
    >
      <div className="flex-1 min-w-0 font-body">
        <div className="h-4 w-28 max-w-[60%] bg-gray-600 rounded mb-2" />
        <div className="h-5 w-36 max-w-[70%] bg-gray-500 rounded" />
      </div>
      <div className="flex items-start justify-start mb-2">
        <div
          className="rounded-md bg-gray-600"
          style={{ width: 40, height: 40 }}
        />
      </div>
    </article>
  );
}

function MetrixCard({
  item,
  onClick,
}: {
  item: MetrixItem;
  onClick?: (item: MetrixItem) => void;
}) {
  const content = (
    <article
      className="flex border-2 border-gray-500 bg-gray-700 rounded-xl p-4 min-h-[88px]"
      aria-label={item.label}
    >
      <div className="flex-1 min-w-0 font-body">
        <div className="flex items-center gap-1">
          <span className="text-md text-gray-300">{item.label}</span>
        </div>
        <div className="font-medium text-lg text-white-100">{item.value}</div>
      </div>
      <div className="flex items-start justify-start mb-2">
        <div className="flex items-center justify-center">
          <item.Icon size={24} strokeWidth={1.4} color={item.iconColor} />
        </div>
      </div>
    </article>
  );

  return content;
}

export default function MetrixGrid({
  items,
  loading = false,
  onItemClick,
}: MetrixGridProps) {
  const skeletonCount = Math.max(4, items?.length || 0);

  return (
    <section>
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        }}
      >
        {loading
          ? Array.from({ length: skeletonCount }).map((_, idx) => (
              <SkeletonCard key={`skeleton-${idx}`} />
            ))
          : items.map((item) => (
              <MetrixCard key={item.key} item={item} onClick={onItemClick} />
            ))}
      </div>
    </section>
  );
}
