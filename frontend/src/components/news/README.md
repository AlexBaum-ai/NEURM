# Article Card Components

Reusable article card components for displaying news articles with multiple layout variants.

## Components

### ArticleCard

A flexible, accessible article card component that supports multiple layout variants and features.

#### Features

- **Multiple Variants**: Grid (default), List, Featured, and Compact layouts
- **Responsive Images**: Lazy loading with srcset for optimal performance
- **Bookmark Functionality**: Authenticated users can bookmark articles
- **Category & Tags**: Visual badges and pills for content organization
- **Engagement Metrics**: Reading time, view count, bookmark count
- **Difficulty Badges**: Color-coded difficulty levels
- **Keyboard Navigation**: Full keyboard support with focus indicators
- **Dark Mode**: Complete dark mode support
- **Accessibility**: WCAG 2.1 Level AA compliant

#### Props

```typescript
interface ArticleCardProps {
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
```

#### Usage Examples

##### Grid Variant (Default)

Best for article grids on homepage and category pages.

```tsx
import { ArticleCard } from '@/components/news';

function ArticleGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          variant="grid"
          showBookmark={true}
          onBookmarkToggle={handleBookmark}
        />
      ))}
    </div>
  );
}
```

##### List Variant

Best for search results and author article lists.

```tsx
function ArticleList() {
  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          variant="list"
          showBookmark={true}
        />
      ))}
    </div>
  );
}
```

##### Featured Variant

Best for hero sections and featured article showcases.

```tsx
function FeaturedArticle() {
  return (
    <ArticleCard
      article={featuredArticle}
      variant="featured"
      showBookmark={true}
      onClick={() => trackEvent('featured_article_clicked')}
    />
  );
}
```

##### Compact Variant

Best for sidebars and "Related Articles" sections.

```tsx
function RelatedArticles() {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold">Related Articles</h3>
      {relatedArticles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          variant="compact"
          showBookmark={false}
        />
      ))}
    </div>
  );
}
```

##### With Loading State

```tsx
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';
import { useSuspenseQuery } from '@tanstack/react-query';

function ArticleFeed() {
  const { data: articles, isLoading } = useSuspenseQuery({
    queryKey: ['articles'],
    queryFn: fetchArticles,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ArticleCardSkeleton variant="grid" count={6} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

### ArticleCardSkeleton

Loading skeleton component that matches all ArticleCard layout variants.

#### Features

- **Variant Matching**: Skeletons match all ArticleCard variants exactly
- **Animated Pulse**: Smooth pulse animation for visual feedback
- **Multiple Skeletons**: Render multiple skeletons at once
- **Accessible**: Proper ARIA labels and screen reader support
- **Dark Mode**: Full dark mode support

#### Props

```typescript
interface ArticleCardSkeletonProps {
  variant?: 'grid' | 'list' | 'featured' | 'compact';
  count?: number;
}
```

#### Usage Examples

##### Single Skeleton

```tsx
import { ArticleCardSkeleton } from '@/components/news';

function LoadingState() {
  return <ArticleCardSkeleton variant="grid" />;
}
```

##### Multiple Skeletons

```tsx
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ArticleCardSkeleton variant="grid" count={6} />
    </div>
  );
}
```

##### List Skeletons

```tsx
function LoadingList() {
  return (
    <div className="space-y-4">
      <ArticleCardSkeleton variant="list" count={5} />
    </div>
  );
}
```

## Variants Comparison

| Variant    | Best Use Case                   | Image Size | Content Density | Mobile Optimized |
| ---------- | ------------------------------- | ---------- | --------------- | ---------------- |
| Grid       | Homepage, category pages        | 192px      | Medium          | ✓                |
| List       | Search results, author pages    | 128px      | High            | ✓                |
| Featured   | Hero sections, spotlights       | 320-384px  | Low             | ✓                |
| Compact    | Sidebars, related articles      | 80px       | Very High       | ✓                |

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between cards and interactive elements
- **Enter/Space**: Activate links and buttons
- **Escape**: Close any open modals or dialogs

### ARIA Labels

All interactive elements have proper ARIA labels:

- Bookmark button: "Add bookmark" / "Remove bookmark"
- Metrics: "Reading time: X minutes", "View count: X", "Bookmark count: X"
- Loading state: "Loading article"

### Screen Reader Support

- Semantic HTML structure with proper headings
- Alternative text for all images
- Status announcements for loading states
- Proper time elements with dateTime attributes

## Performance Optimization

### Image Optimization

- **Lazy Loading**: All images use `loading="lazy"`
- **Responsive Images**: srcset provides multiple sizes
- **Sizes Attribute**: Optimized for different viewports
- **Fallback**: Gradient background when no image available

### Code Splitting

The component can be lazy loaded:

```tsx
import { lazy, Suspense } from 'react';

const ArticleCard = lazy(() => import('@/components/news/ArticleCard'));

function LazyArticleCard(props) {
  return (
    <Suspense fallback={<ArticleCardSkeleton />}>
      <ArticleCard {...props} />
    </Suspense>
  );
}
```

## Customization

### Styling

The component uses Tailwind CSS classes. You can customize:

- Border radius: Modify `rounded-lg`, `rounded-xl`
- Shadow: Change `shadow-sm`, `shadow-lg`
- Spacing: Adjust `gap-*`, `p-*`, `space-y-*`
- Colors: Override theme colors in `tailwind.config.js`

### Difficulty Colors

Customize difficulty badge colors:

```tsx
const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty?.toUpperCase()) {
    case 'BEGINNER':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'INTERMEDIATE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    // Add custom difficulty levels
  }
};
```

## Integration Examples

### With TanStack Query

```tsx
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';

function ArticleList() {
  const { data: articles } = useSuspenseQuery({
    queryKey: ['articles'],
    queryFn: fetchArticles,
  });

  return (
    <React.Suspense fallback={<ArticleCardSkeleton variant="list" count={10} />}>
      <div className="space-y-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="list" />
        ))}
      </div>
    </React.Suspense>
  );
}
```

### With Infinite Scroll

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArticleCard } from '@/components/news';

function InfiniteArticleFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['articles'],
    queryFn: ({ pageParam }) => fetchArticles(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.pages.flatMap((page) =>
          page.articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        )}
      </div>
      {isFetchingNextPage && <ArticleCardSkeleton variant="grid" count={3} />}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  );
}
```

### With Bookmark API

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArticleCard } from '@/components/news';
import { bookmarkArticle, unbookmarkArticle } from '@/features/news/api';

function BookmarkableArticle({ article }) {
  const queryClient = useQueryClient();

  const bookmarkMutation = useMutation({
    mutationFn: ({ articleId, isBookmarked }) =>
      isBookmarked ? bookmarkArticle(articleId) : unbookmarkArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const handleBookmarkToggle = async (articleId: string, isBookmarked: boolean) => {
    await bookmarkMutation.mutateAsync({ articleId, isBookmarked });
  };

  return (
    <ArticleCard
      article={article}
      showBookmark={true}
      onBookmarkToggle={handleBookmarkToggle}
    />
  );
}
```

## Testing

The components include comprehensive test coverage:

- Unit tests for all variants
- Accessibility tests
- Interaction tests (bookmark, click handlers)
- Responsive image tests
- Dark mode tests

Run tests:

```bash
npm test ArticleCard.test.tsx
npm test ArticleCardSkeleton.test.tsx
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android

## License

Part of the Neurmatic project. See project root for license information.

## Related Components

- `ArticleDetail`: Full article view
- `ArticleList`: Container for multiple articles
- `CategoryBadge`: Standalone category badge
- `TagPill`: Standalone tag pill

## Changelog

### Version 1.0.0 (Current)

- Initial release
- Four layout variants (grid, list, featured, compact)
- Bookmark functionality
- Loading skeleton
- Full accessibility support
- Dark mode support
- Responsive images with lazy loading
