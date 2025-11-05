# Article Scheduling System

## Overview

The Article Scheduling System enables automated publishing of articles at specified future dates. Articles can be scheduled for publishing, and the system will automatically transition them from `scheduled` to `published` status when the scheduled time is reached.

## Architecture

### Components

1. **Queue System** (`/src/jobs/queues/articleSchedulerQueue.ts`)
   - Bull-based queue for reliable job processing
   - Handles two job types:
     - `check_scheduled`: Scans for articles ready to publish
     - `publish_article`: Publishes a specific article
   - Retry logic with exponential backoff (3 attempts)
   - Job retention for audit trail

2. **Worker** (`/src/jobs/workers/articleSchedulerWorker.ts`)
   - Processes jobs from the queue
   - Checks for articles with `scheduledAt <= now()`
   - Updates article status to `published`
   - Sets `publishedAt` timestamp
   - Sends notification to article author
   - Logs failed publishes for debugging

3. **Scheduler** (`/src/jobs/schedulers/articleScheduler.scheduler.ts`)
   - Cron job running every minute
   - Triggers the `check_scheduled` job
   - Lightweight - actual work done by queue worker

4. **Service Layer** (`/src/modules/news/articles.service.ts`)
   - `scheduleArticle()`: Schedule an article for future publishing
   - `cancelSchedule()`: Cancel scheduled publishing
   - `listScheduledArticles()`: List upcoming scheduled articles

5. **Controller Layer** (`/src/modules/news/articles.controller.ts`)
   - Handles HTTP requests for scheduling operations
   - Validates input with Zod schemas
   - Returns appropriate responses

6. **Routes** (`/src/modules/news/articles.routes.ts`)
   - `POST /api/v1/admin/articles/:id/schedule` - Schedule article
   - `DELETE /api/v1/admin/articles/:id/schedule` - Cancel schedule
   - `GET /api/v1/admin/articles/scheduled` - List scheduled articles

## Database Schema

The `articles` table includes:
- `status` (enum): `draft`, `review`, `scheduled`, `published`, `archived`
- `scheduledAt` (timestamp): When to publish (nullable)
- `publishedAt` (timestamp): When actually published (nullable)

## Workflow

### Scheduling Flow

```
1. Admin creates/edits article
2. Admin schedules article via API
   POST /api/v1/admin/articles/:id/schedule
   { "scheduledAt": "2025-12-01T10:00:00Z" }
3. Article status → scheduled
4. scheduledAt timestamp set
```

### Publishing Flow

```
1. Cron job runs every minute
2. Triggers check_scheduled job
3. Worker queries: articles.status = 'scheduled' AND scheduledAt <= NOW()
4. For each article:
   a. Queue publish_article job
   b. Worker updates article.status → published
   c. Sets article.publishedAt → NOW()
   d. Sends notification to author
   e. Invalidates caches
```

### Cancellation Flow

```
1. Admin cancels schedule via API
   DELETE /api/v1/admin/articles/:id/schedule
2. Article status → draft
3. scheduledAt cleared (null)
```

## API Endpoints

### Schedule Article

```http
POST /api/v1/admin/articles/:id/schedule
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "scheduledAt": "2025-12-01T10:00:00.000Z"
}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Article Title",
    "status": "scheduled",
    "scheduledAt": "2025-12-01T10:00:00.000Z",
    ...
  },
  "message": "Article scheduled for 2025-12-01T10:00:00.000Z"
}
```

### Cancel Schedule

```http
DELETE /api/v1/admin/articles/:id/schedule
Authorization: Bearer <admin-token>

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Article Title",
    "status": "draft",
    "scheduledAt": null,
    ...
  },
  "message": "Article schedule cancelled successfully"
}
```

### List Scheduled Articles

```http
GET /api/v1/admin/articles/scheduled?page=1&limit=20&sortBy=scheduledAt&sortOrder=asc
Authorization: Bearer <admin-token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Article Title",
      "status": "scheduled",
      "scheduledAt": "2025-12-01T10:00:00.000Z",
      "category": { "id": "uuid", "name": "Category Name" },
      "author": { "id": "uuid", "username": "author" },
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

## Validation Rules

1. **Scheduled Date**:
   - Must be valid ISO 8601 datetime
   - Must be in the future
   - Validated at both API and service layers

2. **Status Transitions**:
   - Can schedule: `draft` → `scheduled`
   - Can reschedule: `scheduled` → `scheduled` (new date)
   - Can cancel: `scheduled` → `draft`
   - Cannot schedule: `published`, `archived`, `review`

3. **Permissions**:
   - All scheduling operations require admin role
   - Author receives notification on publish

## Error Handling

### Failed Publishes

When a publish fails:
1. Job retries up to 3 times with exponential backoff
2. Error logged to Sentry with article context
3. Failed publish event stored in analytics_events
4. Article remains in `scheduled` status
5. Next cron run will retry

### Monitoring

- Sentry error tracking for all failures
- Logs include:
  - Job ID
  - Article ID
  - Scheduled time
  - Error message
  - Retry attempt number

## Timezone Handling

- All timestamps stored in UTC (PostgreSQL `TIMESTAMPTZ`)
- Client should send ISO 8601 with timezone
- Database query uses UTC comparison
- Display to users in their local timezone (frontend responsibility)

## Performance Considerations

1. **Cron Frequency**: Every minute
   - Lightweight trigger (just queues a job)
   - Actual work done asynchronously by worker

2. **Query Optimization**:
   - Index on `articles.status`
   - Index on `articles.scheduledAt`
   - Compound index: `(status, scheduledAt)`

3. **Caching**:
   - Article caches invalidated on publish
   - List caches invalidated on schedule/cancel
   - Related articles cache invalidated

4. **Scalability**:
   - Queue-based architecture allows horizontal scaling
   - Multiple workers can process jobs in parallel
   - Redis queue prevents duplicate processing

## Notifications

When an article is published:

```javascript
{
  type: 'system',
  title: 'Article Published',
  message: 'Your article "Article Title" has been published successfully!',
  actionUrl: '/news/article-slug',
  referenceId: 'article-uuid'
}
```

## Testing

### Unit Tests

```bash
# Test service methods
npm test -- article-scheduling.test.ts
```

### Integration Tests

```bash
# Test full workflow
npm test -- tests/integration/article-scheduling.test.ts
```

### Manual Testing

1. Create draft article
2. Schedule for 2 minutes from now
3. Wait and observe:
   - Article status changes to `published`
   - Notification sent to author
   - Article visible on public site

## Troubleshooting

### Article Not Publishing

1. Check article status: `SELECT status, scheduledAt FROM articles WHERE id = 'uuid'`
2. Check scheduler is running: Logs should show "Running article scheduler check"
3. Check worker is processing: Logs should show "Processing article scheduler job"
4. Check for errors in Sentry
5. Check Bull queue: `GET /admin/queues` (if Bull Board is enabled)

### Timezone Issues

1. Verify client sends correct ISO 8601 format
2. Verify database stores as UTC
3. Check server timezone: `SELECT NOW()` in PostgreSQL
4. Verify no timezone conversion in application code

### Performance Issues

1. Check queue backlog: `articleSchedulerQueue.getJobCounts()`
2. Monitor worker processing time
3. Check database query performance: `EXPLAIN ANALYZE`
4. Consider increasing worker concurrency

## Future Enhancements

1. **Recurring Schedules**: Support for recurring article publishing
2. **Timezone Selection**: Allow selecting publish timezone per article
3. **Draft Preview**: Preview how article will look when published
4. **Bulk Scheduling**: Schedule multiple articles at once
5. **Schedule History**: Track all schedule changes
6. **Email Notifications**: Email author when article is published
7. **Social Media Integration**: Auto-post to social media on publish
8. **A/B Testing**: Schedule multiple versions for testing

## Configuration

Environment variables:

```env
# Redis (required for queue)
REDIS_URL=redis://localhost:6379

# Queue settings (optional)
ARTICLE_SCHEDULER_CONCURRENCY=1  # Worker concurrency
ARTICLE_SCHEDULER_RETRY_ATTEMPTS=3
ARTICLE_SCHEDULER_RETRY_DELAY=5000  # milliseconds
```

## Maintenance

### Cleanup Old Jobs

Bull automatically removes completed jobs based on settings:
- Completed: Keep last 200
- Failed: Keep last 100

Manual cleanup:

```javascript
// Remove completed jobs older than 7 days
await articleSchedulerQueue.clean(7 * 24 * 60 * 60 * 1000, 'completed');

// Remove failed jobs older than 30 days
await articleSchedulerQueue.clean(30 * 24 * 60 * 60 * 1000, 'failed');
```

### Monitor Queue Health

```javascript
// Get queue counts
const counts = await articleSchedulerQueue.getJobCounts();
console.log(counts); // { waiting, active, completed, failed, delayed }

// Get failed jobs
const failed = await articleSchedulerQueue.getFailed();

// Retry all failed jobs
for (const job of failed) {
  await job.retry();
}
```

## Security Considerations

1. **Authorization**: All endpoints require admin role
2. **Rate Limiting**: Applied to all admin endpoints
3. **Input Validation**: Zod schemas validate all inputs
4. **SQL Injection**: Prevented by Prisma ORM
5. **XSS Prevention**: Output sanitized by frontend
6. **Audit Trail**: All actions logged with user ID

## Support

For issues or questions:
- Check logs: `/var/log/neurmatic/server.log`
- Check Sentry: https://sentry.io/organizations/neurmatic
- Check database: Direct SQL queries
- Contact: dev@neurmatic.com
