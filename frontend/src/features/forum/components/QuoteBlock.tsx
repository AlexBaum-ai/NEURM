/**
 * QuoteBlock Component
 * Displays quoted content from a parent reply
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Quote } from 'lucide-react';
import type { QuotedReply } from '../types';

interface QuoteBlockProps {
  quotedReply: QuotedReply;
  onRemove?: () => void;
}

export const QuoteBlock: React.FC<QuoteBlockProps> = ({ quotedReply, onRemove }) => {
  // Strip HTML tags for preview (max 200 chars)
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const contentPreview = stripHtml(quotedReply.content);
  const truncated = contentPreview.length > 200
    ? `${contentPreview.substring(0, 200)}...`
    : contentPreview;

  const timeAgo = formatDistanceToNow(new Date(quotedReply.createdAt), { addSuffix: true });

  return (
    <div className="relative mb-4 rounded-lg border-l-4 border-primary-500 bg-gray-50 p-3 dark:bg-gray-800">
      <div className="flex items-start gap-2">
        <Quote className="mt-1 h-4 w-4 flex-shrink-0 text-primary-500" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {quotedReply.authorUsername}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{truncated}</p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Remove quote"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default QuoteBlock;
