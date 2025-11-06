/**
 * ArticleCard Usage Examples
 *
 * This file demonstrates various ways to use the ArticleCard component
 * with different variants and configurations.
 */

import React, { useState } from 'react';
import ArticleCard from './ArticleCard';
import ArticleCardSkeleton from './ArticleCardSkeleton';
import type { Article } from '@/features/news/types';

// Example article data
const exampleArticle: Article = {
  id: '1',
  slug: 'introduction-to-gpt-4',
  title: 'Introduction to GPT-4: Understanding the Latest AI Language Model',
  summary:
    'Explore the capabilities and limitations of GPT-4, the latest advancement in large language models. Learn how it differs from previous versions and what it means for AI development.',
  content: 'Full article content...',
  featuredImageUrl: 'https://example.com/images/gpt4.jpg',
  status: 'PUBLISHED',
  difficulty: 'INTERMEDIATE',
  readingTimeMinutes: 8,
  viewCount: 1234,
  bookmarkCount: 89,
  publishedAt: new Date().toISOString(),
  author: {
    id: 'author-1',
    username: 'johndoe',
    profile: {
      avatarUrl: 'https://example.com/avatars/johndoe.jpg',
      bio: 'AI researcher and enthusiast',
      displayName: 'John Doe',
    },
  },
  category: {
    slug: 'tutorials',
    name: 'Tutorials',
    description: 'Step-by-step guides and tutorials',
  },
  tags: [
    { slug: 'gpt-4', name: 'GPT-4', description: 'GPT-4 related content' },
    { slug: 'nlp', name: 'NLP', description: 'Natural Language Processing' },
    { slug: 'ai', name: 'AI', description: 'Artificial Intelligence' },
  ],
  isBookmarked: false,
};

/**
 * Example 1: Grid Variant (Default)
 * Best for: Article grids on homepage, category pages
 */
export const GridVariantExample: React.FC = () => {
  const [article, setArticle] = useState(exampleArticle);

  const handleBookmarkToggle = async (_articleId: string, isBookmarked: boolean) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update local state
    setArticle((prev) => ({
      ...prev,
      isBookmarked,
      bookmarkCount: isBookmarked ? prev.bookmarkCount + 1 : prev.bookmarkCount - 1,
    }));
  };

  return (
    <div className="max-w-sm">
      <ArticleCard
        article={article}
        variant="grid"
        showBookmark={true}
        onBookmarkToggle={handleBookmarkToggle}
      />
    </div>
  );
};

/**
 * Example 2: List Variant
 * Best for: Search results, author article lists
 */
export const ListVariantExample: React.FC = () => {
  return (
    <div className="max-w-3xl">
      <ArticleCard article={exampleArticle} variant="list" showBookmark={true} />
    </div>
  );
};

/**
 * Example 3: Featured Variant
 * Best for: Hero sections, featured article showcases
 */
export const FeaturedVariantExample: React.FC = () => {
  return (
    <div className="max-w-4xl">
      <ArticleCard article={exampleArticle} variant="featured" showBookmark={true} />
    </div>
  );
};

/**
 * Example 4: Compact Variant
 * Best for: Sidebars, "Related Articles" sections
 */
export const CompactVariantExample: React.FC = () => {
  return (
    <div className="max-w-sm">
      <ArticleCard article={exampleArticle} variant="compact" showBookmark={true} />
    </div>
  );
};

/**
 * Example 5: Grid with Loading Skeletons
 * Shows loading state while fetching data
 */
export const GridWithLoadingExample: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // Simulate data loading
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        <ArticleCardSkeleton variant="grid" count={6} />
      ) : (
        Array.from({ length: 6 }, (_, i) => (
          <ArticleCard key={i} article={{ ...exampleArticle, id: String(i) }} variant="grid" />
        ))
      )}
    </div>
  );
};

/**
 * Example 6: List with Loading Skeletons
 */
export const ListWithLoadingExample: React.FC = () => {
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4 max-w-4xl">
      {loading ? (
        <ArticleCardSkeleton variant="list" count={5} />
      ) : (
        Array.from({ length: 5 }, (_, i) => (
          <ArticleCard key={i} article={{ ...exampleArticle, id: String(i) }} variant="list" />
        ))
      )}
    </div>
  );
};

/**
 * Example 7: Without Featured Image
 * Shows fallback when no image is provided
 */
export const WithoutImageExample: React.FC = () => {
  const articleWithoutImage = {
    ...exampleArticle,
    featuredImageUrl: undefined,
  };

  return (
    <div className="max-w-sm">
      <ArticleCard article={articleWithoutImage} variant="grid" />
    </div>
  );
};

/**
 * Example 8: Unauthenticated User (No Bookmark Button)
 * Shows the card without bookmark functionality
 */
export const UnauthenticatedExample: React.FC = () => {
  return (
    <div className="max-w-sm">
      <ArticleCard article={exampleArticle} variant="grid" showBookmark={false} />
    </div>
  );
};

/**
 * Example 9: With Click Handler
 * Custom onClick behavior (e.g., analytics tracking)
 */
export const WithClickHandlerExample: React.FC = () => {
  const handleClick = () => {
    console.log('Article clicked:', exampleArticle.title);
    // Track analytics event
    // analytics.track('article_clicked', { articleId: exampleArticle.id });
  };

  return (
    <div className="max-w-sm">
      <ArticleCard article={exampleArticle} variant="grid" onClick={handleClick} />
    </div>
  );
};

/**
 * Example 10: Responsive Grid Layout
 * Full responsive layout with different variants per breakpoint
 */
export const ResponsiveLayoutExample: React.FC = () => {
  const articles = Array.from({ length: 10 }, (_, i) => ({
    ...exampleArticle,
    id: String(i),
    title: `Article ${i + 1}: ${exampleArticle.title}`,
  }));

  return (
    <div className="container mx-auto px-4">
      {/* Featured article at the top */}
      <div className="mb-8">
        <ArticleCard article={articles[0]} variant="featured" showBookmark={true} />
      </div>

      {/* Grid of articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {articles.slice(1, 7).map((article) => (
          <ArticleCard key={article.id} article={article} variant="grid" showBookmark={true} />
        ))}
      </div>

      {/* Sidebar with compact articles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Latest Articles</h2>
          <div className="space-y-4">
            {articles.slice(7).map((article) => (
              <ArticleCard key={article.id} article={article} variant="list" showBookmark={true} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Trending</h2>
          <div className="space-y-3">
            {articles.slice(0, 5).map((article) => (
              <ArticleCard key={article.id} article={article} variant="compact" showBookmark={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 11: Different Difficulty Levels
 * Shows how difficulty badges appear
 */
export const DifficultyVariantsExample: React.FC = () => {
  const difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {difficulties.map((difficulty) => (
        <ArticleCard
          key={difficulty}
          article={{ ...exampleArticle, difficulty }}
          variant="grid"
        />
      ))}
    </div>
  );
};

/**
 * Example 12: Integration with TanStack Query
 * Real-world usage with data fetching
 */
export const WithQueryExample: React.FC = () => {
  // Simulated query hook (replace with actual useQuery)
  const { data: articles, isLoading } = {
    data: Array.from({ length: 6 }, (_, i) => ({ ...exampleArticle, id: String(i) })),
    isLoading: false,
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ArticleCardSkeleton variant="grid" count={6} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles?.map((article) => (
        <ArticleCard key={article.id} article={article} variant="grid" showBookmark={true} />
      ))}
    </div>
  );
};

export default {
  GridVariantExample,
  ListVariantExample,
  FeaturedVariantExample,
  CompactVariantExample,
  GridWithLoadingExample,
  ListWithLoadingExample,
  WithoutImageExample,
  UnauthenticatedExample,
  WithClickHandlerExample,
  ResponsiveLayoutExample,
  DifficultyVariantsExample,
  WithQueryExample,
};
