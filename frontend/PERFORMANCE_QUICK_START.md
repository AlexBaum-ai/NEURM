# Performance Optimization Quick Start

Quick reference guide for using performance optimization features in Neurmatic.

## 🚀 Quick Reference

### Lazy Load Images

```tsx
import { LazyImage } from '@/components/common/LazyImage';

<LazyImage
  src="/path/to/image.jpg"
  alt="Description"
  className="w-full"
/>
```

### Virtual Scrolling

```tsx
import { VirtualList } from '@/components/common/VirtualList';

<VirtualList
  items={data}
  itemHeight={100}
  height={600}
  renderItem={(item) => <Card {...item} />}
/>
```

### Debounce Search

```tsx
import { useDebounce } from '@/hooks';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

useEffect(() => {
  fetchResults(debouncedSearch);
}, [debouncedSearch]);
```

### Throttle Scroll

```tsx
import { useThrottledCallback } from '@/hooks';

const handleScroll = useThrottledCallback(() => {
  updateUI();
}, 100);
```

### Lazy Load Route

```tsx
import { lazy, Suspense } from 'react';

const Page = lazy(() => import('./Page'));

<Suspense fallback={<Loading />}>
  <Page />
</Suspense>
```

### Performance Marks

```tsx
import { mark, measure } from '@/utils/performance';

mark('start');
// ... operation ...
mark('end');
const duration = measure('operation', 'start', 'end');
```

## 📊 Analyze Bundle

```bash
npm run build
# Open dist/stats.html in browser
```

## 🎯 Performance Targets

- Initial Bundle: < 500KB ✅
- LCP: < 2.5s ✅
- FID: < 100ms ✅
- CLS: < 0.1 ✅
- FCP: < 1.8s ✅
- TTI: < 3.9s ✅

## 📖 Full Documentation

See [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) for complete details.
