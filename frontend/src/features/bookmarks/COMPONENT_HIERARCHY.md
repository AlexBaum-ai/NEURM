# Bookmarks Feature - Component Hierarchy

## Visual Structure

```
BookmarksPage
├── Container (MUI)
│   ├── Typography (Page Title: "My Bookmarks")
│   └── Grid
│       ├── Grid Item (Sidebar - 3 columns)
│       │   └── CollectionSidebar
│       │       ├── Typography ("Collections")
│       │       ├── Button ("New Collection")
│       │       ├── List
│       │       │   ├── CollectionItem ("All Bookmarks")
│       │       │   └── CollectionItem (for each collection)
│       │       │       ├── ListItemButton
│       │       │       │   ├── Icon (Folder/FolderSpecial)
│       │       │   │   ├── ListItemText
│       │       │       │   └── Chip (bookmark count)
│       │       │       └── IconButton (MoreVert)
│       │       │           └── Menu
│       │       │               ├── MenuItem (Edit)
│       │       │               └── MenuItem (Delete)
│       │       └── Alert (if 450+ bookmarks)
│       │
│       └── Grid Item (Main Content - 9 columns)
│           ├── TextField (Search)
│           └── BookmarkList
│               ├── Typography (bookmark count)
│               └── (for each bookmark)
│                   └── BookmarkCard
│                       ├── CardMedia (thumbnail)
│                       ├── CardContent
│                       │   ├── Typography (title)
│                       │   ├── Typography (summary)
│                       │   ├── Box (metadata)
│                       │   │   ├── Avatar (author)
│                       │   │   ├── Chip (category)
│                       │   │   ├── Box (reading time)
│                       │   │   └── Box (saved time)
│                       │   └── Box (notes display/edit)
│                       │       ├── TextField (if editing)
│                       │       │   └── Button group (Save/Cancel)
│                       │       └── Box (if notes exist)
│                       └── IconButton (MoreVert)
│                           └── Menu
│                               ├── MenuItem (Edit Notes)
│                               ├── MenuItem (Move to Collection)
│                               │   └── Sub-Menu (collections)
│                               └── MenuItem (Remove)
│
├── CreateCollectionModal
│   ├── DialogTitle
│   ├── DialogContent
│   │   ├── Alert (if error)
│   │   ├── TextField (name)
│   │   ├── TextField (description)
│   │   └── FormControlLabel (Switch for public)
│   └── DialogActions
│       ├── Button (Cancel)
│       └── Button (Create)
│
├── EditCollectionModal
│   ├── DialogTitle
│   ├── DialogContent
│   │   ├── Alert (if error)
│   │   ├── TextField (name)
│   │   ├── TextField (description)
│   │   └── FormControlLabel (Switch for public)
│   └── DialogActions
│       ├── Button (Cancel)
│       └── Button (Save)
│
└── Dialog (Delete Confirmation)
    ├── DialogTitle
    ├── DialogContent
    │   └── Typography (warning)
    └── DialogActions
        ├── Button (Cancel)
        └── Button (Delete)
```

## Data Flow

```
User Action
    ↓
Component Handler
    ↓
Custom Hook (useBookmarks, useCollections)
    ↓
React Query Mutation/Query
    ↓
API Client (bookmarksApi)
    ↓
Backend API
    ↓
Response
    ↓
React Query Cache Update
    ↓
Component Re-render (via Suspense)
    ↓
UI Update
```

## State Management

### Server State (React Query)
- `['bookmarks', { collectionId, page, limit }]` - Bookmark list
- `['collections']` - Collection list

### Local State (useState)
- `selectedCollectionId` - Currently active collection filter
- `searchQuery` - Search input value
- `createModalOpen` - Create modal visibility
- `editModalOpen` - Edit modal visibility
- `deleteDialogOpen` - Delete dialog visibility
- `selectedCollection` - Collection being edited/deleted
- `isEditingNotes` - Note editing mode per card
- `notes` - Note input value per card
- `anchorEl` - Menu anchor elements

## Component Responsibilities

### BookmarksPage
- **Role:** Page orchestrator
- **Responsibilities:**
  - Route entry point
  - Layout management
  - Modal state management
  - Collection selection state
  - Coordinating child components

### CollectionSidebar
- **Role:** Navigation sidebar
- **Responsibilities:**
  - Display collection list
  - Handle collection selection
  - Trigger create/edit/delete actions
  - Show bookmark limit warning

### CollectionItem
- **Role:** Individual collection display
- **Responsibilities:**
  - Display collection name and count
  - Show active state
  - Provide edit/delete menu
  - Handle click to select

### BookmarkList
- **Role:** Bookmark container
- **Responsibilities:**
  - Fetch and display bookmarks
  - Handle loading state (via Suspense)
  - Show empty state
  - Display bookmark count

### BookmarkCard
- **Role:** Individual bookmark display
- **Responsibilities:**
  - Display article information
  - Show/edit notes
  - Provide action menu
  - Handle remove/move/edit operations

### CreateCollectionModal
- **Role:** Collection creation form
- **Responsibilities:**
  - Form validation
  - Character counting
  - API submission
  - Error handling

### EditCollectionModal
- **Role:** Collection editing form
- **Responsibilities:**
  - Pre-fill with current values
  - Form validation
  - API submission
  - Error handling

## Hook Usage Patterns

### Query Hooks (Fetching)
```typescript
// Suspend while loading, throw on error
const { data } = useSuspenseQuery(options);
```

### Mutation Hooks (Updating)
```typescript
const mutation = useMutation({
  mutationFn: apiCall,
  onMutate: optimisticUpdate,  // Instant UI feedback
  onError: rollback,            // Revert on failure
  onSettled: invalidateCache,   // Refresh after complete
});
```

## Event Flow Examples

### Creating a Collection

1. User clicks "New Collection" button
2. `setCreateModalOpen(true)` called
3. CreateCollectionModal renders
4. User fills form and clicks "Create"
5. `createCollection.mutateAsync()` called
6. API request sent
7. On success:
   - Modal closes
   - Collections cache invalidated
   - Sidebar re-fetches and displays new collection
8. On error:
   - Error message shown in modal
   - User can retry

### Removing a Bookmark

1. User clicks "Remove Bookmark" in menu
2. Confirmation dialog shows
3. User confirms
4. `removeBookmark.mutate(slug)` called
5. Optimistic update:
   - Bookmark immediately removed from UI
   - Bookmark count decremented
6. API request sent
7. On success:
   - Changes confirmed
   - Caches invalidated
8. On error:
   - UI reverted to previous state
   - Error notification shown

### Searching Bookmarks

1. User types in search field
2. `setSearchQuery(value)` called
3. `useBookmarks` hook filters bookmarks client-side
4. Filtered results immediately displayed
5. No API call (instant feedback)

## Styling Patterns

All styling uses Material-UI's `sx` prop:

```typescript
<Box sx={{
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  mb: 2,
}}>
```

**Benefits:**
- Type-safe styling
- Theme integration
- Responsive props
- No separate CSS files needed

## Error Boundaries

Errors caught at component level:
- React Query handles fetch errors
- Form validation prevents bad inputs
- Confirmation dialogs prevent accidental deletions
- Error messages shown inline

## Loading States

Handled via Suspense boundaries:
- Page-level: `<PageLoader />`
- Component-level: `<Skeleton />` components
- No manual loading spinners

## Responsive Design

Grid breakpoints:
- `xs={12}` - Mobile: full width
- `md={3}` - Desktop: 3 columns for sidebar
- `md={9}` - Desktop: 9 columns for content

## Accessibility Features

- Semantic HTML via Material-UI
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in modals
- Color contrast compliance
- Screen reader announcements

---

This hierarchy provides a clear mental model of how components are structured and interact within the bookmarks feature.
