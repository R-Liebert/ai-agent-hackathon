import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useRouteChanger } from "../../utils/navigation";
import MainNav from "../MainNavigation/MainNavigation";
import { Helmet } from "react-helmet-async";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";

interface GenericErrorPageProps {
  errorType: string;
  title: string;
  description: string;
  image: string;
  pageTitle: string;
  actionsSlot?: ReactNode;
}

const GenericErrorPageContent: React.FC<GenericErrorPageProps> = ({
  errorType,
  title,
  description,
  image,
  pageTitle,
  actionsSlot,
}) => {
  const { t } = useTranslation();
  const { changeRoute } = useRouteChanger();

  const defaultActions = (
    <div className="flex flex-col sm:flex-row gap-6 mt-10 w-full sm:w-auto">
      <button
        className="flex capitalize rounded-full text-center place-content-center py-3 sm:py-2 px-4 bg-white-100 border-2 border-white-100 text-gray-700 font-semibold leading-normal font-body hover:text-white-100 hover:border-red-600 hover:bg-red-600 transition-color duration-300 ease-out"
        aria-label={t("common:genericPages.newChatButton")}
        onClick={() => changeRoute("/dsb-chat")}
      >
        {t("common:genericPages.newChatButton")}
      </button>
      <button
        className="flex capitalize rounded-full place-content-center text-center py-3 sm:py-2 px-4 bg-gray-600 border-2 border-gray-500 text-white-100 font-medium leading-normal font-body hover:bg-gray-400 hover:border-gray-400 hover:text-superwhite transition-color duration-300 ease-out"
        aria-label={t("common:genericPages.menuPageButton")}
        onClick={() => changeRoute("/")}
      >
        {t("common:genericPages.menuPageButton")}
      </button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle} - AI Launchpad</title>
        <meta name="description" content={pageTitle} />
      </Helmet>
      <MainNav title={pageTitle} />
      <PageTransitionContainer>
        <div className="text-center flex flex-col place-items-center place-content-center xxxl:mt-[9em] xxl:mt-[6em] lg:mt-[5em] mt-[6em] sm:w-full w-[90%] mx-auto">
          <span className="bg-gray-650 px-4 py-1 rounded-full text-gray-300 text-sm mb-2 font-semibold font-body">
            {t("common:genericPages.errorText")} # {t(errorType)}
          </span>
          <h1 className="text-5xl leading-tight md:leading-none w-full sm:w-[90%] text-white-100 font-headers font-medium">
            {t(title)}
          </h1>
          <p className="text-gray-300 mt-3 font-body text-lg w-full sm:w-[38rem]">
            {t(description)}
          </p>
          <div className="mt-10 mx-auto">
            <img
              src={image}
              alt=""
              className="mx-auto w-64 sm:w-80 md:w-[30rem] h-auto object-contain mix-blend-color-dodge"
            />
          </div>
          {actionsSlot ?? defaultActions}
        </div>
      </PageTransitionContainer>
    </>
  );
};

export default GenericErrorPageContent;
