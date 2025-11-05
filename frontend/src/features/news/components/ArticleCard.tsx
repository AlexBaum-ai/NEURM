import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Bookmark } from 'lucide-react';
import type { ArticleListItem, ViewMode } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: ArticleListItem;
  viewMode?: ViewMode;
}

const difficultyColors = {
  BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  INTERMEDIATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ADVANCED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  EXPERT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, viewMode = 'grid' }) => {
  const isGridView = viewMode === 'grid';

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  return (
    <article
      className={`
        group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md
        transition-all duration-300 overflow-hidden
        ${isGridView ? 'flex flex-col' : 'flex flex-row'}
      `}
    >
      {/* Featured Image */}
      {article.featuredImageUrl && (
        <Link
          to={`/news/${article.slug}`}
          className={`
            relative overflow-hidden bg-gray-200 dark:bg-gray-700
            ${isGridView ? 'aspect-video w-full' : 'w-48 flex-shrink-0'}
          `}
        >
          <img
            src={article.featuredImageUrl}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Difficulty Badge on Image */}
          <span
            className={`
              absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded
              ${difficultyColors[article.difficulty]}
            `}
          >
            {article.difficulty}
          </span>
        </Link>
      )}

      {/* Content */}
      <div className={`flex flex-col p-4 ${isGridView ? 'flex-1' : 'flex-1 min-w-0'}`}>
        {/* Category Badge */}
        <Link
          to={`/news?category=${article.category.slug}`}
          className="inline-flex items-center w-fit mb-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          {article.category.name}
        </Link>

        {/* Title */}
        <Link to={`/news/${article.slug}`}>
          <h2
            className={`
              font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400
              transition-colors line-clamp-2
              ${isGridView ? 'text-lg mb-2' : 'text-xl mb-3'}
            `}
          >
            {article.title}
          </h2>
        </Link>

        {/* Summary */}
        <p
          className={`
            text-gray-600 dark:text-gray-400 mb-3
            ${isGridView ? 'text-sm line-clamp-3' : 'text-base line-clamp-2'}
          `}
        >
          {article.summary}
        </p>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {article.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.slug}
                to={`/news?tags=${tag.slug}`}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
            {article.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                +{article.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
          {/* Author */}
          <Link
            to={`/profile/${article.author.username}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {article.author.profile.avatarUrl ? (
              <img
                src={article.author.profile.avatarUrl}
                alt={article.author.username}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold">
                {article.author.username[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {article.author.profile.displayName || article.author.username}
            </span>
          </Link>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1" title="Reading time">
              <Clock className="w-4 h-4" />
              {article.readingTimeMinutes}m
            </span>
            <span className="flex items-center gap-1" title="Views">
              <Eye className="w-4 h-4" />
              {article.viewCount}
            </span>
            {article.bookmarkCount > 0 && (
              <span
                className={`flex items-center gap-1 ${article.isBookmarked ? 'text-primary-600 dark:text-primary-400' : ''}`}
                title="Bookmarks"
              >
                <Bookmark className={`w-4 h-4 ${article.isBookmarked ? 'fill-current' : ''}`} />
                {article.bookmarkCount}
              </span>
            )}
          </div>
        </div>

        {/* Published Date */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {timeAgo}
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
