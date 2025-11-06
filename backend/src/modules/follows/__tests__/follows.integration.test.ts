import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { Express } from 'express';
import { createApp } from '@/app';

describe('Follows API Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let authToken: string;
  let userId: string;
  let companyId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    app = createApp();

    // Create test user and get auth token
    const user = await prisma.user.create({
      data: {
        email: 'followtest@example.com',
        username: 'followtestuser',
        passwordHash: 'hashed',
        emailVerified: true,
      },
    });
    userId = user.id;

    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        slug: 'test-company',
        ownerUserId: userId,
      },
    });
    companyId = company.id;

    // Mock auth token (in real tests, you'd generate a proper JWT)
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.polymorphicFollow.deleteMany({
      where: { followerId: userId },
    });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/follows', () => {
    it('should create a follow relationship', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          followableType: 'company',
          followableId: companyId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.followableType).toBe('company');
      expect(response.body.data.followableId).toBe(companyId);
    });

    it('should return 400 for invalid followable type', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          followableType: 'invalid',
          followableId: companyId,
        });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate follow', async () => {
      // Create follow first
      await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          followableType: 'company',
          followableId: companyId,
        });

      // Try to create again
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          followableType: 'company',
          followableId: companyId,
        });

      expect(response.status).toBe(409);
    });

    it('should return 400 when trying to follow yourself', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          followableType: 'user',
          followableId: userId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot follow yourself');
    });
  });

  describe('GET /api/follows/check', () => {
    beforeAll(async () => {
      // Create a follow for testing
      await prisma.polymorphicFollow.create({
        data: {
          followerId: userId,
          followableType: 'company',
          followableId: companyId,
        },
      });
    });

    it('should return true when following', async () => {
      const response = await request(app)
        .get('/api/follows/check')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          followableType: 'company',
          followableId: companyId,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.isFollowing).toBe(true);
    });

    it('should return false when not following', async () => {
      const response = await request(app)
        .get('/api/follows/check')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          followableType: 'company',
          followableId: 'non-existent-id',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.isFollowing).toBe(false);
    });
  });

  describe('GET /api/users/:id/following', () => {
    it('should return following list', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}/following`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}/following`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'company' });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/users/:id/followers', () => {
    it('should return followers list', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}/followers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/following/feed', () => {
    it('should return following feed', async () => {
      const response = await request(app)
        .get('/api/following/feed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter feed by type', async () => {
      const response = await request(app)
        .get('/api/following/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'articles' });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should paginate feed', async () => {
      const response = await request(app)
        .get('/api/following/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });
  });

  describe('DELETE /api/follows/:id', () => {
    let followId: string;

    beforeEach(async () => {
      // Create a follow to delete
      const follow = await prisma.polymorphicFollow.create({
        data: {
          followerId: userId,
          followableType: 'company',
          followableId: companyId,
        },
      });
      followId = follow.id;
    });

    it('should unfollow successfully', async () => {
      const response = await request(app)
        .delete(`/api/follows/${followId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.success).toBe(true);
    });

    it('should return 404 for non-existent follow', async () => {
      const response = await request(app)
        .delete('/api/follows/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/:type/:id/followers', () => {
    it('should return company followers', async () => {
      const response = await request(app)
        .get(`/api/companies/${companyId}/followers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});
