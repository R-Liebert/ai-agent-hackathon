import { useState, useCallback } from 'react';

export const useCopyToClipboard = (resetDelay: number = 2000) => {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = useCallback(async (text: string, key?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (key) {
        setCopiedStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [key]: false }));
        }, resetDelay);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [resetDelay]);

  const isCopied = useCallback((key: string) => {
    return copiedStates[key] || false;
  }, [copiedStates]);

  return {
    copyToClipboard,
    isCopied,
  };
};