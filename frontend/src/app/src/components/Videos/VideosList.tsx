import React, { useState, useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import VideoCard from "./VideoCard";
import VideoPlayerModal from "./VideoPlayerModal";
import { Navigation, A11y } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { useQuery } from "@tanstack/react-query";
import { videosService } from "../../services/videosService";
import { Skeleton } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useUserConfiguration } from "../../contexts/UserConfigurationProvider";

type MultiLangString = Record<string, string>;

interface Video {
  title: MultiLangString;
  description: MultiLangString;
  url: string;
  thumbnailUrl: string;
  thumbnailBase64: string;
}

const VideoSwiper: React.FC = () => {
  const { t } = useTranslation();

  const { activeLanguage } = useUserConfiguration();

  const {
    data: videoData,
    isLoading,
    isError,
  } = useQuery<Video[]>({
    queryKey: ["videos"],
    queryFn: () => videosService.getVideos(),
    staleTime: 31 * 24 * 60 * 60 * 1000, // 31 days in milliseconds
  });

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const swiperRef = useRef<any>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const handleVideoClick = async (video: Video) => {
    try {
      const streamingUrl = await videosService.getStreamingUrl(video.url);
      setSelectedVideoUrl(streamingUrl);
      setSelectedVideo(video);
    } catch (err) {
      console.error(err);
    }
  };
  const handleSwiperInit = (swiper: any) => {
    swiperRef.current = swiper;
    updateButtonState();

    if (prevRef.current)
      prevRef.current.style.opacity = swiper.isBeginning ? "0.5" : "1";
    if (nextRef.current)
      nextRef.current.style.opacity = swiper.isEnd ? "0.5" : "1";
  };

  const updateButtonState = () => {
    if (swiperRef.current) {
      const { isBeginning, isEnd } = swiperRef.current;
      if (prevRef.current)
        prevRef.current.style.opacity = isBeginning ? "0.5" : "1";
      if (nextRef.current) nextRef.current.style.opacity = isEnd ? "0.5" : "1";
    }
  };

  const getTitle = (video: Video): string => {
    try {
      return video.title[activeLanguage];
    } catch {
      return video.title["en"];
    }
  };

  const getDescription = (video: Video): string => {
    try {
      return video.description[activeLanguage];
    } catch {
      return video.description["en"];
    }
  };

  useEffect(() => {
    if (swiperRef.current) {
      updateButtonState();
    }
  }, [videoData]);

  if (isError) {
    return null;
  }

  try {
    return (
      <div className="relative w-full mb-20 mt-6">
        <div className="mb-6">
          <h2 className="font-body font-medium text-xl">
            {t("menu-page:videos.title")}
          </h2>
        </div>
        <Swiper
          modules={[Navigation, A11y]}
          className="w-full min-h-[10.3rem] flex place-items-center place-content-center"
          spaceBetween={20}
          slidesPerView={3}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 15,
              centeredSlides: true,
            },
            1200: {
              slidesPerView: 3,
              centeredSlides: false,
            },
          }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onInit={handleSwiperInit}
          onSlideChange={updateButtonState}
          onSlideChangeTransitionEnd={updateButtonState}
        >
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <SwiperSlide key={index}>
                  <div className="!rounded-2xl !mb-2 !bg-gray-650 overflow-hidden">
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={140}
                      animation="pulse"
                    />
                  </div>
                  <div className="!rounded-xl !bg-gray-650 overflow-hidden">
                    {" "}
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      animation="pulse"
                    />
                  </div>
                </SwiperSlide>
              ))
            : videoData?.map((video: Video) => (
                <SwiperSlide key={video.url}>
                  <VideoCard
                    title={getTitle(video)}
                    thumbnailUrl={video.thumbnailUrl}
                    thumbnailBase64={video.thumbnailBase64}
                    onClick={() => handleVideoClick(video)}
                  />
                </SwiperSlide>
              ))}
        </Swiper>
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1  z-10 
      bg-gray-650 rounded-full h-12 w-12 flex place-items-center place-content-center lg:-translate-x-16 md:-translate-x-8
           xs:-translate-x-0"
        >
          <button ref={prevRef} className="custom-prev opacity-100">
            <TbChevronLeft size={30} />
          </button>
        </div>
        <div
          className="absolute right-0 top-1/2 transform -translate-y-1 z-10
       bg-gray-650 rounded-full h-12 w-12 flex place-items-center place-content-center lg:translate-x-16 md:translate-x-8
          xs:translate-x-0"
        >
          <button ref={nextRef} className="custom-next opacity-100">
            <TbChevronRight size={30} />
          </button>
        </div>

        {selectedVideo && selectedVideoUrl && (
          <VideoPlayerModal
            title={getTitle(selectedVideo)}
            description={getDescription(selectedVideo)}
            url={selectedVideoUrl}
            onClose={() => {
              setSelectedVideoUrl(null);
              setSelectedVideo(null);
            }}
          />
        )}
      </div>
    );
  } catch (err) {
    console.error(err);
    return null;
  }
};

export default VideoSwiper;
