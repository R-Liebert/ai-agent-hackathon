import React, { useState } from "react";
import { TbChevronDown } from "react-icons/tb";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isModels?: boolean;
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  isModels = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="w-full bg-transparent">
      <button
        type="button"
        className={`w-full flex items-center ${!open ? "border-b-2 border-b-gray-500 pb-8" : "pb-6"} justify-between text-left`}
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-lg font-body font-light text-white-100">
            {title}
          </h3>
        </div>
        <TbChevronDown
          size={24}
          strokeWidth={1.6}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          className={`${isModels ? "" : "bg-gray-700 border-2 border-gray-500 grid p-8"} w-full rounded-2xl font-body`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
