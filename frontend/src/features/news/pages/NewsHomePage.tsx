import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Grid3x3, List, Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

// Hooks
import { useArticles, useFeaturedArticles, useTrendingArticles } from '../hooks/useArticles';
import { useCategories } from '../hooks/useCategories';

// Components
import FeaturedArticles from '../components/FeaturedArticles';
import TrendingArticles from '../components/TrendingArticles';
import CategorySidebar from '../components/CategorySidebar';
import SearchBar from '../components/SearchBar';
import ArticleCard from '../components/ArticleCard';
import { ArticleGridSkeleton } from '../components/ArticleCardSkeleton';
import EmptyState from '../components/EmptyState';
import ActiveFilters from '../components/ActiveFilters';
import TagFilter from '../components/TagFilter';
import DifficultyFilter from '../components/DifficultyFilter';

// Types
import type { ViewMode, SortOption, NewsFilters } from '../types';

export const NewsHomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Extract filters from URL params
  const [filters, setFilters] = useState<NewsFilters>({
    search: searchParams.get('search') || undefined,
    categorySlug: searchParams.get('category') || undefined,
    tags: searchParams.getAll('tags') || undefined,
    difficulty: (searchParams.get('difficulty') as NewsFilters['difficulty']) || undefined,
  });

  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sortBy') as SortOption) || 'publishedAt-desc'
  );

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Queries
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedArticles();
  const { data: trendingData, isLoading: trendingLoading } = useTrendingArticles();

  const {
    data: articlesData,
    isLoading: articlesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useArticles({ sortBy, filters });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.categorySlug) params.set('category', filters.categorySlug);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (sortBy !== 'publishedAt-desc') params.set('sortBy', sortBy);

    setSearchParams(params, { replace: true });
  }, [filters, sortBy, setSearchParams]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value || undefined }));
  };

  const handleCategorySelect = (slug: string | undefined) => {
    setFilters(prev => ({ ...prev, categorySlug: slug }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFilters(prev => ({ ...prev, tags: tags.length > 0 ? tags : undefined }));
  };

  const handleDifficultyChange = (difficulty: NewsFilters['difficulty']) => {
    setFilters(prev => ({ ...prev, difficulty }));
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSortBy('publishedAt-desc');
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.categorySlug || filters.difficulty || (filters.tags && filters.tags.length > 0)
  );

  // Flatten articles from all pages
  const allArticles = articlesData?.pages.flatMap(page => page.data) ?? [];

  return (
    <>
      <Helmet>
        <title>LLM News & Articles | Neurmatic</title>
        <meta
          name="description"
          content="Stay updated with the latest news, tutorials, and insights about Large Language Models. Browse articles by category, difficulty, and topic."
        />
        <meta property="og:title" content="LLM News & Articles | Neurmatic" />
        <meta
          property="og:description"
          content="Stay updated with the latest news, tutorials, and insights about Large Language Models."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="container-custom py-8">
        {/* Featured Articles Carousel */}
        {!featuredLoading && featuredData?.data && (
          <FeaturedArticles articles={featuredData.data} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Categories & Filters */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              {categoriesLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : categoriesData?.data.categories ? (
                <CategorySidebar
                  categories={categoriesData.data.categories}
                  activeSlug={filters.categorySlug}
                  onCategorySelect={handleCategorySelect}
                />
              ) : null}
            </div>

            {/* Difficulty Filter */}
            <DifficultyFilter
              selected={filters.difficulty}
              onChange={handleDifficultyChange}
            />

            {/* Tag Filter */}
            <TagFilter
              selectedTags={filters.tags || []}
              onChange={handleTagsChange}
            />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-6 space-y-6">
            {/* Search & Controls */}
            <div className="space-y-4">
              <SearchBar
                value={filters.search || ''}
                onChange={handleSearchChange}
                placeholder="Search articles by title, tags, or keywords..."
              />

              {/* Active Filters */}
              {hasActiveFilters && (
                <ActiveFilters
                  filters={filters}
                  onRemoveFilter={(key, value) => {
                    if (key === 'tags' && value) {
                      handleTagsChange((filters.tags || []).filter(t => t !== value));
                    } else {
                      setFilters(prev => ({ ...prev, [key]: undefined }));
                    }
                  }}
                  onClearAll={handleResetFilters}
                />
              )}

              {/* Sort & View Toggle */}
              <div className="flex items-center justify-between gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="publishedAt-desc">Latest First</option>
                  <option value="publishedAt-asc">Oldest First</option>
                  <option value="viewCount-desc">Most Viewed</option>
                  <option value="bookmarkCount-desc">Most Bookmarked</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Articles Grid/List */}
            {articlesLoading ? (
              <ArticleGridSkeleton viewMode={viewMode} count={6} />
            ) : allArticles.length > 0 ? (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
                  {allArticles.map(article => (
                    <ArticleCard key={article.id} article={article} viewMode={viewMode} />
                  ))}
                </div>

                {/* Load More Trigger */}
                {hasNextPage && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isFetchingNextPage && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading more articles...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title={hasActiveFilters ? 'No articles found' : 'No articles yet'}
                description={
                  hasActiveFilters
                    ? "We couldn't find any articles matching your criteria. Try adjusting your filters."
                    : 'Check back soon for new articles.'
                }
                onReset={hasActiveFilters ? handleResetFilters : undefined}
                showResetButton={hasActiveFilters}
              />
            )}
          </main>

          {/* Right Sidebar - Trending */}
          <aside className="lg:col-span-3">
            {trendingLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ) : trendingData?.data ? (
              <TrendingArticles articles={trendingData.data} />
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
};

export default NewsHomePage;
