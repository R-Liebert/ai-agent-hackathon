import React from "react";
import { Route, Navigate } from "react-router-dom";
import Layout from "../../components/MaaS/Layout";
import CreateSubscriptionPage from "./create-subscription";
import ModelsDiscoveryPage from "./models-discovery";
import SubscriptionDetailsPage from "./subscription-details";
import ConfigureSubscriptionPage from "./configure-subscription.tsx";
import ModelDetailsPage from "./model-details";
import AdminDashboard from "./admin-dashboard";
import AddNewModelPage from "./add-new-model.tsx";
import ConfigureModelPage from "./configure-model";
import { useSubscriptionsStore } from "../../stores/maasStore";

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const isAdmin = useSubscriptionsStore((s) => s.admin.isAdmin);
  return isAdmin ? <>{children}</> : <Navigate to="/maas" replace />;
}

export function useSubscriptionRouter(): React.ReactNode {
  return (
    <Route path="/maas" element={<Layout />}>
      {/* Public (non-admin) */}
      <Route index element={<ModelsDiscoveryPage />} />
      <Route
        path=":subscriptionId/create"
        element={<CreateSubscriptionPage />}
      />
      <Route path=":subscriptionId" element={<SubscriptionDetailsPage />} />
      <Route path="model/:modelId" element={<ModelDetailsPage />} />

      {/* Admin-only */}
      <Route
        path=":subscriptionId/configure"
        element={
          <RequireAdmin>
            <ConfigureSubscriptionPage />
          </RequireAdmin>
        }
      />
      <Route
        path="model/:modelId/configure"
        element={
          <RequireAdmin>
            <ConfigureModelPage />
          </RequireAdmin>
        }
      />
      <Route
        path="add-new-model"
        element={
          <RequireAdmin>
            <AddNewModelPage />
          </RequireAdmin>
        }
      />
      <Route
        path="dashboard"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
    </Route>
  );
}
