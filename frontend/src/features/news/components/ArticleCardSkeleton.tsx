import React from 'react';
import type { ViewMode } from '../types';

interface ArticleCardSkeletonProps {
  viewMode?: ViewMode;
}

export const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = ({ viewMode = 'grid' }) => {
  const isGridView = viewMode === 'grid';

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden animate-pulse
        ${isGridView ? 'flex flex-col' : 'flex flex-row'}
      `}
    >
      {/* Featured Image Skeleton */}
      <div
        className={`
          bg-gray-200 dark:bg-gray-700
          ${isGridView ? 'aspect-video w-full' : 'w-48 flex-shrink-0 h-full'}
        `}
      />

      {/* Content Skeleton */}
      <div className={`flex flex-col p-4 ${isGridView ? 'flex-1' : 'flex-1 min-w-0'}`}>
        {/* Category Badge Skeleton */}
        <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2" />

        {/* Title Skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>

        {/* Summary Skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>

        {/* Tags Skeleton */}
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>

        {/* Meta Footer Skeleton */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
          {/* Author Skeleton */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>

          {/* Stats Skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
          </div>
        </div>

        {/* Date Skeleton */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-2" />
      </div>
    </div>
  );
};

export const ArticleGridSkeleton: React.FC<{ count?: number; viewMode?: ViewMode }> = ({
  count = 6,
  viewMode = 'grid',
}) => {
  const isGridView = viewMode === 'grid';

  return (
    <div className={isGridView ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
      {Array.from({ length: count }).map((_, index) => (
        <ArticleCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  );
};

export default ArticleCardSkeleton;
