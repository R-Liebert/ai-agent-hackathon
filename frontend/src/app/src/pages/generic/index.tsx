import NotFoundPage from "../generic/not-found";
import AccessDeniedPage from "../generic/access-denied";
import ServerErrorPage from "./server-error";

import { Route } from "react-router-dom";

export const useGenericRouter = () => {
  return (
    <>
      <Route path="*" element={<NotFoundPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/server-error" element={<ServerErrorPage />} />
    </>
  );
};
