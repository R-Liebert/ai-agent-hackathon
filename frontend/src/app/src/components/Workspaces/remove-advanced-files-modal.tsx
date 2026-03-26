import React from "react";
import { useTranslation } from "react-i18next";
import { WorkspaceFileDto } from "../../models/workspace-model";
import ModalContainer from "../Global/ModalContainer";

interface RemoveAdvancedFilesModalProps {
  open: boolean;
  advancedFiles: WorkspaceFileDto[]; // The advanced files we’ll remove
  onClose: () => void;
  onConfirm: () => void; // User confirms removal
}

const RemoveAdvancedFilesModal: React.FC<RemoveAdvancedFilesModalProps> = ({
  open,
  advancedFiles,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <ModalContainer
      open={open}
      title={t(
        "workspaces:singleWorkspace.modals.removeAdvancedFilesModal.title"
      )}
      onClose={onClose}
      width="max-w-md"
    >
      <div className="md:px-6 px-4 py-5 w-full flex flex-col h-auto">
        {/* Message */}
        <p className="text-gray-300 mb-4">
          {t(
            "workspaces:singleWorkspace.modals.removeAdvancedFilesModal.warningMessage"
          )}
        </p>

        {/* Optional: List the advanced files by name */}
        <ul className="list-disc list-inside text-white-100 mb-6">
          {advancedFiles.map((file) => (
            <li key={file.fileName}>{file.fileName}</li>
          ))}
        </ul>

        <p className="text-gray-300 mb-4">
          {t(
            "workspaces:singleWorkspace.modals.removeAdvancedFilesModal.warningAction"
          )}
        </p>

        <div className="flex w-full justify-end pt-2 place-content-center gap-4 mt-6">
          <button
            aria-label={t(
              "workspaces:singleWorkspace.modals.removeAdvancedFilesModal.buttons.cancel"
            )}
            className="flex place-content-center rounded-full px-6 py-3 font-medium bg-gray-400 text-white-100 hover:bg-gray-650"
            onClick={onClose}
          >
            {t(
              "workspaces:singleWorkspace.modals.removeAdvancedFilesModal.buttons.cancel"
            )}
          </button>

          <button
            aria-label={t(
              "workspaces:singleWorkspace.modals.removeAdvancedFilesModal.buttons.confirm"
            )}
            className="flex place-content-center rounded-full px-6 py-3 bg-red-800 hover:bg-red-700 font-medium font-body"
            onClick={onConfirm}
          >
            {t(
              "workspaces:singleWorkspace.modals.removeAdvancedFilesModal.buttons.confirm"
            )}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default RemoveAdvancedFilesModal;
