import React from 'react';
import { Card } from '@/components/common/Card/Card';

export const RecommendationsWidgetSkeleton: React.FC = () => {
  return (
    <Card>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
      </div>

      <div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const RecommendationsSidebarSkeleton: React.FC = () => {
  return (
    <Card>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      <div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
