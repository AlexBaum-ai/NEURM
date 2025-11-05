import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database';
import jwt from 'jsonwebtoken';
import env from '@/config/env';
import { UserRole } from '@prisma/client';

describe('Sessions API Integration Tests', () => {
  let authToken: string;
  let sessionId: string;
  let userId: string;
  let secondSessionId: string;
  let secondAuthToken: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'sessiontest@example.com',
        username: 'sessiontestuser',
        passwordHash: 'hashed_password',
        emailVerified: true,
        role: UserRole.user,
        status: 'active',
      },
    });

    userId = user.id;

    // Create first session
    const session1 = await prisma.session.create({
      data: {
        userId: user.id,
        token: 'test-token-1',
        refreshToken: 'test-refresh-token-1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
        lastActiveAt: new Date(),
      },
    });

    sessionId = session1.id;

    // Generate JWT token for first session
    authToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: session1.id,
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create second session
    const session2 = await prisma.session.create({
      data: {
        userId: user.id,
        token: 'test-token-2',
        refreshToken: 'test-refresh-token-2',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Safari/604.1',
        expiresAt: new Date(Date.now() + 86400000),
        lastActiveAt: new Date(),
      },
    });

    secondSessionId = session2.id;

    // Generate JWT token for second session
    secondAuthToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: session2.id,
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await prisma.session.deleteMany({
      where: { userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    await prisma.$disconnect();
  });

  describe('GET /api/v1/users/me/sessions', () => {
    it('should return all active sessions', async () => {
      const response = await request(app)
        .get('/api/v1/users/me/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toHaveLength(2);
      expect(response.body.data.count).toBe(2);

      const currentSession = response.body.data.sessions.find((s: any) => s.isCurrent);
      expect(currentSession).toBeDefined();
      expect(currentSession.id).toBe(sessionId);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/users/me/sessions')
        .expect(401);
    });

    it('should parse user agent correctly', async () => {
      const response = await request(app)
        .get('/api/v1/users/me/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const sessions = response.body.data.sessions;
      const desktopSession = sessions.find((s: any) => s.device.includes('Desktop'));
      const mobileSession = sessions.find((s: any) => s.device.includes('Mobile'));

      expect(desktopSession).toBeDefined();
      expect(mobileSession).toBeDefined();
    });
  });

  describe('DELETE /api/v1/users/me/sessions/:id', () => {
    it('should revoke a specific session', async () => {
      // Use first session token to revoke second session
      const response = await request(app)
        .delete(`/api/v1/users/me/sessions/${secondSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('revoked successfully');

      // Verify session was deleted
      const deletedSession = await prisma.session.findUnique({
        where: { id: secondSessionId },
      });

      expect(deletedSession).toBeNull();

      // Recreate second session for other tests
      const newSession = await prisma.session.create({
        data: {
          userId,
          token: 'test-token-2-new',
          refreshToken: 'test-refresh-token-2-new',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Safari/604.1',
          expiresAt: new Date(Date.now() + 86400000),
          lastActiveAt: new Date(),
        },
      });

      secondSessionId = newSession.id;
    });

    it('should return 403 when trying to revoke current session', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/me/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .delete('/api/v1/users/me/sessions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 422 for invalid session ID format', async () => {
      await request(app)
        .delete('/api/v1/users/me/sessions/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422);
    });
  });

  describe('POST /api/v1/users/me/sessions/revoke-all', () => {
    it('should revoke all sessions except current', async () => {
      // Create additional session to test
      await prisma.session.create({
        data: {
          userId,
          token: 'test-token-3',
          refreshToken: 'test-refresh-token-3',
          ipAddress: '192.168.1.3',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/91.0',
          expiresAt: new Date(Date.now() + 86400000),
          lastActiveAt: new Date(),
        },
      });

      const response = await request(app)
        .post('/api/v1/users/me/sessions/revoke-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.revokedCount).toBeGreaterThan(0);

      // Verify only current session remains
      const remainingSessions = await prisma.session.findMany({
        where: { userId },
      });

      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].id).toBe(sessionId);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/v1/users/me/sessions/revoke-all')
        .expect(401);
    });
  });

  describe('Session expiration handling', () => {
    it('should reject expired session', async () => {
      // Create expired session
      const expiredSession = await prisma.session.create({
        data: {
          userId,
          token: 'expired-token',
          refreshToken: 'expired-refresh-token',
          ipAddress: '192.168.1.4',
          userAgent: 'Test User Agent',
          expiresAt: new Date(Date.now() - 86400000), // Expired 24 hours ago
          lastActiveAt: new Date(),
        },
      });

      const expiredToken = jwt.sign(
        {
          userId,
          email: 'sessiontest@example.com',
          role: UserRole.user,
          sessionId: expiredSession.id,
        },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      await request(app)
        .get('/api/v1/users/me/sessions')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Cleanup
      await prisma.session.delete({
        where: { id: expiredSession.id },
      });
    });
  });
});
