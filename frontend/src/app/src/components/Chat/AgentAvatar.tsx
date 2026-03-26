import React, { useEffect, useState } from "react";

interface AgentAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
  textClassName?: string;
  alt?: string;
}

const getInitial = (name?: string | null) => {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
};

const AgentAvatar: React.FC<AgentAvatarProps> = ({
  name,
  image,
  className = "",
  textClassName = "text-xs",
  alt,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [image]);

  if (image && !hasError) {
    return (
      <img
        src={image}
        alt={alt || name || "Agent avatar"}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt || name || "Agent avatar"}
      className={`flex items-center justify-center rounded-full bg-gray-600 text-white-100 font-semibold leading-none ${textClassName} ${className}`}
    >
      {getInitial(name)}
    </div>
  );
};

export default AgentAvatar;
