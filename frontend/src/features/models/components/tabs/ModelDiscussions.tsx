import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card/Card';
import { useModelDiscussions } from '../../hooks/useModels';
import type { ModelDiscussion } from '../../types';

interface ModelDiscussionsProps {
  modelSlug: string;
}

const ModelDiscussionsContent: React.FC<ModelDiscussionsProps> = ({ modelSlug }) => {
  const { data } = useModelDiscussions(modelSlug);

  if (!data || data.discussions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No discussions found for this model yet.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Be the first to start a conversation!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.discussions.map((discussion: ModelDiscussion) => (
        <Card key={discussion.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Author Avatar */}
              <div className="flex-shrink-0">
                {discussion.author.avatar ? (
                  <img
                    src={discussion.author.avatar}
                    alt={discussion.author.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                    {discussion.author.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Discussion Content */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/forum/${discussion.slug}`}
                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {discussion.title}
                </Link>
                {discussion.excerpt && (
                  <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {discussion.excerpt}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                  <span className="font-medium">{discussion.author.displayName}</span>
                  <span>•</span>
                  <time dateTime={discussion.createdAt}>
                    {new Date(discussion.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    💬 {discussion.replyCount} {discussion.replyCount === 1 ? 'reply' : 'replies'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    👁️ {discussion.viewCount.toLocaleString()} views
                  </span>
                </div>
                {discussion.lastActivity && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    Last activity:{' '}
                    {new Date(discussion.lastActivity).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {data.total > data.discussions.length && (
        <div className="text-center py-4">
          <Link
            to={`/forum?model=${modelSlug}`}
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            View all {data.total} discussions →
          </Link>
        </div>
      )}
    </div>
  );
};

export const ModelDiscussions: React.FC<ModelDiscussionsProps> = (props) => {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    >
      <ModelDiscussionsContent {...props} />
    </Suspense>
  );
};

export default ModelDiscussions;
