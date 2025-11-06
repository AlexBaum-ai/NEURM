/**
 * NotificationsList Component
 * Full notification list with infinite scroll and grouping
 */

import * as React from 'react';
import { useInView } from 'react-intersection-observer';
import { CheckIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/common/Button/Button';
import { cn } from '@/lib/utils';
import { useNotifications } from '../hooks/useNotifications';
import { groupNotificationsByTime } from '../utils/notificationHelpers';
import type { NotificationFilters } from '../types';
import NotificationItem from './NotificationItem';

interface NotificationsListProps {
  filters?: NotificationFilters;
  className?: string;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  filters = {},
  className,
}) => {
  const {
    notifications,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useNotifications(filters);

  // Intersection observer for infinite scroll
  const { ref: infiniteScrollRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Trigger fetch when scrolling to bottom
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Group notifications by time
  const groupedNotifications = React.useMemo(() => {
    return groupNotificationsByTime(notifications);
  }, [notifications]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-16 px-4 text-center',
          className
        )}
      >
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <CheckIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No notifications
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {filters.unreadOnly
            ? "You don't have any unread notifications"
            : "You don't have any notifications yet"}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Today */}
      {groupedNotifications.today.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
            Today
          </h3>
          <div className="space-y-1">
            {groupedNotifications.today.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                showDelete
              />
            ))}
          </div>
        </div>
      )}

      {/* This Week */}
      {groupedNotifications.this_week.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
            This Week
          </h3>
          <div className="space-y-1">
            {groupedNotifications.this_week.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                showDelete
              />
            ))}
          </div>
        </div>
      )}

      {/* Earlier */}
      {groupedNotifications.earlier.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
            Earlier
          </h3>
          <div className="space-y-1">
            {groupedNotifications.earlier.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                showDelete
              />
            ))}
          </div>
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={infiniteScrollRef} className="flex items-center justify-center py-4">
          {isFetchingNextPage ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => fetchNextPage()}>
              Load more
            </Button>
          )}
        </div>
      )}

      {/* End of list */}
      {!hasNextPage && notifications.length > 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            You've reached the end
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
