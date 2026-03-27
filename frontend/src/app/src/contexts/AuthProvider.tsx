import React, { createContext, ReactNode, useEffect, useState, useCallback, useContext } from "react";
import { useMsal } from "../hooks/useMsalMock";
import axiosInstance from "../services/axiosInstance";
import { Config } from "../interfaces/interfaces";

interface UserPermissions {
  isLeader: boolean;
  canUseTrafficInformation: boolean;
  isTrafficInformationAdmin: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  isRegistrationChecked: boolean;
  permissions: UserPermissions | null;
  isLoadingPermissions: boolean;
  refetchPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { accounts } = useMsal();
  const [isRegistrationChecked, setIsRegistrationChecked] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>({
    isLeader: true,
    canUseTrafficInformation: true,
    isTrafficInformationAdmin: true,
    isAdmin: true,
  });
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const fetchPermissions = useCallback(async () => {
    // In mock mode, we just keep the default permissions
    setPermissions({
      isLeader: true,
      canUseTrafficInformation: true,
      isTrafficInformationAdmin: true,
      isAdmin: true,
    });
  }, []);

  const refetchPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    // No registration check needed in mock mode
    setIsRegistrationChecked(true);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      isRegistrationChecked: isRegistrationChecked,
      permissions,
      isLoadingPermissions,
      refetchPermissions,
    }),
    [isRegistrationChecked, permissions, isLoadingPermissions, refetchPermissions]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Custom hook specifically for permissions
export const usePermissions = () => {
  const { permissions, isLoadingPermissions, refetchPermissions } = useAuth();
  return { permissions, isLoadingPermissions, refetchPermissions };
};

// Helper hooks for specific permissions
export const useIsLeader = () => {
  return true;
};

export const useCanUseTrafficInformation = () => {
  return true;
};

export const useIsTrafficInformationAdmin = () => {
  return true;
};

export const useIsAdmin = () => {
  return true;
};
