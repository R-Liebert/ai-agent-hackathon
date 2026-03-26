import React from "react";
import { IconType } from "react-icons";

interface AppContentPlaceholderProps {
  Icon?: IconType;
  welcomeText: string;
  isDesktop?: boolean;
}

const AppContentPlaceholder: React.FC<AppContentPlaceholderProps> = ({
  Icon,
  welcomeText,
  isDesktop,
}) => {
  return isDesktop ? (
    <div className="flex flex-col w-full h-full">
      <div className="text-gray-300 text-md xxl:mt-0 mt-4">{welcomeText}</div>
      <div className="flex place-items-center place-content-center w-full h-full text-gray-650 mb-8">
        {Icon && (
          <Icon className="xxxl:text-[38em] xxl:text-[32em] xl:text-[26em] text-[18em]" />
        )}
      </div>
    </div>
  ) : null;
};

export default AppContentPlaceholder;
