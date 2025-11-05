import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from './logger';
import * as Sentry from '@sentry/node';

/**
 * BaseController
 *
 * Provides common controller utilities:
 * - Async error handling
 * - Standard response formatting
 * - Error response handling
 */

export class BaseController {
  /**
   * Async handler wrapper
   * Catches errors and passes them to error middleware
   */
  protected asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Send success response
   */
  protected success(res: Response, data: any, statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Send created response
   */
  protected created(res: Response, data: any): Response {
    return this.success(res, data, 201);
  }

  /**
   * Send no content response
   */
  protected noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send error response
   */
  protected error(res: Response, message: string, statusCode: number = 500): Response {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
      },
    });
  }

  /**
   * Send bad request response
   */
  protected badRequest(res: Response, message: string = 'Bad request'): Response {
    return this.error(res, message, 400);
  }

  /**
   * Send unauthorized response
   */
  protected unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  /**
   * Send forbidden response
   */
  protected forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }

  /**
   * Send not found response
   */
  protected notFound(res: Response, message: string = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  /**
   * Send validation error response
   */
  protected validationError(res: Response, errors: any): Response {
    return res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors,
      },
    });
  }

  /**
   * Handle Zod validation errors
   */
  protected handleZodError(res: Response, error: ZodError): Response {
    const errors = error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return this.validationError(res, errors);
  }

  /**
   * Log and capture exception to Sentry
   */
  protected captureException(error: Error, context?: Record<string, any>): void {
    logger.error('Controller error:', error);

    Sentry.captureException(error, {
      extra: context,
    });
  }
}
