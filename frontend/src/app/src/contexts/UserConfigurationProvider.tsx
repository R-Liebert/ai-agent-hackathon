import React, { createContext, useState, ReactNode, useCallback, useEffect, useContext, FC, useMemo } from "react";
import { useMsal } from "../hooks/useMsalMock";
import { UserSettings } from "../models/persona-config";
import { getConfiguration, setLanguage } from "../services/personaConfig";
import { useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { AccountInfo } from "../hooks/useMsalMock";

interface UserConfigurationContext {
  account: AccountInfo | null;
  userSettings: UserSettings | null;
  activeLanguage: string;
  changeLanguage: (code: string) => Promise<void>;
  updateUserSettings: (newSettings: UserSettings) => void;
  isLoading: boolean;
  error: string | null;
}

const UserConfigurationContext = createContext<UserConfigurationContext | undefined>(undefined);

export const useUserConfiguration = () => {
  const context = useContext(UserConfigurationContext);
  if (context === undefined) {
    throw new Error("useUserConfiguration must be used within a UserConfigurationProvider");
  }
  return context;
};

type UserConfigurationProviderProps = {
  children: ReactNode;
};

const DEFAULT_LANGUAGE_CODE = "en";

export const UserConfigurationProvider: FC<UserConfigurationProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const { accounts } = useMsal();
  const account = accounts[0] || null;
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string>(DEFAULT_LANGUAGE_CODE);

  const getUserSettings = useCallback(async () => {
    try {
      const config = await getConfiguration();
      return config?.data;
    } catch (error) {
      console.error("Failed to fetch user settings:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getUserSettings().then((settings) => {
      setUserSettings(settings);
      if (settings?.preferedLanguage) {
        i18n.changeLanguage(settings.preferedLanguage);
        setActiveLanguage(settings.preferedLanguage);
      }
      setIsLoading(false);
    });
  }, [getUserSettings, i18n]);

  const changeLanguage = useCallback(
    async (code: string) => {
      try {
        i18n.changeLanguage(code);
        setActiveLanguage(code);
        setUserSettings((prev) => (prev ? { ...prev, preferedLanguage: code } : null));
        await setLanguage(code);
      } catch (error) {
        console.error("Failed to change language:", error);
      }
    },
    [i18n]
  );

  const updateUserSettings = useCallback((newSettings: UserSettings) => {
    setUserSettings(newSettings);
  }, []);

  const contextValue = useMemo(
    () => ({
      account,
      userSettings,
      activeLanguage,
      changeLanguage,
      updateUserSettings,
      isLoading,
      error,
    }),
    [account, userSettings, activeLanguage, changeLanguage, updateUserSettings, isLoading, error]
  );

  return <UserConfigurationContext.Provider value={contextValue}>{children}</UserConfigurationContext.Provider>;
};

export default UserConfigurationProvider;
