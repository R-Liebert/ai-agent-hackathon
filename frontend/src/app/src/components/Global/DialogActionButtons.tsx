import React from "react";

export interface DialogActionButtonsProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText: string;
  confirmText: string;
  confirmDisabled?: boolean;
}
const DialogActionButtons: React.FC<DialogActionButtonsProps> = ({
  onCancel,
  onConfirm,
  cancelText,
  confirmText,
  confirmDisabled = false,
}) => {
  const confirmDisabledClasses = confirmDisabled
    ? "opacity-20 pointer-events-none cursor-not-allowed"
    : "";

  return (
    <div className="flex gap-3 justify-end mb-2 mt-2">
      <button
        type="button"
        className="
          flex w-[48%] sm:w-auto place-content-center place-items-center rounded-full px-3 py-2
          text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100
          hover:bg-gray-400 hover:text-superwhite focus:bg-gray-650 focus:text-white-100 font-body
        "
        onClick={onCancel}
      >
        {cancelText}
      </button>

      <button
        type="button"
        className={`
          flex w-full sm:w-auto mt-4 sm:mt-0 place-content-center rounded-full px-3 py-2
          text-[14px] bg-white-200 hover:bg-red-700 text-gray-700 hover:text-white-100 font-body
          font-semibold transition-color transition-background duration-300 ease-in-out
          place-items-center place-content-center
          ${confirmDisabledClasses}
        `}
        onClick={onConfirm}
        disabled={confirmDisabled}
      >
        {confirmText}
      </button>
    </div>
  );
};

export default DialogActionButtons;
