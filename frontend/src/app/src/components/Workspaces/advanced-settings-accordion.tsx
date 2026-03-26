import React, { useState } from "react";
import { TbSettingsSpark, TbChevronDown } from "react-icons/tb";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type AdvancedSettingsAccordionProps = {
  children: React.ReactNode;
};

const AdvancedSettingsAccordion = ({
  children,
}: AdvancedSettingsAccordionProps) => {
  const [showAdvancedSettings, setShowAdvancedSettings] =
    useState<boolean>(false);

  const toggleAdvancedSettings = () => {
    setShowAdvancedSettings(!showAdvancedSettings);
  };
  const { t } = useTranslation();

  return (
    <motion.section
      id="advanced"
      initial={{ maxHeight: 70, overflow: "hidden" }}
      animate={{
        maxHeight: showAdvancedSettings ? 2000 : 70,
        overflow: "hidden",
      }}
      exit={{ maxHeight: 0, overflow: "hidden" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex flex-col bg-gray-700 border-2 border-gray-500 w-full rounded-2xl mt-6"
    >
      <motion.button
        initial={{ backgroundColor: "transparent" }}
        animate={{
          backgroundColor: showAdvancedSettings ? "#292929" : "transparent",
        }}
        exit={{ backgroundColor: "transparent" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        onClick={toggleAdvancedSettings}
        className="p-4 flex space-between w-full font-body items-center"
      >
        <div className="flex items-center">
          <TbSettingsSpark size={32} strokeWidth={1.6} />
          <span className="ml-3 text-lg">
            {t("workspaces:common:form:navigationTabs.advanced")}
          </span>
        </div>
        <motion.div
          className="ml-auto mr-0"
          animate={{ rotate: showAdvancedSettings ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <TbChevronDown size={24} strokeWidth={2} />
        </motion.div>
      </motion.button>
      {showAdvancedSettings && <div className="px-6 pt-0 pb-2">{children}</div>}
    </motion.section>
  );
};

export default AdvancedSettingsAccordion;
