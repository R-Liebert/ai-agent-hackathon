import { NotificationItem } from "./NotificationItem";
import { useSubscriptionsStore } from "../../../stores/maasStore";
import { ModelKey } from "../../../types/maasTypes";

type NotificationsWidgetsProps =
  | {
      scope: "SUBSCRIPTION";
      subscriptionId: string;
    }
  | {
      scope: "MODEL";
      modelKey: ModelKey;
    };

export default function NotificationsWidgets(props: NotificationsWidgetsProps) {
  const active = useSubscriptionsStore((s) => {
    return props.scope === "SUBSCRIPTION"
      ? s.getActiveNotificationsForSubscription(props.subscriptionId)
      : s.getActiveModelNotifications(props.modelKey);
  });

  const dismissSubscriptionNotification = useSubscriptionsStore(
    (s) => s.dismissSubscriptionNotification,
  );
  const dismissModelNotification = useSubscriptionsStore(
    (s) => s.dismissModelNotification,
  );

  if (active.length === 0) return null;

  // IMPORTANT: pass i18nKey + i18nParams through, and keep legacy text fallback
  const items = active.map((n) => ({
    id: n.id,
    timestamp: n.timestamp,
    i18nKey: (n as any).i18nKey,
    i18nParams: (n as any).i18nParams,
    text: n.text, // legacy fallback
  }));

  const handleDismiss = (id: string | number) => {
    if (props.scope === "SUBSCRIPTION") {
      dismissSubscriptionNotification(props.subscriptionId, String(id));
    } else {
      dismissModelNotification(props.modelKey, String(id));
    }
  };

  return (
    <NotificationItem items={items} locale="en-GB" onDismiss={handleDismiss} />
  );
}
