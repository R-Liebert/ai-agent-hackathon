import React from "react";
import { FeedbackType } from "../../pages/feedback/feedbackTypes";

interface Tab {
  id: FeedbackType;
  label: string;
  icon: React.ReactElement;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: FeedbackType;
  onTabChange: (tabId: FeedbackType) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="w-full my-10 flex-wrap gap-3 mx-auto flex place-items-center place-content-center">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex place-items-center place-content-center font-body w-full sm:w-auto text-md rounded-xl items-center gap-2 py-[.66rem] px-4 transition-colors duration-300 ${
            activeTab === tab.id
              ? "bg-white-200 text-gray-700 font-semibold"
              : "text-gray-300 bg-gray-600 font-medium"
          }`}
        >
          {React.cloneElement(tab.icon, {
            strokeWidth: activeTab === tab.id ? 2.4 : 1.6,
            size: tab.id === "applicationRating" ? 21 : 24,
          })}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;
