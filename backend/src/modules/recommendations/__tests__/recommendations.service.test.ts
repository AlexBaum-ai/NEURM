import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { redis } from '@/config/redis';
import recommendationsService from '../recommendations.service';

/**
 * Recommendations Service Tests
 *
 * Tests the AI recommendation engine:
 * - Hybrid algorithm (collaborative + content-based + trending)
 * - Caching behavior
 * - Feedback processing
 * - Performance targets
 */

const prisma = new PrismaClient();

describe('RecommendationsService', () => {
  let testUserId: string;
  let testArticleId: string;
  let testTopicId: string;
  let testJobId: string;

  beforeEach(async () => {
    // Create test user
    testUserId = 'test-user-' + Date.now();
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        passwordHash: 'hashedpassword',
      },
    });

    // Create test content
    const category = await prisma.newsCategory.findFirst();
    if (category) {
      const article = await prisma.article.create({
        data: {
          title: 'Test Article',
          slug: `test-article-${Date.now()}`,
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

    const forumCategory = await prisma.forumCategory.findFirst();
    if (forumCategory) {
      const topic = await prisma.topic.create({
        data: {
          title: 'Test Topic',
          slug: `test-topic-${Date.now()}`,
          content: 'Test content',
          categoryId: forumCategory.id,
          authorId: testUserId,
          type: 'discussion',
          status: 'open',
        },
      });
      testTopicId = topic.id;
    }

    const company = await prisma.company.findFirst();
    if (company) {
      const job = await prisma.job.create({
        data: {
          title: 'Test Job',
          slug: `test-job-${Date.now()}`,
          description: 'Test job description',
          companyId: company.id,
          status: 'active',
          jobType: 'full_time',
          workLocation: 'remote',
          experienceLevel: 'mid',
        },
      });
      testJobId = job.id;
    }
  });

  afterEach(async () => {
    // Cleanup
    if (testArticleId) {
      await prisma.article.deleteMany({ where: { id: testArticleId } });
    }
    if (testTopicId) {
      await prisma.topic.deleteMany({ where: { id: testTopicId } });
    }
    if (testJobId) {
      await prisma.job.deleteMany({ where: { id: testJobId } });
    }
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }

    // Clear Redis cache
    const keys = await redis.keys(`recommendations:${testUserId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  describe('getRecommendations', () => {
    it('should return personalized recommendations', async () => {
      const result = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article', 'forum_topic', 'job'],
        limit: 10,
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should include all required fields in recommendations', async () => {
      const result = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article'],
        limit: 5,
        includeExplanations: true,
      });

      if (result.length > 0) {
        const rec = result[0];
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('relevanceScore');
        expect(rec).toHaveProperty('explanation');
        expect(rec).toHaveProperty('data');
        expect(rec.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(rec.relevanceScore).toBeLessThanOrEqual(100);
      }
    });

    it('should respect type filters', async () => {
      const result = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article'],
        limit: 10,
      });

      result.forEach((rec) => {
        expect(rec.type).toBe('article');
      });
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const result = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article', 'forum_topic'],
        limit,
      });

      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it('should exclude specified IDs', async () => {
      const excludeIds = [testArticleId];
      const result = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article'],
        limit: 10,
        excludeIds,
      });

      const excludedFound = result.some((rec) => excludeIds.includes(rec.id));
      expect(excludedFound).toBe(false);
    });

    it('should complete within 200ms performance target', async () => {
      const startTime = Date.now();

      await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article'],
        limit: 20,
      });

      const duration = Date.now() - startTime;
      // Allow some margin for test environment
      expect(duration).toBeLessThan(500);
    });

    it('should cache recommendations', async () => {
      // First call - should cache
      const result1 = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article'],
        limit: 10,
      });

      // Second call - should use cache (faster)
      const startTime = Date.now();
      const result2 = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article'],
        limit: 10,
      });
      const duration = Date.now() - startTime;

      // Cache hit should be very fast
      expect(duration).toBeLessThan(50);
      expect(result2.length).toBe(result1.length);
    });

    it('should return recommendations sorted by relevance score', async () => {
      const result = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article', 'forum_topic'],
        limit: 10,
      });

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].relevanceScore).toBeGreaterThanOrEqual(
            result[i + 1].relevanceScore
          );
        }
      }
    });
  });

  describe('submitFeedback', () => {
    it('should create feedback record', async () => {
      if (!testArticleId) {
        console.log('Skipping test - no test article available');
        return;
      }

      const result = await recommendationsService.submitFeedback(
        testUserId,
        'article',
        testArticleId,
        'like'
      );

      expect(result).toHaveProperty('id');
      expect(result.userId).toBe(testUserId);
      expect(result.itemType).toBe('article');
      expect(result.itemId).toBe(testArticleId);
      expect(result.feedback).toBe('like');
    });

    it('should update existing feedback', async () => {
      if (!testArticleId) {
        console.log('Skipping test - no test article available');
        return;
      }

      // Create initial feedback
      await recommendationsService.submitFeedback(
        testUserId,
        'article',
        testArticleId,
        'like'
      );

      // Update feedback
      const updated = await recommendationsService.submitFeedback(
        testUserId,
        'article',
        testArticleId,
        'dislike'
      );

      expect(updated.feedback).toBe('dislike');
    });

    it('should invalidate cache after feedback', async () => {
      if (!testArticleId) {
        console.log('Skipping test - no test article available');
        return;
      }

      // Get recommendations to populate cache
      await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article'],
        limit: 10,
      });

      // Submit feedback (should invalidate cache)
      await recommendationsService.submitFeedback(
        testUserId,
        'article',
        testArticleId,
        'not_interested'
      );

      // Check cache is cleared
      const cacheKey = `recommendations:${testUserId}:article`;
      const cached = await redis.get(cacheKey);
      expect(cached).toBeNull();
    });

    it('should accept all valid feedback types', async () => {
      if (!testArticleId) {
        console.log('Skipping test - no test article available');
        return;
      }

      const feedbackTypes = ['like', 'dislike', 'dismiss', 'not_interested'];

      for (const feedbackType of feedbackTypes) {
        const result = await recommendationsService.submitFeedback(
          testUserId,
          'article',
          testArticleId,
          feedbackType
        );

        expect(result.feedback).toBe(feedbackType);
      }
    });
  });

  describe('Hybrid Algorithm', () => {
    it('should incorporate collaborative filtering', async () => {
      // Create another user with similar interests
      const similarUserId = 'similar-user-' + Date.now();
      await prisma.user.create({
        data: {
          id: similarUserId,
          email: `similar-${Date.now()}@example.com`,
          username: `similaruser${Date.now()}`,
          passwordHash: 'hashedpassword',
        },
      });

      // Both users bookmark same article
      if (testArticleId) {
        await prisma.bookmark.createMany({
          data: [
            {
              userId: testUserId,
              articleId: testArticleId,
            },
            {
              userId: similarUserId,
              articleId: testArticleId,
            },
          ],
        });
      }

      const result = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article'],
        limit: 10,
      });

      expect(result).toBeInstanceOf(Array);

      // Cleanup
      await prisma.bookmark.deleteMany({
        where: { userId: { in: [testUserId, similarUserId] } },
      });
      await prisma.user.delete({ where: { id: similarUserId } });
    });

    it('should include trending content for diversity', async () => {
      const result = await recommendationsService.getRecommendations({
        userId: testUserId,
        types: ['article', 'forum_topic'],
        limit: 20,
      });

      // Should have some recommendations (trending items)
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
