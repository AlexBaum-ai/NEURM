/**
 * BadgeModal Component
 * Displays detailed information about a badge in a modal
 */

import React from 'react';
import Modal from '@/components/common/Modal/Modal';
import type { BadgeWithProgress } from '../types/badge';
import { BADGE_RARITY_CONFIG, BADGE_TYPE_CONFIG } from '../types/badge';
import BadgeProgress from './BadgeProgress';
import { formatDistanceToNow } from 'date-fns';

interface BadgeModalProps {
  badge: BadgeWithProgress;
  onClose: () => void;
  onShare?: () => void;
}

const BadgeModal: React.FC<BadgeModalProps> = ({ badge, onClose, onShare }) => {
  const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity];
  const typeConfig = BADGE_TYPE_CONFIG[badge.type];
  const isLocked = !badge.isEarned;

  return (
    <Modal isOpen={true} onClose={onClose} title="" size="medium">
      <div className="p-6">
        {/* Badge Header */}
        <div className="text-center mb-6">
          {/* Rarity Badge */}
          <div className={`inline-block ${rarityConfig.color} text-sm font-bold mb-4`}>
            {rarityConfig.label} Badge
          </div>

          {/* Icon */}
          <div
            className={`
              text-8xl mb-4
              ${isLocked ? 'grayscale opacity-60' : ''}
              ${badge.rarity === 'legendary' && badge.isEarned ? 'animate-pulse' : ''}
            `}
          >
            {badge.icon}
          </div>

          {/* Name */}
          <h2 className={`text-2xl font-bold ${rarityConfig.textColor} mb-2`}>
            {badge.name}
          </h2>

          {/* Type */}
          <div className="inline-flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full mb-4">
            <span>{typeConfig.icon}</span>
            <span className="text-gray-700 dark:text-gray-300">{typeConfig.label}</span>
          </div>

          {/* Locked/Earned Status */}
          {isLocked ? (
            <div className="inline-flex items-center gap-2 bg-gray-700 text-white text-sm px-3 py-1 rounded-full">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Locked</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-green-600 text-white text-sm px-3 py-1 rounded-full">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Earned</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Description
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{badge.description}</p>
        </div>

        {/* Category */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Category</h3>
          <p className="text-gray-600 dark:text-gray-400">{badge.category}</p>
        </div>

        {/* Progress or Earned Date */}
        {badge.isEarned && badge.earnedAt ? (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Earned Date
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formatDistanceToNow(new Date(badge.earnedAt), { addSuffix: true })}
            </p>
          </div>
        ) : (
          badge.progress && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Progress
              </h3>
              <BadgeProgress progress={badge.progress} size="large" showLabel={true} />
            </div>
          )
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {badge.isEarned && onShare && (
            <button
              onClick={onShare}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share Badge
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BadgeModal;
