import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import FilterSelect from "../../Global/FilterSelect";
import type { SelectOption } from "../../Global/SelectBase";
import { labelForStatus } from "../../../utils/maas/maasConfigs";

export type DiscoveryTab = "models" | "subscriptions";
export type ModelSortBy = "name" | "provider";
export type SortDir = "asc" | "desc";
export type SubSortBy =
  | "name"
  | "status"
  | "created"
  | "updated"
  | "utilization"
  | "activeModels";

type DiscoveryFiltersProps = {
  activeTab: DiscoveryTab;

  // Models filters/sorting
  providerOptions: SelectOption[];
  capabilityOptions: SelectOption[];
  providerFilter: string;
  capabilityFilter: string;
  modelSortBy: ModelSortBy;
  modelSortDir: SortDir;
  onProviderChange: (v: string) => void;
  onCapabilityChange: (v: string) => void;
  onModelSortByChange: (v: ModelSortBy) => void;
  onModelSortDirChange: (v: SortDir) => void;

  // Subscriptions filters/sorting
  subStatusOptions: SelectOption[];
  subTypeOptions: SelectOption[];
  subEnvOptions: SelectOption[];
  subStatus: string;
  subType: string;
  subSortBy: SubSortBy;
  subSortDir: SortDir;
  onSubStatusChange: (v: string) => void;
  onSubTypeChange: (v: string) => void;
  onSubSortByChange: (v: SubSortBy) => void;
  onSubSortDirChange: (v: SortDir) => void;

  className?: string;
};

export default function DiscoveryFilters({
  activeTab,

  providerOptions,
  capabilityOptions,
  providerFilter,
  capabilityFilter,
  modelSortBy,
  modelSortDir,
  onProviderChange,
  onCapabilityChange,
  onModelSortByChange,
  onModelSortDirChange,

  subStatusOptions,
  subTypeOptions,
  subEnvOptions,
  subStatus,
  subType,
  subSortBy,
  subSortDir,
  onSubStatusChange,
  onSubTypeChange,
  onSubSortByChange,
  onSubSortDirChange,

  className = "flex gap-3 !font-body",
}: DiscoveryFiltersProps) {
  const { t } = useTranslation("subscriptions");

  // Map status options to the same labels as SubscriptionStatus
  const mappedSubStatusOptions: SelectOption[] = useMemo(
    () =>
      subStatusOptions.map((opt) => ({
        value: opt.value,
        label: labelForStatus(t, opt.value),
      })),
    [subStatusOptions, t],
  );

  // Helper function to validate `value` against `options`
  const getValidValue = (value: string, options: SelectOption[]): string =>
    options.find((opt) => opt.value === value)?.value ||
    options[0]?.value ||
    "";

  // Validate options and values
  const validProviderOptions =
    providerOptions.length > 0
      ? providerOptions
      : [{ value: "ALL", label: "All" }];
  const validCapabilityOptions =
    capabilityOptions.length > 0
      ? capabilityOptions
      : [{ value: "ALL", label: "All" }];
  const validProviderFilter = getValidValue(
    providerFilter,
    validProviderOptions,
  );
  const validCapabilityFilter = getValidValue(
    capabilityFilter,
    validCapabilityOptions,
  );

  if (activeTab === "models") {
    return (
      <div className={className}>
        {/* Provider */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="models-provider-select"
            className="text-xs text-gray-300"
          >
            {t("discovery.filters.providers")}
          </label>
          <FilterSelect
            id="models-provider-select"
            value={validProviderFilter}
            onValueChange={(v: string) => onProviderChange(v)}
            options={validProviderOptions}
            ariaLabel={t("discovery.filters.providers") || "Provider"}
            dropdownMode="content"
            minDropdownPx={130}
          />
        </div>

        {/* Capability */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="models-capability-select"
            className="text-xs text-gray-300"
          >
            {t("discovery.filters.capabilities")}
          </label>
          <FilterSelect
            id="models-capability-select"
            value={validCapabilityFilter}
            onValueChange={(v: string) => onCapabilityChange(v)}
            options={validCapabilityOptions}
            ariaLabel={t("discovery.filters.capabilities") || "Capabilities"}
            dropdownMode="content"
            minDropdownPx={180}
          />
        </div>

        {/* Sort (field + direction) */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label htmlFor="models-sort-select" className="text-xs text-gray-300">
            {t("discovery.sort.label")}
          </label>
          <div className="flex items-center gap-2">
            <FilterSelect
              id="models-sort-select"
              value={getValidValue(modelSortBy, [
                { value: "name", label: t("discovery.sort.name") },
                { value: "provider", label: t("discovery.sort.provider") },
              ])}
              onValueChange={(v: string) =>
                onModelSortByChange(v as ModelSortBy)
              }
              options={[
                { value: "name", label: t("discovery.sort.name") },
                { value: "provider", label: t("discovery.sort.provider") },
              ]}
              ariaLabel={t("discovery.sort.label") || "Sort by"}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label
            htmlFor="models-sort-dir-select"
            className="text-xs text-gray-300"
          >
            {t("discovery.sort.label")}
          </label>
          <div className="flex items-center gap-2">
            <FilterSelect
              id="models-sort-dir-select"
              value={getValidValue(modelSortDir, [
                { value: "asc", label: "Asc" },
                { value: "desc", label: "Desc" },
              ])}
              onValueChange={(v: string) => onModelSortDirChange(v as SortDir)}
              options={[
                { value: "asc", label: "Asc" },
                { value: "desc", label: "Desc" },
              ]}
              ariaLabel="Sort direction"
              dropdownMode="content"
              minDropdownPx={60}
              maxDropdownPx={100}
            />
          </div>
        </div>
      </div>
    );
  }

  // Subscriptions tab
  return (
    <div className={className}>
      {/* Status */}
      <div className="flex flex-col gap-1">
        <label htmlFor="subs-status-select" className="text-xs text-gray-300">
          {t("discovery.filters.status")}
        </label>
        <FilterSelect
          id="subs-status-select"
          value={getValidValue(subStatus, mappedSubStatusOptions)}
          onValueChange={(v: string) => onSubStatusChange(v)}
          options={mappedSubStatusOptions}
          ariaLabel={t("discovery.filters.status") || "Status"}
          dropdownMode="content"
          minDropdownPx={160}
        />
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1">
        <label htmlFor="subs-type-select" className="text-xs text-gray-300">
          {t("discovery.filters.type")}
        </label>
        <FilterSelect
          id="subs-type-select"
          value={getValidValue(subType, subTypeOptions)}
          onValueChange={(v: string) => onSubTypeChange(v)}
          options={subTypeOptions}
          ariaLabel={t("discovery.filters.type") || "Type"}
          dropdownMode="content"
          minDropdownPx={100}
        />
      </div>

      {/* Sort */}
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="subs-sort-select" className="text-xs text-gray-300">
          {t("discovery.sort.label")}
        </label>
        <div className="flex items-center gap-2">
          <FilterSelect
            id="subs-sort-select"
            value={getValidValue(subSortBy, [
              { value: "name", label: t("discovery.sort.name") },
              { value: "status", label: t("discovery.sort.status") },
              { value: "created", label: t("discovery.sort.created") },
              { value: "updated", label: t("discovery.sort.updated") },
              { value: "utilization", label: t("discovery.sort.utilization") },
              {
                value: "activeModels",
                label: t("discovery.sort.activeModels"),
              },
            ])}
            onValueChange={(v: string) => onSubSortByChange(v as SubSortBy)}
            options={[
              { value: "name", label: t("discovery.sort.name") },
              { value: "status", label: t("discovery.sort.status") },
              { value: "created", label: t("discovery.sort.created") },
              { value: "updated", label: t("discovery.sort.updated") },
              { value: "utilization", label: t("discovery.sort.utilization") },
              {
                value: "activeModels",
                label: t("discovery.sort.activeModels"),
              },
            ]}
            ariaLabel={t("discovery.sort.label") || "Sort by"}
            dropdownMode="content"
            minDropdownPx={130}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="subs-sort-dir-select" className="text-xs text-gray-300">
          {t("discovery.sort.label")}
        </label>
        <div className="flex items-center gap-2">
          <FilterSelect
            id="subs-sort-dir-select"
            value={getValidValue(subSortDir, [
              { value: "asc", label: "Asc" },
              { value: "desc", label: "Desc" },
            ])}
            onValueChange={(v: string) => onSubSortDirChange(v as SortDir)}
            options={[
              { value: "asc", label: "Asc" },
              { value: "desc", label: "Desc" },
            ]}
            ariaLabel="Sort direction"
            dropdownMode="content"
            minDropdownPx={60}
            maxDropdownPx={100}
          />
        </div>
      </div>
    </div>
  );
}
