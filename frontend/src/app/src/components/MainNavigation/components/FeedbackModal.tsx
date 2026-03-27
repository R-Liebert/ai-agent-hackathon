import React, { useState, useEffect } from "react";
import { FeedbackForm, FeedbackState } from "./FeedbackModalForm";
import axiosInstance from "../../../services/axiosInstance";
import { useMsal } from "../../hooks/useMsalMock";
import { useMsalApi } from "../../../services/auth";
import { useTranslation } from "react-i18next";
import ModalContainer from "../../Global/ModalContainer";
import { Config } from "../../../interfaces/interfaces";

const config: Config = window.env;

interface FeedbackProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const SendFeedbackModal: React.FC<FeedbackProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [isSent, setSentStatus] = useState(false);
  const [isError, setErrorStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { accounts } = useMsal();
  const { getTokentWithScopes } = useMsalApi();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setSentStatus(false);
      setErrorStatus(false);
    }
  }, [isOpen]);

  const handleSendFeedback = async (feedback: FeedbackState) => {
    setIsLoading(true);
    try {
      const requestBody = {
        userId: userId,
        name: accounts[0]?.name,
        email: accounts[0]?.username,
        message: feedback?.message
          ? btoa(unescape(encodeURIComponent(feedback?.message)))
          : "",
        createdDate: new Date().toISOString(),
        type: feedback?.feedbackType,
        currentPageUrl: btoa(
          unescape(encodeURIComponent(window.location.href))
        ),
      };
      const token = await getTokentWithScopes(config.clientScopes);

      const response = await axiosInstance.post(
        "/feedback",
        JSON.stringify(requestBody),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status !== 200) {
        alert("Error sending feedback - please try again");
        console.error(
          `Error sending feedback: ${response.status} ${response.statusText}`
        );
        setErrorStatus(true);
      } else {
        setSentStatus(true);
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      setErrorStatus(true);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setErrorStatus(false);
        onClose();
      }, 1800);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContainer
      title={t("components:feedbackComponent.feedbackDialog.title")}
      open={isOpen}
      onClose={onClose}
      width="max-w-lg"
    >
      <div className="w-full flex flex-col !font-body">
        {isError ? (
          <p className="font-body text-[16px] py-2 mb-1">
            {t("components:feedbackComponent.feedbackDialog.errorMessage")}
          </p>
        ) : isSent ? (
          <p className="font-body text-[16px] py-2 mb-1 leading-6">
            {t("components:feedbackComponent.feedbackDialog.thankYouMessage")}
          </p>
        ) : (
          <>
            <FeedbackForm
              onClose={onClose}
              handleSendFeedback={handleSendFeedback}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </ModalContainer>
  );
};

export default SendFeedbackModal;
