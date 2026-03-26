import CreateWorkspacePage from "./create-workspace";
import ListWorkspacesPage from "./workspaces-list";
import WorkspaceDetailsPage from "./workspace-details";
import EditWorkspacePage from "./edit-workspace";

import { Route } from "react-router-dom";

export const useWorkspaceRouter = () => {
  return (
    <>
      <Route path="workspaces">
        <Route path="" element={<ListWorkspacesPage />} />
        <Route path=":workspaceId/create" element={<CreateWorkspacePage />} />
        <Route path=":workspaceId" element={<WorkspaceDetailsPage />} />
        <Route path=":workspaceId/edit" element={<EditWorkspacePage />} />
      </Route>
    </>
  );
};
