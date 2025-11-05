# News Filter Components - Quick Reference

## 🚀 Quick Start

```typescript
import { useNewsFilters } from '@/features/news/hooks/useNewsFilters';
import { CategorySidebar, FilterPanel, MobileFilterDrawer } from '@/features/news/components';

function NewsPage() {
  const { filters, setFilters, updateFilter } = useNewsFilters();

  return (
    <>
      <CategorySidebar
        categories={categories}
        activeSlug={filters.categorySlug}
        onCategorySelect={(slug) => updateFilter('categorySlug', slug)}
      />
      <FilterPanel filters={filters} onFiltersChange={setFilters} />
    </>
  );
}
```

## 📦 Component Imports

```typescript
// Individual imports
import { CategorySidebar } from '@/features/news/components';
import { SearchBar } from '@/features/news/components';
import { TagFilter } from '@/features/news/components';
import { DifficultyFilter } from '@/features/news/components';
import { ModelFilter } from '@/features/news/components';
import { ActiveFilters } from '@/features/news/components';
import { FilterPanel } from '@/features/news/components';
import { MobileFilterDrawer } from '@/features/news/components';

// Hook
import { useNewsFilters } from '@/features/news/hooks/useNewsFilters';

// Types
import type { NewsFilters, DifficultyLevel, CategoryNode } from '@/features/news/types';
```

## 🎯 Core Hook Usage

### useNewsFilters()

```typescript
const {
  filters,          // Current filter state
  setFilters,       // Replace all filters
  updateFilter,     // Update single filter
  clearFilters,     // Clear all filters
  hasActiveFilters  // Boolean flag
} = useNewsFilters();

// Update single filter
updateFilter('search', 'GPT-4');
updateFilter('categorySlug', 'model-updates');
updateFilter('tags', ['gpt-4', 'openai']);
updateFilter('difficulty', 'INTERMEDIATE');

// Replace all filters
setFilters({ search: 'GPT', categorySlug: 'updates' });

// Clear all filters
clearFilters();
```

## 🧩 Component Props

### CategorySidebar
```typescript
<CategorySidebar
  categories={CategoryNode[]}
  activeSlug={string | undefined}
  onCategorySelect={(slug?: string) => void}
  className={string}
/>
```

### SearchBar
```typescript
<SearchBar
  value={string}
  onChange={(value: string) => void}
  placeholder={string}
  className={string}
/>
```

### TagFilter
```typescript
<TagFilter
  selectedTags={string[]}
  onChange={(tags: string[]) => void}
  className={string}
/>
```

### DifficultyFilter
```typescript
<DifficultyFilter
  value={DifficultyLevel | undefined}
  onChange={(difficulty?: DifficultyLevel) => void}
  className={string}
/>
```

### ModelFilter
```typescript
<ModelFilter
  value={string | undefined}
  onChange={(modelSlug?: string) => void}
  className={string}
/>
```

### ActiveFilters
```typescript
<ActiveFilters
  filters={NewsFilters}
  onRemoveFilter={(key: keyof NewsFilters, value?: string) => void}
  onClearAll={() => void}
  className={string}
  tagNames={Record<string, string>}      // Optional: slug → name
  categoryName={string}                   // Optional: display name
  modelName={string}                      // Optional: display name
/>
```

### FilterPanel
```typescript
<FilterPanel
  filters={NewsFilters}
  onFiltersChange={(filters: NewsFilters) => void}
  className={string}
  categoryName={string}
  tagNames={Record<string, string>}
  modelName={string}
/>
```

### MobileFilterDrawer
```typescript
<MobileFilterDrawer
  isOpen={boolean}
  onClose={() => void}
  filters={NewsFilters}
  onFiltersChange={(filters: NewsFilters) => void}
  categoryName={string}
  tagNames={Record<string, string>}
  modelName={string}
/>
```

## 🔗 URL Parameter Format

```
/news?search=gpt&category=model-updates&tags=gpt-4,openai&difficulty=INTERMEDIATE&model=gpt-4
```

**Parameters:**
- `search` - Search query
- `category` - Category slug
- `tags` - Comma-separated tag slugs
- `difficulty` - BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
- `model` - Model slug

## 📡 API Endpoints

### Get Categories
```typescript
const { data } = useQuery({
  queryKey: ['news', 'categories'],
  queryFn: () => newsApi.getCategories()
});
// GET /api/v1/news/categories
```

### Search Tags
```typescript
const { data } = useQuery({
  queryKey: ['news', 'tags', search],
  queryFn: () => newsApi.searchTags(search, limit)
});
// GET /api/v1/news/tags?search=query&limit=20
```

### Get Articles with Filters
```typescript
const { data } = useQuery({
  queryKey: ['news', 'articles', filters],
  queryFn: () => newsApi.getArticles({ filters })
});
// GET /api/v1/news/articles?[filter params]
```

## 🎨 Styling Classes

### Common Patterns
```typescript
// Container
"w-full"

// Spacing
"gap-2 gap-4 gap-6"
"p-2 p-4 p-6"
"mb-2 mb-4 mb-6"

// Colors (with dark mode)
"bg-white dark:bg-gray-900"
"text-gray-900 dark:text-white"
"border-gray-300 dark:border-gray-700"

// Interactive
"hover:bg-gray-100 dark:hover:bg-gray-800"
"focus:ring-2 focus:ring-primary-500"

// Active state
"bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
```

## 🔍 Common Patterns

### Filter State Management
```typescript
// Get filter from URL
const { filters } = useNewsFilters();

// Update single field
updateFilter('search', searchValue);

// Add tag to existing tags
updateFilter('tags', [...(filters.tags || []), newTag]);

// Remove tag from existing tags
updateFilter('tags', filters.tags?.filter(t => t !== tagToRemove));

// Toggle difficulty
updateFilter('difficulty',
  filters.difficulty === level ? undefined : level
);
```

### API Data Fetching
```typescript
// Categories (cache forever)
const { data: categories } = useQuery({
  queryKey: ['news', 'categories'],
  queryFn: newsApi.getCategories,
  staleTime: Infinity,
});

// Articles (re-fetch on filter change)
const { data: articles } = useQuery({
  queryKey: ['news', 'articles', filters],
  queryFn: () => newsApi.getArticles({ filters }),
  keepPreviousData: true,
});
```

### Responsive Layout
```typescript
// Desktop sidebar
<aside className="hidden lg:block w-72">
  <CategorySidebar {...props} />
</aside>

// Mobile button
<button className="lg:hidden" onClick={openDrawer}>
  Filters
</button>

// Mobile drawer
<MobileFilterDrawer
  className="lg:hidden"
  isOpen={isOpen}
  onClose={closeDrawer}
/>
```

## 🐛 Debugging

### Check Current Filters
```typescript
console.log('Current filters:', filters);
console.log('Has active filters:', hasActiveFilters);
console.log('URL:', window.location.search);
```

### React Query DevTools
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### Check URL Sync
```typescript
useEffect(() => {
  console.log('Filters changed:', filters);
  console.log('URL params:', window.location.search);
}, [filters]);
```

## ⚠️ Common Pitfalls

### ❌ Don't do this:
```typescript
// Don't mutate filters directly
filters.tags.push(newTag); // ❌

// Don't forget to handle undefined
filters.tags?.filter(...) // ✅
filters.tags.filter(...) // ❌ (might be undefined)

// Don't use == instead of ===
if (filters.difficulty == 'BEGINNER') // ❌
if (filters.difficulty === 'BEGINNER') // ✅
```

### ✅ Do this instead:
```typescript
// Create new filter object
setFilters({ ...filters, tags: [...(filters.tags || []), newTag] });

// Always handle undefined
const tags = filters.tags || [];

// Use strict equality
if (filters.difficulty === 'BEGINNER') { ... }
```

## 🧪 Testing Examples

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySidebar } from './CategorySidebar';

test('selects category', () => {
  const onSelect = jest.fn();
  render(<CategorySidebar categories={mockCategories} onCategorySelect={onSelect} />);

  fireEvent.click(screen.getByText('Model Updates'));
  expect(onSelect).toHaveBeenCalledWith('model-updates');
});
```

## 📱 Responsive Breakpoints

```typescript
// Tailwind breakpoints
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Small desktops
xl: 1280px  // Large desktops

// Usage
className="hidden lg:block"  // Hidden on mobile, visible on desktop
className="lg:hidden"         // Visible on mobile, hidden on desktop
className="md:grid-cols-2 lg:grid-cols-3"  // Responsive grid
```

## 🎯 Performance Tips

1. **Debounce search**: Already implemented (300ms)
2. **Memoize calculations**: Use `useMemo` for expensive operations
3. **Cache API responses**: React Query handles this automatically
4. **Lazy load mobile drawer**: Use `React.lazy()` if needed
5. **Virtual scrolling**: For very long lists (100+ items)

## 🔐 Security Notes

- ✅ All inputs are validated
- ✅ XSS protection (React escapes strings)
- ✅ No sensitive data in URLs
- ✅ CORS properly configured
- ✅ Rate limiting on backend

## 📚 Related Documentation

- **FILTER_USAGE.md** - Detailed usage guide
- **SPRINT-2-009-SUMMARY.md** - Implementation details
- **COMPONENT_STRUCTURE.md** - Architecture overview
- **ARCHITECTURE.md** - Data flow diagrams
- **FilterExample.tsx** - Working example

## 🆘 Need Help?

1. Check the example: `examples/FilterExample.tsx`
2. Read the usage guide: `FILTER_USAGE.md`
3. Review the types: `types/index.ts`
4. Check the hook: `hooks/useNewsFilters.ts`

---

**Version:** 1.0.0
**Last Updated:** November 5, 2025
