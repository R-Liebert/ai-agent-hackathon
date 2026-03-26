import React from "react";
import { FileIcon } from "react-file-icon";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { DriveItem } from "./types";
import { getFileExtension, getFileIconProps } from "./utils";

interface SelectedFilesProps {
  selectedFiles: DriveItem[];
  onRemoveFile: (fileId: string) => void;
}

export const SelectedFiles: React.FC<SelectedFilesProps> = ({
  selectedFiles,
  onRemoveFile,
}) => {
  const { t } = useTranslation();

  if (selectedFiles.length === 0) return null;

  return (
    <div className="border-t border-gray-500 bg-gray-600 p-4">
      <div className="text-white-100 text-sm font-body mb-2">
        {t("workspaces:common:sharePointPicker:selectedFiles")}:
      </div>
      <div className="flex flex-wrap gap-4">
        {selectedFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-2 bg-gray-400 rounded-lg p-2 pr-3"
          >
            <div className="w-5" style={{ lineHeight: 0 }}>
              <FileIcon
                extension={getFileExtension(file.name)}
                {...getFileIconProps(getFileExtension(file.name))}
                radius={3}
                style={{ display: "block", height: "100%" }}
              />
            </div>
            <span className="text-white-100 text-sm font-body truncate max-w-[200px]">
              {file.name}
            </span>
            <button
              onClick={() => onRemoveFile(file.id)}
              className="text-white-100/50 hover:text-white-100 transition-colors ml-1"
            >
              <FaTimes size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
