import React, { useState, useEffect } from "react";
import Tooltip from "../Global/Tooltip";
import { IoClose } from "react-icons/io5";
import { TbUserStar } from "react-icons/tb";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import useAgentsStore from "../../stores/agentsStore";
import AgentAvatar from "./AgentAvatar";

const AgentsTab: React.FC = ({}) => {
  const {
    selectedAgent,
    handleRemoveAgent,
    showAgentList,
    setShowAgentList,
    fetchAgents,
    resetAgents,
    setShowActiveAgentListButton,
    showActiveAgentListButton,
  } = useAgentsStore();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const toggleAgentList = () => {
    setShowActiveAgentListButton(!showActiveAgentListButton);
  };

  useEffect(() => {
    fetchAgents(); // Fetch agents when the component mounts
  }, []);
  return (
    <div className="flex items-start">
      <motion.button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          toggleAgentList();
        }}
        className={`flex items-center pl-2 ${
          selectedAgent ? "gap-1" : "gap-2"
        } ${
          selectedAgent && isHovered ? "pr-2" : "pr-3"
        } py-1.5 border rounded-full transition-colors duration-200 ${
          showAgentList
            ? "bg-blue-500 border-blue-500 text-superwhite"
            : "bg-transparent border-gray-400 text-white-100 hover:bg-gray-400"
        }`}
        aria-pressed={showAgentList}
        animate={{
          paddingRight: selectedAgent && isHovered ? "8px" : "12px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {selectedAgent ? (
          <>
            <AgentAvatar
              image={selectedAgent.image}
              name={selectedAgent.name}
              textClassName="text-xs"
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-sm ml-1 text-white capitalize font-medium font-body">
              {selectedAgent.name}
            </span>
            {isHovered && (
              <Tooltip text={t("components:chatInput.removeAgent")} useMui>
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAgent();
                    setShowAgentList(false);
                    resetAgents();
                  }}
                  className="flex items-center justify-center rounded-full hover:bg-blue-600 transition-colors"
                  aria-label={t("components:chatInput.removeAgent")}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    scale: isHovered ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <IoClose strokeWidth={1.2} size={17} />
                </motion.button>
              </Tooltip>
            )}
          </>
        ) : (
          <>
            <TbUserStar size={19} color="white" strokeWidth={1.4} />
            <span className="text-sm text-white-100 capitalize font-medium font-body">
              Agents
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default AgentsTab;
