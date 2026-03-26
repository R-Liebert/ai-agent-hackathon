import React from "react";
import { useNavigate } from "react-router-dom";

interface GlobalCardProps {
  title: string;
  description?: string;
  icon?: JSX.Element;
  color?: string;
  onClick: () => void;
  imageUrl?: string;
  additionalInfo?: React.ReactNode;
  variant?: "workspace" | "menu";
}

const GlobalCard = ({
  title,
  description,
  icon,
  color = "#0AA996",
  onClick,
  imageUrl,
  additionalInfo,
  variant = "menu",
}: GlobalCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onClick();
  };

  return (
    <button
      className=" flex flex-col xs:flex-row w-full bg-transparent hover:bg-gray-600 active:bg-gray-600 border-2 rounded-2xl border-gray-500 cursor-pointer p-4 font-body text-left self-center xs:place-items-center transition-color duration-300 ease-in-out"
      onClick={handleClick}
    >
      {icon && (
        <div
          className="w-14 h-14 rounded-full flex place-content-center place-items-center text-white-100 mb-2 xs:mb-0"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col xs:ml-4 w-full xs:w-[80%]">
        <div className="text-white-100 text-[1.2rem] font-medium capitalize font-body w-full max-w-full break-words overflow-hidden text-ellipsis whitespace-nowrap">
          {title}
        </div>
        {description && (
          <div className="text-gray-300 text-md">{description}</div>
        )}
        {variant === "workspace" && additionalInfo && (
          <div className="flex mt-1 text-gray-300 text-md">
            {additionalInfo}
          </div>
        )}
      </div>
    </button>
  );
};

export default GlobalCard;
