import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, MessageCircle, Award, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { FollowingActivity } from '../../types';

interface FollowingActivityWidgetProps {
  activities: FollowingActivity[];
}

const ACTIVITY_ICONS = {
  article: FileText,
  topic: MessageCircle,
  reply: MessageCircle,
  badge: Award,
};

const ACTIVITY_LABELS = {
  article: 'published an article',
  topic: 'started a discussion',
  reply: 'replied to',
  badge: 'earned a badge',
};

export const FollowingActivityWidget: React.FC<FollowingActivityWidgetProps> = ({
  activities,
}) => {
  return (
    <div className="space-y-3">
      {activities.slice(0, 6).map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type];
        return (
          <Link
            key={activity.id}
            to={activity.url}
            className="block group hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 py-3 rounded-lg transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {activity.actor.avatarUrl ? (
                  <img
                    src={activity.actor.avatarUrl}
                    alt={activity.actor.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">
                    {activity.actor.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white mb-1">
                  <span className="font-semibold">{activity.actor.displayName}</span>{' '}
                  <span className="text-gray-600 dark:text-gray-400">
                    {ACTIVITY_LABELS[activity.type]}
                  </span>
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1 mb-1">
                  {activity.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Icon className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}

      {activities.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No recent activity</p>
          <Link
            to="/following"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block"
          >
            Discover people to follow
          </Link>
        </div>
      )}

      {activities.length > 0 && (
        <Link
          to="/following"
          className="flex items-center justify-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors pt-2"
        >
          See all activity
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};
