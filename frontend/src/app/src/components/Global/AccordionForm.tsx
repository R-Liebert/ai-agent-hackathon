import React, { useState } from "react";
import { TbChevronDown } from "react-icons/tb";
import { motion } from "framer-motion";

type AccordionFormProps = {
  children: React.ReactNode;
  label: string;
  icon: React.ReactNode;
};

const AccordionForm = ({ children, label, icon }: AccordionFormProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.section
      id="accordion"
      initial={{ maxHeight: 70, overflow: "hidden" }}
      animate={{
        maxHeight: isExpanded ? 600 : 70,
        overflow: "hidden",
      }}
      exit={{ maxHeight: 0, overflow: "hidden" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex flex-col bg-gray-700 border-2 border-gray-500 w-full rounded-2xl mt-6"
    >
      <motion.button
        type="button"
        initial={{ backgroundColor: "rgba(41, 41, 41, 1)" }}
        animate={{
          backgroundColor: isExpanded
            ? "rgba(41, 41, 41, 1)"
            : "rgba(0, 0, 0, 0)",
        }}
        exit={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        onClick={toggleAccordion}
        className="p-4 flex space-between w-full font-body items-center"
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-3 text-lg">{label}</span>
        </div>
        <motion.div
          className="ml-auto mr-0"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <TbChevronDown size={24} strokeWidth={2} />
        </motion.div>
      </motion.button>
      {isExpanded && <div className="px-6 pt-0 pb-2">{children}</div>}
    </motion.section>
  );
};

export default AccordionForm;
