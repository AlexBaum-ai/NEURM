import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ChevronRight } from 'lucide-react';
import type { TopStory } from '../../types';

interface TopStoriesWidgetProps {
  stories: TopStory[];
}

export const TopStoriesWidget: React.FC<TopStoriesWidgetProps> = ({ stories }) => {
  return (
    <div className="space-y-4">
      {stories.slice(0, 5).map((story) => (
        <Link
          key={story.id}
          to={`/news/${story.slug}`}
          className="block group hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 py-3 rounded-lg transition-colors"
        >
          <div className="flex gap-3">
            {story.imageUrl && (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-1">
                {story.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                  {story.categoryName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {story.readingTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {story.viewCount}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}

      {stories.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No stories available</p>
        </div>
      )}

      {stories.length > 0 && (
        <Link
          to="/news"
          className="flex items-center justify-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors pt-2"
        >
          See all news
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};
