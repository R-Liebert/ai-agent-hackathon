import { useEffect, useState, useCallback, useRef } from "react";
import { getFollowUps } from "../services/followUpsService";
import { ChatMessage } from "../models/chat-message";

interface UseFollowUpsOptions {
  // Chat ID for fetching follow-ups
  chatId?: string;
  // Whether the hook should perform the fetch when conditions are met
  shouldFetch?: boolean;
}

interface UseFollowUpsResult {
  socraticQuestions: string[];
  examplePrompts: string[];
  isLoading: boolean;
  error: Error | null;
  fetchFollowUps: () => void;
}

export const useFollowUps = (
  message: ChatMessage | null,
  options: UseFollowUpsOptions = {}
): UseFollowUpsResult => {
  const { chatId, shouldFetch = true } = options;

  const [socraticQuestions, setSocraticQuestions] = useState<string[]>([]);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track whether we've already attempted to fetch for this message instance
  const hasFetchedRef = useRef(false);

  // Reset fetch flag when message id changes (new assistant message)
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [message?.id]);

  // Function to fetch follow-up questions
  const fetchFollowUps = useCallback(async () => {
    if (hasFetchedRef.current) return; // guard
    if (!chatId) return;

    hasFetchedRef.current = true; // mark as attempted

    setIsLoading(true);
    setError(null);

    try {
      const followUpQuestions = await getFollowUps(chatId);
      setExamplePrompts(followUpQuestions);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching follow-up questions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  // Clear follow-ups when message changes, don't auto-fetch
  useEffect(() => {
    console.log("useFollowUps effect:", {
      hasContent: !!message?.content,
      chatId,
      messageId: message?.id,
    });

    // Clear previous follow-ups when message changes
    setExamplePrompts([]);
    setSocraticQuestions([]);
  }, [message?.id, chatId]);

  return {
    socraticQuestions,
    examplePrompts,
    isLoading,
    error,
    fetchFollowUps,
  };
};
