# Revision History UI - SPRINT-3-005

## Overview

The Revision History UI allows users to view, compare, and restore previous versions of articles. This feature is essential for content management and provides a complete audit trail of article changes.

## Components

### 1. RevisionHistory

Main component that orchestrates the revision history functionality.

**Features:**
- Full-screen modal dialog with responsive design
- Sidebar with revision timeline
- Main content area for preview or diff view
- Compare mode for side-by-side comparison
- Restore functionality with confirmation dialog
- Loading states with Suspense boundary
- Toast notifications for actions

**Props:**
```typescript
interface RevisionHistoryProps {
  articleId: string;
  onRevisionRestored?: (revision: ArticleRevision) => void;
}
```

**Usage:**
```tsx
import { RevisionHistory } from '@/features/news/components';

<RevisionHistory
  articleId={article.id}
  onRevisionRestored={(revision) => {
    // Handle restored revision
    console.log('Restored:', revision);
  }}
/>
```

### 2. RevisionTimeline

Displays list of revisions in chronological order with author information.

**Features:**
- Timeline view with timestamps
- Author avatar and username
- Relative time display (e.g., "2 hours ago")
- Revision number indicator
- "Current" badge for latest revision
- Loading skeleton states
- Empty state handling

**Props:**
```typescript
interface RevisionTimelineProps {
  revisions: ArticleRevision[];
  selectedRevisionId: string | null;
  onSelectRevision: (revision: ArticleRevision) => void;
  isLoading?: boolean;
}
```

### 3. RevisionDiff

Side-by-side comparison view for two revisions.

**Features:**
- Text-based diff using `diff` library
- Green highlighting for additions
- Red highlighting for removals
- Unchanged content display
- Responsive grid layout
- Scrollable content areas
- Visual legend for changes
- Support for title, content, and summary fields

**Props:**
```typescript
interface RevisionDiffProps {
  oldRevision: ArticleRevision;
  newRevision: ArticleRevision;
  field?: 'title' | 'content' | 'summary';
}
```

## API Integration

### Endpoints Used

All endpoints are implemented in `/features/news/api/revisions.ts`:

```typescript
// Get all revisions for an article
GET /api/v1/articles/:id/revisions
Response: ArticleRevision[]

// Get specific revision
GET /api/v1/articles/:id/revisions/:revisionId
Response: ArticleRevision

// Compare two revisions
GET /api/v1/articles/:id/revisions/compare/:from/:to
Response: RevisionComparison

// Restore a revision
POST /api/v1/articles/:id/revisions/:revisionId/restore
Response: RevisionRestoreResponse
```

## Types

Located in `/features/news/types/revision.ts`:

```typescript
interface ArticleRevision {
  id: string;
  articleId: string;
  revisionNumber: number;
  title: string;
  content: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  createdBy: {
    id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
}

interface RevisionComparison {
  from: ArticleRevision;
  to: ArticleRevision;
  changes: {
    title: DiffResult[];
    content: DiffResult[];
    summary: DiffResult[];
  };
}

interface DiffResult {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumber?: number;
}
```

## Usage Example

### In Article Edit Page

```tsx
import RevisionHistory from '@/features/news/components/RevisionHistory';

const ArticleEditPage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(/* ... */);

  const handleRevisionRestored = (revision: ArticleRevision) => {
    // Update form with restored content
    setArticle({
      ...article,
      title: revision.title,
      content: revision.content,
      summary: revision.summary,
    });
  };

  return (
    <div>
      {/* Header with RevisionHistory button */}
      <div className="flex items-center justify-between">
        <h1>Edit Article</h1>
        <RevisionHistory
          articleId={id}
          onRevisionRestored={handleRevisionRestored}
        />
      </div>

      {/* Article form */}
      <form>
        {/* ... */}
      </form>
    </div>
  );
};
```

## Acceptance Criteria Verification

✅ **1. Revision history panel in article editor sidebar**
- Implemented as modal dialog with sidebar panel
- Timeline displayed in left sidebar

✅ **2. Timeline view showing all revisions with timestamps**
- RevisionTimeline component shows all revisions
- Displays relative timestamps (e.g., "2 hours ago")
- Absolute timestamp on hover

✅ **3. Click revision to preview that version**
- Clicking a revision in timeline shows preview
- Full content display with title, summary, and content

✅ **4. Side-by-side diff view comparing revisions**
- Compare mode with RevisionDiff component
- Side-by-side layout with old/new versions
- Supports mobile with vertical stacking

✅ **5. Restore button with confirmation dialog**
- Restore button shown for non-current revisions
- AlertDialog confirmation before restore
- Clear warning about action

✅ **6. Show who made each revision**
- Author username displayed in timeline
- Avatar image if available
- User icon fallback

✅ **7. Highlight changes (additions green, deletions red)**
- Green background for additions (+ prefix)
- Red background for deletions (- prefix)
- Visual legend explaining colors

✅ **8. Responsive on mobile devices**
- Full-screen modal on mobile
- Sidebar converts to vertical layout
- Side-by-side diff stacks vertically on small screens
- Touch-friendly buttons and interactions

✅ **9. Loading states for async operations**
- Suspense boundary with skeleton loader
- Loading spinner during restore
- Disabled state for buttons during operations

✅ **10. Success/error messages for restore actions**
- Toast notification on successful restore
- Error toast with message on failure
- Query invalidation to refresh data

## Responsive Design

### Desktop (lg and above)
- Two-column layout: sidebar (320px) + main content
- Side-by-side diff in 2-column grid
- Full modal with margins

### Tablet (md - lg)
- Vertical layout with sidebar on top
- Side-by-side diff may stack depending on content
- Reduced margins

### Mobile (sm and below)
- Full-screen modal (inset-0)
- Vertical layout for all content
- Single column diff view
- Touch-optimized buttons

## Dependencies

- **diff** - Text comparison library for generating diffs
- **@tanstack/react-query** - Data fetching and caching
- **@radix-ui/react-dialog** - Accessible modal dialog
- **@radix-ui/react-alert-dialog** - Confirmation dialogs
- **lucide-react** - Icons
- **date-fns** - Date formatting

## Testing

### Manual Testing Checklist

- [ ] Open revision history modal
- [ ] View all revisions in timeline
- [ ] Click different revisions to preview
- [ ] Enable compare mode
- [ ] Select two revisions to compare
- [ ] View title, summary, and content diffs
- [ ] Restore a previous revision
- [ ] Confirm restore action works
- [ ] Test on mobile device
- [ ] Verify loading states
- [ ] Check error handling (network errors)
- [ ] Verify toast notifications

### Automated Testing

Unit tests can be added for:
- RevisionTimeline component rendering
- RevisionDiff diff algorithm
- API functions
- Edge cases (empty revisions, single revision)

## Future Enhancements

1. **Keyboard Navigation**
   - Arrow keys to navigate between revisions
   - Keyboard shortcuts for compare mode
   - Escape to close modal

2. **Performance**
   - Virtual scrolling for large revision lists
   - Lazy loading of revision content
   - Debounced diff calculations

3. **Features**
   - Export revision as file
   - Email revision to team
   - Revision comments/notes
   - Bulk restore operations
   - Revision search/filter

4. **Analytics**
   - Track revision views
   - Monitor restore frequency
   - Popular revision patterns

## Notes

- Revisions are read-only except for restore action
- Only last 20 revisions are kept per article (backend policy)
- Restore creates a new revision with restored content
- All actions require authentication
- Admins can view all revisions, authors can view own

## Route

The revision history UI is integrated into the Article Edit Page:

```
/admin/articles/:id/edit
```

Navigate to this route to see the revision history in action.

## Support

For issues or questions:
1. Check backend API is running and SPRINT-3-004 is complete
2. Verify article ID is valid
3. Check browser console for errors
4. Ensure user has permissions to view/restore revisions
