/**
 * BadgesPage Component
 * Main page for browsing all available badges in the system
 * Route: /badges
 */

import React, { Suspense, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import BadgeGallery from '../components/BadgeGallery';
import BadgeModal from '../components/BadgeModal';
import { useBadges } from '../hooks/useBadges';
import type { BadgeWithProgress } from '../types/badge';

/**
 * Badge Gallery Content Component (uses Suspense)
 */
const BadgeGalleryContent: React.FC = () => {
  const { data } = useBadges();
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);

  // Transform badges to include earned status (for public gallery, all are locked)
  const badgesWithProgress: BadgeWithProgress[] = data.badges.map((badge) => ({
    ...badge,
    isEarned: false, // Public gallery shows all badges as locked
    progress: undefined, // No progress for public view
  }));

  const handleBadgeClick = (badge: BadgeWithProgress) => {
    setSelectedBadge(badge);
  };

  const handleCloseModal = () => {
    setSelectedBadge(null);
  };

  return (
    <>
      <BadgeGallery
        badges={badgesWithProgress}
        showFilters={true}
        onBadgeClick={handleBadgeClick}
      />
      {selectedBadge && <BadgeModal badge={selectedBadge} onClose={handleCloseModal} />}
    </>
  );
};

/**
 * Loading Skeleton for Badge Gallery
 */
const BadgeGallerySkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Filter Skeleton */}
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          ))}
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Main BadgesPage Component
 */
const BadgesPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Badge Gallery | Neurmatic</title>
        <meta
          name="description"
          content="Browse all available badges and achievements in the Neurmatic community"
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Badge Gallery
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Discover all achievements and badges you can earn in the Neurmatic community
            </p>
          </div>

          {/* Info Banner */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  About Badges
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Badges are earned by participating in the community, contributing valuable content,
                  and helping others. View your earned badges on your{' '}
                  <a href="/profile" className="underline hover:no-underline">
                    profile page
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Badge Gallery */}
          <ErrorBoundary
            fallback={
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  Failed to load badges. Please try again later.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            }
          >
            <Suspense fallback={<BadgeGallerySkeleton />}>
              <BadgeGalleryContent />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
};

export default BadgesPage;
