import React from "react";

interface FallbackComponentProps {
  profileName?: string | null;
}

const FallbackComponent: React.FC<FallbackComponentProps> = ({
  profileName,
}) => {
  return (
    <div className="rounded-full flex justify-center items-center text-center text-2xl bg-gray-200 p-0 w-10 h-10 font-bold leading-relaxed">
      {profileName ? profileName.charAt(0).toUpperCase() : "?"}
    </div>
  );
};

export default FallbackComponent;
