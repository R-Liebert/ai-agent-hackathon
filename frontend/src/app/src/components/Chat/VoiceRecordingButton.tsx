import React, { useMemo, memo, useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { HiOutlineMicrophone } from "react-icons/hi";
import Tooltip from "../Global/Tooltip";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { useAudioVolume } from "../../hooks/useAudioVolume";
import type { AudioRecordingState } from "../../types/voiceRecording";
import { IoCloseOutline } from "react-icons/io5";
import { HiCheck } from "react-icons/hi";
import WaveAnimation from "./WaveAnimation";

interface VoiceRecordingButtonProps {
  isInputEnabled: boolean;
  isLoading: boolean;
  isUploading: boolean;
  isCharLimitExceeded: boolean;
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
  checkAudioSupport: () => boolean;
  hasTextAvailableToSend?: boolean;
  onAudioStateChange?: (state: AudioRecordingState) => void;
}

interface VoiceRecordingButtonReturn {
  audioState: AudioRecordingState;
  voiceRecordingButton: React.ReactNode;
  cleanup: () => void;
}

const CancelButton = memo(
  ({
    onCancel,
    tooltipText,
  }: {
    onCancel: () => void;
    tooltipText: string;
  }) => {
    return (
      <Tooltip useMui text={tooltipText}>
        <button
          type="button"
          onClick={onCancel}
          className="flex relative z-10 place-content-center rounded-full bg-transparent w-10 h-9 mt-[3px] text-white-100 hover:bg-gray-400 focus:bg-gray-400 font-body duration-150 ease-out place-items-center"
          aria-label={tooltipText}
        >
          <IoCloseOutline size={23} />
        </button>
      </Tooltip>
    );
  }
);
CancelButton.displayName = "CancelButton";

const StopAndSaveButton = memo(
  ({ onStop, tooltipText }: { onStop: () => void; tooltipText: string }) => {
    return (
      <Tooltip useMui text={tooltipText}>
        <button
          type="button"
          onClick={onStop}
          className="flex relative z-10 place-content-center rounded-full bg-transparent w-10 h-9 mt-[3px] text-white-100 hover:bg-gray-400 focus:bg-gray-400 font-body duration-150 ease-out place-items-center"
          aria-label={tooltipText}
        >
          <HiCheck size={23} />
        </button>
      </Tooltip>
    );
  }
);
StopAndSaveButton.displayName = "StopAndSaveButton";

const MainRecordingButton = memo(
  ({
    isRecording,
    isProcessingAudio,
    isInitializing,
    isMicrophoneDisabled,
    onToggleRecording,
    onStop,
    tooltipText,
    hasTextAvailableToSend,
  }: {
    isRecording: boolean;
    isProcessingAudio: boolean;
    isInitializing: boolean;
    isMicrophoneDisabled: boolean;
    onToggleRecording: () => Promise<void>;
    onStop: () => void;
    tooltipText: string;
    hasTextAvailableToSend: boolean;
  }) => {
    const baseClasses =
      "relative rounded-full inline-flex items-center justify-center whitespace-nowrap";

    const stateClasses = isRecording
      ? "bg-transparent cursor-default"
      : isInitializing
      ? "bg-blue-100 text-blue-800 cursor-wait w-9 h-9"
      : isProcessingAudio
      ? "bg-transparent w-9 h-9"
      : isMicrophoneDisabled
      ? "bg-transparent opacity-20 w-9 h-9 pointer-events-none"
      : hasTextAvailableToSend
      ? "bg-transparent text-white-100 hover:bg-gray-400 w-9 h-9"
      : "bg-white-200 text-gray-800 w-9 h-9";

    const showSpinner = isInitializing || isProcessingAudio;

    return (
      <div className="relative">
        {!isRecording && !isProcessingAudio && (
          <Tooltip useMui text={tooltipText}>
            <div className="relative">
              <button
                type="button"
                onClick={isRecording ? undefined : onToggleRecording}
                disabled={
                  isMicrophoneDisabled && !isRecording && !isInitializing
                }
                className={`${baseClasses} ${stateClasses}`}
                aria-label={tooltipText}
                aria-pressed={isRecording}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && isRecording) onStop();
                }}
              >
                {showSpinner ? (
                  <CircularProgress size={22} sx={{ color: "inherit" }} />
                ) : (
                  !isRecording &&
                  !isInitializing && (
                    <HiOutlineMicrophone
                      size={21}
                      className={
                        hasTextAvailableToSend
                          ? "text-white-100"
                          : "text-gray-800"
                      }
                    />
                  )
                )}
              </button>
            </div>
          </Tooltip>
        )}
        {isProcessingAudio && (
          <div className="relative">
            <button
              type="button"
              disabled
              className={`${baseClasses} ${stateClasses}`}
              aria-label="Processing"
            >
              <CircularProgress size={22} sx={{ color: "inherit" }} />
            </button>
          </div>
        )}
      </div>
    );
  }
);
MainRecordingButton.displayName = "MainRecordingButton";

export const VoiceRecordingButtonComponent = memo(
  ({
    isInputEnabled,
    isUploading,
    isLoading,
    isCharLimitExceeded,
    onTranscriptionComplete,
    onError,
    checkAudioSupport,
    hasTextAvailableToSend,
  }: VoiceRecordingButtonProps) => {
    const { t } = useTranslation();

    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

    const {
      audioState,
      handleToggleRecording,
      stopRecording,
      cancelRecording,
      currentStream,
    } = useVoiceRecorder({
      maxDuration: 30,
      onTranscriptionComplete,
      onError,
    });

    useEffect(() => {
      setActiveStream(currentStream);
    }, [currentStream, audioState.isRecording]);

    const { volume } = useAudioVolume({
      externalStream: activeStream,
      enabled: audioState.isRecording,
    });

    const isVoiceRecordingSupported = useMemo(
      () => checkAudioSupport(),
      [checkAudioSupport]
    );

    const buttonConditions = useMemo(() => {
      const isMicrophoneDisabled =
        !isInputEnabled ||
        isUploading ||
        audioState.isProcessingAudio ||
        isCharLimitExceeded;

      const shouldRenderComponent = isVoiceRecordingSupported;
      return { isMicrophoneDisabled, shouldRenderComponent };
    }, [
      isInputEnabled,
      isUploading,
      audioState.isProcessingAudio,
      isCharLimitExceeded,
      isVoiceRecordingSupported,
    ]);

    const labels = useMemo(
      () => ({
        cancelTooltip: t("components:chatInput.voiceRecording.cancelRecording"),
        saveTooltip: t("components:chatInput.voiceRecording.saveRecording"),
        mainTooltip: isCharLimitExceeded
          ? t("components:chatInput.voiceRecording.recordingDisabled")
          : hasTextAvailableToSend
          ? t("components:chatInput.voiceRecording.tooltip")
          : t("components:chatInput.voiceRecording.startRecording"),
        durationLimit: t(
          "components:chatInput.voiceRecording.maxDurationReached",
          {
            limit: 30,
          }
        ),
      }),
      [t, isCharLimitExceeded, hasTextAvailableToSend]
    );

    if (!buttonConditions.shouldRenderComponent) return null;

    return (
      <div className="flex items-center">
        <div className="w-full flex items-center">
          {audioState.isRecording && (
            <div className="absolute right-3 z-[99] w-[91%] flex bg-gray-600 h-10 overflow-hidden">
              <WaveAnimation
                isRecording={audioState.isRecording}
                volume={volume}
              />
              <CancelButton
                onCancel={cancelRecording}
                tooltipText={labels.cancelTooltip}
              />
              <StopAndSaveButton
                onStop={stopRecording}
                tooltipText={labels.saveTooltip}
              />
            </div>
          )}
        </div>

        <MainRecordingButton
          isRecording={audioState.isRecording}
          isProcessingAudio={audioState.isProcessingAudio}
          isInitializing={audioState.isInitializing}
          isMicrophoneDisabled={buttonConditions.isMicrophoneDisabled}
          onToggleRecording={handleToggleRecording}
          onStop={stopRecording}
          tooltipText={labels.mainTooltip}
          hasTextAvailableToSend={!!hasTextAvailableToSend || isLoading}
        />
      </div>
    );
  }
);
VoiceRecordingButtonComponent.displayName = "VoiceRecordingButtonComponent";
