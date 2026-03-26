import React, { createContext, useContext } from 'react';
import { useTrafficInformation } from '../hooks/useTrafficInformation';
import { TabKey, TrafficInformationError, SystemPrompts, TabContent } from '../types/trafficInformation';

interface TrafficInformationContextValue {
  // State
  inputText: string;
  activeTab: TabKey;
  tabContents: Record<TabKey, TabContent>;
  isGenerating: boolean;
  systemPrompts: SystemPrompts;
  isLoadingPrompts: boolean;
  error: TrafficInformationError | null;
  tabLanguages: Record<TabKey, 'Danish' | 'English'>;
  
  // Actions
  setInputText: (text: string) => void;
  setActiveTab: (tab: TabKey) => void;
  generateContent: (text?: string) => Promise<void>;
  regenerateContent: (tab: TabKey, language?: 'Danish' | 'English') => Promise<void>;
  stopGeneration: () => void;
  updateSystemPrompts: (prompts: SystemPrompts) => Promise<void>;
  updateTabContent: (tab: TabKey, content: { Danish: string; English: string }) => void;
  clearError: () => void;
  refreshSystemPrompts: () => Promise<void>;
  setTabLanguage: (tab: TabKey, language: 'Danish' | 'English') => void;
  resetAll: () => void;
}

const TrafficInformationContext = createContext<TrafficInformationContextValue | undefined>(undefined);

export const TrafficInformationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const trafficInformation = useTrafficInformation();
  
  return (
    <TrafficInformationContext.Provider value={trafficInformation}>
      {children}
    </TrafficInformationContext.Provider>
  );
};

export const useTrafficInformationContext = (): TrafficInformationContextValue => {
  const context = useContext(TrafficInformationContext);
  if (context === undefined) {
    throw new Error('useTrafficInformationContext must be used within a TrafficInformationProvider');
  }
  return context;
};
