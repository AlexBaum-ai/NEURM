# Universal Search Module

**Sprint**: 10
**Task**: SPRINT-10-001
**Status**: Completed

## Overview

The Universal Search module provides a comprehensive search system across all content types in the Neurmatic platform:
- Articles
- Forum Topics
- Forum Replies
- Jobs
- Users
- Companies

## Features

### 1. Universal Search
- **Endpoint**: `GET /api/v1/search`
- **Query Parameters**:
  - `q` (required): Search query (max 500 characters)
  - `type` (optional): Comma-separated content types to search (e.g., `articles,jobs`)
  - `sort` (optional): Sort order - `relevance` (default), `date`, or `popularity`
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Results per page (default: 20, max: 50)
- **Response**:
  - Results array with highlights
  - Pagination metadata
  - Execution time
  - Total count

### 2. Autocomplete
- **Endpoint**: `GET /api/v1/search/suggest`
- **Query Parameters**:
  - `q` (required): Search query (min 2 characters)
- **Response**: Array of suggestions with counts

### 3. Search History
- **Endpoint**: `GET /api/v1/search/history` (requires authentication)
- **Response**: Last 10 searches for the authenticated user

### 4. Saved Searches
- **Create**: `POST /api/v1/search/saved` (requires authentication)
  - Body: `{ name, query, contentTypes?, sortBy?, notificationEnabled? }`
- **List**: `GET /api/v1/search/saved` (requires authentication)
- **Delete**: `DELETE /api/v1/search/saved/:searchId` (requires authentication)

### 5. Popular Searches
- **Endpoint**: `GET /api/v1/search/popular`
- **Response**: Top 10 most searched queries from the last 7 days

## Architecture

### Layered Structure
```
Routes → Controller → Service → Repository → Database
```

### Files
- `search.routes.ts` - Route definitions
- `search.controller.ts` - Request handling
- `search.service.ts` - Business logic
- `search.repository.ts` - Data access
- `search.validator.ts` - Zod validation schemas
- `types/search.types.ts` - TypeScript types

### Database Tables
- `search_queries` - Tracks all search queries for analytics
- `search_history` - User search history (last 10 per user)
- `saved_searches` - User-saved searches with optional notifications

## Search Implementation

### PostgreSQL Full-Text Search
- Uses `to_tsvector` and `to_tsquery` for full-text search
- Trigram similarity (`pg_trgm`) for fuzzy matching and autocomplete
- Custom relevance scoring with title boosting

### Relevance Boosting
- **Articles**: Title 3x, content 1x
- **Forum Topics**: Title 2x, content 1x
- **Jobs**: Title 2x, description + requirements 1x

### Performance Optimizations
- GIN indexes on full-text search vectors
- Trigram indexes for autocomplete
- Parallel searches across content types
- Execution time tracking (target: <500ms)

## Advanced Search Syntax (Future)
The validator includes support for advanced search features:
- Exact phrase matching: `"GPT-4 Turbo"`
- Term exclusion: `-spam`
- Author filtering: `author:username`
- Date range filtering
- Tag filtering
- Category filtering

## Usage Examples

### Basic Search
```bash
GET /api/v1/search?q=GPT-4
```

### Filtered Search
```bash
GET /api/v1/search?q=machine%20learning&type=articles,jobs&sort=date
```

### Autocomplete
```bash
GET /api/v1/search/suggest?q=GPT
```

### Save Search
```bash
POST /api/v1/search/saved
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "AI Jobs",
  "query": "artificial intelligence",
  "contentTypes": ["jobs"],
  "notificationEnabled": true
}
```

## Testing

### Unit Tests
```bash
npm test search.service.test.ts
```

### Integration Tests
```bash
npm test search.integration.test.ts
```

## Performance Metrics

- **Target**: <500ms for typical queries
- **Pagination**: 20 results per page
- **Max query length**: 500 characters
- **Max results per request**: 50

## Security

- Rate limiting applied via middleware
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries
- Optional authentication for personalized features
- Sentry error tracking integrated

## Future Enhancements

1. **Elasticsearch Migration**: For better performance at scale
2. **Advanced Filters**: Implement full advanced search syntax
3. **Search Analytics**: Dashboard for popular searches and trends
4. **Machine Learning**: Personalized search ranking
5. **Voice Search**: Integration with Web Speech API
6. **Search Feedback**: Allow users to rate search result relevance

## Dependencies

- PostgreSQL 15+ with `pg_trgm` extension
- Prisma ORM
- Zod for validation
- Sentry for error tracking

## Related Documentation

- [API Endpoints](../../../projectdoc/03-API_ENDPOINTS.md)
- [Database Schema](../../../projectdoc/02-DATABASE_SCHEMA.md)
- [Backend Guidelines](.claude/skills/backend-dev-guidelines/)
