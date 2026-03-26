import React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback,
}) => {
  return (
    <ReactErrorBoundary FallbackComponent={() => <>{fallback}</>}>
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
