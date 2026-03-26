import React, { useRef, useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import Tooltip from "../Global/Tooltip";
import {
  TbVolume,
  TbPlayerPause,
  TbPlayerStop,
  TbPlayerPlay,
} from "react-icons/tb";
import axiosInstance from "../../services/axiosInstance";
import { useTranslation } from "react-i18next";
import { notificationsService } from "../../services/notificationsService";
import removeMd from "remove-markdown";

interface TextToSpeechControlsProps {
  text: string;
}

const TextToSpeechControls: React.FC<TextToSpeechControlsProps> = ({
  text,
}) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanupAudio = () => {
    if (audioRef.current) {
      // Remove event listeners
      audioRef.current.removeEventListener("ended", cleanupAudio);
      audioRef.current.removeEventListener("error", cleanupAudio);
      // Stop any ongoing playback
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
  };

  const streamTextToSpeech = async (text: string) => {
    try {
      // If already playing, handle pause/resume
      if (audioRef.current) {
        if (isPaused) {
          audioRef.current.play();
          setIsPaused(false);
          setIsPlaying(true);
        } else {
          audioRef.current.pause();
          setIsPaused(true);
          setIsPlaying(true);
        }
        return;
      }

      if (!text.trim()) {
        notificationsService.error(
          t("dsb-chat:textToSpeech.errors.emptyText") ||
            "Cannot read empty text"
        );
        return;
      }

      setIsLoading(true);
      setIsPlaying(false);
      setIsPaused(false);

      // Convert markdown to plain text for better TTS experience
      const plainText = removeMd(text);

      if (!plainText.trim()) {
        notificationsService.error(
          t("dsb-chat:textToSpeech.errors.emptyText") ||
            "Cannot read empty text"
        );
        setIsLoading(false);
        return;
      }

      let content = btoa(unescape(encodeURIComponent(plainText)));

      const response = await axiosInstance({
        method: "post",
        url: "/Chat/speech/synthesize",
        data: { text: content },
        responseType: "arraybuffer",
        headers: {
          Accept: "audio/mpeg",
        },
      });

      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Add event listeners
      const handleEnded = () => {
        cleanupAudio();
      };
      const handleError = (e: ErrorEvent) => {
        console.error("Audio playback error:", e);
        notificationsService.error(
          t("dsb-chat:textToSpeech.errors.playbackError") ||
            "Error playing audio"
        );
        cleanupAudio();
      };

      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);

      setIsLoading(false);
      setIsPlaying(true);
      await audio.play().catch((error) => {
        console.error("Audio play error:", error);
        notificationsService.error(
          t("dsb-chat:textToSpeech.errors.playbackError") ||
            "Error playing audio"
        );
        cleanupAudio();
      });
    } catch (error: any) {
      console.error("Error converting text to speech:", error);
      setIsLoading(false);
      cleanupAudio();

      if (error.response?.status === 413) {
        notificationsService.error(
          t("dsb-chat:textToSpeech.errors.textTooLong") ||
            "Text is too long to convert to speech"
        );
      } else if (error.response?.status === 429) {
        notificationsService.error(
          t("dsb-chat:textToSpeech.errors.tooManyRequests") ||
            "Too many requests. Please try again later"
        );
      } else if (error.response?.data) {
        const errorMessage = new TextDecoder().decode(error.response.data);
        notificationsService.error(
          errorMessage ||
            t("dsb-chat:textToSpeech.errors.conversionError") ||
            "Error converting text to speech"
        );
      } else {
        notificationsService.error(
          t("dsb-chat:textToSpeech.errors.generalError") ||
            "An error occurred. Please try again"
        );
      }
    }
  };

  const handleStop = () => {
    cleanupAudio();
  };

  // Cleanup on component unmount or when text changes
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [text]); // Add text as dependency to cleanup when text changes

  return (
    <div
      className={`inline-flex bg-transparent hover:bg-gray-400 text-white-100 hover:text-superwhite items-center transition-all duration-75 ease-in-out text-white ${
        isPlaying
          ? "bg-gray-600 rounded-lg w-[4.5rem] h-8"
          : "rounded-lg w-8 h-8"
      }`}
    >
      <div className="relative flex items-center w-full">
        {/* Main control button */}
        <Tooltip
          text={
            isLoading
              ? t("dsb-chat:textToSpeech.tooltips.loading")
              : isPaused
              ? t("dsb-chat:textToSpeech.tooltips.resume")
              : isPlaying
              ? t("dsb-chat:textToSpeech.tooltips.pause")
              : t("dsb-chat:textToSpeech.tooltips.readAloud")
          }
          useMui
        >
          <button
            aria-label={
              isPaused ? "Resume" : isPlaying ? "Pause" : "Read aloud"
            }
            className={`group flex items-center justify-center ${
              isPlaying
                ? "w-[2.25rem] h-8 rounded-l-full border-r border-gray-500"
                : "w-8 h-8 rounded-lg"
            } ${isLoading ? "cursor-wait" : "hover:bg-gray-500"}`}
            onClick={() => streamTextToSpeech(text)}
            disabled={isLoading}
          >
            <div className="relative flex items-center justify-center">
              {isLoading ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <>
                  <TbVolume
                    size={18}
                    className={`${
                      !isPlaying ? "opacity-100" : "opacity-0 absolute"
                    }`}
                  />
                  <TbPlayerPause
                    size={18}
                    className={`${
                      isPlaying && !isPaused
                        ? "opacity-100"
                        : "opacity-0 absolute"
                    }`}
                  />
                  <TbPlayerPlay
                    size={18}
                    className={`${
                      isPlaying && isPaused
                        ? "opacity-100"
                        : "opacity-0 absolute"
                    }`}
                  />
                </>
              )}
            </div>
          </button>
        </Tooltip>

        {/* Stop button - appears with animation */}
        <div className={`overflow-hidden ${isPlaying ? "w-[2.25rem]" : "w-0"}`}>
          <Tooltip text={t("dsb-chat:textToSpeech.tooltips.stop")} useMui>
            <button
              aria-label={t("dsb-chat:textToSpeech.tooltips.stop")}
              className="group w-[2.25rem] h-8 rounded-r-full flex items-center justify-center hover:bg-gray-500"
              onClick={handleStop}
            >
              <TbPlayerStop size={18} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeechControls;
