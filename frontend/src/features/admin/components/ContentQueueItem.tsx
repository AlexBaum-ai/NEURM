/**
 * Content Queue Item Component
 *
 * Individual content item in the moderation queue
 */

import React, { useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { ContentItem } from '../types';
import ContentTypeBadge from './ContentTypeBadge';
import StatusBadge from './StatusBadge';
import SpamScoreIndicator from './SpamScoreIndicator';
import Button from '@/components/common/Button/Button';

interface ContentQueueItemProps {
  item: ContentItem;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onView: (item: ContentItem) => void;
  onQuickApprove?: (item: ContentItem) => void;
  onQuickReject?: (item: ContentItem) => void;
}

const ContentQueueItem: React.FC<ContentQueueItemProps> = ({
  item,
  isSelected,
  onSelect,
  onView,
  onQuickApprove,
  onQuickReject,
}) => {
  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSelect(item.id, e.target.checked);
    },
    [item.id, onSelect]
  );

  const handleView = useCallback(() => {
    onView(item);
  }, [item, onView]);

  const handleQuickApprove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onQuickApprove?.(item);
    },
    [item, onQuickApprove]
  );

  const handleQuickReject = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onQuickReject?.(item);
    },
    [item, onQuickReject]
  );

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleView}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className="flex items-center pt-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
          />
        </div>

        {/* Thumbnail or Icon */}
        {item.thumbnailUrl ? (
          <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-16 h-16 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
            {item.type === 'article' && '📄'}
            {item.type === 'topic' && '💬'}
            {item.type === 'reply' && '↩️'}
            {item.type === 'job' && '💼'}
          </div>
        )}

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
              {item.title}
            </h3>
            <div className="flex-shrink-0 flex items-center gap-2">
              <ContentTypeBadge type={item.type} />
              <StatusBadge status={item.status} />
            </div>
          </div>

          {item.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {item.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <div className="flex items-center gap-1">
              {item.author.avatarUrl ? (
                <img
                  src={item.author.avatarUrl}
                  alt={item.author.displayName}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}
              <span className="font-medium">{item.author.displayName}</span>
              {item.author.reputation !== undefined && (
                <span className="text-gray-400">({item.author.reputation})</span>
              )}
            </div>

            <span>•</span>

            <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>

            {item.categoryName && (
              <>
                <span>•</span>
                <span>{item.categoryName}</span>
              </>
            )}

            {item.jobTitle && (
              <>
                <span>•</span>
                <span>{item.jobTitle}</span>
              </>
            )}

            {item.reportCount > 0 && (
              <>
                <span>•</span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {item.reportCount} {item.reportCount === 1 ? 'report' : 'reports'}
                </span>
              </>
            )}
          </div>

          {/* Spam Score */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Spam Score:</span>
            <SpamScoreIndicator score={item.spamScore} size="sm" />
          </div>

          {/* Quick Actions */}
          {item.status === 'pending' && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="success" onClick={handleQuickApprove}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={handleQuickReject}>
                Reject
              </Button>
              <Button size="sm" variant="secondary" onClick={handleView}>
                Review
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentQueueItem;
