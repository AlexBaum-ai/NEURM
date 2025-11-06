# Following System Feature

## Overview

The Following System allows users to follow other users, companies, categories, tags, and LLM models. Users can view an activity feed of content from entities they follow, manage their following/followers lists, and discover new content through follow suggestions.

## Features Implemented

### 1. **FollowButton Component** (`components/FollowButton.tsx`)
- Reusable follow/unfollow button for any entity type
- Shows follower count
- Optimistic UI updates
- Loading states
- Customizable size and variant
- Works with users, companies, categories, tags, and models

**Usage:**
```tsx
import { FollowButton } from '@/features/follows';

<FollowButton
  entityType="user"
  entityId={123}
  entityName="John Doe"
  followerCount={456}
  showCount={true}
  size="md"
/>
```

### 2. **Following Feed Page** (`pages/FollowingFeedPage.tsx`)
- Route: `/following`
- Shows activity from followed entities
- Filter by content type: All, Articles, Discussions, Jobs
- Infinite scroll pagination
- Empty state with CTA to explore content
- Follow suggestions sidebar

### 3. **Followers Page** (`pages/FollowersPage.tsx`)
- Route: `/profile/:username/followers`
- List of users following the profile
- Follow/unfollow buttons
- User avatars and bios
- Infinite scroll pagination
- Empty state

### 4. **Following Page** (`pages/FollowingPage.tsx`)
- Route: `/profile/:username/following`
- List of entities the user follows
- Filter by entity type: All, Users, Companies, Categories, Tags, Models
- Unfollow buttons
- Entity details and descriptions
- Infinite scroll pagination
- Empty state

### 5. **Activity Feed Item** (`components/ActivityFeedItem.tsx`)
- Card component for displaying feed items
- Shows author, timestamp, content type
- Statistics (views, likes, replies, bookmarks)
- Responsive design
- Links to original content

### 6. **Follow Suggestions** (`components/FollowSuggestions.tsx`)
- Suggests entities to follow based on interests
- Shows reason for suggestion
- Quick follow buttons
- Displayed in sidebar on feed page

## API Integration

All components use the following API endpoints:

- `POST /api/v1/follows` - Create follow
- `DELETE /api/v1/follows/:id` - Unfollow
- `GET /api/v1/users/:id/following` - Get following list
- `GET /api/v1/users/:id/followers` - Get followers list
- `GET /api/v1/following/feed` - Activity feed
- `GET /api/v1/follows/check` - Check follow status
- `GET /api/v1/follows/suggestions` - Get follow suggestions

## Hooks

### `useFollow(entityType, entityId)`
Mutation hook for following an entity. Includes optimistic updates.

### `useUnfollow(followId, entityType, entityId)`
Mutation hook for unfollowing an entity. Includes optimistic updates.

### `useFollowStatus(entityType, entityId)`
Query hook to check if currently following an entity.

### `useFollowing(userId, type?)`
Infinite query hook for getting a user's following list. Supports filtering by entity type.

### `useFollowers(userId)`
Infinite query hook for getting a user's followers list.

### `useActivityFeed(type?)`
Infinite query hook for getting the activity feed. Supports filtering by content type.

### `useFollowSuggestions()`
Query hook for getting follow suggestions.

## Types

See `types/index.ts` for all TypeScript types:
- `Follow` - Follow relationship
- `FollowEntityType` - Supported entity types
- `ActivityFeedItem` - Feed item structure
- `FollowSuggestion` - Suggestion structure
- And more...

## File Structure

```
follows/
├── api/
│   └── followsApi.ts         # API client functions
├── components/
│   ├── FollowButton.tsx      # Reusable follow button
│   ├── ActivityFeedItem.tsx  # Feed item card
│   ├── FollowSuggestions.tsx # Suggestions widget
│   └── index.ts
├── hooks/
│   └── useFollows.ts         # React Query hooks
├── pages/
│   ├── FollowingFeedPage.tsx # Main feed page
│   ├── FollowersPage.tsx     # Followers list
│   ├── FollowingPage.tsx     # Following list
│   └── index.ts
├── types/
│   └── index.ts              # TypeScript types
├── index.ts                  # Main export
└── README.md                 # This file
```

## Technical Implementation

### Optimistic Updates
Follow/unfollow operations use optimistic updates for instant UI feedback:
- Immediately updates UI before API response
- Rolls back on error
- Updates related queries (feed, lists, etc.)

### Code Splitting
All pages use React.lazy() and Suspense for optimal bundle size:
```tsx
const FollowingFeedPage = lazy(() => import('@/features/follows/pages/FollowingFeedPage'));
```

### Infinite Scroll
All lists use TanStack Query's `useInfiniteQuery` for pagination:
- Automatic "Load More" button
- Efficient data fetching
- Cache management

### Responsive Design
- Mobile-first approach
- Horizontal scrolling filters on mobile
- Optimized layouts for all screen sizes
- Touch-friendly buttons

### Accessibility
- ARIA labels on buttons
- Semantic HTML
- Keyboard navigation support
- Screen reader friendly

## Routes Added

```tsx
// Following feed
{
  path: 'following',
  element: <FollowingFeedPage />
}

// Followers list
{
  path: 'profile/:username/followers',
  element: <FollowersPage />
}

// Following list
{
  path: 'profile/:username/following',
  element: <FollowingPage />
}
```

## Usage Examples

### Adding Follow Button to User Profile
```tsx
import { FollowButton } from '@/features/follows';

<FollowButton
  entityType="user"
  entityId={user.id}
  entityName={user.displayName}
  followerCount={user.followerCount}
/>
```

### Adding Follow Button to Company Page
```tsx
import { FollowButton } from '@/features/follows';

<FollowButton
  entityType="company"
  entityId={company.id}
  entityName={company.name}
  followerCount={company.followerCount}
/>
```

### Adding Follow Button to Category Header
```tsx
import { FollowButton } from '@/features/follows';

<FollowButton
  entityType="category"
  entityId={category.id}
  entityName={category.name}
  variant="outline"
  size="sm"
/>
```

## Future Enhancements

- [ ] Privacy settings for followers/following visibility (UI implementation)
- [ ] Follow notification preferences
- [ ] Bulk follow/unfollow operations
- [ ] Export following list
- [ ] Follow analytics (who unfollowed, etc.)
- [ ] Recommended follows based on ML

## Testing

To test the implementation:

1. Navigate to `/following` to see the feed
2. Follow some users/entities using FollowButton
3. Check `/profile/:username/followers` to see followers
4. Check `/profile/:username/following` to see who you follow
5. Filter the feed by content type
6. Test follow/unfollow with network throttling to see optimistic updates

## Dependencies

- React Query (TanStack Query) - Data fetching and caching
- React Router - Routing
- React Hot Toast - Toast notifications
- Axios - HTTP client

## Total Lines of Code

~1,559 lines across 12 files
