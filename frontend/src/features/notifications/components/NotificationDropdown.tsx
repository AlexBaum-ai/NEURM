/**
 * NotificationDropdown Component
 * Dropdown menu showing recent notifications
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/common/Button/Button';
import { cn } from '@/lib/utils';
import { useNotifications, useMarkAllAsRead } from '../hooks/useNotifications';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  position = 'right',
}) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Fetch recent notifications (limit 10)
  const { notifications, isLoading, unreadCount } = useNotifications({ limit: 10 });
  const markAllAsReadMutation = useMarkAllAsRead();

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleMarkAllAsRead = React.useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        'absolute top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50 max-h-[600px] flex flex-col',
        position === 'right' ? 'right-0' : 'left-0'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({unreadCount} new)
            </span>
          )}
        </h3>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="text-xs"
          >
            <CheckIcon className="w-3 h-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNavigate={onClose}
                showDelete={false}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <CheckIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              All caught up!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You don't have any notifications right now
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
