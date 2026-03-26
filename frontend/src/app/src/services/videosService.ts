import axiosInstance from "./axiosInstance";

export const getVideos = async () => {
  const response = await axiosInstance.get(`/videos`);
  return response.data;
};

export const getStreamingUrl = async (videoUrl: string) => {
  const response = await axiosInstance.get(
    `/videos/streaming-url?videoUrl=${videoUrl}`
  );
  return response.data;
};

export const videosService = {
  getVideos,
  getStreamingUrl
};
