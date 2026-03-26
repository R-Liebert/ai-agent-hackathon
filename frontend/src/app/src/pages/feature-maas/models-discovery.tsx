import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TabsBar, { TabItem } from "../../components/MaaS/global/TabsBar";
import PageHeader from "../../components/MaaS/global/PageHeader";
import { useSubscriptionsStore } from "../../stores/maasStore";
import SearchInputField from "../../components/Global/AppSearchField";
import DiscoveryFilters, {
  DiscoveryTab,
  ModelSortBy,
  SortDir,
  SubSortBy,
} from "../../components/MaaS/global/DiscoveryFilters";
import type { SelectOption } from "../../components/Global/SelectBase";
import { labelForStatus } from "../../utils/maas/maasConfigs";
import SubscriptionsDiscoverySection from "../../components/MaaS/subscription/SubscriptionDiscoverySection";
import ModelsDiscoverySection from "../../components/MaaS/models/ModelsDiscoverySection";
import CreateSubscriptionButton from "../../components/MaaS/global/CreateButton";
import getModelDisplayName from "../../utils/maas/modelDisplay";

export default function ModelsDiscoveryPage() {
  const { t } = useTranslation("subscriptions");
  const navigate = useNavigate();

  const subscriptions = useSubscriptionsStore((state) => state.subscriptions);
  const modelsCatalog = useSubscriptionsStore((state) => state.modelsCatalog);
  const fetchSubscriptions = useSubscriptionsStore((s) => s.fetchSubscriptions);
  const fetchModels = useSubscriptionsStore((s) => s.fetchModels);
  useEffect(() => {
    // Only fetch from backend if we don't have data yet.
    // This prevents overwriting local changes from the configure page.
    if (subscriptions.length === 0) {
      fetchSubscriptions();
    }

    // Same logic for models: only fetch if catalog is empty
    if (Object.keys(modelsCatalog).length === 0) {
      fetchModels();
    }
  }, [subscriptions.length, modelsCatalog, fetchSubscriptions, fetchModels]);

  const [activeTab, setActiveTab] = useState<DiscoveryTab>("models");
  const tabs = useMemo<TabItem[]>(
    () => [
      { key: "models", label: t("discovery.tabs.models") },
      { key: "subscriptions", label: t("discovery.tabs.subscriptions") },
    ],
    [t],
  );

  // Unified search
  const [query, setQuery] = useState("");

  // Models source => ALL
  const modelsList = useMemo(
    () =>
      Object.values(modelsCatalog).sort((a, b) =>
        getModelDisplayName(a).localeCompare(getModelDisplayName(b)),
      ),
    [modelsCatalog],
  );

  // Models options
  const providerOptions: SelectOption<string>[] = useMemo(() => {
    const providers = Array.from(
      new Set(modelsList.map((m) => m.provider || "Unknown")),
    ).sort((a, b) => a.localeCompare(b));
    return [{ value: "ALL", label: t("discovery.filters.all") }].concat(
      providers.map((p) => ({ value: p, label: p })),
    );
  }, [modelsList, t]);

  const capabilityOptions: SelectOption<string>[] = useMemo(() => {
    const caps = Array.from(
      new Set(modelsList.flatMap((m) => m.capabilities || [])),
    ).sort((a, b) => a.localeCompare(b));
    return [{ value: "ALL", label: t("discovery.filters.all") }].concat(
      caps.map((c) => ({ value: c, label: c })),
    );
  }, [modelsList, t]);

  // Models filter/sort state
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [capabilityFilter, setCapabilityFilter] = useState("ALL");
  const [modelSortBy, setModelSortBy] = useState<ModelSortBy>("name");
  const [modelSortDir, setModelSortDir] = useState<SortDir>("asc");

  const subStatusOptions: SelectOption<string>[] = useMemo(() => {
    const values = [
      "ALL",
      "PENDING_APPROVAL",
      "ACTIVE",
      "DEACTIVATED",
      "CANCELLED",
      "FAILED",
    ];
    return values.map((v) => ({ value: v, label: labelForStatus(t, v) }));
  }, [t]);

  const subTypeOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "ALL", label: t("discovery.filters.all") },
      {
        value: "NORMAL",
        label: t("createSubscription.subscriptionTypeCards.NORMAL.title"),
      },
      {
        value: "SANDBOX",
        label: t("createSubscription.subscriptionTypeCards.SANDBOX.title"),
      },
    ],
    [t],
  );

  const subEnvOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "ALL", label: t("discovery.filters.all") },
      { value: "PROD", label: "PROD" },
      { value: "NON_PROD", label: "NON_PROD" },
    ],
    [t],
  );

  // Subscriptions filter/sort state
  const [subStatus, setSubStatus] = useState("ALL");
  const [subType, setSubType] = useState("ALL");
  const [subSortBy, setSubSortBy] = useState<SubSortBy>("name");
  const [subSortDir, setSubSortDir] = useState<SortDir>("asc");

  // Filter & sort models
  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = modelsList.filter((m) => {
      const matchesQuery =
        !q ||
        (m.name || "").toLowerCase().includes(q) ||
        (m.provider || "").toLowerCase().includes(q) ||
        (m.description?.toLowerCase().includes(q) ?? false);

      const matchesProvider =
        providerFilter === "ALL" || m.provider === providerFilter;
      const matchesCapability =
        capabilityFilter === "ALL" ||
        (m.capabilities?.includes(capabilityFilter) ?? false);

      return matchesQuery && matchesProvider && matchesCapability;
    });

    items.sort((a, b) => {
      let cmp = 0;
      if (modelSortBy === "name")
        cmp = (a.name || "")
          .toLowerCase()
          .localeCompare((b.name || "").toLowerCase());
      else if (modelSortBy === "provider")
        cmp = (a.provider || "")
          .toLowerCase()
          .localeCompare((b.provider || "").toLowerCase());
      return modelSortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [
    modelsList,
    query,
    providerFilter,
    capabilityFilter,
    modelSortBy,
    modelSortDir,
  ]);

  // Filter & sort subscriptions
  const filteredSubs = useMemo(() => {
    const q = query.trim().toLowerCase();

    let items = subscriptions.filter((s) => {
      // Exclude subscriptions loaded if the user is also an admin, they should only appear on the admin dashboard
      if (s._loadedViaAdmin) return false;

      const appRefSearch =
        s.type === "NORMAL"
          ? [
              s.applicationReference?.name ?? "",
              s.applicationReference?.applicationId ?? "",
            ]
              .join(" ")
              .toLowerCase()
          : (s.applicationRefFreeText ?? "").toLowerCase();

      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.department?.toLowerCase().includes(q) ?? false) ||
        appRefSearch.includes(q) ||
        s.id.toLowerCase().includes(q);

      const matchesStatus =
        subStatus === "ALL" || s.status === (subStatus as any);
      const matchesType = subType === "ALL" || s.type === (subType as any);

      return matchesQuery && matchesStatus && matchesType;
    });

    items.sort((a, b) => {
      const aGranted = a.tokenUsage?.granted ?? 0;
      const bGranted = b.tokenUsage?.granted ?? 0;
      const aUsed = a.tokenUsage?.used ?? 0;
      const bUsed = b.tokenUsage?.used ?? 0;
      const aUtil = aGranted > 0 ? aUsed / aGranted : 0;
      const bUtil = bGranted > 0 ? bUsed / bGranted : 0;
      const aActive =
        a.models?.filter((m) => m.enabled && m.status === "ACTIVE").length ?? 0;
      const bActive =
        b.models?.filter((m) => m.enabled && m.status === "ACTIVE").length ?? 0;

      let cmp = 0;
      switch (subSortBy) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "created":
          cmp = (a.createdAt ?? 0) - (b.createdAt ?? 0);
          break;
        case "updated":
          cmp = (a.updatedAt ?? 0) - (b.updatedAt ?? 0);
          break;
        case "utilization":
          cmp = aUtil - bUtil;
          break;
        case "activeModels":
          cmp = aActive - bActive;
          break;
      }
      return subSortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [subscriptions, query, subStatus, subType, subSortBy, subSortDir]);

  console.log(modelsCatalog);

  return (
    <section aria-labelledby="overview-heading">
      <Helmet>
        <title>Models Discovery - AI Launchpad</title>
        <meta
          name="description"
          content="Overview of available models and recent subscriptions in the AI Launchpad."
        />
      </Helmet>
      {/* Page Header */}
      <PageHeader
        title={t("discovery.title")}
        subtitle={t("discovery.subtitle")}
      >
        <CreateSubscriptionButton />
      </PageHeader>
      {/* Search */}
      <div className="-my-4">
        <SearchInputField
          placeholder={t("discovery.search.placeholder")}
          onSearch={setQuery}
          isNarrow={true}
        />
      </div>
      {/* Tabs + Filters row */}
      <div className="flex justify-between w-full items-center">
        <TabsBar
          items={tabs}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as DiscoveryTab)}
          ariaLabel={t("discovery.title")}
        />
        <DiscoveryFilters
          activeTab={activeTab}
          // Models
          providerOptions={providerOptions}
          capabilityOptions={capabilityOptions}
          providerFilter={providerFilter}
          capabilityFilter={capabilityFilter}
          modelSortBy={modelSortBy}
          modelSortDir={modelSortDir}
          onProviderChange={setProviderFilter}
          onCapabilityChange={setCapabilityFilter}
          onModelSortByChange={setModelSortBy}
          onModelSortDirChange={setModelSortDir}
          // Subscriptions
          subStatusOptions={subStatusOptions}
          subTypeOptions={subTypeOptions}
          subEnvOptions={subEnvOptions}
          subStatus={subStatus}
          subType={subType}
          subSortBy={subSortBy}
          subSortDir={subSortDir}
          onSubStatusChange={setSubStatus}
          onSubTypeChange={setSubType}
          onSubSortByChange={setSubSortBy}
          onSubSortDirChange={setSubSortDir}
        />
      </div>
      {/* Page Content Rendering*/}
      {activeTab === "models" ? (
        <ModelsDiscoverySection
          models={filteredModels}
          emptyText={t("discovery.noModelsFiltered")}
        />
      ) : (
        <SubscriptionsDiscoverySection
          subscriptions={filteredSubs}
          emptyText={t("discovery.noSubscriptions")}
          onSubscriptionClick={(id) => navigate(`/maas/${id}`)}
        />
      )}
    </section>
  );
}
