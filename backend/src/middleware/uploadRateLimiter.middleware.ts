import rateLimit from 'express-rate-limit';
import { UPLOAD_RATE_LIMIT } from '@/config/upload';
import logger from '@/utils/logger';

/**
 * Rate limiter for file uploads using memory store
 * Limits uploads to 5 per hour per user
 * TODO: Replace with RedisStore when using compatible redis client
 */
export const uploadRateLimiter = rateLimit({
  windowMs: UPLOAD_RATE_LIMIT.WINDOW_HOURS * 60 * 60 * 1000, // 1 hour in milliseconds
  max: UPLOAD_RATE_LIMIT.MAX_UPLOADS, // 5 uploads per window
  message: {
    success: false,
    error: 'Too many file uploads. Please try again later.',
    retryAfter: UPLOAD_RATE_LIMIT.WINDOW_HOURS * 60 * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers

  // Using memory store for now (works in single-server deployment)
  // For multi-server: need to switch to redis package instead of ioredis
  // or use a different Redis store compatible with ioredis

  // Key generator - use user ID for authenticated requests
  // Note: File uploads should always be authenticated, so IP fallback should never happen
  keyGenerator: (req) => {
    return req.user?.id || 'unauthenticated';
  },

  // Skip successful requests (only count failed uploads against the limit)
  skip: (req: any) => {
    // Skip rate limiting for successful uploads
    // This is set by the controller after successful upload
    return req.skipRateLimit === true;
  },

  // Handler for rate limit exceeded
  handler: (req, res) => {
    const userId = req.user?.id || 'unknown';
    logger.warn(`Upload rate limit exceeded for user: ${userId}`, {
      userId,
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      error: 'Too many file uploads. Please try again later.',
      message: `You have exceeded the upload limit of ${UPLOAD_RATE_LIMIT.MAX_UPLOADS} uploads per hour.`,
      retryAfter: UPLOAD_RATE_LIMIT.WINDOW_HOURS * 60 * 60, // seconds
    });
  },
});

/**
 * Middleware to skip rate limiting for successful uploads
 * Call this after a successful upload to not count it against the limit
 */
export const skipUploadRateLimit = (req: any) => {
  req.skipRateLimit = true;
};
