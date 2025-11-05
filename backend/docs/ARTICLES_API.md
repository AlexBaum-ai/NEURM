# Articles API Documentation

## Overview

The Articles API provides comprehensive CRUD operations for news articles in the Neurmatic platform. It supports public article browsing with advanced filtering and pagination, as well as admin-only article management.

## Features

- ✅ Full CRUD operations for articles
- ✅ Public article listing with filters and pagination
- ✅ Full-text search using PostgreSQL tsvector
- ✅ Redis caching for performance (5-minute TTL)
- ✅ Related articles based on tag similarity
- ✅ View count tracking
- ✅ Bookmark status (for authenticated users)
- ✅ Admin-only management endpoints
- ✅ Comprehensive validation using Zod
- ✅ Rate limiting
- ✅ Sentry error tracking

## Architecture

The Articles API follows the layered architecture pattern:

```
Routes (HTTP) → Controller (Validation) → Service (Business Logic) → Repository (Database) → PostgreSQL
                                                ↓
                                         Redis Cache
```

### Files Structure

```
src/modules/news/
├── articles.routes.ts      # Express routes and rate limiting
├── articles.controller.ts  # HTTP request handlers
├── articles.service.ts     # Business logic and caching
├── articles.repository.ts  # Database operations
└── articles.validation.ts  # Zod schemas
```

## API Endpoints

### Public Endpoints

#### List Articles

```http
GET /api/v1/news/articles
```

List published articles with filters and pagination.

**Query Parameters:**

| Parameter       | Type    | Default      | Description                                    |
|----------------|---------|--------------|------------------------------------------------|
| page           | number  | 1            | Page number                                    |
| limit          | number  | 20           | Items per page (max 100)                       |
| categoryId     | UUID    | -            | Filter by category                             |
| tagId          | UUID    | -            | Filter by tag                                  |
| authorId       | UUID    | -            | Filter by author                               |
| difficultyLevel| enum    | -            | Filter by difficulty (beginner/intermediate/advanced) |
| isFeatured     | boolean | -            | Show only featured articles                    |
| isTrending     | boolean | -            | Show only trending articles                    |
| search         | string  | -            | Full-text search query (min 2 chars)           |
| sortBy         | enum    | publishedAt  | Sort field (publishedAt/viewCount/bookmarkCount/createdAt/relevance) |
| sortOrder      | enum    | desc         | Sort order (asc/desc)                          |

**Example:**

```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?page=1&limit=10&search=llm&sortBy=viewCount"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Introduction to Large Language Models",
      "slug": "introduction-to-large-language-models",
      "summary": "Learn the fundamentals of LLMs...",
      "featuredImageUrl": "https://...",
      "status": "published",
      "publishedAt": "2025-11-05T12:00:00.000Z",
      "difficultyLevel": "beginner",
      "readingTimeMinutes": 10,
      "viewCount": 1250,
      "bookmarkCount": 45,
      "isFeatured": true,
      "isTrending": false,
      "category": {
        "id": "uuid",
        "name": "AI Models",
        "slug": "ai-models"
      },
      "author": {
        "id": "uuid",
        "username": "admin",
        "profile": {
          "displayName": "Admin User",
          "avatarUrl": "https://..."
        }
      },
      "tags": [
        {
          "tag": {
            "id": "uuid",
            "name": "LLM",
            "slug": "llm"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

**Rate Limit:** 60 requests/minute

---

#### Get Article by Slug

```http
GET /api/v1/news/articles/:slug
```

Get article detail by slug. Includes related articles and bookmark status (if authenticated).

**Parameters:**

- `slug` (path) - Article slug (e.g., "introduction-to-large-language-models")

**Headers (Optional):**

- `Authorization: Bearer <token>` - For bookmark status

**Example:**

```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles/introduction-to-large-language-models"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "article": {
      "id": "uuid",
      "title": "Introduction to Large Language Models",
      "slug": "introduction-to-large-language-models",
      "summary": "Learn the fundamentals...",
      "content": "# Introduction to LLMs\n\n...",
      "contentFormat": "markdown",
      "featuredImageUrl": "https://...",
      "status": "published",
      "publishedAt": "2025-11-05T12:00:00.000Z",
      "difficultyLevel": "beginner",
      "readingTimeMinutes": 10,
      "viewCount": 1251,
      "bookmarkCount": 45,
      "shareCount": 12,
      "metaTitle": "Introduction to LLMs | Neurmatic",
      "metaDescription": "Learn the fundamentals...",
      "isFeatured": true,
      "isTrending": false,
      "category": { ... },
      "author": { ... },
      "tags": [ ... ],
      "models": [
        {
          "model": {
            "id": "uuid",
            "name": "GPT-4",
            "slug": "gpt-4",
            "provider": "OpenAI",
            "logoUrl": "https://..."
          },
          "isPrimary": true
        }
      ]
    },
    "relatedArticles": [ ... ],
    "isBookmarked": false
  }
}
```

**Features:**
- Auto-increments view count
- Returns related articles (based on common tags)
- Shows bookmark status for authenticated users
- Cached for 5 minutes

**Rate Limit:** 60 requests/minute

---

### Admin Endpoints

All admin endpoints require authentication with admin role.

#### Create Article

```http
POST /api/v1/admin/articles
```

Create a new article.

**Headers:**

- `Authorization: Bearer <admin_token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "title": "Introduction to Large Language Models",
  "slug": "introduction-to-large-language-models",
  "summary": "Learn the fundamentals of Large Language Models...",
  "content": "# Introduction to LLMs\n\n...",
  "contentFormat": "markdown",
  "featuredImageUrl": "https://example.com/image.jpg",
  "authorId": "user-uuid",
  "authorName": "John Doe",
  "sourceUrl": "https://source.com/article",
  "categoryId": "category-uuid",
  "status": "published",
  "scheduledAt": "2025-11-10T12:00:00Z",
  "publishedAt": "2025-11-05T12:00:00Z",
  "difficultyLevel": "beginner",
  "readingTimeMinutes": 10,
  "metaTitle": "Introduction to LLMs | Neurmatic",
  "metaDescription": "Learn the fundamentals...",
  "isFeatured": true,
  "isTrending": false,
  "tagIds": ["tag-uuid-1", "tag-uuid-2"],
  "modelIds": ["model-uuid-1", "model-uuid-2"]
}
```

**Validation Rules:**

- `title`: 10-255 characters
- `slug`: 3-255 characters, lowercase alphanumeric with hyphens, must be unique
- `summary`: 50-500 characters
- `content`: min 100 characters
- `contentFormat`: "markdown" or "html"
- `categoryId`: required, must be valid UUID
- `status`: "draft", "review", "scheduled", "published", or "archived"
- `readingTimeMinutes`: 1-300 minutes
- All UUIDs must be valid

**Response (201 Created):**

```json
{
  "success": true,
  "data": { ... },
  "message": "Article created successfully"
}
```

**Rate Limit:** 20 requests/minute

---

#### Get Article by ID

```http
GET /api/v1/admin/articles/:id
```

Get article by ID (includes all statuses, not just published).

**Parameters:**

- `id` (path) - Article UUID

**Headers:**

- `Authorization: Bearer <admin_token>` (required)

**Response (200 OK):**

```json
{
  "success": true,
  "data": { ... }
}
```

**Rate Limit:** 60 requests/minute

---

#### Update Article

```http
PATCH /api/v1/admin/articles/:id
```

Update an existing article. All fields are optional.

**Parameters:**

- `id` (path) - Article UUID

**Headers:**

- `Authorization: Bearer <admin_token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "title": "Updated Title",
  "status": "published",
  "isTrending": true,
  "readingTimeMinutes": 12
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": { ... },
  "message": "Article updated successfully"
}
```

**Notes:**
- If slug is changed, uniqueness is validated
- Cache is automatically invalidated
- `updatedById` and `updatedAt` are automatically set

**Rate Limit:** 20 requests/minute

---

#### Delete Article

```http
DELETE /api/v1/admin/articles/:id
```

Delete an article permanently.

**Parameters:**

- `id` (path) - Article UUID

**Headers:**

- `Authorization: Bearer <admin_token>` (required)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

**Notes:**
- Cascading delete: removes associated tags, models, bookmarks, and revisions
- Cache is automatically invalidated

**Rate Limit:** 20 requests/minute

---

## Caching Strategy

The Articles API uses Redis for caching with a 5-minute TTL:

### Cached Operations

1. **Article Detail** (by slug)
   - Cache key: `article:slug:<slug>:<userId or anonymous>`
   - TTL: 5 minutes
   - Invalidated on: article update or delete

2. **Article List**
   - Cache key: `articles:list:<query_params>`
   - TTL: 5 minutes
   - Invalidated on: any article create, update, or delete

### Cache Invalidation

- Article update/delete invalidates all caches for that article
- Any article modification invalidates the entire list cache
- Graceful degradation: if Redis is unavailable, queries go directly to database

---

## Full-Text Search

The API uses PostgreSQL's full-text search capabilities:

### Implementation

- **tsvector column**: Automatically updated via trigger
- **GIN index**: For fast search performance
- **Weighted search**:
  - Title: Weight A (highest)
  - Summary: Weight B
  - Content: Weight C

### Usage

```bash
# Search articles
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/articles?search=machine+learning"
```

### Performance

- Search queries use the GIN index for sub-second response times
- Automatic ranking by relevance
- Supports English language stemming

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Article with slug 'xyz' not found",
    "code": "NOT_FOUND",
    "statusCode": 404
  }
}
```

### Common Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (article doesn't exist)
- `409` - Conflict (duplicate slug)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Testing

Run the test script:

```bash
# Set admin token
export ADMIN_TOKEN="your-admin-jwt-token"

# Run tests
./test-articles-api.sh
```

---

## Database Schema

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  content_format VARCHAR(20) DEFAULT 'markdown',
  featured_image_url VARCHAR(500),
  author_id UUID,
  author_name VARCHAR(100),
  source_url VARCHAR(500),
  category_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  difficulty_level VARCHAR(20),
  reading_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_id UUID NOT NULL,
  updated_by_id UUID,
  search_vector TSVECTOR
);

-- Indexes
CREATE INDEX articles_search_vector_idx ON articles USING GIN (search_vector);
CREATE INDEX articles_status_published_at_idx ON articles (status, published_at DESC);
CREATE INDEX articles_featured_published_at_idx ON articles (is_featured, published_at DESC) WHERE status = 'published';
CREATE INDEX articles_trending_published_at_idx ON articles (is_trending, published_at DESC) WHERE status = 'published';
```

---

## Performance Considerations

- **Pagination**: Max 100 items per page
- **Rate Limiting**: 60 req/min (public), 20 req/min (admin write)
- **Caching**: 5-minute TTL reduces database load
- **Full-Text Search**: GIN index provides sub-second search
- **View Count**: Incremented asynchronously to avoid blocking

---

## Security

- Admin endpoints require JWT authentication with admin role
- Input validation using Zod schemas
- SQL injection protection via Prisma ORM
- Rate limiting to prevent abuse
- Sentry error tracking (no sensitive data logged)

---

## Related Models

- **NewsCategory**: Article categories
- **NewsTag**: Article tags
- **LLMModel**: Associated LLM models
- **Bookmark**: User bookmarks
- **ArticleRevision**: Article version history

---

## Future Enhancements

- [ ] Article versioning and rollback
- [ ] Multi-language support
- [ ] Advanced analytics (reading time, scroll depth)
- [ ] Social sharing integration
- [ ] Content recommendations using ML
- [ ] Elasticsearch for advanced search
- [ ] Image optimization and CDN
- [ ] RSS feed generation

---

## Support

For issues or questions, contact the development team or check the main documentation at `/docs/README.md`.
