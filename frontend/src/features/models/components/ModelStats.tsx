import React from 'react';
import { Card, CardContent } from '@/components/common/Card/Card';
import type { Model } from '../types';

interface ModelStatsProps {
  model: Model;
}

export const ModelStats: React.FC<ModelStatsProps> = ({ model }) => {
  const stats = [
    {
      label: 'Context Window',
      value: model.specs.contextWindow
        ? `${(model.specs.contextWindow / 1000).toLocaleString()}K tokens`
        : 'N/A',
      icon: '📝',
    },
    {
      label: 'Max Output',
      value: model.specs.maxOutputTokens
        ? `${(model.specs.maxOutputTokens / 1000).toLocaleString()}K tokens`
        : 'N/A',
      icon: '💬',
    },
    {
      label: 'Model Size',
      value: model.specs.modelSize || 'N/A',
      icon: '⚖️',
    },
    {
      label: 'Release Date',
      value: model.releaseDate
        ? new Date(model.releaseDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          })
        : 'N/A',
      icon: '📅',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl" role="img" aria-label={stat.label}>
                {stat.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {stat.label}
                </p>
                <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate">
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ModelStats;
