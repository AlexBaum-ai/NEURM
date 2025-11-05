import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Calendar } from 'lucide-react';
import type { Article } from '../types';
import { formatDistanceToNow } from '../utils/dateUtils';

interface ArticleHeaderProps {
  article: Article;
}

export const ArticleHeader: React.FC<ArticleHeaderProps> = ({ article }) => {
  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    INTERMEDIATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    ADVANCED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    EXPERT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <header className="mb-8">
      {/* Category badge */}
      <Link
        to={`/news/category/${article.category.slug}`}
        className="inline-block mb-4 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
      >
        {article.category.name}
      </Link>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
        {article.title}
      </h1>

      {/* Summary */}
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
        {article.summary}
      </p>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        {/* Author */}
        <Link
          to={`/profile/${article.author.username}`}
          className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {article.author.profile.avatarUrl ? (
            <img
              src={article.author.profile.avatarUrl}
              alt={article.author.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {article.author.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium">{article.author.username}</span>
        </Link>

        <span className="text-gray-300 dark:text-gray-700">•</span>

        {/* Published date */}
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <time dateTime={article.publishedAt} title={new Date(article.publishedAt).toLocaleString()}>
            {formatDistanceToNow(new Date(article.publishedAt))}
          </time>
        </div>

        <span className="text-gray-300 dark:text-gray-700">•</span>

        {/* Reading time */}
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{article.readingTimeMinutes} min read</span>
        </div>

        <span className="text-gray-300 dark:text-gray-700">•</span>

        {/* View count */}
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>{article.viewCount.toLocaleString()} views</span>
        </div>

        {/* Difficulty badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[article.difficulty]}`}
        >
          {article.difficulty}
        </span>
      </div>

      {/* Featured image */}
      {article.featuredImageUrl && (
        <div className="mt-8 rounded-xl overflow-hidden shadow-lg">
          <img
            src={article.featuredImageUrl}
            alt={article.title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {article.tags.map((tag) => (
            <Link
              key={tag.slug}
              to={`/news/tag/${tag.slug}`}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
