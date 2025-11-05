/**
 * VoteButton Component
 * Individual upvote/downvote button with animations and accessibility
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteButtonProps {
  type: 'upvote' | 'downvote';
  isActive: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
  tooltip?: string;
}

/**
 * VoteButton - Individual vote button with icon and animations
 *
 * Features:
 * - Active/inactive states with color changes
 * - Smooth hover and click animations
 * - Disabled state for insufficient permissions
 * - Full accessibility support
 */
export const VoteButton: React.FC<VoteButtonProps> = ({
  type,
  isActive,
  isDisabled = false,
  onClick,
  ariaLabel,
  tooltip,
}) => {
  const Icon = type === 'upvote' ? ChevronUp : ChevronDown;

  const getButtonClasses = () => {
    const baseClasses = 'p-1.5 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    if (isDisabled) {
      return cn(
        baseClasses,
        'cursor-not-allowed opacity-50',
        'text-gray-400 dark:text-gray-600',
        'focus:ring-gray-300 dark:focus:ring-gray-700'
      );
    }

    if (isActive) {
      if (type === 'upvote') {
        return cn(
          baseClasses,
          'text-green-600 dark:text-green-400',
          'bg-green-50 dark:bg-green-900/20',
          'hover:bg-green-100 dark:hover:bg-green-900/30',
          'focus:ring-green-500'
        );
      } else {
        return cn(
          baseClasses,
          'text-red-600 dark:text-red-400',
          'bg-red-50 dark:bg-red-900/20',
          'hover:bg-red-100 dark:hover:bg-red-900/30',
          'focus:ring-red-500'
        );
      }
    }

    // Inactive state
    return cn(
      baseClasses,
      'text-gray-500 dark:text-gray-400',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      type === 'upvote'
        ? 'hover:text-green-600 dark:hover:text-green-400 focus:ring-green-500'
        : 'hover:text-red-600 dark:hover:text-red-400 focus:ring-red-500'
    );
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={tooltip}
      className={getButtonClasses()}
      whileHover={!isDisabled ? { scale: 1.1 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Icon
        size={20}
        strokeWidth={2.5}
        className="transition-transform duration-200"
      />
    </motion.button>
  );
};

export default VoteButton;
