import React, { useMemo } from "react";

export const mockAccount = {
  homeAccountId: "mock-home-id",
  localAccountId: "mock-local-id",
  environment: "mock-env",
  tenantId: "mock-tenant-id",
  username: "mock-user@example.com",
  name: "Mock User",
};

export const useMsal = () => {
  const instance = useMemo(() => ({
    loginRedirect: async () => {},
    loginPopup: async () => {},
    logoutRedirect: async () => {},
    logoutPopup: async () => {},
    acquireTokenSilent: async () => ({ accessToken: "mock-token" }),
    acquireTokenPopup: async () => ({ accessToken: "mock-token" }),
    acquireTokenRedirect: async () => {},
    getAllAccounts: () => [mockAccount],
    getActiveAccount: () => mockAccount,
    setActiveAccount: () => {},
    addEventCallback: () => {},
  }), []);

  return {
    instance,
    accounts: [mockAccount],
    inProgress: "none",
  };
};

export const useIsAuthenticated = () => true;

export const AuthenticatedTemplate = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const UnauthenticatedTemplate = ({ children }: { children: React.ReactNode }) => null;
export const MsalProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
