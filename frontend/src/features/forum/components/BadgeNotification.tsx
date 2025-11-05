/**
 * BadgeNotification Component
 * Displays a celebratory notification when a user earns a badge
 * Uses the custom Toast system
 */

import React, { useEffect } from 'react';
import { useToast } from '@/components/common/Toast/ToastProvider';
import type { Badge } from '../types/badge';
import { BADGE_RARITY_CONFIG } from '../types/badge';

interface BadgeNotificationProps {
  badge: Badge;
  onClose?: () => void;
}

/**
 * Custom Badge Notification Content
 */
export const BadgeNotificationContent: React.FC<{ badge: Badge }> = ({ badge }) => {
  const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity];

  return (
    <div className="flex items-start gap-3 p-1">
      {/* Badge Icon */}
      <div
        className={`
          text-4xl flex-shrink-0
          ${badge.rarity === 'legendary' ? 'animate-bounce' : ''}
        `}
      >
        {badge.icon}
      </div>

      {/* Badge Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-gray-900 dark:text-white">Badge Earned!</h4>
          <span className={`text-xs font-semibold ${rarityConfig.color}`}>
            {rarityConfig.label}
          </span>
        </div>
        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{badge.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {badge.description}
        </p>
      </div>

      {/* Confetti/Sparkle Effect for Legendary */}
      {badge.rarity === 'legendary' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 animate-ping text-yellow-400 text-2xl">✨</div>
          <div className="absolute top-0 right-1/4 animate-ping text-yellow-400 text-2xl" style={{ animationDelay: '0.2s' }}>✨</div>
        </div>
      )}
    </div>
  );
};

/**
 * Badge Notification Hook
 * Use this hook to show badge earned notifications
 */
export const useBadgeNotification = () => {
  const { showToast } = useToast();

  const showBadgeEarned = (badge: Badge) => {
    const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity];

    // Determine duration based on rarity
    const duration = badge.rarity === 'legendary' ? 8000 : badge.rarity === 'epic' ? 6000 : 5000;

    showToast({
      type: 'success',
      title: '🎉 Badge Earned!',
      message: `${badge.name} - ${badge.description}`,
      duration,
    });
  };

  return { showBadgeEarned };
};

/**
 * Badge Notification Listener
 * Component that listens for badge earned events via WebSocket or polling
 */
interface BadgeNotificationListenerProps {
  userId: string;
  onBadgeEarned?: (badge: Badge) => void;
}

export const BadgeNotificationListener: React.FC<BadgeNotificationListenerProps> = ({
  userId,
  onBadgeEarned,
}) => {
  const { showBadgeEarned } = useBadgeNotification();

  useEffect(() => {
    // This would be replaced with actual WebSocket or polling logic
    // For now, this is a placeholder

    // Example WebSocket listener:
    // const ws = new WebSocket(`${WS_URL}/badges?userId=${userId}`);
    //
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'BADGE_EARNED') {
    //     const badge = data.badge;
    //     showBadgeEarned(badge);
    //     if (onBadgeEarned) {
    //       onBadgeEarned(badge);
    //     }
    //   }
    // };
    //
    // return () => ws.close();

    // For now, we'll rely on manual triggers
    // The actual implementation would connect to the backend WebSocket
  }, [userId, showBadgeEarned, onBadgeEarned]);

  return null; // This component doesn't render anything
};

export default BadgeNotificationContent;
