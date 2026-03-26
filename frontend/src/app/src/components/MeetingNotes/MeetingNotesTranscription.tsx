import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import MeetingNotesOutputLanguage from "./MeetingNotesOutputLanguage";

interface MeetingTranscriptionProps {
  language: string;
  handleChange: (
    event: React.MouseEvent<HTMLElement>,
    value: string | null
  ) => void;
  inputText: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  tokenCount: number;
  handleStartStreams: () => void;
  contentData: string;
  isDesktop: boolean;
  display: boolean;
  isStreaming: boolean;
}

const MeetingTranscription: React.FC<MeetingTranscriptionProps> = ({
  language,
  handleChange,
  inputText,
  handleInputChange,
  tokenCount,
  handleStartStreams,
  contentData,
  isDesktop,
  display,
  isStreaming,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`${
        !isDesktop && (display || isStreaming)
          ? "hidden opacity-0"
          : "flex opacity-1"
      } w-full md:!w-[44%] xxl:!w-[42%] flex flex-col lg:mb-0 md:mb-4 mb-2`}
    >
      <div className="flex flex-col h-full flex-grow md:mb-6 mb-2 p-0">
        <MeetingNotesOutputLanguage
          language={language}
          handleChange={handleChange}
        />
        {/*Meeting Transcription*/}
        <div className="flex flex-col gap-4 h-full xxl:mb-6 md:mb-2 mb-4">
          <label className="relative font-body text-md w-full text-white-100 group">
            {t(
              "meeting-note-generator:chatDialogueBox.pasteTranscription.label"
            )}
          </label>
          <div className="flex flex-col h-full">
            <textarea
              value={inputText}
              onChange={handleInputChange}
              className="w-full h-full lg:min-h-[8em] min-h-[42vh] md:min-h-[17.7em] border-2 !border-gray-500 rounded-2xl p-4 font-body text-md text-white-100 outline-none bg-transparent resize-none focus:!border-white-100 placeholder-gray-300"
              placeholder={t(
                "meeting-note-generator:chatDialogueBox.pasteTranscription.placeholder"
              )}
              id="transcription"
            />
            <div className="text-sm mt-2 text-gray-300 font-body font-medium">
              {t(
                "meeting-note-generator:chatDialogueBox.pasteTranscription.tokenCount"
              )}
              <span className={`${tokenCount > 128000 ? "text-red-500" : ""}`}>
                {" "}
                {tokenCount}
              </span>{" "}
              / 128000
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={handleStartStreams}
        aria-label={t("meeting-note-generator:buttons.generate")}
        className={`${
          tokenCount <= 0 ? "cursor-not-allowed" : "cursor-pointer"
        } rounded-full w-full bg-white-200 text-gray-700 !font-body py-4 font-semibold flex items-center justify-center hover:bg-red-600 hover:text-white-100 transition-color duration-300 ease-out`}
        disabled={tokenCount <= 0}
      >
        {!contentData
          ? t("meeting-note-generator:buttons.generate")
          : t("meeting-note-generator:buttons.reGenerate")}
      </button>
    </div>
  );
};

export default MeetingTranscription;
