import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Eye } from 'lucide-react';
import type { ArticleListItem } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface TrendingArticlesProps {
  articles: ArticleListItem[];
}

export const TrendingArticles: React.FC<TrendingArticlesProps> = ({ articles }) => {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <aside className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Trending Now
        </h2>
      </div>

      <div className="space-y-6">
        {articles.map((article, index) => {
          const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

          return (
            <article
              key={article.id}
              className="group relative flex gap-4 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
            >
              {/* Rank Number */}
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold text-sm">
                  {index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Category */}
                <Link
                  to={`/news?category=${article.category.slug}`}
                  className="inline-block text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-2"
                >
                  {article.category.name}
                </Link>

                {/* Title */}
                <Link to={`/news/${article.slug}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                </Link>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readingTimeMinutes}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.viewCount}
                  </span>
                  <span>{timeAgo}</span>
                </div>
              </div>

              {/* Thumbnail */}
              {article.featuredImageUrl && (
                <Link
                  to={`/news/${article.slug}`}
                  className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700"
                >
                  <img
                    src={article.featuredImageUrl}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </Link>
              )}
            </article>
          );
        })}
      </div>

      {/* View All Link */}
      <Link
        to="/news?sortBy=viewCount-desc"
        className="block mt-6 pt-4 text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors border-t border-gray-200 dark:border-gray-700"
      >
        View all trending articles →
      </Link>
    </aside>
  );
};

export default TrendingArticles;
