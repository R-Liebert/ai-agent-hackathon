import MetrixGrid from "../../MaaS/global/MetrixGrid";
import TabsBar, { type TabItem } from "../../MaaS/global/TabsBar";
import NotificationsWidgets from "../../MaaS/global/NotificationsWidgets";
import ApiAccessCard from "../../MaaS/ApiAccessCard";
import SubscriptionOverviewCard from "../../MaaS/subscription/SubscriptionOverviewCard";
import GuardrailGrid from "../../MaaS/global/GuardrailGrid";
import ModelCard from "../../MaaS/global/ModelCard";
import RequestCard from "../../MaaS/global/RequestCard";
import ApiRequestsPanel from "../../MaaS/ApiRequestsPanel";
import type { TFunction } from "i18next";
import type { MetrixItem, SubscriptionEntity } from "../../../types/maasTypes";
import EmptyStateNotice from "../../MaaS/global/EmptyStateNotice";

interface SubsBuckets {
  associated: SubscriptionEntity[];
  enabled: SubscriptionEntity[];
}

interface SubscriptionDetailSectionProps {
  subscription: SubscriptionEntity;
  isPending: boolean;
  metrixItems: MetrixItem[];
  tabs: Array<{ key: string; label: string }>;
  activeTab: string;
  onChangeTab: (key: string) => void;
  tabsAriaLabel: string;
  t: TFunction<"subscriptions">;
  endpointUrl?: string;
  iconButtonClass: string;
  onViewFullKey: () => Promise<string>;
  onRegenerateKey: () => Promise<{ last4: string; secretId: string }>;
  modelSubsIndex: Record<string, SubsBuckets>;
  buildModelMetrix: (args: {
    model: any;
    t: TFunction<"subscriptions">;
    associatedActiveSubscriptions: SubscriptionEntity[];
    enabledInActiveSubscriptions?: SubscriptionEntity[];
    colorOverrides?: Partial<Record<string, string>>;
  }) => MetrixItem[];
  onSimulateApiRequest: () => void;
}

export default function SubscriptionDetailSection({
  subscription,
  isPending,
  metrixItems,
  tabs,
  activeTab,
  onChangeTab,
  tabsAriaLabel,
  t,
  endpointUrl,
  iconButtonClass,
  onViewFullKey,
  onRegenerateKey,
  modelSubsIndex,
  buildModelMetrix,
  onSimulateApiRequest,
}: SubscriptionDetailSectionProps) {
  const subscriptionName = subscription?.name;
  if (!subscription) return null;

  if (isPending) {
    // Pending-approval path
    return (
      <div className="flex flex-col gap-5 mb-14">
        <section className="flex flex-col gap-6">
          <MetrixGrid items={metrixItems} />
          <EmptyStateNotice
            title={t("subscriptionDetails.pendingApproval.banner.title")}
            description={t(
              "subscriptionDetails.pendingApproval.banner.message",
              { subscriptionName },
            )}
          />
          <SubscriptionOverviewCard subscription={subscription} />
        </section>
      </div>
    );
  }

  const tabItems: TabItem[] = tabs.map((tb) => ({
    key: tb.key,
    label: tb.label,
  }));

  // Precompute data and “has content” flags
  const models = subscription.models ?? [];
  const submittedRequests = subscription.submittedRequests ?? [];
  const apiRequests = subscription.apiRequests ?? [];

  const hasModels = models.length > 0;
  const hasUserRequests = submittedRequests.length > 0;
  const hasApiRequests = apiRequests.length > 0;

  // Build tab-specific content (null when empty)
  let content: React.ReactNode = null;

  switch (activeTab) {
    case "overview":
      content = (
        <section className="flex flex-col gap-6">
          <NotificationsWidgets
            scope="SUBSCRIPTION"
            subscriptionId={subscription.id}
          />

          <ApiAccessCard
            onViewFullKey={onViewFullKey}
            onRegenerateKey={onRegenerateKey}
            endpointUrl={endpointUrl}
            apiKeyLast4={subscription.apiKeyMeta?.last4}
            apiKeyStatus={subscription.apiKeyMeta?.status}
            iconButtonClass={iconButtonClass}
          />

          <SubscriptionOverviewCard subscription={subscription} />

          {/*<GuardrailGrid
            scope="SUBSCRIPTION"
            guardrails={subscription.guardrails ?? []}
          />*/}
        </section>
      );
      break;

    case "models":
      if (hasModels) {
        content = (
          <section id="tab-panel-models" aria-labelledby="models-heading">
            <div className="grid gap-10 grid-cols-1">
              {models.map((model) => {
                const buckets = modelSubsIndex[model.key] ?? {
                  associated: [],
                  enabled: [],
                };
                const items = buildModelMetrix({
                  model,
                  t,
                  associatedActiveSubscriptions: buckets.associated,
                  enabledInActiveSubscriptions: buckets.enabled,
                });
                return (
                  <ModelCard
                    key={model.key}
                    model={model}
                    iconButtonClass={iconButtonClass}
                    variant="detail"
                    modelMetrixItems={items}
                  />
                );
              })}
            </div>
          </section>
        );
      }
      break;

    case "userRequests":
      if (hasUserRequests) {
        content = (
          <section
            id="tab-panel-userRequests"
            aria-labelledby="user-requests-heading"
          >
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {submittedRequests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          </section>
        );
      }
      break;

    case "apiRequests":
      if (hasApiRequests) {
        content = (
          <section id="tab-panel-apiRequests" aria-labelledby="api-heading">
            <ApiRequestsPanel
              apiRequests={apiRequests}
              onSimulateApiRequest={onSimulateApiRequest}
            />
          </section>
        );
      }
      break;

    case "raw":
      content = (
        <section
          id="tab-panel-raw"
          aria-labelledby="raw-heading"
          className="border-2 border-gray-500 p-4 rounded-xl overflow-y-auto"
        >
          <h3 id="raw-heading" className="text-lg font-medium font-body mb-3">
            Subscription Raw
          </h3>
          <pre className="text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(subscription, null, 2)}
          </pre>
        </section>
      );
      break;

    default:
      // Unknown tab -> no content
      content = null;
  }

  // Dynamic empty-state text for each tab
  const getEmptyState = (key: string) => {
    switch (key) {
      case "models":
        return {
          title:
            t("subscriptionDetails.noModels") ||
            "No models are currently associated with this subscription.",
        };
      case "userRequests":
        return {
          title:
            t("subscriptionDetails.noUserRequests") ||
            "No user requests were submitted for this subscription.",
        };
      case "apiRequests":
        return {
          title:
            t("subscriptionDetails.apiRequestsTable.empty") ||
            "No API requests yet.",
        };
      case "raw":
        // Raw always has something (the JSON), so normally not used.
        return { title: "", description: "" };
      case "overview":
        // Overview renders cards regardless; normally not empty.
        return { title: "", description: "" };
      default:
        return {
          title:
            t("subscriptionDetails.genericEmpty.title") ||
            "Nothing to show (yet).",
          description:
            t("subscriptionDetails.genericEmpty.description", {
              subscriptionName,
            }) || "Select another tab or come back later.",
        };
    }
  };

  const emptyCopy = getEmptyState(activeTab);
  const shouldShowEmpty =
    content == null &&
    // Only show an empty state on tabs that can be “empty” in this screen
    ["models", "userRequests", "apiRequests"].includes(activeTab);

  return (
    <div className="flex flex-col gap-5 mb-14">
      {/* Metrics */}
      <MetrixGrid items={metrixItems} />

      {/* Tabs */}
      <div className="mt-4 mb-4">
        <TabsBar
          items={tabItems}
          activeKey={activeTab}
          onChange={onChangeTab}
          ariaLabel={tabsAriaLabel}
        />
      </div>

      {/* Single rendering point: either tab content or one empty state */}
      {content}
      {shouldShowEmpty && (
        <>
          {activeTab === "apiRequests" && (
            <div className="flex justify-between w-full mb-9">
              {/* Simulate API Request Button */}
              <button
                className="px-4 py-2 font-body rounded-full bg-white-100 text-gray-700 hover:bg-red-600 hover:text-white-100 text-sm font-semibold"
                onClick={onSimulateApiRequest}
                aria-label={t(
                  "subscriptionDetails.apiRequestsTable.simulate",
                  "Simulate API Request",
                )}
                title={t(
                  "subscriptionDetails.apiRequestsTable.simulate",
                  "Simulate API Request",
                )}
              >
                {t(
                  "subscriptionDetails.apiRequestsTable.simulate",
                  "Simulate API Request",
                )}
              </button>
            </div>
          )}

          <EmptyStateNotice
            title={emptyCopy.title}
            description={emptyCopy.description}
          />
        </>
      )}
    </div>
  );
}
