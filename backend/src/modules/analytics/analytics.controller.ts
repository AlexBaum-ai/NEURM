import { Request, Response } from 'express';
import analyticsService from './analytics.service';
import { BaseController } from '@/utils/baseController';
import { z } from 'zod';

/**
 * Analytics Controller
 *
 * Handles HTTP endpoints for manual analytics tracking:
 * - Track article read completion
 * - Track article shares
 */

// Validation schemas
const trackViewSchema = z.object({
  timeOnPage: z.number().int().min(0).max(3600).optional().default(0),
  scrollDepth: z.number().min(0).max(100).optional().default(0),
});

const trackReadSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
  readTimeSeconds: z.number().int().min(0).max(3600),
  scrollDepth: z.number().min(0).max(100),
});

const trackShareSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'reddit', 'email', 'copy', 'other']),
});

const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

const popularQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

class AnalyticsController extends BaseController {
  /**
   * @route   POST /api/v1/articles/:articleId/view
   * @desc    Track article view with engagement metrics
   * @access  Public (optional auth)
   * @body    { timeOnPage?, scrollDepth? }
   */
  trackArticleView = this.asyncHandler(async (req: Request, res: Response) => {
    const articleId = req.params.articleId;
    const userId = req.user?.id;
    const sessionId = req.sessionId || (req as any).session?.id;
    const ipAddress = this.getClientIp(req);
    const userAgent = req.get('user-agent');
    const referrer = req.get('referer') || req.get('referrer');

    const validatedData = trackViewSchema.parse(req.body);

    const tracked = await analyticsService.trackArticleView({
      articleId,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      referrer,
    });

    return this.success(res, {
      tracked,
      message: tracked ? 'Article view tracked successfully' : 'View already tracked',
    });
  });

  /**
   * @route   POST /api/v1/analytics/articles/:articleId/read
   * @desc    Track article read completion
   * @access  Public (optional auth)
   * @body    { readTimeSeconds, scrollDepth }
   */
  trackArticleRead = this.asyncHandler(async (req: Request, res: Response) => {
    const articleId = req.params.articleId;
    const userId = req.user?.id;
    const sessionId = req.sessionId || (req as any).session?.id;

    const validatedData = trackReadSchema.parse({
      articleId,
      ...req.body,
    });

    await analyticsService.trackArticleRead({
      articleId: validatedData.articleId,
      userId,
      sessionId,
      readTimeSeconds: validatedData.readTimeSeconds,
      scrollDepth: validatedData.scrollDepth,
    });

    return this.success(res, {
      message: 'Article read tracked successfully',
    });
  });

  /**
   * @route   POST /api/v1/analytics/articles/:articleId/share
   * @desc    Track article share
   * @access  Public (optional auth)
   * @body    { platform }
   */
  trackArticleShare = this.asyncHandler(async (req: Request, res: Response) => {
    const articleId = req.params.articleId;
    const userId = req.user?.id;
    const sessionId = req.sessionId || (req as any).session?.id;

    const validatedData = trackShareSchema.parse({
      articleId,
      ...req.body,
    });

    await analyticsService.trackArticleShare({
      articleId: validatedData.articleId,
      userId,
      sessionId,
      platform: validatedData.platform,
    });

    return this.success(res, {
      message: 'Article share tracked successfully',
    });
  });

  /**
   * @route   GET /api/v1/analytics/articles/:articleId/has-viewed
   * @desc    Check if current IP has recently viewed article (for testing)
   * @access  Public
   */
  hasRecentView = this.asyncHandler(async (req: Request, res: Response) => {
    const articleId = req.params.articleId;
    const ipAddress = this.getClientIp(req);

    if (!ipAddress) {
      return this.badRequest(res, 'Unable to determine IP address');
    }

    const hasViewed = await analyticsService.hasRecentView(articleId, ipAddress);

    return this.success(res, {
      hasViewed,
      ipAddress,
      articleId,
    });
  });

  /**
   * @route   GET /api/v1/articles/:articleId/analytics
   * @desc    Get article analytics (views, engagement, bounce rate)
   * @access  Public
   * @query   { days? }
   */
  getArticleAnalytics = this.asyncHandler(async (req: Request, res: Response) => {
    const articleId = req.params.articleId;
    const { days } = analyticsQuerySchema.parse(req.query);

    const analytics = await analyticsService.getArticleAnalytics(articleId, days);

    return this.success(res, {
      articleId,
      period: days ? `Last ${days} days` : 'All time',
      analytics,
    });
  });

  /**
   * @route   GET /api/v1/articles/popular
   * @desc    Get popular articles based on view count
   * @access  Public
   * @query   { limit?, days? }
   */
  getPopularArticles = this.asyncHandler(async (req: Request, res: Response) => {
    const { limit, days } = popularQuerySchema.parse(req.query);

    const articles = await analyticsService.getPopularArticles(limit, days);

    return this.success(res, {
      articles,
      count: articles.length,
      period: days ? `Last ${days} days` : 'All time',
    });
  });

  /**
   * @route   GET /api/v1/articles/trending
   * @desc    Get trending articles using weighted scoring algorithm
   * @access  Public
   * @query   { limit? }
   */
  getTrendingArticles = this.asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const articles = await analyticsService.getTrendingArticles(limit);

    return this.success(res, {
      articles,
      count: articles.length,
      algorithm: 'score = (views_7d * 0.5) + (avgTime * 0.3) + (recency * 0.2)',
    });
  });

  /**
   * Extract client IP address from request
   */
  private getClientIp(req: Request): string | undefined {
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = req.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    return req.ip || req.socket.remoteAddress;
  }
}

export default AnalyticsController;
