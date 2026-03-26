import React, { createContext, useState, ReactNode, useCallback, useEffect, useContext, FC, useMemo } from "react";
import { useMsal } from "@azure/msal-react";
import { UserSettings } from "../models/persona-config";
import { getConfiguration, setLanguage } from "../services/personaConfig";
import { useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { AccountInfo } from "@azure/msal-browser";

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

/**
 * Custom hook to use the UserConfiguration context
 * @throws {Error} If used outside of UserConfigurationProvider
 */
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

/**
 * Custom hook to manage account state
 */
const useAccount = () => {
  const { accounts } = useMsal();
  const [account, setAccount] = useState<AccountInfo | null>(null);

  useEffect(() => {
    setAccount(accounts.length > 0 ? accounts[0] : null);
  }, [accounts]);

  return account;
};

/**
 * Custom hook to manage user settings state
 */
const useUserSettings = (account: AccountInfo | null) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserSettings = useCallback(async () => {
    try {
      const config = await getConfiguration();
      console.log("Fetching user settings.");
      return config?.data;
    } catch (error) {
      console.error("Failed to fetch user settings:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (account) {
      setIsLoading(true);
      setError(null);
      getUserSettings()
        .then((settings) => {
          setUserSettings(settings);
          setIsLoading(false);
        })
        .catch((error) => {
          setError("Failed to load user settings. Please try again later.");
          setIsLoading(false);
        });
    } else {
      setUserSettings(null);
      setIsLoading(false);
    }
  }, [account, getUserSettings]);

  return { userSettings, setUserSettings, isLoading, error };
};

/**
 * Custom hook to manage language state
 */
const useLanguage = (userSettings: UserSettings | null, i18n: any) => {
  const [activeLanguage, setActiveLanguage] = useState<string>(DEFAULT_LANGUAGE_CODE);

  const setActiveLanguageIntl = useCallback(
    (code: string | undefined | null) => {
      const languageCode = code && code.length > 0 ? code : DEFAULT_LANGUAGE_CODE;
      i18n.changeLanguage(languageCode);
      setActiveLanguage(languageCode);
    },
    [i18n]
  );

  useEffect(() => {
    if (!userSettings) return;

    if (userSettings.preferedLanguage) {
      setActiveLanguageIntl(userSettings.preferedLanguage);
    } else {
      const browserLang = new LanguageDetector().detect(["navigator"]);
      const detectedLang = Array.isArray(browserLang) ? browserLang[0] : browserLang;

      const supportedLangs = i18n.options.supportedLngs;
      if (Array.isArray(supportedLangs) && supportedLangs.includes(detectedLang)) {
        setActiveLanguageIntl(detectedLang);
      } else {
        setActiveLanguageIntl(DEFAULT_LANGUAGE_CODE);
      }
    }
  }, [userSettings, i18n.options.supportedLngs, setActiveLanguageIntl]);

  return { activeLanguage, setActiveLanguageIntl };
};

export const UserConfigurationProvider: FC<UserConfigurationProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const account = useAccount();
  const { userSettings, setUserSettings, isLoading, error } = useUserSettings(account);
  const { activeLanguage, setActiveLanguageIntl } = useLanguage(userSettings, i18n);

  const changeLanguage = useCallback(
    async (code: string) => {
      try {
        setActiveLanguageIntl(code);
        setUserSettings((prev) => (prev ? { ...prev, preferedLanguage: code } : null));
        const success = await setLanguage(code);
        console.log(`The language was ${success ? "successfully" : "not successfully"} changed.`);
      } catch (error) {
        console.error("Failed to change language:", error);
        throw error;
      }
    },
    [setActiveLanguageIntl, setUserSettings]
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
