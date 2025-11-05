import { Request, Response, NextFunction } from 'express';
import analyticsService from '@/modules/analytics/analytics.service';
import logger from '@/utils/logger';

/**
 * Analytics Middleware
 *
 * Automatically tracks article views when users visit article pages.
 * Extracts relevant information from request and triggers async tracking.
 */

/**
 * Track article view middleware
 * Should be applied to GET /articles/:id route
 */
export const trackArticleView = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const articleId = req.params.id || req.params.slug;

    if (!articleId) {
      logger.warn('Article ID/slug not found in request params');
      return next();
    }

    // Extract tracking information from request
    const userId = req.user?.id; // From auth middleware if user is logged in
    const sessionId = req.sessionId || (req as any).session?.id;
    const ipAddress = getClientIp(req);
    const userAgent = req.get('user-agent');
    const referrer = req.get('referer') || req.get('referrer');

    // Track view asynchronously (non-blocking)
    // Don't await - let it run in background
    analyticsService
      .trackArticleView({
        articleId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        referrer,
      })
      .catch((error) => {
        logger.error('Error in trackArticleView middleware:', error);
      });

    // Continue with request
    next();
  } catch (error) {
    logger.error('Analytics middleware error:', error);
    // Don't block request on analytics errors
    next();
  }
};

/**
 * Extract client IP address from request
 * Handles proxies and load balancers
 */
function getClientIp(req: Request): string | undefined {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) {
    // Take first IP if multiple are present
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header
  const realIp = req.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to socket remote address
  return req.ip || req.socket.remoteAddress;
}

/**
 * Parse share tracking parameters from URL
 * Tracks shares when users click on shared links with ref=share
 */
export const trackShareClick = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if this is a shared link
    const ref = req.query.ref as string;
    const platform = req.query.platform as string;

    if (ref === 'share' || platform) {
      const articleId = req.params.id || req.params.slug;
      const userId = req.user?.id;
      const sessionId = req.sessionId || (req as any).session?.id;

      if (articleId && platform) {
        // Track share click asynchronously
        analyticsService
          .trackArticleShare({
            articleId,
            userId,
            sessionId,
            platform: platform || 'unknown',
          })
          .catch((error) => {
            logger.error('Error in trackShareClick middleware:', error);
          });
      }
    }

    next();
  } catch (error) {
    logger.error('Share tracking middleware error:', error);
    next();
  }
};

/**
 * Combined analytics middleware
 * Tracks both views and share clicks
 */
export const trackArticleAnalytics = [trackArticleView, trackShareClick];

export default {
  trackArticleView,
  trackShareClick,
  trackArticleAnalytics,
};
