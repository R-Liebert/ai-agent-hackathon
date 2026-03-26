import { create } from "zustand";
import { Agent } from "../models/agent-model";
import { getAgents } from "../services/agentsService";

// Cache TTL: 4 minutes (slightly under backend's 5-minute cache)
const CACHE_TTL_MS = 4 * 60 * 1000;
// Short backoff to avoid hammering backend during transient outages
const ERROR_BACKOFF_MS = 30 * 1000;

interface AgentsState {
  agents: Agent[];
  selectedAgent: Agent | null;
  showAgentList: boolean;
  agentsLoading: boolean;
  agentsError: string | null;
  showActiveAgentListButton: boolean;
  lastFetchedAt: number | null;
  lastFailedAt: number | null;
  fetchPromise: Promise<void> | null;

  fetchAgents: (forceRefresh?: boolean) => Promise<void>;
  setAgents: (agents: Agent[]) => void;
  selectAgent: (agent: Agent) => void;
  selectAgentById: (id: string) => void;
  handleRemoveAgent: () => void;

  toggleAgentList: () => void;
  openAgentList: () => void;
  closeAgentList: () => void;

  setAgentsLoading: (loading: boolean) => void;
  setAgentsError: (error: string | null) => void;
  resetAgents: () => void;
  clearSelectedAgent: () => void;
  setShowAgentList: (showAgentList: boolean) => void;
  setShowActiveAgentListButton: (show: boolean) => void;
  invalidateCache: () => void;
}

const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  selectedAgent: null,
  showAgentList: false,
  agentsLoading: false,
  agentsError: null,
  showActiveAgentListButton: false,
  lastFetchedAt: null,
  lastFailedAt: null,
  fetchPromise: null,

  fetchAgents: async (forceRefresh = false) => {
    const state = get();

    // Backoff after a failed fetch (unless force refresh)
    if (!forceRefresh && state.lastFailedAt) {
      const failAge = Date.now() - state.lastFailedAt;
      if (failAge < ERROR_BACKOFF_MS) {
        return;
      }
    }

    // Check if cache is still valid (unless force refresh)
    if (!forceRefresh && state.lastFetchedAt) {
      const cacheAge = Date.now() - state.lastFetchedAt;
      if (cacheAge < CACHE_TTL_MS && state.agents.length > 0) {
        return; // Use cached data
      }
    }

    // Deduplicate: if a fetch is already in progress, wait for it
    if (state.fetchPromise) {
      return state.fetchPromise;
    }

    // Create the fetch promise
    const fetchPromise = (async () => {
      set({ agentsLoading: true, agentsError: null });
      try {
        const fetched = await getAgents();
        const currentSelectedAgent = get().selectedAgent;
        const refreshedSelectedAgent = currentSelectedAgent
          ? fetched.find(
              (agent) =>
                String(agent.id) === String(currentSelectedAgent.id)
            ) || null
          : null;

        set({
          agents: fetched,
          selectedAgent: refreshedSelectedAgent,
          agentsLoading: false,
          lastFetchedAt: Date.now(),
          lastFailedAt: null,
          fetchPromise: null,
        });
      } catch (err) {
        console.error("Failed to fetch agents:", err);
        set({
          agentsError: "Failed to load agents",
          agentsLoading: false,
          lastFailedAt: Date.now(),
          fetchPromise: null,
        });
      }
    })();

    set({ fetchPromise });
    return fetchPromise;
  },

  setShowActiveAgentListButton: (showActiveAgentListButton) =>
    set({ showActiveAgentListButton }),
  setShowAgentList: (showAgentList) => set({ showAgentList }),
  setAgents: (agents) =>
    set({ agents, lastFetchedAt: Date.now(), lastFailedAt: null }),
  selectAgent: (agent) =>
    set({ selectedAgent: agent, showActiveAgentListButton: false }),
  selectAgentById: (id) => {
    const agent = get().agents.find((a) => a.id === id) || null;
    set({ selectedAgent: agent, showAgentList: false });
  },
  handleRemoveAgent: () => set({ selectedAgent: null }),

  toggleAgentList: () => {
    set((s) => {
      return { showAgentList: !s.showAgentList };
    });
  },
  openAgentList: () => set({ showAgentList: true }),
  closeAgentList: () => set({ showAgentList: false }),

  setAgentsLoading: (loading) => set({ agentsLoading: loading }),
  setAgentsError: (error) => set({ agentsError: error }),
  clearSelectedAgent: () => set({ selectedAgent: null }),
  invalidateCache: () => set({ lastFetchedAt: null, lastFailedAt: null }),
  resetAgents: () =>
    set({
      selectedAgent: null,
      showAgentList: false,
      agentsLoading: false,
      agentsError: null,
      showActiveAgentListButton: false,
      // Note: we don't reset agents array or lastFetchedAt to preserve cache
    }),
}));

export default useAgentsStore;
