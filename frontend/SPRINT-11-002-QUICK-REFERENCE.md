# SPRINT-11-002 Quick Reference Guide

## For Developers Working with the Enhanced Model UI

### Quick Start

```typescript
// Import components
import {
  ModelVersions,
  ModelStatusBadge,
  RelatedModels,
  CommunityResources,
  BenchmarkComparison,
} from '@/features/models';

// Import hooks
import {
  useModelVersions,
  useRelatedModels,
  useCommunityResources,
  useBenchmarkComparison,
} from '@/features/models';

// Import types
import type {
  ModelVersion,
  RelatedModel,
  CommunityResource,
  BenchmarkComparisonData,
} from '@/features/models';
```

### Component Usage Examples

#### 1. ModelStatusBadge

```tsx
import { ModelStatusBadge } from '@/features/models';

// Default size (medium)
<ModelStatusBadge status="active" />

// Small size
<ModelStatusBadge status="beta" size="sm" />

// Large size
<ModelStatusBadge status="deprecated" size="lg" />
```

**Status Options**: `'active' | 'deprecated' | 'beta' | 'coming_soon'`

#### 2. ModelVersions

```tsx
import { ModelVersions } from '@/features/models';

// Display version history for a model
<ModelVersions modelSlug="gpt-4" />
```

**Features**:
- Dropdown selector with current version
- Timeline view of all releases
- Detailed version information
- Features and improvements lists
- Click to view different versions

#### 3. RelatedModels

```tsx
import { RelatedModels } from '@/features/models';

// Display related/similar models
<RelatedModels modelSlug="gpt-4" />
```

**Features**:
- Grid of similar models (up to 6)
- Similarity percentage
- Click to navigate to related model
- Automatically hides if no related models

#### 4. CommunityResources

```tsx
import { CommunityResources } from '@/features/models';

// Display community resources
<CommunityResources modelSlug="gpt-4" />
```

**Resource Types**:
- 📚 Tutorials
- 💡 Use Cases
- 📰 Articles
- 🎥 Videos

#### 5. BenchmarkComparison

```tsx
import { BenchmarkComparison } from '@/features/models';

// Compare benchmarks for multiple models
<BenchmarkComparison
  modelIds={[1, 2, 3]}
  currentModelId={1}
/>

// Without highlighting a current model
<BenchmarkComparison modelIds={[1, 2, 3]} />
```

**Features**:
- Multi-model overlay chart
- Detailed comparison table
- Color-coded models
- Interactive tooltips
- Benchmark filtering

### Hook Usage Examples

#### useModelVersions

```typescript
import { useModelVersions } from '@/features/models';

function MyComponent({ slug }: { slug: string }) {
  const { data, isLoading, error } = useModelVersions(slug);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading versions</div>;
  if (!data?.versions.length) return <div>No versions available</div>;

  const latestVersion = data.versions.find(v => v.isLatest);

  return (
    <div>
      <h2>Latest: {latestVersion?.version}</h2>
      <p>Released: {new Date(latestVersion.releasedAt).toLocaleDateString()}</p>
    </div>
  );
}
```

#### useRelatedModels

```typescript
import { useRelatedModels } from '@/features/models';

function MyComponent({ slug }: { slug: string }) {
  const { data, isLoading, error } = useRelatedModels(slug);

  if (isLoading) return <div>Loading...</div>;
  if (error || !data?.models.length) return null; // Fail silently

  return (
    <div>
      <h3>You might also like:</h3>
      {data.models.slice(0, 3).map(model => (
        <div key={model.id}>
          <a href={`/models/${model.slug}`}>{model.name}</a>
          <span>{model.similarity}% similar</span>
        </div>
      ))}
    </div>
  );
}
```

#### useCommunityResources

```typescript
import { useCommunityResources } from '@/features/models';

function MyComponent({ slug }: { slug: string }) {
  const { data, isLoading, error } = useCommunityResources(slug);

  if (isLoading) return <div>Loading resources...</div>;
  if (error || !data?.resources.length) {
    return <div>No community resources yet</div>;
  }

  // Filter by type
  const tutorials = data.resources.filter(r => r.type === 'tutorial');
  const useCases = data.resources.filter(r => r.type === 'use_case');

  return (
    <div>
      <h3>Tutorials ({tutorials.length})</h3>
      {tutorials.map(tutorial => (
        <a key={tutorial.id} href={tutorial.url} target="_blank" rel="noopener noreferrer">
          {tutorial.title}
        </a>
      ))}
    </div>
  );
}
```

#### useBenchmarkComparison

```typescript
import { useBenchmarkComparison } from '@/features/models';

function MyComponent({ modelIds }: { modelIds: number[] }) {
  const { data, isLoading, error } = useBenchmarkComparison(modelIds);

  if (modelIds.length === 0) {
    return <div>Select models to compare</div>;
  }

  if (isLoading) return <div>Loading comparison...</div>;
  if (error) return <div>Error loading comparison</div>;

  return (
    <div>
      <h3>Comparing {data.models.length} models</h3>
      {data.benchmarks.map(benchmark => (
        <div key={benchmark.name}>
          <h4>{benchmark.name}</h4>
          {benchmark.scores.map(score => {
            const model = data.models.find(m => m.id === score.modelId);
            return (
              <div key={score.modelId}>
                {model?.name}: {score.score} / {score.maxScore || 100}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

### Type Definitions

#### ModelVersion

```typescript
interface ModelVersion {
  id: number;
  version: string;              // e.g., "GPT-4 Turbo"
  releasedAt: string;           // ISO 8601 date
  changelog?: string;           // Release notes
  features?: string[];          // New features
  improvements?: string[];      // Improvements
  isLatest: boolean;            // Is this the latest version?
}
```

#### RelatedModel

```typescript
interface RelatedModel {
  id: number;
  name: string;
  slug: string;
  provider: ModelProvider;
  category: ModelCategory;
  description: string;
  similarity: number;           // 0-100 similarity score
}
```

#### CommunityResource

```typescript
interface CommunityResource {
  id: number;
  type: 'tutorial' | 'use_case' | 'article' | 'video';
  title: string;
  url: string;
  author?: string;
  publishedAt?: string;         // ISO 8601 date
  description?: string;
}
```

#### BenchmarkComparisonData

```typescript
interface BenchmarkComparisonData {
  models: Array<{
    id: number;
    name: string;
    slug: string;
    color: string;              // Hex color for chart
  }>;
  benchmarks: Array<{
    name: string;               // e.g., "MMLU", "HumanEval"
    description?: string;
    scores: Array<{
      modelId: number;
      score: number;
      maxScore?: number;        // Optional, defaults to 100
    }>;
  }>;
}
```

### API Endpoints

All hooks automatically fetch from these endpoints:

| Hook | Endpoint | Method |
|------|----------|--------|
| `useModelVersions` | `/api/v1/models/:slug/versions` | GET |
| `useModelBenchmarks` | `/api/v1/models/:slug/benchmarks` | GET |
| `useRelatedModels` | `/api/v1/models/:slug/related?limit=6` | GET |
| `useCommunityResources` | `/api/v1/models/:slug/community-resources?limit=10` | GET |
| `useBenchmarkComparison` | `/api/v1/models/compare/benchmarks?ids=1,2,3` | GET |

### Styling Guidelines

All components follow these patterns:

#### Responsive Grid

```tsx
// Responsive grid: 1 column mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

#### Dark Mode

```tsx
// Text
<p className="text-gray-900 dark:text-white">Text</p>
<p className="text-gray-600 dark:text-gray-400">Secondary text</p>

// Backgrounds
<div className="bg-white dark:bg-gray-800">Content</div>
<div className="bg-gray-50 dark:bg-gray-800/50">Secondary bg</div>

// Borders
<div className="border border-gray-200 dark:border-gray-700">Content</div>
```

#### Loading States

```tsx
// Skeleton loader
{isLoading && (
  <div className="animate-pulse space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
    ))}
  </div>
)}
```

#### Empty States

```tsx
// Empty state message
{!data?.items.length && (
  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
    No items available
  </p>
)}
```

### Common Patterns

#### Conditional Component Rendering

```tsx
// Only render if data exists
function MyComponent({ slug }: { slug: string }) {
  const { data, isLoading, error } = useRelatedModels(slug);

  // Don't show error, just hide component
  if (error || !data?.models.length) return null;

  // Show loading state
  if (isLoading) return <Skeleton />;

  // Render component
  return <RelatedModelsDisplay models={data.models} />;
}
```

#### External Links

```tsx
// Always use proper security attributes
<a
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  className="text-primary-600 dark:text-primary-400 hover:underline"
>
  Link text →
</a>
```

#### Date Formatting

```tsx
// Consistent date formatting
{new Date(dateString).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})}

// Short format
{new Date(dateString).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})}
```

### Accessibility

All components include:

- ✅ Semantic HTML elements
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader friendly
- ✅ Sufficient color contrast

### Performance Tips

1. **React Query Caching**: All hooks use React Query's built-in caching
2. **Conditional Rendering**: Components only render when data is available
3. **Lazy Loading**: Can wrap any component in `React.lazy()`
4. **Code Splitting**: Import components dynamically when needed
5. **Optimistic Updates**: Use React Query's optimistic update patterns

### Testing Recommendations

```typescript
// Example test structure
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModelVersions } from './ModelVersions';

describe('ModelVersions', () => {
  it('should display version history', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ModelVersions modelSlug="gpt-4" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Version History')).toBeInTheDocument();
    });
  });
});
```

### Common Issues & Solutions

#### Issue: Hook not fetching data

**Solution**: Ensure you're inside a QueryClientProvider:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourComponent />
    </QueryClientProvider>
  );
}
```

#### Issue: Component not showing

**Solution**: Check if data exists before rendering:

```tsx
const { data } = useRelatedModels(slug);

// This will hide component if no data
if (!data?.models.length) return null;
```

#### Issue: TypeScript errors

**Solution**: Import types from the feature module:

```typescript
import type { ModelVersion, RelatedModel } from '@/features/models';
```

### Further Reading

- [React Query Documentation](https://tanstack.com/query/latest)
- [Recharts Documentation](https://recharts.org/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

**Last Updated**: November 6, 2025
**Sprint**: SPRINT-11-002
**Status**: ✅ Completed
