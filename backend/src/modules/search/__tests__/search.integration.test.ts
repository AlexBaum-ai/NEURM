/**
 * Search Integration Tests
 *
 * Tests the search API endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Search API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create a test user and get auth token
    // This assumes you have a test user setup or authentication helper
    // Adjust based on your test setup
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.$disconnect();
  });

  describe('GET /api/v1/search', () => {
    it('should return 400 for missing query', async () => {
      const response = await request(app).get('/api/v1/search');

      expect(response.status).toBe(422);
    });

    it('should return search results for valid query', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'test', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('totalCount');
      expect(response.body.data).toHaveProperty('query', 'test');
      expect(response.body.data).toHaveProperty('executionTime');
      expect(response.body.data.executionTime).toBeLessThan(500);
    });

    it('should filter by content type', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'test', type: 'articles,jobs' });

      expect(response.status).toBe(200);
      expect(response.body.data.contentTypes).toEqual(['articles', 'jobs']);
    });

    it('should sort by date when specified', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'test', sort: 'date' });

      expect(response.status).toBe(200);
      expect(response.body.data.sortBy).toBe('date');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'test', page: 2, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.pageSize).toBe(5);
    });
  });

  describe('GET /api/v1/search/suggest', () => {
    it('should return 422 for short query', async () => {
      const response = await request(app)
        .get('/api/v1/search/suggest')
        .query({ q: 'a' });

      expect(response.status).toBe(422);
    });

    it('should return suggestions for valid query', async () => {
      const response = await request(app)
        .get('/api/v1/search/suggest')
        .query({ q: 'GPT' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('suggestions');
      expect(response.body.data).toHaveProperty('query', 'GPT');
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });
  });

  describe('GET /api/v1/search/popular', () => {
    it('should return popular searches', async () => {
      const response = await request(app).get('/api/v1/search/popular');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('popularSearches');
      expect(Array.isArray(response.body.data.popularSearches)).toBe(true);
    });
  });

  describe('Search History (Authenticated)', () => {
    it('should return 401 for unauthenticated request to history', async () => {
      const response = await request(app).get('/api/v1/search/history');

      expect(response.status).toBe(401);
    });

    // Add authenticated tests when auth token is available
  });

  describe('Saved Searches (Authenticated)', () => {
    it('should return 401 for unauthenticated request to saved searches', async () => {
      const response = await request(app).get('/api/v1/search/saved');

      expect(response.status).toBe(401);
    });

    // Add authenticated tests when auth token is available
  });
});
