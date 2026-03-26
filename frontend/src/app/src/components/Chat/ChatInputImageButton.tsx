import React from "react";
import { TbPhotoSpark } from "react-icons/tb";

interface ImageTabProps {
  isImageGeneration: boolean;
  onToggleImageGeneration: (enabled: boolean) => void;
  files: any[]; // Replace `any` with the correct type for files if available
}

const ImageTab: React.FC<ImageTabProps> = ({
  isImageGeneration,
  onToggleImageGeneration,
  files,
}) => {
  return (
    <div className="flex items-start">
      <button
        type="button"
        onClick={() => {
          const newValue = !isImageGeneration;
          onToggleImageGeneration(newValue);
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full transition-colors duration-200 ${
          isImageGeneration
            ? "bg-blue-500 border-blue-500 text-superwhite"
            : "bg-transparent border-gray-400 text-white-100 hover:bg-gray-400"
        } ${
          files.length > 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        aria-pressed={isImageGeneration}
        disabled={files.length > 0}
        title={
          files.length > 0
            ? "Image generation is disabled when files are attached"
            : ""
        }
      >
        <TbPhotoSpark size={19} color="white" strokeWidth={1.4} />
        <span className="text-sm text-white-100 capitalize font-normal">
          Image
        </span>
      </button>
    </div>
  );
};

export default ImageTab;
