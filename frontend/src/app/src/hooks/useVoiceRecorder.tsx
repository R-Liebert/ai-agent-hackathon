import { useReducer, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { notificationsService } from "../services/notificationsService";
import { useVoiceTranscription } from "./useVoiceTranscription";
import type {
  AudioRecordingState,
  AudioAction,
  VoiceRecorderConfig,
  VoiceRecorderHookReturn,
  MediaRecorderError,
} from "../types/voiceRecording";

// Audio state reducer
const audioReducer = (
  state: AudioRecordingState,
  action: AudioAction
): AudioRecordingState => {
  switch (action.type) {
    case "START_INITIALIZING":
      return {
        ...state,
        isInitializing: true,
        audioError: null,
        isCancelled: false,
      };
    case "START_RECORDING":
      return {
        ...state,
        isInitializing: false,
        isRecording: true,
        audioError: null,
        recordingDuration: 0,
        startTime: action.payload,
        isCancelled: false,
      };
    case "STOP_RECORDING":
      return {
        ...state,
        isRecording: false,
      };
    case "SET_PROCESSING":
      return {
        ...state,
        isProcessingAudio: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        audioError: action.payload,
        isRecording: false,
        isProcessingAudio: false,
        isInitializing: false,
      };
    case "UPDATE_DURATION":
      const elapsedSeconds = state.startTime
        ? Math.floor((action.payload - state.startTime) / 1000)
        : 0;
      return {
        ...state,
        recordingDuration: elapsedSeconds,
      };
    case "RESET":
      return {
        isRecording: false,
        isProcessingAudio: false,
        isInitializing: false,
        audioError: null,
        recordingDuration: 0,
        startTime: null,
        isCancelled: false,
      };
    case "CANCEL_RECORDING":
      return {
        isRecording: false,
        isProcessingAudio: false,
        isInitializing: false,
        audioError: null,
        recordingDuration: 0,
        startTime: null,
        isCancelled: true,
      };
    default:
      return state;
  }
};

export const useVoiceRecorder = (
  config: VoiceRecorderConfig = {}
): VoiceRecorderHookReturn => {
  const { maxDuration = 60, onTranscriptionComplete, onError } = config;

  const [audioState, audioDispatch] = useReducer(audioReducer, {
    isRecording: false,
    isProcessingAudio: false,
    isInitializing: false,
    audioError: null,
    recordingDuration: 0,
    startTime: null,
    isCancelled: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const isCancelledRef = useRef(false);

  const { t } = useTranslation();

  const {
    transcribeAudio,
    isTranscribing,
    reset: resetTranscription,
  } = useVoiceTranscription({
    onSuccess: (result) => {
      if (result.text.trim()) {
        onTranscriptionComplete?.(result.text);
      }
    },
    onError: (errorMessage) => {
      audioDispatch({ type: "SET_ERROR", payload: errorMessage });
      onError?.(errorMessage);
    },
  });

  useEffect(() => {
    isCancelledRef.current = audioState.isCancelled;
  }, [audioState.isCancelled]);

  useEffect(() => {
    audioDispatch({ type: "SET_PROCESSING", payload: isTranscribing });
  }, [isTranscribing]);

  const checkAudioSupport = useMemo((): boolean => {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      window.MediaRecorder
    );
  }, []);

  const handleError = useCallback(
    (errorMessage: string) => {
      audioDispatch({ type: "SET_ERROR", payload: errorMessage });
      onError?.(errorMessage);
    },
    [onError]
  );

  const validateAudioSupport = useCallback((): boolean => {
    if (!checkAudioSupport) {
      const errorMessage = t(
        "components:chatInput.voiceRecording.unsupportedBrowser"
      );
      handleError(errorMessage);
      return false;
    }
    return true;
  }, [checkAudioSupport, t, handleError]);

  const requestMicrophonePermission =
    useCallback(async (): Promise<MediaStream | null> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1,
            sampleRate: 16000,
          },
        });
        return stream;
      } catch (error) {
        const mediaError = error as MediaRecorderError;
        let errorMessage = t(
          "components:chatInput.voiceRecording.microphoneError"
        );

        switch (mediaError.name) {
          case "NotAllowedError":
            errorMessage = t(
              "components:chatInput.voiceRecording.permissionDenied"
            );
            break;
          case "NotFoundError":
            errorMessage = t(
              "components:chatInput.voiceRecording.noMicrophone"
            );
            break;
          case "NotReadableError":
            errorMessage = t(
              "components:chatInput.voiceRecording.microphoneInUse"
            );
            break;
          default:
            errorMessage = t(
              "components:chatInput.voiceRecording.microphoneError"
            );
        }

        audioDispatch({ type: "SET_ERROR", payload: errorMessage });
        notificationsService.error(errorMessage);
        onError?.(errorMessage);
        return null;
      }
    }, [t, onError]);

  const startRecordingTimer = useCallback(() => {
    recordingIntervalRef.current = window.setInterval(() => {
      audioDispatch({ type: "UPDATE_DURATION", payload: Date.now() });
    }, 1000);
  }, []);

  const stopRecordingTimer = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  // Auto-stop recording when max duration is reached
  useEffect(() => {
    if (
      audioState.isRecording &&
      audioState.recordingDuration >= maxDuration
    ) {
      notificationsService.warn(
        t("components:chatInput.voiceRecording.maxDurationReached", {
          duration: maxDuration,
        })
      );
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.requestData();
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }, 50);
      }
    }
  }, [audioState.isRecording, audioState.recordingDuration, maxDuration, t]);

  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.style.position = "absolute";
    announcement.style.left = "-10000px";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  const startRecording = useCallback(async () => {
    audioDispatch({ type: "START_INITIALIZING" });

    if (!validateAudioSupport()) {
      audioDispatch({ type: "SET_ERROR", payload: "Audio not supported" });
      return;
    }

    try {
      const stream = await requestMicrophonePermission();
      if (!stream) {
        audioDispatch({
          type: "SET_ERROR",
          payload: "Microphone permission denied",
        });
        return;
      }

      streamRef.current = stream;
      audioChunksRef.current = [];
      const startTime = Date.now();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      let hasStartedRecording = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          if (!hasStartedRecording) {
            hasStartedRecording = true;
            audioDispatch({ type: "START_RECORDING", payload: startTime });
            startRecordingTimer();

            announceToScreenReader(
              t("components:chatInput.voiceRecording.recordingStarted")
            );
          }
        }
      };

      mediaRecorder.onstop = async () => {
        audioDispatch({ type: "STOP_RECORDING" });
        stopRecordingTimer();

        announceToScreenReader(
          t("components:chatInput.voiceRecording.recordingStopped")
        );

        if (isCancelledRef.current) {
          console.debug("Recording was canceled. Skipping transcription.");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });

        transcribeAudio({
          audioBlob,
          language: "auto",
          maxDuration,
        });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        const errorMessage = t(
          "components:chatInput.voiceRecording.recordingError"
        );
        audioDispatch({ type: "SET_ERROR", payload: errorMessage });
        stopRecordingTimer();
        onError?.(errorMessage);
      };

      mediaRecorder.start(250);
    } catch (error) {
      console.error("Failed to start recording:", error);
      const errorMessage = t("components:chatInput.voiceRecording.startError");
      audioDispatch({ type: "SET_ERROR", payload: errorMessage });
      onError?.(errorMessage);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [
    validateAudioSupport,
    requestMicrophonePermission,
    startRecordingTimer,
    stopRecordingTimer,
    transcribeAudio,
    maxDuration,
    onError,
    announceToScreenReader,
    t,
  ]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && audioState.isRecording) {
      mediaRecorderRef.current.requestData();

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 50);
    }
  }, [audioState.isRecording]);

  const handleToggleRecording = useCallback(async () => {
    if (audioState.isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [audioState.isRecording, stopRecording, startRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && audioState.isRecording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    stopRecordingTimer();
    audioChunksRef.current = [];
    resetTranscription();
    audioDispatch({ type: "CANCEL_RECORDING" });

    announceToScreenReader(
      t("components:chatInput.voiceRecording.recordingCancelled")
    );
    notificationsService.info(
      t("components:chatInput.voiceRecording.recordingCancelledNotification")
    );
  }, [audioState.isRecording, stopRecordingTimer, resetTranscription, t]);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    audioChunksRef.current = [];
    resetTranscription();
    audioDispatch({ type: "RESET" });
  }, [resetTranscription]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    audioState,
    startRecording,
    stopRecording,
    cancelRecording,
    handleToggleRecording,
    cleanup,
    checkAudioSupport: () => checkAudioSupport,
    currentStream: streamRef.current,
  };
};
