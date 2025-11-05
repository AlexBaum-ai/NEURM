# Article Search & Filtering - Quick Reference

## Base URL
```
http://vps-1a707765.vps.ovh.net:3000/api/v1
```

## Endpoint
```
GET /news/articles
```

## Query Parameters

### Pagination
| Parameter | Type | Default | Min | Max | Description |
|-----------|------|---------|-----|-----|-------------|
| `page` | integer | 1 | 1 | - | Page number (offset pagination) |
| `limit` | integer | 20 | 1 | 100 | Results per page |
| `cursor` | UUID | - | - | - | Cursor for cursor-based pagination |

### Search
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search query (2-200 chars) |

### Filters
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Category slug (e.g., "tutorials") |
| `categoryId` | UUID | Category UUID |
| `tags` | string | Comma-separated tag slugs (e.g., "nlp,ml,gpt") |
| `tagId` | UUID | Single tag UUID |
| `difficulty` | enum | beginner, intermediate, or advanced |
| `model` | string | Model slug (e.g., "gpt-4") |
| `modelId` | UUID | Model UUID |
| `isFeatured` | boolean | Filter featured articles (true/false) |
| `isTrending` | boolean | Filter trending articles (true/false) |

### Sorting
| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| `sortBy` | enum | publishedAt | publishedAt, viewCount, bookmarkCount, createdAt, relevance |
| `sortOrder` | enum | desc | asc, desc |

**Note**: `sortBy=relevance` requires a `search` query and triggers full-text search with ranking.

## Response Format

### Standard Response
```json
{
  "status": "success",
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "Article Title",
        "slug": "article-slug",
        "summary": "Article summary...",
        "featuredImageUrl": "https://...",
        "category": {
          "id": "uuid",
          "name": "Category Name",
          "slug": "category-slug"
        },
        "tags": [
          {
            "tag": {
              "id": "uuid",
              "name": "Tag Name",
              "slug": "tag-slug"
            }
          }
        ],
        "models": [
          {
            "model": {
              "id": "uuid",
              "name": "GPT-4",
              "slug": "gpt-4",
              "logoUrl": "https://..."
            }
          }
        ],
        "author": {
          "id": "uuid",
          "username": "author",
          "profile": {
            "displayName": "Author Name",
            "avatarUrl": "https://..."
          }
        },
        "difficultyLevel": "beginner",
        "readingTimeMinutes": 10,
        "viewCount": 1234,
        "bookmarkCount": 56,
        "publishedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Search Response (with highlighting)
```json
{
  "status": "success",
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "Understanding Transformer Architecture",
        "searchHighlight": {
          "title": "Understanding <mark>Transformer</mark> Architecture",
          "summary": "A deep dive into <mark>transformer</mark> models...",
          "rank": 0.876543
        }
        // ... other fields
      }
    ]
  }
}
```

### Cursor Pagination Response
```json
{
  "status": "success",
  "data": {
    "articles": [...],
    "total": 20,
    "page": 1,
    "limit": 20,
    "totalPages": 0,
    "hasMore": true,
    "nextCursor": "uuid-of-last-article"
  }
}
```

## Common Examples

### 1. Latest Articles
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles"
```

### 2. Search
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?search=transformer"
```

### 3. Search with Relevance Ranking
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?search=gpt-4&sortBy=relevance"
```

### 4. Filter by Category
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?category=tutorials"
```

### 5. Filter by Multiple Tags
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?tags=nlp,transformers,gpt"
```

### 6. Filter by Difficulty
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?difficulty=beginner"
```

### 7. Filter by Model
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?model=gpt-4"
```

### 8. Sort by Popularity
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?sortBy=viewCount&sortOrder=desc"
```

### 9. Featured Articles
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?isFeatured=true"
```

### 10. Combined Filters
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?category=tutorials&difficulty=intermediate&tags=nlp,ml&sortBy=viewCount&sortOrder=desc&limit=10"
```

### 11. Cursor Pagination (Infinite Scroll)
```bash
# First request
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?limit=20"

# Use nextCursor from response
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?limit=20&cursor=<nextCursor>"
```

## JavaScript Examples

### Fetch API
```javascript
// Basic search
const response = await fetch(
  'http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?search=transformer&sortBy=relevance'
);
const data = await response.json();
console.log(data.data.articles);

// Combined filters
const params = new URLSearchParams({
  category: 'tutorials',
  difficulty: 'beginner',
  tags: 'nlp,ml',
  sortBy: 'viewCount',
  sortOrder: 'desc',
  limit: '10'
});

const response = await fetch(
  `http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?${params}`
);
const data = await response.json();
```

### Axios
```javascript
import axios from 'axios';

const { data } = await axios.get('http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles', {
  params: {
    search: 'transformer',
    category: 'tutorials',
    difficulty: 'beginner',
    sortBy: 'relevance',
    limit: 20
  }
});

console.log(data.data.articles);
```

### React Hook (TanStack Query)
```javascript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function useArticles(filters) {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      const { data } = await axios.get(
        'http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles',
        { params: filters }
      );
      return data.data;
    }
  });
}

// Usage
function ArticleList() {
  const { data, isLoading } = useArticles({
    search: 'transformer',
    category: 'tutorials',
    difficulty: 'beginner',
    sortBy: 'relevance',
    limit: 20
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.articles.map(article => (
        <ArticleCard
          key={article.id}
          article={article}
          highlight={article.searchHighlight}
        />
      ))}
    </div>
  );
}
```

### Infinite Scroll (Cursor Pagination)
```javascript
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

function useInfiniteArticles(filters) {
  return useInfiniteQuery({
    queryKey: ['articles', 'infinite', filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await axios.get(
        'http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles',
        {
          params: {
            ...filters,
            cursor: pageParam,
            limit: 20
          }
        }
      );
      return data.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

// Usage
function InfiniteArticleList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteArticles({
    category: 'tutorials',
    difficulty: 'beginner'
  });

  return (
    <div>
      {data?.pages.map((page) => (
        page.articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Error Responses

### Validation Error
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "limit",
      "message": "Limit must not exceed 100"
    }
  ]
}
```

### Search Error
```json
{
  "status": "error",
  "message": "Search query must be at least 2 characters",
  "code": "VALIDATION_ERROR"
}
```

### Not Found
```json
{
  "status": "error",
  "message": "No articles found",
  "code": "NOT_FOUND"
}
```

## Performance Tips

1. **Use Cursor Pagination** for infinite scroll (better performance)
2. **Enable Caching** - responses are cached for 5 minutes
3. **Limit Results** - use appropriate `limit` (default 20, max 100)
4. **Filter Early** - use specific filters to reduce result set
5. **Use Relevance Sort** only with search queries

## Rate Limiting

- **Limit**: 100 requests per 15 minutes
- **Headers**: Check `X-RateLimit-*` headers
- **Status**: Returns `429 Too Many Requests` when exceeded

## Search Highlighting

When using `sortBy=relevance`, search results include highlighted matches:

```javascript
// Display highlighted title
<div dangerouslySetInnerHTML={{
  __html: article.searchHighlight?.title || article.title
}} />

// Display highlighted summary
<div dangerouslySetInnerHTML={{
  __html: article.searchHighlight?.summary || article.summary
}} />

// Show relevance score
<span>Relevance: {article.searchHighlight?.rank.toFixed(2)}</span>
```

## TypeScript Types

```typescript
interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  contentFormat: 'markdown' | 'html';
  featuredImageUrl?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  models: Array<{
    model: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string;
    };
  }>;
  author?: {
    id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatarUrl?: string;
    };
  };
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  readingTimeMinutes?: number;
  viewCount: number;
  bookmarkCount: number;
  publishedAt: string;
  searchHighlight?: {
    title: string;
    summary: string;
    rank: number;
  };
}

interface ArticleListResponse {
  status: 'success';
  data: {
    articles: Article[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore?: boolean;
    nextCursor?: string;
  };
}

interface ArticleSearchParams {
  page?: number;
  limit?: number;
  cursor?: string;
  search?: string;
  category?: string;
  categoryId?: string;
  tags?: string;
  tagId?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  model?: string;
  modelId?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  sortBy?: 'publishedAt' | 'viewCount' | 'bookmarkCount' | 'createdAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}
```

## Additional Resources

- **Full Documentation**: `/docs/SPRINT-2-003-SEARCH-IMPLEMENTATION.md`
- **API Endpoints**: `projectdoc/03-API_ENDPOINTS.md`
- **Database Schema**: `projectdoc/02-DATABASE_SCHEMA.md`
- **Test Script**: `/test-articles-search.sh`

---

**Last Updated**: November 5, 2025
**API Version**: v1
**Status**: Production Ready
