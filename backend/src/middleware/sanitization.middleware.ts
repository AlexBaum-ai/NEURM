import { Request, Response, NextFunction } from 'express';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';

/**
 * HTML Sanitization Middleware
 * Prevents XSS attacks by sanitizing HTML input
 *
 * Uses DOMPurify to clean HTML while preserving safe markup
 */

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitize configuration
 * Strict mode: Removes all HTML tags
 * Safe mode: Allows safe HTML tags (for rich text editors)
 */
const STRICT_CONFIG = {
  ALLOWED_TAGS: [] as string[],
  ALLOWED_ATTR: [] as string[],
  KEEP_CONTENT: true,
};

const SAFE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
    'class', 'id',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize a string value
 */
function sanitizeString(value: string, strict: boolean = true): string {
  const config = strict ? STRICT_CONFIG : SAFE_CONFIG;
  return DOMPurify.sanitize(value, config);
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any, strict: boolean = true): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj, strict);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, strict));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key], strict);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Fields that should allow HTML (for rich text content)
 * These use safe mode sanitization instead of strict mode
 */
const HTML_ALLOWED_FIELDS = new Set([
  'content',
  'body',
  'description',
  'bio',
  'summary',
  'message',
  'caption',
  'richText',
  'htmlContent',
]);

/**
 * Middleware to sanitize request body
 * Prevents XSS by cleaning all string inputs
 *
 * @param options.skipFields - Fields to skip sanitization
 * @param options.htmlFields - Additional fields that allow HTML
 */
export const sanitizeBody = (options: {
  skipFields?: string[];
  htmlFields?: string[];
} = {}) => {
  const skipFields = new Set(options.skipFields || []);
  const htmlFields = new Set([...HTML_ALLOWED_FIELDS, ...(options.htmlFields || [])]);

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return next();
      }

      const sanitized: any = {};

      for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) {
          // Skip specified fields
          if (skipFields.has(key)) {
            sanitized[key] = req.body[key];
            continue;
          }

          // Determine if this field allows HTML
          const allowHtml = htmlFields.has(key);

          // Sanitize the value
          sanitized[key] = sanitizeObject(req.body[key], !allowHtml);
        }
      }

      req.body = sanitized;

      logger.debug('Request body sanitized', {
        path: req.path,
        fields: Object.keys(sanitized),
      });

      next();
    } catch (error) {
      logger.error('Sanitization error:', error);
      Sentry.captureException(error, {
        tags: { middleware: 'sanitization' },
      });
      // Continue even if sanitization fails (better than blocking request)
      next();
    }
  };
};

/**
 * Middleware to sanitize query parameters
 * Query params are always strict (no HTML allowed)
 */
export const sanitizeQuery = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.query || typeof req.query !== 'object') {
      return next();
    }

    const sanitized: any = {};

    for (const key in req.query) {
      if (req.query.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(req.query[key], true);
      }
    }

    req.query = sanitized;

    next();
  } catch (error) {
    logger.error('Query sanitization error:', error);
    Sentry.captureException(error, {
      tags: { middleware: 'sanitization' },
    });
    next();
  }
};

/**
 * Utility function to sanitize HTML for display
 * Can be used in services/controllers
 */
export function sanitizeHtml(html: string, strict: boolean = false): string {
  const config = strict ? STRICT_CONFIG : SAFE_CONFIG;
  return DOMPurify.sanitize(html, config);
}

/**
 * Utility function to strip all HTML tags
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, STRICT_CONFIG);
}

export default {
  sanitizeBody,
  sanitizeQuery,
  sanitizeHtml,
  stripHtml,
};
