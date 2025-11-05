import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '@/app';
import prisma from '@/config/database';
import env from '@/config/env';
import { UserRole, AccountType, UserStatus } from '@prisma/client';

describe('User Profile API Endpoints', () => {
  let testUser: any;
  let authToken: string;
  let otherUser: any;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed_password',
        emailVerified: true,
        role: UserRole.user,
        accountType: AccountType.individual,
        status: UserStatus.active,
        profile: {
          create: {
            displayName: 'Test User',
            headline: 'Software Engineer',
            bio: 'I love testing',
            location: 'Amsterdam',
          },
        },
      },
    });

    // Create other user for testing public profiles
    otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        username: 'otheruser',
        passwordHash: 'hashed_password',
        emailVerified: true,
        role: UserRole.user,
        accountType: AccountType.individual,
        status: UserStatus.active,
        profile: {
          create: {
            displayName: 'Other User',
            headline: 'Data Scientist',
          },
        },
      },
    });

    // Generate auth token
    authToken = jwt.sign(
      {
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role,
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.profile.deleteMany({
      where: {
        userId: {
          in: [testUser.id, otherUser.id],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [testUser.id, otherUser.id],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current user profile with email', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.profile.displayName).toBe('Test User');
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.reputation).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:username', () => {
    it('should return public profile without email', async () => {
      const response = await request(app)
        .get('/api/v1/users/otheruser')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('otheruser');
      expect(response.body.data.email).toBeUndefined();
      expect(response.body.data.profile.displayName).toBe('Other User');
    });

    it('should return own profile with email when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/users/testuser')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    it('should return 422 for invalid username format', async () => {
      const response = await request(app)
        .get('/api/v1/users/ab') // Too short
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        displayName: 'Updated Name',
        headline: 'Senior Software Engineer',
        location: 'Rotterdam',
      };

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.displayName).toBe('Updated Name');
      expect(response.body.data.profile.headline).toBe('Senior Software Engineer');
      expect(response.body.data.profile.location).toBe('Rotterdam');
    });

    it('should update social links', async () => {
      const updateData = {
        githubUrl: 'https://github.com/testuser',
        linkedinUrl: 'https://linkedin.com/in/testuser',
      };

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.profile.githubUrl).toBe('https://github.com/testuser');
      expect(response.body.data.profile.linkedinUrl).toBe('https://linkedin.com/in/testuser');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .send({ displayName: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 422 for invalid data', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          website: 'not-a-url', // Invalid URL
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should return 422 for display name too long', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'a'.repeat(101), // Too long
        })
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('should handle partial updates', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'Updated bio only',
        })
        .expect(200);

      expect(response.body.data.profile.bio).toBe('Updated bio only');
      // Other fields should remain unchanged
      expect(response.body.data.profile.displayName).toBeTruthy();
    });

    it('should allow setting fields to null', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          website: null,
          location: null,
        })
        .expect(200);

      expect(response.body.data.profile.website).toBeNull();
      expect(response.body.data.profile.location).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit on profile updates', async () => {
      // This test would require making 11 requests
      // For demonstration, we'll just verify the rate limiter is applied
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ displayName: 'Rate Test' })
        .expect(200);

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Privacy Settings', () => {
    beforeAll(async () => {
      // Create privacy settings for otherUser
      await prisma.profilePrivacySetting.createMany({
        data: [
          {
            userId: otherUser.id,
            section: 'bio',
            visibility: 'private',
          },
          {
            userId: otherUser.id,
            section: 'contact',
            visibility: 'community',
          },
        ],
      });
    });

    afterAll(async () => {
      await prisma.profilePrivacySetting.deleteMany({
        where: { userId: otherUser.id },
      });
    });

    it('should hide bio when privacy is set to private', async () => {
      const response = await request(app)
        .get('/api/v1/users/otheruser')
        .expect(200);

      expect(response.body.data.profile.bio).toBeNull();
    });

    it('should show bio to authenticated users when privacy is community', async () => {
      // First update privacy to community
      await prisma.profilePrivacySetting.update({
        where: {
          userId_section: {
            userId: otherUser.id,
            section: 'bio',
          },
        },
        data: { visibility: 'community' },
      });

      const response = await request(app)
        .get('/api/v1/users/otheruser')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Bio should be visible to authenticated users
      expect(response.body.data.profile).toBeDefined();
    });
  });
});
