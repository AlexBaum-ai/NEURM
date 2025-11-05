/**
 * ArticleCard Demo Page
 *
 * Interactive demo showcasing all variants and features of ArticleCard component.
 * Useful for development, testing, and documentation purposes.
 */

import React, { useState } from 'react';
import ArticleCard from './ArticleCard';
import ArticleCardSkeleton from './ArticleCardSkeleton';
import type { Article } from '@/features/news/types';

// Sample article data
const sampleArticles: Article[] = [
  {
    id: '1',
    slug: 'introduction-to-gpt-4',
    title: 'Introduction to GPT-4: Understanding the Latest AI Language Model',
    summary:
      'Explore the capabilities and limitations of GPT-4, the latest advancement in large language models. Learn how it differs from previous versions and what it means for AI development.',
    content: 'Full content...',
    featuredImageUrl: 'https://picsum.photos/seed/gpt4/800/600',
    status: 'PUBLISHED',
    difficulty: 'INTERMEDIATE',
    readingTimeMinutes: 8,
    viewCount: 1234,
    bookmarkCount: 89,
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    author: {
      id: '1',
      username: 'johndoe',
      profile: {
        avatarUrl: 'https://picsum.photos/seed/johndoe/100/100',
      },
    },
    category: {
      slug: 'tutorials',
      name: 'Tutorials',
    },
    tags: [
      { slug: 'gpt-4', name: 'GPT-4' },
      { slug: 'nlp', name: 'NLP' },
      { slug: 'ai', name: 'AI' },
    ],
    isBookmarked: false,
  },
  {
    id: '2',
    slug: 'prompt-engineering-basics',
    title: 'Prompt Engineering Basics: A Complete Guide for Beginners',
    summary:
      'Master the fundamentals of prompt engineering and learn how to craft effective prompts for large language models.',
    content: 'Full content...',
    featuredImageUrl: undefined, // No image to test fallback
    status: 'PUBLISHED',
    difficulty: 'BEGINNER',
    readingTimeMinutes: 5,
    viewCount: 2456,
    bookmarkCount: 156,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    author: {
      id: '2',
      username: 'janedoe',
      profile: {
        avatarUrl: undefined, // No avatar to test fallback
      },
    },
    category: {
      slug: 'guides',
      name: 'Guides',
    },
    tags: [
      { slug: 'prompt-engineering', name: 'Prompt Engineering' },
      { slug: 'beginner', name: 'Beginner' },
    ],
    isBookmarked: true,
  },
  {
    id: '3',
    slug: 'llm-fine-tuning-advanced',
    title: 'Advanced LLM Fine-Tuning Techniques for Production Systems',
    summary:
      'Deep dive into advanced fine-tuning strategies, including RLHF, LoRA, and distributed training for large-scale deployments.',
    content: 'Full content...',
    featuredImageUrl: 'https://picsum.photos/seed/finetuning/800/600',
    status: 'PUBLISHED',
    difficulty: 'EXPERT',
    readingTimeMinutes: 15,
    viewCount: 567,
    bookmarkCount: 45,
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    author: {
      id: '3',
      username: 'aiexpert',
      profile: {
        avatarUrl: 'https://picsum.photos/seed/aiexpert/100/100',
      },
    },
    category: {
      slug: 'advanced',
      name: 'Advanced',
    },
    tags: [
      { slug: 'fine-tuning', name: 'Fine-tuning' },
      { slug: 'rlhf', name: 'RLHF' },
      { slug: 'lora', name: 'LoRA' },
      { slug: 'production', name: 'Production' },
    ],
    isBookmarked: false,
  },
  {
    id: '4',
    slug: 'building-rag-systems',
    title: 'Building RAG Systems: Retrieval-Augmented Generation Explained',
    summary:
      'Learn how to build powerful RAG systems that combine retrieval and generation for enhanced AI applications.',
    content: 'Full content...',
    featuredImageUrl: 'https://picsum.photos/seed/rag/800/600',
    status: 'PUBLISHED',
    difficulty: 'ADVANCED',
    readingTimeMinutes: 12,
    viewCount: 890,
    bookmarkCount: 67,
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    author: {
      id: '4',
      username: 'mlresearcher',
      profile: {
        avatarUrl: 'https://picsum.photos/seed/mlresearcher/100/100',
      },
    },
    category: {
      slug: 'architecture',
      name: 'Architecture',
    },
    tags: [
      { slug: 'rag', name: 'RAG' },
      { slug: 'retrieval', name: 'Retrieval' },
      { slug: 'embeddings', name: 'Embeddings' },
    ],
    isBookmarked: true,
  },
];

const ArticleCardDemo: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<'grid' | 'list' | 'featured' | 'compact'>(
    'grid'
  );
  const [showBookmark, setShowBookmark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [articles, setArticles] = useState(sampleArticles);

  const handleBookmarkToggle = async (articleId: string, isBookmarked: boolean) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update article state
    setArticles((prev) =>
      prev.map((article) =>
        article.id === articleId
          ? {
              ...article,
              isBookmarked,
              bookmarkCount: isBookmarked
                ? article.bookmarkCount + 1
                : article.bookmarkCount - 1,
            }
          : article
      )
    );
  };

  const toggleLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            ArticleCard Component Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive showcase of the ArticleCard component with all variants and features.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Variant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variant
              </label>
              <div className="flex flex-col gap-2">
                {(['grid', 'list', 'featured', 'compact'] as const).map((variant) => (
                  <label key={variant} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="variant"
                      value={variant}
                      checked={selectedVariant === variant}
                      onChange={(e) =>
                        setSelectedVariant(e.target.value as typeof selectedVariant)
                      }
                      className="text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300 capitalize">{variant}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showBookmark}
                  onChange={(e) => setShowBookmark(e.target.checked)}
                  className="text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Show Bookmark Button</span>
              </label>
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Actions
              </label>
              <button
                onClick={toggleLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Toggle Loading State
              </button>
            </div>
          </div>
        </div>

        {/* Variant Showcase */}
        <div className="space-y-8">
          {/* Grid Variant */}
          {selectedVariant === 'grid' && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
                Grid Variant
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Best for homepage and category pages. Displays articles in a card grid layout.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <ArticleCardSkeleton variant="grid" count={3} />
                ) : (
                  articles.slice(0, 3).map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="grid"
                      showBookmark={showBookmark}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  ))
                )}
              </div>
            </section>
          )}

          {/* List Variant */}
          {selectedVariant === 'list' && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
                List Variant
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Best for search results and author pages. Displays articles in a horizontal layout.
              </p>
              <div className="space-y-4 max-w-4xl">
                {isLoading ? (
                  <ArticleCardSkeleton variant="list" count={3} />
                ) : (
                  articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="list"
                      showBookmark={showBookmark}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  ))
                )}
              </div>
            </section>
          )}

          {/* Featured Variant */}
          {selectedVariant === 'featured' && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
                Featured Variant
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Best for hero sections and featured articles. Large format with overlay text.
              </p>
              <div className="max-w-4xl">
                {isLoading ? (
                  <ArticleCardSkeleton variant="featured" count={1} />
                ) : (
                  <ArticleCard
                    article={articles[0]}
                    variant="featured"
                    showBookmark={showBookmark}
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                )}
              </div>
            </section>
          )}

          {/* Compact Variant */}
          {selectedVariant === 'compact' && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
                Compact Variant
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Best for sidebars and related articles. Minimal space with essential information.
              </p>
              <div className="max-w-md space-y-3">
                {isLoading ? (
                  <ArticleCardSkeleton variant="compact" count={4} />
                ) : (
                  articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="compact"
                      showBookmark={showBookmark}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        {/* Responsive Layout Example */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
            Responsive Layout Example
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A complete responsive layout combining different variants.
          </p>

          {/* Featured Article */}
          <div className="mb-8">
            <ArticleCard
              article={articles[0]}
              variant="featured"
              showBookmark={showBookmark}
              onBookmarkToggle={handleBookmarkToggle}
            />
          </div>

          {/* Grid and Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Grid */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">
                Latest Articles
              </h3>
              <div className="space-y-4">
                {articles.slice(1).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="list"
                    showBookmark={showBookmark}
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar - Compact */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">Trending</h3>
              <div className="space-y-3">
                {articles.slice(0, 4).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="compact"
                    showBookmark={false}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Difficulty Badges Showcase */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
            Difficulty Levels
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Articles with different difficulty badges.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="grid"
                showBookmark={showBookmark}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-400">
            ArticleCard Component - Neurmatic Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArticleCardDemo;
