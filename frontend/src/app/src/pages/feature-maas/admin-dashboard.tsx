import { useEffect, useMemo, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/MaaS/global/PageHeader";
import AdminActionButton from "../../components/MaaS/global/ActionButton";
import { useRouteChanger } from "../../utils/navigation";
import {
  isApprovedNormal,
  isApprovedSandbox,
  isPending,
  isRejected,
  isDeactivated,
  type ApprovedNormalSubscription,
  type ApprovedSandboxSubscription,
  type SubscriptionEntity,
  type AdminAction,
  type SubmittedRequest,
  type QuotaIncreasePayload,
  type ModelAccessPayload,
  type ExtendSubscriptionPayload,
  type AdminTab,
} from "../../types/maasTypes";
import { useSubscriptionsStore } from "../../stores/maasStore";
import type { SelectOption } from "../../components/Global/SelectBase";
import { TbAdjustmentsHorizontal, TbSparkles } from "react-icons/tb";
import dayjs from "dayjs";
import AdminTabsSection from "../../components/MaaS/admin/AdminTabsSection";
import AdminTabPageContent from "../../components/MaaS/admin/AdminTabPageContent";
import AdminActionDialog from "../../components/MaaS/admin/AdminActionDialog";
import MetrixGrid from "../../components/MaaS/global/MetrixGrid";
import { buildAdminMetrix } from "../../utils/maas/buildMetrix";

export const matchesSubQuery = (s: SubscriptionEntity, qRaw: string) => {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;

  const appRefSearch =
    s.type === "NORMAL"
      ? [
          s.applicationReference?.name ?? "",
          s.applicationReference?.applicationId ?? "",
        ]
          .join(" ")
          .toLowerCase()
      : (s.applicationRefFreeText ?? "").toLowerCase();

  return (
    s.name.toLowerCase().includes(q) ||
    appRefSearch.includes(q) ||
    (s.user ?? "").toLowerCase().includes(q) ||
    s.id.toLowerCase().includes(q)
  );
};

export default function AdminDashboardPage() {
  const { changeRoute } = useRouteChanger();
  const { t } = useTranslation("subscriptions");

  // Store selectors/actions
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const fetchAdminSubscriptions = useSubscriptionsStore(
    (s) => s.fetchAdminSubscriptions,
  );
  const activateSubscription = useSubscriptionsStore(
    (s) => s.activateSubscription,
  );
  const reactivateSubscription = useSubscriptionsStore(
    (s) => s.reactivateSubscription,
  );
  const deactivateSubscription = useSubscriptionsStore(
    (s) => s.deactivateSubscription,
  );
  const updateStatus = useSubscriptionsStore((s) => s.updateStatus);
  const addNotification = useSubscriptionsStore((s) => s.addNotification);
  const setModelEnabled = useSubscriptionsStore((s: any) => s.setModelEnabled);
  const deleteSubscription = useSubscriptionsStore(
    (s: any) => s.deleteSubscription,
  );
  const updateRequestStatus = useSubscriptionsStore(
    (s: any) => s.updateRequestStatus,
  );
  const setSubscriptionGuardrailEnabled = useSubscriptionsStore(
    (s: any) => s.setSubscriptionGuardrailEnabled,
  );
  const setModelGuardrailEnforced = useSubscriptionsStore(
    (s: any) => s.setModelGuardrailEnforced,
  );
  const appendAdminAction = useSubscriptionsStore((s) => s.appendAdminAction);
  const blockSubscription = useSubscriptionsStore((s) => s.blockSubscription);
  const updateSubscriptionExpiration = useSubscriptionsStore(
    (s) => s.updateSubscriptionExpiration,
  );
  const clearSubscriptionExpiration = useSubscriptionsStore(
    (s) => s.clearSubscriptionExpiration,
  );
  const setTokenGranted = useSubscriptionsStore((s) => s.setTokenGranted);

  useEffect(() => {
    fetchAdminSubscriptions();
  }, [fetchAdminSubscriptions]);

  // Admin action dialog state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalAction, setActionModalAction] =
    useState<AdminAction | null>(null);
  const [actionModalSubscription, setActionModalSubscription] =
    useState<SubscriptionEntity | null>(null);

  // Optional feature flag you already had
  const [isPendingUserStory, setIsPendingUserStory] = useState(false);

  // Top action menu: local state for guardrail modal trigger (kept as-is)
  const [showNewGuardrailModal, setShowNewGuardrailModal] =
    useState<boolean>(false);

  const openAdminActionModal = (
    action: AdminAction,
    subscription: SubscriptionEntity,
  ) => {
    setActionModalAction(action);
    setActionModalSubscription(subscription);
    setActionModalOpen(true);
  };

  const closeAdminActionModal = () => {
    setActionModalOpen(false);
    setActionModalAction(null);
    setActionModalSubscription(null);
  };

  const onCardAction = useCallback(
    (
      action: AdminAction,
      { subscription }: { subscription: SubscriptionEntity },
    ) => {
      openAdminActionModal(action, subscription);
    },
    [],
  );

  // Tabs + labels
  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
  const tabs = useMemo(
    () => [
      {
        key: "pending",
        label: t("adminDashboard.tabs.pendingApproval") ?? "Pending approval",
      },
      {
        key: "approved",
        label: t("adminDashboard.tabs.approved") ?? "Approved - Normal",
      },
      {
        key: "sandbox",
        label: t("adminDashboard.tabs.sandbox") ?? "Sandbox",
      },
      {
        key: "rejected",
        label: t("adminDashboard.tabs.rejected") ?? "Rejected",
      },
      {
        key: "deactivated",
        label: t("adminDashboard.tabs.deactivated") ?? "Deactivated",
      },
      // Uncomment when exposing these tabs again
      // {
      //   key: "models",
      //   label: t("adminDashboard.tabs.modelManagement") ?? "Model management",
      // },
      // {
      //   key: "guardrails",
      //   label: t("adminDashboard.tabs.guardrailsManagement") ?? "Guardrails management",
      // },
      {
        key: "requests",
        label: t("adminDashboard.tabs.requests") ?? "Requests",
      },
    ],
    [t],
  );

  // Per-tab queries
  const [queryPending, setQueryPending] = useState<string>("");
  const [queryApproved, setQueryApproved] = useState<string>("");
  const [queryRejected, setQueryRejected] = useState<string>("");
  const [queryModels, setQueryModels] = useState<string>("");
  const [queryGuardrails, setQueryGuardrails] = useState<string>("");
  const [queryRequests, setQueryRequests] = useState<string>("");
  const [queryDeactivated, setQueryDeactivated] = useState<string>("");
  const [querySandbox, setQuerySandbox] = useState<string>("");

  // Derived lists
  const pendingSubs = useMemo(
    () =>
      subscriptions
        .filter(isPending)
        .filter((s) => matchesSubQuery(s, queryPending)),
    [subscriptions, queryPending],
  );

  const approvedSubs = useMemo<ApprovedNormalSubscription[]>(
    () =>
      subscriptions
        .filter(isApprovedNormal)
        .filter((s) => matchesSubQuery(s, queryApproved)),
    [subscriptions, queryApproved],
  );

  const sandboxSubs = useMemo<ApprovedSandboxSubscription[]>(
    () =>
      subscriptions
        .filter(isApprovedSandbox)
        .filter((s) => matchesSubQuery(s, querySandbox)),
    [subscriptions, querySandbox],
  );

  const rejectedSubs = useMemo(
    () =>
      subscriptions
        .filter(isRejected)
        .filter((s) => matchesSubQuery(s, queryRejected)),
    [subscriptions, queryRejected],
  );

  const deactivatedSubs = useMemo(
    () =>
      subscriptions
        .filter(isDeactivated)
        .filter((s) => matchesSubQuery(s, queryDeactivated)),
    [subscriptions, queryDeactivated],
  );

  // Model management
  const [selectedSubForModels, setSelectedSubForModels] = useState<
    string | null
  >(null);
  const subscriptionOptions: SelectOption<string>[] = useMemo(
    () =>
      subscriptions.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` })),
    [subscriptions],
  );

  const modelsForSelected = useMemo(() => {
    if (!selectedSubForModels) return [];
    const sub = subscriptions.find((s) => s.id === selectedSubForModels);
    return (sub?.models ?? []).filter((m) => {
      const q = queryModels.trim().toLowerCase();
      return (
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        (m.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [selectedSubForModels, subscriptions, queryModels]);

  // Guardrails management
  const [selectedSubForGuardrails, setSelectedSubForGuardrails] = useState<
    string | null
  >(null);
  const [selectedModelKeyForGuardrails, setSelectedModelKeyForGuardrails] =
    useState<string | null>(null);

  {
    /*
  const guardrailsForScope = useMemo(() => {
    if (selectedSubForGuardrails) {
      const sub = subscriptions.find((s) => s.id === selectedSubForGuardrails);
      return (sub?.guardrails ?? []).filter((g) => {
        const q = queryGuardrails.trim().toLowerCase();
        return (
          !q ||
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
        );
      });
    } else if (selectedModelKeyForGuardrails) {
      const model =
        MODELS_CATALOG[
          selectedModelKeyForGuardrails as keyof typeof MODELS_CATALOG
        ];
      return (model?.guardrails ?? []).filter((g) => {
        const q = queryGuardrails.trim().toLowerCase();
        return (
          !q ||
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
        );
      });
    }
    return [];
  }, [
    selectedSubForGuardrails,
    selectedModelKeyForGuardrails,
    queryGuardrails,
    subscriptions,
  ]); */
  }

  // Requests view: flatten and filter
  const allRequests = useMemo(() => {
    const list: { sub: SubscriptionEntity; req: SubmittedRequest }[] = [];
    for (const s of subscriptions) {
      for (const r of s.submittedRequests ?? []) list.push({ sub: s, req: r });
    }
    const q = queryRequests.trim().toLowerCase();
    const filtered = list.filter(({ sub, req }) => {
      const typeStr = req.type === "QUOTA_INCREASE" ? "quota" : "model access";
      return (
        !q ||
        sub.name.toLowerCase().includes(q) ||
        sub.id.toLowerCase().includes(q) ||
        typeStr.includes(q) ||
        (sub.user?.toLowerCase().includes(q) ?? false)
      );
    });
    return filtered.sort((a, b) => b.req.createdAt - a.req.createdAt);
  }, [subscriptions, queryRequests]);

  // Admin action confirmation dialog
  const onConfirmAdminAction = async (params: {
    justification: string;
    expiryTs?: number;
    clear?: boolean;
  }) => {
    if (!actionModalAction || !actionModalSubscription) return;
    await handleSubscrAction(actionModalAction, {
      subscription: actionModalSubscription,
      justification: params.justification,
      expiryTs: params.expiryTs,
      clear: params.clear,
    });
    closeAdminActionModal();
  };

  const handleSubscrAction = useCallback(
    async (
      action: AdminAction,
      {
        subscription,
        justification,
        expiryTs,
        clear,
      }: {
        subscription: SubscriptionEntity;
        justification?: string;
        expiryTs?: number;
        clear?: boolean;
      },
    ) => {
      // Always record admin decision
      appendAdminAction(subscription.id, {
        type: action,
        justification: (justification ?? "").trim(),
      });

      switch (action) {
        case "approve":
          await activateSubscription(subscription.id);
          addNotification(subscription.id, {
            text: justification
              ? `${t("adminDashboard.adminActionModal.subscriptionApproved")}: ${justification}`
              : `${t("adminDashboard.adminActionModal.subscriptionApprovedWithoutJustification")}`,
          });
          return;

        case "approveAgain":
          await reactivateSubscription(subscription.id, { justification });
          addNotification(subscription.id, {
            text: justification
              ? `${t("adminDashboard.adminActionModal.subscriptionApproved")}: ${justification}`
              : `${t("adminDashboard.adminActionModal.subscriptionApprovedWithoutJustification")}`,
          });
          return;

        case "reject":
          await updateStatus(subscription.id, "CANCELLED", justification);
          addNotification(subscription.id, {
            text: `${t("adminDashboard.adminActionModal.subscriptionRejected")}: ${justification ?? ""}`.trim(),
          });
          return;

        case "deactivate":
          await blockSubscription(subscription.id, justification);
          addNotification(subscription.id, {
            text: justification
              ? `${t("adminDashboard.adminActionModal.subscriptionBlocked")} ${justification}`
              : `${t("adminDashboard.adminActionModal.subscriptionBlocked")}`,
          });
          return;

        case "delete":
          await deleteSubscription(subscription.id);
          return;

        case "expiryDateUpdate":
          if (clear) {
            await clearSubscriptionExpiration(subscription.id, justification);
            addNotification(subscription.id, {
              text: justification
                ? `${t("adminDashboard.adminActionModal.unlimitedNotification")} ${justification}`
                : `${t("adminDashboard.adminActionModal.unlimitedNotification")}`,
            });
            return;
          }
          if (typeof expiryTs !== "number") {
            throw new Error("Expiry timestamp is required.");
          }
          await updateSubscriptionExpiration(
            subscription.id,
            expiryTs,
            justification ?? "",
          );
          addNotification(subscription.id, {
            text: `${t("adminDashboard.adminActionModal.expirySetTo")} ${new Date(expiryTs).toLocaleString()}. ${(
              justification ?? ""
            ).trim()}`.trim(),
          });
          return;
      }
    },
    [
      appendAdminAction,
      activateSubscription,
      updateStatus,
      deleteSubscription,
      addNotification,
      blockSubscription,
      updateSubscriptionExpiration,
      clearSubscriptionExpiration,
      t,
    ],
  );

  // Toggles & request decisions
  const handleGuardrailToggle = async ({
    scope,
    subscriptionId,
    modelKey,
    guardrailKey,
    enabled,
  }: {
    scope: "SUBSCRIPTION" | "MODEL";
    subscriptionId?: string;
    modelKey?: string;
    guardrailKey: string;
    enabled: boolean;
  }) => {
    if (scope === "SUBSCRIPTION" && subscriptionId) {
      await setSubscriptionGuardrailEnabled(
        subscriptionId,
        guardrailKey as any,
        enabled,
      );
    } else if (scope === "MODEL" && modelKey) {
      await setModelGuardrailEnforced(
        modelKey as any,
        guardrailKey as any,
        enabled,
      );
    }
  };

  const handleApproveRequest = useCallback(
    async ({
      subscriptionId,
      requestId,
      request,
    }: {
      subscriptionId: string;
      requestId: string;
      request: SubmittedRequest;
    }) => {
      try {
        switch (request.type) {
          case "EXTEND_SUBSCRIPTION": {
            const p = request.payload as ExtendSubscriptionPayload;
            if (typeof p.expiryTs === "number") {
              await updateSubscriptionExpiration(
                subscriptionId,
                p.expiryTs,
                p.justification ?? "",
              );
              addNotification(subscriptionId, {
                text: `Expiry set to ${dayjs(p.expiryTs).format("YYYY-MM-DD")}.`,
              });
            }
            await updateRequestStatus(subscriptionId, requestId, "APPROVED");
            break;
          }
          case "MODEL_ACCESS": {
            const p = request.payload as ModelAccessPayload;
            if (Array.isArray(p.modelKeys) && p.modelKeys.length > 0) {
              for (const key of p.modelKeys) {
                await setModelEnabled(subscriptionId, key as any, true);
              }
              addNotification(subscriptionId, {
                text: `Models enabled: ${p.modelKeys.join(", ")}`,
              });
            }
            await updateRequestStatus(subscriptionId, requestId, "APPROVED");
            break;
          }
          case "QUOTA_INCREASE": {
            const p = request.payload as QuotaIncreasePayload;
            await setTokenGranted(subscriptionId, p.newTokenLimit);
            addNotification(subscriptionId, {
              text: `Granted tokens updated to ${p.newTokenLimit.toLocaleString()}.`,
            });
            await updateRequestStatus(subscriptionId, requestId, "APPROVED");
            break;
          }
          case "ACTIVATE_SUBSCRIPTION":
          case "DEACTIVATE_SUBSCRIPTION": {
            // Info-only, no approve/decline expected
            return;
          }
          default: {
            await updateRequestStatus(subscriptionId, requestId, "APPROVED");
          }
        }
      } catch (err) {
        console.error("Failed to approve request", err);
      }
    },
    [
      updateSubscriptionExpiration,
      setModelEnabled,
      setTokenGranted,
      updateRequestStatus,
      addNotification,
    ],
  );

  const handleDeclineRequest = useCallback(
    async ({
      subscriptionId,
      requestId,
      request,
    }: {
      subscriptionId: string;
      requestId: string;
      request: SubmittedRequest;
    }) => {
      try {
        if (
          request.type === "ACTIVATE_SUBSCRIPTION" ||
          request.type === "DEACTIVATE_SUBSCRIPTION"
        ) {
          return;
        }
        await updateRequestStatus(subscriptionId, requestId, "DECLINED");

        const typeLabel =
          request.type === "QUOTA_INCREASE"
            ? "Quota increase"
            : request.type === "MODEL_ACCESS"
              ? "Model access"
              : request.type === "EXTEND_SUBSCRIPTION"
                ? "Extend subscription"
                : request.type;

        addNotification(subscriptionId, {
          text: `${typeLabel} request declined.`,
        });
      } catch (err) {
        console.error("Failed to decline request", err);
      }
    },
    [updateRequestStatus, addNotification],
  );

  // Header actions
  const adminActionLinks = useMemo(() => {
    return [
      {
        label: t("adminDashboard.actions.createCustomGuardrail"),
        Icon: TbAdjustmentsHorizontal,
        onClick: () => setShowNewGuardrailModal(true),
      },
      {
        label: t("adminDashboard.actions.addNewModels"),
        Icon: TbSparkles,
        onClick: () => changeRoute("/maas/add-new-model"),
      },
    ];
  }, [t, changeRoute]);

  // Wire up tab-specific search box text + handler
  const { searchPlaceholder, onSearch } = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return {
          searchPlaceholder:
            t("adminDashboard.search.pending") ??
            "Search pending subscriptions...",
          onSearch: setQueryPending,
        };
      case "approved":
        return {
          searchPlaceholder:
            t("adminDashboard.search.approved") ??
            "Search approved subscriptions...",
          onSearch: setQueryApproved,
        };
      case "sandbox":
        return {
          searchPlaceholder:
            t("adminDashboard.search.sandbox") ??
            "Search sandbox subscriptions...",
          onSearch: setQuerySandbox,
        };
      case "rejected":
        return {
          searchPlaceholder:
            t("adminDashboard.search.rejected") ??
            "Search rejected subscriptions...",
          onSearch: setQueryRejected,
        };
      case "deactivated":
        return {
          searchPlaceholder:
            t("adminDashboard.search.deactivated") ??
            "Search deactivated subscriptions...",
          onSearch: setQueryDeactivated,
        };
      case "requests":
        return {
          searchPlaceholder:
            t("adminDashboard.search.requests") ?? "Search requests...",
          onSearch: setQueryRequests,
        };
      default:
        return { searchPlaceholder: "Search...", onSearch: undefined as any };
    }
  }, [activeTab, t]);

  const metrixItems = useMemo(
    () => buildAdminMetrix(subscriptions, t),
    [subscriptions, t],
  );
  return (
    <section aria-labelledby="admin-dashboard-heading">
      <Helmet>
        <title>Admin Dashboard - AI Launchpad</title>
        <meta
          name="description"
          content="Admin dashboard to manage subscriptions, models, guardrails, and requests."
        />
      </Helmet>

      <PageHeader
        title={t("adminDashboard.title") ?? "Admin Dashboard"}
        subtitle=""
      >
        <AdminActionButton
          actions={adminActionLinks}
          ariaLabel="Subscription actions"
          tooltipText={t("subscriptionDetails.actionsBtn")}
        />
      </PageHeader>
      <MetrixGrid items={metrixItems} />
      <AdminTabsSection
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        searchPlaceholder={searchPlaceholder}
        onSearch={onSearch}
        isNarrowSearch
        ariaLabel={t("adminDashboard.title") ?? "Admin Dashboard"}
      />

      <AdminTabPageContent
        activeTab={activeTab}
        pendingSubs={pendingSubs}
        approvedSubs={approvedSubs}
        sandboxSubs={sandboxSubs}
        rejectedSubs={rejectedSubs}
        deactivatedSubs={deactivatedSubs}
        allRequests={allRequests}
        onCardAction={onCardAction}
        onNavigateToSubscription={(id) => changeRoute(`/maas/${id}`)}
        isPendingUserStory={isPendingUserStory}
        selectedSubForModels={selectedSubForModels}
        setSelectedSubForModels={setSelectedSubForModels}
        subscriptionOptions={subscriptionOptions}
        modelsForSelected={modelsForSelected}
        selectedSubForGuardrails={selectedSubForGuardrails}
        setSelectedSubForGuardrails={setSelectedSubForGuardrails}
        selectedModelKeyForGuardrails={selectedModelKeyForGuardrails}
        setSelectedModelKeyForGuardrails={setSelectedModelKeyForGuardrails}
        //guardrailsForScope={guardrailsForScope}
        onToggleGuardrail={handleGuardrailToggle}
        onApproveRequest={handleApproveRequest}
        onDeclineRequest={handleDeclineRequest}
      />
      {actionModalOpen && actionModalAction && actionModalSubscription && (
        <AdminActionDialog
          open={actionModalOpen}
          onClose={closeAdminActionModal}
          actionType={actionModalAction}
          subscriptionName={actionModalSubscription.name}
          subscriptionConsumer={actionModalSubscription.user}
          onConfirm={onConfirmAdminAction}
        />
      )}
    </section>
  );
}
