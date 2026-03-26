import React, { useMemo, useRef } from "react";

export type TabKey = string;
export interface TabItem {
  key: TabKey;
  label: string;
  disabled?: boolean;
}

interface TabsBarProps {
  items: TabItem[];
  activeKey: TabKey;
  onChange: (key: TabKey) => void;
  ariaLabel?: string;
  className?: string;
}

export default function TabsBar({
  items,
  activeKey,
  onChange,
  ariaLabel = "Tabs",
  className = "",
}: TabsBarProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const enabledIndexes = useMemo(
    () => items.map((_, i) => i).filter((i) => !items[i].disabled),
    [items]
  );

  const findEnabledIndex = (start: number, dir: 1 | -1) => {
    const len = items.length;
    let i = start;
    for (let steps = 0; steps < len; steps++) {
      i = (i + dir + len) % len;
      if (!items[i].disabled) return i;
    }
    return start;
  };

  const focusIndex = (i: number) => {
    const el = refs.current[i];
    if (el) el.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        focusIndex(findEnabledIndex(index, 1));
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusIndex(findEnabledIndex(index, -1));
        break;
      case "Home":
        e.preventDefault();
        focusIndex(enabledIndexes[0] ?? 0);
        break;
      case "End":
        e.preventDefault();
        focusIndex(
          enabledIndexes[enabledIndexes.length - 1] ?? items.length - 1
        );
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onChange(items[index].key);
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-3 flex-wrap border-2 border-gray-500 bg-gray-700 w-auto rounded-xl ${className}`}
    >
      {items.map((tab, index) => {
        const selected = activeKey === tab.key;
        const baseClasses =
          "px-4 py-2 bg-transparent font-body font-medium text-gray-300 text-md";
        const stateClasses = tab.disabled
          ? "bg-transparent text-gray-300 cursor-not-allowed opacity-60"
          : selected
          ? "text-white-100"
          : "text-gray-300";

        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            ref={(el) => (refs.current[index] = el)}
            aria-selected={selected}
            aria-controls={`tab-panel-${tab.key}`}
            tabIndex={selected ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[baseClasses, stateClasses].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
