export interface AudioRecordingState {
  isRecording: boolean;
  isProcessingAudio: boolean;
  isInitializing: boolean;
  audioError: string | null;
  recordingDuration: number;
  startTime: number | null;
  isCancelled: boolean;
}

export interface MediaRecorderError extends Error {
  code?: number;
  constraint?: string;
}

export interface AudioTranscriptionService {
  transcribeAudio: (audioBlob: Blob) => Promise<string>;
}

// New types for React Query integration
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

export type AudioAction =
  | { type: "START_INITIALIZING" }
  | { type: "START_RECORDING"; payload: number }
  | { type: "STOP_RECORDING" }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_DURATION"; payload: number }
  | { type: "RESET" }
  | { type: "CANCEL_RECORDING" };

export interface VoiceRecorderConfig {
  maxDuration?: number; // in seconds, default 60
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface VoiceRecorderHookReturn {
  audioState: AudioRecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  handleToggleRecording: () => Promise<void>;
  cleanup: () => void;
  checkAudioSupport: () => boolean;
  cancelRecording: () => void;
  /** The active MediaStream (for volume analysis). Null when not recording. */
  currentStream: MediaStream | null;
}
