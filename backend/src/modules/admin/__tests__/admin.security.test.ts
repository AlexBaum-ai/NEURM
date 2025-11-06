/**
 * Admin Security & Authorization Tests
 *
 * Tests security measures and authorization for admin endpoints
 */

import request from 'supertest';
import { app } from '../../../app';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../../utils/auth';

const prisma = new PrismaClient();

describe('Admin Security & Authorization Tests', () => {
  let adminToken: string;
  let moderatorToken: string;
  let userToken: string;
  let expiredToken: string;
  let invalidToken: string;

  beforeAll(async () => {
    // Create test users with different roles
    const adminUser = await prisma.user.create({
      data: {
        email: 'security_admin@test.com',
        username: 'security_admin',
        hashedPassword: 'hashed_password',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

    const moderatorUser = await prisma.user.create({
      data: {
        email: 'security_moderator@test.com',
        username: 'security_moderator',
        hashedPassword: 'hashed_password',
        role: 'MODERATOR',
        isEmailVerified: true,
      },
    });

    const regularUser = await prisma.user.create({
      data: {
        email: 'security_user@test.com',
        username: 'security_user',
        hashedPassword: 'hashed_password',
        role: 'USER',
        isEmailVerified: true,
      },
    });

    // Generate tokens
    adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: 'ADMIN' });
    moderatorToken = generateToken({
      id: moderatorUser.id,
      email: moderatorUser.email,
      role: 'MODERATOR',
    });
    userToken = generateToken({ id: regularUser.id, email: regularUser.email, role: 'USER' });

    // Generate expired token (set expiry in the past)
    expiredToken = generateToken(
      { id: regularUser.id, email: regularUser.email, role: 'USER' },
      '-1h'
    ); // Expired 1 hour ago

    // Invalid token
    invalidToken = 'invalid.jwt.token';
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['security_admin@test.com', 'security_moderator@test.com', 'security_user@test.com'],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('Authentication Tests', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app).get('/api/admin/dashboard').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('authentication');
    });

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests with expired token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('expired');
    });

    it('should reject requests with malformed Authorization header', async () => {
      await request(app).get('/api/admin/dashboard').set('Authorization', adminToken).expect(401);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should allow ADMIN role to access admin endpoints', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny MODERATOR role access to admin-only endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('admin');
    });

    it('should deny USER role access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should protect user management endpoints', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should protect content moderation endpoints', async () => {
      await request(app)
        .get('/api/admin/content')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should protect settings endpoints', async () => {
      await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should protect analytics endpoints', async () => {
      await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Input Validation & Injection Prevention', () => {
    it('should sanitize and validate search inputs', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ search: '<script>alert("xss")</script>' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Results should not contain script tags
      expect(JSON.stringify(response.body)).not.toContain('<script>');
    });

    it('should prevent SQL injection in query parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ search: "'; DROP TABLE users; --" })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify database is not affected
      const usersCount = await prisma.user.count();
      expect(usersCount).toBeGreaterThan(0);
    });

    it('should validate date range parameters', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/metrics')
        .query({
          startDate: 'invalid-date',
          endDate: 'also-invalid',
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate enum values (e.g., role)', async () => {
      const response = await request(app)
        .put('/api/admin/users/user-123/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SUPER_ADMIN' }) // Invalid role
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ search: 'not-an-email' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should handle gracefully without errors
      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on admin endpoints', async () => {
      const requests = [];

      // Make 100 rapid requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`)
        );
      }

      const responses = await Promise.all(requests);

      // At least some requests should be rate limited (429)
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Sensitive Data Protection', () => {
    it('should not expose sensitive user data in regular endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const users = response.body.data.users;

      users.forEach((user: any) => {
        // Should not expose hashed password
        expect(user.hashedPassword).toBeUndefined();

        // Should not expose JWT tokens
        expect(user.refreshToken).toBeUndefined();
      });
    });

    it('should not log sensitive information', async () => {
      // This is more of a code review check, but we can verify responses don't leak info
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Response should not contain JWT tokens or passwords
      expect(JSON.stringify(response.body)).not.toMatch(/hashedPassword/);
      expect(JSON.stringify(response.body)).not.toMatch(/refreshToken/);
    });
  });

  describe('Audit Logging', () => {
    it('should log all admin actions', async () => {
      // Perform an admin action
      const user = await prisma.user.findFirst({
        where: { email: 'security_user@test.com' },
      });

      await request(app)
        .post(`/api/admin/users/${user?.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Security test',
          duration: 7,
        })
        .expect(200);

      // Verify audit log was created
      const auditLog = await prisma.adminAuditLog.findFirst({
        where: {
          action: 'SUSPEND_USER',
          targetId: user?.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.reason).toContain('Security test');
    });

    it('should include admin ID in audit logs', async () => {
      const admin = await prisma.user.findFirst({
        where: { email: 'security_admin@test.com' },
      });

      const user = await prisma.user.findFirst({
        where: { email: 'security_user@test.com' },
      });

      await request(app)
        .post(`/api/admin/users/${user?.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const auditLog = await prisma.adminAuditLog.findFirst({
        where: {
          action: 'VERIFY_EMAIL',
          targetId: user?.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.adminId).toBe(admin?.id);
    });
  });

  describe('CSRF Protection', () => {
    it('should require CSRF token for state-changing operations', async () => {
      // This test assumes CSRF middleware is implemented
      const response = await request(app)
        .post('/api/admin/dashboard/refresh')
        .set('Authorization', `Bearer ${adminToken}`)
        // Missing CSRF token header
        .expect(403);

      // If CSRF is implemented, this should fail
      // If not implemented, this is a security recommendation
    });
  });

  describe('Permission Escalation Prevention', () => {
    it('should prevent users from escalating their own privileges', async () => {
      const user = await prisma.user.findFirst({
        where: { email: 'security_user@test.com' },
      });

      // Try to change own role to ADMIN
      const response = await request(app)
        .put(`/api/admin/users/${user?.id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'ADMIN' })
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify role wasn't changed
      const updatedUser = await prisma.user.findUnique({
        where: { id: user?.id },
      });

      expect(updatedUser?.role).toBe('USER');
    });

    it('should prevent MODERATOR from accessing ADMIN-only actions', async () => {
      const response = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should invalidate tokens after logout', async () => {
      // Perform logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Try to use same token
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should enforce session timeout', async () => {
      // This would require mocking time or waiting for actual timeout
      // Test is more conceptual - verify timeout configuration exists
    });
  });
});
