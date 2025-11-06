# Email Digest System

## Overview

The email digest system sends personalized daily and weekly email summaries to users containing:
- Top stories from followed categories
- Trending forum discussions
- New job matches based on user profile
- Activity summary (followers, replies, upvotes, badges)

## Features

✅ **Daily & Weekly Digests**: Configurable schedule per user timezone
✅ **Personalized Content**: Based on followed categories, tags, and models
✅ **Smart Skipping**: Skip if insufficient content (min 3 items by default)
✅ **Vacation Mode**: Pause digests temporarily
✅ **Do-Not-Disturb**: Respects DND schedules
✅ **Rate Limiting**: Max 1 digest per day per user
✅ **Email Tracking**: Track opens (pixel) and clicks (redirect)
✅ **Unsubscribe**: One-click unsubscribe with confirmation page
✅ **Responsive Templates**: MJML-based, mobile-friendly emails

## Architecture

### Components

1. **DigestRepository** (`digest.repository.ts`)
   - Database operations for digest preferences and records
   - Content aggregation queries (articles, topics, jobs, activity)
   - User eligibility queries for scheduled sending

2. **DigestService** (`digest.service.ts`)
   - Business logic for digest generation
   - Content aggregation and personalization
   - Email generation and sending
   - Tracking (opens, clicks, unsubscribes)

3. **DigestController** (`digest.controller.ts`)
   - API endpoints for preferences, preview, tracking
   - HTTP request/response handling

4. **DigestTemplates** (`digestTemplate.ts`)
   - MJML-based email templates
   - Separate templates for daily and weekly digests
   - Responsive HTML generation

5. **DigestQueue** (`queues/digestQueue.ts`)
   - Bull queue for scheduled digest jobs
   - Cron jobs for daily/weekly triggers
   - Batch processing with rate limiting

## Database Schema

### digest_preferences
```sql
- id (UUID)
- user_id (FK to users) UNIQUE
- daily_enabled (BOOLEAN)
- daily_time (VARCHAR) - Format: "09:00"
- weekly_enabled (BOOLEAN)
- weekly_day (INT) - 0=Sunday, 1=Monday, etc.
- weekly_time (VARCHAR)
- timezone (VARCHAR)
- include_news (BOOLEAN)
- include_forum (BOOLEAN)
- include_jobs (BOOLEAN)
- include_activity (BOOLEAN)
- min_content_items (INT)
- vacation_mode (BOOLEAN)
- vacation_until (TIMESTAMP)
- last_daily_digest (TIMESTAMP)
- last_weekly_digest (TIMESTAMP)
```

### email_digests
```sql
- id (UUID)
- user_id (FK to users)
- type (ENUM: daily, weekly)
- sent_at (TIMESTAMP)
- email_to (VARCHAR)
- subject (VARCHAR)
- content_summary (JSONB)
- item_count (INT)
- tracking_token (VARCHAR) UNIQUE
- opened_at (TIMESTAMP)
- click_count (INT)
- unsubscribed_at (TIMESTAMP)
```

### email_tracking_events
```sql
- id (UUID)
- digest_id (FK to email_digests)
- event_type (ENUM: sent, delivered, opened, clicked, bounced, unsubscribed)
- link_url (VARCHAR)
- ip_address (VARCHAR)
- user_agent (VARCHAR)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

## API Endpoints

### Preferences

**GET** `/api/v1/notifications/digest/preferences`
- Get user's digest preferences
- Auth: Required
- Rate limit: 100/15min

**PUT** `/api/v1/notifications/digest/preferences`
- Update digest preferences
- Auth: Required
- Rate limit: 20/15min
- Body:
```json
{
  "dailyEnabled": true,
  "dailyTime": "09:00",
  "weeklyEnabled": true,
  "timezone": "America/New_York",
  "includeNews": true,
  "includeForum": true,
  "includeJobs": true,
  "includeActivity": true,
  "vacationMode": false
}
```

### Preview

**GET** `/api/v1/notifications/digest/preview?type=daily`
- Preview digest content without sending
- Auth: Required
- Rate limit: 100/15min
- Query: `type` (daily | weekly)
- Returns: `{ content, html, subject, itemCount }`

### Tracking (Public)

**GET** `/api/v1/notifications/digest/track/open/:trackingToken`
- Track email open (1x1 pixel)
- Auth: None
- Rate limit: 60/1min
- Returns: 1x1 transparent PNG

**GET** `/api/v1/notifications/digest/track/click/:trackingToken?url=<target>`
- Track link click and redirect
- Auth: None
- Rate limit: 60/1min
- Redirects to target URL

**GET** `/api/v1/notifications/digest/unsubscribe?token=<token>`
- Unsubscribe from all digests
- Auth: None
- Rate limit: 60/1min
- Returns: HTML confirmation page

## Queue Jobs

### Daily Digest Cron
- **Frequency**: Every hour (for each common digest time: 06:00, 07:00, 08:00, 09:00, 10:00)
- **Job**: `batch-daily-digest`
- **Process**:
  1. Find users with daily digest enabled at this time
  2. Filter by timezone
  3. Enqueue individual `send-digest` jobs with random 0-10min delay

### Weekly Digest Cron
- **Frequency**: Every Monday at 9:00 AM UTC (adjusts for user timezone)
- **Job**: `batch-weekly-digest`
- **Process**:
  1. Find users with weekly digest enabled
  2. Enqueue individual `send-digest` jobs with random 0-30min delay

### Individual Digest Job
- **Job**: `send-digest`
- **Process**:
  1. Check rate limiting (max 1/day)
  2. Check DND and vacation mode
  3. Aggregate personalized content
  4. Skip if < minContentItems
  5. Generate email HTML
  6. Send email
  7. Track sent event
  8. Update last sent timestamp

## Content Personalization

### Top Stories
- Query published articles from followed categories
- Order by view count DESC
- Limit: 5 (daily), 10 (weekly)

### Trending Discussions
- Query open topics from followed categories
- Order by view count and reply count DESC
- Limit: 5 (daily), 10 (weekly)

### Job Matches
- Query new job matches since last digest
- Filter by not dismissed
- Order by match score DESC
- Limit: 3 (daily), 5 (weekly)

### Activity Summary
- Count new followers
- Count replies to user's topics (exclude own replies)
- Count upvotes on user's content
- Count badges earned
- Only include if any activity > 0

## Email Template

### Structure
```
┌─────────────────────────────┐
│ Header (Neurmatic logo)    │
├─────────────────────────────┤
│ Greeting (Good morning!)   │
├─────────────────────────────┤
│ 📰 Top Stories             │
│  - Article 1 (image)       │
│  - Article 2               │
│  ...                       │
├─────────────────────────────┤
│ 💬 Trending Discussions    │
│  - Topic 1                 │
│  - Topic 2                 │
│  ...                       │
├─────────────────────────────┤
│ 💼 New Job Matches         │
│  - Job 1 (match score)     │
│  - Job 2                   │
│  ...                       │
├─────────────────────────────┤
│ 📊 Your Activity Summary   │
│  - X followers, Y replies  │
├─────────────────────────────┤
│ Footer                     │
│  - Manage preferences link │
│  - Unsubscribe link        │
│  - Copyright                │
├─────────────────────────────┤
│ Tracking pixel (1x1)       │
└─────────────────────────────┘
```

### MJML Benefits
- Responsive design (mobile/desktop)
- Cross-email-client compatibility
- Easy maintenance
- Consistent styling

## Initialization

Add to your `server.ts` or initialization file:

```typescript
import { initializeDigestSchedules } from './queues/digestQueue';

// After app initialization
await initializeDigestSchedules();
```

## Testing

### Manual Testing

```typescript
import { triggerDigestForUser, triggerBatchDigest } from './queues/digestQueue';

// Test single user
await triggerDigestForUser('user-id', 'daily');

// Test batch
await triggerBatchDigest('daily', ['UTC']);
```

### API Testing

```bash
# Get preferences
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/notifications/digest/preferences

# Update preferences
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dailyEnabled":false}' \
  http://localhost:3000/api/v1/notifications/digest/preferences

# Preview digest
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/notifications/digest/preview?type=daily"
```

## Monitoring

### Metrics to Track
- Digests sent per day
- Open rate (% opened)
- Click-through rate (% clicked)
- Unsubscribe rate
- Average items per digest
- Digests skipped (insufficient content)

### Logs
- Queue jobs: Success/failure
- Email sending: Success/errors
- Tracking events: Opens/clicks/unsubscribes

### Sentry Integration
All errors are automatically captured to Sentry with context:
- User ID
- Digest type
- Error details

## Best Practices

1. **Rate Limiting**: Spread digest sends over time to avoid email provider rate limits
2. **Content Quality**: Skip digests with insufficient content
3. **Personalization**: Use follows and preferences for relevance
4. **Tracking**: Monitor engagement to improve content
5. **Unsubscribe**: Make it easy and respect user choice
6. **Testing**: Preview before sending, test with different content levels
7. **Performance**: Use database indexes on follow tables and content queries

## Troubleshooting

### Digests not sending
1. Check queue is running: `digestQueue.getJobCounts()`
2. Check cron jobs are scheduled: `digestQueue.getRepeatableJobs()`
3. Check user preferences: Enabled, not in vacation mode, timezone correct
4. Check logs for errors

### Low engagement
1. Review content relevance (personalization)
2. Test different send times
3. Adjust minimum content threshold
4. Improve email template/subject lines

### Email deliverability issues
1. Verify SPF/DKIM/DMARC records
2. Check SendGrid/AWS SES configuration
3. Monitor bounce/spam rates
4. Review email content for spam triggers
