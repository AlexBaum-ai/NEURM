/**
 * RevisionTimeline component - displays article revisions in a timeline format
 */

import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, User } from 'lucide-react';
import type { ArticleRevision } from '../types';

interface RevisionTimelineProps {
  revisions: ArticleRevision[];
  selectedRevisionId: string | null;
  onSelectRevision: (revision: ArticleRevision) => void;
  isLoading?: boolean;
}

const RevisionTimeline: React.FC<RevisionTimelineProps> = ({
  revisions,
  selectedRevisionId,
  onSelectRevision,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No revision history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {revisions.map((revision, index) => {
        const isSelected = revision.id === selectedRevisionId;
        const isLatest = index === 0;

        return (
          <button
            key={revision.id}
            onClick={() => onSelectRevision(revision)}
            className={`
              w-full text-left p-4 rounded-lg transition-colors
              ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {revision.createdBy.avatar ? (
                  <img
                    src={revision.createdBy.avatar}
                    alt={revision.createdBy.username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {revision.createdBy.username}
                  </span>
                  {isLatest && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span title={format(new Date(revision.createdAt), 'PPpp')}>
                    {formatDistanceToNow(new Date(revision.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Revision number */}
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  Revision #{revision.revisionNumber}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default RevisionTimeline;
