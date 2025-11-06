# Guide Feature - Glossary Module

## Overview

The Glossary module provides a comprehensive browsing interface for LLM terminology with A-Z navigation, search, filtering, and detailed term pages.

## Features Implemented

### ✅ Core Features
- **A-Z Navigation**: Sticky alphabet navigation bar with active letter highlighting
- **Term Listing**: Alphabetically grouped terms with category badges
- **Search with Autocomplete**: Real-time search suggestions as you type
- **Category Filtering**: Sidebar filter to view terms by category
- **Popular Terms**: Sidebar widget showing most-viewed terms
- **Term Detail Pages**: Full definitions with examples and related terms
- **Copy Link**: Share specific term URLs
- **Responsive Design**: Mobile-first design that works on all devices
- **View Tracking**: Automatically tracks term views for analytics

### 📄 Routes
- `/guide/glossary` - Main glossary page with A-Z navigation
- `/guide/glossary/:slug` - Individual term detail page

## File Structure

```
frontend/src/features/guide/
├── components/
│   ├── AlphabetNav.tsx          # A-Z navigation bar (sticky)
│   ├── GlossarySearchBar.tsx    # Search with autocomplete
│   ├── GlossaryTermCard.tsx     # Term card in listing
│   ├── CategoryFilter.tsx       # Category filter sidebar
│   ├── PopularTerms.tsx         # Popular terms sidebar widget
│   ├── index.ts                 # Component exports
│   └── __tests__/
│       └── GlossaryTermCard.test.tsx
├── hooks/
│   ├── useGlossary.ts           # All glossary-related hooks
│   └── index.ts                 # Hook exports
├── pages/
│   ├── GlossaryPage.tsx         # Main glossary listing page
│   └── TermDetailPage.tsx       # Individual term detail page
├── types/
│   └── index.ts                 # TypeScript types (includes glossary + use cases)
└── README.md                    # This file
```

## API Integration

### Endpoints Used
- `GET /api/v1/glossary` - List all terms (with filters)
- `GET /api/v1/glossary/search?q=...` - Search terms
- `GET /api/v1/glossary/:slug` - Get term details
- `GET /api/v1/glossary/popular` - Get popular terms
- `GET /api/v1/glossary/categories` - Get categories with counts
- `GET /api/v1/glossary/alphabet` - Get letter counts for A-Z nav
- `POST /api/v1/glossary/:slug/view` - Increment view count

### Data Types

```typescript
interface GlossaryTerm {
  id: number;
  slug: string;
  term: string;
  definition: string;
  briefDefinition: string;
  category: string;
  examples?: string[];
  relatedTerms?: RelatedTerm[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface GlossaryFilters {
  search?: string;
  category?: string;
  letter?: string;
}
```

## Component Usage

### GlossaryPage
Main page component with A-Z navigation, search, filters, and term listing.

```tsx
import { lazy, Suspense } from 'react';
const GlossaryPage = lazy(() => import('@/features/guide/pages/GlossaryPage'));

// In router
{
  path: 'guide/glossary',
  element: (
    <Suspense fallback={<PageLoader />}>
      <GlossaryPage />
    </Suspense>
  ),
}
```

### TermDetailPage
Individual term detail page with full definition, examples, and related terms.

```tsx
const TermDetailPage = lazy(() => import('@/features/guide/pages/TermDetailPage'));

// In router
{
  path: 'guide/glossary/:slug',
  element: (
    <Suspense fallback={<PageLoader />}>
      <TermDetailPage />
    </Suspense>
  ),
}
```

## Hooks API

### useGlossaryTerms(filters?)
Fetch all glossary terms with optional filters.

```tsx
import { useGlossaryTerms } from '@/features/guide/hooks';

const { data: terms } = useGlossaryTerms({
  category: 'Architecture',
  search: 'attention'
});
```

### useGroupedGlossaryTerms(filters?)
Returns terms grouped by first letter for A-Z navigation.

```tsx
import { useGroupedGlossaryTerms } from '@/features/guide/hooks';

const groupedTerms = useGroupedGlossaryTerms();
// Returns: { A: [...], B: [...], ... }
```

### useGlossaryTerm(slug)
Fetch a single term by slug.

```tsx
import { useGlossaryTerm } from '@/features/guide/hooks';

const { data: term } = useGlossaryTerm('attention-mechanism');
```

### useGlossarySearch(query)
Search terms with autocomplete support.

```tsx
import { useGlossarySearch } from '@/features/guide/hooks';

const { data: results } = useGlossarySearch('trans');
// Returns: { terms: [...], total: 5 }
```

### useGlossaryCategories()
Get all categories with term counts.

```tsx
import { useGlossaryCategories } from '@/features/guide/hooks';

const { data: categories } = useGlossaryCategories();
// Returns: [{ category: 'Architecture', count: 15 }, ...]
```

### useGlossaryAlphabet()
Get letter counts for A-Z navigation.

```tsx
import { useGlossaryAlphabet } from '@/features/guide/hooks';

const { data: alphabet } = useGlossaryAlphabet();
// Returns: [{ letter: 'A', count: 5 }, { letter: 'B', count: 3 }, ...]
```

### usePopularTerms(limit?)
Get most popular terms by view count.

```tsx
import { usePopularTerms } from '@/features/guide/hooks';

const { data: popularTerms } = usePopularTerms(10);
```

### useIncrementTermView(slug)
Mutation hook to increment view count.

```tsx
import { useIncrementTermView } from '@/features/guide/hooks';

const incrementView = useIncrementTermView('attention-mechanism');

useEffect(() => {
  incrementView.mutate();
}, []);
```

## Accessibility Features

- ✅ Semantic HTML structure
- ✅ ARIA labels on navigation elements
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus management
- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ Color contrast compliance
- ✅ Skip navigation support

## Performance Optimizations

- ✅ React.lazy() for code splitting
- ✅ Suspense boundaries for loading states
- ✅ useSuspenseQuery for data fetching
- ✅ Debounced search (300ms)
- ✅ Memoized grouped terms calculation
- ✅ Sticky navigation (CSS position: sticky)
- ✅ Efficient scroll handlers
- ✅ Query caching via React Query

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Features
- Compact A-Z navigation (8x8 buttons)
- Single column layout
- Touch-friendly tap targets
- Collapsible filters (future enhancement)

### Desktop Features
- Full A-Z navigation (10x10 buttons)
- Sidebar with filters and popular terms
- Multi-column layouts
- Hover states and tooltips

## Testing

### Unit Tests
```bash
npm test -- GlossaryTermCard.test.tsx
```

### Test Coverage
- Component rendering
- User interactions
- Link navigation
- Data display

### Manual Testing Checklist
- [ ] A-Z navigation scrolls to letter sections
- [ ] Search autocomplete works
- [ ] Category filter updates results
- [ ] Popular terms display correctly
- [ ] Term detail page shows all content
- [ ] Copy link button works
- [ ] Related terms are clickable
- [ ] Mobile responsive design
- [ ] Dark mode support

## Future Enhancements

### Phase 1 (Near term)
- [ ] Advanced search filters (category, date range)
- [ ] Term bookmarking
- [ ] Share to social media
- [ ] Print-friendly term pages
- [ ] Export terms to PDF

### Phase 2 (Medium term)
- [ ] User contributions (suggest terms)
- [ ] Term ratings and feedback
- [ ] Similar terms suggestions
- [ ] Term history/changelog
- [ ] Multi-language support

### Phase 3 (Long term)
- [ ] AI-powered term explanations
- [ ] Interactive examples
- [ ] Video explanations
- [ ] Quiz/flashcard mode
- [ ] Personal glossary collections

## Dependencies

- React 18+
- React Router v6
- TanStack Query v5
- Helmet (SEO)
- Tailwind CSS
- TypeScript

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Latest version

## Contributing

When adding new features:
1. Follow existing component patterns
2. Use useSuspenseQuery for data fetching
3. Add TypeScript types to types/index.ts
4. Create unit tests for components
5. Update this README

## Support

For issues or questions:
- Check existing components for patterns
- Review API documentation in projectdoc/03-API_ENDPOINTS.md
- Consult frontend guidelines in .claude/skills/frontend-dev-guidelines/
