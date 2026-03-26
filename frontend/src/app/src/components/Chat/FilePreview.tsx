import React from "react";
import { IoClose } from "react-icons/io5";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "../Global/Tooltip";
import { ChatFileMetadata } from "../../models/chat-message";
import {
  HiOutlineDocumentText,
  HiOutlineDocument,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { useAuthenticatedImageUrl } from "../../hooks/useAuthenticatedImageUrl";
import { useTranslation } from "react-i18next";

interface FilePreviewProps {
  file: ChatFileMetadata & { previewUrl?: string };
  onDelete?: (file: ChatFileMetadata) => void;
  isUploading?: boolean;
  showDeleteButton?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes("Image")) {
    return <HiOutlinePhoto className="text-white-100 text-2xl text-center" />;
  }
  if (fileType.includes("Document")) {
    return (
      <HiOutlineDocument className="text-white-100 text-2xl text-center" />
    );
  }
  return (
    <HiOutlineDocumentText className="text-white-100 text-2xl text-center" />
  );
};

const getFileExtension = (fileName: string) => {
  return fileName.split(".").pop();
};

const shortenFileName = (fileName: string, maxLength = 32) => {
  return fileName.length > maxLength
    ? fileName.substring(0, maxLength) + ".."
    : fileName;
};

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onDelete,
  isUploading,
  showDeleteButton = true,
}) => {
  const isImage = file.fileType?.includes("Image");
  const { t } = useTranslation();

  // Get authenticated image URL for protected API endpoints
  const imageUrl = file.previewUrl || file.fileIdentifier;
  const { url: authenticatedImageUrl, isLoading: isLoadingImage } =
    useAuthenticatedImageUrl(isImage ? imageUrl : undefined);

  return (
    <div
      className={`${
        isImage
          ? "!w-16 !h-[3.75rem]"
          : "flex-shrink-1 w-full max-w-[13rem] sm:max-w-md lg:w-auto"
      } relative group`}
    >
      {isImage ? (
        <div className="relative w-16 h-[3.75rem] rounded-xl">
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-cover rounded-lg bg-gray-700"
            style={{
              backgroundImage: authenticatedImageUrl
                ? `url('${authenticatedImageUrl}')`
                : undefined,
            }}
          />
          {showDeleteButton && (
            <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[2]">
              <button
                aria-label={t("components:chatInput.removeFile")}
                className="bg-gray-400 p-[.1rem] rounded-full relative group/tooltip border-2 border-gray-350"
                onClick={() => onDelete?.(file)}
                disabled={isUploading || isLoadingImage}
              >
                <IoClose className="!text-white-100 !text-xl" />
                <div className="opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200">
                  <Tooltip
                    text={t("components:chatInput.removeFile")}
                    position="-top-[2.2rem] -left-[.2rem]"
                  />
                </div>
              </button>
            </div>
          )}
          {(isUploading || isLoadingImage) && (
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center z-10 rounded-lg">
              <CircularProgress size={24} className="!text-white-100" />
            </div>
          )}
        </div>
      ) : (
        <>
          {showDeleteButton && (
            <div className="absolute -top-3 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[2]">
              <button
                aria-label={t("components:chatInput.removeFile")}
                className="bg-gray-400 p-[.1rem] rounded-full relative group/tooltip border-2 border-gray-350"
                onClick={() => onDelete?.(file)}
                disabled={isUploading}
              >
                <IoClose className="!text-white-100 !text-xl" />
                <div className="opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200">
                  <Tooltip
                    text={t("components:chatInput.removeFile")}
                    position="-top-[2.2rem] -left-[.2rem]"
                  />
                </div>
              </button>
            </div>
          )}
          <div className="flex items-center flex-start bg-gray-700 rounded-2xl p-3 pr-4 !z-index-1 border border-gray-500">
            <div className="w-10 h-10 bg-red-300 flex place-items-center place-content-center mr-3 rounded-md">
              {isUploading ? (
                <CircularProgress size={24} className="!text-white-100" />
              ) : (
                getFileIcon(file.fileType)
              )}
            </div>
            <div className="flex-1 min-w-0">
              {" "}
              {/* Added flex-1 and min-w-0 */}
              <p className="text-white-100 truncate">
                {" "}
                {/* Added truncate */}
                {shortenFileName(file.fileName)}
              </p>
              <p className="text-gray-300 text-xs uppercase">
                {getFileExtension(file.fileName)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
