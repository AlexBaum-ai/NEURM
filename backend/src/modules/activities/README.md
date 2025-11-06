# Activities Module

## Overview

The Activities module tracks and displays user actions across the platform, providing activity feeds for individual users and following feeds for social discovery.

## Features

- **Activity Tracking**: Log user actions (articles, topics, replies, votes, etc.)
- **Privacy Control**: Activities respect privacy settings (public, community, private)
- **User Activity Feed**: View a user's recent activities
- **Following Feed**: View activities from followed users
- **Time Grouping**: Activities grouped by "Today", "This Week", "Earlier"
- **Performance**: Queries optimized with proper indexes, Redis caching
- **Pagination**: Support for pagination with configurable limits

## Database Schema

### UserActivity Model

```prisma
model UserActivity {
  id           String               @id @default(uuid())
  userId       String               @map("user_id")
  activityType ActivityType         @map("activity_type")
  targetType   ActivityTargetType   @map("target_type")
  targetId     String               @map("target_id")
  privacy      PrivacyVisibility    @default(public)
  metadata     Json?
  createdAt    DateTime             @default(now()) @map("created_at")

  user User @relation("UserActivities", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([activityType, createdAt(sort: Desc)])
  @@index([targetType, targetId])
  @@map("user_activities")
}
```

### Activity Types

- `posted_article` - User published an article
- `created_topic` - User created a forum topic
- `replied` - User replied to a topic
- `upvoted` - User upvoted content
- `bookmarked` - User bookmarked content
- `applied_job` - User applied to a job
- `earned_badge` - User earned a badge
- `followed_user` - User followed another user

### Target Types

- `article` - Article content
- `topic` - Forum topic
- `reply` - Forum reply
- `job` - Job posting
- `badge` - Badge earned
- `user` - User profile

## API Endpoints

### 1. Get User Activity Feed

**Endpoint**: `GET /api/users/:username/activity`

**Authentication**: Optional (public endpoint with privacy filtering)

**Query Parameters**:
- `type` (optional): Filter by activity type
- `limit` (optional): Number of activities per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "activities": {
      "today": [
        {
          "id": "uuid",
          "userId": "uuid",
          "activityType": "posted_article",
          "targetType": "article",
          "targetId": "uuid",
          "privacy": "public",
          "metadata": { "title": "Article Title" },
          "createdAt": "2025-11-06T10:00:00Z",
          "user": {
            "id": "uuid",
            "username": "johndoe",
            "profile": {
              "firstName": "John",
              "lastName": "Doe",
              "avatarUrl": "https://..."
            }
          }
        }
      ],
      "thisWeek": [...],
      "earlier": [...]
    },
    "pagination": {
      "total": 50,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Privacy Rules**:
- **No authentication**: Only public activities shown
- **Authenticated (not following)**: Only public activities shown
- **Authenticated (following)**: Public + community activities shown
- **Own profile**: All activities shown

**Performance**: < 500ms with proper indexing and caching

### 2. Get Following Feed

**Endpoint**: `GET /api/following/feed`

**Authentication**: Required

**Query Parameters**:
- `type` (optional): Filter by activity type
- `limit` (optional): Number of activities per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**: Same format as user activity feed

**Description**: Returns activities from all users the authenticated user follows, filtered to show only public and community visibility activities.

### 3. Create Activity (Internal)

**Endpoint**: `POST /api/activities`

**Authentication**: Required

**Body**:
```json
{
  "activityType": "posted_article",
  "targetType": "article",
  "targetId": "uuid",
  "privacy": "public",
  "metadata": {
    "title": "Article Title"
  }
}
```

**Note**: This endpoint is primarily for internal use by other modules.

## Usage in Other Modules

### Track Activity Programmatically

```typescript
import { ActivitiesService } from '@/modules/activities/activities.service';
import { ActivityType, PrivacyVisibility } from '@prisma/client';

const activitiesService = new ActivitiesService(prisma, redis);

// Track an article post
await activitiesService.trackActivity(
  userId,
  ActivityType.posted_article,
  'article',
  articleId,
  PrivacyVisibility.public,
  { title: article.title }
);

// Track a topic creation
await activitiesService.trackActivity(
  userId,
  ActivityType.created_topic,
  'topic',
  topicId,
  PrivacyVisibility.community,
  { title: topic.title, category: topic.category }
);
```

## Time Grouping Logic

Activities are grouped into three time periods:

- **Today**: Activities from the current day (midnight to now)
- **This Week**: Activities from Monday of the current week to yesterday
- **Earlier**: Activities older than the current week

Example:
```typescript
{
  "today": [/* activities from today */],
  "thisWeek": [/* activities from this week */],
  "earlier": [/* activities older than this week */]
}
```

## Caching Strategy

- **User Activity Cache**: 2 minutes TTL
- **Following Feed Cache**: 1 minute TTL (fresher feed)
- **Cache Invalidation**: Automatically invalidated when new activities are created

Cache keys:
- User activities: `activities:user:{userId}:{type}:{viewerId}:{offset}`
- Following feed: `activities:feed:{userId}:{type}:{offset}`

## Performance Optimization

### Database Indexes

1. `(userId, createdAt DESC)` - For user activity queries
2. `(activityType, createdAt DESC)` - For activity type filtering
3. `(targetType, targetId)` - For target lookups

### Query Performance

- User activity query: < 500ms (p95)
- Following feed query: < 500ms (p95)
- Redis caching reduces repeated queries by ~80%

## Privacy Implementation

Privacy levels are enforced at the database query level:

```typescript
// Public activities (no auth)
WHERE privacy = 'public'

// Public + community activities (following)
WHERE privacy IN ('public', 'community')

// All activities (own profile)
WHERE userId = viewerId (no privacy filter)
```

## Testing

Run tests:
```bash
npm test -- activities
```

Test coverage:
- Activity creation
- User activity feed with privacy filtering
- Following feed
- Time grouping logic
- Cache invalidation

## Error Handling

All errors are captured with Sentry and returned as appropriate HTTP responses:

- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Authentication required
- `404 Not Found`: User not found
- `500 Internal Server Error`: Unexpected errors

## Future Enhancements

1. **Activity Aggregation**: Combine similar activities (e.g., "User X and 5 others upvoted your post")
2. **Real-time Updates**: Use WebSockets to push new activities
3. **Activity Reactions**: Allow users to react to activities
4. **Custom Filters**: More advanced filtering options (date ranges, multiple types)
5. **Activity Deletion**: Allow users to hide specific activities
6. **Analytics**: Track activity engagement metrics

## Related Modules

- **Follows Module**: Determines following relationships for feed
- **News Module**: Creates activities for article actions
- **Forum Module**: Creates activities for topic/reply actions
- **Jobs Module**: Creates activities for job applications
- **Profiles Module**: Privacy settings integration

## Migration

To apply the database migration:

```bash
cd backend
psql -U your_user -d neurmatic < src/prisma/migrations/add_user_activities_table.sql
npx prisma generate
```

Or use Prisma migrate:
```bash
npx prisma migrate dev --name add_user_activities
```

## Maintenance

### Clean Up Old Activities

A helper method is provided to clean up old activities:

```typescript
// Clean up activities older than 90 days
await activitiesService.cleanUpOldActivities(90);
```

This should be run as a scheduled cron job (e.g., weekly).

## Support

For questions or issues, contact the backend team or file an issue in the project repository.
