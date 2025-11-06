/**
 * Admin User Management Integration Tests
 *
 * Tests user management endpoints with authentication and authorization
 */

import request from 'supertest';
import { app } from '../../../../app';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../../../utils/auth';

const prisma = new PrismaClient();

describe('Admin User Management Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin_users@test.com',
        username: 'admin_users',
        hashedPassword: 'hashed_password',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

    // Create test regular user
    const testUser = await prisma.user.create({
      data: {
        email: 'testuser@test.com',
        username: 'testuser',
        hashedPassword: 'hashed_password',
        role: 'USER',
        isEmailVerified: false,
      },
    });

    // Create regular non-admin user
    const regularUser = await prisma.user.create({
      data: {
        email: 'regular@test.com',
        username: 'regular',
        hashedPassword: 'hashed_password',
        role: 'USER',
        isEmailVerified: true,
      },
    });

    adminUserId = adminUser.id;
    testUserId = testUser.id;

    adminToken = generateToken({ id: adminUserId, email: adminUser.email, role: 'ADMIN' });
    userToken = generateToken({ id: regularUser.id, email: regularUser.email, role: 'USER' });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin_users@test.com', 'testuser@test.com', 'regular@test.com'],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated user list for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBeDefined();
      expect(response.body.data.pagination.limit).toBeDefined();
      expect(response.body.data.pagination.total).toBeDefined();
    });

    it('should support search by email', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ search: 'testuser@test.com' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should support filtering by role', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ role: 'ADMIN' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const users = response.body.data.users;
      users.forEach((user: any) => {
        expect(user.role).toBe('ADMIN');
      });
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
    });

    it('should reject non-admin users', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return full user details for admin', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(testUserId);
      expect(response.body.data.user.email).toBe('testuser@test.com');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/admin/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user data', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'updated_username',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('updated_username');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should change user role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'MODERATOR',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('MODERATOR');
    });

    it('should validate role value', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'INVALID_ROLE',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/users/:id/verify', () => {
    it('should manually verify user email', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isEmailVerified).toBe(true);
    });
  });

  describe('POST /api/admin/users/:id/suspend', () => {
    it('should suspend user with reason and duration', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Violation of community guidelines',
          duration: 7, // days
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.status).toBe('SUSPENDED');
    });

    it('should require reason for suspension', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          duration: 7,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/users/:id/ban', () => {
    it('should permanently ban user with reason', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Severe policy violation',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.status).toBe('BANNED');
    });

    it('should require reason for ban', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should soft delete user account', async () => {
      // Create a user to delete
      const userToDelete = await prisma.user.create({
        data: {
          email: 'todelete@test.com',
          username: 'todelete',
          hashedPassword: 'hashed_password',
          role: 'USER',
          isEmailVerified: true,
        },
      });

      const response = await request(app)
        .delete(`/api/admin/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'User requested account deletion',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is soft deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: userToDelete.id },
      });

      expect(deletedUser?.deletedAt).toBeDefined();
    });

    it('should prevent deletion of admin users without confirmation', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test deletion',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/users/:id/activity', () => {
    it('should return user activity history', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUserId}/activity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activities).toBeInstanceOf(Array);
    });
  });

  describe('Audit Logging', () => {
    it('should create audit log for suspend action', async () => {
      await request(app)
        .post(`/api/admin/users/${testUserId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test suspension for audit',
          duration: 3,
        })
        .expect(200);

      // Verify audit log was created
      const auditLog = await prisma.adminAuditLog.findFirst({
        where: {
          adminId: adminUserId,
          action: 'SUSPEND_USER',
          targetId: testUserId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.reason).toContain('Test suspension for audit');
    });

    it('should create audit log for role change', async () => {
      await request(app)
        .put(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'USER',
        })
        .expect(200);

      const auditLog = await prisma.adminAuditLog.findFirst({
        where: {
          adminId: adminUserId,
          action: 'CHANGE_ROLE',
          targetId: testUserId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(auditLog).toBeDefined();
    });
  });
});
