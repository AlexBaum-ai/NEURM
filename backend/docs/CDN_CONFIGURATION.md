# CDN Configuration Guide

## Overview

This document describes the CDN (Content Delivery Network) configuration for Neurmatic platform to optimize static asset delivery and improve performance.

## Recommended CDN Provider

**Primary Choice: Cloudflare**

Reasons:
- Free tier available with generous limits
- Global edge network (200+ locations)
- Built-in DDoS protection
- Automatic image optimization
- Free SSL/TLS
- Analytics and monitoring
- Easy integration with any origin server

**Alternative: CloudFront (AWS)**
- Better if already using AWS infrastructure
- Pay-as-you-go pricing
- Deep integration with S3

## Assets to Cache via CDN

### Static Assets (100% cache hit rate)
- JavaScript bundles: `/assets/js/*.js`
- CSS files: `/assets/css/*.css`
- Fonts: `/assets/fonts/*`
- Images: `/assets/images/*`
- Icons: `/assets/icons/*`
- Favicon: `/favicon.ico`

### Media Files (high cache hit rate)
- Article images: `/media/articles/*`
- User avatars: `/media/avatars/*`
- Company logos: `/media/companies/*`
- Portfolio images: `/media/portfolio/*`

### API Responses (selective caching)
- Public article listings: `/api/v1/articles?*` (5 minutes)
- Public job listings: `/api/v1/jobs?*` (5 minutes)
- Forum topics: `/api/v1/forum/topics?*` (2 minutes)
- Model data: `/api/v1/llm-guide/models` (1 hour)
- Categories/Tags: `/api/v1/news/categories` (1 hour)

## Cloudflare Configuration

### Step 1: Add Site to Cloudflare

1. Sign up at https://cloudflare.com
2. Add your domain (e.g., neurmatic.com)
3. Update nameservers at your domain registrar
4. Wait for DNS propagation (usually < 1 hour)

### Step 2: Configure Page Rules

Create the following page rules in Cloudflare dashboard:

#### Rule 1: Cache Static Assets
- **URL Pattern**: `*neurmatic.com/assets/*`
- **Settings**:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
  - Disable security features (not needed for static assets)

#### Rule 2: Cache Media Files
- **URL Pattern**: `*neurmatic.com/media/*`
- **Settings**:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 week
  - Browser Cache TTL: 1 week

#### Rule 3: Cache API Responses (Selective)
- **URL Pattern**: `*neurmatic.com/api/v1/articles*`
- **Settings**:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 5 minutes
  - Cache on Cookie: Cache on specific cookies only

#### Rule 4: Bypass Cache for Auth
- **URL Pattern**: `*neurmatic.com/api/v1/auth/*`
- **Settings**:
  - Cache Level: Bypass

#### Rule 5: Bypass Cache for User-Specific
- **URL Pattern**: `*neurmatic.com/api/v1/users/*`
- **Settings**:
  - Cache Level: Bypass

### Step 3: Configure Caching Settings

In Cloudflare Dashboard → Caching:

1. **Caching Level**: Standard
2. **Browser Cache TTL**: Respect Existing Headers
3. **Always Online**: Enabled (serves stale content if origin is down)
4. **Development Mode**: Off (enable temporarily to bypass cache during development)

### Step 4: Enable Performance Features

#### Speed Settings
- Auto Minify:
  - ✓ JavaScript
  - ✓ CSS
  - ✓ HTML
- Brotli: Enabled
- Early Hints: Enabled
- HTTP/2: Enabled
- HTTP/3 (QUIC): Enabled
- 0-RTT Connection Resumption: Enabled

#### Polish (Image Optimization)
- Setting: Lossless
- WebP: Enabled

### Step 5: Configure Origin Cache Control Headers

Update Express server to send appropriate cache headers:

```typescript
// backend/src/middleware/cache-headers.middleware.ts

import { Request, Response, NextFunction } from 'express';

export const cacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;

  // Static assets - long cache
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|woff|woff2|ttf|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('CDN-Cache-Control', 'public, max-age=31536000');
  }

  // API responses - short cache for public data
  else if (path.startsWith('/api/v1/articles') && req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.setHeader('CDN-Cache-Control', 'public, max-age=300');
  }

  // User-specific data - no cache
  else if (path.startsWith('/api/v1/users') || path.startsWith('/api/v1/auth')) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
  }

  next();
};
```

## Cache Invalidation Strategy

### Manual Invalidation (Cloudflare)

Via Cloudflare Dashboard:
1. Go to Caching → Purge Cache
2. Options:
   - Purge Everything (use sparingly)
   - Purge by URL (specific files)
   - Purge by Tag (if using Cache-Tag header)
   - Purge by Host

### Automatic Invalidation (Cloudflare API)

```typescript
// backend/src/services/cdn.service.ts

import axios from 'axios';
import logger from '@/utils/logger';

export class CDNService {
  private cloudflareApiUrl = 'https://api.cloudflare.com/client/v4';
  private zoneId = process.env.CLOUDFLARE_ZONE_ID;
  private apiToken = process.env.CLOUDFLARE_API_TOKEN;

  /**
   * Purge specific URLs from Cloudflare cache
   */
  async purgeUrls(urls: string[]): Promise<void> {
    try {
      await axios.post(
        `${this.cloudflareApiUrl}/zones/${this.zoneId}/purge_cache`,
        { files: urls },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Purged ${urls.length} URLs from CDN`);
    } catch (error) {
      logger.error('Failed to purge CDN cache:', error);
      throw error;
    }
  }

  /**
   * Purge all cache (use with caution)
   */
  async purgeAll(): Promise<void> {
    try {
      await axios.post(
        `${this.cloudflareApiUrl}/zones/${this.zoneId}/purge_cache`,
        { purge_everything: true },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Purged all CDN cache');
    } catch (error) {
      logger.error('Failed to purge all CDN cache:', error);
      throw error;
    }
  }

  /**
   * Purge by cache tags
   */
  async purgeTags(tags: string[]): Promise<void> {
    try {
      await axios.post(
        `${this.cloudflareApiUrl}/zones/${this.zoneId}/purge_cache`,
        { tags },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Purged CDN cache for tags: ${tags.join(', ')}`);
    } catch (error) {
      logger.error('Failed to purge CDN cache by tags:', error);
      throw error;
    }
  }
}

export const cdnService = new CDNService();
```

### Cache Invalidation Triggers

Automatically purge cache when content changes:

```typescript
// After article update
await cdnService.purgeUrls([
  `https://neurmatic.com/api/v1/articles/${articleId}`,
  'https://neurmatic.com/api/v1/articles?page=1',
]);

// After article category change
await cdnService.purgeTags(['articles', `category:${categoryId}`]);
```

## Cache Headers Explanation

### Cache-Control Directives

- `public`: Cacheable by browsers and CDN
- `private`: Cacheable by browser only (not CDN)
- `no-cache`: Must revalidate with origin
- `no-store`: Never cache
- `max-age=<seconds>`: Browser cache duration
- `s-maxage=<seconds>`: CDN cache duration (overrides max-age)
- `immutable`: Content never changes (perfect for versioned assets)
- `must-revalidate`: Must check with origin after expiry

### CDN-Specific Headers

- `CDN-Cache-Control`: Cloudflare-specific cache control
- `Cache-Tag`: For tag-based purging
- `Vary`: Specify which request headers affect caching

## Monitoring and Analytics

### Cloudflare Analytics

Monitor in Cloudflare Dashboard:
- Cache hit rate (aim for > 80% for static assets)
- Bandwidth savings
- Request count by country
- Top cached assets
- Cache status distribution

### Custom Monitoring

Add CDN metrics to your monitoring dashboard:

```typescript
// Track CDN performance
res.on('finish', () => {
  const cfCacheStatus = req.headers['cf-cache-status'];
  const cfRay = req.headers['cf-ray'];

  logger.info('CDN metrics', {
    path: req.path,
    cacheStatus: cfCacheStatus, // HIT, MISS, EXPIRED, BYPASS
    cfRay,
    responseTime: Date.now() - startTime,
  });
});
```

## Best Practices

1. **Version Static Assets**: Use content hashes in filenames (e.g., `main.abc123.js`)
2. **Set Long Cache Times**: For versioned assets, use `max-age=31536000` (1 year)
3. **Use Immutable Flag**: For assets that never change
4. **Warm Cache**: Pre-fetch popular content after deployments
5. **Monitor Cache Hit Rate**: Aim for > 80% for static assets, > 50% for API
6. **Test Cache Behavior**: Verify headers with `curl -I`
7. **Use Compression**: Enable Brotli/Gzip at CDN level
8. **Optimize Images**: Use WebP format via Cloudflare Polish
9. **Set Appropriate TTLs**: Balance freshness vs. performance
10. **Purge Strategically**: Avoid purging entire cache frequently

## Testing CDN Configuration

### Check Cache Headers

```bash
# Check if asset is cached
curl -I https://neurmatic.com/assets/js/main.js

# Expected headers:
# CF-Cache-Status: HIT
# Cache-Control: public, max-age=31536000, immutable
# Age: 12345 (seconds since cached)
```

### Test Cache Behavior

```bash
# First request (should be MISS)
curl -I https://neurmatic.com/api/v1/articles?page=1

# Second request (should be HIT)
curl -I https://neurmatic.com/api/v1/articles?page=1
```

### Verify Compression

```bash
# Check if Brotli is used
curl -H "Accept-Encoding: br" -I https://neurmatic.com/assets/js/main.js

# Expected header:
# Content-Encoding: br
```

## Environment Variables

Add to `.env.production`:

```env
# Cloudflare CDN
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
CDN_URL=https://cdn.neurmatic.com
CDN_ENABLED=true
```

## Troubleshooting

### Issue: Low Cache Hit Rate
**Solution**: Check if Cache-Control headers are set correctly

### Issue: Stale Content After Update
**Solution**: Implement automatic cache purging after content changes

### Issue: Authenticated Requests Cached
**Solution**: Ensure `private` or `no-cache` for user-specific endpoints

### Issue: CORS Errors
**Solution**: Configure CORS headers in Cloudflare or origin server

## Performance Targets

After CDN configuration:

- **Static Assets**: 95%+ cache hit rate
- **API Responses**: 50%+ cache hit rate
- **TTFB (First Byte)**: < 100ms (from edge)
- **Image Load Time**: < 500ms
- **Bandwidth Savings**: 70%+ from cache

## Next Steps

1. Set up Cloudflare account
2. Configure page rules as described
3. Update Express to send cache headers
4. Implement cache purging on content updates
5. Monitor cache hit rates
6. Optimize based on analytics

---

**Last Updated**: November 2025
**Author**: Backend Team
