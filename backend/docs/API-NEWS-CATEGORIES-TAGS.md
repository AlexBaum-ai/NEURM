# News Categories and Tags API Reference

Quick reference for the News module's categories and tags endpoints.

## Base URL

```
http://vps-1a707765.vps.ovh.net:3000/api/v1/news
```

---

## Categories Endpoints

### 1. Get All Categories (Hierarchical)

**GET** `/categories`

Returns all categories as a hierarchical tree with up to 3 levels (parent → child → grandchild).

**Query Parameters:**
- `includeInactive` (boolean, optional) - Include inactive categories (default: false)

**Example Request:**
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/news/categories
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "LLM News",
      "slug": "llm-news",
      "description": "Latest news about LLMs",
      "icon": "📰",
      "parentId": null,
      "level": 1,
      "displayOrder": 1,
      "isActive": true,
      "articleCount": 42,
      "createdAt": "2025-11-05T10:00:00.000Z",
      "updatedAt": "2025-11-05T10:00:00.000Z",
      "children": [
        {
          "id": "uuid",
          "name": "Model Releases",
          "slug": "model-releases",
          "description": "New model announcements",
          "parentId": "parent-uuid",
          "level": 2,
          "articleCount": 15,
          "children": []
        }
      ]
    }
  ],
  "meta": {
    "total": 12,
    "includeInactive": false
  }
}
```

---

### 2. Get Category by Slug

**GET** `/categories/:slug`

Get a specific category with its hierarchy (parent + children).

**Path Parameters:**
- `slug` (string, required) - Category slug (lowercase, hyphens only)

**Example Request:**
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/news/categories/llm-news
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "LLM News",
    "slug": "llm-news",
    "description": "Latest news about LLMs",
    "icon": "📰",
    "parentId": null,
    "level": 1,
    "articleCount": 42,
    "parent": null,
    "children": [
      {
        "id": "uuid",
        "name": "Model Releases",
        "slug": "model-releases",
        "articleCount": 15,
        "children": []
      }
    ]
  }
}
```

---

### 3. Get Categories with Counts

**GET** `/categories/with-counts`

Returns a flat list of all active categories with article counts.

**Example Request:**
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/news/categories/with-counts
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "LLM News",
      "slug": "llm-news",
      "level": 1,
      "articleCount": 42
    }
  ],
  "meta": {
    "total": 12
  }
}
```

---

## Tags Endpoints

### 1. Get All Tags

**GET** `/tags`

Get all tags with usage counts, with optional search and sorting.

**Query Parameters:**
- `search` (string, optional) - Filter by name/slug (case-insensitive)
- `limit` (number, optional) - Results limit (1-100, default: 50)
- `sortBy` (enum, optional) - Sort field: `name`, `usageCount`, `createdAt` (default: `usageCount`)
- `sortOrder` (enum, optional) - Sort order: `asc`, `desc` (default: `desc`)

**Example Request:**
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/tags?search=gpt&limit=10&sortBy=name&sortOrder=asc"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "GPT-4",
      "slug": "gpt-4",
      "description": "OpenAI GPT-4 model",
      "usageCount": 123,
      "createdAt": "2025-11-05T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "search": "gpt",
    "limit": 10,
    "sortBy": "name",
    "sortOrder": "asc"
  }
}
```

---

### 2. Search Tags (Autocomplete)

**GET** `/tags/search`

Tag autocomplete for search inputs. Returns top 10 matching tags.

**Query Parameters:**
- `query` (string, required) - Search query

**Example Request:**
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/tags/search?query=trans"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Transformers",
      "slug": "transformers",
      "description": "Transformer architecture",
      "usageCount": 89,
      "createdAt": "2025-11-05T10:00:00.000Z"
    }
  ],
  "meta": {
    "query": "trans",
    "limit": 10,
    "total": 1
  }
}
```

---

### 3. Get Popular Tags

**GET** `/tags/popular`

Get most popular tags by usage count.

**Query Parameters:**
- `limit` (number, optional) - Results limit (1-100, default: 20)

**Example Request:**
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/tags/popular?limit=5"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "GPT-4",
      "slug": "gpt-4",
      "description": "OpenAI GPT-4 model",
      "usageCount": 234
    },
    {
      "id": "uuid",
      "name": "Claude",
      "slug": "claude",
      "usageCount": 189
    }
  ],
  "meta": {
    "limit": 5,
    "total": 2
  }
}
```

---

### 4. Get Tag by Slug

**GET** `/tags/:slug`

Get a specific tag with its usage count.

**Path Parameters:**
- `slug` (string, required) - Tag slug (lowercase, hyphens only)

**Example Request:**
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/news/tags/transformers
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Transformers",
    "slug": "transformers",
    "description": "Transformer architecture",
    "usageCount": 89,
    "createdAt": "2025-11-05T10:00:00.000Z"
  }
}
```

---

## Error Responses

### Validation Error (422)
```json
{
  "success": false,
  "error": {
    "message": "Validation failed: Category slug must contain only lowercase letters, numbers, and hyphens",
    "statusCode": 422,
    "stack": "..."
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": {
    "message": "Category with slug 'invalid-slug' not found",
    "statusCode": 404,
    "stack": "..."
  }
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "statusCode": 500,
    "stack": "..."
  }
}
```

---

## Caching

All endpoints are cached in Redis for performance:

| Endpoint | Cache Key | TTL |
|----------|-----------|-----|
| GET /categories | `news:categories:tree:active` | 1 hour |
| GET /categories/:slug | `news:categories:slug:{slug}` | 1 hour |
| GET /categories/with-counts | `news:categories:with-counts` | 1 hour |
| GET /tags | `news:tags:list:{params}` | 30 min |
| GET /tags/search | `news:tags:search:{query}` | 10 min |
| GET /tags/popular | `news:tags:popular:{limit}` | 30 min |
| GET /tags/:slug | `news:tags:slug:{slug}` | 30 min |

**Note:** All services gracefully fallback to database if Redis is unavailable.

---

## Rate Limiting

Default rate limits (can be configured per endpoint):
- Window: 15 minutes
- Max requests: 100 per window

---

## Testing

Run the test suite:
```bash
cd /home/neurmatic/nEURM/backend
./test-news-api.sh
```

Seed categories and tags:
```bash
npx ts-node -r tsconfig-paths/register src/prisma/seeds/news-categories-tags.seed.ts
```

---

## Integration Examples

### React/TypeScript Frontend

```typescript
// Fetch all categories
const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('http://vps-1a707765.vps.ovh.net:3000/api/v1/news/categories');
  const data = await response.json();
  return data.data;
};

// Tag autocomplete
const searchTags = async (query: string): Promise<Tag[]> => {
  const response = await fetch(
    `http://vps-1a707765.vps.ovh.net:3000/api/v1/news/tags/search?query=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  return data.data;
};
```

### cURL Examples

```bash
# Get all categories
curl -X GET http://vps-1a707765.vps.ovh.net:3000/api/v1/news/categories

# Get category by slug
curl -X GET http://vps-1a707765.vps.ovh.net:3000/api/v1/news/categories/llm-news

# Search tags
curl -X GET "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/tags/search?query=gpt"

# Get popular tags
curl -X GET "http://vps-1a707765.vps.ovh.net:3000/api/v1/news/tags/popular?limit=10"
```

---

**Last Updated:** November 5, 2025
**API Version:** v1
**Status:** Production Ready
