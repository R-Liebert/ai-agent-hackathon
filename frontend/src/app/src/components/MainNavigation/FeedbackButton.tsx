import React, { useState, useEffect, useRef, useMemo } from "react";
import FeedbackModal from "./components/FeedbackModal";
import { TbMessage2Heart } from "react-icons/tb";
import Tooltip from "../Global/Tooltip";
import { useTranslation } from "react-i18next";
import launchpadMetrics from "../../services/launchpadMetrics";
import { useNavigate } from "react-router-dom";
import { useMsal } from "../../hooks/useMsalMock";
import { useCanvas } from "../../hooks/useCanvas";

const FeedbackButton = () => {
  const [openFeedbackModal, setFeedbackModal] = useState<boolean>(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const userId = useMemo(() => accounts[0]?.localAccountId, [accounts]);

  const { isCanvasMode } = useCanvas();

  const handleFeedbackModalClose = () => setFeedbackModal(false);

  const handleFeedbackNavigation = () => {
    navigate("/give-feedback");
    launchpadMetrics.track({
      metric: "launchpad_ui_button_click_count",
      labels: {
        page: "give-feedback",
        button: "FeedbackNavigation",
      },
    });
  };

  return (
    <>
      <button
        className={`${
          isCanvasMode
            ? "hover:bg-gray-600 md:hover:bg-gray-400"
            : "hover:bg-gray-600"
        } flex cursor-pointer outline-none height-auto width-auto fixed top-2 right-2 p-2 rounded-lg z-[99] active:outline-none active:ring-6 active:ring-opacity-10 active:ring-transparent hover:text-superwhite transition-all duration-300 ease-out`}
        aria-label={t("components:profileTabLinks:feedbackLink")}
        onClick={handleFeedbackNavigation}
        ref={anchorRef}
      >
        <div className="relative group">
          <TbMessage2Heart
            strokeWidth={1.4}
            size={22}
            className="text-superwhite"
          />
          <Tooltip
            text="components:profileTabLinks:feedbackLink"
            position="-right-3 -bottom-10"
          />
        </div>
      </button>

      <FeedbackModal
        userId={userId}
        onClose={handleFeedbackModalClose}
        isOpen={openFeedbackModal}
      />
    </>
  );
};

export default FeedbackButton;
