import RSS from 'rss';
import * as Sentry from '@sentry/node';
import { Article, ArticleStatus } from '@prisma/client';
import prisma from '@/config/database';
import redisClient from '@/config/redisClient';
import logger from '@/utils/logger';
import env from '@/config/env';

/**
 * RSS Feed Service
 * Generates RSS 2.0 feeds for articles with Redis caching
 */
export class RssService {
  private readonly CACHE_TTL = 900; // 15 minutes in seconds
  private readonly CACHE_PREFIX = 'rss:feed:';
  private readonly ARTICLES_LIMIT = 50;

  /**
   * Generate RSS feed for articles
   * @param categorySlug - Optional category slug to filter articles
   * @returns RSS XML string
   */
  async generateFeed(categorySlug?: string): Promise<string> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${categorySlug || 'all'}`;

      // Try to get from cache
      if (redisClient.isReady()) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug(`RSS feed cache hit: ${categorySlug || 'all'}`);
          return cached;
        }
      }

      logger.debug(`RSS feed cache miss: ${categorySlug || 'all'}`);

      // Generate feed
      const feedXml = await this.buildFeed(categorySlug);

      // Cache the feed
      if (redisClient.isReady()) {
        await redisClient
          .set(cacheKey, feedXml, this.CACHE_TTL)
          .catch((error) => {
            logger.error(`Failed to cache RSS feed: ${error}`);
          });
      }

      return feedXml;
    } catch (error) {
      logger.error('Failed to generate RSS feed:', error);
      Sentry.captureException(error, {
        tags: { service: 'RssService', method: 'generateFeed' },
        extra: { categorySlug },
      });
      throw error;
    }
  }

  /**
   * Build RSS feed from database articles
   */
  private async buildFeed(categorySlug?: string): Promise<string> {
    // Fetch published articles
    const articles = await this.fetchArticles(categorySlug);

    // Create RSS feed
    const feed = new RSS({
      title: categorySlug
        ? `Neurmatic - ${categorySlug} Articles`
        : 'Neurmatic - LLM News & Articles',
      description: categorySlug
        ? `Latest articles about ${categorySlug} in the LLM community`
        : 'Latest news, insights, and articles about Large Language Models and AI',
      feed_url: categorySlug
        ? `${env.FRONTEND_URL}/api/feed/rss?category=${categorySlug}`
        : `${env.FRONTEND_URL}/api/feed/rss`,
      site_url: env.FRONTEND_URL,
      language: 'en',
      pubDate: articles.length > 0 ? articles[0].publishedAt : new Date(),
      ttl: 15, // 15 minutes
      generator: 'Neurmatic RSS Generator',
    });

    // Add articles to feed
    for (const article of articles) {
      feed.item({
        title: article.title,
        description: article.excerpt || article.content.substring(0, 300) + '...',
        url: `${env.FRONTEND_URL}/news/${article.slug}`,
        guid: article.id,
        categories: this.extractCategories(article),
        author: (article as any).author?.username || 'Neurmatic',
        date: article.publishedAt || article.createdAt,
        enclosure: article.featuredImage
          ? {
              url: article.featuredImage,
              type: 'image/jpeg', // Assuming JPEG, could be enhanced to detect actual type
            }
          : undefined,
      });
    }

    return feed.xml({ indent: true });
  }

  /**
   * Fetch articles from database
   */
  private async fetchArticles(categorySlug?: string): Promise<Article[]> {
    try {
      const whereClause: any = {
        status: ArticleStatus.published,
        publishedAt: {
          lte: new Date(),
        },
      };

      if (categorySlug) {
        whereClause.category = {
          slug: categorySlug,
        };
      }

      const articles = await prisma.article.findMany({
        where: whereClause,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: this.ARTICLES_LIMIT,
      });

      return articles;
    } catch (error) {
      logger.error('Failed to fetch articles for RSS feed:', error);
      Sentry.captureException(error, {
        tags: { service: 'RssService', method: 'fetchArticles' },
        extra: { categorySlug },
      });
      throw error;
    }
  }

  /**
   * Extract categories from article
   */
  private extractCategories(article: any): string[] {
    const categories: string[] = [];

    // Add article category
    if (article.category) {
      categories.push(article.category.name);
    }

    // Add article tags
    if (article.tags && article.tags.length > 0) {
      categories.push(...article.tags.map((t: any) => t.tag.name));
    }

    return categories;
  }

  /**
   * Invalidate RSS feed cache
   * Should be called when articles are published or updated
   */
  async invalidateCache(categorySlug?: string): Promise<void> {
    if (!redisClient.isReady()) return;

    try {
      if (categorySlug) {
        // Invalidate specific category feed
        await redisClient.del(`${this.CACHE_PREFIX}${categorySlug}`);
        logger.debug(`Invalidated RSS feed cache for category: ${categorySlug}`);
      } else {
        // Invalidate all feeds
        await redisClient.delPattern(`${this.CACHE_PREFIX}*`);
        logger.debug('Invalidated all RSS feed caches');
      }
    } catch (error) {
      logger.error('Failed to invalidate RSS feed cache:', error);
      // Don't throw - cache invalidation is not critical
    }
  }

  /**
   * Invalidate all RSS feed caches
   * Used when articles are created, updated, or deleted
   */
  async invalidateAllCaches(): Promise<void> {
    await this.invalidateCache();
  }
}

export default RssService;
