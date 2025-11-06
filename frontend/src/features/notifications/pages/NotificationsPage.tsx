/**
 * NotificationsPage
 * Full notifications page with filters and settings
 */

import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckIcon, GearIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button/Button';
import { cn } from '@/lib/utils';
import { useMarkAllAsRead } from '../hooks/useNotifications';
import { getNotificationTypeLabel } from '../utils/notificationHelpers';
import type { NotificationType } from '../types';
import NotificationsList from '../components/NotificationsList';

type FilterTab = 'all' | 'unread' | NotificationType;

export const NotificationsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>('all');
  const markAllAsReadMutation = useMarkAllAsRead();

  const filters = React.useMemo(() => {
    if (activeFilter === 'all') {
      return {};
    }
    if (activeFilter === 'unread') {
      return { unreadOnly: true };
    }
    return { type: activeFilter as NotificationType };
  }, [activeFilter]);

  const handleMarkAllAsRead = React.useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const filterTabs: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'news', label: 'News' },
    { value: 'forum', label: 'Forum' },
    { value: 'jobs', label: 'Jobs' },
    { value: 'social', label: 'Social' },
  ];

  return (
    <>
      <Helmet>
        <title>Notifications | Neurmatic</title>
        <meta name="description" content="View and manage your notifications" />
      </Helmet>

      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Stay updated with your activity
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Mark all read
              </Button>

              <Link to="/settings/notifications">
                <Button variant="ghost" size="icon" aria-label="Notification settings">
                  <GearIcon className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-800">
              <nav className="flex space-x-8 -mb-px overflow-x-auto">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveFilter(tab.value)}
                    className={cn(
                      'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                      activeFilter === tab.value
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Notifications list */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <NotificationsList filters={filters} />
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
