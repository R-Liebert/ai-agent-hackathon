import { CircularProgress } from "@mui/material";
import WorkspaceAvatar from "./workspace-avatar";
import { useQuery } from "@tanstack/react-query";
import { workspacesService } from "../../services/workspacesService";
import { useEffect, useState } from "react";
import ModalContainer from "../Global/ModalContainer";
import { TbPhoto, TbInfoCircle } from "react-icons/tb";
import Tooltip from "../Global/Tooltip";
import { useTranslation } from "react-i18next";
import {
  WorkspaceImageUploader,
  ALLOWED_EXTENSIONS,
  MAX_IMAGE_SIZE,
} from "./workspace-image-upload";

type WorkspaceImagePickerProps = {
  imageUrl?: string;
  onSelect(imageUrl?: string): void;
};

const WorkspaceImagePicker = ({
  imageUrl,
  onSelect,
}: WorkspaceImagePickerProps) => {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [displayedImages, setDisplayedImages] = useState<string[]>([]);
  const [_, setPage] = useState(1);
  const itemsPerPage = 12;
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { t } = useTranslation();

  const { data: allImages, isLoading } = useQuery({
    queryKey: ["workspace-images"],
    queryFn: workspacesService.getWorkspaceImages,
    staleTime: 31 * 24 * 60 * 60 * 1000, // 31 days in milliseconds
    enabled: open,
  });

  useEffect(() => {
    if (allImages) {
      setImages(allImages);
      setDisplayedImages(allImages.slice(0, itemsPerPage));
    }
  }, [allImages]);

  const handleLoadMore = () => {
    if (isLoadingMore) return; // Prevent multiple triggers during loading
    setIsLoadingMore(true);

    setPage((prevPage) => {
      const newPage = prevPage + 1;
      setDisplayedImages((_) => images.slice(0, newPage * itemsPerPage));
      setIsLoadingMore(false);
      return newPage;
    });
  };

  const handleOpen = () => {
    setOpen(true);
    setPage(1);
    setDisplayedImages(images.slice(0, itemsPerPage));
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSelectImage = (imageUrl: string) => {
    onSelect(imageUrl);
    setOpen(false);
  };

  return (
    <>
      <button
        className="relative flex place-items-center place-content-center border-2 rounded-full
         border-gray-600 h-[6em] w-[6em] cursor-pointer relative group"
        onClick={handleOpen}
        aria-label={t("workspaces:imagePicker.selectImageButton")}
      >
        {imageUrl ? (
          <WorkspaceAvatar size="lg" imageUrl={imageUrl} />
        ) : (
          <TbPhoto className="text-4xl" strokeWidth={1.2} />
        )}
        <Tooltip
          text="workspaces:common:tooltips:image"
          position="left-[6.7rem] top-9"
        />
      </button>
      {open && (
        <ModalContainer
          open={open}
          title={t("workspaces:imagePicker.dialogTitle")}
          onClose={handleClose}
          width="max-w-lg"
        >
          <div className="relative flex flex-col h-[32rem]">
            <div className="flex-1 overflow-y-auto pt-3">
              {!isLoading && (
                <div className="flex flex-wrap justify-between gap-x-1 gap-y-3 sm:gap-6">
                  {displayedImages.map((imageUrl: string, index: number) => (
                    <div key={index}>
                      <WorkspaceAvatar
                        size="lg"
                        imageUrl={imageUrl}
                        onClick={() => handleSelectImage(imageUrl)}
                      />
                    </div>
                  ))}
                </div>
              )}
              {isLoading && (
                <div className="flex place-items-center place-content-center py-10">
                  <CircularProgress />
                </div>
              )}
            </div>
            <div className="flex flex-row sm:ml-auto ml-0 gap-3 w-full justify-end my-6 ml-auto">
              <button
                aria-label={
                  isLoadingMore
                    ? t("workspaces:imagePicker.loadingText")
                    : displayedImages.length >= images.length
                    ? t("workspaces:imagePicker.noImagesText")
                    : t("workspaces:imagePicker.loadMoreButton")
                }
                className={`relative z-10 flex items-center justify-center rounded-full px-3 py-2 text-[14px] 
                  border-2 border-gray-350 font-medium bg-gray-600 text-white-100 
                  hover:bg-gray-400 hover:text-superwhite 
                  focus:bg-gray-650 focus:text-white-100 
                  disabled:cursor-not-allowed disabled:opacity-50 
                  transition-colors duration-300 ease-in-out`}
                onClick={!isLoadingMore ? handleLoadMore : undefined}
                disabled={
                  displayedImages.length >= images.length || isLoadingMore
                }
              >
                {isLoadingMore && <CircularProgress size={24} />}
                {images.length > 0 &&
                  displayedImages.length < images.length && (
                    <>{t("workspaces:imagePicker.loadMoreButton")}</>
                  )}
                {images.length > 0 &&
                  displayedImages.length >= images.length && (
                    <>{t("workspaces:imagePicker.noImagesText")}</>
                  )}
              </button>
              <WorkspaceImageUploader onImageUploaded={handleSelectImage} />
            </div>
            {/* Upload Limitations Info below buttons */}
            <div className="px-6 py-4 bg-gray-650 border-t border-gray-500 rounded-b-2xl">
              <div className="flex items-start gap-2">
                <TbInfoCircle size={16} />
                <div className="text-xs text-gray-200">
                  <p className="font-medium text-white-100 mb-1">
                    {t("workspaces:imagePicker.uploadLimitations")}
                  </p>
                  <p>
                    {t("workspaces:imagePicker.allowedFileTypes")}:{" "}
                    {ALLOWED_EXTENSIONS.join(", ")} •{" "}
                    {t("workspaces:imagePicker.maxFileSize")}: {MAX_IMAGE_SIZE}
                    MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ModalContainer>
      )}
    </>
  );
};

export default WorkspaceImagePicker;
