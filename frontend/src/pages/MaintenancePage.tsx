import { useState, useEffect } from 'react';
import { Wrench, Clock, Twitter, Linkedin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card/Card';
import { SEO } from '@/components/common/SEO';

interface MaintenancePageProps {
  estimatedTime?: string;
  reason?: string;
  showCountdown?: boolean;
  endTime?: Date;
}

/**
 * MaintenancePage Component (503 Service Unavailable)
 *
 * Displays during scheduled maintenance with ETA and countdown
 *
 * Features:
 * - Optional countdown timer
 * - Estimated completion time display
 * - Social media links for updates
 * - Auto-refresh when maintenance ends
 * - Responsive design
 * - Dark mode support
 * - Accessible messaging
 */
const MaintenancePage: React.FC<MaintenancePageProps> = ({
  estimatedTime = '2 hours',
  reason = 'We are performing scheduled maintenance to improve your experience',
  showCountdown = false,
  endTime,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!showCountdown || !endTime) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining('Any moment now...');
        // Auto-refresh when maintenance ends
        setTimeout(() => {
          window.location.reload();
        }, 5000);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [showCountdown, endTime]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <>
      <SEO
        title="Scheduled Maintenance"
        description="Neurmatic is currently undergoing maintenance. We'll be back soon with improvements!"
        noindex={true}
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          {/* Maintenance illustration */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-600 dark:bg-primary-500 rounded-full mb-6 animate-pulse">
              <Wrench className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              We'll be back soon!
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Scheduled Maintenance in Progress
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {reason}
            </p>
          </div>

          {/* ETA Card */}
          <Card className="shadow-lg border-primary-200 dark:border-primary-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Estimated Time
              </CardTitle>
              <CardDescription>
                We're working hard to get everything back up and running
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showCountdown && timeRemaining ? (
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    {timeRemaining}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Until we're back online
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    {estimatedTime}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Estimated completion time
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What's happening */}
          <Card>
            <CardHeader>
              <CardTitle>What's happening?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                      1
                    </span>
                  </div>
                  <p>Upgrading our infrastructure for better performance</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                      2
                    </span>
                  </div>
                  <p>Implementing new features you've requested</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                      3
                    </span>
                  </div>
                  <p>Enhancing security and stability</p>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Refresh button */}
          <div className="flex justify-center">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="lg"
            >
              <RefreshCw
                className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Checking...' : 'Check if we\'re back'}
            </Button>
          </div>

          {/* Social media updates */}
          <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Stay updated
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Follow us for real-time updates on the maintenance progress
                </p>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://twitter.com/neurmatic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Follow us on Twitter"
                  >
                    <Twitter className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700 dark:text-gray-300">Twitter</span>
                  </a>
                  <a
                    href="https://linkedin.com/company/neurmatic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Follow us on LinkedIn"
                  >
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">LinkedIn</span>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer message */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Thank you for your patience!{' '}
              <span className="inline-block animate-bounce">❤️</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MaintenancePage;
