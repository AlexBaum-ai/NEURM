/**
 * BadgeCard Component
 * Displays a badge with icon, name, description, and rarity styling
 * Supports both earned and locked states with progress tracking
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { BadgeWithProgress, BadgeRarity } from '../types/badge';
import { BADGE_RARITY_CONFIG, BADGE_TYPE_CONFIG } from '../types/badge';
import BadgeProgress from './BadgeProgress';

interface BadgeCardProps {
  badge: BadgeWithProgress;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  showDescription?: boolean;
  onClick?: (badge: BadgeWithProgress) => void;
  className?: string;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  size = 'medium',
  showProgress = true,
  showDescription = true,
  onClick,
  className = '',
}) => {
  const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity];
  const typeConfig = BADGE_TYPE_CONFIG[badge.type];
  const isLocked = !badge.isEarned;

  // Size configurations
  const sizeClasses = {
    small: {
      card: 'p-3',
      icon: 'text-3xl',
      name: 'text-sm font-medium',
      description: 'text-xs',
      rarity: 'text-xs',
    },
    medium: {
      card: 'p-4',
      icon: 'text-5xl',
      name: 'text-base font-semibold',
      description: 'text-sm',
      rarity: 'text-xs',
    },
    large: {
      card: 'p-6',
      icon: 'text-6xl',
      name: 'text-lg font-bold',
      description: 'text-base',
      rarity: 'text-sm',
    },
  };

  const sizes = sizeClasses[size];

  const handleClick = () => {
    if (onClick) {
      onClick(badge);
    }
  };

  return (
    <div
      className={`
        relative rounded-lg border-2 transition-all duration-300
        ${rarityConfig.bgColor} ${rarityConfig.borderColor}
        ${isLocked ? 'opacity-60' : 'opacity-100'}
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${sizes.card}
        ${className}
      `}
      onClick={handleClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${badge.name} badge - ${badge.isEarned ? 'Earned' : 'Locked'}`}
    >
      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Locked</span>
        </div>
      )}

      {/* Rarity Badge */}
      <div className={`absolute top-2 left-2 ${rarityConfig.color} ${sizes.rarity} font-bold`}>
        {rarityConfig.label}
      </div>

      {/* Badge Content */}
      <div className="flex flex-col items-center text-center mt-4">
        {/* Icon */}
        <div
          className={`
            ${sizes.icon} mb-3
            ${isLocked ? 'grayscale' : ''}
            transition-all duration-300
          `}
          aria-hidden="true"
        >
          {badge.icon}
        </div>

        {/* Name */}
        <h3 className={`${sizes.name} ${rarityConfig.textColor} mb-2`}>
          {badge.name}
        </h3>

        {/* Description */}
        {showDescription && (
          <p className={`${sizes.description} text-gray-600 dark:text-gray-400 mb-3`}>
            {badge.description}
          </p>
        )}

        {/* Type Badge */}
        <div className="inline-flex items-center gap-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full mb-3">
          <span>{typeConfig.icon}</span>
          <span className="text-gray-700 dark:text-gray-300">{typeConfig.label}</span>
        </div>

        {/* Earned Date or Progress */}
        {badge.isEarned && badge.earnedAt ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Earned {formatDistanceToNow(new Date(badge.earnedAt), { addSuffix: true })}
          </div>
        ) : (
          showProgress &&
          badge.progress && <BadgeProgress progress={badge.progress} size={size} />
        )}
      </div>

      {/* Legendary Glow Effect */}
      {badge.rarity === 'legendary' && badge.isEarned && (
        <div
          className="absolute inset-0 rounded-lg opacity-30 animate-pulse pointer-events-none"
          style={{
            boxShadow: '0 0 20px 5px rgba(251, 191, 36, 0.6)',
          }}
        />
      )}
    </div>
  );
};

export default BadgeCard;
