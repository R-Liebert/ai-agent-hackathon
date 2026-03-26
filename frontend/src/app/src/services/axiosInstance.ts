import axios, { AxiosInstance } from "axios";
import { getAccessToken } from "./msalToken";
import { useSessionStore } from "../stores/sessionStore";

const config = window.env;

// Determine API scopes only (avoid mixing Graph scopes). Fallback to default scopes if none match
const apiScopesFiltered: string[] = Array.isArray(config.clientScopes)
  ? config.clientScopes.filter((s: string) => s.startsWith("api://"))
  : [];

const maasApiScopes: string[] = Array.isArray(config.maas.scopes)
  ? config.maas.scopes
  : [];

const createAxiosInstance = (
  baseURL: string,
  scopes: string[],
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });

  const resolvedScopes = scopes.length ? scopes : undefined;

  instance.interceptors.request.use(async (config) => {
    const token = await getAccessToken(resolvedScopes);
    if (!config.headers) {
      config.headers = {} as any;
    }
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config || {};
      if (error?.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const freshToken = await getAccessToken(resolvedScopes, {
          forceRefresh: true,
        });
        if (freshToken) {
          if (!originalRequest.headers) {
            originalRequest.headers = {};
          }
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return instance(originalRequest);
        }
        // Forced silent refresh failed – likely interaction required
        // Enqueue retry and show session expired
        const retryFn = async () => {
          return instance(originalRequest);
        };
        useSessionStore.getState().enqueueRetry(retryFn);
        useSessionStore.getState().markExpired();
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

const axiosInstance = createAxiosInstance(
  config.apiUrl + "api",
  apiScopesFiltered,
);
// MaaS API instance with a separate app registration & scopes
const axiosInstanceMaasApi = createAxiosInstance(
  config.maas.apiUrl,
  maasApiScopes,
);

export default axiosInstance;

export { axiosInstanceMaasApi };
