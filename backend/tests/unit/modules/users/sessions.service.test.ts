import { PrismaClient } from '@prisma/client';
import { SessionsService } from '@/modules/users/sessions.service';
import { NotFoundError, ForbiddenError } from '@/utils/errors';

// Mock Prisma
jest.mock('@prisma/client');
jest.mock('@/utils/logger');
jest.mock('@sentry/node');

const mockPrismaClient = {
  session: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('SessionsService', () => {
  let sessionsService: SessionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionsService = new SessionsService();
    // Replace prisma instance with mock
    (sessionsService as any).prisma = mockPrismaClient;
  });

  describe('getUserSessions', () => {
    it('should return all active sessions for a user', async () => {
      const userId = 'user-123';
      const currentSessionId = 'session-1';

      const mockSessions = [
        {
          id: 'session-1',
          userId,
          token: 'token-1',
          refreshToken: 'refresh-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          lastActiveAt: new Date(),
        },
        {
          id: 'session-2',
          userId,
          token: 'token-2',
          refreshToken: 'refresh-2',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Safari/604.1',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          lastActiveAt: new Date(),
        },
      ];

      mockPrismaClient.session.findMany.mockResolvedValue(mockSessions);

      const result = await sessionsService.getUserSessions(userId, currentSessionId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
      expect(result[0].isCurrent).toBe(true);
      expect(result[1].id).toBe('session-2');
      expect(result[1].isCurrent).toBe(false);
      expect(result[0].device).toContain('Desktop');
      expect(result[1].device).toContain('Mobile');
    });

    it('should return empty array if no sessions found', async () => {
      mockPrismaClient.session.findMany.mockResolvedValue([]);

      const result = await sessionsService.getUserSessions('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session successfully', async () => {
      const userId = 'user-123';
      const sessionId = 'session-2';
      const currentSessionId = 'session-1';

      mockPrismaClient.session.findUnique.mockResolvedValue({
        id: sessionId,
        userId,
        token: 'token-2',
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockPrismaClient.session.delete.mockResolvedValue({});

      await sessionsService.revokeSession(userId, sessionId, currentSessionId);

      expect(mockPrismaClient.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
      expect(mockPrismaClient.session.delete).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
    });

    it('should throw error when trying to revoke current session', async () => {
      const userId = 'user-123';
      const sessionId = 'session-1';

      await expect(
        sessionsService.revokeSession(userId, sessionId, sessionId)
      ).rejects.toThrow(ForbiddenError);

      expect(mockPrismaClient.session.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when session does not exist', async () => {
      mockPrismaClient.session.findUnique.mockResolvedValue(null);

      await expect(
        sessionsService.revokeSession('user-123', 'nonexistent-session', 'current-session')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when session belongs to different user', async () => {
      mockPrismaClient.session.findUnique.mockResolvedValue({
        id: 'session-2',
        userId: 'different-user',
        token: 'token-2',
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(
        sessionsService.revokeSession('user-123', 'session-2', 'session-1')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all sessions except current one', async () => {
      const userId = 'user-123';
      const currentSessionId = 'session-1';

      mockPrismaClient.session.deleteMany.mockResolvedValue({ count: 3 });

      const result = await sessionsService.revokeAllSessions(userId, currentSessionId);

      expect(result).toBe(3);
      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          id: { not: currentSessionId },
        },
      });
    });

    it('should revoke all sessions when no current session provided', async () => {
      const userId = 'user-123';

      mockPrismaClient.session.deleteMany.mockResolvedValue({ count: 5 });

      const result = await sessionsService.revokeAllSessions(userId);

      expect(result).toBe(5);
      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          id: undefined,
        },
      });
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete all expired sessions', async () => {
      mockPrismaClient.session.deleteMany.mockResolvedValue({ count: 10 });

      const result = await sessionsService.cleanupExpiredSessions();

      expect(result).toBe(10);
      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lte: expect.any(Date),
          },
        },
      });
    });
  });

  describe('cleanupOldSessions', () => {
    it('should delete sessions older than 30 days', async () => {
      const userId = 'user-123';
      mockPrismaClient.session.deleteMany.mockResolvedValue({ count: 5 });

      const result = await sessionsService.cleanupOldSessions(userId);

      expect(result).toBe(5);
      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          createdAt: {
            lte: expect.any(Date),
          },
        },
      });
    });
  });
});
