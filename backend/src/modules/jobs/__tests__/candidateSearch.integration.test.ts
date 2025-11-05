import request from 'supertest';
import app from '@/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '@/utils/testHelpers';

const prisma = new PrismaClient();

describe('Candidate Search API Integration Tests', () => {
  let companyUser: any;
  let companyToken: string;
  let candidateUser: any;
  let candidateToken: string;

  beforeAll(async () => {
    // Create a company user
    companyUser = await prisma.user.create({
      data: {
        email: 'company@test.com',
        username: 'testcompany',
        passwordHash: 'hashedpassword',
        accountType: 'company',
        role: 'company',
        status: 'active',
        company: {
          create: {
            name: 'Test Company',
            slug: 'test-company',
          },
        },
      },
      include: {
        company: true,
      },
    });

    companyToken = generateTestToken(companyUser.id);

    // Create a candidate user with profile and preferences
    candidateUser = await prisma.user.create({
      data: {
        email: 'candidate@test.com',
        username: 'testcandidate',
        passwordHash: 'hashedpassword',
        accountType: 'individual',
        role: 'user',
        status: 'active',
        profile: {
          create: {
            displayName: 'Test Candidate',
            headline: 'Senior LLM Engineer',
            bio: 'Experienced with GPT-4 and RAG systems',
            location: 'Amsterdam, Netherlands',
            yearsExperience: 5,
            availabilityStatus: 'actively_looking',
          },
        },
        jobPreferences: {
          create: {
            rolesInterested: ['LLM Engineer', 'AI Researcher'],
            jobTypes: ['full_time'],
            workLocations: ['remote', 'hybrid'],
            salaryExpectationMin: 80000,
            salaryExpectationMax: 120000,
            salaryCurrency: 'EUR',
            visibleToRecruiters: true,
          },
        },
        skills: {
          create: [
            {
              skillName: 'Prompt Engineering',
              skillType: 'prompt_engineering',
              proficiency: 5,
            },
            {
              skillName: 'RAG',
              skillType: 'rag',
              proficiency: 4,
            },
          ],
        },
      },
      include: {
        profile: true,
        jobPreferences: true,
        skills: true,
      },
    });

    candidateToken = generateTestToken(candidateUser.id);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.profileView.deleteMany({});
    await prisma.savedSearch.deleteMany({});
    await prisma.userSkill.deleteMany({});
    await prisma.jobPreferences.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/v1/candidates/search', () => {
    it('should return candidates matching search criteria', async () => {
      const response = await request(app)
        .get('/api/v1/candidates/search')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({
          query: 'LLM Engineer',
          skills: 'Prompt Engineering',
          experienceMin: 3,
          availabilityStatus: 'actively_looking',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidates).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/candidates/search')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should only return candidates visible to recruiters', async () => {
      // Create a candidate not visible to recruiters
      const hiddenCandidate = await prisma.user.create({
        data: {
          email: 'hidden@test.com',
          username: 'hiddencandidate',
          passwordHash: 'hashedpassword',
          accountType: 'individual',
          role: 'user',
          status: 'active',
          profile: {
            create: {
              displayName: 'Hidden Candidate',
              headline: 'LLM Engineer',
              availabilityStatus: 'actively_looking',
            },
          },
          jobPreferences: {
            create: {
              rolesInterested: ['LLM Engineer'],
              jobTypes: ['full_time'],
              workLocations: ['remote'],
              visibleToRecruiters: false, // Not visible
            },
          },
        },
      });

      const response = await request(app)
        .get('/api/v1/candidates/search')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({
          query: 'LLM Engineer',
        })
        .expect(200);

      const candidateIds = response.body.data.candidates.map((c: any) => c.userId);
      expect(candidateIds).not.toContain(hiddenCandidate.id);

      // Clean up
      await prisma.jobPreferences.delete({ where: { userId: hiddenCandidate.id } });
      await prisma.profile.delete({ where: { userId: hiddenCandidate.id } });
      await prisma.user.delete({ where: { id: hiddenCandidate.id } });
    });

    it('should reject search from non-company accounts', async () => {
      const response = await request(app)
        .get('/api/v1/candidates/search')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/candidates/search')
        .expect(401);
    });
  });

  describe('POST /api/v1/candidates/track-view', () => {
    it('should track profile view by recruiter', async () => {
      const response = await request(app)
        .post('/api/v1/candidates/track-view')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          profileId: candidateUser.id,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('tracked');

      // Verify view was recorded
      const views = await prisma.profileView.findMany({
        where: {
          profileId: candidateUser.id,
          viewerId: companyUser.id,
        },
      });

      expect(views.length).toBeGreaterThan(0);
    });

    it('should require valid profile ID', async () => {
      await request(app)
        .post('/api/v1/candidates/track-view')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          profileId: 'invalid-uuid',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/candidates/save-search', () => {
    it('should save a candidate search', async () => {
      const response = await request(app)
        .post('/api/v1/candidates/save-search')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          name: 'Senior LLM Engineers',
          filters: {
            skills: ['Prompt Engineering', 'RAG'],
            experienceMin: 5,
            availabilityStatus: 'actively_looking',
          },
          notificationEnabled: true,
          notificationFrequency: 'daily',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('saved');
    });

    it('should reject save search from non-company accounts', async () => {
      await request(app)
        .post('/api/v1/candidates/save-search')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          name: 'Test Search',
          filters: {},
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/candidates/saved-searches', () => {
    it('should return saved searches for the company', async () => {
      const response = await request(app)
        .get('/api/v1/candidates/saved-searches')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/candidates/export', () => {
    it('should export candidates to CSV', async () => {
      const response = await request(app)
        .post('/api/v1/candidates/export')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          candidateIds: [candidateUser.id],
          format: 'csv',
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Username');
      expect(response.text).toContain('testcandidate');
    });

    it('should export candidates to JSON', async () => {
      const response = await request(app)
        .post('/api/v1/candidates/export')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          candidateIds: [candidateUser.id],
          format: 'json',
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      const data = JSON.parse(response.text);
      expect(data).toBeInstanceOf(Array);
      expect(data[0].username).toBe('testcandidate');
    });

    it('should track views when exporting', async () => {
      const viewsBefore = await prisma.profileView.count({
        where: { profileId: candidateUser.id },
      });

      await request(app)
        .post('/api/v1/candidates/export')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          candidateIds: [candidateUser.id],
          format: 'csv',
        })
        .expect(200);

      const viewsAfter = await prisma.profileView.count({
        where: { profileId: candidateUser.id },
      });

      expect(viewsAfter).toBeGreaterThan(viewsBefore);
    });

    it('should reject export with empty candidate list', async () => {
      await request(app)
        .post('/api/v1/candidates/export')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          candidateIds: [],
          format: 'csv',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/candidates/profile-viewers', () => {
    it('should return who viewed my profile', async () => {
      // First, track a view
      await prisma.profileView.create({
        data: {
          profileId: candidateUser.id,
          viewerId: companyUser.id,
          companyId: companyUser.company.id,
        },
      });

      const response = await request(app)
        .get('/api/v1/candidates/profile-viewers')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.views).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty('total');

      // Check if the view from company is in the list
      const viewerIds = response.body.data.views.map((v: any) => v.viewer.id);
      expect(viewerIds).toContain(companyUser.id);
    });

    it('should support pagination for profile viewers', async () => {
      const response = await request(app)
        .get('/api/v1/candidates/profile-viewers')
        .set('Authorization', `Bearer ${candidateToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe('Boolean search operators', () => {
    it('should support AND operator for skills', async () => {
      const response = await request(app)
        .get('/api/v1/candidates/search')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({
          skills: ['Prompt Engineering', 'RAG'],
          operator: 'AND',
        })
        .expect(200);

      // Should only return candidates with BOTH skills
      expect(response.body.success).toBe(true);
    });

    it('should support OR operator for skills', async () => {
      const response = await request(app)
        .get('/api/v1/candidates/search')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({
          skills: ['Prompt Engineering', 'RAG'],
          operator: 'OR',
        })
        .expect(200);

      // Should return candidates with ANY of the skills
      expect(response.body.success).toBe(true);
    });
  });

  describe('Sorting options', () => {
    it('should support sorting by years of experience', async () => {
      const response = await request(app)
        .get('/api/v1/candidates/search')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({
          sortBy: 'years_experience',
          sortOrder: 'desc',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support sorting by recent activity', async () => {
      const response = await request(app)
        .get('/api/v1/candidates/search')
        .set('Authorization', `Bearer ${companyToken}`)
        .query({
          sortBy: 'recent_activity',
          sortOrder: 'desc',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
