import React, { useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { captureException } from '@/lib/sentry';

interface ErrorBoundaryWithRetryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onReset?: () => void;
  maxRetries?: number;
  retryDelays?: number[]; // Exponential backoff delays in ms
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
  retryCount: number;
  isRetrying: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

/**
 * Default Enhanced Error Fallback UI
 *
 * Features:
 * - Retry mechanism with exponential backoff
 * - Error details toggle (dev mode)
 * - Support link
 * - Home button
 * - Responsive design
 * - Dark mode support
 * - Accessibility
 */
const DefaultEnhancedFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  retryCount,
  isRetrying,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-2xl w-full space-y-6">
        {/* Error header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {error.message || 'An unexpected error occurred. Our team has been notified.'}
          </p>
        </div>

        {/* Error card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 space-y-4">
            {/* Retry info */}
            {retryCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  {retryCount === 1
                    ? 'First retry attempt...'
                    : `Retry attempt ${retryCount}...`}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={resetError}
                disabled={isRetrying}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Try again"
              >
                <RefreshCw
                  className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`}
                />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>

              <Link
                to="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            </div>

            {/* Support link */}
            <div className="text-center pt-2">
              <Link
                to="/contact"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Contact support if this problem persists
              </Link>
            </div>
          </div>

          {/* Error details (development mode) */}
          {import.meta.env.DEV && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                aria-expanded={showDetails}
                aria-controls="error-details"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Error Details (Development)
                </span>
                {showDetails ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {showDetails && (
                <div
                  id="error-details"
                  className="px-6 pb-6 space-y-3"
                  role="region"
                  aria-label="Error details"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Error Message:
                    </h3>
                    <pre className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-300 overflow-auto">
                      {error.toString()}
                    </pre>
                  </div>

                  {error.stack && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Stack Trace:
                      </h3>
                      <pre className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-800 dark:text-gray-300 overflow-auto max-h-60">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Component Stack:
                      </h3>
                      <pre className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-800 dark:text-gray-300 overflow-auto max-h-60">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Error ID: {Date.now().toString(36)}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced Error Boundary with Retry Mechanism
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Configurable max retries
 * - Custom fallback UI
 * - Automatic error reporting to Sentry
 * - Component stack trace capture
 * - Retry count tracking
 *
 * Usage:
 * ```tsx
 * <ErrorBoundaryWithRetry maxRetries={3}>
 *   <YourComponent />
 * </ErrorBoundaryWithRetry>
 * ```
 */
class ErrorBoundaryWithRetry extends React.Component<
  ErrorBoundaryWithRetryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: number | null = null;

  static defaultProps = {
    maxRetries: 3,
    retryDelays: [1000, 2000, 5000], // Exponential backoff: 1s, 2s, 5s
  };

  constructor(props: ErrorBoundaryWithRetryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({ errorInfo });

    // Report error to Sentry
    captureException(error, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Attempt automatic retry if under max retries
    this.attemptRetry();
  }

  componentWillUnmount() {
    if (this.retryTimeoutId !== null) {
      window.clearTimeout(this.retryTimeoutId);
    }
  }

  attemptRetry = () => {
    const { maxRetries = 3, retryDelays = [1000, 2000, 5000] } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      const delay = retryDelays[Math.min(retryCount, retryDelays.length - 1)];

      this.setState({ isRetrying: true });

      this.retryTimeoutId = window.setTimeout(() => {
        this.setState((prevState) => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prevState.retryCount + 1,
          isRetrying: false,
        }));
      }, delay);
    }
  };

  resetError = () => {
    if (this.retryTimeoutId !== null) {
      window.clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });

    // Call custom onReset if provided
    this.props.onReset?.();
  };

  render() {
    const { hasError, error, errorInfo, retryCount, isRetrying } = this.state;
    const { children, fallback: CustomFallback } = this.props;

    if (hasError && error) {
      const FallbackComponent = CustomFallback || DefaultEnhancedFallback;

      return (
        <FallbackComponent
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          retryCount={retryCount}
          isRetrying={isRetrying}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundaryWithRetry;
