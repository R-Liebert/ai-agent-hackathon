// Test config is the default.
window.env = {
  // //ai-launchpad-ui-tst
  clientId: "ff47257e-8d32-416b-9517-f80152356f32",
  clientScopes: [
    "api://d8c81c47-40e7-4107-823a-dfbd37e4ffbf/access_as_user",
    "User.Read",
    "Files.Read.All",
    "Sites.Read.All",
    "Group.Read.All",
    "Directory.Read.All",
  ],
  apiUrl: "https://ai-launchpad-api-tooling.tst.tog.azure.dsb.dk/",
  clientUrl:
    "https://login.microsoftonline.com/f44c53ea-a4c3-499c-bf1e-a1891b565e1d",
  environment: "tst",
  instrumentationKey:
    "InstrumentationKey=509c582f-aa28-4b83-be55-8bc09915745c;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=a0635b2b-cf81-438f-9b12-7fc2b8e2b086",
  features: {
    useFeedbackChat: true
  },
  maas: {
    scopes: [
      "api://951f48fd-ab5e-4129-9967-072199bc1369/access_as_user"
    ],
    apiUrl: "https://llmgateway-management-api-ai-tooling.tst.aiml.azure.dsb.dk/api",
  }
};
