import React from "react";
import { useTranslation } from "react-i18next";

interface GlobalHeadingProps {
  titleKey: string;
  taglineKey?: string;
}

const GlobalHeading: React.FC<GlobalHeadingProps> = ({
  titleKey,
  taglineKey,
}) => {
  const { t } = useTranslation();

  return (
    <div className="text-center flex flex-col place-items-center place-content-center xxxl:mt-[8em] xxl:mt-[5em] lg:mt-[4em] sm:mt-[3em] mt-[3.5em] sm:w-full w-[90%] mx-auto">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl text-white-100 font-headers">
        {t(titleKey)}
      </h1>
      {taglineKey && (
        <p className="text-gray-300 mt-2 font-body text-sm sm:text-lg w-[90%]">
          {t(taglineKey)}
        </p>
      )}
    </div>
  );
};

export default GlobalHeading;
