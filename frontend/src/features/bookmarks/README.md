# Bookmarks Feature

This feature provides a comprehensive bookmarks management system for Neurmatic users to save, organize, and manage their favorite articles.

## Overview

The bookmarks feature allows users to:
- Save articles for later reading
- Organize bookmarks into custom collections
- Add personal notes to bookmarks
- Search through saved bookmarks
- Move bookmarks between collections
- Track bookmark limits (max 500 per user)

## File Structure

```
bookmarks/
├── api/
│   └── bookmarksApi.ts          # API client for bookmarks endpoints
├── components/
│   ├── BookmarkCard.tsx         # Individual bookmark card with actions
│   ├── BookmarkList.tsx         # List of bookmarks with empty state
│   ├── CollectionItem.tsx       # Single collection sidebar item
│   ├── CollectionSidebar.tsx    # Collections sidebar with navigation
│   ├── CreateCollectionModal.tsx # Modal for creating new collections
│   ├── EditCollectionModal.tsx  # Modal for editing collections
│   └── index.ts                 # Component exports
├── hooks/
│   ├── useBookmarks.ts          # Hooks for bookmark operations
│   ├── useCollections.ts        # Hooks for collection management
│   └── index.ts                 # Hook exports
├── pages/
│   └── BookmarksPage.tsx        # Main bookmarks page
├── types/
│   └── index.ts                 # TypeScript types
└── README.md                    # This file
```

## Components

### BookmarksPage

The main page component that orchestrates the entire bookmarks UI.

**Features:**
- Two-column layout (sidebar + main content)
- Search functionality
- Collection filtering
- Modal management for create/edit/delete operations

**Route:** `/bookmarks`

### CollectionSidebar

Displays all bookmark collections with counts.

**Features:**
- "All Bookmarks" view showing total count
- List of user collections
- Create collection button
- Edit/delete actions per collection (except default)
- Warning indicator when approaching 500 bookmark limit

### BookmarkCard

Displays a single bookmark with rich information and actions.

**Features:**
- Article thumbnail, title, summary
- Author information with avatar
- Category chip
- Reading time estimate
- Time when bookmarked
- Personal notes display/edit
- Actions menu (edit notes, move to collection, remove)

### BookmarkList

Container for bookmark cards with loading and empty states.

**Features:**
- Suspense boundary with skeleton loader
- Empty state with helpful message
- Bookmark count display

### CreateCollectionModal

Modal for creating new bookmark collections.

**Features:**
- Collection name (required, 3-50 chars)
- Description (optional, max 200 chars)
- Public/private toggle
- Character count indicators
- Validation feedback

### EditCollectionModal

Modal for editing existing collections.

**Features:**
- Pre-filled form with current values
- Same validation as create modal
- Cannot edit default "Read Later" collection

## Hooks

### useBookmarks

Main hook for fetching and managing bookmarks.

```typescript
const {
  bookmarks,          // Filtered bookmarks array
  totalBookmarks,     // Total count
  pagination,         // Pagination metadata
  isLoading,          // Loading state
  searchQuery,        // Current search query
  onSearch,           // Search handler
  page,               // Current page
  onPageChange,       // Page change handler
} = useBookmarks(collectionId);
```

**Features:**
- Client-side search across title, summary, and notes
- Pagination support
- Optimistic updates on mutations
- Automatic cache invalidation

### useRemoveBookmark

Mutation hook for removing bookmarks.

```typescript
const removeBookmark = useRemoveBookmark();
removeBookmark.mutate(slug);
```

**Features:**
- Optimistic UI updates
- Automatic rollback on error
- Cache invalidation for both bookmarks and collections

### useUpdateBookmark

Mutation hook for updating bookmark notes or moving to different collection.

```typescript
const updateBookmark = useUpdateBookmark();
updateBookmark.mutate({
  id: bookmarkId,
  data: { notes: 'New notes', collectionId: 'collection-id' }
});
```

### useCollections

Hook for fetching bookmark collections.

```typescript
const { data } = useCollections();
const collections = data.data.collections;
```

### useCreateCollection

Mutation hook for creating new collections.

```typescript
const createCollection = useCreateCollection();
await createCollection.mutateAsync({
  name: 'AI Research',
  description: 'Articles about AI',
  isPublic: false
});
```

### useUpdateCollection

Mutation hook for updating collection metadata.

```typescript
const updateCollection = useUpdateCollection();
await updateCollection.mutateAsync({
  id: collectionId,
  data: { name: 'New Name' }
});
```

### useDeleteCollection

Mutation hook for deleting collections.

```typescript
const deleteCollection = useDeleteCollection();
await deleteCollection.mutateAsync(collectionId);
```

**Note:** Deleting a collection moves its bookmarks to the default "Read Later" collection.

## API Endpoints

### GET /users/me/bookmarks
Fetch user's bookmarks with optional filtering.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page (default: 20)
- `collectionId` - Filter by collection

### GET /users/me/bookmark-collections
Fetch all user's collections.

### POST /users/me/bookmark-collections
Create a new collection.

**Body:**
```json
{
  "name": "AI Research",
  "description": "Articles about AI research",
  "isPublic": false
}
```

### PATCH /users/me/bookmark-collections/:id
Update collection metadata.

### DELETE /users/me/bookmark-collections/:id
Delete a collection (moves bookmarks to default).

### PATCH /users/me/bookmarks/:id
Update bookmark (move to collection or update notes).

**Body:**
```json
{
  "collectionId": "new-collection-id",
  "notes": "Personal notes about this article"
}
```

### DELETE /news/articles/:slug/bookmark
Remove a bookmark.

## Types

### Bookmark
```typescript
interface Bookmark {
  id: string;
  article: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    featuredImageUrl?: string;
    readingTimeMinutes: number;
    publishedAt: string;
    author: {
      username: string;
      profile: {
        avatarUrl?: string;
        displayName?: string;
      };
    };
    category: {
      slug: string;
      name: string;
    };
  };
  collection: {
    id: string;
    name: string;
  };
  notes?: string;
  createdAt: string;
}
```

### BookmarkCollection
```typescript
interface BookmarkCollection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isDefault: boolean;
  bookmarkCount: number;
  createdAt: string;
}
```

## Usage Example

```typescript
import { BookmarksPage } from '@/features/bookmarks/pages/BookmarksPage';

// In your router
{
  path: 'bookmarks',
  element: <BookmarksPage />
}
```

## Features & Constraints

### Limits
- Maximum 500 bookmarks per user
- Warning shown at 450+ bookmarks
- Collection name: 3-50 characters
- Collection description: max 200 characters

### Default Collection
- Every user has a default "Read Later" collection
- Cannot be deleted or renamed
- Bookmarks from deleted collections are moved here

### Search
- Client-side search (fast, no API calls)
- Searches across: article title, summary, and bookmark notes
- Case-insensitive matching

### Permissions
- Users can only access their own bookmarks
- Public collections may be visible to others (future feature)

## Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `@mui/material` - UI components
- `react-router-dom` - Navigation
- `date-fns` - Date formatting

## Future Enhancements

- [ ] Drag-and-drop to reorder bookmarks within collections
- [ ] Bulk operations (move multiple, delete multiple)
- [ ] Export bookmarks (JSON, CSV)
- [ ] Share collections publicly
- [ ] Collection covers/thumbnails
- [ ] Tags for bookmarks (in addition to collections)
- [ ] Sort bookmarks (by date, title, reading time)
- [ ] Archive bookmarks (soft delete)
- [ ] Bookmark statistics and insights

## Testing

The components use Suspense boundaries for loading states. When testing:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { BookmarksPage } from './BookmarksPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

render(
  <QueryClientProvider client={queryClient}>
    <BookmarksPage />
  </QueryClientProvider>
);
```

## Related Sprint Tasks

- **SPRINT-2-004**: Bookmarks API (dependency)
- **SPRINT-2-010**: Bookmarks page and collections UI (this task)

## Acceptance Criteria

✅ Bookmarks page at /bookmarks
✅ Collections sidebar (list all collections)
✅ Default 'Read Later' collection
✅ Create collection modal
✅ Edit collection (rename, delete)
✅ Bookmarked articles list (filterable by collection)
✅ Notes display and edit per bookmark
✅ Move bookmark to different collection (menu)
✅ Remove bookmark button
✅ Empty state when no bookmarks
✅ Search within bookmarks
✅ Article count per collection
✅ Max 500 bookmarks indicator

## Status

✅ **Completed** - All acceptance criteria met and routes configured.
