# Follows Module

A polymorphic following system that allows users to follow various entities including users, companies, tags, categories, and LLM models.

## Features

- **Polymorphic Following**: Single unified system for following multiple entity types
- **Activity Feed**: Personalized feed from followed entities
- **Follow Counts**: Automatic tracking of follower/following counts
- **Privacy Controls**: Users can control visibility of their followers/following lists
- **Notifications**: Automatic notifications when someone follows you
- **Redis Caching**: Feed results cached for performance (15 min TTL)
- **Comprehensive Validation**: Zod schemas for all inputs
- **Sentry Integration**: Full error tracking and performance monitoring

## Supported Entity Types

- `user` - Follow other users
- `company` - Follow companies for job updates
- `tag` - Follow news or forum tags
- `category` - Follow news or forum categories
- `model` - Follow LLM models for updates

## API Endpoints

### Follow Management

#### Create Follow
```http
POST /api/v1/follows
Authorization: Bearer <token>
Content-Type: application/json

{
  "followableType": "company",
  "followableId": "uuid"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "followerId": "uuid",
    "followableType": "company",
    "followableId": "uuid",
    "createdAt": "2025-11-05T12:00:00Z",
    "follower": {
      "id": "uuid",
      "username": "testuser",
      "email": "user@example.com"
    }
  }
}
```

#### Unfollow
```http
DELETE /api/v1/follows/:id
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Unfollowed successfully"
  }
}
```

#### Check Following Status
```http
GET /api/v1/follows/check?followableType=company&followableId=uuid
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "isFollowing": true
  }
}
```

### Following & Followers

#### Get User's Following List
```http
GET /api/v1/users/:id/following?type=company&limit=20&offset=0
Authorization: Bearer <token>
```

**Query Parameters**:
- `type` (optional): Filter by entity type (user, company, tag, category, model)
- `limit` (optional): Results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "followerId": "uuid",
        "followableType": "company",
        "followableId": "uuid",
        "createdAt": "2025-11-05T12:00:00Z",
        "entity": {
          "id": "uuid",
          "name": "Tech Company",
          "slug": "tech-company",
          "logoUrl": "https://...",
          "followerCount": 150
        }
      }
    ],
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

#### Get User's Followers
```http
GET /api/v1/users/:id/followers?limit=20&offset=0
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "followerId": "uuid",
        "followableType": "user",
        "followableId": "uuid",
        "createdAt": "2025-11-05T12:00:00Z",
        "follower": {
          "id": "uuid",
          "username": "follower123",
          "email": "follower@example.com",
          "profile": {
            "firstName": "John",
            "lastName": "Doe",
            "avatarUrl": "https://...",
            "bio": "Software engineer"
          }
        }
      }
    ],
    "total": 89,
    "limit": 20,
    "offset": 0
  }
}
```

#### Get Entity Followers (Generic)
```http
GET /api/v1/:type/:id/followers?limit=20&offset=0
Authorization: Bearer <token>
```

**Path Parameters**:
- `type`: Entity type (companies, tags, categories, models)
- `id`: Entity UUID

**Example**:
```http
GET /api/v1/companies/uuid/followers
GET /api/v1/models/uuid/followers
```

### Activity Feed

#### Get Following Feed
```http
GET /api/v1/following/feed?type=all&limit=20&offset=0
Authorization: Bearer <token>
```

**Query Parameters**:
- `type` (optional): Filter by content type (all, articles, topics, jobs) - default: all
- `limit` (optional): Results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "title": "New AI Model Released",
        "excerpt": "...",
        "type": "article",
        "createdAt": "2025-11-05T12:00:00Z",
        "author": {
          "id": "uuid",
          "username": "techwriter"
        },
        "category": {
          "id": "uuid",
          "name": "AI News"
        }
      },
      {
        "id": "uuid",
        "title": "Senior ML Engineer Position",
        "type": "job",
        "createdAt": "2025-11-05T11:00:00Z",
        "company": {
          "id": "uuid",
          "name": "Tech Corp",
          "logoUrl": "https://..."
        }
      }
    ],
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

## Database Schema

### PolymorphicFollow Model
```prisma
model PolymorphicFollow {
  id             String         @id @default(uuid())
  followerId     String         @map("follower_id")
  followableType FollowableType @map("followable_type")
  followableId   String         @map("followable_id")
  createdAt      DateTime       @default(now()) @map("created_at")

  follower User @relation("UserPolymorphicFollows", fields: [followerId], references: [id], onDelete: Cascade)

  @@unique([followerId, followableType, followableId])
  @@index([followerId])
  @@index([followableType, followableId])
  @@index([createdAt(sort: Desc)])
  @@map("polymorphic_follows")
}
```

### Follow Counts
Follower counts are automatically maintained via database triggers:
- `users.follower_count` and `users.following_count`
- `companies.follower_count`
- `news_categories.follower_count`
- `news_tags.follower_count`
- `forum_categories.follower_count`
- `forum_tags.follower_count`
- `llm_models.follower_count`

## Business Rules

1. **Self-following Prevention**: Users cannot follow themselves
2. **Duplicate Prevention**: Unique constraint prevents duplicate follows
3. **Cascade Deletion**: Follows are deleted when follower is deleted
4. **Automatic Counts**: Follower/following counts updated via DB triggers
5. **Feed Caching**: Feed results cached for 15 minutes
6. **Privacy**: Users can control visibility of followers/following lists
7. **Notifications**: Notification sent only when following a user

## Implementation Details

### Architecture
```
Routes → Controller → Service → Repository → Database
                  ↓
              Redis Cache
                  ↓
         Notification Service
```

### Feed Generation
The following feed aggregates content from:
1. **Articles**: From followed users and categories
2. **Topics**: From followed users and tags
3. **Jobs**: From followed companies

Results are:
- Sorted by recency (newest first)
- Cached in Redis (15 min TTL)
- Invalidated on follow/unfollow
- Paginated (max 100 per page)

### Caching Strategy
- **Key Pattern**: `following_feed:{userId}:{type}:{limit}:{offset}`
- **TTL**: 900 seconds (15 minutes)
- **Invalidation**: On follow/unfollow actions
- **Benefits**: Reduces database load for frequently accessed feeds

## Error Handling

All errors are tracked in Sentry and return appropriate HTTP status codes:
- `400 Bad Request`: Validation errors, self-following, invalid entity type
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Attempting to unfollow someone else's follow
- `404 Not Found`: Entity or follow relationship not found
- `409 Conflict`: Attempting to follow an entity already followed
- `500 Internal Server Error`: Unexpected errors

## Rate Limiting

- **Follow/Unfollow**: 30 requests/minute
- **Check Following**: 100 requests/minute
- **Get Following/Followers**: 60 requests/minute
- **Get Feed**: 30 requests/minute

## Testing

### Unit Tests
```bash
npm test -- follows.service.test.ts
```

### Integration Tests
```bash
npm test -- follows.integration.test.ts
```

### Test Coverage
- Repository: Full coverage of all methods
- Service: Business logic and error cases
- Controller: HTTP request/response handling
- Integration: End-to-end API testing

## Performance Considerations

1. **Indexes**: Optimized for common queries
   - `followerId` for user's following list
   - `(followableType, followableId)` for entity's followers
   - `createdAt DESC` for feed sorting

2. **Caching**: Redis caching for feed reduces DB load

3. **Batch Operations**: `batchIsFollowing` for checking multiple entities

4. **Pagination**: All list endpoints support pagination

## Future Enhancements

- [ ] Follow suggestions based on interests
- [ ] Email digests of activity from followed entities
- [ ] Mutual follow detection
- [ ] Follow export/import
- [ ] Analytics on most followed entities
- [ ] Real-time feed updates via WebSocket

## Dependencies

- `@prisma/client`: Database ORM
- `ioredis`: Redis client for caching
- `zod`: Schema validation
- `@sentry/node`: Error tracking
- `express`: HTTP server

## Related Modules

- **Notifications**: Sends follow notifications
- **Users**: User profile and authentication
- **Companies**: Company profiles
- **News**: Articles, categories, tags
- **Forum**: Topics, categories, tags
- **Models**: LLM model tracking
