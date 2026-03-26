import React from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { useSurveys } from "./SurveysContext";
import { useTranslation } from "react-i18next";

interface SurveyDialogModalProps {}

export const SurveyDialogModal: React.FC<SurveyDialogModalProps> = () => {
  const { t } = useTranslation();

  const { activeSurvey, isLoading, onClose, onConfirm, onRemindme } =
    useSurveys();

  if (activeSurvey == null || activeSurvey == undefined) {
    return null;
  }

  return (
    <Modal
      open={true}
      onClose={() => {
        return false;
      }}
      className="flex justify-center items-center"
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box className="modal-confirm-survey outline-none flex flex-col items-center justify-center bg-[#f2f2f2] text-black w-10/12 md:w-1/2 lg:w-1/3 xl:w-1/4 rounded-lg p-4">
        <div className="modal-confirm-survey-wrapper text-center p-1 mb-4">
          {activeSurvey && (
            <>
              <h2 className="survey-header mb-7">{activeSurvey.header}</h2>
              <p
                className="survey-welcome-text font-normal"
                dangerouslySetInnerHTML={{ __html: activeSurvey.body }}
              />
            </>
          )}
        </div>
        <div className="modal-confirm-survey__buttons-wrapper flex justify-end w-full">
          <div className="flex">
            <Button
              className="rounded-lg !normal-case !bg-[#b41730] !text-white-100 !border-0"
              variant="outlined"
              size="large"
              disabled={isLoading}
              onClick={() => onConfirm(activeSurvey)}
            >
              {t("common:surveys.buttons.yes")}
            </Button>
            <Button
              className="rounded-lg !normal-case !bg-[#a5a5a5] !text-black !ml-3 !border-0"
              variant="outlined"
              size="large"
              disabled={isLoading}
              onClick={() => onClose(activeSurvey)}
            >
              {t("common:surveys.buttons.no")}
            </Button>
            <Button
              className="rounded-lg !normal-case !bg-[#a5a5a5] !text-black !ml-3 !border-0"
              variant="outlined"
              size="large"
              disabled={isLoading}
              onClick={() => onRemindme(activeSurvey)}
            >
              {t("common:surveys.buttons.remindme")}
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
};
