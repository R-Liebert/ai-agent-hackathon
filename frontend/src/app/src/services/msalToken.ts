import { AccountInfo, InteractionRequiredAuthError, PopupRequest, PublicClientApplication, RedirectRequest, SilentRequest } from "@azure/msal-browser";
import { msalInstance } from "../App";

const appConfig = window.env;

// Track ongoing token refreshes by account+scopes to prevent concurrent refreshes
const refreshMap = new Map<string, Promise<string>>();

function makeRefreshKey(accountId: string, scopes: string[]): string {
  // Sort scopes to normalize the key and avoid order differences
  const normalized = [...scopes].sort();
  return JSON.stringify({ accountId, scopes: normalized });
}

function resolveAccount(instance: PublicClientApplication): AccountInfo | null {
  const active = instance.getActiveAccount();
  if (active) {
    return active;
  }
  const all = instance.getAllAccounts();
  if (all && all.length > 0) {
    // Set active for future stability
    instance.setActiveAccount(all[0]);
    return all[0];
  }
  return null;
}

export type GetAccessTokenOptions = {
  forceRefresh?: boolean;
  interactive?: boolean; // if true, may trigger popup/redirect on interaction required
};

export async function getAccessToken(
  scopes?: string[],
  options?: GetAccessTokenOptions
): Promise<string> {
  const resolvedScopes = scopes ?? appConfig.clientScopes;
  const forceRefresh = options?.forceRefresh === true;
  const interactive = options?.interactive === true;

  const account = resolveAccount(msalInstance);
  if (!account) {
    return "";
  }

  const request: SilentRequest = {
    scopes: resolvedScopes,
    account,
    forceRefresh,
  };

  try {
    if (forceRefresh) {
      const key = makeRefreshKey(account.homeAccountId, Array.isArray(resolvedScopes) ? resolvedScopes : [resolvedScopes]);
      const existing = refreshMap.get(key);
      if (existing) {
        // Wait for the ongoing refresh for these scopes
        return await existing;
      }

      // Basic failure backoff state per key
      let attempt = 0;
      const maxAttempts = 2; // one retry after initial attempt
      const baseDelayMs = 200; // small jitter to avoid thundering herd

      const doRefresh = async (): Promise<string> => {
        try {
          const result = await msalInstance.acquireTokenSilent(request);
          return result.accessToken;
        } catch (err) {
          attempt += 1;
          if (attempt <= maxAttempts) {
            const delay = baseDelayMs * attempt;
            await new Promise((res) => setTimeout(res, delay));
            return await doRefresh();
          }
          throw err;
        }
      };

      const p = doRefresh()
        .then((token) => {
          refreshMap.delete(key);
          return token;
        })
        .catch((e) => {
          refreshMap.delete(key);
          throw e;
        });
      refreshMap.set(key, p);
      return await p;
    }
    
    // Normal (non-forced) token acquisition
    const { accessToken } = await msalInstance.acquireTokenSilent(request);
    return accessToken;
  } catch (error: any) {
    // Try interactive only if explicitly allowed
    if (interactive && (error instanceof InteractionRequiredAuthError || error?.errorCode === "interaction_required")) {
      try {
        const popupRequest: PopupRequest = {
          scopes: resolvedScopes,
          account,
        };
        const { accessToken } = await msalInstance.acquireTokenPopup(popupRequest);
        return accessToken;
      } catch (popupError) {
        // Fallback to redirect as last resort
        try {
          const redirectRequest: RedirectRequest = {
            scopes: resolvedScopes,
            account,
          };
          await msalInstance.acquireTokenRedirect(redirectRequest);
          // Execution will redirect; return empty string for now
          return "";
        } catch (redirectError) {
          return "";
        }
      }
    }
    return "";
  }
}


