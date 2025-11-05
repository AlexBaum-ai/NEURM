import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import RssService from './rss.service';
import logger from '@/utils/logger';
import { BadRequestError } from '@/utils/errors';

/**
 * RSS Feed Controller
 * Handles RSS feed generation endpoints
 */
export class RssController {
  private rssService: RssService;

  constructor(rssService?: RssService) {
    this.rssService = rssService || new RssService();
  }

  /**
   * GET /api/feed/rss
   * Get RSS feed for articles
   * Query params: category (optional)
   */
  async getRssFeed(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const querySchema = z.object({
        category: z.string().optional(),
      });

      const { category } = querySchema.parse(req.query);

      // Generate RSS feed
      const feedXml = await this.rssService.generateFeed(category);

      // Set proper Content-Type header for RSS
      res.set({
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900', // 15 minutes
      });

      res.status(200).send(feedXml);

      logger.info(`RSS feed generated: ${category || 'all'}`);
    } catch (error) {
      logger.error('Failed to generate RSS feed:', error);
      Sentry.captureException(error, {
        tags: { controller: 'RssController', method: 'getRssFeed' },
        extra: { query: req.query },
      });

      if (error instanceof z.ZodError) {
        throw new BadRequestError('Invalid query parameters');
      }

      throw error;
    }
  }
}

export default RssController;
