import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/utils/prisma';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { unifiedConfig } from '@/config/unifiedConfig';

describe('ProfileViews Integration Tests', () => {
  let authToken: string;
  let premiumAuthToken: string;
  let viewerAuthToken: string;
  let userId: string;
  let premiumUserId: string;
  let viewerUserId: string;

  beforeAll(async () => {
    // Create test users
    const user = await prisma.user.create({
      data: {
        email: 'profileviews@test.com',
        username: 'profileviewsuser',
        emailVerified: true,
        role: UserRole.user,
        profile: {
          create: {
            displayName: 'Profile Views User',
          },
        },
      },
    });
    userId = user.id;
    authToken = jwt.sign({ id: userId, role: UserRole.user }, unifiedConfig.jwt.secret);

    const premiumUser = await prisma.user.create({
      data: {
        email: 'premium@test.com',
        username: 'premiumuser',
        emailVerified: true,
        role: UserRole.premium,
        profile: {
          create: {
            displayName: 'Premium User',
          },
        },
      },
    });
    premiumUserId = premiumUser.id;
    premiumAuthToken = jwt.sign(
      { id: premiumUserId, role: UserRole.premium },
      unifiedConfig.jwt.secret
    );

    const viewer = await prisma.user.create({
      data: {
        email: 'viewer@test.com',
        username: 'vieweruser',
        emailVerified: true,
        role: UserRole.company,
        profile: {
          create: {
            displayName: 'Viewer User',
          },
        },
      },
    });
    viewerUserId = viewer.id;
    viewerAuthToken = jwt.sign(
      { id: viewerUserId, role: UserRole.company },
      unifiedConfig.jwt.secret
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.profileView.deleteMany({
      where: {
        OR: [{ profileId: userId }, { profileId: premiumUserId }, { viewerId: viewerUserId }],
      },
    });
    await prisma.profile.deleteMany({
      where: { userId: { in: [userId, premiumUserId, viewerUserId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userId, premiumUserId, viewerUserId] } },
    });
  });

  beforeEach(async () => {
    // Clean up profile views before each test
    await prisma.profileView.deleteMany({
      where: {
        OR: [{ profileId: userId }, { profileId: premiumUserId }, { viewerId: viewerUserId }],
      },
    });
  });

  describe('POST /api/v1/profiles/:username/view', () => {
    it('should track a profile view', async () => {
      const response = await request(app)
        .post('/api/v1/profiles/profileviewsuser/view')
        .set('Authorization', `Bearer ${viewerAuthToken}`)
        .send({ anonymous: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile view tracked successfully');

      // Verify view was created in database
      const view = await prisma.profileView.findFirst({
        where: {
          profileId: userId,
          viewerId: viewerUserId,
        },
      });

      expect(view).not.toBeNull();
      expect(view?.anonymous).toBe(false);
    });

    it('should track an anonymous profile view', async () => {
      const response = await request(app)
        .post('/api/v1/profiles/profileviewsuser/view')
        .set('Authorization', `Bearer ${viewerAuthToken}`)
        .send({ anonymous: true })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify anonymous flag
      const view = await prisma.profileView.findFirst({
        where: {
          profileId: userId,
          viewerId: viewerUserId,
        },
      });

      expect(view?.anonymous).toBe(true);
    });

    it('should not track duplicate views within 24h', async () => {
      // First view
      await request(app)
        .post('/api/v1/profiles/profileviewsuser/view')
        .set('Authorization', `Bearer ${viewerAuthToken}`)
        .send({ anonymous: false })
        .expect(200);

      // Second view (should be deduplicated)
      const response = await request(app)
        .post('/api/v1/profiles/profileviewsuser/view')
        .set('Authorization', `Bearer ${viewerAuthToken}`)
        .send({ anonymous: false })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('View already tracked within the last 24 hours');

      // Verify only one view exists
      const views = await prisma.profileView.findMany({
        where: {
          profileId: userId,
          viewerId: viewerUserId,
        },
      });

      expect(views).toHaveLength(1);
    });

    it('should not track view on own profile', async () => {
      const response = await request(app)
        .post('/api/v1/profiles/profileviewsuser/view')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ anonymous: false })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot track views on your own profile');
    });

    it('should return 404 if profile not found', async () => {
      await request(app)
        .post('/api/v1/profiles/nonexistentuser/view')
        .set('Authorization', `Bearer ${viewerAuthToken}`)
        .send({ anonymous: false })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/profiles/profileviewsuser/view')
        .send({ anonymous: false })
        .expect(401);
    });
  });

  describe('GET /api/v1/profiles/me/views', () => {
    beforeEach(async () => {
      // Create some test views
      await prisma.profileView.create({
        data: {
          profileId: premiumUserId,
          viewerId: viewerUserId,
          anonymous: false,
        },
      });
    });

    it('should return profile viewers for premium users', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/me/views')
        .set('Authorization', `Bearer ${premiumAuthToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.views).toBeInstanceOf(Array);
      expect(response.body.data.views.length).toBeGreaterThan(0);
      expect(response.body.data.totalViews).toBeGreaterThanOrEqual(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should hide viewer details for anonymous views', async () => {
      // Create an anonymous view
      await prisma.profileView.create({
        data: {
          profileId: premiumUserId,
          viewerId: userId,
          anonymous: true,
        },
      });

      const response = await request(app)
        .get('/api/v1/profiles/me/views')
        .set('Authorization', `Bearer ${premiumAuthToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      const anonymousView = response.body.data.views.find((v: any) => v.anonymous === true);

      expect(anonymousView).toBeDefined();
      expect(anonymousView.viewer).toBeNull();
    });

    it('should return 403 for non-premium users', async () => {
      await request(app)
        .get('/api/v1/profiles/me/views')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 20 })
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/v1/profiles/me/views').query({ page: 1, limit: 20 }).expect(401);
    });

    it('should validate pagination parameters', async () => {
      await request(app)
        .get('/api/v1/profiles/me/views')
        .set('Authorization', `Bearer ${premiumAuthToken}`)
        .query({ page: 0, limit: 20 })
        .expect(400);

      await request(app)
        .get('/api/v1/profiles/me/views')
        .set('Authorization', `Bearer ${premiumAuthToken}`)
        .query({ page: 1, limit: 101 })
        .expect(400);
    });
  });

  describe('GET /api/v1/profiles/:username/view-count', () => {
    beforeEach(async () => {
      // Create some test views
      await prisma.profileView.createMany({
        data: [
          {
            profileId: userId,
            viewerId: viewerUserId,
            anonymous: false,
          },
          {
            profileId: userId,
            viewerId: premiumUserId,
            anonymous: true,
          },
        ],
      });
    });

    it('should return profile view count', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/profileviewsuser/view-count')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalViews).toBeGreaterThanOrEqual(2);
    });

    it('should return 404 if profile not found', async () => {
      await request(app).get('/api/v1/profiles/nonexistentuser/view-count').expect(404);
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/profileviewsuser/view-count')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
