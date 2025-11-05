# News Filter Architecture

## Component Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                          NewsPage                               │
│                    (Application Layer)                          │
└────────────────┬──────────────────────┬─────────────────────────┘
                 │                      │
                 ▼                      ▼
    ┌────────────────────┐   ┌─────────────────────┐
    │  useNewsFilters    │   │  React Query        │
    │   (Custom Hook)    │   │  (Data Fetching)    │
    └─────────┬──────────┘   └──────────┬──────────┘
              │                         │
              │ filters                 │ data
              │                         │
              ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Components                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │ CategorySidebar  │        │   FilterPanel    │              │
│  │                  │        │                  │              │
│  │  - Tree UI       │        │  - SearchBar     │              │
│  │  - Selection     │        │  - ActiveFilters │              │
│  │  - Count badges  │        │  - TagFilter     │              │
│  └──────────────────┘        │  - DifficultyFilter│            │
│                              │  - ModelFilter    │              │
│                              └──────────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MobileFilterDrawer                         │   │
│  │                                                          │   │
│  │  - Backdrop                                             │   │
│  │  - Slide animation                                      │   │
│  │  - FilterPanel (embedded)                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         User Actions                              │
└────┬─────────────┬──────────────┬─────────────┬─────────────────┘
     │             │              │             │
     │ Click       │ Type         │ Select      │ Remove
     │ Category    │ Search       │ Tag         │ Filter
     │             │              │             │
     ▼             ▼              ▼             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Component Event Handlers                       │
│                                                                   │
│  onCategorySelect  onChange  onTagsChange  onRemoveFilter        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    useNewsFilters Hook                            │
│                                                                   │
│  updateFilter() / setFilters() / clearFilters()                  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                  URL Search Params Update                         │
│                                                                   │
│  setSearchParams(newParams, { replace: true })                   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                        URL Changes                                │
│                                                                   │
│  /news?search=gpt&category=updates&tags=gpt-4&difficulty=INTER   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ├──────────────┐
                         │              │
                         ▼              ▼
┌────────────────────────────┐  ┌──────────────────────────────┐
│  useSearchParams           │  │  React Query                 │
│  (React Router)            │  │  (Auto-refetch)              │
│                            │  │                              │
│  Parse URL → filters       │  │  queryKey: ['articles',      │
│                            │  │             filters]         │
└────────────┬───────────────┘  └──────────────┬───────────────┘
             │                                 │
             │ filters object                  │
             │                                 │
             ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Components Re-render                            │
│                                                                   │
│  - Active filters highlighted                                    │
│  - Filter pills displayed                                        │
│  - Article list updated                                          │
└──────────────────────────────────────────────────────────────────┘
```

## State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Single Source of Truth                        │
│                      (URL Search Params)                         │
│                                                                  │
│  ?search=gpt&category=updates&tags=gpt-4&difficulty=INTERMEDIATE│
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Parse
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Filters Object                              │
│                                                                  │
│  {                                                               │
│    search: "gpt",                                                │
│    categorySlug: "updates",                                      │
│    tags: ["gpt-4"],                                              │
│    difficulty: "INTERMEDIATE",                                   │
│    modelSlug: undefined                                          │
│  }                                                               │
└────────┬────────────┬───────────────┬──────────────┬────────────┘
         │            │               │              │
         │ Prop       │ Prop          │ Prop         │ Prop
         │            │               │              │
         ▼            ▼               ▼              ▼
    ┌─────────┐  ┌──────────┐   ┌─────────┐   ┌──────────┐
    │Category │  │ Search   │   │  Tag    │   │Difficulty│
    │Sidebar  │  │   Bar    │   │ Filter  │   │ Filter   │
    └─────────┘  └──────────┘   └─────────┘   └──────────┘
         │            │               │              │
         │ Event      │ Event         │ Event        │ Event
         │            │               │              │
         └────────────┴───────────────┴──────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Update State │
              └───────┬───────┘
                      │
                      │ Serialize
                      │
                      ▼
              ┌───────────────────────┐
              │  Update URL Params    │
              │  (No Page Reload)     │
              └───────────────────────┘
```

## Component Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                         Parent Component                         │
│                          (NewsPage)                              │
│                                                                  │
│  const { filters, setFilters, updateFilter } = useNewsFilters() │
└────────┬──────────────────────┬──────────────────────┬──────────┘
         │                      │                      │
         │ Props                │ Props                │ Props
         │ + Callbacks          │ + Callbacks          │ + Callbacks
         │                      │                      │
         ▼                      ▼                      ▼
┌──────────────────┐   ┌─────────────────┐   ┌───────────────────┐
│ CategorySidebar  │   │  FilterPanel    │   │MobileFilterDrawer │
│                  │   │                 │   │                   │
│ Props:           │   │ Props:          │   │ Props:            │
│  - categories    │   │  - filters      │   │  - isOpen         │
│  - activeSlug    │   │  - onChange     │   │  - onClose        │
│  - onSelect      │   │  - tagNames     │   │  - filters        │
│                  │   │  - categoryName │   │  - onChange       │
│ Callbacks:       │   │  - modelName    │   │                   │
│  - onSelect(slug)│   │                 │   │ Callbacks:        │
│                  │   │ Callbacks:      │   │  - onClose()      │
│                  │   │  - onChange()   │   │                   │
└──────────────────┘   └────────┬────────┘   └───────────────────┘
                                │
                                │ Contains
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  SearchBar   │      │  TagFilter   │      │DifficultyFilter│
│              │      │              │      │              │
│ Props:       │      │ Props:       │      │ Props:       │
│  - value     │      │  - selected  │      │  - value     │
│  - onChange  │      │  - onChange  │      │  - onChange  │
│              │      │              │      │              │
│ Callbacks:   │      │ Callbacks:   │      │ Callbacks:   │
│  - onChange()│      │  - onChange()│      │  - onChange()│
└──────────────┘      └──────────────┘      └──────────────┘
```

## API Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Query Layer                           │
└────────┬──────────────────────┬──────────────────────┬──────────┘
         │                      │                      │
         │ useQuery             │ useQuery             │ useQuery
         │                      │                      │
         ▼                      ▼                      ▼
┌──────────────────┐   ┌─────────────────┐   ┌───────────────────┐
│  GET /categories │   │  GET /tags      │   │  GET /articles    │
│                  │   │  ?search=query  │   │  ?filters...      │
│  Response:       │   │                 │   │                   │
│  - CategoryNode[]│   │  Response:      │   │  Response:        │
│  - With children │   │  - TagOption[]  │   │  - Article[]      │
│  - Article counts│   │  - Usage counts │   │  - Pagination     │
└──────────────────┘   └─────────────────┘   └───────────────────┘
         │                      │                      │
         │ Cache: ∞             │ Cache: 5m            │ Cache: 1m
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Component Layer                             │
│                                                                  │
│  CategorySidebar    SearchBar / TagFilter    Article Grid       │
└─────────────────────────────────────────────────────────────────┘
```

## Responsive Layout Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mobile (<768px)                              │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  Header + Filter Button (with badge)                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  Article Grid (Stacked)                                     │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Drawer opens from right →]                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Tablet (768px - 1024px)                        │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────────────────────────────────┐  │
│ │  Category    │ │  Search + Active Filters                │  │
│ │  Sidebar     │ └──────────────────────────────────────────┘  │
│ │              │ ┌──────────────────────────────────────────┐  │
│ │  (Compact)   │ │  Article Grid (2 columns)                │  │
│ │              │ │                                          │  │
│ └──────────────┘ └──────────────────────────────────────────┘  │
│                                                                  │
│ Filters in collapsible panel below                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Desktop (>1024px)                             │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌───────────────────────────────────────────────┐ │
│ │ Category │ │  Search Bar                                   │ │
│ │ Sidebar  │ ├───────────────────────────────────────────────┤ │
│ │          │ │  Active Filters (Pills)                       │ │
│ │ ──────── │ ├───────────────────────────────────────────────┤ │
│ │          │ │  Article Grid (3 columns)                     │ │
│ │ Filter   │ │                                               │ │
│ │ Panel    │ │                                               │ │
│ │          │ │                                               │ │
│ │ - Tags   │ │                                               │ │
│ │ - Diff.  │ │                                               │ │
│ │ - Model  │ │                                               │ │
│ └──────────┘ └───────────────────────────────────────────────┘ │
│                                                                  │
│ Sticky sidebar with scroll                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       API Request                                │
└────────────┬───────────────────────┬────────────────────────────┘
             │                       │
             │ Success               │ Error
             │                       │
             ▼                       ▼
    ┌─────────────────┐     ┌───────────────────┐
    │  Update State   │     │  Error Boundary   │
    │  Show Data      │     │  Sentry Report    │
    └─────────────────┘     └────────┬──────────┘
                                     │
                                     ▼
                            ┌────────────────────┐
                            │  User Notification │
                            │  - Toast           │
                            │  - Retry Button    │
                            │  - Fallback UI     │
                            └────────────────────┘
```

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                  Performance Optimizations                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Debouncing                                                   │
│     ├── Search Input: 300ms                                     │
│     ├── Tag Search: 300ms                                       │
│     └── Model Search: 300ms                                     │
│                                                                  │
│  2. Memoization                                                  │
│     ├── useMemo: Filter calculations                            │
│     ├── useMemo: Parsed URL params                              │
│     └── useCallback: Event handlers                             │
│                                                                  │
│  3. React Query Caching                                          │
│     ├── Categories: ∞ (rarely changes)                          │
│     ├── Tags: 5 minutes                                         │
│     └── Articles: 1 minute                                      │
│                                                                  │
│  4. Code Splitting                                               │
│     ├── React.lazy: MobileFilterDrawer                          │
│     └── Dynamic imports for heavy components                    │
│                                                                  │
│  5. Virtual Scrolling                                            │
│     └── For long category/tag lists (if needed)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Security Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Measures                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Input Validation                                             │
│     ├── URL params sanitized                                    │
│     ├── Search queries validated                                │
│     └── Filter values type-checked                              │
│                                                                  │
│  2. XSS Prevention                                               │
│     ├── No dangerouslySetInnerHTML                              │
│     ├── React escapes all strings                               │
│     └── Safe HTML rendering                                     │
│                                                                  │
│  3. API Security                                                 │
│     ├── CORS properly configured                                │
│     ├── Rate limiting on backend                                │
│     └── Authentication tokens                                   │
│                                                                  │
│  4. Privacy                                                      │
│     ├── No sensitive data in URLs                               │
│     └── Analytics opt-in                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Version:** 1.0.0
**Last Updated:** November 5, 2025
**Status:** Production Ready
