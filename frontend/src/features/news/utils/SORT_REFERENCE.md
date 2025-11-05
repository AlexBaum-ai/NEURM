# News Article Sorting - Quick Reference

## Frontend Sort Options

Use these values in your components:

```typescript
import type { SortOption } from '../types';

const sortOption: SortOption = 'publishedAt-desc'; // Latest first
```

### Available Options

| Value | Description | Backend Translation |
|-------|-------------|---------------------|
| `'publishedAt-desc'` | Latest articles first (default) | `sortBy=publishedAt&sortOrder=desc` |
| `'publishedAt-asc'` | Oldest articles first | `sortBy=publishedAt&sortOrder=asc` |
| `'viewCount-desc'` | Most viewed articles | `sortBy=viewCount&sortOrder=desc` |
| `'bookmarkCount-desc'` | Most bookmarked articles | `sortBy=bookmarkCount&sortOrder=desc` |
| `'createdAt-desc'` | Recently created | `sortBy=createdAt&sortOrder=desc` |
| `'createdAt-asc'` | Oldest created | `sortBy=createdAt&sortOrder=asc` |
| `'relevance'` | Most relevant (for search) | `sortBy=relevance` |

## Usage Examples

### In Components
```tsx
import { useState } from 'react';
import type { SortOption } from '../types';

function MyComponent() {
  const [sortBy, setSortBy] = useState<SortOption>('publishedAt-desc');

  return (
    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
      <option value="publishedAt-desc">Latest First</option>
      <option value="publishedAt-asc">Oldest First</option>
      <option value="viewCount-desc">Most Viewed</option>
      <option value="bookmarkCount-desc">Most Bookmarked</option>
    </select>
  );
}
```

### In Links
```tsx
import { Link } from 'react-router-dom';

function MyComponent() {
  return (
    <Link to="/news?sortBy=viewCount-desc">
      View Most Popular
    </Link>
  );
}
```

### With Hooks
```tsx
import { useArticles } from '../hooks/useArticles';

function MyComponent() {
  const { data, isLoading } = useArticles({
    sortBy: 'publishedAt-desc',
    limit: 20
  });

  // ...
}
```

## Utility Functions

### Parse Sort Option (Internal Use)
```typescript
import { parseSortOption } from '../utils/sortUtils';

const { sortBy, sortOrder } = parseSortOption('publishedAt-desc');
// Result: { sortBy: 'publishedAt', sortOrder: 'desc' }
```

### Convert to Sort Option (Internal Use)
```typescript
import { toSortOption } from '../utils/sortUtils';

const sortOption = toSortOption('publishedAt', 'desc');
// Result: 'publishedAt-desc'
```

## Common Mistakes

### ❌ Don't Use Old Format
```typescript
// WRONG - Old format with minus prefix
const sortBy = '-published_at';
const sortBy = '-view_count';
```

### ✅ Use New Format
```typescript
// CORRECT - New format with hyphen separator
const sortBy = 'publishedAt-desc';
const sortBy = 'viewCount-desc';
```

### ❌ Don't Manually Build Query Strings
```typescript
// WRONG - Manual query string building
fetch(`/api/news/articles?sortBy=${sortBy}`);
```

### ✅ Use the API Client
```typescript
// CORRECT - Use newsApi which handles parsing
import { newsApi } from '../api/newsApi';

const response = await newsApi.getArticles({
  sortBy: 'publishedAt-desc',
  page: 1,
  limit: 20
});
```

## Migration Guide

If you find old code using the previous format:

1. **Update Type**: Change `SortOption` values
   ```typescript
   // Before
   const sortBy: SortOption = '-published_at';

   // After
   const sortBy: SortOption = 'publishedAt-desc';
   ```

2. **Update Select Options**
   ```tsx
   // Before
   <option value="-published_at">Latest</option>
   <option value="-view_count">Most Viewed</option>

   // After
   <option value="publishedAt-desc">Latest</option>
   <option value="viewCount-desc">Most Viewed</option>
   ```

3. **Update Links**
   ```tsx
   // Before
   <Link to="/news?sortBy=-view_count">Popular</Link>

   // After
   <Link to="/news?sortBy=viewCount-desc">Popular</Link>
   ```

## Backend Compatibility

The frontend automatically converts to backend format:

| Frontend | Backend URL Parameters |
|----------|----------------------|
| `publishedAt-desc` | `sortBy=publishedAt&sortOrder=desc` |
| `viewCount-desc` | `sortBy=viewCount&sortOrder=desc` |
| `relevance` | `sortBy=relevance` |

This conversion is handled automatically by `newsApi.getArticles()` using the `parseSortOption()` utility.

## Questions?

- See `src/features/news/types/index.ts` for type definitions
- See `src/features/news/utils/sortUtils.ts` for parsing logic
- See `src/features/news/api/newsApi.ts` for API implementation
