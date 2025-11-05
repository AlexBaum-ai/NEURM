# ArticleCard - Quick Start Guide

Get up and running with ArticleCard in under 5 minutes.

## Installation

The component is already installed in the project. No additional packages required.

## Import

```tsx
import { ArticleCard, ArticleCardSkeleton } from '@/components/news';
```

## Basic Usage

### 1. Grid View (Homepage)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {articles.map(article => (
    <ArticleCard key={article.id} article={article} />
  ))}
</div>
```

### 2. List View (Search Results)

```tsx
<div className="space-y-4">
  {articles.map(article => (
    <ArticleCard key={article.id} article={article} variant="list" />
  ))}
</div>
```

### 3. Featured (Hero Section)

```tsx
<ArticleCard article={featuredArticle} variant="featured" />
```

### 4. Compact (Sidebar)

```tsx
<div className="space-y-3">
  {articles.map(article => (
    <ArticleCard key={article.id} article={article} variant="compact" />
  ))}
</div>
```

## With Loading State

```tsx
{isLoading ? (
  <ArticleCardSkeleton variant="grid" count={6} />
) : (
  articles.map(article => <ArticleCard key={article.id} article={article} />)
)}
```

## With Bookmark

```tsx
<ArticleCard
  article={article}
  showBookmark={true}
  onBookmarkToggle={async (id, isBookmarked) => {
    await bookmarkArticle(id, isBookmarked);
  }}
/>
```

## Article Data Format

```typescript
const article = {
  id: '1',
  slug: 'article-slug',
  title: 'Article Title',
  summary: 'Article summary...',
  featuredImageUrl: 'https://example.com/image.jpg', // optional
  author: {
    username: 'johndoe',
    profile: {
      avatarUrl: 'https://example.com/avatar.jpg' // optional
    }
  },
  category: { // optional
    slug: 'tutorials',
    name: 'Tutorials'
  },
  tags: [
    { slug: 'tag1', name: 'Tag 1' }
  ],
  publishedAt: '2024-01-01T00:00:00Z',
  readingTimeMinutes: 5, // optional
  viewCount: 100,
  bookmarkCount: 10,
  difficulty: 'INTERMEDIATE', // optional: BEGINNER|INTERMEDIATE|ADVANCED|EXPERT
  isBookmarked: false // optional
};
```

## Common Layouts

### Homepage Layout

```tsx
<div className="container mx-auto px-4 py-8">
  {/* Featured */}
  <ArticleCard variant="featured" article={featured} />

  {/* Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
    {articles.map(article => (
      <ArticleCard key={article.id} article={article} />
    ))}
  </div>
</div>
```

### With Sidebar

```tsx
<div className="grid lg:grid-cols-3 gap-8">
  {/* Main - 2 columns */}
  <div className="lg:col-span-2 space-y-4">
    {articles.map(article => (
      <ArticleCard key={article.id} variant="list" article={article} />
    ))}
  </div>

  {/* Sidebar - 1 column */}
  <aside className="space-y-3">
    <h3>Trending</h3>
    {trending.map(article => (
      <ArticleCard key={article.id} variant="compact" article={article} />
    ))}
  </aside>
</div>
```

## Next Steps

1. **Read the full docs**: [`README.md`](./README.md)
2. **See visual examples**: [`VISUAL_GUIDE.md`](./VISUAL_GUIDE.md)
3. **Integration guide**: [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md)
4. **Run the demo**: Import `ArticleCard.demo.tsx` into your app

## Troubleshooting

**Images not loading?**
- Ensure `featuredImageUrl` is a full URL (not relative path)

**Bookmark not working?**
- Check if `onBookmarkToggle` prop is provided
- Ensure user is authenticated

**Skeleton not showing?**
- Wrap in `<React.Suspense>` boundary
- Use with `useSuspenseQuery` from TanStack Query

## Support

For detailed information, see:
- Full API: [`README.md`](./README.md)
- Visual reference: [`VISUAL_GUIDE.md`](./VISUAL_GUIDE.md)
- Integration: [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md)
- Examples: [`ArticleCard.example.tsx`](./ArticleCard.example.tsx)
