import { useState, useCallback, useMemo } from 'react';
import { TabKey } from '../types/trafficInformation';

type Language = 'Danish' | 'English';

interface TabMemoryState {
  [key: string]: string[];
}

interface UseTabMemoryResult {
  getMemoryForTab: (tab: TabKey, language: Language) => string[];
  addToMemory: (tab: TabKey, language: Language, content: string) => void;
  updateLastInMemory: (tab: TabKey, language: Language, content: string) => void;
  updateMemoryAtIndex: (tab: TabKey, language: Language, index: number, content: string) => void;
  clearMemoryForTab: (tab: TabKey, language: Language) => void;
  clearAllMemory: () => void;
}

export const useTabMemory = (): UseTabMemoryResult => {
  const [memory, setMemory] = useState<TabMemoryState>({});

  const createKey = useCallback((tab: TabKey, language: Language): string => {
    return `${tab}-${language}`;
  }, []);

  const getMemoryForTab = useCallback((tab: TabKey, language: Language): string[] => {
    const key = createKey(tab, language);
    return memory[key] || [];
  }, [memory, createKey]);

  const addToMemory = useCallback((tab: TabKey, language: Language, content: string) => {
    if (!content.trim()) return; // Don't add empty content
    
    const key = createKey(tab, language);
    console.log('💾 [useTabMemory] Adding to memory:', {
      tab,
      language, 
      key,
      contentPreview: content.substring(0, 50) + '...',
      contentLength: content.length
    });
    
    setMemory(prev => {
      const existingMemory = prev[key] || [];
      
      // Don't add duplicates
      if (existingMemory.includes(content)) {
        console.log('💾 [useTabMemory] Content already exists in memory, skipping');
        return prev;
      }
      
      const newMemory = [...existingMemory, content];
      console.log('💾 [useTabMemory] Memory updated:', {
        key,
        previousCount: existingMemory.length,
        newCount: newMemory.length
      });
      
      return {
        ...prev,
        [key]: newMemory
      };
    });
  }, [createKey]);

  const clearMemoryForTab = useCallback((tab: TabKey, language: Language) => {
    const key = createKey(tab, language);
    setMemory(prev => {
      const newMemory = { ...prev };
      delete newMemory[key];
      return newMemory;
    });
  }, [createKey]);

  const updateLastInMemory = useCallback((tab: TabKey, language: Language, content: string) => {
    if (!content.trim()) return;
    
    const key = createKey(tab, language);
    console.log('🔄 [useTabMemory] Updating last item in memory:', {
      tab,
      language,
      key,
      contentPreview: content.substring(0, 50) + '...',
      contentLength: content.length
    });
    
    setMemory(prev => {
      const existingMemory = prev[key] || [];
      
      if (existingMemory.length === 0) {
        // No memory yet, add as first item
        return {
          ...prev,
          [key]: [content]
        };
      }
      
      // Update the last item in memory (for streaming content)
      const updatedMemory = [...existingMemory];
      updatedMemory[updatedMemory.length - 1] = content;
      
      return {
        ...prev,
        [key]: updatedMemory
      };
    });
  }, [createKey]);

  const updateMemoryAtIndex = useCallback((tab: TabKey, language: Language, index: number, content: string) => {
    if (!content.trim()) return;
    
    const key = createKey(tab, language);
    console.log('🔄 [useTabMemory] Updating memory at index:', {
      tab,
      language,
      key,
      index,
      contentPreview: content.substring(0, 50) + '...',
      contentLength: content.length
    });
    
    setMemory(prev => {
      const existingMemory = prev[key] || [];
      
      if (index < 0 || index >= existingMemory.length) {
        console.warn('🔄 [useTabMemory] Index out of bounds:', {
          index,
          memoryLength: existingMemory.length
        });
        return prev;
      }
      
      const updatedMemory = [...existingMemory];
      updatedMemory[index] = content;
      
      console.log('🔄 [useTabMemory] Memory at index updated:', {
        key,
        index,
        previousContent: existingMemory[index].substring(0, 50) + '...',
        newContent: content.substring(0, 50) + '...'
      });
      
      return {
        ...prev,
        [key]: updatedMemory
      };
    });
  }, [createKey]);

  const clearAllMemory = useCallback(() => {
    console.log('🗑️ [useTabMemory] Clearing all tab memory');
    setMemory({});
    console.log('🗑️ [useTabMemory] All tab memory cleared');
  }, []);

  return {
    getMemoryForTab,
    addToMemory,
    updateLastInMemory,
    updateMemoryAtIndex,
    clearMemoryForTab,
    clearAllMemory
  };
};