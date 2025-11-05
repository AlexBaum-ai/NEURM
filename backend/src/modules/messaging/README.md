# Messaging Module

Private one-on-one messaging system for the Neurmatic platform.

## Features

- ✅ One-on-one conversations
- ✅ Message history with pagination
- ✅ Rich text content (Markdown support)
- ✅ File attachments (max 10MB, up to 5 per message)
- ✅ Read receipts
- ✅ Unread count badge
- ✅ User blocking
- ✅ Search conversations by participant name
- ✅ Soft delete conversations
- ✅ Rate limiting

## Database Schema

### Tables

#### `conversations`
Manages message threads between two users.

- `id` - UUID, primary key
- `participant_1_id` - UUID, references users
- `participant_2_id` - UUID, references users
- `last_message_at` - Timestamp of last message
- `last_message_text` - Preview text (500 chars)
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

**Indexes:**
- Unique constraint on `(participant_1_id, participant_2_id)`
- Index on `participant_1_id`
- Index on `participant_2_id`
- Index on `last_message_at DESC`

#### `conversation_messages`
Individual messages in conversations.

- `id` - UUID, primary key
- `conversation_id` - UUID, references conversations
- `sender_id` - UUID, references users
- `content` - Text content
- `content_format` - Format (markdown/plain)
- `read_at` - Timestamp when read
- `is_edited` - Boolean flag
- `edited_at` - Edit timestamp
- `is_deleted` - Soft delete flag
- `deleted_at` - Delete timestamp
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

**Indexes:**
- Index on `conversation_id`
- Index on `sender_id`
- Index on `(conversation_id, created_at ASC)`
- Index on `read_at`

#### `message_attachments`
File attachments for messages.

- `id` - UUID, primary key
- `message_id` - UUID, references conversation_messages
- `filename` - Stored filename
- `original_filename` - Original filename
- `mime_type` - File MIME type
- `file_size` - Size in bytes (max 10MB)
- `url` - Public URL
- `storage_key` - Storage provider key
- `width` - Image width (optional)
- `height` - Image height (optional)
- `created_at` - Creation timestamp

**Indexes:**
- Index on `message_id`

#### `user_blocks`
User blocking for messaging.

- `id` - UUID, primary key
- `blocker_id` - UUID, references users
- `blocked_id` - UUID, references users
- `reason` - Optional block reason
- `created_at` - Creation timestamp

**Indexes:**
- Unique constraint on `(blocker_id, blocked_id)`
- Index on `blocker_id`
- Index on `blocked_id`

## API Endpoints

### Send Message
```http
POST /api/v1/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "uuid",
  "content": "Hello, how are you?",
  "contentFormat": "markdown",
  "attachments": [
    {
      "filename": "image.jpg",
      "url": "https://...",
      "storageKey": "uploads/...",
      "mimeType": "image/jpeg",
      "fileSize": 1024,
      "width": 800,
      "height": 600
    }
  ]
}
```

**Rate Limit:** 20 messages per minute

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "content": "Hello, how are you?",
      "contentFormat": "markdown",
      "attachments": [...],
      "createdAt": "2025-11-05T12:00:00.000Z"
    },
    "conversationId": "uuid"
  }
}
```

### Get Conversations
```http
GET /api/v1/conversations?page=1&limit=20&search=john
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search by participant name (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "otherParticipant": {
          "id": "uuid",
          "username": "john_doe",
          "displayName": "John Doe",
          "avatarUrl": "https://..."
        },
        "lastMessage": {
          "id": "uuid",
          "content": "Last message text",
          "isSentByMe": false,
          "isRead": false,
          "createdAt": "2025-11-05T12:00:00.000Z"
        },
        "messageCount": 15,
        "lastMessageAt": "2025-11-05T12:00:00.000Z",
        "createdAt": "2025-11-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    },
    "unreadCount": 3
  }
}
```

### Get Conversation Messages
```http
GET /api/v1/conversations/{conversationId}/messages?page=1&limit=50
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `before` - ISO timestamp for cursor pagination (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "content": "Message content",
        "contentFormat": "markdown",
        "sender": {
          "id": "uuid",
          "username": "john_doe",
          "displayName": "John Doe",
          "avatarUrl": "https://..."
        },
        "isSentByMe": false,
        "attachments": [...],
        "isRead": true,
        "readAt": "2025-11-05T12:05:00.000Z",
        "isEdited": false,
        "editedAt": null,
        "createdAt": "2025-11-05T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 45,
      "totalPages": 1
    }
  }
}
```

### Mark Message as Read
```http
PUT /api/v1/messages/{messageId}/read
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Message marked as read"
  }
}
```

### Delete Conversation
```http
DELETE /api/v1/conversations/{conversationId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Conversation deleted successfully"
  }
}
```

### Block User
```http
POST /api/v1/users/{userId}/block
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Spam messages"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "User blocked successfully"
  }
}
```

### Unblock User
```http
DELETE /api/v1/users/{userId}/block
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "User unblocked successfully"
  }
}
```

### Get Blocked Users
```http
GET /api/v1/users/blocked
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blockedUsers": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "username": "spammer",
          "displayName": "Spammer",
          "avatarUrl": null
        },
        "reason": "Spam messages",
        "blockedAt": "2025-11-05T12:00:00.000Z"
      }
    ]
  }
}
```

### Get Unread Count
```http
GET /api/v1/messages/unread-count
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

## Architecture

### Layer Structure

```
messaging/
├── messaging.validation.ts     # Zod validation schemas
├── messaging.repository.ts     # Data access layer
├── messaging.service.ts        # Business logic layer
├── messaging.controller.ts     # HTTP request handlers
├── messaging.routes.ts         # Route definitions
└── __tests__/
    └── messaging.service.test.ts  # Unit tests
```

### Data Flow

```
Request → Routes → Controller → Service → Repository → Database
                                                    ↓
Response ← Controller ← Service ← Repository ← Database
```

## Business Rules

1. **Conversation Creation:**
   - Conversations are automatically created when first message is sent
   - Participants are always ordered (participant1_id < participant2_id)
   - Only one conversation exists between any two users

2. **Message Sending:**
   - Users cannot send messages to themselves
   - Users cannot send messages to blocked users or users who blocked them
   - Maximum 5 attachments per message
   - Maximum 10MB per attachment
   - Content limited to 10,000 characters

3. **Read Receipts:**
   - Messages are automatically marked as read when conversation is opened
   - Only recipient can mark messages as read
   - Sender's own messages are not marked as read

4. **Blocking:**
   - Users cannot block themselves
   - Blocking is bidirectional (prevents all messaging)
   - Cannot send messages to or receive messages from blocked users
   - Existing conversations remain but cannot be continued

5. **Search:**
   - Search by participant username or display name
   - Case-insensitive search
   - Returns conversations where other participant matches search

## Error Handling

All errors are handled through Sentry error tracking and returned with appropriate HTTP status codes:

- `400 Bad Request` - Validation errors, business rule violations
- `403 Forbidden` - Blocked user attempts
- `404 Not Found` - Conversation/message not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Unexpected errors

## Testing

Run unit tests:
```bash
npm test messaging.service.test.ts
```

Run with coverage:
```bash
npm run test:coverage -- messaging.service.test.ts
```

## Future Enhancements

### Typing Indicators
Implement real-time typing indicators using WebSocket/Socket.IO:
```typescript
// Server-side event emission
socket.to(conversationId).emit('typing', { userId, isTyping: true });
```

### Message Reactions
Add emoji reactions to messages:
```sql
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES conversation_messages,
  user_id UUID REFERENCES users,
  emoji VARCHAR(10),
  created_at TIMESTAMPTZ
);
```

### Message Threading
Allow replies to specific messages:
```typescript
// Add to ConversationMessage model
parentMessageId?: string;
replyCount: number;
```

### Voice Messages
Support audio message attachments:
```typescript
// Add audio-specific fields to MessageAttachment
duration?: number; // in seconds
waveform?: number[]; // for visualization
```

### Message Search
Full-text search across message content:
```sql
CREATE INDEX message_content_search_idx ON conversation_messages
USING gin(to_tsvector('english', content));
```

## Performance Considerations

1. **Pagination:** All list endpoints support pagination to limit data transfer
2. **Indexes:** Comprehensive indexing on foreign keys and query patterns
3. **Eager Loading:** Participant data is loaded with conversations to reduce queries
4. **Soft Deletes:** Messages are soft-deleted to preserve conversation history
5. **Caching:** Consider Redis caching for unread counts and conversation lists

## Security

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:** Users can only access their own conversations
3. **Rate Limiting:** Prevents spam and abuse
4. **Input Validation:** Zod schemas validate all inputs
5. **XSS Prevention:** Markdown content should be sanitized on client
6. **File Upload:** File size and type validation on uploads
7. **Blocking:** Prevents unwanted communication

## Migration

To apply the database migration:

```bash
cd backend
npx prisma migrate deploy
```

Or during development:
```bash
npx prisma migrate dev
```
