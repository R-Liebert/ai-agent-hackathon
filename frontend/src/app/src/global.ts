export {};

/*
 * Configuration for Model as a Service (MaaS) API
 */
interface MaasConfig {
  scopes: string[];
  apiUrl: string;
}

declare global {
  interface Window {
    env: {
      clientId: string;
      clientScopes: string[];
      clientUrl: string;
      apiUrl: string;
      environment: string;
      features: {
        useFeedbackChat: boolean;
      };
      maas: MaasConfig;
    };
  }
}
