import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error details
    console.error(`[ErrorBoundary${this.props.context ? `:${this.props.context}` : ''}] Component error:`, error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
      <h3 className="text-lg font-semibold mb-2">
        {t('common:error.componentError', 'Something went wrong')}
      </h3>
      <p className="text-sm text-center mb-4">
        {t('common:error.componentErrorDescription', 'An error occurred while rendering this component.')}
      </p>
      {error && (
        <details className="w-full">
          <summary className="cursor-pointer text-sm text-red-300 hover:text-red-100">
            {t('common:error.showDetails', 'Show error details')}
          </summary>
          <pre className="mt-2 p-2 bg-red-950 rounded text-xs overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
      >
        {t('common:error.reload', 'Reload Page')}
      </button>
    </div>
  );
};

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};