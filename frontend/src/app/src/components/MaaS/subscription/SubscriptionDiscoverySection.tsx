import SubscriptionCard from "../global/SubscriptionCard";
import EmptyStateNotice from "../../MaaS/global/EmptyStateNotice";

interface SubscriptionsDiscoverySectionProps {
  subscriptions: Array<any>;
  emptyText: string;
  onSubscriptionClick: (id: string) => void;
}

export default function SubscriptionsDiscoverySection({
  subscriptions,
  emptyText,
  onSubscriptionClick,
}: SubscriptionsDiscoverySectionProps) {
  return (
    <section
      id="tab-panel-subscriptions"
      aria-labelledby="subs-heading"
      className="flex flex-col gap-4 mt-6 mb-16"
    >
      {subscriptions.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onClick={() => onSubscriptionClick(sub.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyStateNotice title={emptyText} />
      )}
    </section>
  );
}
