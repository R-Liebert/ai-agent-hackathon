import { TabKey } from '../types/trafficInformation';

// Mapping from internal tab keys to display names
export const TAB_DISPLAY_NAMES: Record<TabKey, string> = {
  'DSB.dk': 'DSB.dk',
  'Tavle 7': 'Tavle 7',
  'Infoskaerm': 'Infoskærm'
};

// Helper function to get display name for a tab
export const getTabDisplayName = (tabKey: TabKey): string => {
  return TAB_DISPLAY_NAMES[tabKey] || tabKey;
};

// Reverse mapping for when we need to go from display name to internal key
export const DISPLAY_NAME_TO_TAB_KEY: Record<string, TabKey> = {
  'DSB.dk': 'DSB.dk',
  'Tavle 7': 'Tavle 7',
  'Infoskærm': 'Infoskaerm'
};