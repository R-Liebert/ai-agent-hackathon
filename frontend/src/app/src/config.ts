const appConfig = window.env;

export const msalConfig = {
  auth: {
    clientId: appConfig.clientId,
    authority: appConfig.clientUrl,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    // Proactively renew tokens 5 minutes before expiration
    tokenRenewalOffsetSeconds: 300,
  },
};

export const loginRequest = {
  scopes: appConfig.clientScopes, // Provide a default value
};
