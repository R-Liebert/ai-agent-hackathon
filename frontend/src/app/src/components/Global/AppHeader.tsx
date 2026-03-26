import React, { useState, useMemo } from "react";
import MainNav from "../MainNavigation/MainNavigation";
import { TbArrowBackUp } from "react-icons/tb";
import Tooltip from "./Tooltip";
import ConfirmLeaveDialog from "../../components/Global/ConfirmActionDialog";
import { useTranslation } from "react-i18next";

interface AppHeaderProps {
  title: string;
  handleReset: () => void;
  file?: File | null;
  moduleName: string;
  returnBtnText: string;
  selectedFolderName?: string | null;
  showContent?: boolean;
  hasError?: boolean;
  resetMeetingNotes?: boolean;
  hideHomeBtn?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title = "",
  moduleName,
  handleReset,
  file,
  returnBtnText,
  selectedFolderName,
  showContent,
  hasError,
  resetMeetingNotes,
  hideHomeBtn = false,
}) => {
  const [showLeaveDialog, setShowLeaveDialog] = useState<boolean>(false);
  const { t } = useTranslation();

  const handleReturn = () => {
    setShowLeaveDialog(!showLeaveDialog);
  };

  const confirmLeavePage = () => {
    setShowLeaveDialog(!showLeaveDialog);
    handleReset();
  };

  return (
    <>
      <MainNav
        title={title}
        hideHomeBtn={hideHomeBtn}
        buttons={
          (file && !hasError) || selectedFolderName || resetMeetingNotes ? (
            <>
              <button
                className="flex items-center justify-center text-center hover:bg-gray-600 rounded-lg w-9 h-9 md:ml-2 mr-1 mt-0 sm:mt-[2px] relative group"
                aria-label="Return"
                onClick={handleReturn}
              >
                <TbArrowBackUp size={24} strokeWidth={1.6} />
                <Tooltip text={returnBtnText} position="left-0 top-10" />
              </button>
            </>
          ) : null
        }
        moduleName={
          (file && !hasError) ||
          selectedFolderName ||
          showContent ||
          moduleName === "Meeting Notes Creator" ? (
            <div
              className={`${
                (file && !hasError) || selectedFolderName || resetMeetingNotes
                  ? "mt-[2px] ml-2"
                  : "mt-0 sm:mt-2 ml-4"
              } flex place-items-start place-content-center font-medium`}
            >
              <p>{moduleName}</p>
            </div>
          ) : null
        }
      />

      {showLeaveDialog && (
        <ConfirmLeaveDialog
          title={t("components:resetPageModal.title")}
          message={t("components:resetPageModal.paragraph")}
          cancelBtn={t("components:resetPageModal.cancelBtn")}
          confirmBtn={t("components:resetPageModal.confirmBtn")}
          open={showLeaveDialog}
          onCancel={() => setShowLeaveDialog(false)}
          onConfirm={confirmLeavePage}
          onClose={() => setShowLeaveDialog(false)}
        />
      )}
    </>
  );
};

export default AppHeader;
