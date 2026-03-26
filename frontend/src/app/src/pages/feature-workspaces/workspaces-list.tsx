import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoLayers } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import MainNav from "../../components/MainNavigation/MainNavigation";
import WorkspaceGrid from "../../components/Workspaces/workspace-grid";
import Heading from "../../components/Global/AppHeading";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import Loader from "../../components/app-loader";
import { Helmet } from "react-helmet-async";
import GlobalContainer from "../../components/Global/AppContainer";
import { v4 as uuidv4 } from "uuid";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";
import useSidebarStore from "../../stores/navigationStore";

const ListWorkspacesPage = () => {
  const navigate = useNavigate();
  const { workspaces, isLoading, error } = useWorkspaces();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>();
  const { isSidebarOpen } = useSidebarStore();

  const { t } = useTranslation();

  if (isLoading) {
    return <Loader />;
  }

  const onCreateWorkspaceButtonClick = () => {
    const workspaceId = uuidv4();
    return navigate(`/workspaces/${workspaceId}/create`);
  };

  return (
    <>
      <Helmet>
        <title>Workspaces - AI Launchpad</title>
        <meta name="description" content="Workspaces List Page" />
      </Helmet>
      <MainNav title="Workspaces" />
      <PageTransitionContainer>
        <GlobalContainer>
          <div
            id="workspaces-list"
            className={`${
              isSidebarOpen ? "max-w-2xl lg:max-w-3xl" : "max-w-3xl"
            } container max-w-3xl mx-auto flex flex-col tracking-normal  mt-2 md:mt-0`}
          >
            <Heading
              titleKey="workspaces:listing:textTitle"
              taglineKey="workspaces:listing:textTagline"
            />

            {!isLoading &&
            !error &&
            (!workspaces || workspaces?.length === 0) ? (
              <div className="flex flex-col place-items-center gap-4 bg-gray-600 py-20 rounded-2xl sm:w-[62%] w-[90%]">
                <div className="bg-[#557CA9] w-20 h-20 flex place-content-center place-items-center rounded-full">
                  <IoLayers size={38} className="text-white-100 text-center" />
                </div>

                <p className="font-body text-white-100 text-center w-full">
                  {t("workspaces:listing:noWorkspacesText")}
                </p>
                <button
                  className="flex rounded-full py-3 px-6 bg-white-100 text-gray-800 font-semibold mx-auto leading-normal font-body hover:text-white-100 hover:bg-red-600 transition-color duration-300 ease-out mt-4"
                  aria-label={t("workspaces:listing:mainButton")}
                  onClick={onCreateWorkspaceButtonClick}
                >
                  {t("workspaces:listing:mainButton")}
                </button>
              </div>
            ) : (
              <WorkspaceGrid
                userWorkspaces={workspaces}
                onWorkspaceCardClick={(workspaceId) =>
                  setSelectedWorkspace(workspaceId)
                }
                searchPlaceholder={t(
                  "workspaces:listing:searchBar.placeholder"
                )}
              />
            )}
          </div>
        </GlobalContainer>
      </PageTransitionContainer>
    </>
  );
};

export default ListWorkspacesPage;
