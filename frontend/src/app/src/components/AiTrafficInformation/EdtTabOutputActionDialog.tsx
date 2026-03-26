import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ModalContainer from "../Global/ModalContainer";
import { TbChevronLeft, TbChevronRight, TbEye, TbEdit } from "react-icons/tb";
import { FaArrowRotateRight } from "react-icons/fa6";
import { TabKey } from "../../types/trafficInformation";
import ChatLoadingSkeleton from "./ChatLoadingSkeleton";
import { useMarkdownProcessor } from "../../hooks/useMarkdownProcessor";
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";
import "../../tailwind.css";

type EdtTabOutputActionDialogProps = {
  open: boolean;
  title: string;
  initialContent?: string;
  activeTab?: TabKey;
  currentLanguage?: "Danish" | "English";
  regeneratedContents: string[];
  isRegenerating?: boolean;
  cancelBtn: string;
  confirmBtn: string;
  onCancel: () => void;
  onConfirm: (
    updatedContent: string,
    tab?: TabKey,
    language?: "Danish" | "English",
    editingIndex?: number
  ) => void;
  onRegenerate: (tab?: TabKey, language?: "Danish" | "English") => void;
  onClose: () => void;
};

const EdtTabOutputActionDialog = ({
  open,
  title,
  initialContent,
  activeTab,
  currentLanguage,
  regeneratedContents,
  isRegenerating = false,
  cancelBtn,
  confirmBtn,
  onCancel,
  onConfirm,
  onRegenerate,
  onClose,
}: EdtTabOutputActionDialogProps) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  // The memory already includes the current content as the first item
  // So we just use regeneratedContents directly
  const allContents = regeneratedContents;
  const totalCount = allContents.length;

  // Process markdown for display mode
  const { processedContent } = useMarkdownProcessor(editedContent);

  // Initialize the Toast UI Editor instance
  useEffect(() => {
    if (editorRef.current && !editorInstanceRef.current) {
      editorInstanceRef.current = new Editor({
        el: editorRef.current,
        height: "400px",
        theme: "dark",
        initialEditType: "wysiwyg",
        hideModeSwitch: true,
        usageStatistics: false,
        toolbarItems: [
          ["heading", "bold", "italic"],
          ["quote"],
          ["ul", "ol"],
          ["link"],
        ],
        initialValue: editedContent,
      });
    }

    return () => {
      // Cleanup on unmount
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [editedContent]);

  // Initialize with the first item in memory (which should be the current content)
  useEffect(() => {
    if (open && allContents.length > 0) {
      setEditedContent(allContents[0]); // First item should be current content
      setCurrentIndex(0);
    } else if (open && initialContent) {
      // Fallback if memory is empty but we have initial content
      setEditedContent(initialContent);
      setCurrentIndex(0);
    } else if (open) {
      setEditedContent("");
      setCurrentIndex(0);
    }
  }, [open, allContents, initialContent]);

  // Update the edited content when the current index changes
  useEffect(() => {
    if (
      allContents.length > 0 &&
      currentIndex >= 0 &&
      currentIndex < allContents.length
    ) {
      setEditedContent(allContents[currentIndex] || "");
    }
  }, [currentIndex, allContents]);

  // Set current index to match the currently displayed content (on modal open)
  useEffect(() => {
    if (!open) return; // Only run when modal is actually open

    console.log(
      "🔄 [EdtTabOutputActionDialog] Modal opened or content changed:",
      {
        length: regeneratedContents.length,
        initialContent: initialContent?.substring(0, 50) + "...",
        contents: regeneratedContents.map((content, idx) => ({
          index: idx,
          preview: content.substring(0, 50) + "...",
          length: content.length,
        })),
      }
    );

    if (regeneratedContents.length > 0 && initialContent) {
      // Find which memory entry matches the currently displayed content
      const matchingIndex = regeneratedContents.findIndex(
        (content) => content === initialContent
      );

      if (matchingIndex !== -1) {
        // Found exact match - set index to the matching content
        console.log(
          "🔄 [EdtTabOutputActionDialog] Found matching content at index:",
          matchingIndex
        );
        setCurrentIndex(matchingIndex);
      } else {
        // No exact match found - default to last item (most recent)
        const newIndex = regeneratedContents.length - 1;
        console.log(
          "🔄 [EdtTabOutputActionDialog] No match found, setting to last index:",
          newIndex
        );
        setCurrentIndex(newIndex);
      }
    } else if (regeneratedContents.length > 0) {
      // No initial content provided - default to last item
      const newIndex = regeneratedContents.length - 1;
      console.log(
        "🔄 [EdtTabOutputActionDialog] No initial content, setting to last index:",
        newIndex
      );
      setCurrentIndex(newIndex);
    }
  }, [open, regeneratedContents, initialContent]);

  // Jump to newest content when regeneration just finished
  const [wasRegenerating, setWasRegenerating] = useState(false);

  useEffect(() => {
    // Track regeneration state changes
    if (isRegenerating && !wasRegenerating) {
      // Just started regenerating
      setWasRegenerating(true);
    } else if (!isRegenerating && wasRegenerating) {
      // Just finished regenerating - jump to newest content
      setWasRegenerating(false);

      if (regeneratedContents.length > 0) {
        const lastIndex = regeneratedContents.length - 1;
        console.log(
          "🔄 [EdtTabOutputActionDialog] Regeneration finished, jumping to newest content at index:",
          lastIndex
        );
        setCurrentIndex(lastIndex);
      }
    }
  }, [isRegenerating, wasRegenerating, regeneratedContents.length]);

  // Handle navigation between regenerated contents
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  // Handle content editing
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  // Toggle between WYSIWYG and Preview mode
  const togglePreviewMode = () => {
    if (!editorInstanceRef.current) return;
    if (isPreviewMode) {
      editorInstanceRef.current.changeMode("wysiwyg", true);
    } else {
      editorInstanceRef.current.changeMode("markdown", true);
    }
    setIsPreviewMode(!isPreviewMode);
  };

  // Save the editor's HTML content
  const handleSave = () => {
    if (!editorInstanceRef.current) return;
    const markdownContent = editorInstanceRef.current.getMarkdown();
    onConfirm(markdownContent, activeTab, currentLanguage, currentIndex);
  };
  return (
    <>
      <ModalContainer
        open={open}
        title={title}
        onClose={onClose}
        width="max-w-lg"
      >
        <div className="py-2 w-full flex flex-col h-auto border-none outline-none">
          {/* Toast UI Editor */}
          <div className="rounded-2xl" ref={editorRef} />{" "}
          {/* Attach the editor to this container */}
          {/* Controls below textarea */}
          <div className="flex w-full flex-wrap sm:flex-nowrap gap-3 sm:gap-0 justify-between items-center mt-2">
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                className={`text-white-100  ${
                  currentIndex === 0
                    ? "opacity-20 cursor-not-allowed"
                    : "hover:underline"
                }`}
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <TbChevronLeft size={20} />
              </button>
              <span className="text-white-100 text-sm mb-0">
                {currentIndex + 1} / {totalCount}
              </span>
              <button
                className={`text-white-100 ${
                  currentIndex === totalCount - 1
                    ? "opacity-20 cursor-not-allowed"
                    : "hover:underline"
                }`}
                onClick={handleNext}
                disabled={currentIndex === totalCount - 1}
              >
                <TbChevronRight size={20} />
              </button>
            </div>

            <div className="flex gap-3 ml-auto mr-0 flex-wrap sm:flex-nowrap mt-1">
              {/* Preview Button */}
              <button
                aria-label={
                  isPreviewMode
                    ? t("traffic-information:returnToEditor")
                    : "Markdown"
                }
                onClick={togglePreviewMode}
                className="inline-flex order-2 text-sm items-center gap-2 rounded-full px-4 py-2 font-medium font-body bg-gray-400 text-white-100 hover:bg-gray-750 hover:text-white-100 focus:bg-gray-650 focus:text-white-100"
                disabled={isRegenerating}
              >
                <TbEye size={20} strokeWidth={1.6} />
                <span>
                  {isPreviewMode
                    ? t("traffic-information:returnToEditor")
                    : "Markdown"}
                </span>
              </button>

              {/* Regenerate Button */}
              <button
                aria-label={
                  isRegenerating
                    ? t("traffic-information:generating")
                    : t(
                        "traffic-information:editTabOutputActionDialog.regenerateBtn"
                      )
                }
                className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium font-body text-sm ${
                  isRegenerating
                    ? "bg-gray-650 text-gray-400 cursor-not-allowed rounded-full"
                    : "bg-gray-400 text-white-100 hover:bg-gray-750 hover:text-white-100 focus:bg-gray-650 focus:text-white-100"
                }`}
                onClick={() => onRegenerate(activeTab, currentLanguage)}
                disabled={isRegenerating}
              >
                <FaArrowRotateRight
                  className={isRegenerating ? "animate-spin" : ""}
                />
                {isRegenerating
                  ? t("traffic-information:generating")
                  : t(
                      "traffic-information:editTabOutputActionDialog.regenerateBtn"
                    )}
              </button>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex w-full justify-end pt-2 place-content-center gap-4 mt-6">
            <button
              aria-label={cancelBtn}
              className="flex place-content-center place-items-center rounded-full px-3 py-2 text-[14px] border-2 border-gray-350 font-medium bg-gray-600 text-white-100 hover:bg-gray-400 hover:text-superwhite
              focus:bg-gray-650 focus:text-white-100 font-body"
              onClick={onCancel}
            >
              {cancelBtn}
            </button>
            <button
              aria-label={confirmBtn}
              className="text-gray-700 hover:text-white-100 !text-md font-body flex place-content-center place-items-center rounded-full px-3 py-2 text-[14px] bg-white-100 hover:bg-red-700 font-semibold transition-color duration-300 ease-in-out"
              onClick={handleSave}
            >
              {confirmBtn}
            </button>
          </div>
        </div>
      </ModalContainer>
    </>
  );
};

export default EdtTabOutputActionDialog;
