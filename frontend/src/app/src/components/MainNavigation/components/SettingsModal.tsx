import React, { useState } from "react";
import ModalContainer from "../../Global/ModalContainer";
import SettingsContent from "./SettingsModalContent";
import { useTranslation } from "react-i18next";

interface SettingsModalProps {
  isOpen?: boolean;
  userId?: string;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const { t } = useTranslation();

  const toggleDeleteConfirmation = () => {
    setDeleteConfirmation(!deleteConfirmation);
  };

  if (!isOpen) return null;

  const handleCloseSettingsModal = () => {
    onClose();
  };

  return (
    <ModalContainer
      open={isOpen}
      title={t("components:settingsModal.title")}
      onClose={onClose}
      width="max-w-sm"
    >
      {!deleteConfirmation ? (
        <SettingsContent
          onDeleteAllChats={toggleDeleteConfirmation}
          userId={userId}
          onCloseSettingsModal={handleCloseSettingsModal}
        />
      ) : (
        <div>
          {/* delete chat history confirmation content */}
          <div className="flex pb-0 w-full mx-auto justify-between align-center place-content-center">
            <h2 className="text-lg font-semibold flex text-center">
              Clear your chat history - are you sure?
            </h2>
          </div>
          <div className="flex w-full justify-end p-4 pt-2 place-content-center gap-4">
            <button
              aria-label="Cancel Deletion"
              className="flex place-content-center rounded-full px-4 py-2 border-2 border-gray-500 bg-gray-600 text-gray-300 hover:border-white/80 hover:text-white-100/80
              active:border-white/80 active:text-white-100/80 focus:border-white/80 focus:text-white-100/80 font-semibold"
              onClick={toggleDeleteConfirmation}
            >
              Cancel
            </button>
            <button
              aria-label="Confirm Deletion"
              className="flex place-content-center rounded-full px-4 py-2 bg-red-400 hover:bg-red-700 font-semibold"
              onClick={onClose}
            >
              Confirm Deletion
            </button>
          </div>
        </div>
      )}
    </ModalContainer>
  );
};

export default SettingsModal;
