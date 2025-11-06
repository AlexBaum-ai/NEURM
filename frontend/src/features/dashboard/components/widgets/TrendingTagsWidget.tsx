import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendingTag } from '../../types';

interface TrendingTagsWidgetProps {
  tags: TrendingTag[];
}

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const TREND_COLORS = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  stable: 'text-gray-600 dark:text-gray-400',
};

export const TrendingTagsWidget: React.FC<TrendingTagsWidgetProps> = ({ tags }) => {
  return (
    <div className="space-y-2">
      {tags.slice(0, 8).map((tag) => {
        const TrendIcon = TREND_ICONS[tag.trend];
        const trendColor = TREND_COLORS[tag.trend];

        return (
          <Link
            key={tag.id}
            to={`/forum?tag=${tag.slug}`}
            className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {tag.name}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {tag.count.toLocaleString()}
              </span>
              <TrendIcon className={`w-3 h-3 ${trendColor}`} />
            </div>
          </Link>
        );
      })}

      {tags.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No trending tags</p>
        </div>
      )}
    </div>
  );
};
