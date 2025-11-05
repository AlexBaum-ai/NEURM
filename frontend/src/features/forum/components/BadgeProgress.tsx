/**
 * BadgeProgress Component
 * Displays progress bar for locked badges
 */

import React from 'react';
import type { BadgeProgress as BadgeProgressType } from '../types/badge';

interface BadgeProgressProps {
  progress: BadgeProgressType;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const BadgeProgress: React.FC<BadgeProgressProps> = ({
  progress,
  size = 'medium',
  showLabel = true,
  className = '',
}) => {
  const { current, required, percentage } = progress;

  // Size configurations
  const sizeClasses = {
    small: {
      container: 'w-full',
      bar: 'h-1.5',
      text: 'text-xs',
    },
    medium: {
      container: 'w-full',
      bar: 'h-2',
      text: 'text-sm',
    },
    large: {
      container: 'w-full',
      bar: 'h-3',
      text: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  // Determine progress color based on percentage
  const getProgressColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const progressColor = getProgressColor();

  return (
    <div className={`${sizes.container} ${className}`} aria-label="Badge progress">
      {/* Progress Bar */}
      <div
        className={`
          relative ${sizes.bar} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
        `}
      >
        <div
          className={`
            absolute inset-y-0 left-0 ${progressColor} transition-all duration-500 ease-out
          `}
          style={{ width: `${Math.min(percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={required}
        />

        {/* Animated shimmer effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      {/* Progress Label */}
      {showLabel && (
        <div className={`flex justify-between items-center mt-2 ${sizes.text}`}>
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{current}</span>
            <span className="mx-1">/</span>
            <span>{required}</span>
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Add keyframe animation for shimmer effect to global styles
// This should be added to your tailwind.config.js:
/*
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
};
*/

export default BadgeProgress;
