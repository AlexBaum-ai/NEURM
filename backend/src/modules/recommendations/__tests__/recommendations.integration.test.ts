import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '@/app';
import { generateTestToken } from '@/utils/testHelpers';

/**
 * Recommendations Integration Tests
 *
 * Tests the recommendation API endpoints:
 * - GET /api/v1/recommendations
 * - POST /api/v1/recommendations/feedback
 */

const prisma = new PrismaClient();

describe('Recommendations API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testArticleId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-rec-${Date.now()}@example.com`,
        username: `testrec${Date.now()}`,
        passwordHash: 'hashedpassword',
      },
    });

    testUserId = user.id;
    authToken = generateTestToken(user.id);

    // Create test article
    const category = await prisma.newsCategory.findFirst();
    if (category) {
      const article = await prisma.article.create({
        data: {
          title: 'Test Article for Recommendations',
          slug: `test-rec-article-${Date.now()}`,
          content: 'Test content',
          excerpt: 'Test excerpt',
          categoryId: category.id,
          authorId: testUserId,
          status: 'published',
          publishedAt: new Date(),
        },
      });
      testArticleId = article.id;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testArticleId) {
      await prisma.article.deleteMany({ where: { id: testArticleId } });
    }
    if (testUserId) {
      await prisma.recommendationFeedback.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
  });

  describe('GET /api/v1/recommendations', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return recommendations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('meta');
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should respect type filters', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .query({ types: 'article' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const recommendations = response.body.data.recommendations;

      if (recommendations.length > 0) {
        recommendations.forEach((rec: any) => {
          expect(rec.type).toBe('article');
        });
      }
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const response = await request(app)
        .get('/api/v1/recommendations')
        .query({ limit })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const recommendations = response.body.data.recommendations;
      expect(recommendations.length).toBeLessThanOrEqual(limit);
    });

    it('should exclude specified IDs', async () => {
      if (!testArticleId) {
        console.log('Skipping test - no test article available');
        return;
      }

      const response = await request(app)
        .get('/api/v1/recommendations')
        .query({
          types: 'article',
          excludeIds: testArticleId,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const recommendations = response.body.data.recommendations;
      const excluded = recommendations.some((rec: any) => rec.id === testArticleId);
      expect(excluded).toBe(false);
    });

    it('should include explanations by default', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const recommendations = response.body.data.recommendations;

      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty('explanation');
        expect(typeof recommendations[0].explanation).toBe('string');
      }
    });

    it('should handle multiple types', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .query({ types: 'article,forum_topic,job' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .query({ limit: 150 }) // Max is 100
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422); // Validation error

      expect(response.body.success).toBe(false);
    });

    it('should complete within reasonable time', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      // API call should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('POST /api/v1/recommendations/feedback', () => {
    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/v1/recommendations/feedback')
        .send({
          itemType: 'article',
          itemId: testArticleId,
          feedback: 'like',
        })
        .expect(401);
    });

    it('should accept valid feedback', async () => {
      if (!testArticleId) {
        console.log('Skipping test - no test article available');
        return;
      }

      const response = await request(app)
        .post('/api/v1/recommendations/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemType: 'article',
          itemId: testArticleId,
          feedback: 'like',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('feedback');
      expect(response.body.data.feedback.userId).toBe(testUserId);
    });

    it('should validate itemType', async () => {
      const response = await request(app)
        .post('/api/v1/recommendations/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemType: 'invalid_type',
          itemId: testArticleId,
          feedback: 'like',
        })
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('should validate feedback value', async () => {
      const response = await request(app)
        .post('/api/v1/recommendations/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemType: 'article',
          itemId: testArticleId,
          feedback: 'invalid_feedback',
        })
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('should validate itemId is UUID', async () => {
      const response = await request(app)
        .post('/api/v1/recommendations/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemType: 'article',
          itemId: 'not-a-uuid',
          feedback: 'like',
        })
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('should accept all valid feedback types', async () => {
      if (!testArticleId) {
        console.log('Skipping test - no test article available');
        return;
      }

      const feedbackTypes = ['like', 'dislike', 'dismiss', 'not_interested'];

      for (const feedbackType of feedbackTypes) {
        const response = await request(app)
          .post('/api/v1/recommendations/feedback')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            itemType: 'article',
            itemId: testArticleId,
            feedback: feedbackType,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it('should update existing feedback', async () => {
      if (!testArticleId) {
        console.log('Skipping test - no test article available');
        return;
      }

      // Submit initial feedback
      await request(app)
        .post('/api/v1/recommendations/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemType: 'article',
          itemId: testArticleId,
          feedback: 'like',
        })
        .expect(201);

      // Update feedback
      const response = await request(app)
        .post('/api/v1/recommendations/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemType: 'article',
          itemId: testArticleId,
          feedback: 'dislike',
        })
        .expect(201);

      expect(response.body.data.feedback.feedback).toBe('dislike');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on recommendations endpoint', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(35).fill(null).map(() =>
        request(app)
          .get('/api/v1/recommendations')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimited = responses.some((res) => res.status === 429);
      expect(rateLimited).toBe(true);
    }, 30000); // Increase timeout for multiple requests

    it('should enforce rate limits on feedback endpoint', async () => {
      if (!testArticleId) {
        console.log('Skipping test - no test article available');
        return;
      }

      // Make multiple requests to trigger rate limit
      const requests = Array(65).fill(null).map(() =>
        request(app)
          .post('/api/v1/recommendations/feedback')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            itemType: 'article',
            itemId: testArticleId,
            feedback: 'like',
          })
      );

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimited = responses.some((res) => res.status === 429);
      expect(rateLimited).toBe(true);
    }, 30000); // Increase timeout for multiple requests
  });
});
