import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card/Card';
import type { ActivityFeedItem as ActivityFeedItemType } from '../types';

interface ActivityFeedItemProps {
  item: ActivityFeedItemType;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ item }) => {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'article':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'forum_post':
      case 'forum_reply':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'job':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'article':
        return 'Article';
      case 'forum_post':
        return 'Discussion';
      case 'forum_reply':
        return 'Reply';
      case 'job':
        return 'Job Posting';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Author Avatar */}
          <Link to={`/profile/${item.author.username}`} className="flex-shrink-0">
            {item.author.avatarUrl ? (
              <img
                src={item.author.avatarUrl}
                alt={item.author.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                  {item.author.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/profile/${item.author.username}`}
                  className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {item.author.displayName}
                </Link>
                <span className="text-gray-500 dark:text-gray-400">•</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                {getTypeIcon()}
                <span>{getTypeLabel()}</span>
              </div>
            </div>

            {/* Title and Excerpt */}
            <Link to={item.url} className="block group">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {item.excerpt}
              </p>
            </Link>

            {/* Stats */}
            {item.stats && (
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                {item.stats.views !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item.stats.views.toLocaleString()}
                  </span>
                )}
                {item.stats.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    {item.stats.likes.toLocaleString()}
                  </span>
                )}
                {item.stats.replies !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item.stats.replies.toLocaleString()}
                  </span>
                )}
                {item.stats.bookmarks !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    {item.stats.bookmarks.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeedItem;
