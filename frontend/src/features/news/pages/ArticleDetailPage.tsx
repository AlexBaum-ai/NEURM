import React, { Suspense, useState, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useArticleDetail } from '../hooks/useArticleDetail';
import { useArticleAnalytics } from '../hooks/useArticleAnalytics';
import { ArticleHeader } from '../components/ArticleHeader';
import { ArticleContent } from '../components/ArticleContent';
import { ArticleMeta } from '../components/ArticleMeta';
import { TableOfContents } from '../components/TableOfContents';
import { RelatedArticles } from '../components/RelatedArticles';
import { ReadingProgress } from '../components/ReadingProgress';
import { RecommendationsSidebar, RecommendationsSidebarSkeleton } from '@/features/recommendations';
import { SEO, StructuredData } from '@/components/common/SEO';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/utils/structuredData';
import { extractExcerpt } from '@/utils/seo';
import type { TableOfContentsItem } from '../types';

const ArticleDetailContent: React.FC<{ slug: string }> = ({ slug }) => {
  const { data } = useArticleDetail(slug);
  const [tocItems, setTocItems] = useState<TableOfContentsItem[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const { article, relatedArticles } = data.data;

  // Analytics tracking - tracks view, reading time, scroll depth
  useArticleAnalytics({
    articleId: article.id,
    contentRef,
    enabled: true,
  });

  const handleTocGenerated = (items: TableOfContentsItem[]) => {
    setTocItems(items);
  };

  // Generate SEO metadata
  const metaDescription = article.summary || extractExcerpt(article.content, 160);
  const keywords = article.tags.map((t) => t.name);

  // Generate structured data
  const articleSchema = generateArticleSchema({
    title: article.title,
    description: metaDescription,
    content: article.content,
    featuredImage: article.featuredImageUrl,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    author: {
      name: article.author.name || article.author.username,
      username: article.author.username,
    },
    slug: article.slug,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'News', path: '/news' },
    { name: article.category.name, path: `/news?category=${article.category.slug}` },
    { name: article.title, path: `/news/${article.slug}` },
  ]);

  return (
    <>
      <SEO
        title={article.title}
        description={metaDescription}
        type="article"
        image={article.featuredImageUrl}
        url={`/news/${article.slug}`}
        keywords={keywords}
        author={article.author.username}
        publishedTime={article.publishedAt}
        modifiedTime={article.updatedAt}
        section={article.category.name}
        tags={keywords}
      />
      <StructuredData data={[articleSchema, breadcrumbSchema]} />

      <ReadingProgress />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main content */}
            <div className="lg:col-span-8" ref={contentRef}>
              <ArticleHeader article={article} />
              <ArticleContent content={article.content} onTocGenerated={handleTocGenerated} />
              <RelatedArticles
                articles={relatedArticles}
                sourceArticleId={article.id}
                sourceArticleSlug={article.slug}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="space-y-6">
                <ArticleMeta
                  author={article.author}
                  articleId={article.id}
                  isBookmarked={article.isBookmarked}
                  bookmarkCount={article.bookmarkCount}
                  publishedAt={article.publishedAt}
                  title={article.title}
                />
                {tocItems.length > 0 && <TableOfContents items={tocItems} />}

                {/* Recommended Articles */}
                <Suspense fallback={<RecommendationsSidebarSkeleton />}>
                  <RecommendationsSidebar
                    type="article"
                    excludeIds={[article.id]}
                    limit={5}
                    title="Recommended for You"
                    emptyMessage="No article recommendations available"
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Loading skeleton
const ArticleDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {/* Header skeleton */}
            <div className="mb-8 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-4" />
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-5/6 mb-6" />
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48" />
                </div>
              </div>
              <div className="mt-8 h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-4 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="space-y-6 animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return <Navigate to="/news" replace />;
  }

  return (
    <Suspense fallback={<ArticleDetailSkeleton />}>
      <ArticleDetailContent slug={slug} />
    </Suspense>
  );
};
