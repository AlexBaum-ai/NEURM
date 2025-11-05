import React from 'react';
import { Card, CardContent } from '@/components/common/Card/Card';
import type { ApplicationStats } from '../../types';

interface StatusSummaryCardsProps {
  stats: ApplicationStats;
  isLoading?: boolean;
}

export const StatusSummaryCards: React.FC<StatusSummaryCardsProps> = ({ stats, isLoading }) => {
  const cards = [
    {
      label: 'Total Applied',
      value: stats.totalApplied,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-500',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      iconColor: 'text-yellow-500',
    },
    {
      label: 'Interviews',
      value: stats.interviews,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-500',
    },
    {
      label: 'Offers',
      value: stats.offers,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      iconColor: 'text-green-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-24"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.bgColor} border-none`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${card.textColor}`}>{card.label}</p>
                <p className={`text-3xl font-bold ${card.textColor} mt-2`}>{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
