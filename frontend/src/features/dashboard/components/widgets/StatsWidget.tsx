import React from 'react';
import { Award, BookOpen, Bookmark, FileText } from 'lucide-react';
import type { UserStats } from '../../types';

interface StatsWidgetProps {
  stats: UserStats;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Reputation',
      value: stats.reputation.toLocaleString(),
      icon: Award,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      label: 'Articles Read',
      value: stats.articlesRead.toLocaleString(),
      icon: BookOpen,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Saved Jobs',
      value: stats.savedJobs.toLocaleString(),
      icon: Bookmark,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Applications',
      value: stats.applications.toLocaleString(),
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className={`flex-shrink-0 p-3 rounded-lg ${item.bgColor}`}>
              <Icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {item.value}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {item.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
