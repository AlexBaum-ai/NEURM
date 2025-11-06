import React from 'react';

export interface ArticleCardSkeletonProps {
  variant?: 'grid' | 'list' | 'featured' | 'compact';
  count?: number;
}

/**
 * ArticleCardSkeleton Component
 *
 * Loading skeleton for ArticleCard component that matches all layout variants.
 * Used during data fetching to provide visual feedback and maintain layout stability.
 *
 * Features:
 * - Matches all ArticleCard variants (grid, list, featured, compact)
 * - Animated pulse effect
 * - Accessible loading state
 * - Multiple skeletons support
 *
 * @example
 * ```tsx
 * // Single skeleton
 * <ArticleCardSkeleton variant="grid" />
 *
 * // Multiple skeletons
 * <ArticleCardSkeleton variant="list" count={5} />
 * ```
 */
const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = ({ variant = 'grid', count = 1 }) => {
  const renderSkeleton = (key: number) => {
    // Grid variant skeleton
    if (variant === 'grid') {
      return (
        <div
          key={key}
          className="flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm animate-pulse"
          role="status"
          aria-label="Loading article"
        >
          {/* Image skeleton */}
          <div className="h-48 bg-gray-200 dark:bg-gray-800" />

          <div className="flex flex-col flex-1 p-4">
            {/* Title skeleton */}
            <div className="space-y-2 mb-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-4/5" />
            </div>

            {/* Summary skeleton */}
            <div className="space-y-2 mb-4 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            </div>

            {/* Tags skeleton */}
            <div className="flex gap-2 mb-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-18" />
            </div>

            {/* Author skeleton */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
              </div>
            </div>

            {/* Metadata skeleton */}
            <div className="flex items-center gap-4 mt-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
            </div>
          </div>
        </div>
      );
    }

    // List variant skeleton
    if (variant === 'list') {
      return (
        <div
          key={key}
          className="flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm animate-pulse"
          role="status"
          aria-label="Loading article"
        >
          {/* Image skeleton */}
          <div className="h-32 w-32 bg-gray-200 dark:bg-gray-800 rounded-md flex-shrink-0" />

          <div className="flex flex-col flex-1 min-w-0">
            {/* Category/difficulty skeleton */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-20" />
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-24" />
            </div>

            {/* Title skeleton */}
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5" />
            </div>

            {/* Summary skeleton */}
            <div className="space-y-2 mb-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            </div>

            {/* Tags skeleton */}
            <div className="flex gap-2 mb-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-20" />
            </div>

            {/* Author and metadata skeleton */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32" />
              </div>
              <div className="flex gap-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-12" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-12" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Featured variant skeleton
    if (variant === 'featured') {
      return (
        <div
          key={key}
          className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg animate-pulse"
          role="status"
          aria-label="Loading featured article"
        >
          {/* Image skeleton with gradient overlay */}
          <div className="relative h-80 sm:h-96 bg-gray-200 dark:bg-gray-800">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {/* Category/difficulty skeleton */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 bg-gray-700 rounded-full w-24" />
                <div className="h-6 bg-gray-700 rounded-full w-28" />
              </div>

              {/* Title skeleton */}
              <div className="space-y-3 mb-4">
                <div className="h-8 bg-gray-700 rounded w-full" />
                <div className="h-8 bg-gray-700 rounded w-3/4" />
              </div>

              {/* Summary skeleton */}
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-700 rounded w-2/3" />
              </div>

              {/* Author and metadata skeleton */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-700 rounded-full" />
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-700 rounded w-24" />
                    <div className="h-3 bg-gray-700 rounded w-20" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-700 rounded w-16" />
                  <div className="h-4 bg-gray-700 rounded w-16" />
                </div>
              </div>
            </div>
          </div>

          {/* Tags skeleton */}
          <div className="p-4">
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-18" />
            </div>
          </div>
        </div>
      );
    }

    // Compact variant skeleton
    if (variant === 'compact') {
      return (
        <div
          key={key}
          className="flex gap-3 p-3 rounded-lg animate-pulse"
          role="status"
          aria-label="Loading article"
        >
          {/* Image skeleton */}
          <div className="h-20 w-20 bg-gray-200 dark:bg-gray-800 rounded flex-shrink-0" />

          <div className="flex flex-col flex-1 min-w-0">
            {/* Title skeleton */}
            <div className="space-y-1 mb-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            </div>

            {/* Author/date skeleton */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-20" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16" />
            </div>

            {/* Tags skeleton */}
            <div className="flex gap-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-12" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {Array.from({ length: count }, (_, i) => renderSkeleton(i))}
      <span className="sr-only">Loading articles...</span>
    </>
  );
};

export default ArticleCardSkeleton;
