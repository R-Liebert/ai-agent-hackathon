import React, { useRef, ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbBookUpload, TbPencilStar, TbDownload } from "react-icons/tb";
import Tooltip from "../Global/Tooltip";
import ContentCopy from "../../components/Global/AppContentCopy";
import { AnimatePresence, motion } from "framer-motion";
import { useJobPost } from "../../hooks/useJobPost";

export interface JobPostNavButtonsProps {
  onEditClick?: () => void;
}

const JobPostNavButtons: React.FC<JobPostNavButtonsProps> = ({
  onEditClick,
}) => {
  const { t } = useTranslation();
  const {
    handleJobPostEvaluationFileUpload,
    handleCopyJobPost,
    handleDownloadClick,
    formattedContent,
  } = useJobPost();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  // // Initiate the file picker
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Called when user selects a file in the native dialog
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleJobPostEvaluationFileUpload(e);
    setIsFileUploaded(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="flex gap-1 absolute top-[.5em] right-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hidden file input => calls handleFileChange on pick */}
        <input
          type="file"
          accept=".docx, .txt"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Upload Button */}
        <button
          type="button"
          onClick={handleUploadButtonClick}
          className="flex place-content-center my-auto p-2 text-center
                     transform transition-all duration-200
                     ease-in-out hover:bg-gray-600
                     rounded-lg relative group"
          aria-label={t("job-post-creator:navigationIconButtons.upload")}
        >
          <TbBookUpload strokeWidth={1.6} size={20} />
          <Tooltip
            text={
              isFileUploaded
                ? "job-post-creator:navigationIconButtons.uploaded"
                : "job-post-creator:navigationIconButtons.upload"
            }
            position="left-0 top-10"
          />
          {isFileUploaded ? (
            <span className="absolute top-2 right-2 w-2 h-2 flex bg-blue-400 rounded-full"></span>
          ) : null}
        </button>

        {/* Copy Content Button */}
        <ContentCopy
          handleCopyContent={handleCopyJobPost}
          customClass="flex place-content-center my-auto p-2 text-center 
                       transform transition-all duration-200 
                       ease-in-out hover:bg-gray-600 
                       rounded-lg relative group"
          htmlToCopy={formattedContent}
          iconSize={20}
          tooltipText={t("job-post-creator:navigationIconButtons.copy")}
          tooltipPosition="-left-[0.35rem] -bottom-[3.4rem]"
        />

        {/* Edit Button */}
        <button
          type="button"
          onClick={onEditClick}
          className="flex place-content-center my-auto p-2 text-center
                     transform transition-all duration-200
                     hover:bg-gray-600 rounded-lg relative group"
          aria-label={t("job-post-creator:navigationIconButtons.edit")}
        >
          <TbPencilStar strokeWidth={1.6} size={20} />
          <Tooltip
            text={"job-post-creator:navigationIconButtons.edit"}
            position="left-0 top-10"
          />
        </button>

        {/* Download Button */}
        <button
          type="button"
          onClick={() => handleDownloadClick()}
          className="flex place-content-center my-auto p-2 text-center
                     mr-12 transform transition-all duration-200
                     ease-in-out hover:bg-gray-600 rounded-lg relative group"
          aria-label={t("job-post-creator:navigationIconButtons.download")}
        >
          <TbDownload strokeWidth={1.6} size={20} />
          <Tooltip
            text="job-post-creator:navigationIconButtons.download"
            position="left-0 top-10"
          />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default JobPostNavButtons;
