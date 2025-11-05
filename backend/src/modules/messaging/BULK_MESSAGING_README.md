# Bulk Messaging System for Recruiters

## Overview

The bulk messaging system allows companies to efficiently message multiple candidates while preventing spam and respecting candidate preferences. This feature implements strict rate limiting, personalization, and blocking capabilities.

## Features

### 1. Message Templates
- Create, update, and delete reusable message templates
- Track template usage statistics
- Support for personalization variables
- Subject and body customization

### 2. Bulk Messaging
- Send personalized messages to up to 50 candidates per day
- Template-based or custom messages
- Real-time status tracking (sent, delivered, read, replied, failed)
- Automatic filtering of blocked candidates
- Detailed delivery reports

### 3. Personalization
- Dynamic template variables:
  - `{{candidate_name}}` - Candidate's display name or username
  - `{{candidate_username}}` - Candidate's username
  - `{{candidate_skills}}` - Comma-separated list of candidate skills
  - `{{candidate_experience}}` - Most recent job title
  - `{{candidate_location}}` - Candidate's location
  - `{{job_title}}` - Job title (when applicable)
  - `{{company_name}}` - Company name (when applicable)

### 4. Rate Limiting
- **Daily Limit**: 50 messages per company per day
- **Hourly Limit**: 10 bulk message operations per hour (API rate limit)
- Redis-based rate limiting with database fallback
- Clear error messages when limits are exceeded

### 5. Company Blocking
- Candidates can block companies from messaging them
- Blocked candidates are automatically filtered from bulk sends
- Block list management (view, add, remove)
- Optional reason tracking for blocks

### 6. Message Tracking
- Comprehensive status tracking for each recipient:
  - **Sent**: Message successfully sent
  - **Delivered**: Message delivered to recipient
  - **Read**: Recipient opened the message
  - **Replied**: Recipient responded
  - **Failed**: Message delivery failed
- Aggregate statistics per bulk message
- Individual recipient status history

## API Endpoints

### Message Templates

#### Create Template
```http
POST /api/v1/companies/messages/templates
Authorization: Bearer <token>

{
  "name": "Welcome Template",
  "subject": "Exciting Opportunity at {{company_name}}",
  "body": "Hi {{candidate_name}},\n\nWe noticed your experience with {{candidate_skills}} and think you'd be a great fit for our team!",
  "isDefault": false
}
```

#### Get Templates
```http
GET /api/v1/companies/messages/templates?page=1&limit=20&search=welcome
Authorization: Bearer <token>
```

#### Update Template
```http
PUT /api/v1/companies/messages/templates/:id
Authorization: Bearer <token>

{
  "name": "Updated Template",
  "body": "Updated content with {{candidate_name}}"
}
```

#### Delete Template
```http
DELETE /api/v1/companies/messages/templates/:id
Authorization: Bearer <token>
```

### Bulk Messages

#### Send Bulk Message
```http
POST /api/v1/companies/messages/bulk
Authorization: Bearer <token>

{
  "templateId": "uuid-of-template",  // Optional
  "subject": "Custom Subject",        // Optional if using template
  "body": "Custom message with {{candidate_name}}",  // Required if no template
  "recipientIds": ["user-id-1", "user-id-2", "user-id-3"],
  "personalizeContent": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bulkMessageId": "bulk-message-uuid",
    "totalRecipients": 2,
    "blockedCount": 1,
    "successful": 2,
    "failed": 0,
    "errors": [],
    "message": "Bulk message sent to 2 recipients"
  }
}
```

#### Get Bulk Messages
```http
GET /api/v1/companies/messages/bulk?page=1&limit=20&status=sent
Authorization: Bearer <token>
```

#### Get Bulk Message Details
```http
GET /api/v1/companies/messages/bulk/:id
Authorization: Bearer <token>
```

#### Get Bulk Message Recipients
```http
GET /api/v1/companies/messages/bulk/:id/recipients?page=1&limit=20&status=read
Authorization: Bearer <token>
```

### Company Blocking (Candidate Perspective)

#### Block Company
```http
POST /api/v1/candidates/blocks/companies/:companyId
Authorization: Bearer <token>

{
  "reason": "Received spam messages"  // Optional
}
```

#### Unblock Company
```http
DELETE /api/v1/candidates/blocks/companies/:companyId
Authorization: Bearer <token>
```

#### Get Blocked Companies
```http
GET /api/v1/candidates/blocks/companies?page=1&limit=20
Authorization: Bearer <token>
```

## Database Schema

### message_templates
```sql
id               UUID PRIMARY KEY
company_id       UUID NOT NULL REFERENCES companies(id)
name             VARCHAR(100) NOT NULL
subject          VARCHAR(255)
body             TEXT NOT NULL
is_default       BOOLEAN DEFAULT false
usage_count      INTEGER DEFAULT 0
created_at       TIMESTAMPTZ DEFAULT NOW()
updated_at       TIMESTAMPTZ DEFAULT NOW()
```

### bulk_messages
```sql
id               UUID PRIMARY KEY
company_id       UUID NOT NULL REFERENCES companies(id)
template_id      UUID REFERENCES message_templates(id)
subject          VARCHAR(255)
sent_at          TIMESTAMPTZ DEFAULT NOW()
recipient_count  INTEGER DEFAULT 0
delivered_count  INTEGER DEFAULT 0
read_count       INTEGER DEFAULT 0
replied_count    INTEGER DEFAULT 0
failed_count     INTEGER DEFAULT 0
status           VARCHAR(20) DEFAULT 'sent'
recipient_ids    UUID[] DEFAULT '{}'
created_at       TIMESTAMPTZ DEFAULT NOW()
updated_at       TIMESTAMPTZ DEFAULT NOW()
```

### bulk_message_recipients
```sql
id                      UUID PRIMARY KEY
bulk_message_id         UUID NOT NULL REFERENCES bulk_messages(id)
recipient_id            UUID NOT NULL REFERENCES users(id)
conversation_message_id UUID REFERENCES conversation_messages(id)
personalized_content    TEXT
status                  VARCHAR(20) DEFAULT 'sent'
delivered_at            TIMESTAMPTZ
read_at                 TIMESTAMPTZ
replied_at              TIMESTAMPTZ
failed_reason           TEXT
created_at              TIMESTAMPTZ DEFAULT NOW()
updated_at              TIMESTAMPTZ DEFAULT NOW()
```

### company_blocks
```sql
id           UUID PRIMARY KEY
candidate_id UUID NOT NULL REFERENCES users(id)
company_id   UUID NOT NULL REFERENCES companies(id)
reason       TEXT
created_at   TIMESTAMPTZ DEFAULT NOW()
UNIQUE (candidate_id, company_id)
```

## Rate Limiting Implementation

### Redis Rate Limiting
```typescript
// Key format: bulk_message_count:companyId:YYYY-MM-DD
// TTL: Seconds until midnight
// Max value: 50

// Example:
// bulk_message_count:company-123:2025-11-05 -> 45
```

### Rate Limit Check Flow
1. Check Redis cache for current count
2. Check database for actual count
3. Use maximum of both values
4. Validate new send doesn't exceed limit (50)
5. Increment Redis counter after successful send
6. Redis TTL automatically resets at midnight

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Daily recipient limit exceeded. You can send to 5 more recipients today.",
    "statusCode": 403
  }
}
```

## Personalization Engine

### How It Works
1. Extract recipient data from database (profile, skills, experience)
2. Build personalization context object
3. Replace template variables with actual values
4. Clean up any unreplaced variables

### Example
**Template:**
```
Hi {{candidate_name}},

We noticed your experience with {{candidate_skills}} and think you'd be perfect for our {{job_title}} role in {{candidate_location}}.
```

**After Personalization:**
```
Hi John Doe,

We noticed your experience with Python, JavaScript, React and think you'd be perfect for our Senior Developer role in New York.
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT token
2. **Company Verification**: Only company owners can send bulk messages
3. **Input Validation**: Zod schemas validate all inputs
4. **Rate Limiting**: Multiple layers prevent abuse
5. **Block List**: Candidates can protect themselves from unwanted messages
6. **SQL Injection**: Prisma ORM prevents SQL injection
7. **XSS Prevention**: Content sanitization (to be implemented in frontend)

## Performance Optimizations

1. **Batch Operations**: Bulk recipient creation uses Prisma's `createMany`
2. **Redis Caching**: Rate limit counters cached for fast checks
3. **Async Processing**: Message sending happens sequentially but with error recovery
4. **Database Indexes**: Optimized queries with proper indexing
5. **Pagination**: All list endpoints support pagination

## Error Handling

### Common Errors

**Rate Limit Exceeded**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Daily recipient limit exceeded. You can send to 5 more recipients today.",
    "statusCode": 403
  }
}
```

**All Recipients Blocked**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "All recipients have blocked your company",
    "statusCode": 400
  }
}
```

**Template Not Found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Template not found",
    "statusCode": 404
  }
}
```

## Testing

### Unit Tests
```bash
npm test -- bulkMessaging.service.test.ts
```

### Test Coverage
- Template CRUD operations
- Bulk message sending with rate limiting
- Personalization engine
- Company blocking
- Error scenarios

## Usage Examples

### Example 1: Send Personalized Messages with Template
```javascript
// 1. Create a template
const template = await createTemplate({
  name: "Senior Developer Outreach",
  subject: "{{job_title}} at {{company_name}}",
  body: "Hi {{candidate_name}},\n\nWe're impressed by your {{candidate_skills}} experience!"
});

// 2. Send bulk message using template
const result = await sendBulkMessage({
  templateId: template.id,
  recipientIds: ["user-1", "user-2", "user-3"],
  personalizeContent: true
});

console.log(`Sent to ${result.successful} candidates`);
```

### Example 2: Send Custom Message Without Template
```javascript
const result = await sendBulkMessage({
  subject: "Great Opportunity",
  body: "Hi {{candidate_name}}, we have a role that matches your {{candidate_skills}}!",
  recipientIds: ["user-1", "user-2"],
  personalizeContent: true
});
```

### Example 3: Check Remaining Daily Limit
```javascript
// The service automatically checks and reports remaining capacity
try {
  await sendBulkMessage({ ... });
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log(error.message); // "You can send to 5 more recipients today."
  }
}
```

## Monitoring and Analytics

### Metrics to Track
1. **Daily Send Volume**: Messages sent per company per day
2. **Delivery Rate**: Percentage of successfully delivered messages
3. **Read Rate**: Percentage of messages opened by recipients
4. **Reply Rate**: Percentage of messages that received replies
5. **Block Rate**: Percentage of recipients who block companies
6. **Template Usage**: Most popular templates
7. **Personalization Impact**: Comparison of personalized vs non-personalized message performance

### Recommended Monitoring
```javascript
// Log metrics to analytics service
analyticsService.track('bulk_message_sent', {
  companyId,
  recipientCount,
  templateUsed: !!templateId,
  personalized: personalizeContent,
  successful,
  failed
});
```

## Future Enhancements

1. **Scheduled Sending**: Allow companies to schedule bulk messages for specific times
2. **A/B Testing**: Test different message variations
3. **Unsubscribe Links**: Automatic unsubscribe option in all messages
4. **Analytics Dashboard**: Visual dashboard for message performance
5. **Smart Timing**: AI-powered optimal send time recommendations
6. **Response Templates**: Quick reply templates for candidates
7. **Read Receipts**: More detailed read tracking
8. **Message Preview**: Preview personalized messages before sending
9. **Bounce Handling**: Handle email-like bounces
10. **Spam Detection**: ML-based spam detection to protect candidates

## Support and Troubleshooting

### Common Issues

**Issue**: Messages not personalizing
- **Solution**: Ensure `personalizeContent: true` and candidate has profile data

**Issue**: Rate limit showing incorrect count
- **Solution**: Redis may be out of sync. Database is source of truth.

**Issue**: Messages not sending to some recipients
- **Solution**: Check if recipients have blocked the company

**Issue**: Template variables not replacing
- **Solution**: Verify variable syntax: `{{variable_name}}` (with double curly braces)

## License

This module is part of the Neurmatic platform and is subject to the project's license terms.
