import axiosInstance from "./axiosInstance";
import { AxiosError } from "axios";

export interface TranscriptionRequest {
  audioBlob: Blob;
  language?: string;
  maxDuration?: number;
}

export interface TranscriptionResponse {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

export class VoiceTranscriptionService {
  // Production API endpoint
  private static readonly TRANSCRIPTION_ENDPOINT = "/voice/transcribe";

  /**
   * Transcribe audio blob to text using production API
   */
  static async transcribeAudio(
    request: TranscriptionRequest
  ): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append("audio", request.audioBlob, "recording.webm");

    if (request.language) {
      formData.append("language", request.language);
    }

    if (request.maxDuration) {
      formData.append("maxDuration", request.maxDuration.toString());
    }

    try {
      const response = await axiosInstance.post<TranscriptionResponse>(
        this.TRANSCRIPTION_ENDPOINT,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000, // 60 second timeout for transcription
        }
      );

      return response.data;
    } catch (error) {
      // Enhanced error handling with proper typing
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 413) {
        throw new Error(
          "Audio file too large. Please record a shorter message."
        );
      } else if (axiosError.response?.status === 415) {
        throw new Error("Audio format not supported. Please try again.");
      } else if (axiosError.response?.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment and try again."
        );
      } else if (axiosError.code === "ECONNABORTED") {
        throw new Error(
          "Transcription timeout. Please try with a shorter recording."
        );
      } else {
        // Preserve original error message if available, similar to other services
        const errorMessage =
          (axiosError.response?.data as any)?.message ||
          axiosError.message ||
          "Failed to transcribe audio. Please try again.";
        throw new Error(errorMessage);
      }
    }
  }
}

export const voiceTranscriptionService = VoiceTranscriptionService;
