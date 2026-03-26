import axiosInstance from "./axiosInstance";

export const generateImage = async (
  chatDetails: {
    userId: string;
    prompt: string;
    imageCount: number;
    imageSize: string;
    quality: string;
    style: string;
  }
) => {
  const response = await axiosInstance.post("/generator/image", chatDetails);
  return response.data;
};
