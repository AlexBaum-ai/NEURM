/**
 * NotificationItem Component
 * Displays a single notification with icon, content, and actions
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, DotFilledIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import type { Notification } from '../types';
import {
  getNotificationIcon,
  getNotificationIconColor,
  getNotificationLink,
  formatNotificationTime,
} from '../utils/notificationHelpers';
import {
  useMarkNotificationAsRead,
  useDeleteNotification,
  useOptimisticNotificationUpdate,
} from '../hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onNavigate?: () => void;
  showDelete?: boolean;
  compact?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onNavigate,
  showDelete = true,
  compact = false,
}) => {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkNotificationAsRead();
  const deleteMutation = useDeleteNotification();
  const { markAsReadOptimistically, deleteOptimistically } = useOptimisticNotificationUpdate();

  const isUnread = !notification.readAt;
  const Icon = getNotificationIcon(notification.type, notification.subtype);
  const iconColor = getNotificationIconColor(notification.type);
  const link = getNotificationLink(notification);

  const handleClick = React.useCallback(() => {
    // Mark as read if unread
    if (isUnread) {
      markAsReadOptimistically(notification.id);
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to relevant page
    if (link) {
      navigate(link);
      onNavigate?.();
    }
  }, [
    isUnread,
    notification.id,
    link,
    navigate,
    onNavigate,
    markAsReadOptimistically,
    markAsReadMutation,
  ]);

  const handleDelete = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteOptimistically(notification.id);
      deleteMutation.mutate(notification.id);
    },
    [notification.id, deleteOptimistically, deleteMutation]
  );

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer group',
        isUnread
          ? 'bg-primary-50 dark:bg-primary-950/20 hover:bg-primary-100 dark:hover:bg-primary-950/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        compact && 'p-2'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          isUnread ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-gray-100 dark:bg-gray-800',
          compact && 'w-8 h-8'
        )}
      >
        <Icon className={cn('w-5 h-5', iconColor, compact && 'w-4 h-4')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium text-gray-900 dark:text-white',
                isUnread && 'font-semibold',
                compact && 'text-xs'
              )}
            >
              {notification.title}
            </p>
            <p
              className={cn(
                'text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2',
                compact && 'text-xs line-clamp-1'
              )}
            >
              {notification.message}
            </p>
          </div>

          {/* Unread indicator */}
          {isUnread && (
            <DotFilledIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <span
            className={cn(
              'text-xs text-gray-500 dark:text-gray-500',
              compact && 'text-[10px]'
            )}
          >
            {formatNotificationTime(notification.createdAt)}
          </span>

          {/* Delete button */}
          {showDelete && (
            <button
              onClick={handleDelete}
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400',
                compact && 'p-0.5'
              )}
              aria-label="Delete notification"
            >
              <TrashIcon className={cn('w-4 h-4', compact && 'w-3 h-3')} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
