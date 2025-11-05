import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { TooManyRequestsError } from '@/utils/errors';

/**
 * Rate limiter configuration options
 */
interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Create rate limiter middleware
 * Using memory store for now (single-server deployment)
 * TODO: Replace with Redis store when using compatible redis client
 */
export const createRateLimiter = (
  options: RateLimiterOptions = {}
): RateLimitRequestHandler => {
  const {
    windowMs = 60 * 60 * 1000, // 1 hour default
    max = 100, // 100 requests per window
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    skipSuccessfulRequests,
    skipFailedRequests,
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    // Using memory store for now (works in single-server deployment)
    // For multi-server: need to switch to redis package instead of ioredis
    handler: (_req, _res) => {
      throw new TooManyRequestsError(message);
    },
  });
};

/**
 * Predefined rate limiters for common use cases
 */

// General API rate limiter: 100 requests per 15 minutes
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again later',
});

// Strict rate limiter for auth endpoints: 5 requests per 15 minutes
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
});

// Profile update limiter: 10 updates per hour
export const profileUpdateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many profile updates, please try again later',
});

// File upload limiter: 5 uploads per hour
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many file uploads, please try again later',
});

// Create content limiter: 20 posts per hour
export const contentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many posts created, please try again later',
});

// Search limiter: 60 searches per minute
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many search requests, please try again later',
});

// Account settings limiter: 3 sensitive operations per hour (password/email change, deletion)
export const accountSettingsLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many account setting changes, please try again later',
});

export default {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  profileUpdateLimiter,
  uploadLimiter,
  contentLimiter,
  searchLimiter,
  accountSettingsLimiter,
};
