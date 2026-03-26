export interface SuggestionChipsRowProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export interface FollowUpsError {
  message: string;
  code?: number;
  retryable?: boolean;
}

export interface ThinkDeeperPanelProps {
  questions: string[];
  collapsedByDefault?: boolean;
  onQuestionSelect?: (question: string) => void; // Optional for now - questions are read-only
  loading?: boolean;
  error?: FollowUpsError | null;
}
