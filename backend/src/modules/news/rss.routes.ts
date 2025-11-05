import { Router } from 'express';
import RssController from './rss.controller';
import { asyncHandler } from '@/middleware/asyncHandler';
import { rateLimiter } from '@/middleware/rateLimiter';

const router = Router();
const rssController = new RssController();

/**
 * @route   GET /api/feed/rss
 * @desc    Get RSS feed for articles (optionally filtered by category)
 * @access  Public
 * @query   category - Optional category slug to filter articles
 */
router.get(
  '/rss',
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per IP
    message: 'Too many RSS feed requests, please try again later',
  }),
  asyncHandler((req, res) => rssController.getRssFeed(req, res))
);

export default router;
