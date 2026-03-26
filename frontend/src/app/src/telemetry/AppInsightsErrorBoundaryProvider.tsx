import { AppInsightsErrorBoundary } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "./AppInsights";

const AppInsightsErrorBoundaryProvider = ({ children }: any) => {
  return (
    <AppInsightsErrorBoundary
      appInsights={reactPlugin}
      onError={() => (
        <div className="flex items-center justify-center h-screen">
          <div className="p-4 bg-gray-200 rounded text-center">
            <h3>Oops! Something went wrong.</h3>
            <p>
              We encountered an unexpected error while loading the Launchpad.
            </p>
            <p>
              Please try{" "}
              <a
                href=""
                className="text-blue-500 underline hover:text-blue-700"
                onClick={() => window.location.reload()}
              >
                refreshing
              </a>{" "}
              the page or go{" "}
              <a
                className="text-blue-500 underline hover:text-blue-700"
                href="/"
              >
                back
              </a>{" "}
              home.
            </p>
            <p>If the issue persists, contact support for assistance.</p>
          </div>
        </div>
      )}
    >
      {children}
    </AppInsightsErrorBoundary>
  );
};

export { AppInsightsErrorBoundaryProvider };
