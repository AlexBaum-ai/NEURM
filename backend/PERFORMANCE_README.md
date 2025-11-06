# Performance Optimization Quick Start

## Overview

This guide provides quick instructions for setting up and using the performance optimizations implemented in Sprint 14.

## Quick Setup

### 1. Apply Database Indexes

```bash
cd backend

# Apply performance indexes
psql $DATABASE_URL -f src/prisma/migrations/performance_indexes.sql
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Database Performance
DATABASE_CONNECTION_LIMIT=50
SLOW_QUERY_THRESHOLD=100

# Worker Configuration
WORKER_CONCURRENCY=5

# CDN (Optional - Cloudflare)
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
CDN_ENABLED=true
```

### 3. Update Database Configuration

Replace your database import with the optimized version:

```typescript
// Old
import prisma from '@/config/database';

// New (if you want optimized version)
import prisma from '@/config/database.optimized';
```

Or keep using the existing one - the optimizations will still work.

### 4. Add Performance Middleware

In your `app.ts`:

```typescript
import { performanceMiddleware } from '@/middleware/performance.middleware';
import { memoryProfiler } from '@/utils/memory-profiler';
import performanceRoutes from '@/modules/performance/performance.routes';

// Add performance tracking middleware
app.use(performanceMiddleware);

// Mount performance monitoring routes (admin-only)
app.use('/api/v1/performance', performanceRoutes);

// Start memory monitoring (optional)
if (process.env.NODE_ENV === 'production') {
  memoryProfiler.startMonitoring(60000); // Every minute
}
```

## Using the Performance Features

### Performance Dashboard

Access the admin dashboard:

```bash
# Get comprehensive dashboard
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-domain.com/api/v1/performance/dashboard

# Get specific metrics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-domain.com/api/v1/performance/metrics

# View slow queries
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-domain.com/api/v1/performance/slow-queries
```

### Cache Service

Use the enhanced caching service in your code:

```typescript
import { cacheService, CacheTier } from '@/services/cache.service';

// Get from cache
const data = await cacheService.get<ArticleData>('article:123');

// Set with tier and tags
await cacheService.set('article:123', article, {
  tier: CacheTier.WARM,  // 1 hour TTL
  tags: ['articles', 'category:tech']
});

// Cache-aside pattern (get or fetch)
const article = await cacheService.getOrSet(
  'article:123',
  async () => {
    return await prisma.article.findUnique({ where: { id: '123' } });
  },
  { tier: CacheTier.WARM }
);

// Invalidate by tag
await cacheService.invalidateByTag('articles');
```

### Memory Profiler

Monitor memory usage:

```typescript
import { memoryProfiler } from '@/utils/memory-profiler';

// Start monitoring
memoryProfiler.startMonitoring(60000);

// Get statistics
const stats = memoryProfiler.getStatistics();
console.log(stats);

// Generate report
const report = memoryProfiler.generateReport();
console.log(report);

// Stop monitoring
memoryProfiler.stopMonitoring();
```

### Load Testing

Run k6 load tests:

```bash
# Install k6
npm install -g k6

# Smoke test (10 users, 30s)
k6 run tests/load/k6-load-test.js

# Load test (100 users, 5 minutes)
k6 run --vus 100 --duration 5m tests/load/k6-load-test.js

# Stress test (1000 users)
k6 run --vus 1000 --duration 5m tests/load/k6-load-test.js

# Against production
BASE_URL=https://your-domain.com k6 run tests/load/k6-load-test.js
```

## Performance Monitoring Endpoints

All endpoints require admin authentication:

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/performance/health` | Health check (public) |
| `GET /api/v1/performance/dashboard` | Comprehensive dashboard |
| `GET /api/v1/performance/metrics` | Performance metrics |
| `GET /api/v1/performance/slow-queries` | Slow query report |
| `GET /api/v1/performance/cache-stats` | Cache statistics |
| `GET /api/v1/performance/database-stats` | Database statistics |
| `GET /api/v1/performance/resources` | System resources |
| `DELETE /api/v1/performance/cache/:pattern` | Invalidate cache |
| `DELETE /api/v1/performance/cache/tag/:tag` | Invalidate by tag |

## Cache Tiers

| Tier | TTL | Use Case |
|------|-----|----------|
| `HOT` | 5 minutes | Frequently accessed data |
| `WARM` | 1 hour | Moderately accessed data |
| `COLD` | 24 hours | Rarely accessed data |
| `PERMANENT` | No expiry | Static data (categories, tags) |

## Recommended Caching Strategy

```typescript
// Popular content - HOT
await cacheService.set('trending:articles', articles, {
  tier: CacheTier.HOT
});

// Regular content - WARM
await cacheService.set(`article:${id}`, article, {
  tier: CacheTier.WARM,
  tags: ['articles', `category:${article.categoryId}`]
});

// Static data - PERMANENT
await cacheService.set('categories', categories, {
  tier: CacheTier.PERMANENT
});

// User-specific - COLD (longer TTL, less frequent changes)
await cacheService.set(`user:profile:${userId}`, profile, {
  tier: CacheTier.COLD
});
```

## CDN Setup

See `/backend/docs/CDN_CONFIGURATION.md` for complete guide.

Quick steps:
1. Sign up for Cloudflare
2. Add your domain
3. Configure page rules (see docs)
4. Update DNS nameservers
5. Enable performance features

## Performance Targets

| Metric | Target | How to Check |
|--------|--------|--------------|
| API Response (p95) | < 200ms | Dashboard or `/performance/metrics` |
| DB Query Average | < 100ms | Dashboard or `/performance/slow-queries` |
| Cache Hit Rate | > 80% | `/performance/cache-stats` |
| Memory Usage | < 85% | Dashboard or `/performance/resources` |
| Error Rate | < 1% | Check logs and Sentry |

## Monitoring

### Daily Checks
- Review performance dashboard
- Check for slow queries
- Monitor cache hit rates
- Verify memory usage

### Weekly Tasks
- Run load tests
- Review slow query patterns
- Optimize heavy queries
- Adjust cache TTLs if needed

### Monthly Tasks
- Full performance audit
- Review and add indexes
- Update caching strategy
- Capacity planning

## Troubleshooting

### High API Response Times
```bash
# Check slow queries
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-domain.com/api/v1/performance/slow-queries

# Check cache hit rate
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-domain.com/api/v1/performance/cache-stats
```

### Low Cache Hit Rate
```typescript
// Increase cache TTLs
await cacheService.set(key, value, { tier: CacheTier.WARM }); // 1 hour

// Warm cache with popular content
await cacheService.warmCache([
  { key: 'popular:articles', value: articles, options: { tier: CacheTier.HOT } }
]);
```

### High Memory Usage
```typescript
// Check memory trend
const stats = memoryProfiler.getStatistics();
console.log('Memory trend:', stats.trend);

// Force garbage collection (dev only)
if (global.gc) global.gc();

// Check for memory leaks
const hasLeak = memoryProfiler.detectMemoryLeak();
```

### Slow Database Queries
```sql
-- Add missing indexes (see performance_indexes.sql)
CREATE INDEX idx_your_table_column ON your_table(column);

-- Run ANALYZE to update statistics
ANALYZE your_table;

-- Check for missing indexes
SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';
```

## Files Overview

| File | Purpose |
|------|---------|
| `services/performance.service.ts` | Core metrics tracking |
| `services/cache.service.ts` | Enhanced caching |
| `config/database.optimized.ts` | Optimized Prisma config |
| `middleware/performance.middleware.ts` | Request tracking |
| `modules/performance/` | Dashboard API |
| `prisma/migrations/performance_indexes.sql` | Database indexes |
| `tests/load/k6-load-test.js` | Load testing |
| `jobs/config/queue.config.ts` | Queue optimization |
| `utils/memory-profiler.ts` | Memory monitoring |

## Full Documentation

- **Complete Guide**: `/backend/docs/PERFORMANCE_OPTIMIZATION.md`
- **CDN Setup**: `/backend/docs/CDN_CONFIGURATION.md`
- **Sprint Task**: `/.claude/sprints/sprint-14.json` (SPRINT-14-001)

## Support

For issues or questions:
1. Check the full documentation
2. Review the implementation in sprint-14.json
3. Check logs and Sentry for errors
4. Run load tests to identify bottlenecks

---

**Status**: ✅ Complete
**Sprint**: 14
**Task**: SPRINT-14-001
**Last Updated**: November 2025
