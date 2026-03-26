import React from "react";

interface SimpleCitation {
  url: string;
  title: string;
}

interface SimpleCitationsProps {
  citations?: SimpleCitation[];
}

/**
 * Simple citation list component for Leader Chat and History Chat
 * Displays citations from backend with direct links
 */
const SimpleCitations: React.FC<SimpleCitationsProps> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  const handleClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="inline-flex flex-col pt-3 gap-2 mb-3 items-start">
      {citations.map((citation, index) => (
        <button
          key={index}
          onClick={() => handleClick(citation.url)}
          className="citations inline-block cursor-pointer bg-[#4f5d76] px-2 py-0.5 rounded font-medium text-[13px] text-white lowercase hover:bg-[#5a6987] transition-colors"
          title={citation.title}
        >
          {`${index + 1} - ${citation.title}`}
        </button>
      ))}
    </div>
  );
};

export default SimpleCitations;