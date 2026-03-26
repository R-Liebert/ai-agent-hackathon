import React, { useCallback } from 'react';

interface TabSelectorProps<T extends string> {
  tabs: Array<{ label: T; content: string }>;
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
  renderTabButton?: (tab: { label: T; content: string }, isActive: boolean) => React.ReactNode;
}

export const TabSelector = React.memo(<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  renderTabButton
}: TabSelectorProps<T>) => {
  const handleTabClick = useCallback((tab: T) => {
    onTabChange(tab);
  }, [onTabChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, tab: T, index: number) => {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      onTabChange(tabs[index - 1].label);
    } else if (event.key === 'ArrowRight' && index < tabs.length - 1) {
      event.preventDefault();
      onTabChange(tabs[index + 1].label);
    } else if (event.key === 'Home') {
      event.preventDefault();
      onTabChange(tabs[0].label);
    } else if (event.key === 'End') {
      event.preventDefault();
      onTabChange(tabs[tabs.length - 1].label);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTabChange(tab);
    }
  }, [tabs, onTabChange]);

  if (renderTabButton) {
    return (
      <div className={`flex ${className}`} role="tablist">
        {tabs.map((tab, index) => (
          <div
            key={tab.label}
            role="tab"
            tabIndex={activeTab === tab.label ? 0 : -1}
            aria-selected={activeTab === tab.label}
            onClick={() => handleTabClick(tab.label)}
            onKeyDown={(e) => handleKeyDown(e, tab.label, index)}
            className="cursor-pointer"
          >
            {renderTabButton(tab, activeTab === tab.label)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex space-x-4 w-full mb-2 ${className}`} role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab.label}
          role="tab"
          tabIndex={activeTab === tab.label ? 0 : -1}
          aria-selected={activeTab === tab.label}
          onClick={() => handleTabClick(tab.label)}
          onKeyDown={(e) => handleKeyDown(e, tab.label, index)}
          className={`px-4 py-2 rounded-xl transition-colors duration-200 ${
            activeTab === tab.label
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}) as <T extends string>(props: TabSelectorProps<T>) => JSX.Element;

(TabSelector as any).displayName = 'TabSelector';