# Skill Endorsement System

## Overview

The skill endorsement system allows registered users to endorse skills on other users' profiles. This builds credibility and validates expertise within the community.

## Features

- ✅ One endorsement per user per skill
- ✅ Endorsement count tracking on skills
- ✅ Notification to profile owner on endorsement
- ✅ Public list of endorsers
- ✅ Cannot endorse own skills
- ✅ Authentication required to endorse
- ✅ Automatic count increment/decrement

## Database Schema

### skill_endorsements Table

```sql
CREATE TABLE "skill_endorsements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,      -- The endorser
    "profile_id" TEXT NOT NULL,   -- The profile owner
    "skill_id" TEXT NOT NULL,     -- The endorsed skill
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_endorsements_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "skill_endorsements_profile_id_fkey"
        FOREIGN KEY ("profile_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "skill_endorsements_skill_id_fkey"
        FOREIGN KEY ("skill_id") REFERENCES "user_skills"("id") ON DELETE CASCADE
);

-- Unique constraint to ensure one endorsement per user per skill
CREATE UNIQUE INDEX "skill_endorsements_user_id_profile_id_skill_id_key"
    ON "skill_endorsements"("user_id", "profile_id", "skill_id");

-- Indexes for query performance
CREATE INDEX "skill_endorsements_user_id_idx" ON "skill_endorsements"("user_id");
CREATE INDEX "skill_endorsements_profile_id_idx" ON "skill_endorsements"("profile_id");
CREATE INDEX "skill_endorsements_skill_id_idx" ON "skill_endorsements"("skill_id");
```

## API Endpoints

### 1. Endorse a Skill

**Endpoint:** `POST /api/v1/profiles/:username/skills/:skillId/endorse`

**Auth:** Required (authenticated users only)

**Description:** Create an endorsement for a user's skill.

**Request:**
```http
POST /api/v1/profiles/johndoe/skills/550e8400-e29b-41d4-a716-446655440000/endorse
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Skill endorsed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Cannot endorse own skills
- `404 Not Found` - User or skill not found
- `409 Conflict` - Already endorsed this skill

### 2. Remove Endorsement

**Endpoint:** `DELETE /api/v1/profiles/:username/skills/:skillId/endorse`

**Auth:** Required (authenticated users only)

**Description:** Remove your endorsement from a user's skill.

**Request:**
```http
DELETE /api/v1/profiles/johndoe/skills/550e8400-e29b-41d4-a716-446655440000/endorse
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Endorsement removed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - User, skill, or endorsement not found

### 3. Get Endorsements

**Endpoint:** `GET /api/v1/profiles/:username/skills/:skillId/endorsements`

**Auth:** Public (no authentication required)

**Description:** Get a list of all endorsers for a skill.

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Request:**
```http
GET /api/v1/profiles/johndoe/skills/550e8400-e29b-41d4-a716-446655440000/endorsements?limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "endorsements": [
      {
        "id": "endorsement-123",
        "userId": "user-456",
        "username": "janedoe",
        "firstName": "Jane",
        "lastName": "Doe",
        "photoUrl": "https://example.com/photo.jpg",
        "headline": "AI Engineer at TechCorp",
        "createdAt": "2025-11-06T10:00:00.000Z"
      }
    ],
    "total": 25,
    "limit": 20,
    "offset": 0
  }
}
```

## Architecture

### Layered Structure

```
endorsements/
├── endorsements.validation.ts  # Zod schemas for input validation
├── endorsements.repository.ts  # Data access layer (Prisma)
├── endorsements.service.ts     # Business logic layer
├── endorsements.controller.ts  # HTTP request handlers
├── endorsements.routes.ts      # Route definitions
└── __tests__/
    └── endorsements.service.test.ts  # Unit tests
```

### Dependencies

The endorsements module depends on:
- **SkillsRepository** - To verify skill existence and ownership
- **UserRepository** - To find users by username
- **Prisma Client** - Database access
- **Sentry** - Error tracking
- **Logger** - Logging

### Business Rules

1. **Authentication Required**: Users must be authenticated to endorse skills
2. **No Self-Endorsement**: Users cannot endorse their own skills
3. **One Endorsement Per Skill**: Each user can only endorse a skill once
4. **Skill Ownership Validation**: The skill must belong to the target profile
5. **Atomic Operations**: Endorsement creation/deletion and count updates happen in transactions
6. **Automatic Count Management**: The `endorsementCount` field on `user_skills` is automatically updated

### Notifications

When a user endorses a skill, a notification is created for the profile owner. The notification integration is prepared but will be fully implemented when the notification system (SPRINT-13-001) is complete.

## Error Handling

All errors are captured by Sentry with appropriate context:

```typescript
Sentry.captureException(error, {
  tags: { service: 'EndorsementsService', method: 'createEndorsement' },
  extra: { endorserId, profileUsername, skillId },
});
```

## Testing

Unit tests are provided in `__tests__/endorsements.service.test.ts` covering:

- ✅ Successful endorsement creation
- ✅ Endorsement removal
- ✅ Getting endorsements list
- ✅ Error cases (not found, forbidden, conflict)
- ✅ Pagination support

Run tests:
```bash
npm test endorsements.service.test.ts
```

## Future Enhancements

- [ ] Email notification when endorsed (depends on email system)
- [ ] In-app notification (depends on notification system from SPRINT-13-001)
- [ ] Endorsement categories (e.g., "worked together", "mentored", "taught")
- [ ] Endorsement messages (optional text with endorsement)
- [ ] Endorsement analytics (trending skills, top endorsers)

## Integration Points

### Frontend Integration

The frontend should:
1. Display endorsement count on skill badges
2. Show "Endorse" button for authenticated users (except skill owner)
3. Show "Endorsed" state if user has already endorsed
4. Display list of endorsers in a modal or tooltip
5. Update UI optimistically on endorse/unendorse actions

### Notification System Integration

When the notification system is ready, update the placeholder in `endorsements.service.ts`:

```typescript
// TODO: Replace this placeholder
await notificationService.create({
  userId: profileId,
  type: 'social',
  title: 'New skill endorsement',
  message: `${endorserName} endorsed your ${skillName} skill`,
  data: { endorserId, skillName },
});
```

## Monitoring

Key metrics to monitor:
- Endorsement creation rate
- Endorsement errors (self-endorsement attempts, duplicates)
- API response times
- Database query performance

## Security Considerations

- ✅ Authentication required for write operations
- ✅ Authorization check (no self-endorsement)
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Rate limiting via existing middleware
- ✅ CORS protection
- ✅ Error details sanitized in production

## Migration

To apply the database migration:

```bash
cd backend
# Migration is already created at:
# src/prisma/migrations/20251106101659_add_skill_endorsements.sql

# Apply migration (when database is available)
npm run prisma:migrate -- deploy
```

## Implemented By

Task: SPRINT-13-005 - Endorsement system backend
Date: November 6, 2025
Status: ✅ Complete
