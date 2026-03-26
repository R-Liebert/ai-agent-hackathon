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
  authorizedUserIds: [
    "1c43e019-8f83-4d79-8076-dc7817f78475",
    "37302f07-c812-49aa-afc6-6a572e0335bf",
    "8565ee28-8005-4bc5-9130-d35d096c7dec",
    "cf3720cb-6b84-4f8e-8309-1983ccf78352",
    "5aecbd58-829c-47b6-9b09-6dfa14410972",
    "f2fb680e-4e16-4ac5-9d4e-14dc99937c6f",
    "15ba7c00-22f6-4ab5-92bf-1e7eeff3cb77",
    "689bce41-f26a-4edc-b0c6-36290f2db6de",
    "b1d67c21-7e96-4f1c-8a3c-f9979cefb516",
    "aefbb56a-b200-403a-989d-d8c0f089d205",
  ],
  environment: "prd",
  instrumentationKey:
    "InstrumentationKey=0893ccdd-9439-4089-8817-6611c14e1f86;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=29ce9c56-2eb2-49c9-8600-d63e4ec92688",
  features: {
    useFeedbackChat: true,
  },
  maas: {
    scopes: ["api://951f48fd-ab5e-4129-9967-072199bc1369/access_as_user"],
    apiUrl:
      "https://llmgateway-management-api-ai-tooling.dev.aiml.azure.dsb.dk/api",
  },
};
