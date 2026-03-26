import { useMemo, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TbTransactionDollar, TbSparkles, TbLock } from "react-icons/tb";
import { useSubscriptionsStore } from "../../stores/maasStore";
import { notificationsService } from "../../services/notificationsService";
import ModelPageHeader from "../../components/MaaS/global/PageHeader";
import ModelCard from "../../components/MaaS/global/ModelCard";
import GuardrailGrid from "../../components/MaaS/global/GuardrailGrid";
import RequestModelsAccessDialog from "../../components/MaaS/models/RequestModelAccessDialog";
import NotificationsWidgets from "../../components/MaaS/global/NotificationsWidgets";
import ModelActionButton from "../../components/MaaS/global/ActionButton";
import ModelStatus from "../../components/MaaS/global/Status";
import type { ModelKey } from "../../types/maasTypes";
import ModelActiveSubscriptions from "../../components/MaaS/models/ModelActiveSubscriptions";
import MetrixGrid from "../../components/MaaS/global/MetrixGrid";
import { buildModelMetrix } from "../../utils/maas/buildMetrix";
import getModelDisplayName from "../../utils/maas/modelDisplay";

interface SubscriptionOption {
  id: string;
  name: string;
}

export default function ModelDetailsPage() {
  const { t } = useTranslation("subscriptions");
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();

  // Store selectors (select individually for stability)
  const getModelBySlug = useSubscriptionsStore((s) => s.getModelBySlug);
  const beginCreateFlow = useSubscriptionsStore((s) => s.beginCreateFlow);
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const requestModelsAccess = useSubscriptionsStore(
    (s) => s.requestModelsAccess,
  );

  // Local UI state
  const [showRequestAccess, setShowRequestAccess] = useState(false);

  // Resolve model by slug
  const model = useMemo(
    () => (modelId ? getModelBySlug(modelId) : undefined),
    [getModelBySlug, modelId],
  );

  // Subscriptions that include this model (enabled or disabled)
  const associatedSubscriptions = useMemo(() => {
    if (!model) return [];
    return subscriptions.filter((sub) =>
      sub.models ? sub.models.some((m) => m.key === model.key) : false,
    );
  }, [subscriptions, model]);

  // Model enabled in users subscription
  const enabledInSubscription = useMemo(() => {
    if (!model) return [];
    return associatedSubscriptions.filter((sub) =>
      sub.models
        ? sub.models.some((m) => m.key === model.key && m.enabled)
        : false,
    );
  }, [associatedSubscriptions, model]);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.status === "ACTIVE"),
    [subscriptions],
  );

  // Restrict “associated” and “enabled” checks to active subscriptions only.
  const hasActiveSubscriptions = activeSubscriptions.length > 0;

  const associatedActiveSubscriptions = useMemo(() => {
    if (!model) return [];
    return activeSubscriptions.filter((sub) =>
      sub.models ? sub.models.some((m) => m.key === model.key) : false,
    );
  }, [activeSubscriptions, model]);

  const enabledInActiveSubscriptions = useMemo(() => {
    if (!model) return [];
    return associatedActiveSubscriptions.filter((sub) =>
      sub.models
        ? sub.models.some((m) => m.key === model.key && m.enabled)
        : false,
    );
  }, [associatedActiveSubscriptions, model]);

  // Page meta
  const displayName = model ? getModelDisplayName(model) : "";

  const title = model
    ? `${displayName} - Model Details - AI Launchpad`
    : "Model Details - AI Launchpad";

  const description = model
    ? `View details for ${displayName} model from ${model.provider}`
    : "View model details in the AI Launchpad.";

  const subscriptionOptions: SubscriptionOption[] = useMemo(() => {
    return subscriptions
      .filter((sub) => sub.status === "ACTIVE")
      .map((sub) => ({ id: sub.id, name: sub.name || sub.id }));
  }, [subscriptions]);

  const modelMetrixItems = useMemo(() => {
    if (!model) return [];
    return buildModelMetrix({
      model,
      t,
      associatedActiveSubscriptions,
      enabledInActiveSubscriptions,
    });
  }, [model, t, associatedActiveSubscriptions, enabledInActiveSubscriptions]);

  const handleSubmitRequestAccess = async ({
    justification,
    subscriptionId,
  }: {
    justification: string;
    subscriptionId: string;
  }) => {
    if (!model) return;

    if (!subscriptionId) {
      notificationsService.error(
        t("modelDetails.requestAccessDialog.validation.subscriptionRequired"),
      );
      return;
    }

    try {
      // Use the model from the current page (auto-selected)
      await requestModelsAccess(subscriptionId, [model.key] as ModelKey[], {
        justification,
      });
      notificationsService.success(
        t("modelDetails.notifications.requestAccessSuccess"),
      );
    } catch {
      notificationsService.error(
        t("modelDetails.notifications.requestAccessError"),
      );
    }
  };

  // Handlers
  const handleCreateSubscription = () => {
    const { path } = beginCreateFlow();
    navigate(path);
  };

  const handleNavigateToDiscoveryPage = () => {
    navigate("/maas");
  };

  const handleRequestAccess = () => {
    setShowRequestAccess(true);
  };

  // Actions menu
  const modelActionLinks = useMemo(
    () => [
      {
        label: t("modelDetails.actions.createSubscription"),
        Icon: TbTransactionDollar,
        onClick: handleCreateSubscription,
      },
      {
        label: t("modelDetails.actions.modelsDiscovery"),
        Icon: TbSparkles,
        onClick: handleNavigateToDiscoveryPage,
      },
      {
        label: t("modelDetails.actions.requestAccess"),
        Icon: TbLock,
        onClick: handleRequestAccess,
      },
    ],
    [t],
  );

  if (!model) {
    return (
      <div>
        <Helmet>
          <title>Model Not Found - AI Launchpad</title>
        </Helmet>
        <ModelPageHeader title={t("modelDetails.notFound.title")} />
        <p className="text-sm text-gray-300 mt-4">
          {t("modelDetails.notFound.message")}
        </p>
      </div>
    );
  }

  const iconButtonClass =
    "border-2 border-gray-500 text-white-100 rounded-lg flex items-center justify-center w-10 h-10 hover:bg-gray-650 disabled:opacity-60";

  return (
    <div aria-labelledby="model-details-heading">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>

      {/* Page Title Header */}
      <ModelPageHeader title={displayName}>
        <div className="flex gap-4 items-center">
          <span className="text-sm px-4 py-2 rounded-full capitalize bg-gray-650 text-white-100">
            {model.provider.toLowerCase()}
          </span>
          <ModelStatus status={model.status} scope="model" variant="page" />
        </div>
        {/* Actions */}
        <ModelActionButton
          actions={modelActionLinks}
          ariaLabel="Subscription actions"
          tooltipText={t("subscriptionDetails.actionsBtn")}
        />
      </ModelPageHeader>

      {/* Request Access Dialog */}
      <RequestModelsAccessDialog
        open={showRequestAccess}
        onClose={() => setShowRequestAccess(false)}
        subscriptionOptions={subscriptionOptions}
        preselectedModelKey={model.key} // NEW: auto-select model
        onSubmit={handleSubmitRequestAccess}
      />
      {/* Main Content */}
      <div className="flex flex-col gap-6 mb-14">
        {/* Metrix */}
        <MetrixGrid items={modelMetrixItems} />
        {/* Notifications */}
        <NotificationsWidgets scope="MODEL" modelKey={model.key} />
        {/* Model Details Card */}
        <ModelCard
          model={model}
          variant="modelDetail"
          iconButtonClass={iconButtonClass}
        />
        {/* Active Subscriptions */}
        <ModelActiveSubscriptions
          enabledInActiveSubscriptions={enabledInActiveSubscriptions}
          hasActiveSubscriptions={hasActiveSubscriptions}
          onNavigateToSubscription={(id) => navigate(`/maas/${id}`)}
          onCreateSubscription={handleCreateSubscription}
          onRequestAccess={handleRequestAccess}
        />
        {model.guardrails && model.guardrails.length > 0 && (
          <div id="tab-panel-guardrails" aria-labelledby="guardrails-heading">
            <GuardrailGrid scope="MODEL" guardrails={model.guardrails ?? []} />
          </div>
        )}
      </div>
    </div>
  );
}
