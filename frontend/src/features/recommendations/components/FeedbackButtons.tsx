import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import type { RecommendationType, FeedbackType } from '../types';
import { cn } from '@/lib/utils';

interface FeedbackButtonsProps {
  itemType: RecommendationType;
  itemId: string;
  onFeedback: (feedback: FeedbackType) => void;
  isSubmitting?: boolean;
}

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  itemType,
  itemId,
  onFeedback,
  isSubmitting = false,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<FeedbackType | null>(null);

  const handleFeedback = (feedback: FeedbackType) => {
    setFeedbackGiven(feedback);
    onFeedback(feedback);
  };

  if (feedbackGiven) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {feedbackGiven === 'like' && 'Thanks for your feedback!'}
        {feedbackGiven === 'dislike' && 'We\'ll show you less like this'}
        {feedbackGiven === 'dismiss' && 'Dismissed'}
        {feedbackGiven === 'not_interested' && 'Noted'}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleFeedback('like')}
        disabled={isSubmitting}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          'text-gray-400 hover:text-green-600 hover:bg-green-50',
          'dark:hover:text-green-400 dark:hover:bg-green-900/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="More like this"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleFeedback('dislike')}
        disabled={isSubmitting}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          'text-gray-400 hover:text-red-600 hover:bg-red-50',
          'dark:hover:text-red-400 dark:hover:bg-red-900/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Less like this"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleFeedback('dismiss')}
        disabled={isSubmitting}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
          'dark:hover:text-gray-300 dark:hover:bg-gray-800',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
