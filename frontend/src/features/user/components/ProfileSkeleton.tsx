import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/common/Card/Card';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="container-custom py-8 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <Card>
        {/* Cover */}
        <div className="h-48 md:h-64 bg-gray-200 dark:bg-gray-700"></div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 md:-mt-20 mb-4">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-300 dark:bg-gray-600 border-4 border-white dark:border-gray-900"></div>
          </div>

          {/* Name */}
          <div className="space-y-3 mb-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>

          {/* Metadata */}
          <div className="flex gap-4 mb-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Content Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
