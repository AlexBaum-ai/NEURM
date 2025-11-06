/**
 * NotificationBell Component
 * Bell icon with unread count badge that opens notification dropdown
 */

import * as React from 'react';
import { BellIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/common/Button/Button';
import { cn } from '@/lib/utils';
import { useUnreadCount, useNotificationSound } from '../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
  enableSound?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className,
  enableSound = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch unread count with real-time polling
  const { unreadCount } = useUnreadCount(true);

  // Enable notification sound if user preference is set
  useNotificationSound(enableSound);

  const handleToggleDropdown = React.useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleCloseDropdown = React.useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleDropdown}
        aria-label="Notifications"
        className={cn(
          'relative',
          isDropdownOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        <BellIcon className="h-5 w-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full border-2 border-white dark:border-gray-950">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        )}
      </Button>

      {/* Dropdown */}
      <NotificationDropdown
        isOpen={isDropdownOpen}
        onClose={handleCloseDropdown}
        position="right"
      />
    </div>
  );
};

export default NotificationBell;
