# Models Module - Implementation Guide

## Overview

This module implements the **Model Tracker** feature for the Neurmatic platform, providing comprehensive backend APIs for tracking and managing 47+ LLM models (GPT-4, Claude, Llama, Gemini, etc.).

## Features Implemented

✅ **Database Schema**
- `llm_models` table with comprehensive model metadata
- `model_benchmarks` table for benchmark scores
- `model_follows` table for user follow functionality
- View count and follow count tracking
- API quickstart code snippets stored as JSON

✅ **API Endpoints**
- `GET /api/v1/models` - List all models with filtering
- `GET /api/v1/models/popular` - Get popular models
- `GET /api/v1/models/:slug` - Get model details
- `GET /api/v1/models/:slug/news` - Get related articles
- `GET /api/v1/models/:slug/discussions` - Get related forum topics
- `GET /api/v1/models/:slug/jobs` - Get related jobs
- `POST /api/v1/models/:slug/follow` - Follow/unfollow model (toggle)
- `GET /api/v1/models/:slug/follow-status` - Check follow status

✅ **Layered Architecture**
- `models.repository.ts` - Data access layer (Prisma queries)
- `models.service.ts` - Business logic layer
- `models.controller.ts` - Request handling layer
- `models.routes.ts` - Route definitions
- `models.validation.ts` - Zod validation schemas

✅ **Seed Data**
- 47 LLM models pre-configured with real data:
  - **OpenAI**: GPT-4 Turbo, GPT-4o, GPT-3.5 Turbo, etc.
  - **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Haiku, etc.
  - **Google**: Gemini 1.5 Pro, Gemini Flash, PaLM 2
  - **Meta**: Llama 3.2 (405B, 70B, 8B), CodeLlama
  - **Mistral AI**: Mistral Large, Mixtral 8x7B, Mistral 7B
  - **And 30+ more models** from Cohere, xAI, Amazon, Alibaba, Microsoft, etc.

## Database Migration Steps

### 1. Generate Prisma Client

```bash
cd /home/user/NEURM/backend
npx prisma generate
```

### 2. Create and Apply Migration

```bash
# Create migration
npx prisma migrate dev --name add_model_tracker_tables

# Or if database is already in sync, just push schema
npx prisma db push
```

### 3. Seed LLM Models

```bash
# Run the seed script
npx ts-node src/prisma/seeds/llm-models.seed.ts

# Or add to main seed file and run
npm run seed
```

## Database Schema

### llm_models Table

```prisma
model LLMModel {
  id            String        @id @default(uuid())
  name          String        @db.VarChar(100)
  slug          String        @unique @db.VarChar(100)
  provider      String        @db.VarChar(100)
  category      ModelCategory // commercial | open_source | specialized
  description   String?       @db.Text
  contextWindow Int?          @map("context_window")
  modelSize     String?       @map("model_size") @db.VarChar(50)
  modalities    String[]      // ["text", "image", "audio", "video"]
  releaseDate   DateTime?     @map("release_date") @db.Date
  latestVersion String?       @map("latest_version") @db.VarChar(50)
  status        String?       @db.VarChar(50)
  pricingInput  Decimal?      @map("pricing_input") @db.Decimal(10, 6)
  pricingOutput Decimal?      @map("pricing_output") @db.Decimal(10, 6)
  officialUrl   String?       @map("official_url") @db.VarChar(500)
  apiDocsUrl    String?       @map("api_docs_url") @db.VarChar(500)
  logoUrl       String?       @map("logo_url") @db.VarChar(500)
  bestFor       String[]      @map("best_for")
  notIdealFor   String[]      @map("not_ideal_for")
  benchmarks    Json?
  apiQuickstart Json?         @map("api_quickstart")
  articleCount  Int           @default(0) @map("article_count")
  jobCount      Int           @default(0) @map("job_count")
  viewCount     Int           @default(0) @map("view_count")
  followCount   Int           @default(0) @map("follow_count")
  createdAt     DateTime      @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt     DateTime      @updatedAt @map("updated_at") @db.Timestamptz(3)

  articles        ArticleModel[]
  userModels      UserModel[]
  jobs            JobModel[]
  modelBenchmarks ModelBenchmark[]
  modelFollows    ModelFollow[]
}
```

### model_benchmarks Table

```prisma
model ModelBenchmark {
  id            String   @id @default(uuid())
  modelId       String   @map("model_id")
  benchmarkName String   @map("benchmark_name") @db.VarChar(100)
  score         Decimal  @db.Decimal(10, 2)
  maxScore      Decimal? @map("max_score") @db.Decimal(10, 2)
  metric        String?  @db.VarChar(50)
  testDate      DateTime @map("test_date") @db.Date
  sourceUrl     String?  @map("source_url") @db.VarChar(500)
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  model LLMModel @relation(fields: [modelId], references: [id], onDelete: Cascade)

  @@unique([modelId, benchmarkName])
}
```

### model_follows Table

```prisma
model ModelFollow {
  modelId   String   @map("model_id")
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  model LLMModel @relation(fields: [modelId], references: [id], onDelete: Cascade)
  user  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([modelId, userId])
}
```

## API Examples

### Get All Models

```bash
GET /api/v1/models?page=1&limit=20&provider=OpenAI&sortBy=followCount&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "GPT-4 Turbo",
      "slug": "gpt-4-turbo",
      "provider": "OpenAI",
      "category": "commercial",
      "contextWindow": 128000,
      "viewCount": 15420,
      "followCount": 892,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

### Get Model Details

```bash
GET /api/v1/models/claude-3-5-sonnet
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Claude 3.5 Sonnet",
    "slug": "claude-3-5-sonnet",
    "provider": "Anthropic",
    "description": "Claude 3.5 Sonnet sets new industry benchmarks...",
    "contextWindow": 200000,
    "modalities": ["text", "image"],
    "pricingInput": 0.003,
    "pricingOutput": 0.015,
    "bestFor": ["Long documents", "Coding", "Complex analysis"],
    "apiQuickstart": {
      "python": "import anthropic\n...",
      "javascript": "import Anthropic from '@anthropic-ai/sdk';\n..."
    },
    "modelBenchmarks": [...],
    "_count": {
      "articles": 45,
      "jobs": 12,
      "modelFollows": 234
    }
  }
}
```

### Follow a Model

```bash
POST /api/v1/models/gpt-4-turbo/follow
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isFollowing": true
  },
  "message": "Model followed successfully"
}
```

### Get Related Articles

```bash
GET /api/v1/models/llama-3-2-405b/news?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Meta Releases Llama 3.2 405B...",
      "slug": "meta-releases-llama-3-2-405b",
      "summary": "...",
      "publishedAt": "2024-09-25T00:00:00.000Z",
      ...
    }
  ],
  "pagination": {...}
}
```

## Query Parameters

### List Models (`GET /api/v1/models`)

| Parameter   | Type   | Default | Description                                    |
|-------------|--------|---------|------------------------------------------------|
| page        | number | 1       | Page number                                    |
| limit       | number | 20      | Items per page (max 100)                       |
| provider    | string | -       | Filter by provider (e.g., "OpenAI")            |
| category    | enum   | -       | commercial, open_source, specialized           |
| status      | string | -       | Filter by status (e.g., "active")              |
| search      | string | -       | Search in name, description, provider          |
| sortBy      | enum   | name    | name, provider, releaseDate, viewCount, etc.   |
| sortOrder   | enum   | asc     | asc or desc                                    |

### Related Content

All related content endpoints (`/news`, `/discussions`, `/jobs`) accept:
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 50)

## Security & Authentication

- **Public routes**: All GET endpoints for listing and viewing models
- **Protected routes**:
  - `POST /api/v1/models/:slug/follow` (requires authentication)
  - `GET /api/v1/models/:slug/follow-status` (requires authentication)

Authentication is handled via JWT tokens in the `Authorization: Bearer <token>` header.

## Error Handling

All endpoints follow consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message here",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Sentry Integration

All operations are instrumented with Sentry for error tracking:

```typescript
Sentry.captureException(error, {
  tags: {
    repository: 'ModelRepository',
    method: 'findBySlug'
  },
  extra: { slug }
});
```

## Testing

### Manual Testing

```bash
# Health check
curl http://vps-1a707765.vps.ovh.net:3000/health

# Get all models
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/models

# Get specific model
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/models/gpt-4-turbo

# Get model news
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/models/claude-3-5-sonnet/news

# Follow model (requires auth)
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/models/gpt-4-turbo/follow \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Automated Tests (TODO)

Create tests in `/home/user/NEURM/backend/src/modules/models/__tests__/`:
- `models.repository.test.ts`
- `models.service.test.ts`
- `models.controller.test.ts`

## Performance Considerations

1. **Caching**: Consider adding Redis caching for:
   - Popular models list
   - Model details (TTL: 1 hour)
   - Related content (TTL: 15 minutes)

2. **Indexing**: Database indexes are already configured:
   - `slug` (unique)
   - `provider`
   - `category`
   - `status`
   - `viewCount` (descending)
   - `followCount` (descending)

3. **Pagination**: All list endpoints support pagination to handle large datasets efficiently.

4. **View Counting**: View count increment is non-blocking and won't fail the main request.

## Future Enhancements

- [ ] Add model comparison endpoint (`POST /api/v1/models/compare`)
- [ ] Implement benchmark visualization endpoint
- [ ] Add model recommendation algorithm
- [ ] Create admin endpoints for model management
- [ ] Add model versioning support
- [ ] Implement advanced search with filters
- [ ] Add model popularity trending algorithm
- [ ] Create notification system for new model releases

## Dependencies

- `@prisma/client` - Database ORM
- `zod` - Validation
- `express` - Web framework
- `@sentry/node` - Error tracking

## File Structure

```
/home/user/NEURM/backend/src/modules/models/
├── models.repository.ts    # Data access layer
├── models.service.ts       # Business logic
├── models.controller.ts    # Request handlers
├── models.routes.ts        # Route definitions
├── models.validation.ts    # Zod schemas
└── README.md              # This file

/home/user/NEURM/backend/src/prisma/seeds/
└── llm-models.seed.ts     # Seed data for 47 models
```

## Acceptance Criteria Status

✅ All acceptance criteria met:

1. ✅ llm_models table with 47+ models
2. ✅ Each model has: name, slug, provider, description, specs, pricing, status
3. ✅ GET /api/models returns all LLM models
4. ✅ GET /api/models/:slug returns model details
5. ✅ GET /api/models/:slug/news returns related articles
6. ✅ GET /api/models/:slug/discussions returns forum topics
7. ✅ GET /api/models/:slug/jobs returns related jobs
8. ✅ Model specs: context_window, size, modalities, release_date
9. ✅ Benchmark scores stored and ready to display
10. ✅ API quickstart code snippets per model
11. ✅ Follow/unfollow models functionality
12. ✅ Model popularity tracking (views, follows)

## Support

For issues or questions, contact the development team or check the main project documentation at `/home/user/NEURM/CLAUDE.md`.
