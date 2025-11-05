# Article Revision History System Implementation

**Task**: SPRINT-3-004 - Build article revision history system
**Status**: ✅ Complete
**Date**: November 5, 2025

## Overview

Implemented a comprehensive article revision history system that tracks and stores the last 20 versions of each article, with diff viewing and restore capability.

## Features Implemented

### 1. Automatic Revision Tracking
- ✅ Revisions automatically created on article create/update
- ✅ Only content changes (title, content, summary) trigger new revisions
- ✅ Automatic cleanup keeps only last 20 revisions per article
- ✅ Tracks author and timestamp for each revision
- ✅ Optional change summary field

### 2. API Endpoints

#### GET /api/v1/articles/:id/revisions
- List all revisions for an article
- Pagination support (limit, offset)
- Returns revision history with author information
- Access: Admin or article author only

#### GET /api/v1/articles/:id/revisions/:revisionId
- Get specific revision details
- Full snapshot of article at that revision
- Access: Admin or article author only

#### GET /api/v1/articles/:id/revisions/compare/:fromRevision/:toRevision
- Compare two revisions
- Returns word-level diff for title
- Returns sentence-level diff for content
- Returns word-level diff for summary
- Uses `diff` library for change highlighting
- Access: Admin or article author only

#### POST /api/v1/articles/:id/revisions/:revisionId/restore
- Restore article to a specific revision
- Creates new revision to track restore action
- Optional change summary
- Access: Admin or article author only

### 3. Authorization
- Admin users can view/restore all revisions
- Article authors can view/restore their own article revisions
- Revisions are read-only except for restore action
- Proper permission checks at service layer

## File Structure

```
backend/src/modules/news/
├── articleRevisions.repository.ts   # Database operations
├── articleRevisions.service.ts      # Business logic + diff generation
├── articleRevisions.controller.ts   # HTTP request handling
├── articleRevisions.routes.ts       # API routes
├── articleRevisions.validation.ts   # Zod validation schemas
└── articles.service.ts              # Updated with revision tracking
```

## Technical Details

### Database Schema
The `ArticleRevision` model in Prisma schema includes:
- `id` - UUID primary key
- `articleId` - Foreign key to article
- `revisionNumber` - Sequential number per article
- `title`, `content`, `summary` - Snapshot data
- `changedById` - User who made the change
- `changeSummary` - Optional description
- `createdAt` - Timestamp

Indexes:
- Unique constraint on `(articleId, revisionNumber)`
- Index on `(articleId, createdAt DESC)` for fast retrieval

### Diff Library
- Package: `diff` (npm package)
- Types: `@types/diff` (dev dependency)
- Functions used:
  - `diffWords()` - For title and summary
  - `diffSentences()` - For content

### Automatic Cleanup
- Keeps only last 20 revisions per article
- Cleanup runs automatically after creating new revision
- Deletes oldest revisions first
- Non-blocking (doesn't fail the main operation)

### Integration with Article Service
- `ArticleService` now injects `ArticleRevisionService`
- Revision created on article creation with "Initial version"
- Revision created on article update when content changes
- Revision creation is non-critical (doesn't block article operations)

## API Examples

### List Revisions
```bash
GET /api/v1/articles/abc-123/revisions?limit=10&offset=0
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "revisions": [
      {
        "id": "rev-123",
        "revisionNumber": 5,
        "title": "Updated Article Title",
        "changeSummary": "Fixed typos",
        "createdAt": "2025-11-05T10:30:00Z",
        "changedBy": {
          "id": "user-123",
          "username": "john_doe",
          "profile": {
            "displayName": "John Doe",
            "avatarUrl": "https://..."
          }
        }
      }
    ],
    "total": 5,
    "hasMore": false
  }
}
```

### Compare Revisions
```bash
GET /api/v1/articles/abc-123/revisions/compare/3/5
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "from": { /* revision 3 data */ },
    "to": { /* revision 5 data */ },
    "diff": {
      "title": [
        { "value": "Old", "removed": true },
        { "value": "New", "added": true },
        { "value": " Article Title", "count": 15 }
      ],
      "content": [ /* sentence-level diffs */ ],
      "summary": [ /* word-level diffs */ ]
    }
  }
}
```

### Restore Revision
```bash
POST /api/v1/articles/abc-123/revisions/rev-456/restore
Authorization: Bearer {token}
Content-Type: application/json

{
  "changeSummary": "Restored to version before error"
}

Response:
{
  "success": true,
  "data": { /* updated article */ },
  "message": "Article restored successfully"
}
```

## Rate Limiting
- Read operations: 30 requests/minute
- Restore operations: 10 requests/minute

## Error Handling
All errors properly captured with Sentry:
- NotFoundError - Article or revision not found
- ForbiddenError - User lacks permission
- BadRequestError - Invalid parameters
- ValidationError - Invalid input data

## Security
- All endpoints require authentication
- Authorization checks at service layer
- Zod validation on all inputs
- SQL injection protected by Prisma ORM
- Rate limiting on all endpoints

## Testing Recommendations

### Unit Tests
- Repository: CRUD operations, cleanup logic
- Service: Permission checks, diff generation, restore logic
- Controller: Request/response handling, validation

### Integration Tests
- Create article → verify revision created
- Update article → verify new revision created
- List revisions with pagination
- Compare revisions with valid data
- Restore revision and verify article updated
- Permission checks (admin vs author)

### Manual Testing Checklist
- [ ] Create article, check revision #1 exists
- [ ] Update article 5 times, check 5 revisions exist
- [ ] Update article 25 times, verify only 20 revisions kept
- [ ] List revisions with pagination
- [ ] Get specific revision by ID
- [ ] Compare two revisions, check diff output
- [ ] Restore to older revision as admin
- [ ] Try to restore another user's article (should fail)
- [ ] Verify revision created after restore

## Dependencies
- `diff` - Text diffing library
- `@types/diff` - TypeScript types (dev)
- `zod` - Validation (already installed)
- `@prisma/client` - Database ORM (already installed)

## Next Steps
1. Run database migration: `npx prisma migrate dev`
2. Generate Prisma client: `npx prisma generate`
3. Test API endpoints manually
4. Write comprehensive test suite
5. Add to frontend (SPRINT-3-005)

## Notes
- Revisions are immutable once created
- Restore action creates a new revision (audit trail)
- Cleanup is automatic and non-blocking
- Permission checks ensure data security
- Diff highlighting ready for frontend display
