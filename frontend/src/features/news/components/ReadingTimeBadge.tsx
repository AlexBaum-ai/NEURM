/**
 * ReadingTimeBadge Component
 *
 * Displays estimated reading time for an article.
 * Shows a badge with clock icon and "X min read" text.
 */

import React from 'react';
import { Clock } from 'lucide-react';

interface ReadingTimeBadgeProps {
  minutes: number;
  className?: string;
  variant?: 'default' | 'compact';
}

export const ReadingTimeBadge: React.FC<ReadingTimeBadgeProps> = ({
  minutes,
  className = '',
  variant = 'default',
}) => {
  const formatReadingTime = (mins: number): string => {
    if (mins < 1) return '< 1 min read';
    if (mins === 1) return '1 min read';
    return `${mins} min read`;
  };

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 ${className}`}
        aria-label={`Estimated reading time: ${minutes} minutes`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>{minutes} min</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium
        bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ${className}`}
      aria-label={`Estimated reading time: ${minutes} minutes`}
    >
      <Clock className="w-4 h-4" />
      <span>{formatReadingTime(minutes)}</span>
    </span>
  );
};

export default ReadingTimeBadge;
