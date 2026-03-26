import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TbExclamationCircle } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import launchpadMetrics from "../../services/launchpadMetrics";

interface VideoPlayerModalProps {
  title: string;
  description: string;
  url: string;
  onClose: () => void;
}

const handleModalContentClick = (e: React.MouseEvent) => {
  e.stopPropagation();
};

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  title,
  description,
  url,
  onClose,
}) => {
  const { t } = useTranslation();

  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  const handleVideoError = (
    event: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const videoElement = event.currentTarget;

    setHasError(true);

    console.error(
      "Video failed to load. Possible reasons: 403, network issues, etc.",
      videoElement
    );
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
  };

  const handleVideoStarted = () => {
    if (!hasStarted) {
      setHasStarted(true);
      launchpadMetrics.track({
        metric: "launchpad_ui_video_view_started_count",
        labels: {
          title: title,
          url: url.split("?")[0],
        },
      });
    }
  };

  const handleVideoFinished = () => {
    if (!hasFinished) {
      setHasFinished(true);
      launchpadMetrics.track({
        metric: "launchpad_ui_video_view_finished_count",
        labels: {
          title: title,
          url: url.split("?")[0],
        },
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed w-full h-screen top-0 left-[3.8rem] right-0 bg-gray-950 bg-opacity-[95%] 
        flex flex-col justify-center items-center z-50 text-white-100 text-sm m-0 p-0 overflow-y-hidden"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          className="text-center flex flex-col place-items-center place-content-center mt-[6em] mb-14 px-2"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1 className="text-5xl text-white-100 font-headers font-medium">
            {title}
          </h1>
          {description && (
            <p className="text-gray-300 mt-2 font-body text-lg">
              {description}
            </p>
          )}
        </motion.div>
        <motion.div
          className="relative md:max-w-3xl max-w-[80vw]"
          onClick={handleModalContentClick}
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="border-2 md:min-h-[26rem] md:min-w-[44rem] min-w-[20rem] border-gray-500 rounded-2xl overflow-hidden !aspect-w-16 !aspect-h-9">
            {hasError ? (
              <div className="flex flex-col w-full h-full items-center bg-gray-800 justify-center text-center text-white-100 px-[11rem] py-[10.4rem]">
                <TbExclamationCircle size={48} strokeWidth={1.6} />
                <p className="text-lg mt-2 font-body">
                  Unable to load the video, please try again later.
                </p>
              </div>
            ) : (
              <video
                controls={true}
                autoPlay={true}
                disablePictureInPicture={true}
                onPlay={handleVideoStarted}
                onEnded={handleVideoFinished}
                onError={handleVideoError}
                onLoadedData={handleVideoLoaded}
                className="w-full h-full object-cover transition-opacity duration-500"
              >
                <source src={url} type="video/mp4" />
              </video>
            )}
          </div>
          <button
            aria-label="Return Home"
            className="font-body flex place-content-center mt-10 mb-16 mx-auto rounded-full px-6 py-3 bg-white-200 hover:bg-red-700 hover:text-white-100 font-body text-gray-600 font-semibold transition-color transition-background duration-300 ease-in-out place-items-center place-content-center"
            onClick={onClose}
          >
            {t("menu-page:videos.returnHome")}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoPlayerModal;
