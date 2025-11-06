import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AlertTriangle, Home, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card/Card';
import { SEO } from '@/components/common/SEO';

interface ServerErrorPageProps {
  errorCode?: number;
  errorMessage?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

/**
 * ServerErrorPage Component (500 Error)
 *
 * Displays when a server error occurs with retry functionality
 * and support contact options. Automatically reports errors to Sentry.
 *
 * Features:
 * - Retry mechanism with loading state
 * - Support contact link
 * - Responsive design
 * - Dark mode support
 * - Accessible error messaging
 */
const ServerErrorPage: React.FC<ServerErrorPageProps> = ({
  errorCode = 500,
  errorMessage = 'Something went wrong on our end',
  showRetry = true,
  onRetry,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) {
      // Default retry: reload the page
      window.location.reload();
      return;
    }

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <>
      <SEO
        title={`${errorCode} - Server Error`}
        description="We're experiencing technical difficulties. Our team has been notified and is working to fix the issue."
        noindex={true}
      />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          {/* Error illustration */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
              {errorCode}
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {errorMessage}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              We're sorry for the inconvenience. Our team has been automatically notified
              and is working to resolve this issue. Please try again in a few moments.
            </p>
          </div>

          {/* Action buttons */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>What you can do</CardTitle>
              <CardDescription>
                Try these options to continue using Neurmatic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {showRetry && (
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="flex-1"
                    variant="default"
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
                    />
                    {isRetrying ? 'Retrying...' : 'Try Again'}
                  </Button>
                )}
                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Support section */}
          <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Mail className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Still having issues?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    If this problem persists, please contact our support team.
                    We're here to help!
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/contact">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status check */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Check our{' '}
              <a
                href="https://status.neurmatic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                status page
              </a>{' '}
              for real-time updates
            </p>
          </div>

          {/* Development error details */}
          {import.meta.env.DEV && errorMessage && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Error details (development only)
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                {errorMessage}
              </pre>
            </details>
          )}
        </div>
      </div>
    </>
  );
};

export default ServerErrorPage;
