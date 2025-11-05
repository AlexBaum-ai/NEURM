# News Filter Components Usage Guide

This document explains how to use the category filter and search UI components implemented for SPRINT-2-009.

## Components Overview

### 1. CategorySidebar
Displays a hierarchical tree of categories with expand/collapse functionality.

```tsx
import { CategorySidebar } from '@/features/news/components';

<CategorySidebar
  categories={categories}
  activeSlug={filters.categorySlug}
  onCategorySelect={(slug) => updateFilter('categorySlug', slug)}
/>
```

**Features:**
- Recursive category tree structure
- Expand/collapse category groups
- Active category highlighting
- Article count per category
- "All Articles" option

---

### 2. SearchBar
Search input with debounced autocomplete suggestions from tags.

```tsx
import { SearchBar } from '@/features/news/components';

<SearchBar
  value={filters.search || ''}
  onChange={(value) => updateFilter('search', value)}
  placeholder="Search articles..."
/>
```

**Features:**
- Debounced search (300ms)
- Tag-based autocomplete suggestions
- Clear button
- Loading state
- Keyboard accessible

---

### 3. TagFilter
Multi-select dropdown for filtering by tags.

```tsx
import { TagFilter } from '@/features/news/components';

<TagFilter
  selectedTags={filters.tags || []}
  onChange={(tags) => updateFilter('tags', tags)}
/>
```

**Features:**
- Multi-select with checkboxes
- Search tags within dropdown
- Usage count display
- Selected tags preview
- Clear all button

---

### 4. DifficultyFilter
Radio button group for selecting difficulty level.

```tsx
import { DifficultyFilter } from '@/features/news/components';

<DifficultyFilter
  value={filters.difficulty}
  onChange={(difficulty) => updateFilter('difficulty', difficulty)}
/>
```

**Options:**
- BEGINNER - No prior knowledge required
- INTERMEDIATE - Basic understanding needed
- ADVANCED - Solid foundation required
- EXPERT - Deep technical knowledge

---

### 5. ModelFilter
Dropdown for selecting specific LLM model.

```tsx
import { ModelFilter } from '@/features/news/components';

<ModelFilter
  value={filters.modelSlug}
  onChange={(modelSlug) => updateFilter('modelSlug', modelSlug)}
/>
```

**Note:** Currently uses mock data. In production, connect to `/api/v1/llm-guide/models` endpoint.

---

### 6. ActiveFilters
Displays active filters as removable pills with clear all button.

```tsx
import { ActiveFilters } from '@/features/news/components';

<ActiveFilters
  filters={filters}
  onRemoveFilter={handleRemoveFilter}
  onClearAll={handleClearAll}
  categoryName={categoryData?.name}
  tagNames={tagNamesMap}
  modelName={modelData?.name}
/>
```

**Features:**
- Filter pills with remove buttons
- Clear all filters button
- Active filter count
- Display names for better UX

---

### 7. FilterPanel
Container component combining all filter components.

```tsx
import { FilterPanel } from '@/features/news/components';

<FilterPanel
  filters={filters}
  onFiltersChange={setFilters}
  categoryName={categoryData?.name}
  tagNames={tagNamesMap}
  modelName={modelData?.name}
/>
```

**Desktop Usage:**
Use in a sidebar layout alongside article list.

---

### 8. MobileFilterDrawer
Slide-out drawer for filters on mobile devices.

```tsx
import { MobileFilterDrawer } from '@/features/news/components';

<MobileFilterDrawer
  isOpen={isFilterDrawerOpen}
  onClose={() => setIsFilterDrawerOpen(false)}
  filters={filters}
  onFiltersChange={setFilters}
  categoryName={categoryData?.name}
  tagNames={tagNamesMap}
  modelName={modelData?.name}
/>
```

**Features:**
- Slide-out animation
- Backdrop blur
- Body scroll lock
- Escape key to close
- Apply filters button

---

## URL Params Synchronization

Use the `useNewsFilters` hook to automatically sync filters with URL parameters:

```tsx
import { useNewsFilters } from '@/features/news/hooks/useNewsFilters';

function NewsPage() {
  const { filters, setFilters, updateFilter, clearFilters, hasActiveFilters } = useNewsFilters();

  // filters are automatically synced with URL params
  // Example URL: /news?search=gpt&category=model-updates&tags=gpt-4,openai&difficulty=INTERMEDIATE
}
```

**URL Parameters:**
- `search` - Search query string
- `category` - Category slug
- `tags` - Comma-separated tag slugs
- `difficulty` - Difficulty level
- `model` - Model slug

---

## Complete Page Example

```tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CategorySidebar,
  FilterPanel,
  MobileFilterDrawer
} from '@/features/news/components';
import { useNewsFilters } from '@/features/news/hooks/useNewsFilters';
import { newsApi } from '@/features/news/api/newsApi';

export function NewsPage() {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { filters, setFilters, updateFilter } = useNewsFilters();

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['news', 'categories'],
    queryFn: () => newsApi.getCategories(),
  });

  // Fetch articles with filters
  const { data: articlesData } = useQuery({
    queryKey: ['news', 'articles', filters],
    queryFn: () => newsApi.getArticles({ filters }),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Desktop: Category Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <CategorySidebar
            categories={categoriesData?.data.categories || []}
            activeSlug={filters.categorySlug}
            onCategorySelect={(slug) => updateFilter('categorySlug', slug)}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile: Filter Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="mb-4 lg:hidden"
          >
            Filters
          </button>

          {/* Desktop: Filter Panel */}
          <div className="hidden lg:block mb-6">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Article Grid */}
          <div className="grid gap-6">
            {articlesData?.data.articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
```

---

## API Endpoints Used

### GET /api/v1/news/categories
Fetch hierarchical category tree.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Model Updates",
        "slug": "model-updates",
        "level": 1,
        "articleCount": 45,
        "children": [...]
      }
    ]
  }
}
```

### GET /api/v1/news/tags?search=query
Search tags for autocomplete.

**Response:**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "uuid",
        "name": "GPT-4",
        "slug": "gpt-4",
        "usageCount": 87
      }
    ]
  }
}
```

### GET /api/v1/news/articles
Fetch articles with filters (implemented in SPRINT-2-002).

**Query Parameters:**
- `search` - Search query
- `category` - Category slug
- `tags` - Tag slugs (multiple)
- `difficulty` - Difficulty level
- `model` - Model slug
- `page` - Page number
- `limit` - Items per page
- `sortBy` - Sort option

---

## Accessibility Features

All components implement WCAG 2.1 Level AA compliance:

- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader friendly
- Sufficient color contrast
- Semantic HTML

---

## Responsive Design

- **Mobile (<768px):** Filter drawer with backdrop
- **Tablet (768px-1024px):** Collapsible sidebar
- **Desktop (>1024px):** Fixed sidebar with filter panel

---

## Performance Optimizations

1. **Debounced Search** - 300ms delay to reduce API calls
2. **URL State Management** - Filters persist across page refreshes
3. **Lazy Loading** - Components use React.lazy() when appropriate
4. **Memoization** - Filter calculations memoized with useMemo
5. **Optimistic Updates** - Immediate UI feedback before API response

---

## Testing Checklist

- [ ] Category tree expands/collapses correctly
- [ ] Active category highlighted
- [ ] Search autocomplete shows relevant tags
- [ ] Multi-select tags work correctly
- [ ] Difficulty filter updates properly
- [ ] Model filter updates properly
- [ ] Active filters display as pills
- [ ] Remove individual filter works
- [ ] Clear all filters works
- [ ] URL params sync correctly
- [ ] Mobile drawer opens/closes
- [ ] Keyboard navigation works
- [ ] Screen reader accessible
- [ ] Responsive on all screen sizes

---

## Future Enhancements

1. **Saved Filters** - Allow users to save favorite filter combinations
2. **Filter Presets** - Quick access to common filter combinations
3. **Recent Searches** - Show recent search history
4. **Popular Tags** - Highlight trending tags
5. **Filter Analytics** - Track most used filter combinations
6. **Advanced Search** - Boolean operators, date ranges, etc.
