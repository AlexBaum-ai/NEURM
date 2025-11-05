import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import { parseUserAgent } from '@/utils/userAgent';
import logger from '@/utils/logger';

const prisma = new PrismaClient();

export interface SessionWithMetadata {
  id: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string | null;
  location: string | null;
  lastActiveAt: Date;
  createdAt: Date;
  isCurrent: boolean;
}

export class SessionsService {
  /**
   * Get all active sessions for a user
   */
  async getUserSessions(
    userId: string,
    currentSessionId?: string
  ): Promise<SessionWithMetadata[]> {
    try {
      // Fetch all active sessions for the user
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          lastActiveAt: 'desc',
        },
      });

      logger.info(`Retrieved ${sessions.length} active sessions for user ${userId}`);

      // Transform sessions to include parsed metadata
      const sessionsWithMetadata: SessionWithMetadata[] = sessions.map((session) => {
        const parsed = parseUserAgent(session.userAgent || undefined);

        return {
          id: session.id,
          device: parsed.device,
          browser: parsed.browser,
          os: parsed.os,
          ipAddress: session.ipAddress,
          location: null, // GeoIP lookup can be added here in the future
          lastActiveAt: session.lastActiveAt,
          createdAt: session.createdAt,
          isCurrent: session.id === currentSessionId,
        };
      });

      return sessionsWithMetadata;
    } catch (error) {
      logger.error('Error retrieving user sessions:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Revoke a specific session by ID
   */
  async revokeSession(
    userId: string,
    sessionId: string,
    currentSessionId?: string
  ): Promise<void> {
    try {
      // Prevent revoking the current session
      if (sessionId === currentSessionId) {
        throw new ForbiddenError('Cannot revoke the current session. Use logout instead.');
      }

      // Find the session
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      // Verify the session belongs to the user
      if (session.userId !== userId) {
        throw new ForbiddenError('You do not have permission to revoke this session');
      }

      // Delete the session
      await prisma.session.delete({
        where: { id: sessionId },
      });

      logger.info(`Session ${sessionId} revoked for user ${userId}`);
    } catch (error) {
      logger.error('Error revoking session:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Revoke all sessions except the current one
   */
  async revokeAllSessions(userId: string, currentSessionId?: string): Promise<number> {
    try {
      // Delete all sessions except the current one
      const result = await prisma.session.deleteMany({
        where: {
          userId,
          id: currentSessionId ? { not: currentSessionId } : undefined,
        },
      });

      logger.info(`Revoked ${result.count} sessions for user ${userId}`);

      return result.count;
    } catch (error) {
      logger.error('Error revoking all sessions:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Cleanup expired sessions (to be called by a scheduled job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date();

      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lte: now,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired sessions`);

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Cleanup old sessions (30+ days) for a user
   */
  async cleanupOldSessions(userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.session.deleteMany({
        where: {
          userId,
          createdAt: {
            lte: thirtyDaysAgo,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old sessions for user ${userId}`);

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old sessions:', error);
      Sentry.captureException(error);
      throw error;
    }
  }
}

export default new SessionsService();
