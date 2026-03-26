import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationsService } from '../services/notificationsService';

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  logToConsole?: boolean;
  contextPrefix?: string;
}

export interface UseErrorHandlerResult {
  handleError: (error: unknown, context?: string, options?: ErrorHandlerOptions) => void;
  createErrorHandler: (context: string, options?: ErrorHandlerOptions) => (error: unknown) => void;
}

export const useErrorHandler = (): UseErrorHandlerResult => {
  const { t } = useTranslation();

  const handleError = useCallback((
    error: unknown, 
    context: string = 'unknown',
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showNotification = true,
      logToConsole = true,
      contextPrefix = ''
    } = options;

    // Extract error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Unknown error occurred';

    // Create contextual log message
    const logContext = contextPrefix ? `[${contextPrefix}:${context}]` : `[${context}]`;
    
    // Log to console if enabled
    if (logToConsole) {
      console.error(`${logContext} Error:`, error);
    }

    // Show notification if enabled
    if (showNotification) {
      // Try to get a localized error message first, fallback to generic
      const notificationMessage = 
        t(`traffic-information:errors.${context}`, { defaultValue: null }) ||
        t(`common:error.${context}`, { defaultValue: null }) ||
        errorMessage ||
        t('common:error.generic');

      notificationsService.error(notificationMessage);
    }
  }, [t]);

  const createErrorHandler = useCallback((
    context: string, 
    options: ErrorHandlerOptions = {}
  ) => {
    return (error: unknown) => handleError(error, context, options);
  }, [handleError]);

  return {
    handleError,
    createErrorHandler
  };
};