import { Outlet } from "react-router-dom";
import GlobalContainer from "../../components/Global/AppContainer";
import PageTransitionContainer from "../../components/Global/PageTransitionContainer";
import MainNav from "../MainNavigation/MainNavigation";
import { Suspense } from "react";
import Loader from "../../components/app-loader";
import useSidebarStore from "../../stores/navigationStore";

export default function Layout() {
  const { isSidebarOpen } = useSidebarStore();

  return (
    <PageTransitionContainer>
      <GlobalContainer>
        <MainNav title="Subscription Navigation" />
        <main
          className={`${
            isSidebarOpen ? "px-4 xs:px-8 sm:pr-12 sm:pl-4" : "px-4 xs:px-8"
          } max-w-7xl w-full bg-gray-800 text-white mx-auto`}
        >
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </main>
      </GlobalContainer>
    </PageTransitionContainer>
  );
}
