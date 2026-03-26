import * as React from "react";
import { useState, useEffect } from "react";
import "./EditResponseJobPoster.css";

import ReloadSVG from "../../assets/icons/reload.svg?react";
import LeftArrowSVG from "../../assets/icons/left-arrow.svg?react";
import RightArrowSVG from "../../assets/icons/right-arrow.svg?react";

import { Button, Typography, Modal, Box } from "@mui/material";
import { getTitleReverted } from "../../pages/feature-job-post-creator/utils";
import { fetchEventSource } from "../../services/fetch";
import { createPromptFieldType } from "../../pages/feature-job-post-creator/types";
import { enqueueSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import _ from "lodash";
const config = window.env;

interface previewResponse {
  title: string;
  description: string[];
  currentVariant: number;
}

interface FeedbackProps {
  previewResponse: previewResponse[];
  userId: string;
  handleClickSaveEdit: (allfields: previewResponse) => void;
  fieldToEdit: previewResponse | null;
  isShowModal: boolean;
  handleCloseModal: () => void;
  createPromptState: createPromptFieldType[];
  templateType: string;
  outputLanguage: string;
}

export const EditResponseJobPoster: React.FC<FeedbackProps> = ({
  previewResponse,
  userId,
  handleClickSaveEdit,
  fieldToEdit,
  isShowModal,
  handleCloseModal,
  createPromptState,
  templateType,
  outputLanguage,
}: FeedbackProps) => {
  const [fieldToEditLocal, setFieldToEditLocal] = useState(fieldToEdit);
  const [editModalOpen, setEditModalOpen] = useState(isShowModal);
  const [isStreaming, setisStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streamEnded, setStreamEnded] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(1);
  const [amountOfResponses, setAmountOfResponses] = useState(1);
  const [responseText, setResponseText] = useState("");
  const [promptText, setPromptText] = useState("");

  useEffect(() => {
    setEditModalOpen(isShowModal);
  }, [isShowModal]);
  useEffect(() => {
    setFieldToEditLocal(fieldToEdit);
  }, [fieldToEdit]);

  const handleClickCloseEditingModal = () => {
    handleCloseModal();
    setResponseText("");
    setPromptText("");
  };

  const changeResponseText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    setResponseText(newText);
  };
  let streamController: AbortController | null = null;

  const handleCloseStream = () => {
    if (streamController) {
      setisStreaming(false);
    }
  };

  const sendMessage = async () => {
    const preparedPayload = {} as any;
    createPromptState.forEach((el: any) => {
      preparedPayload[el.id] = el.value;
    });
    const data = {
      ...preparedPayload,
      templateType: templateType,
      outputLanguage: `${outputLanguage}`,
    };
    setLoading(true);
    setisStreaming(true);

    const url =
      fieldToEditLocal &&
      `${config.apiUrl}api/jobpostcreator/${getTitleReverted(
        fieldToEditLocal.title
      )}`;
    streamController = new AbortController();
    url &&
      fetchEventSource(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: streamController.signal,
        onmessage(event) {
          try {
            const eventData = JSON.parse(event.data);
            const newContent = eventData.Content;
            if (newContent == "stream-ended") {
              handleCloseStream();
              setStreamEnded(true);
            } else if (
              newContent !== "stream-ended" &&
              newContent !== null &&
              newContent !== "Processing..."
            ) {
              const copyFieldToEdit = _.cloneDeep(fieldToEditLocal);
              copyFieldToEdit.description.push(eventData.Content);
              copyFieldToEdit.currentVariant =
                copyFieldToEdit.description.length - 1;
              setFieldToEditLocal(copyFieldToEdit);
              setisStreaming(false);
              setLoading(false);
            }
          } catch (error: any) {
            console.error("Error parsing SSE data:", error);
            handleCloseStream();

            if (error?.response?.data?.message) {
              enqueueSnackbar(`${error?.response?.data?.message}`, {
                variant: "error",
                autoHideDuration: null,
                anchorOrigin: { horizontal: "right", vertical: "bottom" },
              });
            } else if (error?.axiosError?.response.message) {
              enqueueSnackbar(`${error.response.message}`, {
                variant: "error",
                autoHideDuration: null,
                anchorOrigin: { horizontal: "right", vertical: "bottom" },
              });
            } else {
              enqueueSnackbar("Unknown Error", {
                variant: "error",
                autoHideDuration: null,
                anchorOrigin: { horizontal: "right", vertical: "bottom" },
              });
            }

            setLoading(false);
            setisStreaming(false);
          }
        },
        onerror(error: any) {
          handleCloseStream();

          if (error?.response?.data?.message) {
            enqueueSnackbar(`${error?.response?.data?.message}`, {
              variant: "error",
              autoHideDuration: null,
              anchorOrigin: { horizontal: "right", vertical: "bottom" },
            });
          } else if (error?.axiosError?.response.message) {
            enqueueSnackbar(`${error.response.message}`, {
              variant: "error",
              autoHideDuration: null,
              anchorOrigin: { horizontal: "right", vertical: "bottom" },
            });
          } else {
            enqueueSnackbar("Unknown Error", {
              variant: "error",
              autoHideDuration: null,
              anchorOrigin: { horizontal: "right", vertical: "bottom" },
            });
          }

          setLoading(false);
          setisStreaming(false);
          setStreamEnded(true);
          console.error("Network Error: Failed to fetch. Stopping retries.");
        },
      });
  };

  const clickLeftArrow = () => {
    if (
      fieldToEditLocal &&
      Number.isInteger(fieldToEditLocal.currentVariant) &&
      selectedResponse > 1
    ) {
      const copyFieldToEdit = _.cloneDeep(fieldToEditLocal);
      copyFieldToEdit.currentVariant -= 1;
      setFieldToEditLocal(copyFieldToEdit);
      setSelectedResponse((selectedResponse) => selectedResponse - 1);
    }
  };

  const clickRightArrow = () => {
    if (
      fieldToEditLocal &&
      Number.isInteger(fieldToEditLocal.currentVariant) &&
      selectedResponse < fieldToEditLocal.description.length
    ) {
      const copyFieldToEdit = _.cloneDeep(fieldToEditLocal);
      copyFieldToEdit.currentVariant += 1;
      setFieldToEditLocal(copyFieldToEdit);

      setSelectedResponse((selectedResponse) => selectedResponse + 1);
    }
  };

  const clickSaveButton = () => {
    const copyFieldToEdit = _.cloneDeep(fieldToEditLocal);
    if (copyFieldToEdit && responseText) {
      copyFieldToEdit.description[copyFieldToEdit.currentVariant] =
        responseText;

      setFieldToEditLocal(copyFieldToEdit);
      handleClickSaveEdit(copyFieldToEdit);
    }
  };

  useEffect(() => {
    if (fieldToEditLocal !== null && editModalOpen) {
      setAmountOfResponses(fieldToEditLocal.description.length);
      setResponseText(
        fieldToEditLocal.description[fieldToEditLocal.currentVariant]
      );
      setSelectedResponse(fieldToEditLocal.currentVariant + 1);
    }
  }, [fieldToEditLocal, editModalOpen]);

  useEffect(() => {
    if (fieldToEditLocal) {
      setResponseText(
        fieldToEditLocal.description[fieldToEditLocal.currentVariant]
      );
    }
  }, [selectedResponse]);

  const calcArrowsHistoryState = () => {
    let isPrevVersionActive,
      isNextVersionActive = false;
    if (selectedResponse > 1) {
      isPrevVersionActive = true;
    }
    if (selectedResponse < amountOfResponses) {
      isNextVersionActive = true;
    }
    return { isPrevVersionActive, isNextVersionActive };
  };

  const { isNextVersionActive, isPrevVersionActive } = calcArrowsHistoryState();

  const { t } = useTranslation();

  return (
    <Modal
      open={editModalOpen}
      onClose={handleClickCloseEditingModal}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      style={{
        backdropFilter: "blur(3px)",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
    >
      <Box className="modal-edit-jobpost">
        <Typography
          id="modal-modal-title"
          variant="h6"
          component="h2"
          className="modal-edit-jobpost__title"
        >
          {t("components:editResponseJobPoster.titlePrefix")}{" "}
          {fieldToEditLocal?.title}
        </Typography>
        <div className="modal-edit-jobpost__bot-wrapper">
          <div className="bot-wrapper-response">
            <textarea
              className="bot-wrapper-response__textarea"
              value={responseText}
              onChange={changeResponseText}
            />

            <div className="bot-wrapper-response__controllers">
              <div className="responses-controller">
                <button onClick={clickLeftArrow}>
                  <LeftArrowSVG
                    className={`${isPrevVersionActive ? "active" : null}`}
                  />
                </button>
                <p>
                  {selectedResponse} / {amountOfResponses}
                </p>
                <button onClick={clickRightArrow}>
                  <RightArrowSVG
                    className={`${isNextVersionActive ? "active" : null}`}
                  />
                </button>
              </div>

              <button
                className="regenerate-button"
                onClick={sendMessage}
                disabled={isStreaming}
              >
                <ReloadSVG
                  className={`regenerate-button__icon ${
                    isStreaming && "rotate"
                  }`}
                />{" "}
                <p className="ml-[4px]">
                  {t("components:editResponseJobPoster.buttons.regenerate")}
                </p>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-edit-jobpost__buttons-wrapper">
          <Button
            variant="outlined"
            size="large"
            onClick={handleClickCloseEditingModal}
          >
            {t("components:editResponseJobPoster.buttons.cancel")}
          </Button>
          <Button variant="contained" size="large" onClick={clickSaveButton}>
            {t("components:editResponseJobPoster.buttons.save")}
          </Button>
        </div>
      </Box>
    </Modal>
  );
};
