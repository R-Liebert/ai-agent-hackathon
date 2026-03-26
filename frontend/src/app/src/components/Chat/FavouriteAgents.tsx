import React, { useCallback, useState, useEffect } from "react";
import { BiSolidHide } from "react-icons/bi";
import { FiMoreHorizontal } from "react-icons/fi";
import { StyledPopover } from "../StyledPopover";
import DropdownMenuButton from "../Global/DropdownMenuButton";
import { Agent, getAgentSecondaryText } from "../../models/agent-model";
import useAgentsStore from "../../stores/agentsStore";
import AgentAvatar from "./AgentAvatar";

const FavouriteAgents: React.FC = () => {
  // Use shared agents store instead of local state
  const { agents, agentsLoading, agentsError, fetchAgents } = useAgentsStore();

  // State to store unpinned agent IDs
  const [unpinnedAgents, setUnpinnedAgents] = useState<Agent[]>([]);

  // State for the popover (dropdown menu)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  // Fetch agents when component mounts (will use cache if available)
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Function to unpin an agent
  const handleUnpinAgent = useCallback(
    (agent: Agent) => {
      if (!unpinnedAgents.find((a) => a.id === agent.id)) {
        setUnpinnedAgents((prev) => [...prev, agent]);
      }
    },
    [unpinnedAgents]
  );

  // Function to handle the three dots (menu) click
  const handleThreeDotsClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, agent: Agent) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setActiveAgent(agent);
    },
    []
  );

  // Function to close the popover
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setActiveAgent(null);
  }, []);

  // Function to check if an agent is unpinned
  const isUnpinned = (agent: Agent) =>
    unpinnedAgents.some((a) => a.id === agent.id);

  return (
    <div className="py-2 pr-3">
      {/* Header */}
      <span className="flex font-body text-sm pb-1 text-gray-300 mb-2 ml-2">
        Favourite Agents
      </span>

      {/* List of all agents (not unpinned) */}
      <ul className="space-y-1">
        {agents
          .filter((agent) => !isUnpinned(agent))
          .map((agent) => {
            const secondaryText = getAgentSecondaryText(agent);

            return (
              <li
                key={agent.id}
                className={`group relative rounded-lg hover:bg-gray-600 ${
                  activeAgent?.id === agent.id ? "bg-neutral-800" : ""
                }`}
              >
                <div
                  role="button"
                  className="w-full flex items-center px-3 py-2 text-sm font-normal rounded-lg"
                >
                  {/* Agent image */}
                  <AgentAvatar
                    image={agent.image}
                    name={agent.name}
                    textClassName="text-[10px]"
                    className="w-4 h-4 rounded-full object-cover"
                  />

                  {/* Agent name and description */}
                  <span className="ml-4 min-w-0 flex-1 pr-8">
                    <span className="block truncate text-white-100">
                      {agent.name}
                    </span>
                    {secondaryText && (
                      <span className="block truncate text-xs text-gray-300">
                        {secondaryText}
                      </span>
                    )}
                  </span>

                  {/* Three dots menu button */}
                  <div className="flex items-center absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100">
                    <button
                      className="!text-gray-300 hover:!text-white-100 mr-1"
                      aria-label={agent.name}
                      onClick={(e) => handleThreeDotsClick(e, agent)}
                    >
                      <FiMoreHorizontal size={22} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
      {/* Popover (dropdown menu) */}
      <StyledPopover
        open={activeAgent !== null}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <DropdownMenuButton
          key={activeAgent?.id}
          Icon={<BiSolidHide fontSize={20} />}
          label={"Hide from sidebar"}
          onClick={() => {
            if (activeAgent) handleUnpinAgent(activeAgent);
            handleClose();
          }}
          gap={2}
        />
      </StyledPopover>
    </div>
  );
};

export default FavouriteAgents;
