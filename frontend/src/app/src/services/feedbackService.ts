import { objectToFormData } from "../utils/form-data";
import axiosInstance from "./axiosInstance";

export const feedbackService = {
  /**
   * Submit feedback to the server
   * @param feedbackData - The feedback data to be submitted
   * @returns A promise resolving to the server response
   */
  submitFeedback: async (feedbackData: { feedbackType: string }) => {
    try {
      const formData = objectToFormData(feedbackData);

      const response = await axiosInstance.post(
        `/feedback/${feedbackData.feedbackType}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  },
};
