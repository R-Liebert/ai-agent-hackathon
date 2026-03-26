import { useState, useEffect, useCallback } from 'react';

export interface UsePersistedTabOptions<T> {
  defaultValue: T;
  storageKey: string;
  validate?: (value: unknown) => value is T;
}

export interface UsePersistedTabResult<T> {
  activeTab: T;
  setActiveTab: (tab: T) => void;
  resetToDefault: () => void;
}

export const usePersistedTab = <T extends string>({
  defaultValue,
  storageKey,
  validate
}: UsePersistedTabOptions<T>): UsePersistedTabResult<T> => {
  
  const [activeTab, setActiveTabState] = useState<T>(() => {
    try {
      const savedTab = localStorage.getItem(storageKey);
      if (savedTab) {
        // If validate function provided, use it to check the value
        if (validate) {
          return validate(savedTab) ? savedTab : defaultValue;
        }
        // Otherwise, assume the saved value is valid
        return savedTab as T;
      }
    } catch (error) {
      console.warn(`[usePersistedTab] Failed to read from localStorage for key "${storageKey}":`, error);
    }
    return defaultValue;
  });

  const setActiveTab = useCallback((tab: T) => {
    try {
      localStorage.setItem(storageKey, tab);
      setActiveTabState(tab);
    } catch (error) {
      console.warn(`[usePersistedTab] Failed to save to localStorage for key "${storageKey}":`, error);
      // Still update state even if localStorage fails
      setActiveTabState(tab);
    }
  }, [storageKey]);

  const resetToDefault = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setActiveTabState(defaultValue);
    } catch (error) {
      console.warn(`[usePersistedTab] Failed to remove from localStorage for key "${storageKey}":`, error);
      // Still reset state even if localStorage fails
      setActiveTabState(defaultValue);
    }
  }, [storageKey, defaultValue]);

  // Sync state with localStorage when the tab changes externally
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          if (validate) {
            if (validate(event.newValue)) {
              setActiveTabState(event.newValue);
            }
          } else {
            setActiveTabState(event.newValue as T);
          }
        } catch (error) {
          console.warn(`[usePersistedTab] Failed to sync storage change for key "${storageKey}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, validate]);

  return {
    activeTab,
    setActiveTab,
    resetToDefault
  };
};