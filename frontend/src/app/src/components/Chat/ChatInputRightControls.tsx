import React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { TbArrowUp, TbSquareFilled } from "react-icons/tb";
import Tooltip from "../Global/Tooltip";
import { VoiceRecordingButtonComponent } from "./VoiceRecordingButton";
import type { AudioRecordingState } from "../../types/voiceRecording";
import { useTranslation } from "react-i18next";

interface RightSideControlsProps {
  inputValue: string;
  isLatchedExpanded: boolean;
  isCharLimitExceeded: boolean;
  isLoading: boolean;
  isUploading: boolean;
  isInputEnabled: boolean;
  handleSendButtonClick: () => void;
  handleCloseStream?: () => void;
  onTranscriptionComplete: (text: string) => void;
  onVoiceRecordingError: (error: string) => void;
  checkAudioSupport: () => boolean;
  onAudioStateChange?: (state: AudioRecordingState) => void;
}

const RightSideControls: React.FC<RightSideControlsProps> = ({
  inputValue,
  isLatchedExpanded,
  isCharLimitExceeded,
  isLoading,
  isUploading,
  isInputEnabled,
  handleSendButtonClick,
  handleCloseStream,
  onTranscriptionComplete,
  onVoiceRecordingError,
  checkAudioSupport,
  onAudioStateChange,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 mr-1">
      {/* Voice Recording Button */}
      <VoiceRecordingButtonComponent
        isInputEnabled={isInputEnabled}
        isLoading={isLoading}
        isUploading={isUploading}
        isCharLimitExceeded={isCharLimitExceeded}
        onTranscriptionComplete={onTranscriptionComplete}
        onError={onVoiceRecordingError}
        checkAudioSupport={checkAudioSupport}
        hasTextAvailableToSend={inputValue.trim().length > 0}
        onAudioStateChange={onAudioStateChange}
      />

      {/* Conditional Rendering for Pause or Send Button */}
      {isLoading && handleCloseStream ? (
        // Pause Button: Displayed when isLoading is true
        <Tooltip useMui text="Cancel">
          <button
            aria-label="Cancel"
            className="relative flex items-center justify-center z-10 cursor-pointer rounded-full text-white-100 bg-gray-400 w-9 h-9"
            onClick={handleCloseStream}
          >
            <TbSquareFilled size={14} />
          </button>
        </Tooltip>
      ) : (
        // Send Button: Displayed when isLoading is false
        inputValue.trim().length > 0 && (
          <Tooltip
            useMui
            text={
              isCharLimitExceeded
                ? t("components:chatInput.characterLimitExceeded")
                : !inputValue.trim() || isLoading || isUploading
                ? "Send (Inactive)"
                : t("components:chatInput.buttons.send")
            }
          >
            <button
              className="cursor-pointer"
              onClick={handleSendButtonClick}
              aria-label={
                !inputValue.trim() ||
                isLoading ||
                isUploading ||
                isCharLimitExceeded
                  ? "Send (Inactive)"
                  : t("components:chatInput.buttons.send")
              }
              disabled={
                !inputValue.trim() ||
                isLoading ||
                isUploading ||
                isCharLimitExceeded
              }
            >
              <div
                className={`relative rounded-full w-9 h-9 flex items-center justify-center ${
                  !inputValue.trim() ||
                  isLoading ||
                  isUploading ||
                  isCharLimitExceeded
                    ? "bg-white-200/10 text-gray-600"
                    : "bg-white-200 text-gray-800"
                }`}
              >
                <TbArrowUp strokeWidth={2.2} size={22} />
              </div>
            </button>
          </Tooltip>
        )
      )}
    </div>
  );
};

export default RightSideControls;
