# Forum Module - Backend Implementation

## Overview

This module implements the backend API for the Neurmatic forum system, starting with the category management system (SPRINT-4-001).

## Implemented Features (SPRINT-4-001)

### ✅ Hierarchical Category System
- **2-level hierarchy**: Main categories and subcategories
- **Automatic level calculation**: Prevents creation of categories beyond max depth
- **Parent-child relationships**: Bidirectional navigation
- **Validation**: Prevents circular references and invalid parent assignments

### ✅ Category Management API
All endpoints include:
- Input validation with Zod schemas
- Rate limiting
- Authentication and authorization
- Error tracking with Sentry
- Comprehensive error messages

#### Public Endpoints
- `GET /api/forum/categories` - Get category tree with hierarchy
- `GET /api/forum/categories/:slug` - Get single category by slug
- `GET /api/forum/categories/:id/moderators` - Get category moderators

#### Admin Endpoints (Authentication Required)
- `POST /api/forum/categories` - Create new category
- `PUT /api/forum/categories/:id` - Update category
- `DELETE /api/forum/categories/:id` - Soft delete category
- `PUT /api/forum/categories/reorder` - Reorder categories
- `POST /api/forum/categories/:id/moderators` - Assign moderator
- `DELETE /api/forum/categories/:id/moderators/:userId` - Remove moderator

### ✅ Category Features
- **Name & Slug**: URL-friendly identifiers
- **Description**: Category summary
- **Icon**: Emoji or icon identifier
- **Guidelines**: Posting guidelines and rules
- **Visibility**: `public`, `private`, or `moderator_only`
- **Display Order**: Customizable ordering
- **Status**: Active/inactive flag
- **Statistics**: Topic count, reply count, last activity timestamp

### ✅ Moderator Assignment
- Many-to-many relationship between categories and users
- Assign/remove moderators per category
- Query category moderators
- Check if user can moderate category

### ✅ Database Schema
**Tables Created:**
- `forum_categories` - Main category table
- `category_moderators` - Category-moderator junction table

**Enums Created:**
- `CategoryVisibility` - public, private, moderator_only

**Indexes:**
- Slug (unique)
- Parent ID
- Active status
- Visibility
- Parent ID + Display Order (composite)

### ✅ Seed Data
12 predefined categories:
1. General Discussion
2. Getting Started (with Tutorials subcategory)
3. Prompt Engineering
4. Development & Integration (with RAG & Vector DBs, Fine-tuning subcategories)
5. Model-Specific (with OpenAI Models subcategory)
6. Use Cases & Applications
7. Research & Papers
8. Community Showcase

## Architecture

### Layered Architecture
```
Routes → Controllers → Services → Repositories → Database
```

1. **Routes** (`routes/categoryRoutes.ts`)
   - Define HTTP endpoints
   - Apply middleware (auth, rate limiting)
   - Mount controller methods

2. **Controllers** (`controllers/ForumCategoryController.ts`)
   - Extend BaseController
   - Handle HTTP requests/responses
   - Validate input with Zod
   - Call service methods
   - Format responses

3. **Services** (`services/forumCategoryService.ts`)
   - Business logic layer
   - Validation and authorization
   - Error handling
   - Sentry tracking

4. **Repositories** (`repositories/ForumCategoryRepository.ts`)
   - Data access layer
   - Prisma queries
   - Database transactions

### Dependency Injection
Uses `tsyringe` for dependency injection:
- `forum.container.ts` - Registers all dependencies
- Enables testability and loose coupling

## File Structure

```
backend/src/modules/forum/
├── controllers/
│   └── ForumCategoryController.ts
├── services/
│   └── forumCategoryService.ts
├── repositories/
│   └── ForumCategoryRepository.ts
├── routes/
│   ├── index.ts
│   └── categoryRoutes.ts
├── validators/
│   └── categoryValidators.ts
├── forum.container.ts
├── index.ts
└── README.md

backend/src/prisma/
├── seeds/
│   └── forumCategories.seed.ts
├── seed.ts
└── schema.prisma (updated)
```

## Database Migrations

**Migration Created:**
```bash
npx prisma migrate dev --name add_forum_category_features
```

**Schema Changes:**
- Added `guidelines`, `visibility`, `lastActivityAt` to `ForumCategory`
- Added `CategoryVisibility` enum
- Created `CategoryModerator` table
- Added moderator relation to User model

## Seeding

**Run seed:**
```bash
npm run seed
# or
npx prisma db seed
```

**Seed includes:**
- 12 forum categories
- Hierarchical structure
- Complete metadata (descriptions, icons, guidelines)

## API Examples

### Get Category Tree
```bash
GET /api/forum/categories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "General Discussion",
        "slug": "general-discussion",
        "description": "General conversations about LLMs",
        "icon": "💬",
        "level": 1,
        "displayOrder": 0,
        "guidelines": "...",
        "visibility": "public",
        "topicCount": 0,
        "replyCount": 0,
        "children": [],
        "moderators": []
      }
    ],
    "count": 12
  }
}
```

### Create Category
```bash
POST /api/forum/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "AI Safety",
  "slug": "ai-safety",
  "description": "Discuss AI safety and alignment",
  "icon": "🛡️",
  "guidelines": "Focus on technical safety research",
  "visibility": "public",
  "displayOrder": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": { ... }
  }
}
```

### Assign Moderator
```bash
POST /api/forum/categories/:categoryId/moderators
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-uuid"
}
```

## Rate Limiting

- **Public reads**: 60 requests/minute
- **Admin writes**: 20 requests/minute
- **Category creation**: 10 requests/hour

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

**Validation errors** (422):
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "errors": [
      {
        "field": "name",
        "message": "Category name must be at least 2 characters"
      }
    ]
  }
}
```

## Security

- **Authentication**: JWT tokens via `authenticate` middleware
- **Authorization**: Role-based (`requireAdmin`, `requireModerator`)
- **Input validation**: Zod schemas on all inputs
- **Rate limiting**: Prevents abuse
- **Soft deletes**: Preserve data integrity
- **Sentry tracking**: All errors logged

## Testing

### Manual Testing with cURL

**Get categories:**
```bash
curl http://localhost:3000/api/forum/categories
```

**Create category (requires admin token):**
```bash
curl -X POST http://localhost:3000/api/forum/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "slug": "test-category",
    "description": "Test description"
  }'
```

### Unit Testing
TODO: Add unit tests for services and repositories

### Integration Testing
TODO: Add integration tests for API endpoints

## Integration with Main App

**In your main app.ts or routes/index.ts:**

```typescript
import forumRoutes from '@/modules/forum/routes';
import { registerForumDependencies } from '@/modules/forum';
import prisma from '@/config/database';

// Register forum dependencies
registerForumDependencies(prisma);

// Mount forum routes
app.use('/api/forum', forumRoutes);
```

## Implemented Features (SPRINT-4-003) ✅

### ✅ Forum Topics System
- **Topic CRUD operations**: Create, read, update, delete (soft delete)
- **Multiple topic types**: question, discussion, showcase, tutorial, announcement, paper
- **Rich content support**: Markdown, attachments (max 5, 5MB each), tags (max 5)
- **Draft functionality**: Save topics as drafts before publishing
- **Poll integration**: Optional poll creation with topics
- **Spam detection**: Keyword-based filtering with severity scoring
- **Link previews**: Automatic URL preview generation (placeholder)
- **Rate limiting**: 10 topics/hour creation, 30/hour updates
- **Authorization**: Role-based access (author, moderator, admin)

### ✅ Topic Endpoints
- `GET /api/forum/topics` - List topics with filters and pagination
- `POST /api/forum/topics` - Create new topic
- `GET /api/forum/topics/:id` - Get single topic with details
- `PUT /api/forum/topics/:id` - Update topic (author or mod)
- `DELETE /api/forum/topics/:id` - Soft delete topic (author or mod)
- `POST /api/forum/topics/:id/pin` - Pin/unpin topic (moderator)
- `POST /api/forum/topics/:id/lock` - Lock/unlock topic (moderator)

### ✅ Database Schema
**Tables Created:**
- `topic_attachments` - Image attachments for topics
- `spam_keywords` - Spam detection keywords

**Topic Model Enhanced:**
- Added `isDraft`, `isFlagged`, `pollId` fields
- Added 3 new topic types: tutorial, announcement, paper
- Added 5 new indexes for performance

**Seed Data:**
- 26 spam keywords across 3 severity levels

## Implemented Features (SPRINT-4-006) ✅

### ✅ Threaded Reply System
- **Max 3 levels of threading**: Topic → Reply → Reply → Reply
- **Nested reply structure**: Recursive tree with parent-child relationships
- **Depth validation**: Automatic depth calculation and enforcement
- **Soft deletes**: Preserve reply structure while hiding deleted content

### ✅ Reply Management API
All endpoints include:
- Input validation with Zod schemas
- Rate limiting (30 replies/hour per user)
- Authentication and authorization
- Error tracking with Sentry
- Comprehensive error messages

#### Public Endpoints
- `GET /api/forum/topics/:topicId/replies` - Get nested reply tree with sorting
- `GET /api/forum/replies/:id` - Get single reply with details

#### Authenticated Endpoints
- `POST /api/forum/topics/:topicId/replies` - Create reply (with threading)
- `PUT /api/forum/replies/:id` - Update reply (author within 15 min or mod)
- `DELETE /api/forum/replies/:id` - Soft delete reply (author or mod)
- `POST /api/forum/topics/:topicId/accept-answer` - Mark accepted answer (question topics)
- `DELETE /api/forum/topics/:topicId/accept-answer` - Remove accepted answer

#### Moderator Endpoints
- `GET /api/forum/replies/:id/edit-history` - View edit history

### ✅ Reply Features
- **Threading**: Max 3 levels (parent_reply_id, depth field)
- **Quote functionality**: Reference any reply with quotedReplyId
- **@mentions**: Automatic extraction and notification triggers
- **Rich text content**: Markdown support (10-10,000 characters)
- **Edit restrictions**: Authors can edit within 15 minutes, moderators anytime
- **Edit history**: Track all changes with reasons (visible to moderators)
- **Soft deletes**: Mark as deleted, replace content with "[Deleted]"
- **Accepted answers**: Topic authors can mark answers on question topics
- **Reply count updates**: Automatic topic reply count management
- **Sort options**: oldest, newest, most_voted

### ✅ Database Schema Enhancements
**Columns Added to `replies` table:**
- `quoted_reply_id` - Reference to quoted reply
- `mentions` - Array of @mentioned usernames
- `is_deleted` - Soft delete flag
- `deleted_at` - Soft delete timestamp
- `edited_at` - Last edit timestamp

**New Table: `reply_edit_history`**
- Tracks all reply edits
- Stores previous content
- Records edit reason
- Visible to moderators only

**New Indexes:**
- `quoted_reply_id` - Quote lookup performance
- `is_deleted` - Soft delete filtering
- `topic_id, is_deleted` - Composite for topic replies
- Edit history indexes for sorting and lookup

### ✅ Authorization Rules
- **Create reply**: Authenticated users (topic not locked)
- **Update reply**: Author within 15 min OR moderator/admin
- **Delete reply**: Author OR moderator/admin
- **Accept answer**: Topic author only, question topics only
- **View edit history**: Moderator/admin only

### ✅ Validation & Security
- **Threading depth**: Max 3 levels enforced
- **Content length**: 10-10,000 characters
- **Edit time limit**: 15 minutes for regular users
- **@mention extraction**: Automatic parsing from content
- **Spam protection**: Rate limiting per user
- **Input sanitization**: Zod schemas on all inputs

### ✅ API Examples

#### Create Reply (Top-Level)
```bash
POST /api/forum/topics/xxx-xxx-xxx/replies
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great question! Here's my answer with @john mentioned..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": {
      "id": "reply-uuid",
      "topicId": "topic-uuid",
      "authorId": "user-uuid",
      "content": "Great question! Here's my answer with @john mentioned...",
      "parentReplyId": null,
      "quotedReplyId": null,
      "depth": 0,
      "mentions": ["john"],
      "voteScore": 0,
      "isAccepted": false,
      "isDeleted": false,
      "createdAt": "2025-11-05T12:00:00Z",
      "author": {
        "id": "user-uuid",
        "username": "johndoe",
        "profile": {
          "displayName": "John Doe",
          "avatarUrl": "https://..."
        }
      }
    }
  },
  "message": "Reply created successfully"
}
```

#### Create Threaded Reply (with Quote)
```bash
POST /api/forum/topics/xxx-xxx-xxx/replies
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "I agree with your point!",
  "parentReplyId": "parent-reply-uuid",
  "quotedReplyId": "quoted-reply-uuid"
}
```

#### Get Nested Reply Tree
```bash
GET /api/forum/topics/xxx-xxx-xxx/replies?sort=most_voted
```

**Response:**
```json
{
  "success": true,
  "data": {
    "replies": [
      {
        "id": "reply-1",
        "content": "Top-level reply",
        "depth": 0,
        "childReplies": [
          {
            "id": "reply-2",
            "content": "Nested reply level 1",
            "depth": 1,
            "childReplies": [
              {
                "id": "reply-3",
                "content": "Nested reply level 2",
                "depth": 2,
                "childReplies": [
                  {
                    "id": "reply-4",
                    "content": "Nested reply level 3 (max)",
                    "depth": 3,
                    "childReplies": []
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "count": 1
  }
}
```

#### Update Reply
```bash
PUT /api/forum/replies/xxx-xxx-xxx
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content with correction",
  "editReason": "Fixed typo in code example"
}
```

#### Delete Reply
```bash
DELETE /api/forum/replies/xxx-xxx-xxx
Authorization: Bearer <token>
```

#### Mark Accepted Answer
```bash
POST /api/forum/topics/xxx-xxx-xxx/accept-answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "replyId": "reply-uuid"
}
```

#### View Edit History (Moderator Only)
```bash
GET /api/forum/replies/xxx-xxx-xxx/edit-history
Authorization: Bearer <moderator-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "history-uuid",
        "replyId": "reply-uuid",
        "previousContent": "Original content before edit",
        "editedBy": "user-uuid",
        "editReason": "Fixed typo",
        "createdAt": "2025-11-05T12:05:00Z"
      }
    ],
    "count": 1
  }
}
```

### ✅ Running the Migration

To apply the reply system enhancements to your database:

```bash
cd backend
npx prisma migrate dev --name add_reply_enhancements
npx prisma generate
```

Or manually run the SQL migration:
```bash
psql -d neurmatic -f src/prisma/migrations/add_reply_enhancements/migration.sql
```

## Next Steps (Future Sprints)

- [x] Topics API (SPRINT-4-003) ✅
- [x] Replies API (SPRINT-4-006) ✅
- [ ] Voting system (SPRINT-4-008)
- [ ] Reputation system (SPRINT-4-010)
- [ ] Tags management
- [ ] Search functionality
- [ ] Moderation tools

## Dependencies

### Production
- `@prisma/client` - Database ORM
- `express` - Web framework
- `zod` - Input validation
- `tsyringe` - Dependency injection
- `@sentry/node` - Error tracking
- `express-rate-limit` - Rate limiting
- `jsonwebtoken` - JWT authentication

### Development
- `prisma` - Schema migrations
- `typescript` - Type safety
- `@types/*` - TypeScript definitions

## Troubleshooting

### Cannot create subcategory beyond level 2
**Error:** "Maximum category depth is 2 levels"
**Solution:** This is intentional. Only 2 levels are allowed per requirements.

### Slug already exists
**Error:** "Category slug already exists"
**Solution:** Choose a different slug or update the existing category.

### Cannot delete category with topics
**Error:** "Cannot delete category with existing topics"
**Solution:** Move or delete all topics first, or use soft delete.

### Cannot delete category with subcategories
**Error:** "Cannot delete category with active subcategories"
**Solution:** Delete or deactivate subcategories first.

## Support

For questions or issues, refer to:
- Main project documentation in `/projectdoc`
- Sprint 4 task definition in `.claude/sprints/sprint-4.json`
- Database schema in `/projectdoc/02-DATABASE_SCHEMA.md`
- API specification in `/projectdoc/03-API_ENDPOINTS.md`

---

**Implemented by:** Claude Code (AI Assistant)
**Sprint:** SPRINT-4-001
**Date:** November 2025
**Status:** ✅ Complete
