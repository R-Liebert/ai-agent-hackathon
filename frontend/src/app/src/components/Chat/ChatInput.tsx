import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useLayoutEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { workspacesService } from "../../services/workspacesService";
import { notificationsService } from "../../services/notificationsService";
import { filesService } from "../../services/filesService";
import { ChatFileMetadata } from "../../models/chat-message";
import {
  getModelSupportsTools,
  getModelSupportsDocuments,
  getModelSupportsImages,
} from "../../models/models-config";
import { FilePreview } from "./FilePreview";
import { SharePointFilePicker } from "../Workspaces/SharePointFilePicker";
import { FileWithSharePointMetadata } from "../../types/sharepoint-types";
import { IoWarning } from "react-icons/io5";
import PromptSettingsActionDialog from "../../components/AiTrafficInformation/PromptSettingsActionDialog";
import { TrafficInformationSettingsWrapper } from "./TrafficInformationSettingsWrapper";
import { useCanvas } from "../../hooks/useCanvas";
import { HiOutlineArrowsExpand } from "react-icons/hi";
import Tooltip from "../Global/Tooltip";
import AgentsButtonTab from "./ChatInputAgentsButton";
import ImageButtonTab from "./ChatInputImageButton";
import RightControlButtons from "./ChatInputRightControls";
import useAgentsStore from "../../stores/agentsStore";
import featureHighlightService from "../../services/featureHighlightService";
import { useMsal } from "@azure/msal-react";
import ToolsMenu, { ToolsMenuRef } from "./ChatInputToolsMenu";

// Define allowed file extensions
export const ALLOWED_FILE_EXTENSIONS = [
  ".c",
  ".cs",
  ".cpp",
  ".docx",
  ".html",
  ".java",
  ".json",
  ".md",
  ".pdf",
  ".php",
  ".pptx",
  ".py",
  ".rb",
  ".tex",
  ".txt",
  ".css",
  ".js",
  ".ts",
  ".csv",
  ".jpeg",
  ".jpg",
  ".gif",
  ".png",
  ".tar",
  ".xlsx",
  ".xml",
  ".zip",
];

// Maximum character limit for chat input
const MAX_CHARACTER_LIMIT = 50000;

// Simple debounce function
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// Derive document-only extensions by excluding image extensions from the full list
const ALLOWED_DOCUMENT_EXTENSIONS = ALLOWED_FILE_EXTENSIONS.filter(
  (ext) => !ALLOWED_IMAGE_EXTENSIONS.includes(ext)
);

const getEntrySourcePopupSessionKey = (
  entrySource?: string,
  entrySourcePopupKey?: string
): string | null => {
  if (!entrySource || !entrySourcePopupKey) return null;
  return `entry-source-popup-${entrySource}-${entrySourcePopupKey}`;
};

const hasSessionFlag = (key: string): boolean => {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
};

const setSessionFlag = (key: string): void => {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, "true");
  } catch {}
};

// Helper function to check if file extension is allowed (legacy check - not used for validation)
const isFileExtensionAllowed = (fileName: string): boolean => {
  const extension = `.${fileName.split(".").pop()?.toLowerCase()}`;
  return ALLOWED_FILE_EXTENSIONS.includes(extension);
};

// Helper function to check if file is an allowed image
const isImageExtensionAllowed = (fileName: string): boolean => {
  const extension = `.${fileName.split(".").pop()?.toLowerCase()}`;
  return ALLOWED_IMAGE_EXTENSIONS.includes(extension);
};

interface ChatInputProps {
  sendMessage: (
    inputValue: string,
    files?: ChatFileMetadata[],
    isEditing?: boolean,
    messageId?: string
  ) => Promise<void>;
  handleCloseStream?: () => void;
  isInputEnabled?: boolean;
  isLoading?: boolean;
  accentColor?: string;
  isAttachmentEnabled?: boolean;
  chatId?: string;
  resetFiles?: boolean;
  onResetComplete?: () => void;
  totalFileCount?: number;
  onTotalFileCountChange?: (count: number) => void;
  onImageGenerationChange?: (enabled: boolean) => void;
  chatType?: string;
  selectedModel?: string;
  moduleName?: string;
  activateWorkspacesList?: () => void;
  showWorkspacesList?: boolean;
  handleShowFullDialogue?: () => void;
  showExpandIcon?: boolean;
  onUnsentAttachmentsChange?: (summary: UnsentAttachmentsSummary) => void;
  placeholderText?: string;
  dropdownDirection?: "up" | "down";
  entrySource?: string;
  entrySourcePopupKey?: string;
}

// Export the ref type for parent components
export interface ChatInputRef {
  handleFilesUpload: (files: File[]) => Promise<void>;
  triggerUpload: () => void;
}

export interface UnsentAttachmentItemSummary {
  fileName: string;
  fileType: "Image" | "Document";
  extension?: string;
}

export interface UnsentAttachmentsSummary {
  hasDocuments: boolean;
  hasImages: boolean;
  counts: {
    documents: number;
    images: number;
    total: number;
  };
  files: UnsentAttachmentItemSummary[];
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  (
    {
      sendMessage,
      handleCloseStream,
      isInputEnabled = true,
      isLoading = false,
      accentColor,
      isAttachmentEnabled = false,
      chatId,
      resetFiles,
      onResetComplete,
      totalFileCount = 0,
      onTotalFileCountChange,
      onImageGenerationChange,
      chatType = "Normal",
      selectedModel,
      moduleName,
      activateWorkspacesList,
      showWorkspacesList,
      handleShowFullDialogue,
      showExpandIcon,
      onUnsentAttachmentsChange,
      placeholderText,
      dropdownDirection = "up",
      entrySource,
      entrySourcePopupKey,
    },
    ref
  ) => {
    const { showAgentList, agentsLoading, selectedAgent } = useAgentsStore();
    const { isCanvasMode } = useCanvas();
    const [inputValue, setInputValue] = useState("");
    const [files, setFiles] = useState<ChatFileMetadata[]>([]);
    const [fileTypes, setFileTypes] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(
      new Set()
    );
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [textAreaHeight, setTextAreaHeight] = useState(20);
    const [isDropupOpen, setIsDropupOpen] = useState(false);
    const dropupRef = useRef<HTMLDivElement>(null);
    const [isSharePointFilePickerOpen, setIsSharePointFilePickerOpen] =
      useState(false);
    const [isImageGeneration, setIsImageGeneration] = useState(false);
    const [isCharLimitExceeded, setIsCharLimitExceeded] = useState(false);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isLatchedExpanded, setIsLatchedExpanded] = useState(false);

    const { t } = useTranslation();
    const isExpanded =
      isLatchedExpanded ||
      isImageGeneration ||
      showAgentList ||
      files.length > 0;
    // Compute allowed extensions based on selected model and chat type
    const allowedExtensionsForModel = useMemo(() => {
      // If no model is selected, default to allowing both images and documents
      const supportsDocs = selectedModel
        ? getModelSupportsDocuments(selectedModel)
        : true;
      const supportsImages = selectedModel
        ? getModelSupportsImages(selectedModel)
        : true;

      const combined: string[] = [];
      if (supportsDocs) combined.push(...ALLOWED_DOCUMENT_EXTENSIONS);
      if (supportsImages) combined.push(...ALLOWED_IMAGE_EXTENSIONS);
      return combined;
    }, [selectedModel]);

    const isExtensionAllowedByModel = useCallback(
      (fileName: string) => {
        const extension = `.${fileName.split(".").pop()?.toLowerCase()}`;
        return allowedExtensionsForModel.includes(extension);
      },
      [allowedExtensionsForModel]
    );

    // Voice recording callbacks
    const handleTranscriptionComplete = useCallback(
      (transcribedText: string) => {
        setInputValue((prevValue) => {
          const newValue = prevValue
            ? `${prevValue} ${transcribedText}`
            : transcribedText;

          if (newValue.length > MAX_CHARACTER_LIMIT) {
            setIsCharLimitExceeded(true);
            notificationsService.warn(
              t("components:chatInput.characterLimitExceeded", {
                limit: MAX_CHARACTER_LIMIT.toLocaleString(),
              })
            );
          }

          return newValue;
        });
      },
      [t]
    );

    const handleVoiceRecordingError = useCallback((error: string) => {
      console.error("Voice recording error:", error);
    }, []);

    // Simple audio support check
    const checkAudioSupport = useCallback(() => {
      return !!(
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === "function" &&
        window.MediaRecorder
      );
    }, []);

    // Track audio state for send button logic
    const [audioState, setAudioState] = useState({
      isRecording: false,
      isProcessingAudio: false,
    });

    // Create a reference for the check function
    const checkCharacterLimitRef = useRef<any>(null);

    // Initialize the debounced function once on component mount
    useEffect(() => {
      checkCharacterLimitRef.current = debounce((value: string) => {
        setIsCharLimitExceeded(value.length > MAX_CHARACTER_LIMIT);
      }, 300);
    }, []);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setInputValue(newValue);

      // For immediate feedback on large inputs
      if (newValue.length > MAX_CHARACTER_LIMIT * 1.1) {
        setIsCharLimitExceeded(true);
      } else if (
        newValue.length < MAX_CHARACTER_LIMIT * 0.9 &&
        isCharLimitExceeded
      ) {
        setIsCharLimitExceeded(false);
      } else {
        // For values close to the limit, use debounced check
        checkCharacterLimitRef.current?.(newValue);
      }
    };

    // Handle pasting specifically to avoid flickering
    const handleTextPaste = (pastedText: string) => {
      const newLength = inputValue.length + pastedText.length;

      // If pasting would exceed limit, immediately show warning
      if (newLength > MAX_CHARACTER_LIMIT) {
        setIsCharLimitExceeded(true);
        notificationsService.warn(
          t("components:chatInput.characterLimitExceeded", {
            limit: MAX_CHARACTER_LIMIT.toLocaleString(),
          })
        );
      }
    };

    // Latch expanded layout using layout effect so it applies before paint
    useLayoutEffect(() => {
      const hasText = inputValue.trim().length > 0;
      const grewBeyondSingleLine = textAreaHeight > 30;

      if (!isLatchedExpanded && hasText && grewBeyondSingleLine) {
        setIsLatchedExpanded(true);
      }

      if (isLatchedExpanded && !hasText && files.length === 0) {
        setIsLatchedExpanded(false);
      }
    }, [inputValue, textAreaHeight, files.length, isLatchedExpanded]);

    useLayoutEffect(() => {
      // Adjust height when input changes, files change, or layout (expanded) changes
      adjustTextAreaHeight();
    }, [inputValue, files, isExpanded]);

    useEffect(() => {
      if (resetFiles) {
        setFiles([]);
        setFileTypes([]);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onResetComplete?.();
      }
    }, [resetFiles, onResetComplete]);

    const handleKeyDown = async (
      event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        inputValue.trim() &&
        !isLoading &&
        !isUploading &&
        !isCharLimitExceeded
      ) {
        event.preventDefault();
        try {
          const messageToSend = inputValue;
          setInputValue(""); // clear immediately for snappier UX
          await sendMessage(messageToSend, files || []);
          setFiles([]);
          setFileTypes([]);
          setIsImageGeneration(false);
          if (onImageGenerationChange) {
            onImageGenerationChange(false);
          }
        } catch (error) {
          console.error("Error sending chat message:", error);
          // If sending fails, optionally restore the input value (skipped for now)
        }
      }
    };

    const adjustTextAreaHeight = () => {
      if (textAreaRef.current) {
        textAreaRef.current.style.height = "auto";
        textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        setTextAreaHeight(textAreaRef.current.scrollHeight);
      }
    };

    // HANDLE PASTE FUNCTIONALITY

    // Convert HTML clipboard content to plain text
    const stripHtmlToText = (html: string): string => {
      try {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return (doc.body.textContent || "").replace(/\u00A0/g, " "); // normalize non-breaking spaces
      } catch {
        return html;
      }
    };

    // Very light-touch RTF-to-text fallback. We don't aim for perfect formatting; just remove control words.
    const stripRtfToText = (rtf: string): string => {
      return rtf
        .replace(/\\par[d]?/g, "\n") // paragraphs
        .replace(/\\'[0-9a-fA-F]{2}/g, "") // hex escapes
        .replace(/$$a-z]+\d*/gi, "") // control words with optional numeric params
        .replace(/[{}]/g, "") // group braces
        .trim();
    };

    const mimeToImageExtension = (type: string): string => {
      switch (type.toLowerCase()) {
        case "image/png":
          return "png";
        case "image/jpeg":
          return "jpeg";
        case "image/jpg":
          return "jpg";
        case "image/gif":
          return "gif";
        case "image/webp":
          return "webp";
        default:
          return "png";
      }
    };

    // Try to get image files from the clipboardData items, with a fallback to async clipboard read
    const getPastedImageFiles = async (
      event: React.ClipboardEvent<HTMLTextAreaElement>
    ): Promise<File[]> => {
      const files: File[] = [];

      const items = event.clipboardData?.items
        ? Array.from(event.clipboardData.items)
        : [];

      for (const item of items) {
        // Supported in Chromium-based browsers and Firefox in many cases
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      // Fallback: try async clipboard read if available and permitted (Edge/Chrome/Firefox modern)
      if (
        files.length === 0 &&
        navigator.clipboard &&
        "read" in navigator.clipboard
      ) {
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const cItem of clipboardItems) {
            for (const type of cItem.types) {
              if (type.startsWith("image/")) {
                const blob = await cItem.getType(type);
                const ext = mimeToImageExtension(type);
                const timestamp = new Date()
                  .toISOString()
                  .replace(/[:.]/g, "-");
                files.push(
                  new File([blob], `pasted-image-${timestamp}.${ext}`, { type })
                );
              }
            }
          }
        } catch (err) {
          // Permission denied or not supported; do nothing
          console.debug(
            "navigator.clipboard.read() failed or not permitted",
            err
          );
        }
      }

      return files;
    };

    const handlePaste = async (
      event: React.ClipboardEvent<HTMLTextAreaElement>
    ) => {
      if (isCharLimitExceeded) {
        return; // Do not process paste if character limit is already exceeded
      }

      const clipboardData = event.clipboardData;
      const plainText = clipboardData?.getData("text/plain") || "";
      let textCandidate = plainText.trim();

      // If plain text is empty, try HTML, then RTF
      if (!textCandidate) {
        const html = clipboardData?.getData("text/html") || "";
        if (html) {
          textCandidate = stripHtmlToText(html).trim();
        }
      }

      if (!textCandidate) {
        const rtf = clipboardData?.getData("text/rtf") || "";
        if (rtf) {
          textCandidate = stripRtfToText(rtf).trim();
        }
      }

      // Preserve your character-limit behavior for text paste
      handleTextPaste(textCandidate);

      // If any actual text content exists, treat this as a text paste and let the browser insert it.
      // This covers OneNote text and PowerPoint text frames reliably across browsers.
      if (textCandidate) {
        return; // Do not block default paste
      }

      // Else, no text found — try to treat it as image paste
      const imageFiles = await getPastedImageFiles(event);
      if (imageFiles.length === 0) {
        // Nothing we can process; let default behavior continue (which is a no-op for images in textarea)
        return;
      }

      // Respect attachment settings and limits
      if (!isAttachmentEnabled || totalFileCount >= 20) {
        // Optional: notify user about the limit or disabled attachments
        notificationsService.error(
          totalFileCount >= 20
            ? "Maximum file limit (20) reached"
            : t(
                "components:handlePasteModal.notifications.image.unsupportedModel"
              )
        );
        return;
      }

      // Prevent default so we don't insert anything into the textarea while attaching images
      event.preventDefault();

      // Normalize naming and extension for consistent validation and UX
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const normalizedFiles = imageFiles.map((file, idx) => {
        const ext = mimeToImageExtension(file.type);
        const name = `pasted-image-${timestamp}${idx ? `-${idx}` : ""}.${ext}`;
        return new File([file], name, { type: file.type });
      });

      try {
        await handleFilesUpload(normalizedFiles);
        // Optional success feedback — you already have upload feedback from handleFilesUpload
        notificationsService.success("Image pasted successfully");
      } catch (error) {
        console.error("Error uploading pasted image(s):", error);
        notificationsService.error("Image paste failed");
      }
    };

    const handleSendButtonClick = async () => {
      if (
        inputValue.trim() &&
        !isLoading &&
        !isUploading &&
        !isCharLimitExceeded
      ) {
        try {
          const messageToSend = inputValue;
          setInputValue(""); // clear immediately for snappier UX
          await sendMessage(messageToSend, files || []);
          setFiles([]);
          setFileTypes([]);
          setIsImageGeneration(false);
          if (onImageGenerationChange) {
            onImageGenerationChange(false);
          }
          setIsUploading(false);
        } catch (error) {
          console.error("Error sending message:", error);
        }
      }
    };

    // Memoize the character count display to prevent unnecessary rerenders
    const characterCountDisplay = useMemo(() => {
      if (inputValue.length === 0) return null;

      return (
        <div
          className={`text-xs mb-1 ${
            isCharLimitExceeded ? "text-red-400" : "text-gray-300"
          }`}
          style={{ alignSelf: "flex-end", marginRight: "12px" }}
        >
          {inputValue.length.toLocaleString()} /{" "}
          {MAX_CHARACTER_LIMIT.toLocaleString()}
        </div>
      );
    }, [inputValue.length, isCharLimitExceeded]);

    const handleFilesUpload = useCallback(
      async (newFiles: File[]) => {
        if (!chatId || !isAttachmentEnabled) return;

        const newTotalCount = totalFileCount + newFiles.length;
        if (newTotalCount > 20) {
          notificationsService.error("Maximum file limit (20) reached");
          return;
        }

        // Validate files up-front against allowed extensions for the current model/chat type
        {
          const invalidFiles = newFiles.filter(
            (file) => !isExtensionAllowedByModel(file.name)
          );
          if (invalidFiles.length > 0) {
            notificationsService.error(
              "One or more selected files are not supported by the current model"
            );
            return;
          }
        }

        // Create temporary metadata for all files upfront
        const tempMetadataArray = newFiles.map((file) => {
          const isImage = isImageExtensionAllowed(file.name);
          const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
          return {
            fileName: file.name,
            fileType: isImage ? "Image" : "Document",
            fileIdentifier: "pending",
            previewUrl,
          };
        });

        // Add all files to the UI immediately
        setFiles((prevFiles) => [...prevFiles, ...tempMetadataArray]);
        setUploadingFiles((prev) => {
          const updated = new Set(prev);
          newFiles.forEach((file) => updated.add(file.name));
          return updated;
        });
        setIsUploading(true);

        try {
          // Process all files concurrently
          const uploadPromises = newFiles.map(async (file, index) => {
            // Validate each file extension against allowed list
            const isValidFile = isExtensionAllowedByModel(file.name);

            if (!isValidFile) {
              const errorMessage = `File type not supported: ${file.name}`;
              throw new Error(errorMessage);
            }

            try {
              // Check if this is a SharePoint file
              if (
                "sharePointMetadata" in file &&
                (file as FileWithSharePointMetadata).sharePointMetadata
              ) {
                const sharePointFile = file as FileWithSharePointMetadata;
                const uploadResponse =
                  await workspacesService.downloadFromSharePointForChat(
                    chatId,
                    btoa(
                      unescape(
                        encodeURIComponent(
                          JSON.stringify(sharePointFile.sharePointMetadata!)
                        )
                      )
                    ),
                    chatType
                  );

                return {
                  fileName: file.name,
                  response: {
                    fileName: uploadResponse.fileName,
                    fileType: uploadResponse.fileType,
                    blobUrl: uploadResponse.blobUrl, // For backend use
                    previewUrl: uploadResponse.previewUrl, // For frontend display
                  },
                };
              } else {
                // Regular file upload
                const uploadResponse = await filesService.uploadFiles(
                  file,
                  chatId,
                  chatType
                );
                return {
                  fileName: file.name,
                  response: {
                    fileName: uploadResponse.fileName,
                    fileType: uploadResponse.fileType,
                    blobUrl: uploadResponse.blobUrl, // For backend use
                    previewUrl: uploadResponse.previewUrl, // For frontend display
                  },
                };
              }
            } catch (error) {
              throw new Error(`Upload failed for ${file.name}`);
            }
          });

          const results = await Promise.allSettled(uploadPromises);

          // Process results and update UI
          results.forEach((result, index) => {
            if (result.status === "fulfilled") {
              const { fileName, response } = result.value;
              setFiles((prevFiles) =>
                prevFiles.map((f) => (f.fileName === fileName ? response : f))
              );
              setUploadingFiles((prev) => {
                const updated = new Set(prev);
                updated.delete(fileName);
                return updated;
              });
            } else {
              const fileName = newFiles[index].name;
              notificationsService.error(`Upload failed for ${fileName}`);
              setFiles((prevFiles) =>
                prevFiles.filter((f) => f.fileName !== fileName)
              );
              const previewUrl = tempMetadataArray[index].previewUrl;
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }
              setUploadingFiles((prev) => {
                const updated = new Set(prev);
                updated.delete(fileName);
                return updated;
              });
            }
          });

          // Update total file count with successfully uploaded files
          const successfulUploads = results.filter(
            (r) => r.status === "fulfilled"
          ).length;
          onTotalFileCountChange?.(totalFileCount + successfulUploads);
        } catch (error) {
          console.error("Upload error:", error);
          notificationsService.error("Upload failed. Please try again.");

          // Clean up on error
          tempMetadataArray.forEach((metadata) => {
            if (metadata.previewUrl) {
              URL.revokeObjectURL(metadata.previewUrl);
            }
          });
        } finally {
          setIsUploading(false);
        }
      },
      [
        chatId,
        isAttachmentEnabled,
        totalFileCount,
        onTotalFileCountChange,
        chatType,
      ]
    );

    const handleFileUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      // Close the dropdown after file selection
      setIsDropupOpen(false);
      const newFiles = Array.from(event.target.files || []);
      await handleFilesUpload(newFiles);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleFileDelete = (index: number) => {
      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.filter((_, i) => i !== index);
        // Decrease the total file count when a file is removed
        onTotalFileCountChange?.(totalFileCount - 1);
        return updatedFiles;
      });

      // Keep the fileTypes cleanup
      setFileTypes((prevTypes) => prevTypes.filter((_, i) => i !== index));

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const renderFilePreview = (file: ChatFileMetadata, index: number) => {
      const isUploading = uploadingFiles.has(file.fileName);

      return (
        <motion.div
          key={`${file.fileName}-${index}`}
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "3.75rem" }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="mt-3 mb-1 ml-3"
        >
          <FilePreview
            file={file}
            onDelete={() => handleFileDelete(index)}
            isUploading={isUploading}
          />
        </motion.div>
      );
    };

    useEffect(() => {
      if (!isAttachmentEnabled && files.length > 0) {
        setFiles([]);
        setFileTypes([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }, [isAttachmentEnabled]);

    // Report unsent attachments summary (documents and images)
    useEffect(() => {
      const items: UnsentAttachmentItemSummary[] = files.map((f) => ({
        fileName: f.fileName,
        fileType:
          (f.fileType as "Image" | "Document") ||
          (isImageExtensionAllowed(f.fileName) ? "Image" : "Document"),
        extension: `.${f.fileName.split(".").pop()?.toLowerCase()}`,
      }));

      const documents = items.filter((i) => i.fileType === "Document").length;
      const images = items.filter((i) => i.fileType === "Image").length;
      const summary: UnsentAttachmentsSummary = {
        hasDocuments: documents > 0,
        hasImages: images > 0,
        counts: {
          documents,
          images,
          total: items.length,
        },
        files: items,
      };
      onUnsentAttachmentsChange?.(summary);
    }, [files, onUnsentAttachmentsChange]);

    // Clean up object URLs when files are removed or component unmounts
    useEffect(() => {
      return () => {
        files.forEach((file) => {
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }
        });
      };
    }, []);

    // Close dropup when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropupRef.current &&
          !dropupRef.current.contains(event.target as Node)
        ) {
          setIsDropupOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Disable image generation when files are attached
    useEffect(() => {
      if (files.length > 0 && isImageGeneration) {
        setIsImageGeneration(false);
        if (onImageGenerationChange) {
          onImageGenerationChange(false);
        }
      }
    }, [files, isImageGeneration, onImageGenerationChange]);

    const handleOneDriveSelect = () => {
      // Open the SharePoint file picker
      setIsDropupOpen(false);
      setIsSharePointFilePickerOpen(true);
    };

    // Handle files selected from SharePoint
    const handleSharePointFilesSelected = useCallback(
      async (selectedFiles: File[]) => {
        // Files from SharePoint picker already have the sharePointMetadata property
        await handleFilesUpload(selectedFiles);
        setIsSharePointFilePickerOpen(false);
      },
      [handleFilesUpload]
    );

    const handleUpdateSystemPromptSettings = () => {
      console.log("Update system prompt settings clicked");
      setShowSettingsModal(false);
    };

    const handleToggleImageGeneration = (enabled: boolean) => {
      setIsImageGeneration(enabled);
      if (onImageGenerationChange) {
        onImageGenerationChange(enabled);
      }
    };

    const { accounts } = useMsal();

    // ... existing state declarations

    // Typewriter effect for prompts with cancellation support
    const typeIntoInput = useCallback(
      async (text: string, delay = 30, shouldCancel?: () => boolean) => {
        setInputValue("");
        for (let i = 0; i < text.length; i++) {
          if (shouldCancel?.()) return;
          await new Promise((res) => setTimeout(res, delay));
          if (shouldCancel?.()) return;
          setInputValue((prev) => prev + text[i]);
        }
      },
      []
    );

    // Track state for entry source flow
    const prevFilesLengthRef = useRef(0);
    const flowCompletedRef = useRef(false);
    const flowKeyRef = useRef<string | null>(null);

    // ToolsMenu ref and programmatic upload trigger
    const toolsMenuRef = useRef<ToolsMenuRef>(null);

    // Track deferred prompt typing for sources that require upload
    const pendingPromptAfterUploadRef = useRef(false);
    const entrySourcePopupSessionKey = useMemo(
      () => getEntrySourcePopupSessionKey(entrySource, entrySourcePopupKey),
      [entrySource, entrySourcePopupKey]
    );

    const triggerUpload = useCallback(() => {
      if (toolsMenuRef.current && isAttachmentEnabled && totalFileCount < 20) {
        toolsMenuRef.current.openFileUpload();
      }
    }, [isAttachmentEnabled, totalFileCount]);

    // Expose methods to parent via ref (after handlers are defined)
    useImperativeHandle(ref, () => ({
      handleFilesUpload,
      triggerUpload,
    }));

    // Reset flow state when the entry source (or navigation key) changes
    useEffect(() => {
      const flowKey = entrySourcePopupSessionKey ?? entrySource ?? null;
      if (!flowKey) {
        flowKeyRef.current = null;
        prevFilesLengthRef.current = 0;
        flowCompletedRef.current = false;
        pendingPromptAfterUploadRef.current = false;
        return;
      }

      if (flowKeyRef.current === flowKey) return;

      flowKeyRef.current = flowKey;
      prevFilesLengthRef.current = 0;
      flowCompletedRef.current = false;
      pendingPromptAfterUploadRef.current = false;
    }, [entrySource, entrySourcePopupSessionKey]);

    // ENTRY SOURCE IMPLEMENTATION FOR DRIVER.JS
    useEffect(() => {
      if (!entrySource) return;

      if (
        entrySourcePopupSessionKey &&
        hasSessionFlag(entrySourcePopupSessionKey)
      ) {
        flowCompletedRef.current = true;
        return;
      }

      if (flowCompletedRef.current) return;

      const userId = accounts?.[0]?.localAccountId || "unknown";
      const sourceConfig = featureHighlightService.getSourceConfig(
        entrySource,
        t
      );
      if (!sourceConfig) return;

      const shouldShowWelcomePopup =
        featureHighlightService.shouldShowWelcomePopup(entrySource, userId);

      if (!shouldShowWelcomePopup) {
        flowCompletedRef.current = true;
        return;
      }

      let isCancelled = false;

      const runFlow = async () => {
        if (entrySourcePopupSessionKey) {
          setSessionFlag(entrySourcePopupSessionKey);
        }

        // Step 1: Show unified welcome popup
        if (sourceConfig.welcome?.enabled) {
          await new Promise<void>((resolve) => {
            featureHighlightService.showUnifiedSourceIntegrationPopup(
              entrySource,
              userId,
              {
                onComplete: () => {
                  resolve();

                  // If upload is required, defer prompt typing and optionally auto-trigger upload
                  if (sourceConfig.requiresUpload) {
                    if (sourceConfig.prompt) {
                      pendingPromptAfterUploadRef.current = true;
                    }

                    const shouldAutoTriggerUpload =
                      sourceConfig.autoTriggerUpload ?? true;
                    if (shouldAutoTriggerUpload && isAttachmentEnabled) {
                      try {
                        toolsMenuRef.current?.openFileUpload(); // Open file upload dialog
                      } catch (err) {
                        console.warn("[ChatInput] openFileUpload failed:", err);
                      }
                    }
                  } else {
                    // No upload required: type the prompt immediately
                    if (!isCancelled && sourceConfig.prompt) {
                      typeIntoInput(sourceConfig.prompt);
                    }
                  }
                },
              },
              t
            );
          });
        }

        flowCompletedRef.current = true;
        localStorage.setItem(`highlight-flow-completed-${entrySource}`, "true");
      };

      const timeoutId = setTimeout(runFlow, 500);

      return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
        featureHighlightService.cleanupDriver();
      };
    }, [
      entrySource,
      entrySourcePopupSessionKey,
      isAttachmentEnabled,
      accounts,
      t,
      toolsMenuRef,
      typeIntoInput,
    ]);

    // Type unified prompt only after upload completes for sources that require upload
    useEffect(() => {
      if (!entrySource) return;
      const sourceConfig = featureHighlightService.getSourceConfig(
        entrySource,
        t
      );
      if (!sourceConfig?.requiresUpload) return;

      if (
        pendingPromptAfterUploadRef.current &&
        !isUploading &&
        files.length > 0
      ) {
        if (sourceConfig.prompt) {
          typeIntoInput(sourceConfig.prompt);
        }
        pendingPromptAfterUploadRef.current = false;
      }
    }, [entrySource, t, isUploading, files.length]);

    return (
      <div
        id="dsb-chat-input"
        className={`w-full mx-auto max-w-3xl shadow-dropdown !relative flex flex-col bg-gray-600 overflow-visible max-h-[21.4rem]`}
        style={{
          borderRadius: isExpanded ? "1.6rem" : "5rem",
          transformOrigin: "top",
          height: isExpanded ? "auto" : "3.39rem",
        }}
      >
        {/* File Details */}
        {files.length > 0 && (
          <AnimatePresence>
            <div className="flex w-full flex-wrap">
              {files.map((file, index) => (
                <div key={index}>{renderFilePreview(file, index)}</div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Text Input Row (latched expanded layout for stability) */}
        <div
          className="z-1"
          style={{
            position: isExpanded ? "relative" : "absolute",
            top: isExpanded ? "auto" : "0",
            left: isExpanded ? "0" : "3.4rem",
            width: "100%",
            transform: "none",
            bottom: isExpanded ? "auto" : "14px",
            minHeight: isExpanded ? 48 : 10,
            transformOrigin: "top",
          }}
        >
          {/* Custom placeholder overlay for proper truncation */}

          {!inputValue && !isExpanded && (
            <div
              className="absolute pointer-events-none text-gray-300 font-body overflow-hidden whitespace-nowrap text-ellipsis"
              style={{
                left: "0.1rem",
                top: "17px",
                right: "7rem",
                lineHeight: "normal",
              }}
            >
              {placeholderText || t("components:chatInput.placeholder")}
            </div>
          )}
          <textarea
            ref={textAreaRef}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={!isInputEnabled}
            placeholder={
              isExpanded
                ? placeholderText || t("components:chatInput.placeholder")
                : ""
            }
            className={`${
              isExpanded
                ? "px-5 leading-[24px]"
                : "!pr-[9rem]  pl-[.1rem] leading-1"
            } w-full outline-none font-body placeholder:text-gray-300 text-white-100 placeholder-gray-300 bg-transparent
          focus:outline-none focus:text-white-100 resize-none mt-[16px] mb-0 max-h-[16.8rem]`}
            style={{
              whiteSpace: "pre-wrap",
              overflow: isExpanded ? "auto" : "hidden",
            }}
            rows={1}
          />
        </div>
        <div
          className={`flex justify-between w-full px-2 ${
            isExpanded ? "place-items-end pb-2" : "place-items-center py-[9px]"
          }`}
        >
          {/* Left side icons */}
          {!isAttachmentEnabled && showExpandIcon ? (
            // Option to Expand Chat when in canvas mode below 900px
            isCanvasMode &&
            showExpandIcon && (
              <Tooltip text="Open/Close Full Chat View" useMui>
                <button
                  className={`relative rounded-full p-[5.8px] bg-transparent text-white-100`}
                  onClick={handleShowFullDialogue}
                  aria-label="Open/Close Full Chat View"
                >
                  <HiOutlineArrowsExpand size={24} strokeWidth={1.4} />
                </button>
              </Tooltip>
            )
          ) : (
            <div className="pl-1 flex items-center gap-2">
              <div
                className={`transition-opacity duration-200 relative ${
                  !isAttachmentEnabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                ref={dropupRef}
              >
                {/* Plus Button */}
                <ToolsMenu
                  isAttachmentEnabled={isAttachmentEnabled}
                  totalFileCount={totalFileCount}
                  handleFileUpload={handleFileUpload}
                  handleOneDriveSelect={handleOneDriveSelect}
                  isDropupOpen={isDropupOpen}
                  setIsDropupOpen={setIsDropupOpen}
                  allowedExtensionsForModel={allowedExtensionsForModel}
                  chatType={chatType}
                  selectedModel={selectedModel}
                  getModelSupportsTools={getModelSupportsTools}
                  isImageGeneration={isImageGeneration}
                  setIsImageGeneration={setIsImageGeneration}
                  onImageGenerationChange={onImageGenerationChange}
                  t={t}
                  direction={dropdownDirection}
                  ref={toolsMenuRef}
                />
              </div>

              {/* Image Generation Toggle Button - only show for certain chat types and models */}
              {isImageGeneration && (
                <ImageButtonTab
                  isImageGeneration={isImageGeneration}
                  onToggleImageGeneration={handleToggleImageGeneration}
                  files={files}
                />
              )}
              {/* Agent feature activated */}
              {showAgentList && <AgentsButtonTab />}
            </div>
          )}

          {/* Right side icons */}
          <RightControlButtons
            inputValue={inputValue}
            isLatchedExpanded={isLatchedExpanded}
            isCharLimitExceeded={isCharLimitExceeded}
            isLoading={isLoading}
            isUploading={isUploading}
            isInputEnabled={isInputEnabled}
            handleSendButtonClick={handleSendButtonClick}
            handleCloseStream={handleCloseStream}
            onTranscriptionComplete={handleTranscriptionComplete}
            onVoiceRecordingError={handleVoiceRecordingError}
            checkAudioSupport={checkAudioSupport}
            onAudioStateChange={setAudioState}
          />
        </div>

        {/* SharePoint File Picker */}
        <SharePointFilePicker
          isOpen={isSharePointFilePickerOpen}
          onClose={() => setIsSharePointFilePickerOpen(false)}
          onFilesSelected={handleSharePointFilesSelected}
          allowedFileTypes={allowedExtensionsForModel.map((ext) => ({
            contentType: "",
            fileExtension: ext,
          }))}
          existingFiles={files.map((file) => file.fileName)}
        />
        {showSettingsModal && moduleName === "AI Traffic Information" && (
          <TrafficInformationSettingsWrapper
            showSettingsModal={showSettingsModal}
            onCancel={() => setShowSettingsModal(false)}
            onConfirm={handleUpdateSystemPromptSettings}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
        {showSettingsModal && moduleName !== "AI Traffic Information" && (
          <PromptSettingsActionDialog
            title={t("traffic-information:promptSettingsActionDialog.title")}
            cancelBtn={t(
              "traffic-information:promptSettingsActionDialog.cancelBtn"
            )}
            confirmBtn={t(
              "traffic-information:promptSettingsActionDialog.confirmBtn"
            )}
            open={showSettingsModal}
            onCancel={() => setShowSettingsModal(false)}
            onConfirm={handleUpdateSystemPromptSettings}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </div>
    );
  }
);

export default ChatInput;
