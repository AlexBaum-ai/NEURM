# ArticleCard Integration Guide

Step-by-step guide for integrating ArticleCard components into your pages.

## Quick Start

### 1. Import the Component

```tsx
// Import the component
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';

// Or import individually
import ArticleCard from '@/components/news/ArticleCard';
import ArticleCardSkeleton from '@/components/news/ArticleCardSkeleton';
```

### 2. Basic Usage

```tsx
function ArticlePage() {
  const article = {
    id: '1',
    slug: 'article-slug',
    title: 'Article Title',
    summary: 'Article summary...',
    // ... other required fields
  };

  return <ArticleCard article={article} />;
}
```

### 3. With Data Fetching

```tsx
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';

function ArticleList() {
  const { data: articles } = useSuspenseQuery({
    queryKey: ['articles'],
    queryFn: fetchArticles,
  });

  return (
    <React.Suspense fallback={<ArticleCardSkeleton variant="grid" count={6} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </React.Suspense>
  );
}
```

---

## Integration Scenarios

### Scenario 1: Homepage Integration

**Location**: `/frontend/src/features/news/pages/HomePage.tsx`

**Requirements**:
- Featured article at top
- Grid of recent articles
- Sidebar with trending articles

**Implementation**:

```tsx
import React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';
import { fetchFeaturedArticle, fetchRecentArticles, fetchTrendingArticles } from '../api';

const HomePage: React.FC = () => {
  const { data: featured } = useSuspenseQuery({
    queryKey: ['featured-article'],
    queryFn: fetchFeaturedArticle,
  });

  const { data: recent } = useSuspenseQuery({
    queryKey: ['recent-articles'],
    queryFn: () => fetchRecentArticles({ limit: 6 }),
  });

  const { data: trending } = useSuspenseQuery({
    queryKey: ['trending-articles'],
    queryFn: () => fetchTrendingArticles({ limit: 5 }),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Featured Article */}
      <section className="mb-12">
        <React.Suspense fallback={<ArticleCardSkeleton variant="featured" />}>
          <ArticleCard variant="featured" article={featured} showBookmark={true} />
        </React.Suspense>
      </section>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Articles */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
          <React.Suspense fallback={<ArticleCardSkeleton variant="grid" count={6} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recent.map((article) => (
                <ArticleCard key={article.id} variant="grid" article={article} showBookmark={true} />
              ))}
            </div>
          </React.Suspense>
        </div>

        {/* Trending Sidebar */}
        <aside>
          <h3 className="text-xl font-bold mb-4">Trending</h3>
          <React.Suspense fallback={<ArticleCardSkeleton variant="compact" count={5} />}>
            <div className="space-y-3">
              {trending.map((article) => (
                <ArticleCard key={article.id} variant="compact" article={article} showBookmark={false} />
              ))}
            </div>
          </React.Suspense>
        </aside>
      </div>
    </div>
  );
};

export default HomePage;
```

---

### Scenario 2: Search Results Page

**Location**: `/frontend/src/features/news/pages/SearchPage.tsx`

**Requirements**:
- List view for search results
- Filters sidebar
- Pagination

**Implementation**:

```tsx
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';
import { searchArticles } from '../api';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data } = useSuspenseQuery({
    queryKey: ['search', query],
    queryFn: () => searchArticles({ query }),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Search Results for "{query}"
      </h1>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          {/* Filter components */}
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {data.total} results found
          </p>

          <React.Suspense fallback={<ArticleCardSkeleton variant="list" count={10} />}>
            <div className="space-y-4">
              {data.articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  variant="list"
                  article={article}
                  showBookmark={true}
                />
              ))}
            </div>
          </React.Suspense>

          {/* Pagination */}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
```

---

### Scenario 3: Category Page

**Location**: `/frontend/src/features/news/pages/CategoryPage.tsx`

**Requirements**:
- Category header
- Grid of articles in that category
- Subcategories

**Implementation**:

```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';
import { fetchCategoryArticles, fetchCategory } from '../api';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: category } = useSuspenseQuery({
    queryKey: ['category', slug],
    queryFn: () => fetchCategory(slug!),
  });

  const { data: articles } = useSuspenseQuery({
    queryKey: ['category-articles', slug],
    queryFn: () => fetchCategoryArticles(slug!),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">{category.description}</p>
      </header>

      {/* Articles Grid */}
      <React.Suspense fallback={<ArticleCardSkeleton variant="grid" count={9} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} variant="grid" article={article} showBookmark={true} />
          ))}
        </div>
      </React.Suspense>
    </div>
  );
};

export default CategoryPage;
```

---

### Scenario 4: Author Profile Page

**Location**: `/frontend/src/features/news/pages/AuthorPage.tsx`

**Requirements**:
- Author info header
- List of author's articles
- Stats sidebar

**Implementation**:

```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';
import { fetchAuthor, fetchAuthorArticles } from '../api';

const AuthorPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  const { data: author } = useSuspenseQuery({
    queryKey: ['author', username],
    queryFn: () => fetchAuthor(username!),
  });

  const { data: articles } = useSuspenseQuery({
    queryKey: ['author-articles', username],
    queryFn: () => fetchAuthorArticles(username!),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Author Header */}
      <header className="mb-8">
        {/* Author info */}
      </header>

      {/* Articles */}
      <div className="max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Articles by {author.username}</h2>
        <React.Suspense fallback={<ArticleCardSkeleton variant="list" count={10} />}>
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} variant="list" article={article} showBookmark={true} />
            ))}
          </div>
        </React.Suspense>
      </div>
    </div>
  );
};

export default AuthorPage;
```

---

### Scenario 5: Article Detail Page (Related Articles)

**Location**: `/frontend/src/features/news/pages/ArticleDetailPage.tsx`

**Requirements**:
- Main article content
- Related articles in sidebar

**Implementation**:

```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';
import { fetchArticle, fetchRelatedArticles } from '../api';

const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data } = useSuspenseQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticle(slug!),
  });

  const { data: related } = useSuspenseQuery({
    queryKey: ['related-articles', slug],
    queryFn: () => fetchRelatedArticles(slug!),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Article Content */}
        <article className="lg:col-span-2">
          {/* Article content */}
        </article>

        {/* Related Articles Sidebar */}
        <aside>
          <h3 className="text-xl font-bold mb-4">Related Articles</h3>
          <React.Suspense fallback={<ArticleCardSkeleton variant="compact" count={5} />}>
            <div className="space-y-3">
              {related.map((article) => (
                <ArticleCard key={article.id} variant="compact" article={article} showBookmark={false} />
              ))}
            </div>
          </React.Suspense>
        </aside>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
```

---

## API Integration

### Setting Up Bookmark Functionality

Create a bookmark hook in `/frontend/src/features/news/hooks/useBookmark.ts`:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarkArticle, unbookmarkArticle } from '../api';

export const useBookmark = () => {
  const queryClient = useQueryClient();

  const bookmarkMutation = useMutation({
    mutationFn: async ({ articleId, isBookmarked }: { articleId: string; isBookmarked: boolean }) => {
      if (isBookmarked) {
        return await bookmarkArticle(articleId);
      } else {
        return await unbookmarkArticle(articleId);
      }
    },
    onSuccess: (_, { articleId }) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: (error) => {
      console.error('Bookmark error:', error);
      // Show error toast
    },
  });

  return {
    toggleBookmark: bookmarkMutation.mutateAsync,
    isLoading: bookmarkMutation.isPending,
  };
};
```

### Using the Bookmark Hook

```tsx
import { useBookmark } from '../hooks/useBookmark';

function ArticleList() {
  const { toggleBookmark } = useBookmark();

  return (
    <ArticleCard
      article={article}
      showBookmark={true}
      onBookmarkToggle={toggleBookmark}
    />
  );
}
```

---

## Infinite Scroll Integration

For pages with infinite scrolling:

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';

function InfiniteArticleFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['articles-infinite'],
    queryFn: ({ pageParam = 1 }) => fetchArticles({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const { ref, inView } = useInView();

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.pages.flatMap((page) =>
          page.articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="grid" />
          ))
        )}
      </div>

      {/* Intersection observer trigger */}
      <div ref={ref} className="py-8">
        {isFetchingNextPage && <ArticleCardSkeleton variant="grid" count={3} />}
      </div>
    </div>
  );
}
```

---

## Error Handling

Wrap ArticleCard in error boundaries:

```tsx
import { ErrorBoundary } from 'react-error-boundary';
import { ArticleCard } from '@/components/news';

function ArticleCardWithError({ article }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">Failed to load article</p>
        </div>
      }
    >
      <ArticleCard article={article} />
    </ErrorBoundary>
  );
}
```

---

## Performance Optimization

### Virtual Scrolling for Large Lists

For lists with 100+ items:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArticleCard } from '@/components/news';

function VirtualizedArticleList({ articles }) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: articles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height of list variant
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ArticleCard
              article={articles[virtualItem.index]}
              variant="list"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Integration

### Unit Test Example

```tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';

// Mock the API
vi.mock('../api', () => ({
  fetchFeaturedArticle: vi.fn(() => Promise.resolve(mockArticle)),
  fetchRecentArticles: vi.fn(() => Promise.resolve([mockArticle])),
}));

describe('HomePage Integration', () => {
  it('renders ArticleCard components', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(await screen.findByText('Article Title')).toBeInTheDocument();
  });
});
```

---

## Common Issues & Solutions

### Issue 1: Images Not Loading

**Problem**: Featured images show fallback instead of actual image

**Solution**: Ensure your API returns full URLs:

```tsx
// ❌ Bad
featuredImageUrl: '/uploads/image.jpg'

// ✅ Good
featuredImageUrl: 'https://cdn.example.com/uploads/image.jpg'
```

### Issue 2: Bookmark State Not Updating

**Problem**: Bookmark button doesn't reflect updated state

**Solution**: Invalidate queries after mutation:

```tsx
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['articles'] });
}
```

### Issue 3: Skeleton Flashing

**Problem**: Skeleton appears briefly even when data is cached

**Solution**: Use Suspense boundaries correctly:

```tsx
<React.Suspense fallback={<ArticleCardSkeleton />}>
  <ArticleList /> {/* Component that uses useSuspenseQuery */}
</React.Suspense>
```

### Issue 4: Dark Mode Not Working

**Problem**: Components don't switch to dark mode

**Solution**: Ensure Tailwind dark mode is configured:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
};
```

---

## Checklist

Before deploying ArticleCard integration:

- [ ] All required article fields are provided by API
- [ ] Bookmark API endpoints are implemented
- [ ] Loading states use ArticleCardSkeleton
- [ ] Error boundaries wrap article lists
- [ ] Accessibility tested with keyboard and screen reader
- [ ] Dark mode tested
- [ ] Responsive design tested on mobile
- [ ] Performance tested with large lists
- [ ] Image optimization configured (CDN, lazy loading)
- [ ] Analytics tracking added to onClick handlers

---

## Next Steps

1. **Implement API endpoints** for article data
2. **Add bookmark functionality** to backend
3. **Set up image CDN** with resize parameters
4. **Configure analytics** for tracking article engagement
5. **Add filters** for category and tag pages
6. **Implement pagination** or infinite scroll
7. **Add sharing functionality** (optional)
8. **Set up A/B testing** for variant performance (optional)

---

## Support

For issues or questions about ArticleCard integration:

1. Check the [README.md](./README.md) for component API
2. See [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) for layout reference
3. Review [ArticleCard.example.tsx](./ArticleCard.example.tsx) for patterns
4. Run [ArticleCard.demo.tsx](./ArticleCard.demo.tsx) for interactive testing

---

**Last Updated**: November 5, 2025
**Component Version**: 1.0.0
