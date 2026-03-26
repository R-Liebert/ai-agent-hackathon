// Local development config is the default.
window.env = {
  // //ai-launchpad-ui-prd
  clientId: "92320c2b-43cc-452b-8585-37e3a70d1a00",
  clientScopes: [
    "api://024fdb28-22e1-4550-8430-bf26417a49f1/access_as_user",
    "User.Read",
    "Files.Read.All",
    "Sites.Read.All",
    "Group.Read.All",
    "Directory.Read.All",
  ],
  apiUrl: "https://launchpad-api-ext.prd.tog.azure.dsb.dk/",
  clientUrl:
    "https://login.microsoftonline.com/f44c53ea-a4c3-499c-bf1e-a1891b565e1d",
  environment: "prd",
  instrumentationKey:
    "InstrumentationKey=0893ccdd-9439-4089-8817-6611c14e1f86;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=29ce9c56-2eb2-49c9-8600-d63e4ec92688",
  features: {
    useFeedbackChat: true
  },
  maas: {
    scopes: [
      "api://a0eb10f6-84cf-4163-92b3-b419569bf794/access_as_user"
    ],
    apiUrl: "https://llmgateway-management-api-ai-tooling.prd.aiml.azure.dsb.dk/api",
  }
};
