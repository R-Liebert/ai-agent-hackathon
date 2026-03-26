import { useMsal } from "@azure/msal-react";
import { getAccessToken } from "./msalToken";

export const useMsalApi = () => {
  const { instance, accounts } = useMsal();

  const getTokentWithScopes = async (scopes: string[]): Promise<string> => {
    // Defer to shared function. It already resolves/set active account
    const token = await getAccessToken(scopes);
    return token ?? "";
  };
  return {
    getTokentWithScopes,
  };
};
