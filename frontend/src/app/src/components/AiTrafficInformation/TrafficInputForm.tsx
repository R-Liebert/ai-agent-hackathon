import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbArrowUp, TbSettingsSpark, TbX, TbCheck } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";
import { useMsal } from "@azure/msal-react";
import Tooltip from "../Global/Tooltip";
import { useIsTrafficInformationAdmin } from "../../contexts/AuthProvider";
import { HiOutlinePencil } from "react-icons/hi";

import { getTransitionStyle } from "../../utils/navigation";
import useSidebarStore from "../../stores/navigationStore";

interface TrafficInputFormProps {
  inputText: string;
  setInputText: (text: string) => void;
  isGenerating: boolean;
  hasContent: boolean;
  onGenerate: (text?: string) => Promise<void>;
  onShowSettings: () => void;
  isLoadingPrompts: boolean;
  error: Error | null;
  clearError: () => void;
  clearAllTabMemory: () => void;
}

export const TrafficInputForm = React.memo<TrafficInputFormProps>(
  ({
    inputText,
    setInputText,
    isGenerating,
    hasContent,
    onGenerate,
    onShowSettings,
    isLoadingPrompts,
    error,
    clearError,
    clearAllTabMemory,
  }) => {
    const { t, i18n } = useTranslation();
    const { accounts } = useMsal();
    const isTrafficInformationAdmin = useIsTrafficInformationAdmin();
    const [isEditMode, setIsEditMode] = useState(false);
    const [editText, setEditText] = useState("");
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [inputHeight, setInputHeight] = useState(20);
    const { isSidebarOpen } = useSidebarStore();

    // Auto-adjust textarea height
    const adjustTextAreaHeight = () => {
      if (textAreaRef.current && (!hasContent || isEditMode)) {
        textAreaRef.current.style.height = "auto";
        textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        setInputHeight(textAreaRef.current.scrollHeight);
      }
    };

    useEffect(() => {
      adjustTextAreaHeight();
    }, [inputText, hasContent, isEditMode, editText]);

    useEffect(() => {
      if (hasContent && !isEditMode && textAreaRef.current) {
        textAreaRef.current.style.height = "";
      }
    }, [hasContent, isEditMode]);

    const handleEditMode = () => {
      setEditText(inputText);
      setIsEditMode(true);
    };

    const handleCancelEdit = () => {
      setEditText("");
      setIsEditMode(false);
    };

    const handleUpdateMessage = async () => {
      console.log("🔧 [TrafficInputForm] Updating message:", {
        originalText: inputText,
        editedText: editText,
        hasChanged: editText !== inputText,
        clearAllTabMemoryFunction: typeof clearAllTabMemory,
      });

      // Clear all tab memory since we're regenerating with new input
      if (clearAllTabMemory) {
        clearAllTabMemory();
        console.log("🗑️ [TrafficInputForm] Called clearAllTabMemory function");
      } else {
        console.warn(
          "⚠️ [TrafficInputForm] clearAllTabMemory function is not available"
        );
      }

      setInputText(editText); // Update the input text state immediately
      setIsEditMode(false);
      clearError();
      await onGenerate(editText); // Pass the text to ensure immediate use
    };

    const handleKeyDown = async (
      event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
      if (event.key === "Enter" && !event.shiftKey && !isGenerating) {
        event.preventDefault();

        if (isEditMode) {
          // In edit mode: Save the changes
          if (editText.trim()) {
            await handleUpdateMessage();
          }
        } else {
          // In normal mode: Generate content
          if (inputText.trim()) {
            await onGenerate();
          }
        }
      }
    };

    // Get user's first name
    const fullName = accounts[0]?.name || "";
    const firstName = fullName.split(" ")[0];
    const welcomeMessage = t("traffic-information:welcomeMessage");
    const description = t("traffic-information:description");

    const transitionStyle = getTransitionStyle(isSidebarOpen);

    const [messageHeight, setMessageHeight] = useState<number>(0);
    const messageRef = useRef<HTMLDivElement>(null);

    // Dynamically track height changes
    useEffect(() => {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setMessageHeight(entry.contentRect.height);
        }
      });

      if (messageRef.current) {
        observer.observe(messageRef.current);
      }

      return () => {
        if (messageRef.current) {
          observer.unobserve(messageRef.current);
        }
      };
    }, []);

    const paddingClass =
      messageHeight > 50 ? "py-[15px] px-[19px]" : "py-[6px] px-[16px]";
    return (
      <motion.div
        className={`flex flex-col items-center justify-center w-full max-w-3xl mx-auto ${
          hasContent ? "h-auto mb-6" : "h-[84%] mb-[8rem]"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Welcome Section */}
        <AnimatePresence mode="wait">
          {!hasContent && (
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-3xl">
                {firstName}, {description}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message container */}
        <div className="flex flex-col w-full">
          <div
            className={`flex flex-col ml-auto  ${
              hasContent && !isEditMode ? `max-w-[72.7%] flex-none ` : "w-full"
            }`}
          >
            {/* Input Section */}
            <div
              ref={messageRef}
              className={`flex flex-col w-full rounded-3xl h-auto ${
                isEditMode
                  ? "space-y-6 px-4 pb-1 bg-gray-600 items-end"
                  : hasContent && !isEditMode
                  ? `${paddingClass} bg-gray-600 ml-auto mr-0 mx-0 text-white-100  self-end items-end justify-end`
                  : "fixed w-[93vw] !mx-auto sm:w-full bottom-10 sm:bottom-0  left-1/2 -translate-x-1/2 sm:relative bg-gray-600 px-3"
              }`}
            >
              {/* Text Input or Display */}
              {hasContent && !isEditMode ? (
                <div className="whitespace-pre-wrap w-full font-body text-white-100">
                  {inputText}
                </div>
              ) : (
                <textarea
                  ref={textAreaRef}
                  value={isEditMode ? editText : inputText}
                  onChange={(e) => {
                    if (isEditMode) {
                      setEditText(e.target.value);
                      adjustTextAreaHeight();
                    } else {
                      setInputText(e.target.value);
                      adjustTextAreaHeight();
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                  placeholder={
                    t("traffic-information:inputPlaceholder") ||
                    "Enter your BOS data here..."
                  }
                  className="w-full outline-none font-body placeholder:text-gray-300 text-white-100 placeholder-gray-300 bg-transparent focus:outline-none focus:text-white-100 resize-none pl-2 pr-6 mt-4 mb-3 max-h-[30rem]"
                  rows={1}
                  aria-label={
                    isEditMode
                      ? "Edit traffic information message"
                      : "Enter traffic information"
                  }
                  aria-describedby={error ? "error-message" : undefined}
                />
              )}

              {/* Icons Row */}
              <div
                className={`flex justify-between items-center w-full ${
                  hasContent && !isEditMode ? "pb-0" : "pb-3"
                }`}
              >
                {/* Left side - Settings button */}
                <div className="pl-1 flex items-center gap-2">
                  {!hasContent && !isEditMode && isTrafficInformationAdmin && (
                    <div className="flex items-start">
                      <button
                        type="button"
                        onClick={onShowSettings}
                        disabled={isLoadingPrompts}
                        className="flex font-body items-center gap-1.5 pl-3 pr-4 py-1.5 border rounded-full transition-colors duration-200 bg-transparent hover:bg-gray-500 border-gray-400 text-white-100 cursor-pointer"
                      >
                        <TbSettingsSpark
                          size={22}
                          color="white"
                          strokeWidth={1.4}
                        />
                        <span className="text-sm text-white-100 capitalize font-normal">
                          {t("traffic-information:inputForm.settingsBtn")}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right side - Send button or Edit mode buttons */}
                <div className="flex items-center gap-2">
                  {/* Send button */}
                  {!hasContent && !isEditMode && (
                    <button
                      className="cursor-pointer"
                      onClick={() => onGenerate()}
                      aria-label={
                        !inputText.trim()
                          ? "Generate disabled"
                          : "Generate content"
                      }
                      disabled={!inputText.trim()}
                    >
                      <div
                        className={`relative rounded-full p-[5.8px] ${
                          !inputText.trim()
                            ? "bg-gray-300 text-gray-800/70"
                            : "bg-white-200 text-gray-800"
                        }`}
                      >
                        <TbArrowUp strokeWidth={2.2} size={22} />
                        <Tooltip
                          text={
                            !inputText.trim()
                              ? "Enter text to generate"
                              : "Generate content"
                          }
                          position="-top-[3.5rem] -left-1"
                        />
                      </div>
                    </button>
                  )}

                  {/* Edit mode buttons => UPDATE THEM!!! */}
                  {isEditMode && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="flex place-content-center place-items-center rounded-full px-3 py-2 text-sm bg-gray-900 text-white-100 hover:bg-gray-950 hover:text-white-100 focus:bg-gray-950 focus:text-white-100 font-body transition-colors duration-300 ease-in-out"
                      >
                        {t("common:chatEditMessageButtons.cancel")}
                      </button>
                      <button
                        onClick={handleUpdateMessage}
                        disabled={!editText.trim()}
                        aria-label={
                          !editText.trim() ? "Update disabled" : "Send update"
                        }
                        className={`flex place-content-center place-items-center rounded-full px-3 py-2 text-sm font-body font-semibold transition-colors duration-300 ease-in-out ${
                          editText.trim() === ""
                            ? "bg-gray-400 text-gray-300 cursor-not-allowed opacity-50"
                            : "bg-white-200 hover:bg-red-700 text-gray-600 hover:text-white-100"
                        }`}
                      >
                        {t("common:chatEditMessageButtons.save")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Edit button for user message */}
            {hasContent && !isEditMode && (
              <Tooltip text="components:tooltips.edit" useMui>
                <button
                  aria-label={t("components:tooltips.edit")}
                  className="relative mt-2 ml-auto mr-0 h-8 w-8 bg-transparent text-white-100 hover:bg-gray-600 hover:text-superwhite rounded-lg flex items-center justify-center"
                  onClick={handleEditMode}
                >
                  <HiOutlinePencil size={18} />
                </button>
              </Tooltip>
            )}
          </div>
          {/* Error Display */}
          {error && (
            <div
              className={`fixed  z-[99] left-1/2 w-full ${
                isSidebarOpen
                  ? "ml-0 sm:ml-36 sm:max-w-md md:max-w-xl lg:max-w-3xl"
                  : "ml-0 sm:ml-7 sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
              } transition-all duration-[400ms] ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] transform -translate-x-1/2 bottom-[10rem] sm:bottom-14 w-[93vw] sm:w-[80vw] lg:w-full mx-auto py-3 px-6 font-semibold bg-gray-650 rounded-full text-red-300 text-md flex items-center`}
              role="alert"
              aria-live="assertive"
            >
              {error.message}
              <button
                onClick={clearError}
                className="ml-auto"
                style={{ color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#d1d5db")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
                aria-label="Dismiss error message"
              >
                <span className="text-red-300" aria-hidden="true">
                  ✕
                </span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);
