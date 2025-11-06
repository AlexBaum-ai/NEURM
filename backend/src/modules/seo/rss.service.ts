import { PrismaClient } from '@prisma/client';
import RSS from 'rss';
import * as Sentry from '@sentry/node';

/**
 * RSS Service
 * Generates RSS feeds for news articles and forum topics
 */
export class RSSService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate RSS feed for news articles
   */
  async generateNewsRSS(): Promise<string> {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://neurmatic.com';

      const feed = new RSS({
        title: 'Neurmatic - LLM News & Articles',
        description: 'Latest news, insights, and articles about Large Language Models',
        feed_url: `${baseUrl}/rss/news`,
        site_url: baseUrl,
        image_url: `${baseUrl}/logo.png`,
        language: 'en',
        pubDate: new Date(),
        ttl: 60, // Time to live in minutes
        copyright: `© ${new Date().getFullYear()} Neurmatic`,
      });

      // Get latest 50 published articles
      const articles = await this.prisma.article.findMany({
        where: {
          status: 'published',
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              username: true,
              email: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 50,
      });

      // Add each article to the feed
      for (const article of articles) {
        feed.item({
          title: article.title,
          description: article.summary || this.stripHtml(article.content).substring(0, 200) + '...',
          url: `${baseUrl}/news/${article.slug}`,
          guid: article.id.toString(),
          categories: [
            article.category.name,
            ...article.tags.map((t) => t.tag.name),
          ],
          author: article.author.username,
          date: article.publishedAt,
          enclosure: article.featuredImageUrl
            ? {
                url: article.featuredImageUrl.startsWith('http')
                  ? article.featuredImageUrl
                  : `${baseUrl}${article.featuredImageUrl}`,
                type: 'image/jpeg',
              }
            : undefined,
        });
      }

      return feed.xml({ indent: true });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Generate RSS feed for forum topics
   */
  async generateForumRSS(): Promise<string> {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://neurmatic.com';

      const feed = new RSS({
        title: 'Neurmatic - Forum Discussions',
        description: 'Latest discussions and Q&A from the Neurmatic LLM community',
        feed_url: `${baseUrl}/rss/forum`,
        site_url: `${baseUrl}/forum`,
        image_url: `${baseUrl}/logo.png`,
        language: 'en',
        pubDate: new Date(),
        ttl: 30, // Time to live in minutes
        copyright: `© ${new Date().getFullYear()} Neurmatic`,
      });

      // Get latest 50 forum topics
      const topics = await this.prisma.forumTopic.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              username: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      // Add each topic to the feed
      for (const topic of topics) {
        const description = this.stripHtml(topic.content).substring(0, 300) + '...';

        feed.item({
          title: topic.title,
          description,
          url: `${baseUrl}/forum/t/${topic.slug}/${topic.id}`,
          guid: topic.id.toString(),
          categories: [
            topic.category.name,
            ...topic.tags.map((t) => t.tag.name),
          ],
          author: topic.author.username,
          date: topic.createdAt,
        });
      }

      return feed.xml({ indent: true });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}
