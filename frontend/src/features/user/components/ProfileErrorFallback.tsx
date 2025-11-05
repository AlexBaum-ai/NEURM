import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { useNavigate } from 'react-router-dom';

interface ProfileErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ProfileErrorFallback: React.FC<ProfileErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const navigate = useNavigate();

  const getErrorMessage = (error: Error) => {
    // Check if it's a 404 error
    if (error.message.includes('404') || error.message.includes('not found')) {
      return {
        title: 'Profile Not Found',
        message: 'The profile you are looking for does not exist or has been removed.',
        showHomeButton: true,
      };
    }

    // Check if it's a 403 error
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to view this profile.',
        showHomeButton: true,
      };
    }

    // Check if it's a network error
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to load profile. Please check your internet connection and try again.',
        showHomeButton: false,
      };
    }

    // Generic error
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred while loading the profile. Please try again.',
      showHomeButton: false,
    };
  };

  const { title, message, showHomeButton } = getErrorMessage(error);

  return (
    <div className="container-custom py-12">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-accent-100 dark:bg-accent-900/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-accent-600 dark:text-accent-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {title}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={resetErrorBoundary} variant="default">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>

            {showHomeButton && (
              <Button onClick={() => navigate('/')} variant="outline">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            )}
          </div>

          {/* Debug info (only in development) */}
          {import.meta.env.DEV && (
            <details className="mt-8 text-left">
              <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left overflow-auto">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileErrorFallback;
