import axios, { AxiosInstance } from "axios";
import { getAccessToken } from "./msalToken";

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
  _scopes: string[],
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });

  instance.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
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
