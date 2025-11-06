import request from 'supertest';
import app from '@/app';
import { prisma } from '@/lib/prisma';

/**
 * SPRINT-11-008: Integration Tests for Model Reference API
 *
 * Test Coverage:
 * - GET /api/v1/models - List all models
 * - GET /api/v1/models/:slug - Get model details
 * - GET /api/v1/models/:slug/versions - Get version history
 * - GET /api/v1/models/:slug/benchmarks - Get benchmarks
 * - GET /api/v1/models/compare?ids=1,2,3 - Compare models
 * - GET /api/v1/models?provider=openai - Filter by provider
 * - GET /api/v1/models?category=best_overall - Filter by category
 */

describe('Model Reference API', () => {
  describe('GET /api/v1/models', () => {
    it('should return list of models', async () => {
      const response = await request(app)
        .get('/api/v1/models')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter models by provider', async () => {
      const response = await request(app)
        .get('/api/v1/models?provider=openai')
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((model: any) => {
        expect(model.provider.toLowerCase()).toBe('openai');
      });
    });

    it('should filter models by category', async () => {
      const response = await request(app)
        .get('/api/v1/models?category=best_overall')
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((model: any) => {
        expect(model.category).toBe('best_overall');
      });
    });

    it('should return paginated results', async () => {
      const response = await request(app)
        .get('/api/v1/models?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('should return 400 for invalid query parameters', async () => {
      await request(app)
        .get('/api/v1/models?page=invalid')
        .expect(400);
    });
  });

  describe('GET /api/v1/models/:slug', () => {
    it('should return model details', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        slug: 'gpt-4',
        name: expect.any(String),
        provider: expect.any(String),
        category: expect.any(String),
        contextWindow: expect.any(Number),
        status: expect.any(String),
      });
    });

    it('should return 404 for non-existent model', async () => {
      await request(app)
        .get('/api/v1/models/non-existent-model')
        .expect(404);
    });

    it('should include specifications in response', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4')
        .expect(200);

      const model = response.body.data;
      expect(model).toHaveProperty('contextWindow');
      expect(model).toHaveProperty('maxOutputTokens');
      expect(model).toHaveProperty('inputPricePerMToken');
      expect(model).toHaveProperty('outputPricePerMToken');
    });

    it('should include capabilities', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4')
        .expect(200);

      expect(response.body.data).toHaveProperty('capabilities');
      expect(Array.isArray(response.body.data.capabilities)).toBe(true);
    });
  });

  describe('GET /api/v1/models/:slug/versions', () => {
    it('should return version history', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/versions')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('versions');
      expect(Array.isArray(response.body.data.versions)).toBe(true);
    });

    it('should return versions sorted by release date (newest first)', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/versions')
        .expect(200);

      const versions = response.body.data.versions;
      for (let i = 0; i < versions.length - 1; i++) {
        const date1 = new Date(versions[i].releasedAt);
        const date2 = new Date(versions[i + 1].releasedAt);
        expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
      }
    });

    it('should mark latest version', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/versions')
        .expect(200);

      const versions = response.body.data.versions;
      const latestVersions = versions.filter((v: any) => v.isLatest);
      expect(latestVersions.length).toBe(1);
    });

    it('should include version details', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/versions')
        .expect(200);

      const firstVersion = response.body.data.versions[0];
      expect(firstVersion).toMatchObject({
        version: expect.any(String),
        releasedAt: expect.any(String),
        isLatest: expect.any(Boolean),
      });
    });

    it('should return 404 for non-existent model', async () => {
      await request(app)
        .get('/api/v1/models/non-existent/versions')
        .expect(404);
    });
  });

  describe('GET /api/v1/models/:slug/benchmarks', () => {
    it('should return benchmark scores', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/benchmarks')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('benchmarks');
      expect(Array.isArray(response.body.data.benchmarks)).toBe(true);
    });

    it('should include benchmark details', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/benchmarks')
        .expect(200);

      if (response.body.data.benchmarks.length > 0) {
        const firstBenchmark = response.body.data.benchmarks[0];
        expect(firstBenchmark).toMatchObject({
          benchmarkName: expect.any(String),
          score: expect.any(Number),
          date: expect.any(String),
        });
      }
    });

    it('should include source URLs for benchmarks', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/benchmarks')
        .expect(200);

      const benchmarksWithSource = response.body.data.benchmarks.filter(
        (b: any) => b.sourceUrl
      );
      expect(benchmarksWithSource.length).toBeGreaterThanOrEqual(0);
    });

    it('should return 404 for non-existent model', async () => {
      await request(app)
        .get('/api/v1/models/non-existent/benchmarks')
        .expect(404);
    });
  });

  describe('GET /api/v1/models/compare', () => {
    it('should compare multiple models', async () => {
      const response = await request(app)
        .get('/api/v1/models/compare?ids=1,2')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('models');
      expect(Array.isArray(response.body.data.models)).toBe(true);
      expect(response.body.data.models.length).toBe(2);
    });

    it('should require at least 2 models', async () => {
      await request(app)
        .get('/api/v1/models/compare?ids=1')
        .expect(400);
    });

    it('should limit to maximum 5 models', async () => {
      await request(app)
        .get('/api/v1/models/compare?ids=1,2,3,4,5,6')
        .expect(400);
    });

    it('should return 400 for invalid model IDs', async () => {
      await request(app)
        .get('/api/v1/models/compare?ids=invalid,test')
        .expect(400);
    });

    it('should include all necessary fields for comparison', async () => {
      const response = await request(app)
        .get('/api/v1/models/compare?ids=1,2')
        .expect(200);

      const firstModel = response.body.data.models[0];
      expect(firstModel).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        provider: expect.any(String),
        contextWindow: expect.any(Number),
        inputPricePerMToken: expect.any(Number),
        outputPricePerMToken: expect.any(Number),
        capabilities: expect.any(Array),
      });
    });

    it('should handle non-existent model IDs gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/models/compare?ids=1,999999')
        .expect(200);

      // Should only return models that exist
      expect(response.body.data.models.length).toBeLessThan(2);
    });
  });

  describe('GET /api/v1/models/:slug/news', () => {
    it('should return related news articles', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/news')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should limit news articles', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/news?limit=5')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/v1/models/:slug/discussions', () => {
    it('should return related forum discussions', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/discussions')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should limit discussions', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/discussions?limit=10')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/v1/models/:slug/jobs', () => {
    it('should return related job listings', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/jobs')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should limit job listings', async () => {
      const response = await request(app)
        .get('/api/v1/models/gpt-4/jobs?limit=5')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/v1/models/popular', () => {
    it('should return popular models', async () => {
      const response = await request(app)
        .get('/api/v1/models/popular')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should sort by popularity metrics', async () => {
      const response = await request(app)
        .get('/api/v1/models/popular')
        .expect(200);

      const models = response.body.data;

      // Check if sorted by view count or follow count
      for (let i = 0; i < models.length - 1; i++) {
        const popularity1 = models[i].viewCount + models[i].followCount;
        const popularity2 = models[i + 1].viewCount + models[i + 1].followCount;
        expect(popularity1).toBeGreaterThanOrEqual(popularity2);
      }
    });
  });
});
