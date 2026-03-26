import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { notificationsService } from "../services/notificationsService";
import {
  voiceTranscriptionService,
  TranscriptionRequest,
  TranscriptionResponse,
} from "../services/voiceTranscriptionService";

interface UseVoiceTranscriptionOptions {
  onSuccess?: (result: TranscriptionResponse) => void;
  onError?: (error: string) => void;
  enableRetry?: boolean;
}

export const useVoiceTranscription = (
  options: UseVoiceTranscriptionOptions = {}
) => {
  const { onSuccess, onError, enableRetry = true } = options;
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: async (
      request: TranscriptionRequest
    ): Promise<TranscriptionResponse> => {
      return voiceTranscriptionService.transcribeAudio(request);
    },

    // Retry configuration
    retry: enableRetry ? 2 : false,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff

    onSuccess: (data: TranscriptionResponse) => {
      if (data.text.trim()) {
        onSuccess?.(data);
      } else {
        notificationsService.warn(
          t("components:chatInput.voiceRecording.noSpeechDetected")
        );
      }
    },

    onError: (error: Error) => {
      console.error("Transcription error:", error);
      const errorMessage =
        error.message ||
        t("components:chatInput.voiceRecording.transcriptionError");

      onError?.(errorMessage);
      notificationsService.error(errorMessage);
    },

    // Mutation options
    mutationKey: ["voice-transcription"],
  });

  return {
    transcribeAudio: mutation.mutate,
    transcribeAudioAsync: mutation.mutateAsync,
    isTranscribing: mutation.isPending,
    transcriptionError: mutation.error,
    reset: mutation.reset,
    // Expose the full mutation for advanced use cases
    mutation,
  };
};
