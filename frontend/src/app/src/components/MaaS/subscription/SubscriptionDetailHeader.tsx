import { TbPencil } from "react-icons/tb";
import Tooltip from "../../../components/Global/Tooltip";
import SubscriptionPageHeader from "../../MaaS/global/PageHeader";
import SubscriptionType from "../../MaaS/global/SubscriptionType";
import SubscriptionStatus from "../../MaaS/global/Status";
import SubscriptionActionButton from "../../MaaS/global/ActionButton";
import type { ActionMenuItem } from "../../MaaS/global/ActionButton";
import RenameSubscriptionDialog from "./RenameSubscriptionDialog";
import IncreaseQuotaDialog from "./IncreaseQuotaDialog";
import RequestModelAccessDialog, {
  type ModelOption,
} from "../../MaaS/models/RequestModelAccessDialog";
import SubscriptionActionDialog from "./SubscriptionActionDialog";
import ExtendSubscriptionDialog from "./ExtendSubscriptionDialog";

import type {
  SubscriptionEntity,
  SubscriptionStatus as SubscriptionStatusType,
} from "../../../types/maasTypes";

interface SubscriptionDetailHeaderProps {
  title: string;
  type?: SubscriptionEntity["type"];
  status?: SubscriptionStatusType;
  renameAriaLabel: string;
  onRenameClick: () => void;
  actions: ActionMenuItem[];
  actionsTooltip: string;
  renameDialogOpen: boolean;
  onCloseRename: () => void;
  currentName: string;
  onSubmitRename: (newName: string) => Promise<void> | void;
  increaseQuotaDialogOpen: boolean;
  onCloseIncreaseQuota: () => void;
  onSubmitQuotaIncrease: (args: {
    newTokenLimit: number;
    newRateLimit: number;
    newRequestLimit: number;
    justification: string;
  }) => Promise<void> | void;
  currentGrantedTokens: number;
  currentRateLimit: number;
  requestModelsDialogOpen: boolean;
  onCloseRequestModels: () => void;
  availableModels: ModelOption[];
  onSubmitModelsAccess: (args: {
    selectedModelKeys: string[];
    justification: string;
  }) => Promise<void> | void;
  maxSelectable?: number;
  initialSubscriptionId?: string;
  subscriptionActionDialogOpen: boolean;
  subscriptionActionType: "activate" | "deactivate";
  onCloseSubscriptionAction: () => void;
  subscriptionNameForAction: string;
  onConfirmWithReason: (args: {
    justification: string;
  }) => Promise<void> | void;
  extendSubscriptionDialogOpen: boolean;
  onCloseExtendSubscription: () => void;
  onSubmitExtendSubscription: (args: {
    expiryTs: number;
    justification: string;
  }) => Promise<void> | void;
}

export default function SubscriptionDetailHeader({
  title,
  type,
  status,
  renameAriaLabel,
  onRenameClick,
  actions,
  actionsTooltip,
  renameDialogOpen,
  onCloseRename,
  currentName,
  onSubmitRename,
  increaseQuotaDialogOpen,
  onCloseIncreaseQuota,
  onSubmitQuotaIncrease,
  currentGrantedTokens,
  currentRateLimit,
  requestModelsDialogOpen,
  onCloseRequestModels,
  availableModels,
  onSubmitModelsAccess,
  maxSelectable = 4,
  initialSubscriptionId,
  subscriptionActionDialogOpen,
  subscriptionActionType,
  onCloseSubscriptionAction,
  subscriptionNameForAction,
  onConfirmWithReason,
  extendSubscriptionDialogOpen,
  onCloseExtendSubscription,
  onSubmitExtendSubscription,
}: SubscriptionDetailHeaderProps) {
  return (
    <>
      <SubscriptionPageHeader title={title}>
        <div className="flex gap-4">
          <Tooltip useMui text={renameAriaLabel}>
            <button
              onClick={onRenameClick}
              className="relative inline-flex mt-0 items-center disabled:opacity-50"
              aria-label={renameAriaLabel}
            >
              <TbPencil size={24} strokeWidth={1.2} />
            </button>
          </Tooltip>
          <SubscriptionType type={type} variant="page" />
          <SubscriptionStatus
            status={status}
            variant="page"
            scope="subscription"
          />
        </div>

        <SubscriptionActionButton
          actions={actions}
          ariaLabel="Subscription actions"
          tooltipText={actionsTooltip}
        />
      </SubscriptionPageHeader>

      {/* Dialogs (controlled externally) */}
      <RenameSubscriptionDialog
        open={renameDialogOpen}
        onClose={onCloseRename}
        currentName={currentName}
        onSubmit={onSubmitRename}
      />

      <IncreaseQuotaDialog
        open={increaseQuotaDialogOpen}
        onClose={onCloseIncreaseQuota}
        onSubmit={onSubmitQuotaIncrease}
        currentGrantedTokens={currentGrantedTokens}
        currentRateLimit={currentRateLimit}
      />

      <RequestModelAccessDialog
        open={requestModelsDialogOpen}
        onClose={onCloseRequestModels}
        availableModels={availableModels}
        onSubmit={onSubmitModelsAccess}
        maxSelectable={maxSelectable}
        initialSubscriptionId={initialSubscriptionId}
      />

      <SubscriptionActionDialog
        open={subscriptionActionDialogOpen}
        onClose={onCloseSubscriptionAction}
        subscriptionName={subscriptionNameForAction}
        actionType={subscriptionActionType}
        onConfirmWithReason={onConfirmWithReason}
      />

      <ExtendSubscriptionDialog
        open={extendSubscriptionDialogOpen}
        onClose={onCloseExtendSubscription}
        onSubmit={onSubmitExtendSubscription}
      />
    </>
  );
}
