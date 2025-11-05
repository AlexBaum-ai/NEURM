import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import type { Author } from '../types';
import { ShareButtons } from './ShareButtons';
import { BookmarkButton } from './BookmarkButton';

interface ArticleMetaProps {
  author: Author;
  articleId: string;
  isBookmarked: boolean;
  bookmarkCount: number;
  publishedAt: string;
  title: string;
}

export const ArticleMeta: React.FC<ArticleMetaProps> = ({
  author,
  articleId,
  isBookmarked,
  bookmarkCount,
  publishedAt,
  title,
}) => {
  const currentUrl = window.location.href;

  return (
    <aside className="space-y-6">
      {/* Actions */}
      <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-3">
        <BookmarkButton
          articleId={articleId}
          isBookmarked={isBookmarked}
          bookmarkCount={bookmarkCount}
          className="w-full justify-center"
        />
        <ShareButtons
          title={title}
          url={currentUrl}
          className="w-full"
        />
      </div>

      {/* Author info */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          About the Author
        </h3>

        <Link
          to={`/profile/${author.username}`}
          className="flex items-start gap-3 group"
        >
          {author.profile.avatarUrl ? (
            <img
              src={author.profile.avatarUrl}
              alt={author.username}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all">
              {author.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {author.profile.displayName || author.username}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              @{author.username}
            </p>
          </div>
        </Link>

        {author.profile.bio && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {author.profile.bio}
          </p>
        )}

        <Link
          to={`/profile/${author.username}`}
          className="mt-4 block w-full text-center px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white transition-colors"
        >
          View Profile
        </Link>
      </div>

      {/* Additional metadata */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          Article Info
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Calendar className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-500">Published</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
