/**
 * Admin API Integration Tests
 *
 * Tests admin dashboard endpoints with authentication and authorization
 */

import request from 'supertest';
import { app } from '../../../app';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { generateToken } from '../../../utils/auth';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

describe('Admin API Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    // Create test users
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        username: 'admin_test',
        hashedPassword: 'hashed_password',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

    const regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        username: 'user_test',
        hashedPassword: 'hashed_password',
        role: 'USER',
        isEmailVerified: true,
      },
    });

    adminUserId = adminUser.id;
    regularUserId = regularUser.id;

    // Generate JWT tokens
    adminToken = generateToken({ id: adminUserId, email: adminUser.email, role: 'ADMIN' });
    userToken = generateToken({ id: regularUserId, email: regularUser.email, role: 'USER' });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@test.com', 'user@test.com'],
        },
      },
    });

    await redis.quit();
    await prisma.$disconnect();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard data for admin user', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dashboard).toBeDefined();
      expect(response.body.data.dashboard.quickStats).toBeDefined();
      expect(response.body.data.dashboard.realTimeStats).toBeDefined();
      expect(response.body.data.dashboard.keyMetrics).toBeDefined();
      expect(response.body.data.dashboard.growthCharts).toBeDefined();
      expect(response.body.data.dashboard.alerts).toBeDefined();
      expect(response.body.data.dashboard.recentActivity).toBeDefined();
      expect(response.body.data.dashboard.systemHealth).toBeDefined();
    });

    it('should reject unauthorized access', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });

    it('should reject non-admin users', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should support cache refresh parameter', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard?refresh=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cached).toBe(false);
    });
  });

  describe('POST /api/admin/dashboard/refresh', () => {
    it('should refresh dashboard cache for admin', async () => {
      const response = await request(app)
        .post('/api/admin/dashboard/refresh')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Dashboard refreshed successfully');
      expect(response.body.data.dashboard).toBeDefined();
    });

    it('should reject non-admin users', async () => {
      await request(app)
        .post('/api/admin/dashboard/refresh')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('POST /api/admin/dashboard/export', () => {
    it('should export dashboard metrics as CSV', async () => {
      const response = await request(app)
        .post('/api/admin/dashboard/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'csv',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('Date,Total Users');
    });

    it('should return 501 for PDF export (not implemented)', async () => {
      const response = await request(app)
        .post('/api/admin/dashboard/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'pdf',
        })
        .expect(501);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid format', async () => {
      const response = await request(app)
        .post('/api/admin/dashboard/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'invalid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/dashboard/health', () => {
    it('should return system health status', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.health).toBeDefined();
      expect(response.body.data.health.apiResponseTime).toBeDefined();
      expect(response.body.data.health.errorRate).toBeDefined();
      expect(response.body.data.health.databaseSize).toBeDefined();
      expect(response.body.data.health.redisStatus).toBeDefined();
      expect(response.body.data.health.databaseStatus).toBeDefined();
    });
  });

  describe('POST /api/admin/dashboard/precompute', () => {
    it('should trigger metrics precomputation', async () => {
      const response = await request(app)
        .post('/api/admin/dashboard/precompute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: '2025-01-01',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('completed successfully');
    });

    it('should use current date if not provided', async () => {
      const response = await request(app)
        .post('/api/admin/dashboard/precompute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/dashboard/metrics', () => {
    it('should return historical metrics for date range', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/metrics')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          granularity: 'daily',
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.startDate).toBeDefined();
      expect(response.body.data.endDate).toBeDefined();
      expect(response.body.data.granularity).toBe('daily');
    });

    it('should validate date range parameters', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/metrics')
        .query({
          startDate: 'invalid-date',
          endDate: '2025-01-31',
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
