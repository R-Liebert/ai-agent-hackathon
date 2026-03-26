import React, { useCallback, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { ChatModel } from "../../models/chat-model";
import { StyledPopover } from "../StyledPopover";
import Tooltip from "../Global/Tooltip";
import {
  getModelSupportsFiles,
  getModelSupportsDocuments,
  getModelSupportsImages,
} from "../../models/models-config";
import { TbLayoutGrid } from "react-icons/tb";

interface ModelSelectorProps {
  models: ChatModel[];
  selectedValue: string;
  onChange: (value: string) => void;
  isModelSelectable?: boolean;
  hasAttachedFiles?: boolean;
  hasUnsentDocumentAttachments?: boolean;
  conversationHasDocuments?: boolean;
  conversationHasImages?: boolean;
  isLoading?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedValue,
  onChange,
  isModelSelectable = true,
  hasAttachedFiles = false,
  hasUnsentDocumentAttachments = false,
  conversationHasDocuments = false,
  conversationHasImages = false,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 664);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 664);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup the event listener when component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleClose = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const handleModelChange = (value: string) => {
    onChange(value);
    setDropdownOpen(false); // Close dropdown on selection
  };

  const isDisabled = !isModelSelectable;

  // Loading animation component
  const LoadingAnimation = () => (
    <div className="relative flex items-center">
      <div className="animate-pulse flex">
        <div className="ml-1 text-gray-100">
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <span className="ml-2 text-gray-300 text-sm">Loading models...</span>
      </div>
    </div>
  );

  const sidebarLinks = [
    {
      url: "/applications",
      label: "All Applications",
      icon: <TbLayoutGrid fontSize={24} />,
    },
  ];

  const selectedModel = models.find((model) => model.key === selectedValue);
  const selectedModelName = selectedModel ? selectedModel.name : "Select Model";
  return (
    <div className="relative h-full z-20">
      <button
        onClick={toggleDropdown}
        ref={anchorRef}
        id="model-selector-button"
        aria-label="Choose Model Option"
        disabled={isDisabled}
        className={`flex items-center justify-start hover:bg-gray-400 ${
          isDropdownOpen ? "bg-gray-400" : "bg-gray-800"
        } ${
          isDisabled
            ? "cursor-not-allowed !text-neutral-500 !bg-neutral-800"
            : ""
        } transform transition-transform text-white-100 pl-3 pr-2 pt-0 pt-[4px] pb-[6px] mt-[3px] font-semibold rounded-lg text-md duration-200 ease-out
        group`}
      >
        {isLoading ? (
          <LoadingAnimation />
        ) : (
          <>
            {selectedModelName}
            <div
              className={`mt-1 hover:text-white-100 ml-1 transform transition-transform duration-200 ${
                isDropdownOpen
                  ? "rotate-180 text-white-100"
                  : "rotate-0 text-gray-300"
              } `}
            >
              <FiChevronDown strokeWidth={2} />
            </div>

            {isDisabled && (
              <Tooltip
                text={"Model selection is not available"}
                position="top-14 left-0"
              />
            )}
          </>
        )}
      </button>

      {isDropdownOpen && (
        <StyledPopover
          open={isDropdownOpen}
          onClose={handleClose}
          anchorEl={anchorRef.current}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          topMargin={8}
          disableScrollLock={true}
        >
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="flex flex-col items-center space-y-3">
                <svg
                  className="animate-spin h-8 w-8 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-gray-300">Loading AI models...</p>
              </div>
            </div>
          ) : (
            models.map((model) => {
              const supportsFiles = getModelSupportsFiles(model.key);
              const isDisabledWithFiles = hasAttachedFiles && !supportsFiles;
              const isDisabledWithUnsentDocs =
                hasUnsentDocumentAttachments &&
                !getModelSupportsDocuments(model.key);
              const isDisabledWithConvDocs =
                conversationHasDocuments &&
                !getModelSupportsDocuments(model.key);
              const isDisabledWithConvImages =
                conversationHasImages && !getModelSupportsImages(model.key);

              return (
                <div
                  key={model.key}
                  className={`flex py-[6px] px-3 ${
                    isDisabledWithFiles ||
                    isDisabledWithUnsentDocs ||
                    isDisabledWithConvDocs ||
                    isDisabledWithConvImages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-450 active:bg-gray-450 focus:bg-gray-450 cursor-pointer"
                  } rounded-xl place-items-center justify-between`}
                  onClick={() => {
                    if (
                      !isDisabledWithFiles &&
                      !isDisabledWithUnsentDocs &&
                      !isDisabledWithConvDocs &&
                      !isDisabledWithConvImages
                    ) {
                      handleModelChange(model.key);
                    }
                  }}
                >
                  <div className="flex flex-col flex-start mr-auto grow w-[16em]">
                    <div className="font-semibold">{model.name}</div>
                    <div className="text-white-200/70 text-[12.4px] font-body">
                      {isDisabledWithFiles
                        ? t(
                            "components:modelSelector.notAvailableWithAttachments"
                          )
                        : isDisabledWithUnsentDocs
                        ? t(
                            "components:modelSelector.notAvailableWithUnsentDocuments"
                          )
                        : isDisabledWithConvDocs
                        ? t(
                            "components:modelSelector.notAvailableConversationDocuments"
                          )
                        : isDisabledWithConvImages
                        ? t(
                            "components:modelSelector.notAvailableConversationImages"
                          )
                        : model.description}
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full flex place-items-center ml-6 flex-none ${
                      selectedValue === model.key
                        ? "bg-white-200"
                        : "border-2 border-white"
                    }`}
                  >
                    {selectedValue === model.key && (
                      <div className="w-3 h-3 rounded-full bg-gray-200 flex justify-center items-center mx-auto">
                        <FiCheck strokeWidth={4} color="#212121" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </StyledPopover>
      )}
    </div>
  );
};

export default ModelSelector;
