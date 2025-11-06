# Glossary Module Testing Checklist

## Pre-Testing Setup

- [ ] Run Prisma migration: `npx prisma migrate deploy`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Restart backend server: `npm run dev`
- [ ] Verify server starts without errors
- [ ] Check logs for glossary routes registration

## Database Verification

- [ ] Verify `glossary_terms` table exists
- [ ] Verify columns: id, slug, term, definition, examples, category, related_terms, view_count, created_at, updated_at
- [ ] Verify indexes on: slug, term, category, view_count
- [ ] Verify constraints: slug unique, term unique

```sql
-- Verify table structure
\d glossary_terms

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'glossary_terms';
```

## Public Endpoints Testing

### 1. GET /api/v1/glossary

**Test Cases:**

- [ ] Default query (page 1, limit 50)
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary
```

- [ ] Pagination
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary?page=2&limit=10"
```

- [ ] Category filtering
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary?category=Models"
```

- [ ] Letter filtering
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary?letter=A"
```

- [ ] Sorting by view count
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary?sortBy=viewCount&sortOrder=desc"
```

- [ ] Combined filters
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary?category=Techniques&letter=R&sortBy=viewCount&sortOrder=desc"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### 2. GET /api/v1/glossary/search

**Test Cases:**

- [ ] Basic search
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/search?q=transformer"
```

- [ ] Search with category filter
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/search?q=gpt&category=Models"
```

- [ ] Search with pagination
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/search?q=learning&page=1&limit=5"
```

- [ ] Case-insensitive search
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/search?q=RAG"
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/search?q=rag"
# Both should return same results
```

- [ ] Empty query handling (should return 400)
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/search?q="
```

### 3. GET /api/v1/glossary/:slug

**Test Cases:**

- [ ] Get existing term
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/rag
```

- [ ] View count increments (call twice, check viewCount)
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/rag
# Note the viewCount
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/rag
# viewCount should be incremented by 1
```

- [ ] Non-existent term (should return 404)
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/nonexistent-term
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "rag",
    "term": "RAG",
    "definition": "...",
    "examples": "...",
    "category": "Techniques",
    "relatedTerms": ["Vector Database", "Embeddings"],
    "viewCount": 1,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 4. GET /api/v1/glossary/popular

**Test Cases:**

- [ ] Default limit (10)
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/popular
```

- [ ] Custom limit
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/popular?limit=5"
```

- [ ] Verify results sorted by viewCount descending

### 5. GET /api/v1/glossary/categories

**Test Cases:**

- [ ] Get all categories with counts
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/categories
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    { "category": "Concepts", "count": 10 },
    { "category": "Metrics", "count": 5 },
    { "category": "Models", "count": 15 },
    { "category": "Techniques", "count": 8 },
    { "category": "Tools", "count": 7 }
  ]
}
```

### 6. GET /api/v1/glossary/index

**Test Cases:**

- [ ] Get alphabetical index
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/index
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    { "letter": "A", "count": 5 },
    { "letter": "B", "count": 3 },
    { "letter": "C", "count": 7 },
    ...
  ]
}
```

## Admin Endpoints Testing

### Setup
1. Login as admin user to get JWT token
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

2. Save the token from response
```bash
export TOKEN="<your-jwt-token>"
```

### 7. POST /api/v1/glossary (Create)

**Test Cases:**

- [ ] Create term with all fields
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "term": "RAG",
    "definition": "Retrieval Augmented Generation combines information retrieval with text generation to produce more accurate and grounded responses.",
    "examples": "## Example\n\n```python\nfrom langchain import RAG\n\nrag = RAG(vectorstore=vs, llm=llm)\nresult = rag.query(\"What is ML?\")\n```",
    "category": "Techniques",
    "relatedTerms": ["Vector Database", "Embeddings", "Semantic Search"]
  }'
```

- [ ] Create term without optional fields
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "term": "Perplexity",
    "definition": "A measurement of how well a probability model predicts a sample.",
    "category": "Metrics"
  }'
```

- [ ] Duplicate term (should return 400)
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "term": "RAG",
    "definition": "Duplicate definition",
    "category": "Techniques"
  }'
```

- [ ] Invalid category (should return 400)
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "term": "Test",
    "definition": "Test definition",
    "category": "InvalidCategory"
  }'
```

- [ ] Missing required fields (should return 400)
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "term": "Test"
  }'
```

- [ ] Without auth token (should return 401)
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary \
  -H "Content-Type: application/json" \
  -d '{
    "term": "Test",
    "definition": "Test definition",
    "category": "Concepts"
  }'
```

### 8. PUT /api/v1/glossary/:id (Update)

**Test Cases:**

- [ ] Update definition only
```bash
curl -X PUT http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/<term-id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "Updated definition with more details..."
  }'
```

- [ ] Update multiple fields
```bash
curl -X PUT http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/<term-id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "Updated definition",
    "examples": "Updated examples",
    "relatedTerms": ["Term1", "Term2", "Term3"]
  }'
```

- [ ] Update term name (slug should change)
```bash
curl -X PUT http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/<term-id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "term": "RAG (Updated)"
  }'
# Verify slug changed from "rag" to "rag-updated"
```

- [ ] Non-existent ID (should return 404)
```bash
curl -X PUT http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "Test"
  }'
```

- [ ] Without auth token (should return 401)
```bash
curl -X PUT http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/<term-id> \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "Test"
  }'
```

### 9. DELETE /api/v1/glossary/:id (Delete)

**Test Cases:**

- [ ] Delete existing term
```bash
curl -X DELETE http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/<term-id> \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Verify term is deleted (should return 404)
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/<deleted-slug>
```

- [ ] Delete non-existent term (should return 404)
```bash
curl -X DELETE http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Without auth token (should return 401)
```bash
curl -X DELETE http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/<term-id>
```

## Error Handling Tests

- [ ] Invalid UUID format (should return 400)
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary/invalid-uuid
```

- [ ] Invalid query parameters (should return 400)
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary?page=0"
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary?limit=200"
```

- [ ] Invalid category (should return 400)
```bash
curl "http://vps-1a707765.vps.ovh.net:3000/api/v1/glossary?category=InvalidCategory"
```

## Performance Tests

- [ ] View count update doesn't block response
  - Access a term and measure response time
  - Response should be fast (<100ms) even with view count update

- [ ] Search with pagination performs well
  - Run search with various page numbers
  - Response time should be consistent

- [ ] Large result sets
  - Test with 100+ glossary terms
  - Verify pagination works correctly
  - Check memory usage

## Integration Tests

- [ ] Create term → Retrieve by slug → Verify data
- [ ] Create term → Search for it → Verify in results
- [ ] Create term → Check categories endpoint → Verify count incremented
- [ ] Create term with letter "Z" → Check index endpoint → Verify "Z" appears
- [ ] Create term → Update it → Retrieve → Verify changes
- [ ] Create term → Delete it → Retrieve → Verify 404
- [ ] Access term multiple times → Check popular endpoint → Verify high viewCount

## Sentry Integration

- [ ] Verify errors are sent to Sentry
  - Trigger an error (e.g., invalid database query)
  - Check Sentry dashboard for logged error
  - Verify context includes controller/method tags

## Logging

- [ ] Check logs for:
  - [ ] Term creation logged
  - [ ] Term update logged
  - [ ] Term deletion logged
  - [ ] Search queries logged
  - [ ] View count increment warnings (if any)

## Frontend Integration Readiness

- [ ] API returns CORS headers
- [ ] Response format consistent across endpoints
- [ ] Error messages are user-friendly
- [ ] Pagination metadata is complete
- [ ] Related terms array is populated
- [ ] Examples field supports markdown
- [ ] View count visible in responses

## Checklist Summary

Public Endpoints: 6 endpoints
Admin Endpoints: 3 endpoints
Total Test Cases: ~50+

**Pass Criteria:**
- All public endpoints return 200 for valid requests
- All admin endpoints require authentication
- Admin endpoints return 401/403 without proper auth
- View count increments correctly
- Search returns relevant results
- Categories and index endpoints return correct aggregations
- CRUD operations work as expected
- Error handling returns appropriate status codes
- Sentry integration captures errors

**Ready for Production:** ✅ / ❌
