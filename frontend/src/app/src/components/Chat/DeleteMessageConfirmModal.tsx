import React from "react";
import { useTranslation } from "react-i18next";
import ModalContainer from "../Global/ModalContainer";
import { TbAlertCircle, TbTrash } from "react-icons/tb";

interface DeleteMessageConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteMessageConfirmModal: React.FC<DeleteMessageConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <ModalContainer
      open={open}
      title={t("common:chatMessage.deleteModal.title")}
      onClose={onClose}
      width="max-w-sm"
    >
      <div className="w-full flex flex-col h-auto !font-body">
        {/*Main Message */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex flex-col gap-3">
            <p className="text-white-100 text-[15px] leading-relaxed">
              {t("common:chatMessage.deleteModal.warningMessage")}
            </p>
          </div>
        </div>
        {/* What will happen box with the icon */}
        <div className="bg-gray-700 border border-gray-500 rounded-lg p-3 relative mt-3">
          <div className="flex-shrink-0 mt-1 absolute -top-4 left-2 bg-gray-700">
            <TbAlertCircle size={24} className="text-yellow-500" />
          </div>
          <p className="text-white-100 text-sm font-medium my-2">
            {t("common:chatMessage.deleteModal.whatWillHappen")}
          </p>
          <ul className="space-y-1 text-gray-300 text-sm mb-1">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t("common:chatMessage.deleteModal.bulletPoint1")}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t("common:chatMessage.deleteModal.bulletPoint2")}</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full justify-end gap-3 mt-6">
          <button
            aria-label={t("common:chatMessage.deleteModal.buttons.cancel")}
            className="flex place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite
              focus:bg-gray-650 focus:text-white-100 font-body"
            onClick={onClose}
          >
            {t("common:chatMessage.deleteModal.buttons.cancel")}
          </button>

          <button
            aria-label={t("common:chatMessage.deleteModal.buttons.confirm")}
            className="flex place-content-center place-items-center rounded-full px-3 py-2 text-[14px] bg-red-700 text-white-100 hover:bg-red-800 font-body font-semibold transition-colors duration-300 ease-in-out"
            onClick={onConfirm}
          >
            {t("common:chatMessage.deleteModal.buttons.confirm")}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default DeleteMessageConfirmModal;
