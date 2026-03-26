import React, { useRef, useState } from "react";
import { TbUpload, TbPhoto } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import { CircularProgress } from "@mui/material";
import { notificationsService } from "../../services/notificationsService";

type WorkspaceImageUploaderProps = {
  onImageUploaded: (imageUrl: string) => void;
  maxFileSize?: number; // in MB
};

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
export const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
];
export const MAX_IMAGE_SIZE = 2;

export const WorkspaceImageUploader: React.FC<WorkspaceImageUploaderProps> = ({
  onImageUploaded,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateImageFile = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notificationsService.error(
        t("workspaces:imagePicker.errors.invalidFileType", {
          allowedTypes: ALLOWED_EXTENSIONS.join(", "),
        })
      );
      return false;
    }

    // Check file size (convert MB to bytes)
    const maxSizeInBytes = MAX_IMAGE_SIZE * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      notificationsService.error(
        t("workspaces:imagePicker.errors.fileTooLarge", {
          maxSize: MAX_IMAGE_SIZE,
        })
      );
      return false;
    }

    return true;
  };

  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to data URL"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Convert the image file to a data URL
      const dataUrl = await convertFileToDataUrl(file);

      // Pass the data URL to the parent component
      onImageUploaded(dataUrl);
      notificationsService.success(t("workspaces:imagePicker.uploadSuccess"));
    } catch (error) {
      console.error("Error processing image:", error);
      notificationsService.error(t("workspaces:imagePicker.uploadError"));
    } finally {
      setIsProcessing(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={isProcessing}
      />
      <button
        onClick={handleButtonClick}
        disabled={isProcessing}
        className={`rounded-full px-3 py-2 sm:w-auto flex items-center gap-2 
          bg-white-200 text-gray-600 font-body font-semibold text-[14px] 
          hover:bg-red-700 hover:text-white-100 
          disabled:bg-gray-400 disabled:text-gray-300 disabled:cursor-not-allowed 
          transition-colors duration-300 ease-in-out`}
        aria-label={t("workspaces:imagePicker.uploadImage")}
      >
        {isProcessing ? (
          <>
            <CircularProgress size={16} className="text-current" />
            <span className="text-sm font-medium">
              {t("workspaces:imagePicker.processing")}
            </span>
          </>
        ) : (
          <>
            <TbUpload size={22} strokeWidth={2} />
            <span>{t("workspaces:imagePicker.uploadImage")}</span>
          </>
        )}
      </button>
    </>
  );
};

export default WorkspaceImageUploader;
