import React, { useState } from "react";
import ModalContainer from "../Global/ModalContainer";
import { useTranslation } from "react-i18next";
import CustomToggleButton from "../app-toggle-button";

interface FileUploadModalProps {
  open: boolean;
  duplicateFileName: string;
  onAdd: () => void;
  onIgnore: () => void;
  onReplace: () => void;
  onClose: () => void;
  onApplyToAllChange: (apply: boolean) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  duplicateFileName,
  onAdd,
  onIgnore,
  onReplace,
  onClose,
  onApplyToAllChange,
}) => {
  const { t } = useTranslation();

  const [isApplyToAll, setIsApplyToAll] = useState<boolean>(false);

  const handleToggle = () => {
    setIsApplyToAll((prev) => {
      const newState = !prev;
      onApplyToAllChange(newState);
      return newState;
    });
  };

  return (
    <ModalContainer
      open={open}
      title={t("workspaces:singleWorkspace.modals.filesUploadModal.title")}
      onClose={onClose}
      width="max-w-lg"
    >
      <div className="md:px-6 px-4 py-5 w-full flex flex-col h-auto">
        <div className="mb-6">
          <p className="text-gray-300">
            {t(
              "workspaces:singleWorkspace.modals.filesUploadModal.paragraph.textOne"
            )}{" "}
            <span className="text-white-100">{duplicateFileName}</span>{" "}
            {t(
              "workspaces:singleWorkspace.modals.filesUploadModal.paragraph.textTwo"
            )}{" "}
            {t(
              "workspaces:singleWorkspace.modals.filesUploadModal.paragraph.textThree"
            )}
          </p>
        </div>
        <CustomToggleButton
          dataTestId="apply-to-all-toggle"
          text={t("workspaces:common:form:toggleButtons:applyToAll")}
          isToggled={isApplyToAll}
          onToggle={handleToggle}
          isModalToggle={true}
        />
        <div className="flex w-full justify-end pt-2 place-content-center gap-4 mt-6">
          {/* Ignore Button */}
          <button
            aria-label={t(
              "workspaces:singleWorkspace.modals.filesUploadModal.buttons.ignore"
            )}
            className="flex place-content-center rounded-full px-6 py-3 font-medium bg-gray-400 text-white-100 hover:bg-gray-650"
            onClick={onIgnore}
          >
            {t(
              "workspaces:singleWorkspace.modals.filesUploadModal.buttons.ignore"
            )}
          </button>
          {/* Add Button */}
          <button
            aria-label={t(
              "workspaces:singleWorkspace.modals.filesUploadModal.buttons.add"
            )}
            className="flex place-content-center rounded-full px-6 py-3 bg-red-800 hover:bg-red-700 font-medium font-body"
            onClick={onAdd}
          >
            {t(
              "workspaces:singleWorkspace.modals.filesUploadModal.buttons.add"
            )}
          </button>
          {/* Replace Button */}
          <button
            aria-label={t(
              "workspaces:singleWorkspace.modals.filesUploadModal.buttons.replace"
            )}
            className="flex place-content-center rounded-full px-6 py-3 bg-red-800 hover:bg-red-700 font-medium font-body"
            onClick={onReplace}
          >
            {t(
              "workspaces:singleWorkspace.modals.filesUploadModal.buttons.replace"
            )}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default FileUploadModal;
