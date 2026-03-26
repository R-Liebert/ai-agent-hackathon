import { useNavigate } from "react-router-dom";

export const useRouteChanger = () => {
  const navigate = useNavigate();

  const changeRoute = (route: string) => {
    navigate(route);
  };

  return { changeRoute };
};

export const getTransitionStyle = (
  isSidebarOpen: boolean,
  moduleMarginLeft: string = "13rem"
): React.CSSProperties => {
  return {
    marginLeft: isSidebarOpen ? moduleMarginLeft : "0",
    transition: "all 400ms cubic-bezier(0.25, 0.8, 0.25, 1)",
    transitionDelay: isSidebarOpen ? "0.1s" : "0s",
  };
};
