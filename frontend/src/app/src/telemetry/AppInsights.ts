import {
  ApplicationInsights,
  ITelemetryItem,
  PageView,
} from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { ClickAnalyticsPlugin } from "@microsoft/applicationinsights-clickanalytics-js";
import { Config } from "../interfaces/interfaces";

const config: Config = window.env;

if (!config.instrumentationKey) {
  throw new Error("Instrumentation key not provided");
}

const reactPlugin = new ReactPlugin();

// *** Add the Click Analytics plug-in. ***
const clickPluginInstance = new ClickAnalyticsPlugin();

// Click Analytics configuration
const clickPluginConfig = {
  autoCapture: false
};

const appInsights = new ApplicationInsights({
  config: {
    connectionString: config.instrumentationKey,
    extensions: [reactPlugin, clickPluginInstance],
    extensionConfig: {
      [clickPluginInstance.identifier]: clickPluginConfig
    },
    enableAutoRouteTracking: true,
    disableAjaxTracking: false,
    autoTrackPageVisitTime: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
  },
});

appInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
  envelope.tags = envelope.tags || [];

  if (envelope.baseType == PageView.dataType && envelope.baseData?.uri) {
    const url = new URL(envelope.baseData.uri);
    const relativePath = url.pathname + url.search + url.hash;
    envelope.baseData.name = relativePath;
  }
});

appInsights.loadAppInsights();

export { reactPlugin, appInsights };
