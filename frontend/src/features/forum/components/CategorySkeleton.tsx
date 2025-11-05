/**
 * CategorySkeleton Component
 * Loading skeleton for category cards
 */

import React from 'react';
import { Card } from '@/components/common/Card/Card';

interface CategorySkeletonProps {
  count?: number;
  showSubcategories?: boolean;
}

export const CategorySkeleton: React.FC<CategorySkeletonProps> = ({
  count = 3,
  showSubcategories = true,
}) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          {/* Main Category Skeleton */}
          <Card className="animate-pulse">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Icon placeholder */}
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />

                  {/* Title and Description */}
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>

                {/* Follow Button placeholder */}
                <div className="flex-shrink-0 w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                <div className="ml-auto h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              </div>
            </div>
          </Card>

          {/* Subcategories Skeleton */}
          {showSubcategories && (
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: 2 }).map((_, subIndex) => (
                <Card key={subIndex} className="ml-8 animate-pulse">
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Icon placeholder */}
                        <div className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />

                        {/* Title and Description */}
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                      </div>

                      {/* Follow Button placeholder */}
                      <div className="flex-shrink-0 w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
                      <div className="ml-auto h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CategorySkeleton;
