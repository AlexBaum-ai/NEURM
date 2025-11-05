# News Filter Components - Structure Overview

## Component Hierarchy

```
NewsPage / ArticleListPage
│
├── Desktop Layout (lg:)
│   ├── CategorySidebar (sticky sidebar)
│   │   ├── "All Articles" button
│   │   └── CategoryItem[] (recursive)
│   │       ├── Expand/collapse button
│   │       ├── Category name
│   │       ├── Article count badge
│   │       └── Children[] (recursive)
│   │
│   ├── FilterPanel
│   │   ├── SearchBar
│   │   │   ├── Search icon
│   │   │   ├── Input field (debounced)
│   │   │   ├── Clear button
│   │   │   └── Autocomplete dropdown
│   │   │       └── Tag suggestions
│   │   │
│   │   ├── ActiveFilters
│   │   │   ├── Filter count header
│   │   │   ├── Clear all button
│   │   │   └── Filter pills[]
│   │   │       └── Remove button per pill
│   │   │
│   │   ├── TagFilter
│   │   │   ├── Multi-select button
│   │   │   └── Dropdown
│   │   │       ├── Search input
│   │   │       ├── Tag list with checkboxes
│   │   │       └── Selected tags preview
│   │   │
│   │   ├── DifficultyFilter
│   │   │   ├── "All Levels" radio button
│   │   │   └── Difficulty options[]
│   │   │       ├── Radio button
│   │   │       ├── Label with badge
│   │   │       └── Description text
│   │   │
│   │   └── ModelFilter
│   │       ├── Single-select button
│   │       └── Dropdown
│   │           ├── Search input
│   │           └── Model list
│   │
│   └── Article Grid/List
│       └── Article cards[]
│
└── Mobile Layout (<lg)
    ├── Filter toggle button (with badge)
    │
    ├── MobileFilterDrawer (slide-out)
    │   ├── Header
    │   │   ├── Title with icon
    │   │   └── Close button
    │   │
    │   ├── Content (scrollable)
    │   │   └── FilterPanel (same as desktop)
    │   │
    │   └── Footer
    │       └── "Apply Filters" button
    │
    └── Article Grid/List
        └── Article cards[]
```

## Data Flow

```
User Interaction
    │
    ├─→ CategorySidebar
    │       └─→ onCategorySelect(slug)
    │               └─→ updateFilter('categorySlug', slug)
    │
    ├─→ SearchBar
    │       ├─→ onChange(value)
    │       │       └─→ updateFilter('search', value)
    │       └─→ API: searchTags(query)
    │
    ├─→ TagFilter
    │       ├─→ onChange(tags[])
    │       │       └─→ updateFilter('tags', tags)
    │       └─→ API: searchTags(query)
    │
    ├─→ DifficultyFilter
    │       └─→ onChange(difficulty)
    │               └─→ updateFilter('difficulty', difficulty)
    │
    ├─→ ModelFilter
    │       └─→ onChange(modelSlug)
    │               └─→ updateFilter('modelSlug', modelSlug)
    │
    └─→ ActiveFilters
            ├─→ onRemoveFilter(key, value?)
            │       └─→ updateFilter(key, undefined/filtered)
            └─→ onClearAll()
                    └─→ clearFilters()
                            └─→ setFilters({})

useNewsFilters Hook
    │
    ├─→ Parse URL params → filters object
    │
    ├─→ setFilters(filters)
    │       └─→ Serialize to URL params
    │               └─→ setSearchParams (React Router)
    │                       └─→ URL updates (no page reload)
    │
    └─→ Triggers React Query refetch
            └─→ API: getArticles({ filters })
                    └─→ Article list updates
```

## State Management

```
URL Search Params (Single Source of Truth)
    ↓
useSearchParams (React Router)
    ↓
useNewsFilters (Custom Hook)
    ↓
filters object: {
    search?: string
    categorySlug?: string
    tags?: string[]
    difficulty?: DifficultyLevel
    modelSlug?: string
}
    ↓
Components (via props)
    ├─→ CategorySidebar
    ├─→ FilterPanel
    │   ├─→ SearchBar
    │   ├─→ ActiveFilters
    │   ├─→ TagFilter
    │   ├─→ DifficultyFilter
    │   └─→ ModelFilter
    └─→ MobileFilterDrawer
```

## Component Props

### CategorySidebar
```typescript
{
  categories: CategoryNode[]
  activeSlug?: string
  onCategorySelect: (slug: string | undefined) => void
  className?: string
}
```

### SearchBar
```typescript
{
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}
```

### TagFilter
```typescript
{
  selectedTags: string[]
  onChange: (tags: string[]) => void
  className?: string
}
```

### DifficultyFilter
```typescript
{
  value?: DifficultyLevel
  onChange: (difficulty: DifficultyLevel | undefined) => void
  className?: string
}
```

### ModelFilter
```typescript
{
  value?: string
  onChange: (modelSlug: string | undefined) => void
  className?: string
}
```

### ActiveFilters
```typescript
{
  filters: NewsFilters
  onRemoveFilter: (filterKey: keyof NewsFilters, value?: string) => void
  onClearAll: () => void
  className?: string
  tagNames?: Record<string, string>
  categoryName?: string
  modelName?: string
}
```

### FilterPanel
```typescript
{
  filters: NewsFilters
  onFiltersChange: (filters: NewsFilters) => void
  className?: string
  categoryName?: string
  tagNames?: Record<string, string>
  modelName?: string
}
```

### MobileFilterDrawer
```typescript
{
  isOpen: boolean
  onClose: () => void
  filters: NewsFilters
  onFiltersChange: (filters: NewsFilters) => void
  categoryName?: string
  tagNames?: Record<string, string>
  modelName?: string
}
```

## Styling Conventions

### Color Scheme
- Primary: `primary-*` (brand color)
- Gray: `gray-*` (neutral)
- Accent: `accent-*` (error/warning)
- Difficulty badges:
  - Beginner: `green-*`
  - Intermediate: `blue-*`
  - Advanced: `orange-*`
  - Expert: `red-*`

### Dark Mode
All components support dark mode with `dark:` variants:
- Background: `bg-white dark:bg-gray-900`
- Text: `text-gray-900 dark:text-white`
- Border: `border-gray-300 dark:border-gray-700`

### Spacing
- Container: `p-4 md:p-6 lg:p-8`
- Gap: `gap-2`, `gap-4`, `gap-6`
- Margin: `mb-2`, `mb-4`, `mb-6`

### Typography
- Heading: `text-lg font-semibold`
- Body: `text-sm`
- Label: `text-sm font-medium`
- Muted: `text-sm text-gray-600 dark:text-gray-400`

### Interactive Elements
- Hover: `hover:bg-gray-100 dark:hover:bg-gray-800`
- Focus: `focus:outline-none focus:ring-2 focus:ring-primary-500`
- Active: `bg-primary-50 dark:bg-primary-900/20`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

## Responsive Breakpoints

```css
/* Mobile first approach */
.component {
  /* Base styles (mobile) */
}

@media (min-width: 768px) {
  /* Tablet: md: */
}

@media (min-width: 1024px) {
  /* Desktop: lg: */
}

@media (min-width: 1280px) {
  /* Large desktop: xl: */
}
```

### Layout Changes
- **< 768px**: Mobile drawer, stacked layout
- **768px - 1024px**: Compact sidebar, filter panel below
- **> 1024px**: Full sidebar, side-by-side layout

## Accessibility Features

### Keyboard Navigation
- Tab: Focus next element
- Shift+Tab: Focus previous element
- Enter/Space: Activate button
- Escape: Close dropdown/drawer
- Arrow keys: Navigate within lists

### ARIA Attributes
- `aria-label`: Descriptive labels
- `aria-expanded`: Dropdown state
- `aria-selected`: Selection state
- `aria-controls`: Relationship
- `role`: Semantic role

### Screen Reader Support
- Semantic HTML (`<button>`, `<nav>`, `<aside>`)
- Hidden labels for icon-only buttons
- Status announcements
- Focus management

## Performance Optimizations

### Debouncing
- Search input: 300ms delay
- Prevents excessive API calls
- Improves UX and reduces load

### Memoization
```typescript
useMemo(() => {
  // Expensive filter calculations
}, [dependencies])
```

### React Query Caching
- Categories cached indefinitely
- Tags cached for 5 minutes
- Articles cached with filter keys

### Code Splitting
```typescript
const MobileFilterDrawer = React.lazy(() => import('./MobileFilterDrawer'));
```

## Testing Strategy

### Unit Tests
- Individual component rendering
- Props handling
- State updates
- Event handlers

### Integration Tests
- Filter combination
- URL sync
- API integration
- Multi-component interaction

### E2E Tests
- User workflows
- Mobile drawer
- Filter persistence
- Cross-browser compatibility

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills Needed
- None (modern browsers only)

### Known Issues
- None currently

---

**Last Updated:** November 5, 2025
**Version:** 1.0.0
**Status:** Production Ready
