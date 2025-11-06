import { captureException, addSentryBreadcrumb } from '@/lib/sentry';
import { toast } from 'sonner'; // Assuming you're using sonner for toasts

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Enhanced error class with additional context
 */
export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  statusCode?: number;
  isRetryable: boolean;
  userMessage: string;
  metadata?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isRetryable = false,
    userMessage?: string,
    statusCode?: number,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.isRetryable = isRetryable;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.statusCode = statusCode;
    this.metadata = metadata;
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.SERVER:
        return 'A server error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

/**
 * Network error detection
 */
export function isNetworkError(error: any): boolean {
  return (
    error.message === 'Network Error' ||
    error.message === 'Failed to fetch' ||
    error.message?.includes('NetworkError') ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    !navigator.onLine
  );
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (isNetworkError(error)) return true;

  // 5xx server errors are retryable
  if (error.response?.status >= 500 && error.response?.status < 600) return true;

  // 429 Too Many Requests is retryable
  if (error.response?.status === 429) return true;

  // 408 Request Timeout is retryable
  if (error.response?.status === 408) return true;

  return false;
}

/**
 * Parse error from various sources
 */
export function parseError(error: any): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Network error
  if (isNetworkError(error)) {
    return new AppError(
      error.message || 'Network error',
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      true,
      'Unable to connect. Please check your internet connection.',
      0,
      { originalError: error.message }
    );
  }

  // HTTP error response
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const message = data?.message || error.message || 'Request failed';

    let type = ErrorType.SERVER;
    let severity = ErrorSeverity.MEDIUM;
    let userMessage = message;

    switch (true) {
      case status === 400:
        type = ErrorType.VALIDATION;
        severity = ErrorSeverity.LOW;
        userMessage = data?.message || 'Invalid request. Please check your input.';
        break;
      case status === 401:
        type = ErrorType.AUTHENTICATION;
        severity = ErrorSeverity.MEDIUM;
        userMessage = 'Please log in to continue.';
        break;
      case status === 403:
        type = ErrorType.AUTHORIZATION;
        severity = ErrorSeverity.MEDIUM;
        userMessage = 'You do not have permission to perform this action.';
        break;
      case status === 404:
        type = ErrorType.NOT_FOUND;
        severity = ErrorSeverity.LOW;
        userMessage = 'The requested resource was not found.';
        break;
      case status === 422:
        type = ErrorType.VALIDATION;
        severity = ErrorSeverity.LOW;
        userMessage = data?.message || 'Validation failed. Please check your input.';
        break;
      case status >= 500:
        type = ErrorType.SERVER;
        severity = ErrorSeverity.HIGH;
        userMessage = 'Server error. Our team has been notified.';
        break;
    }

    return new AppError(
      message,
      type,
      severity,
      isRetryableError(error),
      userMessage,
      status,
      { data }
    );
  }

  // Generic error
  return new AppError(
    error.message || 'Unknown error',
    ErrorType.UNKNOWN,
    ErrorSeverity.MEDIUM,
    false,
    'An unexpected error occurred. Please try again.'
  );
}

/**
 * Handle error with user feedback
 */
export function handleError(error: any, context?: string): AppError {
  const appError = parseError(error);

  // Add breadcrumb for debugging
  addSentryBreadcrumb(
    `Error handled: ${appError.message}`,
    'error',
    'error',
    {
      type: appError.type,
      severity: appError.severity,
      context,
      statusCode: appError.statusCode,
    }
  );

  // Report to Sentry for medium+ severity
  if (
    appError.severity === ErrorSeverity.MEDIUM ||
    appError.severity === ErrorSeverity.HIGH ||
    appError.severity === ErrorSeverity.CRITICAL
  ) {
    captureException(error, {
      type: appError.type,
      severity: appError.severity,
      context,
      statusCode: appError.statusCode,
      metadata: appError.metadata,
    });
  }

  // Show toast notification
  showErrorToast(appError);

  return appError;
}

/**
 * Show error toast notification
 */
export function showErrorToast(error: AppError): void {
  const toastOptions = {
    duration: error.severity === ErrorSeverity.CRITICAL ? 10000 : 5000,
    action: error.isRetryable
      ? {
          label: 'Retry',
          onClick: () => {
            // Retry logic should be handled by the calling component
            console.log('Retry requested');
          },
        }
      : undefined,
  };

  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      toast.error(error.userMessage, toastOptions);
      break;
    case ErrorSeverity.MEDIUM:
      toast.error(error.userMessage, toastOptions);
      break;
    case ErrorSeverity.LOW:
      toast.warning(error.userMessage, toastOptions);
      break;
  }
}

/**
 * Exponential backoff retry mechanism
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any, attemptNumber: number) => boolean;
  onRetry?: (attemptNumber: number, error: any) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = isRetryableError,
    onRetry,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!shouldRetry(error, attempt)) {
        break;
      }

      // Call onRetry callback
      onRetry?.(attempt + 1, error);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Network status utilities
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

export function waitForOnline(timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      reject(new Error('Timeout waiting for network connection'));
    }, timeout);

    const handleOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
}

/**
 * Request with timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Error boundary error handler
 */
export function handleBoundaryError(error: Error, errorInfo: React.ErrorInfo): void {
  console.error('Error boundary caught:', error, errorInfo);

  captureException(error, {
    errorBoundary: true,
    componentStack: errorInfo.componentStack,
  });

  // Show critical error notification
  toast.error('A critical error occurred. Please refresh the page.', {
    duration: 10000,
    action: {
      label: 'Refresh',
      onClick: () => window.location.reload(),
    },
  });
}
