import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { AppError } from '@/utils/errors';
import logger from '@/utils/logger';
import env from '@/config/env';

// Type assertion to work around ts-node type checking issue
// The Express.Request interface IS extended in src/types/express.d.ts
// but ts-node doesn't always pick up the declaration merging
type ExtendedRequest = Request & {
  user?: {
    id: string;
    email: string;
    username: string;
    role: any;
  };
  requestId?: string;
  sessionId?: string;
};

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    stack?: string;
    details?: any;
  };
}

/**
 * Global error handler middleware
 * Must be registered last in middleware chain
 */
export const errorHandler = (
  err: Error | AppError,
  req: ExtendedRequest,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Capture in Sentry if operational error or unknown
  if (err instanceof AppError) {
    if (!err.isOperational) {
      Sentry.captureException(err, {
        tags: {
          path: req.path,
          method: req.method,
        },
        user: req.user
          ? {
              id: req.user.id,
              email: req.user.email,
              username: req.user.username,
            }
          : undefined,
      });
    }
  } else {
    // Unknown error - always capture
    Sentry.captureException(err, {
      tags: {
        path: req.path,
        method: req.method,
      },
      user: req.user
        ? {
            id: req.user.id,
            email: req.user.email,
            username: req.user.username,
          }
        : undefined,
    });
  }

  // Prepare error response
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError
      ? err.message
      : 'An unexpected error occurred';

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: ExtendedRequest,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
};

export default errorHandler;
