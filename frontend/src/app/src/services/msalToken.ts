export type GetAccessTokenOptions = {
  forceRefresh?: boolean;
  interactive?: boolean;
};

export async function getAccessToken(
  _scopes?: string[],
  _options?: GetAccessTokenOptions
): Promise<string> {
  // Return a mock token for local development without MSAL
  return "mock-token";
}
