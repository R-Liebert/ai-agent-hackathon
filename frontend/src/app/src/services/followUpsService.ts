import axiosInstance from "./axiosInstance";

export class FollowUpsService {
  /**
   * Fetch socratic questions for the last assistant message in a chat
   * @param chatId - The ID of the chat
   * @returns Promise<string[]>
   */
  static async getSocraticQuestions(chatId: string): Promise<string[]> {
    try {
      const response = await axiosInstance.get(
        `chat/socratic-questions/${chatId}`
      );

      // Extract socraticQuestions from the response
      return response.data.socraticQuestions || [];
    } catch (error) {
      console.error("Error fetching socratic questions:", error);
      throw error;
    }
  }

  /**
   * Fetch follow-up questions for the last assistant message in a chat
   * @param chatId - The ID of the chat
   * @returns Promise<string[]>
   */
  static async getFollowUps(chatId: string): Promise<string[]> {
    try {
      const response = await axiosInstance.get(`chat/follow-ups/${chatId}`);

      // Extract follow-up questions from the response
      return (
        response.data.followUpQuestions ||
        response.data.followUps ||
        response.data.examplePrompts ||
        []
      );
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      throw error;
    }
  }
}

// Named function exports for easier importing
export const getSocraticQuestions = (chatId: string): Promise<string[]> => {
  return FollowUpsService.getSocraticQuestions(chatId);
};

export const getFollowUps = (chatId: string): Promise<string[]> => {
  return FollowUpsService.getFollowUps(chatId);
};

export default FollowUpsService;
