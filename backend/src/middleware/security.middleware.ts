import { Request, Response, NextFunction } from 'express';
import { HelmetOptions } from 'helmet';
import env from '@/config/env';
import logger from '@/utils/logger';

/**
 * HTTPS Enforcement Middleware
 * Redirects HTTP requests to HTTPS in production
 * Also sets Strict-Transport-Security header
 */
export const enforceHttps = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip in development or if already using HTTPS
  if (env.NODE_ENV !== 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }

  // Log insecure request attempt
  logger.warn('Insecure HTTP request detected, redirecting to HTTPS', {
    path: req.path,
    ip: req.ip,
  });

  // Redirect to HTTPS
  res.redirect(301, `https://${req.headers.host}${req.url}`);
};

/**
 * Enhanced Helmet Configuration
 * Comprehensive security headers for production
 */
export const helmetConfig: HelmetOptions = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"], // Prevent clickjacking
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"], // unsafe-inline needed for some UI libraries
      upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
      connectSrc: ["'self'", env.FRONTEND_URL],
      mediaSrc: ["'self'", 'https:', 'blob:'],
      workerSrc: ["'self'", 'blob:'],
      manifestSrc: ["'self'"],
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options: Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options: Prevent MIME sniffing
  noSniff: true,

  // X-DNS-Prefetch-Control: Control DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },

  // X-Download-Options: Prevent IE from executing downloads
  ieNoOpen: true,

  // Referrer-Policy: Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-Permitted-Cross-Domain-Policies: Restrict Adobe Flash and PDF
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: false, // Can cause issues with third-party resources

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: {
    policy: 'same-origin',
  },

  // X-Powered-By: Remove (already handled by hidePoweredBy)
  hidePoweredBy: true,
};

/**
 * Security Headers Middleware
 * Adds additional custom security headers
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // X-XSS-Protection: Enable browser XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Permissions-Policy: Restrict browser features
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );

  // Expect-CT: Certificate Transparency
  if (env.NODE_ENV === 'production') {
    res.setHeader('Expect-CT', 'max-age=86400, enforce');
  }

  // Clear-Site-Data: Clear browser data on logout (set by logout endpoint)
  // Not set globally, only on specific endpoints

  next();
};

/**
 * Request ID Middleware
 * Adds unique request ID for tracking and debugging
 */
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] ||
    `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  req.requestId = requestId as string;
  res.setHeader('X-Request-ID', requestId);

  next();
};

/**
 * Security Configuration Summary
 * Returns current security configuration for health checks
 */
export const getSecurityConfig = () => {
  return {
    httpsEnforced: env.NODE_ENV === 'production',
    csrfProtection: true,
    rateLimiting: true,
    helmetHeaders: true,
    secureCooki: true,
    bcryptRounds: env.BCRYPT_ROUNDS || 12,
    jwtSecure: env.JWT_SECRET.length >= 32,
    environment: env.NODE_ENV,
  };
};
