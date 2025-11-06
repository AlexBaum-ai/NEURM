/**
 * Analytics Integration Tests
 *
 * Integration tests for analytics endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express, { Express } from 'express';
import analyticsRoutes from '../analytics.routes';

const prisma = new PrismaClient();

describe('Analytics API Integration Tests', () => {
  let app: Express;
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/admin/analytics', analyticsRoutes);

    // Create admin user for testing
    const hashedPassword = 'hashed_password_here'; // In real tests, use proper password hashing
    const user = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        username: 'admin_test',
        password: hashedPassword,
        emailVerified: true,
        role: 'admin',
      },
    });

    userId = user.id;

    // In real tests, generate a proper JWT token
    adminToken = 'mock_admin_token';

    // Seed some platform metrics
    const now = new Date();
    await prisma.platformMetrics.createMany({
      data: [
        {
          date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          totalUsers: 100,
          newUsers: 10,
          activeUsers: 50,
          weeklyActive: 80,
          monthlyActive: 95,
          totalArticles: 50,
          newArticles: 5,
          totalTopics: 20,
          newTopics: 2,
          totalReplies: 100,
          newReplies: 10,
          totalJobs: 30,
          activeJobs: 20,
          newJobs: 3,
          applications: 15,
          pageViews: 1000,
          uniqueVisitors: 500,
          avgSessionTime: 120.5,
          bounceRate: 42.3,
        },
        {
          date: now,
          totalUsers: 110,
          newUsers: 10,
          activeUsers: 55,
          weeklyActive: 85,
          monthlyActive: 100,
          totalArticles: 55,
          newArticles: 5,
          totalTopics: 22,
          newTopics: 2,
          totalReplies: 110,
          newReplies: 10,
          totalJobs: 33,
          activeJobs: 22,
          newJobs: 3,
          applications: 18,
          pageViews: 1100,
          uniqueVisitors: 550,
          avgSessionTime: 125.0,
          bounceRate: 40.5,
        },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.platformMetrics.deleteMany({});
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset any test-specific state
  });

  describe('GET /api/admin/analytics', () => {
    it('should return comprehensive analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'monthly', limit: 30 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('summary');
      expect(response.body.data.meta).toHaveProperty('executionTime');
    });

    it('should filter by specific metrics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ metrics: 'user_growth,engagement_trends' });

      expect(response.status).toBe(200);
      expect(response.body.data.analytics).toHaveProperty('userGrowth');
      expect(response.body.data.analytics).toHaveProperty('engagementTrends');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/admin/analytics');

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const userToken = 'mock_user_token'; // Non-admin token

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/analytics/custom', () => {
    it('should return custom analytics with date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/admin/analytics/custom')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate,
          endDate,
          metrics: 'user_growth,engagement_trends',
          granularity: 'daily',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('insights');
      expect(Array.isArray(response.body.data.insights)).toBe(true);
    });

    it('should validate required parameters', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/custom')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ metrics: 'user_growth' }); // Missing startDate and endDate

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/analytics/cohorts', () => {
    it('should return cohort retention analysis', async () => {
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/admin/analytics/cohorts')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate,
          endDate,
          cohortType: 'signup_date',
          period: 'weekly',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('cohorts');
      expect(Array.isArray(response.body.data.cohorts)).toBe(true);
    });
  });

  describe('GET /api/admin/analytics/funnels/:funnelType', () => {
    it('should return user onboarding funnel', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/funnels/user_onboarding')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('funnelType');
      expect(response.body.data.funnelType).toBe('user_onboarding');
      expect(response.body.data).toHaveProperty('steps');
      expect(Array.isArray(response.body.data.steps)).toBe(true);
    });

    it('should return job application funnel', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/funnels/job_application')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.funnelType).toBe('job_application');
    });

    it('should reject invalid funnel type', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/funnels/invalid_funnel')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/analytics/export', () => {
    it('should export analytics to CSV', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .post('/api/admin/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'csv',
          metrics: ['user_growth', 'engagement_trends'],
          startDate,
          endDate,
          includeCharts: false,
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export analytics to PDF', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .post('/api/admin/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'pdf',
          metrics: ['user_growth', 'engagement_trends'],
          startDate,
          endDate,
          includeCharts: true,
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should validate export parameters', async () => {
      const response = await request(app)
        .post('/api/admin/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'csv',
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/analytics/reports/schedule', () => {
    it('should schedule a recurring report', async () => {
      const response = await request(app)
        .post('/api/admin/analytics/reports/schedule')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          frequency: 'weekly',
          recipients: ['admin@example.com', 'manager@example.com'],
          metrics: ['user_growth', 'engagement_trends', 'revenue'],
          format: 'pdf',
          enabled: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('message');
      expect(response.body.data.id).toContain('report-');
    });

    it('should validate schedule parameters', async () => {
      const response = await request(app)
        .post('/api/admin/analytics/reports/schedule')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          frequency: 'invalid',
          recipients: ['invalid-email'],
          metrics: [],
          format: 'csv',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/analytics/reports', () => {
    it('should list scheduled reports', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('reports');
      expect(Array.isArray(response.body.data.reports)).toBe(true);
    });
  });

  describe('POST /api/admin/analytics/cache/invalidate', () => {
    it('should invalidate analytics cache', async () => {
      const response = await request(app)
        .post('/api/admin/analytics/cache/invalidate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('invalidated');
    });
  });

  describe('Performance requirements', () => {
    it('should return analytics within 1s threshold', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'monthly', limit: 30 });

      const executionTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(executionTime).toBeLessThan(1000); // Must complete within 1 second
    });
  });
});
