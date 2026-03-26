import React, { createContext, ReactNode, useEffect, useState, useCallback, useContext } from "react";
import { useMsal } from "@azure/msal-react";
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
  const [isRegistrationChecked, setIsRegistrationChecked] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!accounts.length) return;

    setIsLoadingPermissions(true);
    try {
      // Check sessionStorage first
      const cachedPermissions = sessionStorage.getItem("userPermissions");
      if (cachedPermissions) {
        const parsedPermissions = JSON.parse(cachedPermissions) as
          | Partial<UserPermissions>
          | null;
        setPermissions({
          isLeader: parsedPermissions?.isLeader ?? false,
          canUseTrafficInformation:
            parsedPermissions?.canUseTrafficInformation ?? false,
          isTrafficInformationAdmin:
            parsedPermissions?.isTrafficInformationAdmin ?? false,
          isAdmin: parsedPermissions?.isAdmin ?? false,
        });
        setIsLoadingPermissions(false);
        return;
      }

      // Fetch all permissions with single API call
      const response = await axiosInstance.get(`/Auth/permissions/${accounts[0].localAccountId}`);
      
      const responsePermissions = response.data as Partial<UserPermissions>;
      const userPermissions: UserPermissions = {
        isLeader: responsePermissions?.isLeader ?? false,
        canUseTrafficInformation:
          responsePermissions?.canUseTrafficInformation ?? false,
        isTrafficInformationAdmin:
          responsePermissions?.isTrafficInformationAdmin ?? false,
        isAdmin: responsePermissions?.isAdmin ?? false,
      };

      setPermissions(userPermissions);
      sessionStorage.setItem("userPermissions", JSON.stringify(userPermissions));
      // Clear old permission keys for backward compatibility
      sessionStorage.removeItem("isLeader");
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      // Set default permissions on error
      setPermissions({
        isLeader: false,
        canUseTrafficInformation: false,
        isTrafficInformationAdmin: false,
        isAdmin: false,
      });
      // Re-throw the error so the caller can handle it
      throw error;
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [accounts]);

  const refetchPermissions = useCallback(async () => {
    // Clear cache and refetch
    sessionStorage.removeItem("userPermissions");
    // Clear old permission keys for backward compatibility
    sessionStorage.removeItem("isLeader");
    sessionStorage.removeItem("canUseTrafficInformation");
    sessionStorage.removeItem("isTrafficInformationAdmin");
    sessionStorage.removeItem("isAdmin");
    await fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    const checkUserRegistration = async () => {
      if (isRegistrationChecked || !accounts.length) return;

      try {
        const response = await axiosInstance.get(`/users/register`);

        if (response.status === 200) {
          console.log("User registration checked successfully");
          setIsRegistrationChecked(true);
          sessionStorage.setItem("registrationChecked", "true");
          // Fetch permissions after successful registration check
          fetchPermissions();
        } else {
          console.error("Failed to check user registration");
        }
      } catch (error) {
        console.error("Error checking user registration:", error);
      }
    };

    if (sessionStorage.getItem("registrationChecked") === "true") {
      setIsRegistrationChecked(true);
      // Also fetch permissions if already registered
      fetchPermissions();
    } else {
      checkUserRegistration();
    }
  }, [accounts, isRegistrationChecked, fetchPermissions]);

  const contextValue = React.useMemo(
    () => ({
      isRegistrationChecked: isRegistrationChecked,
      permissions,
      isLoadingPermissions,
      refetchPermissions,
    }),
    [isRegistrationChecked, permissions, isLoadingPermissions, refetchPermissions]
  );

  if (!isRegistrationChecked) {
    return null;
  }

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
  const { permissions } = usePermissions();
  const config: Config = window.env;
  // Also return true in test environment, consistent with component logic
  return (permissions?.isLeader ?? false) || config.environment === "tst";
};

export const useCanUseTrafficInformation = () => {
  const { permissions } = usePermissions();
  return permissions?.canUseTrafficInformation ?? false;
};

export const useIsTrafficInformationAdmin = () => {
  const { permissions } = usePermissions();
  return permissions?.isTrafficInformationAdmin ?? false;
};

export const useIsAdmin = () => {
  const { permissions } = usePermissions();
  return permissions?.isAdmin ?? false;
};
