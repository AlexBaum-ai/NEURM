/**
 * Spam Score Indicator Component
 *
 * Displays spam score with color-coded visualization
 */

import React from 'react';

interface SpamScoreIndicatorProps {
  score: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SpamScoreIndicator: React.FC<SpamScoreIndicatorProps> = ({
  score,
  showLabel = true,
  size = 'md',
}) => {
  const getScoreColor = (score: number): string => {
    if (score < 30) return 'bg-green-500';
    if (score < 60) return 'bg-yellow-500';
    if (score < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number): string => {
    if (score < 30) return 'text-green-700 dark:text-green-400';
    if (score < 60) return 'text-yellow-700 dark:text-yellow-400';
    if (score < 80) return 'text-orange-700 dark:text-orange-400';
    return 'text-red-700 dark:text-red-400';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { container: 'h-1.5 w-16', text: 'text-xs' };
      case 'lg':
        return { container: 'h-3 w-32', text: 'text-base' };
      default:
        return { container: 'h-2 w-24', text: 'text-sm' };
    }
  };

  const sizeClasses = getSizeClasses();
  const scoreColor = getScoreColor(score);
  const textColor = getScoreTextColor(score);

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className={`font-medium ${textColor} ${sizeClasses.text}`}>
          {Math.round(score)}%
        </span>
      )}
      <div className={`relative ${sizeClasses.container} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`absolute inset-y-0 left-0 ${scoreColor} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default SpamScoreIndicator;
