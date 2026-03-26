import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSubscriptionsStore } from "../../../stores/maasStore";

export interface CreateButtonProps {
  title?: string;
}

export default function EmptyStateNotice({ title }: CreateButtonProps) {
  const { t } = useTranslation("subscriptions");
  const navigate = useNavigate();
  const beginCreateFlow = useSubscriptionsStore((s) => s.beginCreateFlow);

  const handleCreateAnother = () => {
    const { path } = beginCreateFlow();
    navigate(path);
  };

  return (
    <button
      data-testid="create-subscription-button"
      className="ml-auto mr-0 mt-auto -mb-4 text-sm font-body px-4 py-2 flex bg-white-100 hover:bg-red-600 hover:text-white-100 text-gray-700 font-semibold
            transition-color duration-300 ease-out rounded-full w-auto text-center place-content-center"
      onClick={handleCreateAnother}
      aria-label={t("subscriptionDetails.subscriptionActionButtons.create")}
    >
      {t("subscriptionDetails.subscriptionActionButtons.create")}
    </button>
  );
}
