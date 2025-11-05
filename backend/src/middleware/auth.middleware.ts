import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/node';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';
import env from '@/config/env';
import prisma from '@/config/database';
import logger from '@/utils/logger';
import { UserRole } from '@prisma/client';

/**
 * JWT Payload interface
 */
interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }

    // Verify session if sessionId is present
    if (decoded.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
      });

      if (!session) {
        throw new UnauthorizedError('Session not found');
      }

      if (session.expiresAt < new Date()) {
        throw new UnauthorizedError('Session expired');
      }

      if (session.userId !== decoded.userId) {
        throw new UnauthorizedError('Invalid session');
      }

      // Update last active time
      await prisma.session.update({
        where: { id: decoded.sessionId },
        data: { lastActiveAt: new Date() },
      });

      // Attach session ID to request
      req.sessionId = decoded.sessionId;
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('User account is not active');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // Set Sentry user context
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    logger.debug(`User authenticated: ${user.id}`);

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      Sentry.captureException(error, {
        tags: { middleware: 'authenticate' },
      });
      next(new UnauthorizedError('Authentication failed'));
    }
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is provided, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // If no token, just continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    // Try to verify token
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      // Verify session if sessionId is present
      if (decoded.sessionId) {
        const session = await prisma.session.findUnique({
          where: { id: decoded.sessionId },
        });

        if (session && session.expiresAt > new Date() && session.userId === decoded.userId) {
          // Update last active time
          await prisma.session.update({
            where: { id: decoded.sessionId },
            data: { lastActiveAt: new Date() },
          });

          // Attach session ID to request
          req.sessionId = decoded.sessionId;
        } else {
          // Invalid or expired session, continue without user
          return next();
        }
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
        },
      });

      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        };

        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.username,
        });
      }
    } catch (error) {
      // Token invalid or expired, just continue without user
      logger.debug('Optional auth: invalid or expired token');
    }

    next();
  } catch (error) {
    // Don't block request on error
    logger.error('Optional auth error:', error);
    next();
  }
};

/**
 * Role-based authorization middleware factory
 * Requires authentication first
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        'You do not have permission to access this resource'
      );
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(UserRole.admin);

/**
 * Moderator or admin middleware
 */
export const requireModerator = requireRole(UserRole.moderator, UserRole.admin);
