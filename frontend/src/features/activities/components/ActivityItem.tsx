import React from 'react';
import { Link } from 'react-router-dom';
import type { Activity } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItemProps {
  activity: Activity;
  showUser?: boolean;
}

/**
 * ActivityItem - Individual activity item display
 *
 * Features:
 * - Icon based on activity type
 * - Action description with links
 * - Timestamp (relative)
 * - Optional user information
 */
export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, showUser = false }) => {
  const getActivityIcon = () => {
    const iconClass = 'w-8 h-8 p-1.5 rounded-full';

    switch (activity.activityType) {
      case 'posted_article':
        return (
          <div className={`${iconClass} bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
        );
      case 'created_topic':
        return (
          <div className={`${iconClass} bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'replied':
        return (
          <div className={`${iconClass} bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'upvoted':
        return (
          <div className={`${iconClass} bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
          </div>
        );
      case 'bookmarked':
        return (
          <div className={`${iconClass} bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </div>
        );
      case 'applied_job':
        return (
          <div className={`${iconClass} bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
            </svg>
          </div>
        );
      case 'earned_badge':
        return (
          <div className={`${iconClass} bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case 'followed_user':
        return (
          <div className={`${iconClass} bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${iconClass} bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  };

  const getActivityDescription = () => {
    const targetLink = getTargetLink();
    const targetTitle = activity.metadata?.title || 'this';

    switch (activity.activityType) {
      case 'posted_article':
        return (
          <>
            posted an article{' '}
            <Link to={targetLink} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {targetTitle}
            </Link>
          </>
        );
      case 'created_topic':
        return (
          <>
            created a topic{' '}
            <Link to={targetLink} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {targetTitle}
            </Link>
          </>
        );
      case 'replied':
        return (
          <>
            replied to{' '}
            <Link to={targetLink} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {targetTitle}
            </Link>
          </>
        );
      case 'upvoted':
        return (
          <>
            upvoted{' '}
            <Link to={targetLink} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {targetTitle}
            </Link>
          </>
        );
      case 'bookmarked':
        return (
          <>
            bookmarked{' '}
            <Link to={targetLink} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {targetTitle}
            </Link>
          </>
        );
      case 'applied_job':
        return (
          <>
            applied to{' '}
            <Link to={targetLink} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {targetTitle}
            </Link>
          </>
        );
      case 'earned_badge':
        return (
          <>
            earned the badge{' '}
            <span className="font-medium text-amber-600 dark:text-amber-400">{targetTitle}</span>
          </>
        );
      case 'followed_user':
        return (
          <>
            followed{' '}
            <Link to={targetLink} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {activity.metadata?.username || 'a user'}
            </Link>
          </>
        );
      default:
        return 'performed an action';
    }
  };

  const getTargetLink = () => {
    switch (activity.targetType) {
      case 'article':
        return `/news/${activity.targetId}`;
      case 'topic':
        return `/forum/t/${activity.metadata?.slug || activity.targetId}/${activity.targetId}`;
      case 'reply':
        return `/forum/t/${activity.metadata?.topicSlug || 'topic'}/${activity.metadata?.topicId || activity.targetId}#reply-${activity.targetId}`;
      case 'job':
        return `/jobs/${activity.targetId}`;
      case 'badge':
        return `/badges#${activity.targetId}`;
      case 'user':
        return `/profile/${activity.metadata?.username || activity.targetId}`;
      default:
        return '#';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };

  return (
    <div className="flex gap-3">
      {/* Icon */}
      <div className="flex-shrink-0">{getActivityIcon()}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 dark:text-white">
          {showUser && activity.user && (
            <>
              <Link
                to={`/profile/${activity.user.username}`}
                className="font-semibold hover:text-primary-600 dark:hover:text-primary-400"
              >
                {activity.user.displayName}
              </Link>{' '}
            </>
          )}
          {getActivityDescription()}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {formatTimestamp(activity.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;
