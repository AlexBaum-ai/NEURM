import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { useModelNews } from '../../hooks/useModels';

interface ModelNewsProps {
  modelSlug: string;
}

export const ModelNews: React.FC<ModelNewsProps> = ({ modelSlug }) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useModelNews(modelSlug);
  const { ref, inView } = useInView();

  // Auto-fetch next page when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-600 dark:text-red-400">
            Failed to load news articles. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const articles = data?.pages.flatMap((page) => page.articles) ?? [];

  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No news articles found for this model yet.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Check back later for updates!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <Card key={article.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link
                  to={`/news/${article.slug}`}
                  className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {article.title}
                </Link>
                {article.excerpt && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-2">
                    {article.excerpt}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                  <div className="flex items-center gap-2">
                    {article.author.avatar && (
                      <img
                        src={article.author.avatar}
                        alt={article.author.displayName}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>{article.author.displayName}</span>
                  </div>
                  <span>•</span>
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                  <span>•</span>
                  <span>{article.readTime} min read</span>
                  <span>•</span>
                  <span>{article.viewCount.toLocaleString()} views</span>
                </div>
              </div>
              <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 rounded">
                {article.category}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Infinite scroll sentinel */}
      {hasNextPage && (
        <div ref={ref} className="py-4 text-center">
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
              <span className="animate-spin">⏳</span>
              <span>Loading more articles...</span>
            </div>
          ) : (
            <Button
              onClick={() => fetchNextPage()}
              variant="outline"
              disabled={isFetchingNextPage}
            >
              Load More
            </Button>
          )}
        </div>
      )}

      {!hasNextPage && articles.length > 0 && (
        <p className="text-center text-gray-500 dark:text-gray-500 text-sm py-4">
          You've reached the end of the news articles.
        </p>
      )}
    </div>
  );
};

export default ModelNews;
