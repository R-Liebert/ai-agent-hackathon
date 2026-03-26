import {
  useAppInsightsContext,
} from "@microsoft/applicationinsights-react-js";
import { SeverityLevel } from "@microsoft/applicationinsights-common";
import { Config } from "../interfaces/interfaces";

const config: Config = window.env;

const useTelemetry = () => {
  const appInsights = useAppInsightsContext();

  const logMessage = (message: string, severityLevel: SeverityLevel) => {
    const obj = { message, severityLevel };

    if (config.environment === "dev") {
      console.log(obj);
    }

    if (appInsights) {
      appInsights.trackTrace(obj);
    }
  };

  const logError = (error: string) => {
    const obj = { message: error, severityLevel: SeverityLevel.Error };

    if (config.environment === "dev") {
      console.log(obj);
    }

    if (appInsights) {
      appInsights.trackException({ exception: new Error(error) });
    }
  };

  return {
    info: (message: string) => logMessage(message, SeverityLevel.Information),
    warning: (message: string) => logMessage(message, SeverityLevel.Warning),
    error: (error: string) => logError(error),
  };
};

export default useTelemetry;
