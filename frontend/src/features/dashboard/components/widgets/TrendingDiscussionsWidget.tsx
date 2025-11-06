import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Eye, TrendingUp, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { TrendingDiscussion } from '../../types';

interface TrendingDiscussionsWidgetProps {
  discussions: TrendingDiscussion[];
}

export const TrendingDiscussionsWidget: React.FC<TrendingDiscussionsWidgetProps> = ({
  discussions,
}) => {
  return (
    <div className="space-y-3">
      {discussions.slice(0, 5).map((discussion) => (
        <Link
          key={discussion.id}
          to={`/forum/t/${discussion.slug}/${discussion.id}`}
          className="block group hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 py-3 rounded-lg transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {discussion.author.avatarUrl ? (
                <img
                  src={discussion.author.avatarUrl}
                  alt={discussion.author.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">
                  {discussion.author.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-1">
                {discussion.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                  {discussion.categoryName}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {discussion.replyCount}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {discussion.voteCount}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}

      {discussions.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No trending discussions</p>
        </div>
      )}

      {discussions.length > 0 && (
        <Link
          to="/forum"
          className="flex items-center justify-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors pt-2"
        >
          Browse forum
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};
