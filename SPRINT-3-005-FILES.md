# SPRINT-3-005 File Structure

## Created Files

```
frontend/src/features/news/
├── types/
│   └── revision.ts                          # Type definitions for revisions
├── api/
│   └── revisions.ts                         # API functions for revision operations
├── components/
│   ├── RevisionHistory.tsx                  # Main container component
│   ├── RevisionTimeline.tsx                 # Timeline sidebar component
│   ├── RevisionDiff.tsx                     # Diff comparison component
│   └── REVISION_HISTORY_README.md           # Component documentation
└── pages/
    └── ArticleEditPage.tsx                  # Demo/integration page

frontend/package.json                        # Updated with 'diff' dependency

/SPRINT-3-005-IMPLEMENTATION.md              # This implementation summary
/SPRINT-3-005-FILES.md                       # File structure (this file)
```

## Modified Files

```
frontend/src/features/news/
├── types/
│   └── index.ts                             # Added revision type exports
└── components/
    └── index.ts                             # Added revision component exports

frontend/src/routes/
└── index.tsx                                # Added ArticleEditPage route
```

## File Sizes

```
revision.ts                    ~1.0 KB
revisions.ts                   ~1.5 KB
RevisionHistory.tsx            ~11.0 KB
RevisionTimeline.tsx           ~4.0 KB
RevisionDiff.tsx               ~6.0 KB
ArticleEditPage.tsx            ~7.0 KB
REVISION_HISTORY_README.md     ~7.5 KB
SPRINT-3-005-IMPLEMENTATION.md ~12.0 KB
```

**Total:** ~50 KB of new code + documentation

## Component Hierarchy

```
ArticleEditPage
└── RevisionHistory (Modal)
    ├── Dialog.Overlay
    └── Dialog.Content
        ├── Header
        │   ├── Title & Description
        │   ├── Compare Mode Toggle
        │   └── Close Button
        ├── Content (Flex Layout)
        │   ├── Sidebar (320px)
        │   │   └── RevisionTimeline
        │   │       └── Revision Items (buttons)
        │   │           ├── Avatar
        │   │           ├── Username
        │   │           ├── Timestamp
        │   │           └── Revision Number
        │   └── Main Area (flex-1)
        │       ├── Preview Mode
        │       │   ├── Revision Info
        │       │   ├── Restore Button
        │       │   └── Content Display
        │       └── Compare Mode
        │           └── RevisionDiff
        │               ├── Header (revision info)
        │               ├── Side-by-side Grid
        │               │   ├── Old Version (removals)
        │               │   └── New Version (additions)
        │               └── Legend
        └── AlertDialog (Restore Confirmation)
            ├── Title
            ├── Description
            └── Actions (Cancel / Restore)
```

## Import Graph

```
ArticleEditPage.tsx
  ├─> RevisionHistory.tsx
  │     ├─> RevisionTimeline.tsx
  │     │     └─> types/revision.ts
  │     ├─> RevisionDiff.tsx
  │     │     ├─> types/revision.ts
  │     │     └─> diff (npm package)
  │     ├─> api/revisions.ts
  │     │     ├─> types/revision.ts
  │     │     └─> lib/api.ts
  │     ├─> hooks/useToast.ts
  │     ├─> @tanstack/react-query
  │     ├─> @radix-ui/react-dialog
  │     ├─> @radix-ui/react-alert-dialog
  │     ├─> lucide-react
  │     └─> date-fns
  └─> components/editors/RichTextEditor.tsx
```

## API Endpoint Mapping

```typescript
// From api/revisions.ts

getArticleRevisions(articleId)
  → GET /articles/{articleId}/revisions
  ← ArticleRevision[]

getRevisionById(articleId, revisionId)
  → GET /articles/{articleId}/revisions/{revisionId}
  ← ArticleRevision

compareRevisions(articleId, from, to)
  → GET /articles/{articleId}/revisions/compare/{from}/{to}
  ← RevisionComparison

restoreRevision(articleId, revisionId)
  → POST /articles/{articleId}/revisions/{revisionId}/restore
  ← RevisionRestoreResponse
```

## TypeScript Type Relationships

```typescript
// Core types
ArticleRevision
  ├─ id: string
  ├─ articleId: string
  ├─ revisionNumber: number
  ├─ title: string
  ├─ content: string
  ├─ summary: string | null
  ├─ metadata: Record<string, unknown>
  ├─ createdBy: {
  │    ├─ id: string
  │    ├─ username: string
  │    └─ avatar: string | null
  │  }
  └─ createdAt: string

RevisionComparison
  ├─ from: ArticleRevision
  ├─ to: ArticleRevision
  └─ changes: {
       ├─ title: DiffResult[]
       ├─ content: DiffResult[]
       └─ summary: DiffResult[]
     }

DiffResult
  ├─ type: 'added' | 'removed' | 'unchanged'
  ├─ value: string
  └─ lineNumber?: number

RevisionRestoreResponse
  ├─ success: boolean
  ├─ message: string
  └─ revision: ArticleRevision
```

## Routes Added

```typescript
// In routes/index.tsx

{
  path: 'admin/articles/:id/edit',
  element: (
    <Suspense fallback={<PageLoader />}>
      <ArticleEditPage />
    </Suspense>
  ),
}
```

**Access URL:** `http://vps-1a707765.vps.ovh.net:5173/admin/articles/123/edit`

## CSS Classes Used

### TailwindCSS Utilities
- Layout: `flex`, `grid`, `space-*`, `gap-*`
- Sizing: `w-*`, `h-*`, `max-w-*`, `max-h-*`
- Colors: `bg-*`, `text-*`, `border-*`
- Dark mode: `dark:bg-*`, `dark:text-*`, `dark:border-*`
- Responsive: `sm:*`, `md:*`, `lg:*`
- States: `hover:*`, `focus:*`, `disabled:*`
- Positioning: `fixed`, `absolute`, `inset-*`
- Overflow: `overflow-y-auto`, `overflow-hidden`
- Transitions: `transition-colors`, `animate-spin`, `animate-pulse`

### Custom Classes
- None (all styling via TailwindCSS utilities)

## External Dependencies

```json
{
  "dependencies": {
    "diff": "^5.x.x",                        // NEW: Text diff library
    "@tanstack/react-query": "^5.90.6",      // Existing
    "@radix-ui/react-dialog": "^1.1.15",     // Existing
    "@radix-ui/react-alert-dialog": "^1.1.15", // Existing
    "lucide-react": "^0.552.0",              // Existing
    "date-fns": "^4.1.0"                     // Existing
  }
}
```

## Lines of Code by File

| File | Lines | Type |
|------|-------|------|
| revision.ts | 41 | Types |
| revisions.ts | 59 | API |
| RevisionHistory.tsx | 323 | Component |
| RevisionTimeline.tsx | 128 | Component |
| RevisionDiff.tsx | 186 | Component |
| ArticleEditPage.tsx | 191 | Page |
| REVISION_HISTORY_README.md | 340 | Docs |
| SPRINT-3-005-IMPLEMENTATION.md | 580 | Docs |

**Total Code:** ~928 lines
**Total Documentation:** ~920 lines

---

**Note:** All files follow the project's coding standards:
- TypeScript strict mode
- Functional components with React.FC
- Proper imports with @ and ~ aliases
- TailwindCSS for styling
- Suspense for lazy loading
- TanStack Query for data fetching
