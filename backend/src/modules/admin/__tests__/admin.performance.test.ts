/**
 * Admin Performance Tests
 *
 * Tests performance benchmarks for admin endpoints
 */

import request from 'supertest';
import { app } from '../../../app';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../../utils/auth';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  DASHBOARD_LOAD: 1000, // < 1s
  USER_LIST_LOAD: 2000, // < 2s
  ANALYTICS_LOAD: 3000, // < 3s
  SEARCH_QUERY: 500, // < 500ms
  SINGLE_USER_LOAD: 300, // < 300ms
  EXPORT_CSV: 5000, // < 5s
};

describe('Admin Performance Tests', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'perf_admin@test.com',
        username: 'perf_admin',
        hashedPassword: 'hashed_password',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

    adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: 'ADMIN' });

    // Seed data for performance testing
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('Dashboard Performance', () => {
    it('should load dashboard within 1 second', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      console.log(`Dashboard load time: ${loadTime.toFixed(2)}ms`);

      expect(response.body.success).toBe(true);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DASHBOARD_LOAD);
    });

    it('should serve cached dashboard faster', async () => {
      // First request (cache miss)
      const startTime1 = performance.now();
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const endTime1 = performance.now();
      const uncachedTime = endTime1 - startTime1;

      // Second request (cache hit)
      const startTime2 = performance.now();
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const endTime2 = performance.now();
      const cachedTime = endTime2 - startTime2;

      console.log(`Uncached: ${uncachedTime.toFixed(2)}ms, Cached: ${cachedTime.toFixed(2)}ms`);

      // Cached should be significantly faster
      expect(cachedTime).toBeLessThan(uncachedTime * 0.5);
    });

    it('should handle concurrent dashboard requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = [];

      const startTime = performance.now();

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / concurrentRequests;

      console.log(`${concurrentRequests} concurrent requests: ${totalTime.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms avg`);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Average time should still be reasonable
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DASHBOARD_LOAD * 2);
    });
  });

  describe('User Management Performance', () => {
    it('should load user list within 2 seconds', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .get('/api/admin/users')
        .query({ page: 1, limit: 50 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      console.log(`User list load time: ${loadTime.toFixed(2)}ms`);

      expect(response.body.success).toBe(true);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.USER_LIST_LOAD);
    });

    it('should perform search queries within 500ms', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .get('/api/admin/users')
        .query({ search: 'test@example.com' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      console.log(`Search query time: ${queryTime.toFixed(2)}ms`);

      expect(response.body.success).toBe(true);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_QUERY);
    });

    it('should load single user details within 300ms', async () => {
      const user = await prisma.user.findFirst({
        where: { email: 'perf_admin@test.com' },
      });

      const startTime = performance.now();

      const response = await request(app)
        .get(`/api/admin/users/${user?.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      console.log(`Single user load time: ${loadTime.toFixed(2)}ms`);

      expect(response.body.success).toBe(true);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_USER_LOAD);
    });

    it('should handle pagination efficiently', async () => {
      const pageRequests = [];

      const startTime = performance.now();

      // Request multiple pages
      for (let page = 1; page <= 5; page++) {
        pageRequests.push(
          request(app)
            .get('/api/admin/users')
            .query({ page, limit: 50 })
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }

      const responses = await Promise.all(pageRequests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`5 pages loaded in: ${totalTime.toFixed(2)}ms`);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // All 5 pages should load reasonably fast
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.USER_LIST_LOAD * 3);
    });
  });

  describe('Analytics Performance', () => {
    it('should load analytics dashboard within 3 seconds', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      console.log(`Analytics load time: ${loadTime.toFixed(2)}ms`);

      expect(response.body.success).toBe(true);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ANALYTICS_LOAD);
    });

    it('should handle custom date range queries efficiently', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .get('/api/admin/analytics/custom')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          metrics: ['dau', 'mau', 'revenue'],
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      console.log(`Custom analytics query time: ${queryTime.toFixed(2)}ms`);

      expect(response.body.success).toBe(true);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ANALYTICS_LOAD);
    });
  });

  describe('Export Performance', () => {
    it('should export CSV within 5 seconds', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .post('/api/admin/dashboard/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'csv',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .expect(200);

      const endTime = performance.now();
      const exportTime = endTime - startTime;

      console.log(`CSV export time: ${exportTime.toFixed(2)}ms`);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(exportTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXPORT_CSV);
    });

    it('should export large user list efficiently', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .post('/api/admin/users/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'csv',
          filters: {},
        })
        .expect(200);

      const endTime = performance.now();
      const exportTime = endTime - startTime;

      console.log(`User list export time: ${exportTime.toFixed(2)}ms`);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(exportTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXPORT_CSV);
    });
  });

  describe('Database Query Performance', () => {
    it('should execute complex aggregation queries efficiently', async () => {
      const startTime = performance.now();

      // Complex query with multiple aggregations
      const result = await prisma.user.aggregate({
        _count: true,
        _avg: {
          reputation: true,
        },
        where: {
          createdAt: {
            gte: new Date('2025-01-01'),
          },
        },
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      console.log(`Complex aggregation query time: ${queryTime.toFixed(2)}ms`);

      expect(result).toBeDefined();
      expect(queryTime).toBeLessThan(500); // < 500ms
    });

    it('should use indexes for search queries', async () => {
      // This test verifies that search queries are fast due to proper indexing
      const startTime = performance.now();

      await prisma.user.findMany({
        where: {
          OR: [{ email: { contains: 'test', mode: 'insensitive' } }, { username: { contains: 'test', mode: 'insensitive' } }],
        },
        take: 50,
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      console.log(`Indexed search query time: ${queryTime.toFixed(2)}ms`);

      // Should be very fast with proper indexes
      expect(queryTime).toBeLessThan(200);
    });
  });

  describe('Redis Cache Performance', () => {
    it('should store and retrieve from cache quickly', async () => {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

      const testData = { key: 'value', nested: { data: 'test' } };

      // Write performance
      const writeStart = performance.now();
      await redis.setex('perf:test', 300, JSON.stringify(testData));
      const writeEnd = performance.now();
      const writeTime = writeEnd - writeStart;

      // Read performance
      const readStart = performance.now();
      const cachedData = await redis.get('perf:test');
      const readEnd = performance.now();
      const readTime = readEnd - readStart;

      console.log(`Redis write: ${writeTime.toFixed(2)}ms, read: ${readTime.toFixed(2)}ms`);

      expect(writeTime).toBeLessThan(50); // < 50ms
      expect(readTime).toBeLessThan(20); // < 20ms
      expect(JSON.parse(cachedData!)).toEqual(testData);

      await redis.quit();
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 100 requests
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`)
        );
      }

      await Promise.all(requests);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory increase after 100 requests: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Memory increase should be reasonable (< 50 MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});

// Helper functions
async function seedTestData() {
  // Create test users for performance testing
  const users = [];
  for (let i = 0; i < 100; i++) {
    users.push({
      email: `perftest${i}@example.com`,
      username: `perftest${i}`,
      hashedPassword: 'hashed_password',
      role: 'USER',
      isEmailVerified: true,
    });
  }

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
}

async function cleanupTestData() {
  // Clean up test data
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: 'perftest' } },
        { email: 'perf_admin@test.com' },
      ],
    },
  });
}
