import React from 'react';
import { Badge } from '@/components/common/Badge/Badge';
import { cn } from '@/lib/utils';

interface MatchBadgeProps {
  matchScore: number;
  className?: string;
  showTooltip?: boolean;
  tooltipText?: string;
}

/**
 * Get color variant based on match score
 * >80% = green, 60-80% = yellow, <60% = gray
 */
const getMatchVariant = (score: number): 'success' | 'warning' | 'secondary' => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'secondary';
};

/**
 * Get color classes for the match badge
 */
const getMatchColorClasses = (score: number): string => {
  if (score >= 80) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
  if (score >= 60) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

export const MatchBadge: React.FC<MatchBadgeProps> = ({
  matchScore,
  className,
  showTooltip = false,
  tooltipText,
}) => {
  const colorClasses = getMatchColorClasses(matchScore);

  const badge = (
    <Badge
      variant={getMatchVariant(matchScore)}
      className={cn(
        'font-semibold',
        colorClasses,
        className
      )}
    >
      {matchScore}% Match
    </Badge>
  );

  if (showTooltip && tooltipText) {
    return (
      <div className="relative group inline-block">
        {badge}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {tooltipText}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return badge;
};

export default MatchBadge;
