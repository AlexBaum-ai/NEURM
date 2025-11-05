import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import type { RelatedArticle } from '../types';
import { formatDistanceToNow } from '../utils/dateUtils';

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({ articles }) => {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Related Articles
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/news/${article.slug}`}
            className="group bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Featured image */}
            {article.featuredImageUrl && (
              <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={article.featuredImageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}

            <div className="p-4">
              {/* Category */}
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {article.category.name}
              </span>

              {/* Title */}
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {article.title}
              </h3>

              {/* Summary */}
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {article.summary}
              </p>

              {/* Metadata */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-2">
                  {article.author.profile.avatarUrl ? (
                    <img
                      src={article.author.profile.avatarUrl}
                      alt={article.author.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {article.author.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium">{article.author.username}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{article.readingTimeMinutes} min</span>
                  </div>
                  <time dateTime={article.publishedAt}>
                    {formatDistanceToNow(new Date(article.publishedAt))}
                  </time>
                </div>
              </div>

              {/* Read more link */}
              <div className="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                <span>Read more</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
