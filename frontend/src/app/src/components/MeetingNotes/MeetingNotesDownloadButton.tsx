import React from "react";
import { useTranslation } from "react-i18next";
import handleDownload from "../../utils/handleDownload";
import { CircularProgress } from "@mui/material";

interface MeetingNotesButtonProps {
  loadingMeetingNotes: boolean;
  isStreaming: boolean;
  textToDownload: string;
  actionsError: boolean;
  summaryError: boolean;
}

const MeetingNotesDownloadButton: React.FC<MeetingNotesButtonProps> = ({
  loadingMeetingNotes,
  isStreaming,
  textToDownload,
  actionsError,
  summaryError,
}) => {
  const { t } = useTranslation();

  // Check if there are any errors; if yes, do not render the button.
  if (actionsError || summaryError) {
    return null;
  }

  return (
    <button
      onClick={() =>
        handleDownload({
          isReadyData: !isStreaming,
          textToDownload,
          errorMessage: t("meeting-note-generator:downloadError"),
          successMessage: t("meeting-note-generator:downloadSuccess"),
          fileName: "meeting-notes.txt",
        })
      }
      aria-label={
        loadingMeetingNotes || isStreaming
          ? t("meeting-note-generator:buttons.generating")
          : t("meeting-note-generator:buttons.download")
      }
      className={`${
        loadingMeetingNotes || isStreaming
          ? "cursor-not-allowed"
          : "cursor-pointer hover:bg-red-600 hover:text-white-100"
      } mt-auto mb-0 rounded-full w-full bg-white-200 text-gray-700 !font-body py-4 font-semibold flex items-center justify-center transition-color duration-300 ease-out`}
      disabled={loadingMeetingNotes || isStreaming}
    >
      {loadingMeetingNotes || isStreaming
        ? t("meeting-note-generator:buttons.generating")
        : t("meeting-note-generator:buttons.download")}
      {loadingMeetingNotes || isStreaming ? (
        <span className="ml-4 flex items-center">
          <CircularProgress size={24} className="!text-gray-650" />
        </span>
      ) : null}
    </button>
  );
};

export default MeetingNotesDownloadButton;
