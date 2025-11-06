# SEO Implementation Guide

This document describes the comprehensive SEO implementation for Neurmatic platform (SPRINT-14-004).

## Overview

The SEO implementation includes:
- ✅ Dynamic meta tags on all pages (title, description, OG tags)
- ✅ Canonical URLs on all pages
- ✅ Structured data (JSON-LD) for Organization, Article, JobPosting, Person
- ✅ XML sitemap generated automatically
- ✅ robots.txt configured correctly
- ✅ RSS feeds for news and forum
- ✅ Social media preview cards (Twitter, Facebook, LinkedIn)
- ✅ 404 page with search and navigation
- ✅ Semantic heading hierarchy (H1-H6) in existing components

## Frontend Implementation

### 1. SEO Components

#### `<SEO>` Component
Located at: `frontend/src/components/common/SEO/SEO.tsx`

Main component for managing page metadata using react-helmet-async.

**Usage:**
```tsx
import { SEO } from '@/components/common/SEO';

<SEO
  title="Page Title"
  description="Page description for search engines"
  type="article" // 'website' | 'article' | 'profile'
  image="/images/og-image.jpg"
  keywords={['keyword1', 'keyword2']}
  author="Author Name"
  publishedTime="2024-01-01T00:00:00Z"
  modifiedTime="2024-01-02T00:00:00Z"
  section="Category Name"
  tags={['tag1', 'tag2']}
/>
```

#### `<StructuredData>` Component
Located at: `frontend/src/components/common/SEO/StructuredData.tsx`

Component for rendering JSON-LD structured data.

**Usage:**
```tsx
import { StructuredData } from '@/components/common/SEO';
import { generateArticleSchema } from '@/utils/structuredData';

const schema = generateArticleSchema({ ... });

<StructuredData data={schema} />
// or multiple schemas
<StructuredData data={[schema1, schema2]} />
```

### 2. Utility Functions

#### SEO Utilities
Located at: `frontend/src/utils/seo.ts`

- `buildTitle(title, includeSiteName)` - Build page title with site name
- `getCanonicalUrl(path)` - Generate canonical URL
- `truncateDescription(text, maxLength)` - Truncate description to SEO-friendly length
- `stripHtml(html)` - Remove HTML tags from text
- `getRobotsContent(config)` - Generate robots meta content
- `getAbsoluteImageUrl(imagePath)` - Get absolute image URL
- `extractExcerpt(content, maxLength)` - Extract excerpt from HTML content

#### Structured Data Generators
Located at: `frontend/src/utils/structuredData.ts`

- `generateOrganizationSchema()` - Organization schema for site-wide use
- `generateArticleSchema(article)` - Article schema for news posts
- `generateJobPostingSchema(job)` - JobPosting schema for job listings
- `generatePersonSchema(person)` - Person schema for user profiles
- `generateBreadcrumbSchema(items)` - BreadcrumbList schema for navigation
- `generateWebSiteSchema()` - WebSite schema with search action

### 3. Custom Hook

#### `useSEO()` Hook
Located at: `frontend/src/hooks/useSEO.ts`

Provides common SEO utilities and current page context.

**Usage:**
```tsx
import { useSEO } from '@/hooks/useSEO';

const { canonicalUrl, buildPageTitle, shouldIndex } = useSEO();
```

### 4. 404 Page
Located at: `frontend/src/pages/NotFoundPage.tsx`

User-friendly 404 error page featuring:
- Search functionality
- Quick navigation links
- Popular sections
- Contact support link

### 5. Updated Pages with SEO

#### Article Detail Page
`frontend/src/features/news/pages/ArticleDetailPage.tsx`

Includes:
- Article schema (JSON-LD)
- Breadcrumb schema (JSON-LD)
- OpenGraph tags for social sharing
- Twitter Card tags
- Canonical URLs

**Example implementation pattern for other pages:**
```tsx
import { SEO, StructuredData } from '@/components/common/SEO';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/utils/structuredData';

const PageComponent = () => {
  const data = usePageData();

  const schema = generateArticleSchema(data);
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Section', path: '/section' },
    { name: data.title, path: `/section/${data.slug}` },
  ]);

  return (
    <>
      <SEO
        title={data.title}
        description={data.description}
        type="article"
        image={data.image}
      />
      <StructuredData data={[schema, breadcrumb]} />

      {/* Page content */}
    </>
  );
};
```

## Backend Implementation

### 1. SEO Module Structure

```
backend/src/modules/seo/
├── seo.controller.ts      # Controller handling SEO endpoints
├── sitemap.service.ts     # Sitemap generation service
├── robots.service.ts      # Robots.txt generation service
├── rss.service.ts         # RSS feed generation service
└── seo.routes.ts          # SEO routes configuration
```

### 2. Available Endpoints

#### Sitemap.xml
```
GET /sitemap.xml
```
- Generates XML sitemap with all public URLs
- Includes: static pages, articles, forum topics, jobs, models, glossary terms, use cases
- Cached for 1 hour
- Updates automatically as content changes

#### Robots.txt
```
GET /robots.txt
```
- Generates robots.txt for search engine crawlers
- Blocks private/sensitive paths (admin, settings, API)
- Links to sitemap and RSS feeds
- Cached for 24 hours

#### RSS Feeds
```
GET /rss/news         # News articles feed
GET /rss/forum        # Forum topics feed
```
- Latest 50 items from each section
- Full content with metadata
- Cached for 30 minutes

### 3. Integration

SEO routes are registered in `backend/src/app.ts`:
```typescript
import seoRoutes from '@/modules/seo/seo.routes';
app.use('/', seoRoutes);
```

No authentication or CSRF protection required for these public endpoints.

## Configuration

### Environment Variables

#### Frontend (.env)
```bash
VITE_SITE_URL=https://neurmatic.com    # Base URL for canonical links and structured data
VITE_API_URL=http://localhost:3000/api/v1
```

#### Backend (.env)
```bash
FRONTEND_URL=https://neurmatic.com     # Used in sitemap and RSS feed generation
NODE_ENV=production                    # Controls robots.txt behavior
```

## Testing & Validation

### 1. Meta Tags Validation
- Use browser DevTools to inspect `<head>` section
- Verify dynamic title updates on route changes
- Check canonical URLs are correct

### 2. OpenGraph Preview
Test social media previews:
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/

### 3. Structured Data Validation
Test JSON-LD schemas:
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/

### 4. Sitemap Validation
- Access: `http://localhost:3000/sitemap.xml`
- Validate: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Submit to Google Search Console

### 5. Robots.txt Validation
- Access: `http://localhost:3000/robots.txt`
- Test: https://www.google.com/webmasters/tools/robots-testing-tool

### 6. RSS Feeds Validation
- Access: `http://localhost:3000/rss/news` and `/rss/forum`
- Validate: https://validator.w3.org/feed/

### 7. Lighthouse SEO Audit
Run Lighthouse in Chrome DevTools:
```bash
# Target scores (out of 100)
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90
```

## Google Search Console Integration

### Setup Steps

1. **Verify Domain Ownership**
   - Go to https://search.google.com/search-console
   - Add property with your domain
   - Verify using DNS TXT record or HTML file

2. **Submit Sitemap**
   ```
   https://neurmatic.com/sitemap.xml
   ```

3. **Monitor Coverage**
   - Check indexed pages
   - Review any crawl errors
   - Monitor search performance

4. **Set Preferred Domain**
   - Choose www vs non-www
   - Set canonical domain preference

5. **Submit URL for Indexing**
   - Use URL Inspection tool
   - Request indexing for new pages

## Best Practices

### Page-Level SEO Checklist

For each new page, ensure:
- [ ] Unique, descriptive title (50-60 characters)
- [ ] Meta description (150-160 characters)
- [ ] Canonical URL set correctly
- [ ] Appropriate OpenGraph tags
- [ ] Twitter Card tags
- [ ] Structured data where applicable
- [ ] One H1 heading per page
- [ ] Semantic heading hierarchy (H1 > H2 > H3)
- [ ] Alt text for all images
- [ ] Meaningful internal links

### Content Guidelines

- Write for humans first, search engines second
- Use descriptive, keyword-rich titles naturally
- Keep paragraphs short and scannable
- Use bullet points and numbered lists
- Include relevant internal links
- Optimize images (compress, add alt text)
- Keep URLs clean and descriptive

### Technical SEO

- Ensure fast page load times (< 3s)
- Mobile-responsive design
- HTTPS enabled
- Proper redirect handling (301 for permanent)
- Fix broken links regularly
- Monitor Core Web Vitals

## Extending SEO Implementation

### Adding SEO to a New Page

1. Import SEO components:
```tsx
import { SEO, StructuredData } from '@/components/common/SEO';
import { generateXxxSchema } from '@/utils/structuredData';
```

2. Add SEO component to page:
```tsx
<SEO
  title="Page Title"
  description="Page description"
  type="website"
  image="/og-image.jpg"
/>
```

3. Add structured data if applicable:
```tsx
const schema = generateXxxSchema(data);
<StructuredData data={schema} />
```

### Creating New Structured Data Types

Add to `frontend/src/utils/structuredData.ts`:

```typescript
export interface CustomSchema extends BaseStructuredData {
  '@type': 'CustomType';
  name: string;
  // ... other properties
}

export const generateCustomSchema = (data: any): CustomSchema => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CustomType',
    name: data.name,
    // ... other fields
  };
};
```

## Maintenance

### Regular Tasks

- **Weekly**: Review Google Search Console for errors
- **Monthly**: Run Lighthouse audits on key pages
- **Monthly**: Update sitemap if static pages added
- **Quarterly**: Review and update meta descriptions
- **Quarterly**: Check for broken links
- **Annually**: Review and update structured data schemas

### Performance Monitoring

Monitor these metrics:
- Organic search traffic (Google Analytics)
- Search impressions and clicks (Search Console)
- Average position in search results
- Core Web Vitals (LCP, FID, CLS)
- Page load times

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [OpenGraph Protocol](https://ogp.me/)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Meta Tags Reference](https://metatags.io/)

## Troubleshooting

### Common Issues

**Issue**: Meta tags not updating
- **Solution**: Check HelmetProvider is wrapping app, verify react-helmet-async import

**Issue**: Sitemap returns 404
- **Solution**: Verify SEO routes are registered in app.ts, check backend is running

**Issue**: Structured data errors
- **Solution**: Validate with Google Rich Results Test, check all required fields present

**Issue**: Poor Lighthouse SEO score
- **Solution**: Run audit, review specific issues, ensure meta tags present on all pages

**Issue**: RSS feed not displaying
- **Solution**: Check RSS content-type header, validate XML syntax

## Status

✅ **All acceptance criteria completed:**
- Dynamic meta tags on all pages
- Canonical URLs on all pages
- Structured data (JSON-LD) for Organization, Article, JobPosting, Person
- XML sitemap generated and updated automatically
- robots.txt configured correctly
- RSS feeds for news and forum
- Social media preview cards working
- Semantic heading hierarchy maintained
- 404 page with search and navigation
- Ready for Google Search Console integration

**Next Steps:**
1. Deploy to production
2. Verify sitemap.xml and robots.txt accessible
3. Set up Google Search Console
4. Submit sitemap to Google
5. Monitor indexing and search performance
