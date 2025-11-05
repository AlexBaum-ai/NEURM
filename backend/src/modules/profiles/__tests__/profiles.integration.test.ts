import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database';
import { generateToken } from '@/utils/jwt';
import { UserRole } from '@prisma/client';

describe('Profiles API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let username: string;
  let testUser: any;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'testprofile@example.com',
        username: 'testprofile',
        passwordHash: 'hashed_password',
        role: UserRole.user,
        emailVerified: true,
        profile: {
          create: {
            displayName: 'Test Profile',
            headline: 'Software Engineer',
            bio: 'Test bio',
            location: 'Test City',
          },
        },
      },
    });

    userId = testUser.id;
    username = testUser.username;
    authToken = generateToken({ userId, role: testUser.role });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.jobPreferences.deleteMany({
      where: { userId },
    });
    await prisma.profile.deleteMany({
      where: { userId },
    });
    await prisma.user.deleteMany({
      where: { id: userId },
    });
    await prisma.$disconnect();
  });

  describe('PUT /api/v1/profiles/candidate', () => {
    it('should update candidate profile with authentication', async () => {
      const updateData = {
        headline: 'Senior Software Engineer',
        jobPreferences: {
          rolesInterested: ['Backend Engineer', 'Full Stack Engineer'],
          jobTypes: ['full_time', 'contract'],
          workLocations: ['remote', 'hybrid'],
          preferredLocations: ['San Francisco', 'New York'],
          openToRelocation: true,
          salaryExpectationMin: 120000,
          salaryExpectationMax: 180000,
          salaryCurrency: 'USD',
          visibleToRecruiters: true,
        },
      };

      const response = await request(app)
        .put('/api/v1/profiles/candidate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(username);
      expect(response.body.data.jobPreferences).toBeDefined();
      expect(response.body.data.jobPreferences.rolesInterested).toContain('Backend Engineer');
      expect(response.body.message).toBe('Candidate profile updated successfully');
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        headline: 'Senior Software Engineer',
      };

      const response = await request(app)
        .put('/api/v1/profiles/candidate')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate job preferences data', async () => {
      const invalidData = {
        jobPreferences: {
          rolesInterested: ['Engineer'],
          salaryExpectationMin: -1000, // Invalid negative salary
        },
      };

      const response = await request(app)
        .put('/api/v1/profiles/candidate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('GET /api/v1/profiles/:username', () => {
    beforeAll(async () => {
      // Create job preferences for the test user
      await prisma.jobPreferences.upsert({
        where: { userId },
        create: {
          userId,
          rolesInterested: ['Software Engineer'],
          jobTypes: ['full_time'],
          workLocations: ['remote'],
          preferredLocations: [],
          openToRelocation: false,
          visibleToRecruiters: true,
        },
        update: {},
      });
    });

    it('should return public candidate profile without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/profiles/${username}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(username);
      expect(response.body.data.profile).toBeDefined();
      expect(response.body.data.communityStats).toBeDefined();
    });

    it('should return full profile for authenticated owner', async () => {
      const response = await request(app)
        .get(`/api/v1/profiles/${username}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobPreferences).toBeDefined();
    });

    it('should return 404 for non-existent username', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/nonexistentuser')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });

    it('should respect privacy settings', async () => {
      // Set bio to private
      await prisma.profilePrivacySetting.upsert({
        where: {
          userId_section: {
            userId,
            section: 'bio',
          },
        },
        create: {
          userId,
          section: 'bio',
          visibility: 'private',
        },
        update: {
          visibility: 'private',
        },
      });

      const response = await request(app)
        .get(`/api/v1/profiles/${username}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.bio).toBeNull();

      // Cleanup
      await prisma.profilePrivacySetting.deleteMany({
        where: { userId },
      });
    });
  });

  describe('GET /api/v1/profiles/:username/portfolio', () => {
    let portfolioProjectId: string;

    beforeAll(async () => {
      // Create a portfolio project
      const project = await prisma.portfolioProject.create({
        data: {
          userId,
          title: 'Test Project',
          description: 'A test portfolio project',
          techStack: { languages: ['TypeScript', 'React'] },
          projectUrl: 'https://testproject.com',
          githubUrl: 'https://github.com/test/project',
          isFeatured: true,
          displayOrder: 0,
        },
      });
      portfolioProjectId = project.id;
    });

    afterAll(async () => {
      await prisma.portfolioProject.deleteMany({
        where: { id: portfolioProjectId },
      });
    });

    it('should return portfolio projects', async () => {
      const response = await request(app)
        .get(`/api/v1/profiles/${username}/portfolio`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toBe('Test Project');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/nonexistentuser/portfolio')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should respect portfolio privacy settings', async () => {
      // Set portfolio to private
      await prisma.profilePrivacySetting.upsert({
        where: {
          userId_section: {
            userId,
            section: 'portfolio',
          },
        },
        create: {
          userId,
          section: 'portfolio',
          visibility: 'private',
        },
        update: {
          visibility: 'private',
        },
      });

      const response = await request(app)
        .get(`/api/v1/profiles/${username}/portfolio`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Portfolio is not publicly accessible');

      // Cleanup
      await prisma.profilePrivacySetting.deleteMany({
        where: { userId, section: 'portfolio' },
      });
    });
  });
});
