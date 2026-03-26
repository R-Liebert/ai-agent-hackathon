import { useMemo, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TbTransactionDollar,
  TbSettings,
  TbSparkles,
  TbAntennaBars5,
  TbActivity,
  TbTopologyStar,
  TbCalendarClock,
} from "react-icons/tb";
import { toTitleCase } from "../../utils/stringUtils";
import { useRouteChanger } from "../../utils/navigation";
import { notificationsService } from "../../services/notificationsService";
import { useSubscriptionsStore } from "../../stores/maasStore";
import { useUserStore } from "../../stores/userStore";
import { TabItem } from "../../components/MaaS/global/TabsBar";
import { ModelOption } from "../../components/MaaS/models/RequestModelAccessDialog";
import type { ModelKey, SubscriptionEntity } from "../../types/maasTypes";
import {
  buildSubscriptionMetrix,
  buildModelMetrix,
} from "../../utils/maas/buildMetrix";
import SubscriptionDetailHeader from "../../components/MaaS/subscription/SubscriptionDetailHeader";
import SubscriptionDetailSection from "../../components/MaaS/subscription/SubscriptionDetailSection";
import EmptyStateNotice from "../../components/MaaS/global/EmptyStateNotice";
import PageHeader from "../../components/MaaS/global/PageHeader";
import CreateSubscriptionButton from "../../components/MaaS/global/CreateButton";

export default function SubscriptionDetailsPage() {
  // Routing & i18n
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("subscriptions");
  const { changeRoute } = useRouteChanger();

  // Store selectors
  const beginCreateFlow = useSubscriptionsStore((s) => s.beginCreateFlow);
  const isAdmin = useSubscriptionsStore((s) => s.admin.isAdmin);
  const allSubscriptions = useSubscriptionsStore((s) => s.subscriptions);

  const generateApiKey = useSubscriptionsStore((s) => s.generateApiKey);
  const revealApiKey = useSubscriptionsStore((s) => s.revealApiKey);
  const regenerateApiKey = useSubscriptionsStore((s) => s.regenerateApiKey);

  // Request-like actions
  const requestQuotaIncrease = useSubscriptionsStore(
    (s) => s.requestQuotaIncrease,
  );
  const requestModelsAccess = useSubscriptionsStore(
    (s) => s.requestModelsAccess,
  );
  const deactivateSubscription = useSubscriptionsStore(
    (s) => s.deactivateSubscription,
  );
  const activateSubscription = useSubscriptionsStore(
    (s) => s.activateSubscription,
  );
  const updateSubscriptionName = useSubscriptionsStore(
    (s) => s.updateSubscriptionName,
  );

  // Get logs when needed
  const getApiRequests = useSubscriptionsStore((s) => s.getApiRequests);
  const simulateApiRequest = useSubscriptionsStore((s) => s.simulateApiRequest);

  const requestExtendSubscription = useSubscriptionsStore(
    (s) => s.requestExtendSubscription,
  );

  // Local UI state
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [actionType, setActionType] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [showActivate, setShowActivate] = useState(false);
  const [showIncreaseQuota, setShowIncreaseQuota] = useState(false);
  const [showRequestModels, setShowRequestModels] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [showRename, setShowRename] = useState(false);
  const [showExtendRequest, setShowExtendRequest] = useState(false);

  // IMPORTANT: include "userRequests" in the union
  type DetailsTab =
    | "overview"
    | "models"
    | "userRequests"
    | "apiRequests"
    | "raw";
  const [activeTab, setActiveTab] = useState<DetailsTab>("overview");
  const modelsCatalog = useSubscriptionsStore((state) => state.modelsCatalog);

  // Derived data (memoized)
  const subscription = useSubscriptionsStore((s) =>
    subscriptionId
      ? s.subscriptions.find((sub) => sub.id === subscriptionId)
      : undefined,
  );

  const isPending = subscription?.status === "PENDING_APPROVAL";
  const isBlocked = subscription?.status === "BLOCKED";

  const [showExpiryUpdate, setShowExpiryUpdate] = useState(false);

  const apiLogs = useMemo(() => {
    return subscriptionId ? getApiRequests(subscriptionId) : [];
  }, [subscriptionId, getApiRequests]);

  const tabs = useMemo<TabItem[]>(
    () => [
      { key: "overview", label: t("subscriptionDetails.tabs.overview") },
      { key: "models", label: t("subscriptionDetails.tabs.Models") },
      { key: "userRequests", label: "Submitted Requests" },
      { key: "apiRequests", label: t("subscriptionDetails.tabs.apiRequests") },
      { key: "raw", label: "Raw (Debug)" },
    ],
    [t],
  );

  const metrixItems = useMemo(
    () => (subscription ? buildSubscriptionMetrix(subscription, t) : []),
    [subscription, t],
  );

  // Available models to request (exclude already present)
  const availableModelOptions: ModelOption[] = useMemo(() => {
    if (!subscription) return [];
    const existingKeys = new Set(subscription.models?.map((m) => m.key) ?? []);
    return Object.values(modelsCatalog)
      .filter((m) => !existingKeys.has(m.key))
      .map((m) => ({ key: m.key, name: m.name }));
  }, [subscription, modelsCatalog]);

  // Active subs across the whole tenant
  const activeAllSubscriptions = useMemo(
    () => allSubscriptions.filter((s) => s.status === "ACTIVE"),
    [allSubscriptions],
  );

  type SubsBuckets = {
    associated: SubscriptionEntity[];
    enabled: SubscriptionEntity[];
  };
  const modelSubsIndex = useMemo<Record<string, SubsBuckets>>(() => {
    const map: Record<string, SubsBuckets> = {};
    for (const sub of activeAllSubscriptions) {
      for (const m of sub.models ?? []) {
        if (!map[m.key]) map[m.key] = { associated: [], enabled: [] };
        map[m.key].associated.push(sub);
        if (m.enabled) map[m.key].enabled.push(sub);
      }
    }
    return map;
  }, [activeAllSubscriptions]);

  // Page meta
  const title = subscriptionId
    ? `Subscription Details: ${toTitleCase(subscriptionId)} - AI Launchpad`
    : "Subscription Details - AI Launchpad";

  const description = subscriptionId
    ? `View details for subscription ${toTitleCase(subscriptionId)}`
    : "View subscription details in the AI Launchpad.";

  // Handlers: navigation & actions

  const handleOpenExtendRequest = () => setShowExtendRequest(true);
  const handleCreateAnother = () => {
    const { path } = beginCreateFlow();
    navigate(path);
  };

  const handleViewAll = () => {
    navigate("/maas");
  };

  const handleOpenDeactivateDialog = () => {
    setActionType("deactivate");
    setShowDeactivate(true);
  };

  const handleOpenActivateDialog = () => {
    setActionType("activate");
    setShowActivate(true);
  };

  const handleOpenExpiryUpdate = () => setShowExpiryUpdate(true);
  const subscriptionActionLinks = useMemo(() => {
    // Get the current user profile
    const { profile } = useUserStore.getState();
    const isSubscriptionOwner = profile?.email === subscription?.user;

    // Automatically restrict visibility if the user is both admin and owner
    const isSelfRestricted = isAdmin && isSubscriptionOwner;

    // Always present
    const baseLinks = [
      {
        label: t("subscriptionDetails.subscriptionActionButtons.create"),
        Icon: TbTransactionDollar,
        onClick: () => {
          handleCreateAnother();
        },
      },
      {
        label: t("subscriptionDetails.subscriptionActionButtons.discovery"),
        Icon: TbTopologyStar,
        onClick: () => {
          handleViewAll();
        },
      },
    ];

    // Conditionally include Activate/Deactivate only when NOT blocked and NOT self-restricted
    const toggleLink =
      !isBlocked && isSubscriptionOwner && !isSelfRestricted
        ? {
            label:
              subscription?.status === "DEACTIVATED"
                ? t("subscriptionDetails.subscriptionActionButtons.activate")
                : t("subscriptionDetails.subscriptionActionButtons.deactivate"),
            Icon: TbActivity,
            onClick: () =>
              subscription?.status === "DEACTIVATED"
                ? handleOpenActivateDialog()
                : handleOpenDeactivateDialog(),
          }
        : null;

    // Conditionally include Request Quota and Request Models only when NOT blocked and NOT self-restricted
    const quotaLink =
      !isBlocked && isSubscriptionOwner && !isSelfRestricted
        ? {
            label: t(
              "subscriptionDetails.subscriptionActionButtons.increaseQuota",
            ),
            Icon: TbAntennaBars5,
            onClick: () => setShowIncreaseQuota(true),
          }
        : null;

    const requestModelsLink =
      !isBlocked && isSubscriptionOwner && !isSelfRestricted
        ? {
            label: t(
              "subscriptionDetails.subscriptionActionButtons.requestNewModels",
            ),
            Icon: TbSparkles,
            onClick: () => setShowRequestModels(true),
          }
        : null;

    // NEW: Extend subscription if there is an expiry date and NOT self-restricted
    const extendLink =
      subscription?.expirationDate != null &&
      isSubscriptionOwner &&
      !isSelfRestricted
        ? {
            label:
              t(
                "subscriptionDetails.subscriptionActionButtons.extendSubscription",
              ) ?? "Extend Subscription",
            Icon: TbCalendarClock,
            onClick: () => setShowExtendRequest(true),
          }
        : null;

    // Admin-only configure (remains unchanged)
    const configureLink =
      isAdmin && subscriptionId
        ? {
            label: t("subscriptionDetails.subscriptionActionButtons.configure"),
            Icon: TbSettings,
            onClick: () => {
              changeRoute(`/maas/${subscriptionId}/configure`);
            },
          }
        : null;

    // Assemble final list, skipping nulls
    const allLinks = [
      ...baseLinks,
      ...(toggleLink ? [toggleLink] : []),
      ...(quotaLink ? [quotaLink] : []),
      ...(requestModelsLink ? [requestModelsLink] : []),
      ...(extendLink ? [extendLink] : []),
      ...(configureLink ? [configureLink] : []),
    ];

    // While pending approval: show only the first two links (Create, Discovery)
    return isPending ? allLinks.slice(0, 2) : allLinks;
  }, [
    t,
    isAdmin,
    subscriptionId,
    subscription,
    isPending,
    isBlocked,
    changeRoute,
    handleCreateAnother,
    handleViewAll,
    handleOpenActivateDialog,
    handleOpenDeactivateDialog,
    setShowIncreaseQuota,
    setShowRequestModels,
    setShowExtendRequest,
  ]);

  // Handlers: API key
  const handleViewFullKey = useCallback(async (): Promise<string> => {
    if (!subscriptionId) {
      const msg = t(
        "subscriptionDetails.apiAccess.notifications.generate.error",
      );
      notificationsService?.error?.(msg);
      throw new Error(msg);
    }

    const revealed = revealApiKey(subscriptionId);
    if (revealed) return revealed;

    const { raw } = await generateApiKey(subscriptionId);
    notificationsService?.success?.(
      t("subscriptionDetails.apiAccess.notifications.generate.success"),
    );
    return raw;
  }, [subscriptionId, revealApiKey, generateApiKey, t]);

  const handleRegenerateKey = useCallback(async (): Promise<{
    last4: string;
    secretId: string;
  }> => {
    if (!subscriptionId) {
      const msg = t(
        "subscriptionDetails.apiAccess.notifications.missingSubscriptionID",
      );
      notificationsService?.error?.(msg);
      throw new Error(msg);
    }
    const { last4, secretId } = await regenerateApiKey(subscriptionId);
    notificationsService?.success?.(
      t("subscriptionDetails.apiAccess.notifications.regenerate.success"),
    );
    return { last4, secretId };
  }, [subscriptionId, regenerateApiKey, t]);

  // Handlers: dialogs submissions
  const handleSubmitQuotaIncrease = async ({
    newTokenLimit,
    newRateLimit,
    newRequestLimit,
    justification,
  }: {
    newTokenLimit: number;
    newRateLimit: number;
    newRequestLimit: number;
    justification: string;
  }) => {
    if (!subscriptionId) return;
    try {
      await requestQuotaIncrease(subscriptionId, {
        newTokenLimit,
        newRateLimit,
        newRequestLimit,
        justification,
      });
      notificationsService.success(
        t(
          "subscriptionDetails.requestQuotaIncreaseDialog.notifications.successMessage",
        ),
      );
    } catch {
      notificationsService.error(
        t(
          "subscriptionDetails.requestQuotaIncreaseDialog.notifications.errorMessage",
        ),
      );
    }
  };

  const handleSubmitModelsAccess = async ({
    selectedModelKeys,
    justification,
  }: {
    selectedModelKeys: string[];
    justification: string;
  }) => {
    if (!subscriptionId) return;
    try {
      await requestModelsAccess(
        subscriptionId,
        selectedModelKeys as ModelKey[],
        {
          justification,
        },
      );
      notificationsService.success(
        t(
          "subscriptionDetails.requestAccessToModelsDialog.notifications.successMessage",
        ),
      );
    } catch {
      notificationsService.error(
        t(
          "subscriptionDetails.requestAccessToModelsDialog.notifications.errorMessage",
        ),
      );
    }
  };

  const handleConfirmSubscriptionAction = useCallback(
    async ({ justification }: { justification: string }) => {
      if (!subscriptionId || !actionType) return;

      const isDeactivate = actionType === "deactivate";
      try {
        if (isDeactivate) {
          await deactivateSubscription(subscriptionId, { justification });
          notificationsService.success(
            t(
              "subscriptionDetails.deactivateSubscriptionDialog.notifications.successMessage",
            ),
          );
        } else {
          await activateSubscription(subscriptionId, justification);
          notificationsService.success(
            t(
              "subscriptionDetails.activateSubscriptionDialog.notifications.successMessage",
            ),
          );
        }
      } catch (error) {
        notificationsService.error(
          t(
            isDeactivate
              ? "subscriptionDetails.deactivateSubscriptionDialog.notifications.errorMessage"
              : "subscriptionDetails.activateSubscriptionDialog.notifications.errorMessage",
          ),
        );
        throw error;
      }
    },
    [
      subscriptionId,
      actionType,
      deactivateSubscription,
      activateSubscription,
      t,
    ],
  );

  //test button to simulate a request in the UI
  const handleSimulateApiRequest = async () => {
    if (!subscriptionId) return;
    // pick the first enabled model or the first one
    const modelKey =
      subscription?.models?.find((m) => m.enabled)?.key ??
      subscription?.models?.[0]?.key;
    if (!modelKey) {
      notificationsService?.error?.("No model available in this subscription.");
      return;
    }
    const log = await simulateApiRequest(subscriptionId, modelKey);
    notificationsService?.success?.(`Api request simulated successfully`);
  };

  // Handlers to update the subscription title

  const handleOpenRenameDialog = () => setShowRename(true);

  const handleRenameSubmit = async (newName: string) => {
    if (!subscriptionId) return;
    try {
      await updateSubscriptionName(subscriptionId, newName);
      notificationsService.success(
        t("subscriptionDetails.renameSubscriptionDialog.notifications.success"),
      );
    } catch (err: any) {
      notificationsService.error(
        err?.message ??
          t("subscriptionDetails.renameSubscriptionDialog.notifications.error"),
      );
    }
  };

  const handleSubmitExtendSubscriptionRequest = useCallback(
    async ({
      expiryTs,
      justification,
    }: {
      expiryTs: number;
      justification: string;
    }) => {
      if (!subscriptionId) return;
      try {
        await requestExtendSubscription(subscriptionId, {
          expiryTs,
          justification,
        });
        notificationsService.success(
          t(
            "subscriptionDetails.extendSubscriptionDialog.notifications.successMessage",
          ),
        );
      } catch (err: any) {
        notificationsService.error(
          t(
            "subscriptionDetails.extendSubscriptionDialog.notifications.errorMessage",
          ),
        );
      }
    },
    [subscriptionId, requestExtendSubscription, t],
  );

  // Constants
  const iconButtonClass =
    "border-2 border-gray-500 text-white-100 rounded-lg flex items-center justify-center w-10 h-10 hover:bg-gray-650 disabled:opacity-60";

  return (
    <div aria-labelledby="details-heading">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>
      {/* Page Header */}
      {subscription && (
        <SubscriptionDetailHeader
          title={
            subscription?.name?.trim()
              ? subscription.name
              : t("subscriptionDetails.title")
          }
          type={subscription?.type}
          status={subscription?.status}
          renameAriaLabel={t(
            "subscriptionDetails.renameSubscriptionDialog.ariaLabel",
          )}
          onRenameClick={handleOpenRenameDialog}
          actions={subscriptionActionLinks}
          actionsTooltip={t("subscriptionDetails.actionsBtn")}
          renameDialogOpen={showRename}
          onCloseRename={() => setShowRename(false)}
          currentName={subscription?.name ?? ""}
          onSubmitRename={handleRenameSubmit}
          increaseQuotaDialogOpen={showIncreaseQuota}
          onCloseIncreaseQuota={() => setShowIncreaseQuota(false)}
          onSubmitQuotaIncrease={handleSubmitQuotaIncrease}
          currentGrantedTokens={subscription?.tokenUsage?.granted ?? 0}
          currentRateLimit={0}
          requestModelsDialogOpen={showRequestModels}
          onCloseRequestModels={() => setShowRequestModels(false)}
          availableModels={availableModelOptions}
          onSubmitModelsAccess={handleSubmitModelsAccess}
          maxSelectable={4}
          initialSubscriptionId={subscriptionId ?? undefined}
          subscriptionActionDialogOpen={showDeactivate || showActivate}
          subscriptionActionType={actionType || "deactivate"}
          onCloseSubscriptionAction={() => {
            setShowDeactivate(false);
            setShowActivate(false);
            setActionType(null);
          }}
          subscriptionNameForAction={subscription?.name || ""}
          onConfirmWithReason={handleConfirmSubscriptionAction}
          extendSubscriptionDialogOpen={showExtendRequest}
          onCloseExtendSubscription={() => setShowExtendRequest(false)}
          onSubmitExtendSubscription={handleSubmitExtendSubscriptionRequest}
        />
      )}
      {subscription ? (
        <SubscriptionDetailSection
          subscription={subscription}
          isPending={isPending}
          metrixItems={metrixItems}
          tabs={tabs}
          activeTab={activeTab}
          onChangeTab={(key) => setActiveTab(key as DetailsTab)}
          tabsAriaLabel={t("subscriptionDetails.title")}
          t={t}
          endpointUrl={
            subscription.models?.find((m) => m.enabled)?.endpointUrl ??
            subscription.models?.[0]?.endpointUrl
          }
          iconButtonClass={iconButtonClass}
          onViewFullKey={handleViewFullKey}
          onRegenerateKey={handleRegenerateKey}
          modelSubsIndex={modelSubsIndex}
          buildModelMetrix={buildModelMetrix}
          onSimulateApiRequest={handleSimulateApiRequest}
        />
      ) : (
        <>
          <PageHeader title="Subscription not foud">
            <CreateSubscriptionButton />
          </PageHeader>
          <EmptyStateNotice
            title={`Subscription with ID "${subscriptionId}" does not exist in
            our database.`}
          />
        </>
      )}
    </div>
  );
}
