import React from "react";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SuggestionChipsRow } from "./SuggestionChipsRow";

interface SuggestionChipsContainerProps {
  suggestionChips: string[];
  isLoadingFollowUps: boolean;
  onPromptSelect: (prompt: string) => void;
  isStreaming: boolean;
}

export const SuggestionChipsContainer: React.FC<
  SuggestionChipsContainerProps
> = ({ suggestionChips, isLoadingFollowUps, onPromptSelect, isStreaming }) => {
  const { t } = useTranslation();

  if (!suggestionChips.length && !isLoadingFollowUps) {
    return null;
  }

  return (
    <div className="w-full mx-auto relative max-w-3xl mb-2">
      <div className="">
        {isLoadingFollowUps ? (
          <div className="flex items-center justify-center py-1">
            <CircularProgress
              size={18}
              sx={{ color: "#FFFFFF", marginRight: 1 }}
            />
            <span className="text-gray-300 text-md">
              {t(
                "components:chatInput.loadingFollowUps",
                "Loading suggestions..."
              )}
            </span>
          </div>
        ) : (
          <SuggestionChipsRow
            prompts={suggestionChips}
            onSelect={onPromptSelect}
            disabled={isStreaming}
          />
        )}
      </div>
    </div>
  );
};
