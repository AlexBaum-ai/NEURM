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
const trackReadSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
  readTimeSeconds: z.number().int().min(0).max(3600),
  scrollDepth: z.number().min(0).max(100),
});

const trackShareSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'reddit', 'email', 'copy', 'other']),
});

class AnalyticsController extends BaseController {
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
