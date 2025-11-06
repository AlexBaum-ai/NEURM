# Glossary Module

LLM terminology glossary with search, categorization, and alphabetical navigation.

## Overview

The Glossary module provides a comprehensive database of LLM-related terms, definitions, examples, and related concepts. It supports full-text search, category filtering, alphabetical navigation, and tracks term popularity via view counts.

## Features

- ✅ Complete CRUD operations for glossary terms (admin only)
- ✅ Full-text search on term, definition, and examples
- ✅ Category-based filtering (Models, Techniques, Metrics, Tools, Concepts)
- ✅ Alphabetical navigation (A-Z with counts)
- ✅ Related terms linking
- ✅ View count tracking for popular terms
- ✅ Code examples and use cases support
- ✅ Automatic slug generation from term names

## Database Schema

```prisma
model GlossaryTerm {
  id           String   @id @default(uuid())
  slug         String   @unique
  term         String   @unique
  definition   String
  examples     String?
  category     String
  relatedTerms String[]
  viewCount    Int      @default(0)
  createdAt    DateTime
  updatedAt    DateTime
}
```

## API Endpoints

### Public Endpoints

#### GET /api/v1/glossary
Get all glossary terms with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50, max: 100) - Items per page
- `category` (string, optional) - Filter by category (Models, Techniques, Metrics, Tools, Concepts)
- `letter` (string, optional) - Filter by first letter (A-Z)
- `sortBy` (string, default: 'term') - Sort field (term, category, viewCount, createdAt)
- `sortOrder` (string, default: 'asc') - Sort order (asc, desc)

**Example:**
```bash
GET /api/v1/glossary?category=Models&sortBy=viewCount&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "rag",
      "term": "RAG",
      "definition": "Retrieval Augmented Generation...",
      "examples": "Example code...",
      "category": "Techniques",
      "relatedTerms": ["Vector Database", "Embeddings"],
      "viewCount": 1523,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### GET /api/v1/glossary/search
Search glossary terms by keyword.

**Query Parameters:**
- `q` (string, required) - Search query (min 1 char, max 100)
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 50) - Items per page
- `category` (string, optional) - Filter by category

**Example:**
```bash
GET /api/v1/glossary/search?q=transformer&category=Models
```

#### GET /api/v1/glossary/:slug
Get glossary term details by slug. Increments view count.

**Example:**
```bash
GET /api/v1/glossary/rag
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "rag",
    "term": "RAG",
    "definition": "Retrieval Augmented Generation is a technique...",
    "examples": "```python\n# RAG example\n...\n```",
    "category": "Techniques",
    "relatedTerms": ["Vector Database", "Embeddings", "Semantic Search"],
    "viewCount": 1524,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/v1/glossary/popular
Get popular glossary terms by view count.

**Query Parameters:**
- `limit` (number, default: 10) - Number of terms to return

**Example:**
```bash
GET /api/v1/glossary/popular?limit=5
```

#### GET /api/v1/glossary/categories
Get all categories with term counts.

**Response:**
```json
{
  "success": true,
  "data": [
    { "category": "Models", "count": 47 },
    { "category": "Techniques", "count": 35 },
    { "category": "Metrics", "count": 22 },
    { "category": "Tools", "count": 18 },
    { "category": "Concepts", "count": 42 }
  ]
}
```

#### GET /api/v1/glossary/index
Get alphabetical index (A-Z) with term counts for each letter.

**Response:**
```json
{
  "success": true,
  "data": [
    { "letter": "A", "count": 12 },
    { "letter": "B", "count": 8 },
    { "letter": "C", "count": 15 },
    ...
  ]
}
```

### Admin Endpoints

All admin endpoints require authentication and admin role.

#### POST /api/v1/glossary
Create a new glossary term.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "term": "RAG",
  "definition": "Retrieval Augmented Generation is a technique that combines...",
  "examples": "```python\n# RAG implementation example\n...\n```",
  "category": "Techniques",
  "relatedTerms": ["Vector Database", "Embeddings"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "rag",
    "term": "RAG",
    ...
  },
  "message": "Glossary term created successfully"
}
```

#### PUT /api/v1/glossary/:id
Update an existing glossary term.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body (all fields optional):**
```json
{
  "term": "RAG (Updated)",
  "definition": "Updated definition...",
  "examples": "Updated examples...",
  "category": "Techniques",
  "relatedTerms": ["Vector Database", "Embeddings", "Semantic Search"]
}
```

#### DELETE /api/v1/glossary/:id
Delete a glossary term.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Glossary term deleted successfully"
}
```

## Categories

The glossary supports five predefined categories:

1. **Models** - LLM models (GPT-4, Claude, LLaMA, etc.)
2. **Techniques** - Training and inference techniques (RAG, Fine-tuning, Prompt Engineering, etc.)
3. **Metrics** - Evaluation metrics (BLEU, ROUGE, Perplexity, etc.)
4. **Tools** - Development tools and frameworks (LangChain, LlamaIndex, etc.)
5. **Concepts** - Core concepts (Embeddings, Tokens, Context Window, etc.)

## Related Terms

Each glossary term can link to other related terms using their exact term names. The frontend can use these to create navigation links between related concepts.

**Example:**
- Term: "RAG"
- Related Terms: ["Vector Database", "Embeddings", "Semantic Search"]

## Examples Field

The `examples` field supports markdown and code blocks for providing practical examples:

```markdown
## Example Implementation

```python
from langchain import RAG

# Initialize RAG pipeline
rag = RAG(vectorstore=vectorstore, llm=llm)

# Query
result = rag.query("What is machine learning?")
```

## Usage in Different Contexts

1. Question answering systems
2. Document search and retrieval
3. Knowledge-grounded generation
```

## View Count Tracking

View counts are automatically incremented when users access term details via `GET /api/v1/glossary/:slug`. This data is used for:
- Popular terms widget
- Trending terms analytics
- Usage statistics

## Error Handling

The module uses standard error responses:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

Common error codes:
- `400` - Bad Request (validation errors, duplicate terms)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (term doesn't exist)
- `500` - Internal Server Error

## Architecture

The module follows a layered architecture:

```
Routes (glossary.routes.ts)
    ↓
Controller (glossary.controller.ts)
    ↓
Service (glossary.service.ts)
    ↓
Repository (glossary.repository.ts)
    ↓
Database (Prisma)
```

## Testing

Unit tests should cover:
- ✅ CRUD operations
- ✅ Search functionality
- ✅ Category filtering
- ✅ Alphabetical navigation
- ✅ View count increments
- ✅ Related terms linking
- ✅ Slug generation
- ✅ Admin-only access control

## Future Enhancements

- [ ] Add glossary term versioning (track definition changes)
- [ ] Implement term suggestions based on user queries
- [ ] Add user contributions (suggest new terms, vote on definitions)
- [ ] Create glossary term of the day feature
- [ ] Add multilingual support for definitions
- [ ] Implement glossary term relationships graph visualization
- [ ] Add glossary term bookmarking for authenticated users

## Integration Points

### Frontend Integration

The glossary can be integrated into:
1. **Article pages** - Link technical terms to glossary definitions
2. **Forum posts** - Auto-link mentioned terms
3. **Job descriptions** - Highlight required technical knowledge
4. **Model pages** - Link model-specific terminology

### Search Integration

The glossary search results are included in the universal search endpoint (`/api/v1/search`).

## Performance Considerations

- Alphabetical index is computed on-demand (consider caching for large datasets)
- View count updates are non-blocking and don't affect response time
- Full-text search uses case-insensitive LIKE queries (consider PostgreSQL full-text search for better performance)
- Category counts are aggregated using Prisma groupBy (efficient for <10k terms)

## Migration

To apply the schema changes:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add-glossary-fields
```

This adds:
- `slug` field (unique, indexed)
- `examples` field (text, optional)
- `viewCount` field (integer, default 0, indexed descending)

## Seeding

Sample glossary data can be seeded using:

```bash
cd backend
npx prisma db seed
```

Consider adding common LLM terms like:
- GPT, Claude, LLaMA, Mistral (Models)
- RAG, Fine-tuning, Prompt Engineering, Few-shot Learning (Techniques)
- BLEU, ROUGE, Perplexity, F1 Score (Metrics)
- LangChain, LlamaIndex, Hugging Face, OpenAI API (Tools)
- Embeddings, Tokens, Context Window, Temperature (Concepts)

## Notes

- Slug generation is automatic and based on term name
- Term names must be unique
- All admin operations are logged to Sentry
- View count increments are fire-and-forget (don't block requests)
- Search prioritizes exact term matches over partial matches
