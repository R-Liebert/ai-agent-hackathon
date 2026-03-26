import React from "react";
import { FaChevronRight } from "react-icons/fa";
import { BreadcrumbItem } from "./types";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  loading: boolean;
  onBreadcrumbClick: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  loading,
  onBreadcrumbClick,
}) => {
  return (
    <div className="flex items-center gap-2 text-white-100/70">
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && (
            <FaChevronRight size={12} className="text-white-100/30" />
          )}
          <button
            onClick={() => !item.isLast && onBreadcrumbClick(item.path)}
            className={`hover:text-white-100 transition-colors ${
              item.isLast
                ? "text-white-100 cursor-default"
                : loading
                ? "opacity-50 pointer-events-none"
                : "hover:underline"
            }`}
            disabled={item.isLast || loading}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
