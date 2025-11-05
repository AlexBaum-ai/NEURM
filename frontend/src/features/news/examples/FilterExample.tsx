/**
 * Example implementation of news filter and search UI
 * This demonstrates how to integrate all filter components
 *
 * Usage in NewsPage or ArticleListPage:
 * - Import necessary components
 * - Use useNewsFilters hook for URL sync
 * - Fetch categories and articles with filters
 * - Handle mobile/desktop layouts
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import {
  CategorySidebar,
  FilterPanel,
  MobileFilterDrawer,
} from '../components';
import { useNewsFilters } from '../hooks/useNewsFilters';
import { newsApi } from '../api/newsApi';

export const FilterExample: React.FC = () => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { filters, setFilters, updateFilter } = useNewsFilters();

  // Fetch categories for sidebar
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['news', 'categories'],
    queryFn: () => newsApi.getCategories(),
  });

  // Fetch articles with current filters
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['news', 'articles', filters],
    queryFn: () => newsApi.getArticles({ page: 1, limit: 12, filters }),
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="lg:flex lg:gap-8">
          {/* Desktop: Category Sidebar */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-8 space-y-6">
              {categoriesLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-gray-200 rounded dark:bg-gray-800" />
                  <div className="h-6 bg-gray-200 rounded dark:bg-gray-800" />
                  <div className="h-6 bg-gray-200 rounded dark:bg-gray-800" />
                </div>
              ) : (
                <CategorySidebar
                  categories={categoriesData?.data.categories || []}
                  activeSlug={filters.categorySlug}
                  onCategorySelect={(slug) => updateFilter('categorySlug', slug)}
                />
              )}

              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Mobile: Filter Toggle Button */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                News Articles
              </h1>
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {Object.values(filters).filter(Boolean).length > 0 && (
                  <span className="ml-1 rounded-full bg-primary-600 px-2 py-0.5 text-xs text-white">
                    {Object.values(filters).filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop: Page Title */}
            <div className="mb-6 hidden lg:block">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                News Articles
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Stay updated with the latest in LLM technology
              </p>
            </div>

            {/* Article Grid */}
            {articlesLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 h-48 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-6 mb-2 bg-gray-200 rounded dark:bg-gray-800" />
                    <div className="h-4 bg-gray-200 rounded dark:bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : articlesData?.data.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No articles found
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Try adjusting your filters to see more results
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {articlesData?.data.map((article) => (
                  <article
                    key={article.id}
                    className="group rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                  >
                    {article.featuredImageUrl && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={article.featuredImageUrl}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                          {article.category.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {article.readingTimeMinutes} min read
                        </span>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                        {article.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {article.summary}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              article.author.profile.avatarUrl ||
                              'https://ui-avatars.com/api/?name=' +
                                article.author.username
                            }
                            alt={article.author.username}
                            className="h-8 w-8 rounded-full"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {article.author.profile.displayName || article.author.username}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {articlesData && articlesData.pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {articlesData.data.length} of{' '}
                  {articlesData.pagination.total} articles
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile: Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
};

export default FilterExample;
