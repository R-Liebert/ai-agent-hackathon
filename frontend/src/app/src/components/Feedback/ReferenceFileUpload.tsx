import React, { useState } from "react";
import clsx from "clsx";
import {
  TbCloudUpload,
  TbFileText,
  TbTrash,
  TbFileFilled,
} from "react-icons/tb";
import { useTranslation } from "react-i18next";
import { SharePointFilePicker } from "../../components/Workspaces/SharePointFilePicker";
import FormLabel from "../../components/Global/FormLabel";
import { notificationsService } from "../../services/notificationsService";

export type FeedbackFileUploadProps = {
  label: string;
  tooltipText: string;
  dropAreaHeader: string;
  dropAreaSubheader: string;
  dropAreaSubheaderFiletypes: string;
  files: File[];
  allowedFileTypes: { contentType: string; fileExtension: string }[];
  maxNumberOfFiles: number;
  maxFileSize: number;
  onChange: (files: File[]) => void;
};

export const FeedbackFileUpload: React.FC<FeedbackFileUploadProps> = ({
  label,
  tooltipText,
  dropAreaHeader,
  dropAreaSubheader,
  dropAreaSubheaderFiletypes,
  files,
  allowedFileTypes,
  maxNumberOfFiles,
  maxFileSize,
  onChange,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSharePointPickerOpen, setIsSharePointPickerOpen] = useState(false);

  const allowedExtensions = allowedFileTypes.map((type) =>
    type.fileExtension.toLowerCase()
  );

  const handleFileChange = (newFiles: File[]) => {
    const validFiles = validateFiles(newFiles);
    onChange([...files, ...validFiles]);
  };

  const validateFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];

    newFiles.forEach((file) => {
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const isValidType =
        allowedFileTypes.length === 0 ||
        allowedExtensions.includes(fileExtension);

      const isValidSize = file.size / 1024 / 1024 <= maxFileSize;

      if (!isValidType) {
        notificationsService.warn(
          `${t(
            "feedback:forms.notifications.files.fileValidations.fileType.textOne"
          )} '${file.name}' ${t(
            "feedback:forms.notifications.files.fileValidations.fileType.textTwo"
          )}`
        );
      } else if (!isValidSize) {
        notificationsService.warn(
          `${t(
            "feedback:forms.notifications.files.fileValidations.fileSize.textOne"
          )} '${file.name}' ${t(
            "feedback:forms.notifications.files.fileValidations.fileSize.textTwo"
          )} ${maxFileSize} MB.`
        );
      } else if (files.length + validFiles.length >= maxNumberOfFiles) {
        notificationsService.warn(
          `${t(
            "feedback:forms.notifications.files.fileValidations.maxQuantity.textOne"
          )} ${maxNumberOfFiles} ${t(
            "feedback:forms.notifications.files.fileValidations.maxQuantity.textTwo"
          )}`
        );
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      notificationsService.success(
        `${validFiles.length} ${t(
          "feedback:forms.notifications.files.fileValidations.success"
        )}`
      );
    }

    return validFiles;
  };

  const handleRemoveFile = (
    fileToRemove: File,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    const updatedFiles = files.filter((file) => file !== fileToRemove);
    onChange(updatedFiles);
    notificationsService.success(
      `${t("feedback:forms.notifications.files.removeFile.textOne")} '${
        fileToRemove.name
      }' ${t("feedback:forms.notifications.files.removeFile.textTwo")}`
    );
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    handleFileChange(droppedFiles);
    setIsDragOver(false);
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleFileChange(selectedFiles);
  };

  const handleSharePointFilesSelected = (sharePointFiles: File[]) => {
    handleFileChange(sharePointFiles);
    setIsSharePointPickerOpen(false);
  };

  return (
    <div className="w-full mt-3">
      <FormLabel label={label} tooltipText={tooltipText} />
      <div
        className={clsx(
          "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 sm:p-6 transition-all text-center",
          isDragOver ? "border-blue-500 bg-gray-700" : "border-gray-500"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <TbCloudUpload className="text-white-100" size={64} strokeWidth={1} />
        <p className="text-xl font-body text-white-100 font-medium">
          {dropAreaHeader}
        </p>
        <p className="text-md font-body text-gray-300">{dropAreaSubheader}</p>
        <p className="text-sm font-body text-gray-300">
          {dropAreaSubheaderFiletypes} {allowedExtensions.join(", ")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 my-6 w-full sm:w-auto place-items-center place-content-center">
          {/* Hidden File Input */}
          <input
            id="file-upload"
            type="file"
            multiple
            accept={allowedFileTypes
              .map((type) => type.fileExtension)
              .join(",")}
            className="hidden"
            onChange={handleFileInputChange}
          />
          <label className="flex-grow w-full sm:w-auto" htmlFor="file-upload">
            <button
              aria-label={t("workspaces:common.form.labels.uploadFilesBtn")}
              data-testid="upload-files-button"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("file-upload")?.click();
              }}
              className="flex-grow w-full sm:w-auto place-items-center place-content-center gap-2 bg-white-200 text-gray-600 px-4 py-2 font-semibold rounded-full cursor-pointer flex hover:text-white-100 hover:bg-red-600 transition-all"
            >
              <TbFileText strokeWidth={2} size={24} />
              <span>{t("workspaces:common.form.labels.uploadFilesBtn")}</span>
            </button>
          </label>
          <button
            className="flex-grow w-full sm:w-auto place-items-center place-content-center gap-2 bg-white-200 text-gray-600 px-4 py-2 font-semibold rounded-full cursor-pointer flex hover:text-white-100 hover:bg-red-600 transition-all"
            onClick={(e) => {
              e.preventDefault();
              setIsSharePointPickerOpen(true);
            }}
          >
            <TbCloudUpload strokeWidth={2} size={24} />
            {t("workspaces:common:sharePointPicker:button")}
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <TbFileFilled className="text-white-100" size={24} />
                <span className="text-gray-200 text-sm">{file.name}</span>
              </div>
              <button
                onClick={(e) => handleRemoveFile(file, e)}
                className="text-white-100 hover:text-red-400 text-sm font-medium"
              >
                <TbTrash size={24} strokeWidth={1.6} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* SharePoint File Picker */}
      {isSharePointPickerOpen && (
        <SharePointFilePicker
          isOpen={isSharePointPickerOpen}
          onClose={() => setIsSharePointPickerOpen(false)}
          onFilesSelected={handleSharePointFilesSelected}
          allowedFileTypes={allowedFileTypes}
          existingFiles={files.map((file) => file.name)}
        />
      )}
    </div>
  );
};

export default FeedbackFileUpload;
