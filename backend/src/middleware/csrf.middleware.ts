import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as Sentry from '@sentry/node';
import { ForbiddenError } from '@/utils/errors';
import logger from '@/utils/logger';
import env from '@/config/env';

/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 *
 * How it works:
 * 1. Server generates a random CSRF token and stores it in an httpOnly cookie
 * 2. Client reads a separate non-httpOnly cookie and sends it in a header
 * 3. Server validates that both tokens match
 *
 * This protects against CSRF attacks since:
 * - Attacker sites can't read cookies due to same-origin policy
 * - Attacker sites can't set custom headers in cross-origin requests
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = '__Host-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure random token
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to generate and set CSRF token
 * Should be applied early in the middleware chain
 */
export const setCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only set token for authenticated users
  if (!req.user) {
    return next();
  }

  // Check if token already exists in cookie
  let token = req.cookies[CSRF_COOKIE_NAME];

  // Generate new token if not present
  if (!token) {
    token = generateCsrfToken();
  }

  // Set httpOnly cookie for server-side validation
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });

  // Set non-httpOnly cookie for client to read and send in header
  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });

  next();
};

/**
 * Middleware to verify CSRF token
 * Should be applied to all state-changing routes (POST, PUT, PATCH, DELETE)
 */
export const verifyCsrfToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Skip CSRF check for non-state-changing methods
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    // Skip CSRF check for unauthenticated requests (they'll fail auth anyway)
    if (!req.user) {
      return next();
    }

    // Get token from cookie (server-side)
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];

    // Get token from header (client-side)
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    // Validate both tokens exist
    if (!cookieToken || !headerToken) {
      logger.warn('CSRF validation failed: Missing token', {
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        hasCookieToken: !!cookieToken,
        hasHeaderToken: !!headerToken,
      });

      Sentry.captureMessage('CSRF token missing', {
        level: 'warning',
        tags: {
          security: 'csrf',
          path: req.path,
        },
        user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      });

      throw new ForbiddenError('CSRF token missing');
    }

    // Validate tokens match using constant-time comparison
    const tokensMatch = crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );

    if (!tokensMatch) {
      logger.warn('CSRF validation failed: Token mismatch', {
        userId: req.user?.id,
        path: req.path,
        method: req.method,
      });

      Sentry.captureMessage('CSRF token mismatch', {
        level: 'warning',
        tags: {
          security: 'csrf',
          path: req.path,
        },
        user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      });

      throw new ForbiddenError('Invalid CSRF token');
    }

    logger.debug('CSRF validation successful', {
      userId: req.user?.id,
      path: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      next(error);
    } else {
      logger.error('CSRF validation error:', error);
      Sentry.captureException(error, {
        tags: { middleware: 'csrf' },
      });
      next(new ForbiddenError('CSRF validation failed'));
    }
  }
};

/**
 * Get CSRF token endpoint
 * Allows frontend to retrieve the CSRF token
 */
export const getCsrfToken = (req: Request, res: Response): void => {
  const token = req.cookies['csrf-token'];

  if (!token) {
    res.status(404).json({
      success: false,
      error: {
        message: 'CSRF token not found. Please authenticate first.',
        statusCode: 404,
      },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      csrfToken: token,
    },
  });
};
