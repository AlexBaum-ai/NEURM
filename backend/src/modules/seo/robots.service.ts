/**
 * Robots Service
 * Generates robots.txt file for search engine crawlers
 */
export class RobotsService {
  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(): string {
    const baseUrl = process.env.FRONTEND_URL || 'https://neurmatic.com';
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      // Block all crawlers in non-production environments
      return `User-agent: *
Disallow: /`;
    }

    // Production robots.txt
    return `# Neurmatic Robots.txt
# Generated: ${new Date().toISOString()}

# Allow all search engines
User-agent: *
Allow: /

# Disallow private/sensitive paths
Disallow: /admin/
Disallow: /settings/
Disallow: /api/
Disallow: /verify
Disallow: /reset-password
Disallow: /forgot-password
Disallow: /messages/
Disallow: /notifications/
Disallow: /companies/dashboard/

# Disallow search result pages with query parameters (avoid duplicate content)
Disallow: /*?*page=
Disallow: /*?*sort=
Disallow: /*?*filter=

# Allow specific bots to crawl everything (except disallowed paths)
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

# Crawl delay (optional, helps prevent server overload)
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# RSS Feeds
Sitemap: ${baseUrl}/rss/news
Sitemap: ${baseUrl}/rss/forum
`;
  }
}
