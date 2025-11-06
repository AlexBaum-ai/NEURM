import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import {
  UserPlus,
  FileText,
  AlertTriangle,
  Briefcase,
  Activity as ActivityIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Activity } from '../types';

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: Activity['type']) => {
    const iconProps = { className: 'h-5 w-5' };

    switch (type) {
      case 'user':
        return <UserPlus {...iconProps} className="h-5 w-5 text-blue-500" />;
      case 'content':
        return <FileText {...iconProps} className="h-5 w-5 text-green-500" />;
      case 'report':
        return <AlertTriangle {...iconProps} className="h-5 w-5 text-red-500" />;
      case 'application':
        return <Briefcase {...iconProps} className="h-5 w-5 text-purple-500" />;
      default:
        return <ActivityIcon {...iconProps} className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No recent activity
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {activity.description}
                  </p>
                  {activity.user && (
                    <div className="flex items-center gap-2 mt-2">
                      {activity.user.avatar ? (
                        <img
                          src={activity.user.avatar}
                          alt={activity.user.name}
                          className="h-5 w-5 rounded-full"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.user.name}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
