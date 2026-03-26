import axiosInstance from "./axiosInstance";
import {
  Agent,
  AgentApiInput,
  normalizeAgentFromApi,
} from "../models/agent-model";

export class AgentsService {
  /**
   * Fetch all available agents from the API
   * @returns Promise<Agent[]>
   */
  static async getAgents(): Promise<Agent[]> {
    try {
      const response = await axiosInstance.get<AgentApiInput[]>("/chat/agents");
      return (response.data ?? []).map(normalizeAgentFromApi);
    } catch (error) {
      console.error("Error fetching agents:", error);
      throw error;
    }
  }
}

// Named function exports for easier importing
export const getAgents = (): Promise<Agent[]> => {
  return AgentsService.getAgents();
};

export default AgentsService;
