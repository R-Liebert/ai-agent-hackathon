import React from 'react';
import { useTranslation } from 'react-i18next';
import PromptSettingsActionDialog from '../AiTrafficInformation/PromptSettingsActionDialog';
import { useTrafficInformationContext } from '../../contexts/TrafficInformationContext';

interface TrafficInformationSettingsWrapperProps {
  showSettingsModal: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const TrafficInformationSettingsWrapper: React.FC<TrafficInformationSettingsWrapperProps> = ({
  showSettingsModal,
  onCancel,
  onConfirm,
  onClose
}) => {
  const { t } = useTranslation();
  const {
    systemPrompts,
    updateSystemPrompts,
    isLoadingPrompts,
    refreshSystemPrompts
  } = useTrafficInformationContext();

  if (!showSettingsModal) return null;

  return (
    <PromptSettingsActionDialog
      title={t("traffic-information:promptSettingsActionDialog.title")}
      cancelBtn={t("traffic-information:promptSettingsActionDialog.cancelBtn")}
      confirmBtn={t("traffic-information:promptSettingsActionDialog.confirmBtn")}
      open={showSettingsModal}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onClose={onClose}
      systemPrompts={systemPrompts}
      updateSystemPrompts={updateSystemPrompts}
      isLoadingPrompts={isLoadingPrompts}
      refreshSystemPrompts={refreshSystemPrompts}
    />
  );
};