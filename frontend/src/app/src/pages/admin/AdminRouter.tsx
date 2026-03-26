import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import AdminPage from "./admin-page";
import WorkspaceDetails from "./components/Workspaces/WorkspaceDetails";
import {
  useIsAdmin,
  usePermissions,
} from "../../contexts/AuthProvider";

const AdminRouter: React.FC = () => {
  const isAdmin = useIsAdmin();
  const { isLoadingPermissions } = usePermissions();
  const navigate = useNavigate();

  // Check if user is authorized to access admin pages
  useEffect(() => {
    if (isLoadingPermissions) return;
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoadingPermissions, navigate]);

  if (isLoadingPermissions) {
    return null;
  }

  return (
    <Routes>
      <Route index element={<AdminPage />} />
      <Route path="workspace/:workspaceId" element={<WorkspaceDetails />} />
    </Routes>
  );
};

export default AdminRouter;
