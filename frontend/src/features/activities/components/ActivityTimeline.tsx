import React from 'react';
import { ActivityItem } from './ActivityItem';
import type { ActivityGroup } from '../types';

interface ActivityTimelineProps {
  groups: ActivityGroup[];
  showUser?: boolean;
}

/**
 * ActivityTimeline - Display activities grouped by time period
 *
 * Features:
 * - Time grouping headers (Today, This Week, Earlier)
 * - Timeline layout with connecting lines
 * - Responsive design
 */
export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ groups, showUser = false }) => {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.timeGroup}>
          {/* Time Group Header */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
            {group.timeGroup}
          </h3>

          {/* Activities with Timeline */}
          <div className="relative space-y-6">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Activity Items */}
            {group.activities.map((activity) => (
              <div key={activity.id} className="relative pl-12">
                <ActivityItem activity={activity} showUser={showUser} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
