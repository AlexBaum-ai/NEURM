import React, { useState } from 'react';
import { Card, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { ActivityTimeline } from './ActivityTimeline';
import { useUserActivities } from '../hooks/useActivities';
import type { ActivityType, ActivityGroup } from '../types';

interface ActivityFeedProps {
  username: string;
}

type ActivityFilter = ActivityType | 'all';

/**
 * ActivityFeed - Main component for displaying user activity feed
 *
 * Features:
 * - Activity type filter dropdown
 * - Infinite scroll
 * - Time-grouped timeline view
 * - Empty state
 * - Loading states
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({ username }) => {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');

  const filterType = activeFilter === 'all' ? undefined : activeFilter;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUserActivities(
    username,
    filterType
  );

  // Flatten all groups from all pages
  const allGroups: ActivityGroup[] =
    data?.pages.flatMap((page) => page.groups) || [];

  // Merge groups with the same timeGroup
  const mergedGroups = allGroups.reduce((acc, group) => {
    const existingGroup = acc.find((g) => g.timeGroup === group.timeGroup);
    if (existingGroup) {
      existingGroup.activities.push(...group.activities);
    } else {
      acc.push({ ...group });
    }
    return acc;
  }, [] as ActivityGroup[]);

  const isEmpty = !isLoading && mergedGroups.length === 0;

  const filters: { value: ActivityFilter; label: string }[] = [
    { value: 'all', label: 'All Activity' },
    { value: 'posted_article', label: 'Articles' },
    { value: 'created_topic', label: 'Topics' },
    { value: 'replied', label: 'Replies' },
    { value: 'upvoted', label: 'Upvotes' },
    { value: 'bookmarked', label: 'Bookmarks' },
    { value: 'applied_job', label: 'Job Applications' },
    { value: 'earned_badge', label: 'Badges' },
    { value: 'followed_user', label: 'Follows' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Dropdown */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="activity-filter"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Filter by type
            </label>
            <select
              id="activity-filter"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as ActivityFilter)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {filters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No activity yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeFilter === 'all'
                  ? 'This user has not performed any activities yet.'
                  : `No activities of type "${filters.find((f) => f.value === activeFilter)?.label}" found.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-6">
              <ActivityTimeline groups={mergedGroups} showUser={false} />
            </CardContent>
          </Card>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline">
                {isFetchingNextPage ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityFeed;
