import React from "react";
import { useTranslation } from "react-i18next";
import SubscriptionCard from "../global/SubscriptionCard";
import RequestCard from "../global/RequestCard";
import {
  type ApprovedNormalSubscription,
  type SubscriptionEntity,
  type AdminAction,
  type SubmittedRequest,
  type AdminTab,
} from "../../../types/maasTypes";
import type { SelectOption } from "../../Global/SelectBase";
import EmptyStateNotice from "../../MaaS/global/EmptyStateNotice";

type RequestListItem = {
  sub: SubscriptionEntity;
  req: SubmittedRequest;
};

type Props = {
  activeTab: AdminTab;
  pendingSubs: SubscriptionEntity[];
  approvedSubs: ApprovedNormalSubscription[];
  sandboxSubs: SubscriptionEntity[];
  rejectedSubs: SubscriptionEntity[];
  deactivatedSubs: SubscriptionEntity[];
  allRequests: RequestListItem[];

  onCardAction: (
    action: AdminAction,
    args: { subscription: SubscriptionEntity },
  ) => void;
  onNavigateToSubscription: (id: string) => void;

  isPendingUserStory: boolean;
  selectedSubForModels: string | null;
  setSelectedSubForModels: (id: string | null) => void;
  subscriptionOptions: SelectOption<string>[];
  modelsForSelected: any[];

  selectedSubForGuardrails: string | null;
  setSelectedSubForGuardrails: (id: string | null) => void;
  selectedModelKeyForGuardrails: string | null;
  setSelectedModelKeyForGuardrails: (key: string | null) => void;
  //guardrailsForScope: any[];

  onToggleGuardrail: (args: {
    scope: "SUBSCRIPTION" | "MODEL";
    subscriptionId?: string;
    modelKey?: string;
    guardrailKey: string;
    enabled: boolean;
  }) => Promise<void>;
  onApproveRequest: (args: {
    subscriptionId: string;
    requestId: string;
    request: SubmittedRequest;
  }) => Promise<void>;
  onDeclineRequest: (args: {
    subscriptionId: string;
    requestId: string;
    request: SubmittedRequest;
  }) => Promise<void>;
};

export default function AdminTabPageContent({
  activeTab,
  pendingSubs,
  approvedSubs,
  sandboxSubs,
  rejectedSubs,
  deactivatedSubs,
  allRequests,
  onCardAction,
  onNavigateToSubscription,

  isPendingUserStory,
  selectedSubForModels,
  setSelectedSubForModels,
  subscriptionOptions,
  modelsForSelected,

  selectedSubForGuardrails,
  setSelectedSubForGuardrails,
  selectedModelKeyForGuardrails,
  setSelectedModelKeyForGuardrails,
  //guardrailsForScope,

  onToggleGuardrail,
  onApproveRequest,
  onDeclineRequest,
}: Props) {
  const { t } = useTranslation("subscriptions");

  return (
    <>
      {activeTab === "pending" && (
        <section className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-4 mb-16 !relative w-full">
          {pendingSubs.length > 0 ? (
            pendingSubs.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                mode="admin"
                onAction={onCardAction}
                onClick={() => onNavigateToSubscription(subscription.id)}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyStateNotice
                title={
                  t("adminDashboard.emptyStates.pending") ??
                  "No pending subscriptions."
                }
              />
            </div>
          )}
        </section>
      )}

      {activeTab === "approved" && (
        <section className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-4 mb-16 w-full">
          {approvedSubs.length > 0 ? (
            approvedSubs.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                mode="admin"
                onAction={onCardAction}
                onClick={() => onNavigateToSubscription(subscription.id)}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyStateNotice
                title={
                  t("adminDashboard.emptyStates.approved") ??
                  "No approved subscriptions."
                }
              />
            </div>
          )}
        </section>
      )}

      {activeTab === "sandbox" && (
        <section className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-4 mb-16 w-full">
          {sandboxSubs.length > 0 ? (
            sandboxSubs.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                mode="admin"
                onAction={onCardAction}
                onClick={() => onNavigateToSubscription(subscription.id)}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyStateNotice
                title={
                  t("adminDashboard.emptyStates.sandbox") ??
                  "No sandbox subscriptions."
                }
              />
            </div>
          )}
        </section>
      )}

      {activeTab === "rejected" && (
        <section className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-4 mb-16 w-full">
          {rejectedSubs.length > 0 ? (
            rejectedSubs.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                mode="admin"
                onAction={onCardAction}
                onClick={() => onNavigateToSubscription(subscription.id)}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyStateNotice
                title={
                  t("adminDashboard.emptyStates.rejected") ??
                  "No rejected subscriptions."
                }
              />
            </div>
          )}
        </section>
      )}

      {activeTab === "deactivated" && (
        <section className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-4 mb-16 w-full">
          {deactivatedSubs.length > 0 ? (
            deactivatedSubs.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                mode="admin"
                onAction={onCardAction}
                onClick={() => onNavigateToSubscription(subscription.id)}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyStateNotice
                title={
                  t("adminDashboard.emptyStates.deactivated") ??
                  "No deactivated subscriptions."
                }
              />
            </div>
          )}
        </section>
      )}

      {!isPendingUserStory && (
        <>
          {activeTab === "models" && (
            <section className="flex flex-col gap-4 mt-6 mb-16">
              <div className="flex gap-3 items-center">
                <label className="text-sm text-white-200">Subscription</label>
                <select
                  className="text-sm rounded-lg bg-gray-900/60 text-white-100 p-2 border border-gray-650"
                  value={selectedSubForModels ?? ""}
                  onChange={(e) =>
                    setSelectedSubForModels(e.target.value || null)
                  }
                >
                  <option value="">Select Subscription</option>
                  {subscriptionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedSubForModels ? (
                <div className="border border-gray-600 rounded-xl p-4">
                  <div className="text-lg font-semibold">
                    Select Subscription
                  </div>
                  <div className="text-sm text-white-200">
                    Select subscription to view its models.
                  </div>
                </div>
              ) : modelsForSelected.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {modelsForSelected.map((model: any) => (
                    <div
                      key={model.key}
                      className="border border-gray-600 rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-semibold">
                            {model.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateNotice title="No active models for this subscriptions." />
              )}
            </section>
          )}
          {/*
          {activeTab === "guardrails" && (
            <section className="flex flex-col gap-4 mt-6 mb-16">
              <div className="flex gap-3 items-center">
                <label className="text-sm text-white-200">Subscription</label>
                <select
                  className="text-sm rounded-lg bg-gray-900/60 text-white-100 p-2 border border-gray-650"
                  value={selectedSubForGuardrails ?? ""}
                  onChange={(e) => {
                    setSelectedSubForGuardrails(e.target.value || null);
                    setSelectedModelKeyForGuardrails(null);
                  }}
                >
                  <option value="">Select Subscription</option>
                  {subscriptionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <label className="text-sm text-white-200 ml-4">Model</label>
                <select
                  className="text-sm rounded-lg bg-gray-900/60 text-white-100 p-2 border border-gray-650"
                  value={selectedModelKeyForGuardrails ?? ""}
                  onChange={(e) => {
                    setSelectedModelKeyForGuardrails(e.target.value || null);
                    setSelectedSubForGuardrails(null);
                  }}
                >
                  <option value="">Select Model</option>
                  {Object.values(MODELS_CATALOG).map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedSubForGuardrails && !selectedModelKeyForGuardrails ? (
                <div className="border border-gray-600 rounded-xl p-4">
                  <div className="text-lg font-semibold">
                    Select Subscription or Model
                  </div>
                  <div className="text-sm text-white-200">
                    Select a subscription or a model to configure guardrails for
                    the relevant scope.
                  </div>
                </div>
              ) : guardrailsForScope.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {guardrailsForScope.map((g: any) => (
                    <div
                      key={g.key}
                      className="border border-gray-600 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-lg font-semibold">{g.title}</div>
                        <div className="text-sm text-white-200">
                          {g.description}
                        </div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            selectedSubForGuardrails ? g.enabled : g.enforced
                          }
                          onChange={(e) =>
                            onToggleGuardrail({
                              scope: selectedSubForGuardrails
                                ? "SUBSCRIPTION"
                                : "MODEL",
                              subscriptionId:
                                selectedSubForGuardrails || undefined,
                              modelKey:
                                selectedModelKeyForGuardrails || undefined,
                              guardrailKey: g.key,
                              enabled: e.target.checked,
                            })
                          }
                        />
                        <span className="ml-2 text-sm">
                          {(selectedSubForGuardrails ? g.enabled : g.enforced)
                            ? "On"
                            : "Off"}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 w-full">
                  <EmptyStateNotice title="No active guardrails for this subscriptions." />
                </div>
              )}
            </section>
          )}*/}
        </>
      )}

      {activeTab === "requests" && (
        <section className="flex flex-col gap-4 mt-4 mb-16">
          {allRequests.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {allRequests.map(({ sub, req }) => (
                <RequestCard
                  key={req.id}
                  mode="admin"
                  subscriptionName={sub.name}
                  subscriptionId={sub.id}
                  request={req}
                  onApprove={onApproveRequest}
                  onDecline={onDeclineRequest}
                />
              ))}
            </div>
          ) : (
            <EmptyStateNotice title="No requests submitted for this subscriptions." />
          )}
        </section>
      )}
    </>
  );
}
