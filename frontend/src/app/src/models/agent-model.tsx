export interface Agent {
  id: string; // Changed from number to string (UUID)
  name: string;
  description?: string | null;
  image?: string | null;
  tools: string[];
}

export interface AgentApiInput {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  image?: string | null;
  tools?: string[] | null;
}

export interface AgentSnapshotInput {
  id?: string | null;
  agentId?: string | null;
  // PascalCase keys are intentionally supported to match backend/.NET payload variants.
  Id?: string | null;
  AgentId?: string | null;
  name?: string | null;
  fullName?: string | null;
  AgentName?: string | null;
  description?: string | null;
  summary?: string | null;
  AgentDescription?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  ImageUrl?: string | null;
  Avatar?: string | null;
  tools?: unknown;
  Tools?: unknown;
}

export const DATA_ANALYST_AGENT_TOOL = "data_analyst";

export const normalizeAgentTools = (tools: unknown): string[] =>
  Array.isArray(tools)
    ? tools.filter((tool): tool is string => typeof tool === "string")
    : [];

export const normalizeAgentFromApi = (agent: AgentApiInput): Agent => ({
  id: String(agent.id ?? ""),
  name: String(agent.name ?? ""),
  description: agent.description ?? null,
  image: agent.image ?? null,
  tools: normalizeAgentTools(agent.tools),
});

export const normalizeAgentFromSnapshot = (
  agent?: AgentSnapshotInput | null
): Agent | undefined => {
  if (!agent) return undefined;

  const normalized: Agent = {
    id: String(agent.id ?? agent.agentId ?? agent.Id ?? agent.AgentId ?? ""),
    name: String(agent.name ?? agent.fullName ?? agent.AgentName ?? ""),
    description:
      agent.description ?? agent.summary ?? agent.AgentDescription ?? null,
    image: agent.image ?? agent.avatarUrl ?? agent.ImageUrl ?? agent.Avatar ?? null,
    tools: normalizeAgentTools(agent.tools ?? agent.Tools),
  };

  if (!normalized.id && !normalized.name) {
    return undefined;
  }

  return normalized;
};

export const getAgentTools = (agent?: { tools?: string[] | null } | null) =>
  agent?.tools ?? [];

export const agentHasTool = (
  agent: { tools?: string[] | null } | null | undefined,
  tool: string
) => getAgentTools(agent).includes(tool);

export const getAgentSecondaryText = (
  agent?: {
    description?: string | null;
  } | null
): string | null => {
  const description = agent?.description?.trim();
  return description || null;
};
