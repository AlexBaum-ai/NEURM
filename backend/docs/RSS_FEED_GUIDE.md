# RSS Feed API Guide

## Overview

The Neurmatic platform provides RSS 2.0 feeds for published articles, allowing users and applications to subscribe to content updates via standard RSS readers.

---

## Quick Start

### Basic Usage

```bash
# Get all articles
curl http://localhost:3000/api/feed/rss

# Filter by category
curl http://localhost:3000/api/feed/rss?category=news
```

### Subscribe in RSS Reader

Add one of these feed URLs to your RSS reader:

- **All Articles**: `http://localhost:3000/api/feed/rss`
- **News Category**: `http://localhost:3000/api/feed/rss?category=news`
- **Tutorials**: `http://localhost:3000/api/feed/rss?category=tutorials`
- **Research**: `http://localhost:3000/api/feed/rss?category=research`

---

## API Reference

### Endpoint

```
GET /api/feed/rss
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter articles by category slug |

### Response Headers

```
Content-Type: application/rss+xml; charset=utf-8
Cache-Control: public, max-age=900
```

### Response Body

Valid RSS 2.0 XML with the following structure:

```xml
<rss version="2.0">
  <channel>
    <title>Neurmatic - LLM News & Articles</title>
    <description>Latest news, insights, and articles...</description>
    <link>http://localhost:5173</link>
    <item>
      <title>Article Title</title>
      <description>Article excerpt...</description>
      <link>http://localhost:5173/news/article-slug</link>
      <guid>article-uuid</guid>
      <pubDate>Wed, 05 Nov 2025 12:00:00 GMT</pubDate>
      <author>username</author>
      <category>News</category>
      <enclosure url="..." type="image/jpeg" />
    </item>
  </channel>
</rss>
```

---

## Features

### 1. **Automatic Updates**

Feeds are automatically updated when:
- New articles are published
- Existing articles are updated
- Articles are deleted

### 2. **Caching**

- Feeds are cached for **15 minutes** in Redis
- Reduces database load and improves response times
- Cache is automatically invalidated on content changes

### 3. **Rate Limiting**

- **30 requests per minute** per IP address
- Protects server from abuse
- Standard RSS polling intervals are 15-60 minutes, well within limits

### 4. **Content Included**

Each RSS item includes:
- **Title**: Article title
- **Description**: Article excerpt or first 300 characters
- **Link**: URL to article on website
- **GUID**: Unique article identifier (UUID)
- **Publication Date**: When article was published
- **Author**: Article author username
- **Categories**: Article category + all tags
- **Featured Image**: As RSS enclosure (if present)

---

## Examples

### Example 1: Get All Articles

**Request:**
```bash
curl -H "Accept: application/rss+xml" \
     http://localhost:3000/api/feed/rss
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Neurmatic - LLM News & Articles</title>
    <description>Latest news, insights, and articles about Large Language Models and AI</description>
    <link>http://localhost:5173</link>
    <generator>Neurmatic RSS Generator</generator>
    <language>en</language>
    <ttl>15</ttl>
    <!-- Items here -->
  </channel>
</rss>
```

### Example 2: Filter by Category

**Request:**
```bash
curl http://localhost:3000/api/feed/rss?category=research
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Neurmatic - research Articles</title>
    <description>Latest articles about research in the LLM community</description>
    <!-- Only research category articles -->
  </channel>
</rss>
```

### Example 3: Validate Feed

```bash
# Download and validate XML
curl http://localhost:3000/api/feed/rss | xmllint --format - > feed.xml

# Check if valid RSS
xmllint --noout --dtdvalid http://www.rssboard.org/rss-2-0-1.rdf feed.xml
```

---

## Integration Examples

### Python (feedparser)

```python
import feedparser

# Parse feed
feed = feedparser.parse('http://localhost:3000/api/feed/rss')

# Access feed metadata
print(f"Feed Title: {feed.feed.title}")
print(f"Feed Description: {feed.feed.description}")

# Iterate through entries
for entry in feed.entries:
    print(f"Title: {entry.title}")
    print(f"Link: {entry.link}")
    print(f"Published: {entry.published}")
    print(f"Categories: {', '.join([cat.term for cat in entry.tags])}")
    print("---")
```

### JavaScript (rss-parser)

```javascript
const Parser = require('rss-parser');
const parser = new Parser();

(async () => {
  const feed = await parser.parseURL('http://localhost:3000/api/feed/rss');

  console.log(`Feed Title: ${feed.title}`);

  feed.items.forEach(item => {
    console.log(`Title: ${item.title}`);
    console.log(`Link: ${item.link}`);
    console.log(`Published: ${item.pubDate}`);
    console.log('---');
  });
})();
```

### curl + jq (for monitoring)

```bash
# Convert RSS to JSON and extract titles
curl -s http://localhost:3000/api/feed/rss | \
  xmllint --xpath '//item/title/text()' - | \
  head -10
```

---

## Caching Behavior

### Cache Strategy

1. **First Request**: Fetches from database, caches for 15 minutes
2. **Subsequent Requests**: Served from Redis cache (fast)
3. **After 15 Minutes**: Cache expires, next request fetches fresh data
4. **On Content Change**: Cache immediately invalidated

### Cache Keys

- All articles: `rss:feed:all`
- Category filter: `rss:feed:{categorySlug}`

### Manual Cache Invalidation

Admins can manually clear the cache if needed:

```bash
# Via Redis CLI
redis-cli DEL "rss:feed:all"
redis-cli KEYS "rss:feed:*" | xargs redis-cli DEL
```

---

## Error Handling

### Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | Bad Request | Invalid query parameter | Check category slug format |
| 429 | Too Many Requests | Rate limit exceeded | Wait 1 minute before retrying |
| 500 | Internal Server Error | Database/Redis issue | Check logs, contact admin |

### Example Error Response

When rate limited:
```json
{
  "status": 429,
  "message": "Too many RSS feed requests, please try again later"
}
```

---

## Performance Tips

### For RSS Readers

1. **Poll Interval**: Set to 30-60 minutes (feed updates every 15 min)
2. **Conditional Requests**: Use ETags if supported
3. **Bandwidth**: RSS feeds are ~10-50KB depending on articles

### For Developers

1. **Use Caching**: Feed responses are cached, no database hit within 15 min
2. **Filter by Category**: Smaller feeds = faster parsing
3. **Monitor Rate Limits**: Stay under 30 requests/minute
4. **Use CDN**: Add CDN in front of RSS endpoint for global distribution

---

## Monitoring

### Health Check

```bash
# Check if RSS feed is working
curl -I http://localhost:3000/api/feed/rss

# Expected response
HTTP/1.1 200 OK
Content-Type: application/rss+xml; charset=utf-8
Cache-Control: public, max-age=900
```

### Metrics to Monitor

1. **Response Time**: Should be < 200ms with caching
2. **Cache Hit Rate**: Should be > 90% for popular feeds
3. **Error Rate**: Should be < 0.1%
4. **Rate Limit Hits**: Monitor 429 responses

### Logging

RSS feed requests are logged with:
- Timestamp
- Requested category (if any)
- Cache hit/miss
- Response time

---

## Troubleshooting

### Feed Not Updating

**Problem**: RSS reader shows old articles

**Solutions:**
1. Check cache expiry (15 minutes)
2. Verify articles are published (status = 'published')
3. Check `publishedAt` date is in past
4. Clear Redis cache manually

### Invalid XML

**Problem**: RSS reader can't parse feed

**Solutions:**
1. Validate with `xmllint`: `curl http://localhost:3000/api/feed/rss | xmllint --format -`
2. Check for special characters in article content
3. Verify featured image URLs are valid

### Rate Limiting Issues

**Problem**: Getting 429 errors

**Solutions:**
1. Reduce polling frequency (max 30 requests/minute)
2. Implement exponential backoff
3. Contact admin to increase rate limit if needed

---

## Security

### Public Access

- RSS feeds are **publicly accessible** (no authentication required)
- Only **published articles** are included
- Draft and scheduled articles are excluded

### Data Exposure

Feeds include:
- ✅ Published article metadata
- ✅ Article excerpts
- ✅ Author usernames
- ❌ User email addresses
- ❌ Internal IDs (uses UUIDs)
- ❌ Draft content

---

## FAQ

### Q: How often does the feed update?

**A**: Feeds are cached for 15 minutes. When an article is published/updated, the cache is immediately cleared, so the feed updates within 15 minutes or instantly on content changes.

### Q: Can I subscribe to specific tags?

**A**: Not yet. Currently only category filtering is supported. Tag-based feeds may be added in a future sprint.

### Q: What's the maximum number of articles in a feed?

**A**: 50 articles (last 50 published articles, ordered by publication date).

### Q: Can I get full article content in the feed?

**A**: No, only excerpts are included. This encourages readers to visit the website for full content and improves SEO.

### Q: Is there an Atom or JSON feed?

**A**: Not yet. RSS 2.0 is currently supported. Atom and JSON Feed formats may be added in future sprints.

### Q: How do I report issues?

**A**: Contact the development team or create an issue in the project repository.

---

## Related Documentation

- [API Endpoints Documentation](../projectdoc/03-API_ENDPOINTS.md)
- [Article CRUD Implementation](./SPRINT-2-001-SUMMARY.md)
- [RSS Implementation Details](./SPRINT-3-006-IMPLEMENTATION.md)
- [Caching Strategy](../projectdoc/06-TECHNICAL_DECISIONS.md)

---

## Support

For questions or issues:
- **Email**: support@neurmatic.com
- **GitHub**: [Neurmatic Backend Repository](https://github.com/neurmatic/backend)
- **Sentry**: Monitor errors at https://sentry.io/neurmatic

---

**Last Updated**: November 5, 2025
**Version**: 1.0.0
