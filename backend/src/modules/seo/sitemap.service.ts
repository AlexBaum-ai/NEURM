import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Sitemap Service
 * Generates XML sitemap for search engines
 */
export class SitemapService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate complete XML sitemap
   */
  async generateSitemap(): Promise<string> {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://neurmatic.com';
      const urls: SitemapURL[] = [];

      // Add static pages
      urls.push(...this.getStaticPages(baseUrl));

      // Add dynamic pages
      const [articles, topics, jobs, models, glossaryTerms, useCases] = await Promise.all([
        this.getArticleUrls(baseUrl),
        this.getForumTopicUrls(baseUrl),
        this.getJobUrls(baseUrl),
        this.getModelUrls(baseUrl),
        this.getGlossaryUrls(baseUrl),
        this.getUseCaseUrls(baseUrl),
      ]);

      urls.push(...articles, ...topics, ...jobs, ...models, ...glossaryTerms, ...useCases);

      return this.generateXML(urls);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get static page URLs
   */
  private getStaticPages(baseUrl: string): SitemapURL[] {
    return [
      { loc: `${baseUrl}/`, changefreq: 'daily', priority: 1.0 },
      { loc: `${baseUrl}/news`, changefreq: 'hourly', priority: 0.9 },
      { loc: `${baseUrl}/forum`, changefreq: 'hourly', priority: 0.9 },
      { loc: `${baseUrl}/jobs`, changefreq: 'daily', priority: 0.9 },
      { loc: `${baseUrl}/models`, changefreq: 'weekly', priority: 0.8 },
      { loc: `${baseUrl}/guide/glossary`, changefreq: 'weekly', priority: 0.7 },
      { loc: `${baseUrl}/guide/use-cases`, changefreq: 'weekly', priority: 0.7 },
      { loc: `${baseUrl}/forum/prompts`, changefreq: 'daily', priority: 0.7 },
      { loc: `${baseUrl}/forum/leaderboards`, changefreq: 'daily', priority: 0.6 },
      { loc: `${baseUrl}/badges`, changefreq: 'weekly', priority: 0.5 },
    ];
  }

  /**
   * Get article URLs
   */
  private async getArticleUrls(baseUrl: string): Promise<SitemapURL[]> {
    const articles = await this.prisma.article.findMany({
      where: { status: 'published', deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000, // Limit for performance
    });

    return articles.map((article) => ({
      loc: `${baseUrl}/news/${article.slug}`,
      lastmod: article.updatedAt.toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.8,
    }));
  }

  /**
   * Get forum topic URLs
   */
  private async getForumTopicUrls(baseUrl: string): Promise<SitemapURL[]> {
    const topics = await this.prisma.forumTopic.findMany({
      where: { deletedAt: null },
      select: { slug: true, id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000, // Limit for performance
    });

    return topics.map((topic) => ({
      loc: `${baseUrl}/forum/t/${topic.slug}/${topic.id}`,
      lastmod: topic.updatedAt.toISOString(),
      changefreq: 'daily' as const,
      priority: 0.7,
    }));
  }

  /**
   * Get job URLs
   */
  private async getJobUrls(baseUrl: string): Promise<SitemapURL[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'active',
        expiresAt: { gt: new Date() },
        deletedAt: null,
      },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return jobs.map((job) => ({
      loc: `${baseUrl}/jobs/${job.slug}`,
      lastmod: job.updatedAt.toISOString(),
      changefreq: 'weekly' as const,
      priority: 0.8,
    }));
  }

  /**
   * Get LLM model URLs
   */
  private async getModelUrls(baseUrl: string): Promise<SitemapURL[]> {
    const models = await this.prisma.llmModel.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { name: 'asc' },
    });

    return models.map((model) => ({
      loc: `${baseUrl}/models/${model.slug}`,
      lastmod: model.updatedAt.toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.7,
    }));
  }

  /**
   * Get glossary term URLs
   */
  private async getGlossaryUrls(baseUrl: string): Promise<SitemapURL[]> {
    const terms = await this.prisma.glossaryTerm.findMany({
      where: { deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { term: 'asc' },
    });

    return terms.map((term) => ({
      loc: `${baseUrl}/guide/glossary/${term.slug}`,
      lastmod: term.updatedAt.toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.6,
    }));
  }

  /**
   * Get use case URLs
   */
  private async getUseCaseUrls(baseUrl: string): Promise<SitemapURL[]> {
    const useCases = await this.prisma.useCase.findMany({
      where: { status: 'approved', deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return useCases.map((useCase) => ({
      loc: `${baseUrl}/guide/use-cases/${useCase.slug}`,
      lastmod: useCase.updatedAt.toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.6,
    }));
  }

  /**
   * Generate XML string from URLs
   */
  private generateXML(urls: SitemapURL[]): string {
    const urlElements = urls
      .map((url) => {
        let xml = `  <url>\n    <loc>${this.escapeXml(url.loc)}</loc>`;
        if (url.lastmod) {
          xml += `\n    <lastmod>${url.lastmod}</lastmod>`;
        }
        if (url.changefreq) {
          xml += `\n    <changefreq>${url.changefreq}</changefreq>`;
        }
        if (url.priority !== undefined) {
          xml += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
        }
        xml += `\n  </url>`;
        return xml;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlElements}
</urlset>`;
  }

  /**
   * Escape special XML characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
