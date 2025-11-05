/**
 * ProfileBadgesSection Component
 * Displays user's badges on their profile page
 * Shows earned badges prominently and locked badges with progress
 */

import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import BadgeCard from './BadgeCard';
import BadgeModal from './BadgeModal';
import BadgeShareButton from './BadgeShareButton';
import { useUserBadges } from '../hooks/useBadges';
import type { BadgeWithProgress } from '../types/badge';

interface ProfileBadgesSectionProps {
  userId: string;
  username: string;
  isOwnProfile?: boolean;
  showProgress?: boolean;
  maxBadges?: number; // Max badges to show before "View All" link
  className?: string;
}

/**
 * Profile Badges Content (uses Suspense)
 */
const ProfileBadgesContent: React.FC<ProfileBadgesSectionProps> = ({
  userId,
  username,
  isOwnProfile = false,
  showProgress = true,
  maxBadges = 6,
  className = '',
}) => {
  const { data } = useUserBadges(userId);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);

  const { earned, progress, stats } = data;

  // Combine earned badges with progress badges
  const earnedBadges: BadgeWithProgress[] = earned.map((userBadge) => ({
    ...userBadge.badge,
    isEarned: true,
    earnedAt: userBadge.earnedAt,
    progress: undefined,
  }));

  // Show only locked badges with progress if it's the user's own profile
  const lockedBadgesWithProgress = isOwnProfile && showProgress ? progress.slice(0, 3) : [];

  // Limit earned badges if maxBadges is set
  const displayedEarnedBadges = earnedBadges.slice(0, maxBadges);
  const hasMoreBadges = earnedBadges.length > maxBadges;

  const handleBadgeClick = (badge: BadgeWithProgress) => {
    setSelectedBadge(badge);
  };

  const handleCloseModal = () => {
    setSelectedBadge(null);
  };

  const handleShare = () => {
    // Share functionality handled by BadgeShareButton in modal
  };

  return (
    <div className={`${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Badges</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.earnedBadges} earned • {stats.lockedBadges} locked
          </p>
        </div>
        <Link
          to="/badges"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View All Badges →
        </Link>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 ? (
        <>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Earned ({stats.earnedBadges})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {displayedEarnedBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  size="small"
                  showProgress={false}
                  showDescription={false}
                  onClick={handleBadgeClick}
                />
              ))}
            </div>
            {hasMoreBadges && (
              <div className="mt-3 text-center">
                <Link
                  to={`/u/${username}/badges`}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all {earnedBadges.length} earned badges →
                </Link>
              </div>
            )}
          </div>

          {/* Progress on Locked Badges (Own Profile Only) */}
          {isOwnProfile && lockedBadgesWithProgress.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                In Progress
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {lockedBadgesWithProgress.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    size="small"
                    showProgress={true}
                    showDescription={false}
                    onClick={handleBadgeClick}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* No Badges Yet */
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">
            {isOwnProfile
              ? "You haven't earned any badges yet"
              : `${username} hasn't earned any badges yet`}
          </p>
          <Link
            to="/badges"
            className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Discover badges you can earn →
          </Link>
        </div>
      )}

      {/* Badge Modal */}
      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge}
          onClose={handleCloseModal}
          onShare={selectedBadge.isEarned ? handleShare : undefined}
        />
      )}
    </div>
  );
};

/**
 * Loading Skeleton
 */
const ProfileBadgesSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Main Profile Badges Section Component
 */
const ProfileBadgesSection: React.FC<ProfileBadgesSectionProps> = (props) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">Failed to load badges</p>
        </div>
      }
    >
      <Suspense fallback={<ProfileBadgesSkeleton />}>
        <ProfileBadgesContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default ProfileBadgesSection;
