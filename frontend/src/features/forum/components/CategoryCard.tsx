/**
 * CategoryCard Component
 * Displays a forum category card with stats, description, and actions
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, FileText, Users, Info } from 'lucide-react';
import type { ForumCategory } from '../types';
import { Card } from '@/components/common/Card/Card';

interface CategoryCardProps {
  category: ForumCategory;
  isSubcategory?: boolean;
  onFollowToggle?: (categoryId: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSubcategory = false,
  onFollowToggle,
}) => {
  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFollowToggle?.(category.id);
  };

  const lastActivityText = category.lastActivityAt
    ? formatDistanceToNow(new Date(category.lastActivityAt), { addSuffix: true })
    : 'No activity yet';

  return (
    <Link to={`/forum/c/${category.slug}`} className="block">
      <Card
        className={`
          group hover:shadow-lg hover:border-primary-500
          transition-all duration-200 cursor-pointer
          ${isSubcategory ? 'ml-8 border-l-4 border-l-primary-300' : ''}
        `}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon */}
              {category.icon && (
                <div className="flex-shrink-0 text-3xl" title={category.name}>
                  {category.icon}
                </div>
              )}

              {/* Title and Description */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </div>

            {/* Follow Button */}
            {onFollowToggle && (
              <button
                onClick={handleFollowClick}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium
                  transition-colors
                  ${
                    category.isFollowing
                      ? 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }
                `}
                title={category.isFollowing ? 'Unfollow category' : 'Follow category'}
              >
                {category.isFollowing ? 'Following' : 'Follow'}
                {category.followerCount !== undefined && category.followerCount > 0 && (
                  <span className="ml-1">({category.followerCount})</span>
                )}
              </button>
            )}
          </div>

          {/* Guidelines Tooltip */}
          {category.guidelines && (
            <div className="mb-3 flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-xs text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="line-clamp-2">{category.guidelines}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {/* Topics */}
            <div className="flex items-center gap-1.5" title="Topics">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">{category.topicCount}</span>
            </div>

            {/* Posts */}
            <div className="flex items-center gap-1.5" title="Posts">
              <FileText className="w-4 h-4" />
              <span className="font-medium">{category.postCount}</span>
            </div>

            {/* Followers (if available) */}
            {category.followerCount !== undefined && category.followerCount > 0 && (
              <div className="flex items-center gap-1.5" title="Followers">
                <Users className="w-4 h-4" />
                <span className="font-medium">{category.followerCount}</span>
              </div>
            )}

            {/* Last Activity */}
            {category.lastActivityAt && (
              <div className="ml-auto text-xs" title="Last activity">
                <span className="text-gray-500 dark:text-gray-500">
                  {lastActivityText}
                </span>
                {category.lastActivity && (
                  <span className="ml-1 text-gray-700 dark:text-gray-300">
                    by {category.lastActivity.displayName || category.lastActivity.username}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Visibility Badge */}
          {category.visibility !== 'public' && (
            <div className="mt-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              {category.visibility === 'private' ? 'Private' : 'Moderator Only'}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default CategoryCard;
