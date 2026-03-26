import CircularProgress from "@mui/material/CircularProgress/CircularProgress";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TbChevronDown } from "react-icons/tb";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type SelectBaseProps = {
  id?: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  dense?: boolean;
  density?: "default" | "compact" | "cozy";
  isSubscriptionElement?: boolean;
  ariaLabel?: string;
  onSelect: (v: string) => void;
  dropdownMode?: "container" | "clamp" | "content";
  minDropdownPx?: number;
  maxDropdownPx?: number;
  searchable?: boolean;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
};

export const SelectBase: React.FC<SelectBaseProps> = ({
  id,
  value,
  options,
  placeholder,
  disabled,
  dense = false,
  density,
  isSubscriptionElement = false,
  ariaLabel,
  onSelect,
  dropdownMode = "container",
  minDropdownPx = 100,
  maxDropdownPx = 1000,
  searchable = false,
  onSearch,
  isLoading,
  hasMore,
  onLoadMore,
}) => {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Width tracking
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>(
    undefined,
  );
  const listboxRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState<number>(0);

  // Offscreen pre-measure container for "content" mode
  const offscreenRef = useRef<HTMLDivElement>(null);

  const resolvedDensity: "default" | "compact" | "cozy" =
    density ?? (dense ? "compact" : "default");

  const densityTokens = {
    default: {
      trigger: "text-md px-4 py-3 rounded-xl",
      chevron: 20,
      itemText: "text-md",
      itemPad: "px-4 py-2",
    },
    compact: {
      trigger: "text-sm px-4 py-2 rounded-xl min-w-[3rem] capitalize",
      chevron: 16,
      itemText: "text-sm",
      itemPad: "px-3 py-1",
    },
    cozy: {
      trigger: "bg-gray-900/60 text-sm px-4 py-3 rounded-xl",
      chevron: 18,
      itemText: "text-sm",
      itemPad: "px-4 py-2",
    },
  } as const;

  const tokens = densityTokens[resolvedDensity];

  const base =
    "w-full border-2 font-body text-white-100 outline-none placeholder-gray-300 transition capitalize";

  const theme = (() => {
    if (isSubscriptionElement) {
      if (density === "cozy") {
        return " border-gray-500 sm:border-transparent";
      } else {
        return "bg-gray-700 sm:bg-gray-650 border-gray-500 sm:border-transparent";
      }
    } else {
      switch (density) {
        case "cozy":
          return "bg-gray-700 border-gray-500";
        case "compact":
          return "bg-transparent border-gray-400";
        default:
          return "bg-transparent border-gray-500";
      }
    }
  })();

  const focus =
    "focus:outline-none focus:ring-1 focus-visible:ring-1 focus:border-white-100";

  // Measure trigger/container width — also when closed
  const measureTriggerWidth = () => {
    const w =
      triggerRef.current?.offsetWidth ??
      containerRef.current?.offsetWidth ??
      undefined;
    setDropdownWidth(w);
  };

  // Measure the natural content width of the visible listbox
  const measureContentWidthVisible = () => {
    if (!listboxRef.current) return;
    const sw = listboxRef.current.scrollWidth || 0;
    if (sw > 0) setContentWidth(sw);
  };

  // Pre-measure content width offscreen (before opening)
  const measureOffscreenContentWidth = () => {
    if (!offscreenRef.current) return;
    const sw =
      offscreenRef.current.scrollWidth || offscreenRef.current.offsetWidth || 0;
    if (sw > 0) setContentWidth(sw);
  };

  // Measure trigger width on mount and whenever layout could change
  useLayoutEffect(() => {
    measureTriggerWidth();
  }, []);

  // Re-measure trigger width on resize (open or closed)
  useEffect(() => {
    const onResize = () => {
      measureTriggerWidth();
      if (open) {
        requestAnimationFrame(measureContentWidthVisible);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  // Pre-measure offscreen whenever options or density/theme changes
  useLayoutEffect(() => {
    if (dropdownMode === "content") {
      measureOffscreenContentWidth();
      // Re-measure after fonts finish loading (if supported), to avoid first-frame mismatch
      // Guard for SSR
      if (typeof document !== "undefined" && (document as any).fonts?.ready) {
        (document as any).fonts.ready.then(() => {
          measureOffscreenContentWidth();
        });
      }
    }
  }, [dropdownMode, options, density, isSubscriptionElement]);

  // When opening, measure visible content width and update (double RAF)
  useLayoutEffect(() => {
    if (!open) return;
    measureTriggerWidth();
    requestAnimationFrame(() => {
      measureContentWidthVisible();
      requestAnimationFrame(() => {
        measureContentWidthVisible();
      });
    });
  }, [open, options, density, resolvedDensity]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        const idx = Math.max(
          0,
          validOptions.findIndex((o) => o.value === validValue),
        );
        setHighlight(idx);
      } else {
        setHighlight((prev) => {
          if (validOptions.length === 0) return prev;
          const delta = e.key === "ArrowDown" ? 1 : -1;
          const next =
            prev === -1
              ? 0
              : (prev + delta + validOptions.length) % validOptions.length;
          return next;
        });
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        const idx = Math.max(
          0,
          validOptions.findIndex((o) => o.value === validValue),
        );
        setHighlight(idx);
      } else if (highlight >= 0 && validOptions[highlight]) {
        handleSelect(validOptions[highlight].value);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  const onListboxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((prev) => {
        if (validOptions.length === 0) return prev;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const next =
          prev === -1
            ? 0
            : (prev + delta + validOptions.length) % validOptions.length;
        return next;
      });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlight >= 0 && validOptions[highlight]) {
        handleSelect(validOptions[highlight].value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const clampedWidth =
    dropdownWidth !== undefined
      ? Math.min(Math.max(dropdownWidth, minDropdownPx), maxDropdownPx)
      : minDropdownPx;

  //Content-mode width
  const contentModeWidth = (() => {
    const triggerW = dropdownWidth ?? 0;
    const base = Math.max(triggerW, contentWidth, minDropdownPx);
    return Math.min(base, maxDropdownPx);
  })();

  // Pick width based on mode
  const appliedWidth =
    dropdownMode === "content"
      ? contentModeWidth
      : dropdownMode === "clamp"
        ? clampedWidth
        : undefined; // "container" uses w-full

  // Fallback: on the very first open before measurements stabilize, let CSS lay out naturally
  const shouldUseMaxContentFallback =
    dropdownMode === "content" &&
    open &&
    (contentWidth === 0 || dropdownWidth === undefined);

  // Filter options based on search query
  const filteredOptions = onSearch
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );

  const hasRealOptions = filteredOptions.length > 0;

  // Only show "No options" if not loading and no data
  const validOptions =
    hasRealOptions || isLoading
      ? filteredOptions
      : [{ value: "", label: "No options available" }];

  // Validate value against options
  const selected = validOptions.find((o) => o.value === value);
  const validValue = selected ? value : validOptions[0]?.value || "";
  const displayLabel = selected?.label ?? placeholder ?? "Select an option";

  const toggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (next: string) => {
    onSelect(next);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleListScroll = (e: React.UIEvent<HTMLUListElement>) => {
    if (!onLoadMore || !hasMore || isLoading) return;

    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;

    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    const threshold = 32; // px from bottom to trigger
    if (distanceFromBottom <= threshold) {
      onLoadMore();
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col w-full relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id || "select"}-listbox`}
        aria-label={ariaLabel}
        className={[
          base,
          theme,
          focus,
          "text-left pr-8 relative",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          tokens.trigger,
        ].join(" ")}
        onClick={toggle}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={validValue ? "text-white-100" : "text-gray-300"}>
          {displayLabel}
        </span>
        <span className="pointer-events-none absolute right-2 inset-y-0 flex items-center text-gray-300 transition-transform transform-gpu">
          <TbChevronDown
            size={tokens.chevron}
            aria-hidden="true"
            className={open ? "rotate-180" : ""}
          />
        </span>
      </button>

      {/* Offscreen pre-measure container (only for content mode) */}
      {dropdownMode === "content" && (
        <div
          ref={offscreenRef}
          // Use same border/theme so width includes border and padding correctly
          className={[
            "rounded-xl border-2",
            isSubscriptionElement
              ? "bg-gray-650 border-gray-500"
              : "bg-gray-700 border-gray-500",
            "inline-block",
          ].join(" ")}
          style={{
            position: "absolute",
            left: -99999,
            top: -99999,
            visibility: "hidden",
            width: "max-content",
            overflow: "visible",
          }}
        >
          <ul className="py-1 flex flex-col gap-1">
            {validOptions.map((opt) => (
              <li className="w-full" key={opt.value}>
                <button
                  type="button"
                  className={[
                    "w-full text-left flex items-center capitalize",
                    tokens.itemPad,
                    tokens.itemText,
                    "bg-transparent text-white-100",
                    "whitespace-nowrap",
                  ].join(" ")}
                >
                  <span>{opt.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <div
          ref={listboxRef}
          id={`${id || "select"}-listbox`}
          role="listbox"
          aria-activedescendant={
            highlight >= 0
              ? `${id || "select"}-opt-${validOptions[highlight].value}`
              : undefined
          }
          tabIndex={-1}
          onKeyDown={onListboxKeyDown}
          className={[
            "absolute left-0 top-full mt-2 z-[999] shadow-lg",
            "rounded-xl border-2 border-gray-500",
            isSubscriptionElement ? "bg-gray-650" : "bg-gray-700",
            "overflow-hidden",
            dropdownMode === "container" ? "w-full" : "",
          ].join(" ")}
          style={
            dropdownMode === "container"
              ? undefined
              : shouldUseMaxContentFallback
                ? {
                    width: "max-content",
                    minWidth: minDropdownPx,
                    maxWidth: maxDropdownPx,
                  }
                : {
                    width: appliedWidth,
                    minWidth: minDropdownPx,
                    maxWidth: maxDropdownPx,
                  }
          }
        >
          {/* Search Bar */}
          {searchable && (
            <div className="px-4 py-2 border-b border-gray-500 bg-gray-700">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search..."
                className="w-full border-none outline-none border-gray-500 font-body text-md rounded-lg bg-gray-700  text-white-100 placeholder-gray-300"
              />
            </div>
          )}

          {/* Initial loader (before any items) */}
          {isLoading && validOptions.length === 0 && (
            <div className="flex items-center justify-center py-4">
              <CircularProgress
                size={16}
                color="inherit"
                style={{ color: "white" }}
              />
            </div>
          )}
          {validOptions.length > 0 && (
            <ul
              onScroll={handleListScroll}
              className="max-h-48 overflow-auto py-1 flex flex-col gap-[2px]"
            >
              {validOptions.map((opt, idx) => {
                const isSelected = opt.value === validValue;
                const isActive = idx === highlight;
                return (
                  <li
                    className="w-full"
                    key={opt.value}
                    id={`${id || "select"}-opt-${opt.value}`}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={[
                        "w-full text-left transition-colors flex items-center capitalize",
                        tokens.itemPad,
                        tokens.itemText,
                        isSelected
                          ? "bg-gray-400 text-white-100"
                          : "bg-transparent text-white-100",
                        "hover:bg-gray-600 hover:text-white-100",
                        "focus:bg-gray-400 focus:text-white-100",
                        "whitespace-nowrap",
                      ].join(" ")}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(opt.value)}
                    >
                      <span>{opt.label}</span>
                    </button>
                  </li>
                );
              })}

              {hasMore && (
                <li className="w-full flex items-center justify-center py-2">
                  {isLoading && (
                    <CircularProgress
                      size={16}
                      color="inherit"
                      style={{ color: "white" }}
                    />
                  )}
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
