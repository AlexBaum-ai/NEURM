# Profile Views Feature

This document describes the "Who Viewed My Profile" feature implementation.

## Overview

The Profile Views feature allows users to track who has viewed their profile. This is a **premium feature** - only users with premium, admin, or company roles can see who viewed their profile.

## Key Features

1. **Profile View Tracking** - Tracks when a user views another user's profile
2. **24-Hour Deduplication** - Only one view per viewer per day is tracked
3. **Anonymous Views** - Premium viewers can view profiles anonymously (paid feature)
4. **Privacy Controls** - Users can disable profile view tracking via privacy settings
5. **Premium-Only Access** - Only premium users can see who viewed their profile
6. **Last 30 Days** - View history is limited to the last 30 days
7. **Viewer Details** - Includes viewer name, photo, and company (for recruiters)

## Database Schema

### ProfileView Model

```prisma
model ProfileView {
  id         String   @id @default(uuid())
  profileId  String   @map("profile_id")
  viewerId   String   @map("viewer_id")
  viewerType String   @default("recruiter") @map("viewer_type") @db.VarChar(50)
  companyId  String?  @map("company_id")
  anonymous  Boolean  @default(false)
  viewedAt   DateTime @default(now()) @map("viewed_at") @db.Timestamptz(3)

  profile Profile @relation(fields: [profileId], references: [userId], onDelete: Cascade)
  viewer  User    @relation("ProfileViewedBy", fields: [viewerId], references: [id], onDelete: Cascade)
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  @@index([profileId])
  @@index([viewerId])
  @@index([companyId])
  @@index([viewedAt])
  @@index([viewerId, profileId, viewedAt(sort: Desc)], name: "idx_profile_views_dedup")
  @@map("profile_views")
}
```

### Privacy Settings

Profile view tracking can be controlled via the `ProfilePrivacySetting` model:

```prisma
model ProfilePrivacySetting {
  id         String            @id @default(uuid())
  userId     String            @map("user_id")
  section    String            @db.VarChar(50)  // 'profile_views'
  visibility PrivacyVisibility @default(public)
  updatedAt  DateTime          @updatedAt @map("updated_at") @db.Timestamptz(3)
}
```

Privacy levels:
- `public` - View tracking enabled (default)
- `private` - View tracking disabled
- `community` - Only authenticated users
- `recruiters` - Only recruiters

## API Endpoints

### 1. Track Profile View

```http
POST /api/v1/profiles/:username/view
```

**Authentication**: Required

**Request Body**:
```json
{
  "anonymous": false  // Optional, default: false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile view tracked successfully"
}
```

**Behavior**:
- Tracks a profile view
- Deduplicates views (one per viewer per 24h)
- Respects privacy settings
- Does not track views on own profile
- Records company ID for recruiters

**Rate Limit**: Standard API rate limit

---

### 2. Get My Profile Viewers (Premium Only)

```http
GET /api/v1/profiles/me/views?page=1&limit=20
```

**Authentication**: Required (Premium users only)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (1-100, default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalViews": 150,
    "uniqueViewers": 75,
    "views": [
      {
        "id": "view-id",
        "viewedAt": "2025-11-06T10:30:00.000Z",
        "anonymous": false,
        "viewer": {
          "username": "recruiter1",
          "displayName": "Jane Recruiter",
          "avatarUrl": "https://example.com/avatar.jpg",
          "company": {
            "name": "Tech Corp"
          }
        }
      },
      {
        "id": "view-id-2",
        "viewedAt": "2025-11-05T14:20:00.000Z",
        "anonymous": true,
        "viewer": null  // Anonymous view - details hidden
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

**Error Responses**:
- `403` - Not a premium user
- `401` - Not authenticated

**Rate Limit**: Standard API rate limit

---

### 3. Get Profile View Count

```http
GET /api/v1/profiles/:username/view-count
```

**Authentication**: Not required (Public endpoint)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalViews": 150
  }
}
```

**Behavior**:
- Returns total view count for a profile
- Available to all users (public endpoint)
- Can be displayed on profile pages

**Rate Limit**: Standard API rate limit

---

## Architecture

### Layered Architecture

```
Routes (profiles.routes.ts)
    ↓
Controller (profileViews.controller.ts)
    ↓
Service (profileViews.service.ts)
    ↓
Repository (profileViews.repository.ts)
    ↓
Database (Prisma)
```

### Key Components

1. **ProfileViewsRepository** - Data access layer
   - `trackProfileView()` - Create view with deduplication
   - `getProfileViewers()` - Get viewers with pagination
   - `getTotalViewCount()` - Get total view count
   - `getUniqueViewersCount()` - Get unique viewers (30 days)
   - `hasPremiumAccess()` - Check premium status
   - `isViewTrackingEnabled()` - Check privacy settings

2. **ProfileViewsService** - Business logic layer
   - `trackProfileView()` - Handle view tracking with validation
   - `getMyProfileViewers()` - Get viewers (premium only)
   - `getProfileViewCount()` - Get view count
   - `mapViewToResponse()` - Map to DTO (handles anonymous views)

3. **ProfileViewsController** - HTTP request handling
   - `trackProfileView()` - POST endpoint handler
   - `getMyProfileViewers()` - GET viewers endpoint handler
   - `getProfileViewCount()` - GET count endpoint handler

4. **Validation Schemas** - Zod validation
   - `trackProfileViewSchema` - Validate username and anonymous flag
   - `getMyProfileViewersSchema` - Validate pagination params
   - `getProfileViewCountSchema` - Validate username param

## Features in Detail

### 1. 24-Hour Deduplication

Views are deduplicated to prevent spam and provide accurate metrics:

```typescript
// Check if viewer already viewed this profile today
const today = new Date();
today.setHours(0, 0, 0, 0);

const existingView = await this.prisma.profileView.findFirst({
  where: {
    profileId,
    viewerId,
    viewedAt: {
      gte: today,
    },
  },
});

if (existingView) {
  return null; // View already exists
}
```

The deduplication is based on calendar day (midnight to midnight), not a rolling 24-hour window.

### 2. Anonymous Views

Premium viewers can view profiles anonymously:

```typescript
// When tracking view
await trackProfileView(username, viewerId, anonymous: true);

// When retrieving viewers
if (view.anonymous) {
  return {
    id: view.id,
    viewedAt: view.viewedAt,
    anonymous: true,
    viewer: null, // Hide viewer details
  };
}
```

Anonymous views still count toward view statistics but hide the viewer's identity.

### 3. Privacy Settings

Users can control profile view tracking via privacy settings:

```typescript
// Check privacy setting
const privacySetting = await prisma.profilePrivacySetting.findFirst({
  where: {
    userId,
    section: 'profile_views',
  },
});

// If visibility is 'private', view tracking is disabled
if (privacySetting?.visibility === 'private') {
  return false;
}
```

### 4. Premium-Only Access

Only premium users can see who viewed their profile:

```typescript
// Check premium access
const hasPremiumAccess = await repository.hasPremiumAccess(userId);

if (!hasPremiumAccess) {
  throw new ForbiddenError(
    'This feature is only available for premium users.'
  );
}
```

Premium roles: `premium`, `admin`, `company`

### 5. Last 30 Days Filter

View history is limited to the last 30 days:

```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const views = await prisma.profileView.findMany({
  where: {
    profileId,
    viewedAt: {
      gte: thirtyDaysAgo,
    },
  },
});
```

## Usage Examples

### Frontend Integration

```typescript
// Track profile view when user visits a profile
const trackView = async (username: string, anonymous: boolean = false) => {
  try {
    const response = await fetch(`/api/v1/profiles/${username}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ anonymous }),
    });

    const result = await response.json();
    console.log(result.message);
  } catch (error) {
    console.error('Failed to track view:', error);
  }
};

// Get who viewed my profile (premium users only)
const getMyViewers = async (page: number = 1, limit: number = 20) => {
  try {
    const response = await fetch(
      `/api/v1/profiles/me/views?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to get viewers:', error);
  }
};

// Display profile view count
const getViewCount = async (username: string) => {
  try {
    const response = await fetch(`/api/v1/profiles/${username}/view-count`);
    const result = await response.json();
    return result.data.totalViews;
  } catch (error) {
    console.error('Failed to get view count:', error);
  }
};
```

## Testing

### Unit Tests

Located in `__tests__/profileViews.service.test.ts`

Tests cover:
- Track profile view successfully
- Don't track view on own profile
- Handle view tracking disabled
- Handle duplicate views (24h deduplication)
- Handle profile not found
- Track anonymous views
- Return viewers for premium users
- Throw error for non-premium users
- Hide viewer details for anonymous views
- Validate pagination parameters
- Return profile view count

### Integration Tests

Located in `__tests__/profileViews.integration.test.ts`

Tests cover:
- POST /api/v1/profiles/:username/view
- GET /api/v1/profiles/me/views
- GET /api/v1/profiles/:username/view-count
- Authentication requirements
- Premium access checks
- Anonymous view handling
- Pagination validation

## Error Handling

All errors are captured with Sentry:

```typescript
try {
  // Business logic
} catch (error) {
  Sentry.captureException(error, {
    tags: { service: 'ProfileViewsService', method: 'trackProfileView' },
    extra: { username, viewerId, anonymous },
  });
  logger.error(`Failed to track profile view:`, error);
  throw error;
}
```

## Performance Considerations

1. **Indexes**: Multiple indexes on `profile_views` table for fast queries
2. **Pagination**: Always use pagination for large result sets
3. **Caching**: Consider caching view counts for frequently accessed profiles
4. **Deduplication**: Index-based deduplication prevents duplicate views efficiently

## Future Enhancements

1. **Weekly/Monthly Summaries** - Email digests of profile viewers
2. **View Trends** - Charts showing view trends over time
3. **Viewer Insights** - Analytics on viewer demographics
4. **Export Viewers** - CSV export of profile viewers
5. **View Notifications** - Real-time notifications when profile is viewed
6. **Search Filters** - Filter viewers by company, role, date range

## Related Documentation

- [Profile API Documentation](./README.md)
- [Privacy Settings](../privacy/README.md)
- [Premium Features](../../docs/premium-features.md)
