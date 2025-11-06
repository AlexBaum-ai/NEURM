import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card/Card';
import { SEO } from '@/components/common/SEO';

type ConnectionStatus = 'checking' | 'online' | 'offline';

interface OfflinePageProps {
  onRetry?: () => void;
}

/**
 * OfflinePage Component
 *
 * Displays when the user loses internet connection (PWA offline mode)
 *
 * Features:
 * - Real-time network status monitoring
 * - Connection quality indicator
 * - Retry mechanism
 * - Tips for troubleshooting
 * - Auto-redirect when connection is restored
 * - Responsive design
 * - Dark mode support
 * - Accessible messaging
 */
const OfflinePage: React.FC<OfflinePageProps> = ({ onRetry }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    // Check initial connection status
    checkConnection();

    // Listen for online/offline events
    const handleOnline = () => {
      setConnectionStatus('online');
      // Auto-redirect after confirming connection
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connection check
    const interval = setInterval(() => {
      checkConnection();
    }, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkConnection = async () => {
    setLastChecked(new Date());

    // Check navigator.onLine first
    if (!navigator.onLine) {
      setConnectionStatus('offline');
      return;
    }

    // Try to fetch a small resource to verify actual connectivity
    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        setConnectionStatus('online');
      } else {
        setConnectionStatus('offline');
      }
    } catch {
      setConnectionStatus('offline');
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);

    if (onRetry) {
      try {
        await onRetry();
      } catch (error) {
        console.error('Retry failed:', error);
      }
    } else {
      await checkConnection();

      if (connectionStatus === 'online') {
        window.location.reload();
      }
    }

    setIsRetrying(false);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'checking':
        return <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 animate-pulse" />;
      case 'online':
        return <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />;
      case 'offline':
        return <WifiOff className="w-12 h-12 text-red-600 dark:text-red-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Checking connection...';
      case 'online':
        return 'Connection restored!';
      case 'offline':
        return 'You are currently offline';
    }
  };

  const getStatusDescription = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Please wait while we check your internet connection';
      case 'online':
        return 'Your internet connection has been restored. Redirecting...';
      case 'offline':
        return 'Please check your internet connection and try again';
    }
  };

  return (
    <>
      <SEO
        title="You're Offline"
        description="No internet connection. Please check your network settings."
        noindex={true}
      />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          {/* Connection status */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
              connectionStatus === 'checking' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              connectionStatus === 'online' ? 'bg-green-100 dark:bg-green-900/30' :
              'bg-red-100 dark:bg-red-900/30'
            }`}>
              {getStatusIcon()}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {getStatusMessage()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {getStatusDescription()}
            </p>
          </div>

          {/* Status card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                Last checked: {lastChecked.toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status indicator */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {connectionStatus === 'online' ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : connectionStatus === 'checking' ? (
                    <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Network Status
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {connectionStatus === 'online' ? 'Connected' :
                       connectionStatus === 'checking' ? 'Checking...' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying || connectionStatus === 'checking'}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
                  />
                  {isRetrying ? 'Checking...' : 'Check Now'}
                </Button>
              </div>

              {/* Retry button */}
              {connectionStatus === 'offline' && (
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full"
                  size="lg"
                >
                  <RefreshCw
                    className={`w-5 h-5 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
                  />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Troubleshooting tips */}
          {connectionStatus === 'offline' && (
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Tips</CardTitle>
                <CardDescription>
                  Here are some things you can try
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                        1
                      </span>
                    </div>
                    <p>Check if your WiFi or mobile data is turned on</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                        2
                      </span>
                    </div>
                    <p>Try turning airplane mode on and off</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                        3
                      </span>
                    </div>
                    <p>Check if other websites are loading</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                        4
                      </span>
                    </div>
                    <p>Restart your router or modem</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                        5
                      </span>
                    </div>
                    <p>Move closer to your WiFi router for better signal</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* PWA info */}
          <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Did you know?</strong> Some features of Neurmatic work offline.
                  Install our app for the best offline experience!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OfflinePage;
