import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Article } from '@/features/news/types';

export interface ArticleCardProps {
  article: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    featuredImageUrl?: string;
    author: {
      username: string;
      profile: { avatarUrl?: string };
    };
    category?: { slug: string; name: string };
    tags: Array<{ slug: string; name: string }>;
    publishedAt: string;
    readingTimeMinutes?: number;
    viewCount: number;
    bookmarkCount: number;
    difficulty?: string;
    isBookmarked?: boolean;
  };
  variant?: 'grid' | 'list' | 'featured' | 'compact';
  onClick?: () => void;
  showBookmark?: boolean;
  onBookmarkToggle?: (articleId: string, isBookmarked: boolean) => Promise<void>;
}

/**
 * ArticleCard Component
 *
 * A reusable card component for displaying article previews with multiple layout variants.
 *
 * Features:
 * - Multiple variants: grid (default), list, featured, compact
 * - Responsive images with lazy loading
 * - Bookmark functionality (authenticated users only)
 * - Category badges and tag pills
 * - Reading time and engagement metrics
 * - Keyboard navigation support
 * - Hover effects and transitions
 *
 * @example
 * ```tsx
 * <ArticleCard
 *   article={article}
 *   variant="grid"
 *   showBookmark={true}
 *   onBookmarkToggle={handleBookmark}
 * />
 * ```
 */
const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  variant = 'grid',
  onClick,
  showBookmark = true,
  onBookmarkToggle,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked || false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const handleBookmarkClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated || !onBookmarkToggle) return;

      setIsBookmarking(true);
      try {
        await onBookmarkToggle(article.id, !isBookmarked);
        setIsBookmarked(!isBookmarked);
      } catch (error) {
        console.error('Failed to toggle bookmark:', error);
      } finally {
        setIsBookmarking(false);
      }
    },
    [isAuthenticated, onBookmarkToggle, article.id, isBookmarked]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'INTERMEDIATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ADVANCED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'EXPERT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const renderImage = () => {
    if (!article.featuredImageUrl) {
      return (
        <div
          className={cn(
            'bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center',
            variant === 'grid' && 'h-48',
            variant === 'list' && 'h-32 w-32 flex-shrink-0',
            variant === 'featured' && 'h-80 sm:h-96',
            variant === 'compact' && 'h-20 w-20 flex-shrink-0'
          )}
        >
          <span className="text-white text-2xl font-bold">
            {article.title.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }

    return (
      <img
        src={article.featuredImageUrl}
        alt={article.title}
        loading="lazy"
        className={cn(
          'object-cover transition-transform duration-300 group-hover:scale-105',
          variant === 'grid' && 'h-48 w-full',
          variant === 'list' && 'h-32 w-32 flex-shrink-0',
          variant === 'featured' && 'h-80 sm:h-96 w-full',
          variant === 'compact' && 'h-20 w-20 flex-shrink-0'
        )}
        srcSet={`${article.featuredImageUrl}?w=400 400w, ${article.featuredImageUrl}?w=800 800w`}
        sizes={
          variant === 'featured'
            ? '(max-width: 768px) 100vw, 800px'
            : variant === 'list'
            ? '128px'
            : variant === 'compact'
            ? '80px'
            : '(max-width: 768px) 100vw, 400px'
        }
      />
    );
  };

  const renderMetadata = () => (
    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
      {article.readingTimeMinutes && (
        <span className="flex items-center gap-1" aria-label={`Reading time: ${article.readingTimeMinutes} minutes`}>
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {article.readingTimeMinutes} min
        </span>
      )}
      <span className="flex items-center gap-1" aria-label={`View count: ${article.viewCount}`}>
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        {article.viewCount.toLocaleString()}
      </span>
      {article.bookmarkCount > 0 && (
        <span className="flex items-center gap-1" aria-label={`Bookmark count: ${article.bookmarkCount}`}>
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
          {article.bookmarkCount.toLocaleString()}
        </span>
      )}
    </div>
  );

  const renderAuthor = () => (
    <div className="flex items-center gap-2">
      {article.author.profile.avatarUrl ? (
        <img
          src={article.author.profile.avatarUrl}
          alt={article.author.username}
          className={cn(
            'rounded-full object-cover',
            variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'
          )}
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold',
            variant === 'compact' ? 'h-5 w-5 text-xs' : 'h-6 w-6 text-sm'
          )}
        >
          {article.author.username.charAt(0).toUpperCase()}
        </div>
      )}
      <span className={cn('text-gray-700 dark:text-gray-300', variant === 'compact' && 'text-xs')}>
        {article.author.username}
      </span>
      <span className="text-gray-400 dark:text-gray-600">•</span>
      <time
        dateTime={article.publishedAt}
        className={cn('text-gray-500 dark:text-gray-400', variant === 'compact' && 'text-xs')}
      >
        {formatDate(article.publishedAt)}
      </time>
    </div>
  );

  const renderTags = () => {
    const maxTags = variant === 'compact' ? 2 : 3;
    const displayTags = article.tags.slice(0, maxTags);

    if (displayTags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <Link
            key={tag.slug}
            to={`/news/tags/${tag.slug}`}
            className={cn(
              'px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
              variant === 'compact' ? 'text-[10px]' : 'text-xs'
            )}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Tag: ${tag.name}`}
          >
            #{tag.name}
          </Link>
        ))}
        {article.tags.length > maxTags && (
          <span className={cn('text-gray-400 dark:text-gray-600', variant === 'compact' ? 'text-[10px]' : 'text-xs')}>
            +{article.tags.length - maxTags}
          </span>
        )}
      </div>
    );
  };

  const renderBookmarkButton = () => {
    if (!showBookmark || !isAuthenticated) return null;

    return (
      <button
        onClick={handleBookmarkClick}
        disabled={isBookmarking}
        className={cn(
          'p-2 rounded-full transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isBookmarked
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
        )}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        aria-pressed={isBookmarked}
      >
        {isBookmarked ? (
          <BookmarkCheck className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Bookmark className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    );
  };

  const articleLink = `/news/${article.slug}`;

  // Grid variant (default)
  if (variant === 'grid') {
    return (
      <article
        className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-lg transition-all duration-300"
        onClick={onClick}
      >
        <Link to={articleLink} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <div className="relative overflow-hidden">
            {renderImage()}
            {article.category && (
              <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full shadow-md">
                {article.category.name}
              </span>
            )}
            {article.difficulty && (
              <span
                className={cn(
                  'absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded shadow-md',
                  getDifficultyColor(article.difficulty)
                )}
              >
                {article.difficulty}
              </span>
            )}
          </div>
          <div className="flex flex-col flex-1 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {article.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
              {article.summary}
            </p>
            <div className="space-y-3">
              {renderTags()}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                {renderAuthor()}
              </div>
              <div className="flex items-center justify-between">
                {renderMetadata()}
                {renderBookmarkButton()}
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // List variant
  if (variant === 'list') {
    return (
      <article
        className="group flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-all duration-300"
        onClick={onClick}
      >
        <Link to={articleLink} className="flex-shrink-0 overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {renderImage()}
        </Link>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {article.category && (
                <Link
                  to={`/news/categories/${article.category.slug}`}
                  className="px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {article.category.name}
                </Link>
              )}
              {article.difficulty && (
                <span className={cn('px-2 py-0.5 text-xs font-medium rounded', getDifficultyColor(article.difficulty))}>
                  {article.difficulty}
                </span>
              )}
            </div>
            {renderBookmarkButton()}
          </div>
          <Link to={articleLink} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-50 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {article.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {article.summary}
          </p>
          <div className="space-y-2 mt-auto">
            {renderTags()}
            <div className="flex items-center justify-between">
              {renderAuthor()}
              {renderMetadata()}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Featured variant
  if (variant === 'featured') {
    return (
      <article
        className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg hover:shadow-2xl transition-all duration-300"
        onClick={onClick}
      >
        <Link to={articleLink} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <div className="relative overflow-hidden">
            {renderImage()}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                {article.category && (
                  <span className="px-3 py-1 text-sm font-semibold bg-blue-600 rounded-full">
                    {article.category.name}
                  </span>
                )}
                {article.difficulty && (
                  <span className={cn('px-3 py-1 text-sm font-medium rounded-full', getDifficultyColor(article.difficulty))}>
                    {article.difficulty}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
                {article.title}
              </h2>
              <p className="text-base text-gray-200 line-clamp-2 mb-4">
                {article.summary}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {article.author.profile.avatarUrl ? (
                    <img
                      src={article.author.profile.avatarUrl}
                      alt={article.author.username}
                      className="h-8 w-8 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {article.author.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{article.author.username}</p>
                    <time dateTime={article.publishedAt} className="text-sm text-gray-300">
                      {formatDate(article.publishedAt)}
                    </time>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {article.readingTimeMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {article.readingTimeMinutes} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.viewCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            {showBookmark && isAuthenticated && (
              <div className="absolute top-4 right-4">
                {renderBookmarkButton()}
              </div>
            )}
          </div>
        </Link>
        <div className="p-4">
          {renderTags()}
        </div>
      </article>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <article
        className="group flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200"
        onClick={onClick}
      >
        <Link to={articleLink} className="flex-shrink-0 overflow-hidden rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          {renderImage()}
        </Link>
        <div className="flex flex-col flex-1 min-w-0">
          <Link to={articleLink} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {article.title}
            </h4>
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>{article.author.username}</span>
            <span>•</span>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </div>
          {renderTags()}
        </div>
        {renderBookmarkButton()}
      </article>
    );
  }

  return null;
};

export default ArticleCard;
