import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '@/app';
import prisma from '@/config/database';
import { sign } from 'jsonwebtoken';
import unifiedConfig from '@/config/unifiedConfig';

/**
 * Jobs API Integration Tests
 */
describe('Jobs API Integration Tests', () => {
  let authToken: string;
  let companyOwnerId: string;
  let companyId: string;
  let jobId: string;
  let jobSlug: string;

  // Create test user and company before all tests
  beforeAll(async () => {
    // Clean up existing test data
    await prisma.job.deleteMany({ where: { slug: { contains: 'test-job' } } });
    await prisma.company.deleteMany({ where: { slug: 'test-company' } });
    await prisma.user.deleteMany({ where: { email: 'jobstest@example.com' } });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'jobstest@example.com',
        username: 'jobstestuser',
        role: 'company',
        accountType: 'company',
        emailVerified: true,
      },
    });

    companyOwnerId = user.id;

    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        slug: 'test-company',
        ownerUserId: companyOwnerId,
        verifiedCompany: true,
        website: 'https://testcompany.com',
      },
    });

    companyId = company.id;

    // Generate auth token
    authToken = sign(
      { id: companyOwnerId, email: user.email, role: user.role },
      unifiedConfig.auth.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.job.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.user.deleteMany({ where: { id: companyOwnerId } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/jobs', () => {
    it('should create a new job posting with all required fields', async () => {
      const jobData = {
        companyId,
        title: 'Senior LLM Engineer - Test Job',
        description:
          'We are looking for an experienced LLM engineer to join our team and work on cutting-edge AI applications. You will be responsible for designing and implementing LLM-based solutions.',
        requirements:
          'Must have: Experience with GPT-4, Claude, LangChain, Python, vector databases',
        responsibilities: 'Design LLM systems, optimize prompts, build RAG pipelines',
        benefits: 'Competitive salary, remote work, health insurance',
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'senior',
        location: 'San Francisco, CA (Remote)',
        salaryMin: 150000,
        salaryMax: 200000,
        salaryCurrency: 'USD',
        salaryIsPublic: true,
        positionsAvailable: 2,
        hasVisaSponsorship: true,
        primaryLlms: ['GPT-4', 'Claude', 'Llama 2'],
        frameworks: ['LangChain', 'LlamaIndex'],
        vectorDatabases: ['Pinecone', 'Weaviate'],
        infrastructure: ['AWS', 'GCP'],
        programmingLanguages: ['Python', 'TypeScript'],
        useCaseType: 'Conversational AI',
        modelStrategy: 'hybrid',
        skills: [
          {
            skillName: 'Prompt Engineering',
            skillType: 'prompt_engineering',
            requiredLevel: 5,
            isRequired: true,
          },
          {
            skillName: 'RAG Implementation',
            skillType: 'rag',
            requiredLevel: 4,
            isRequired: true,
          },
        ],
        status: 'active',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('slug');
      expect(response.body.data.title).toBe(jobData.title);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.companyId).toBe(companyId);

      // Store for later tests
      jobId = response.body.data.id;
      jobSlug = response.body.data.slug;
    });

    it('should fail to create job without authentication', async () => {
      const jobData = {
        companyId,
        title: 'Test Job',
        description: 'Test description that is long enough to pass validation rules',
        requirements: 'Test requirements that are long enough to pass',
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'mid',
        location: 'Remote',
        primaryLlms: ['GPT-4'],
        status: 'draft',
      };

      await request(app)
        .post('/api/v1/jobs')
        .send(jobData)
        .expect(401);
    });

    it('should fail to create job with invalid data', async () => {
      const invalidJobData = {
        companyId,
        title: 'Short', // Too short
        description: 'Too short',
        requirements: 'Too short',
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'senior',
        location: 'Remote',
        primaryLlms: [], // Empty array not allowed
        status: 'draft',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidJobData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/jobs', () => {
    it('should list all active jobs with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should filter jobs by work location', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ workLocation: 'remote' })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((job: any) => job.workLocation === 'remote')).toBe(true);
      }
    });

    it('should filter jobs by experience level', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ experienceLevel: 'senior' })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every((job: any) => job.experienceLevel === 'senior')
        ).toBe(true);
      }
    });

    it('should search jobs by keyword', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ search: 'LLM' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    it('should get job details by ID', async () => {
      if (!jobId) {
        // Create a job if it doesn't exist
        const jobData = {
          companyId,
          title: 'Test Job for Get By ID',
          description: 'Test description that is long enough to pass validation rules for this test case',
          requirements: 'Test requirements that are long enough to pass validation',
          jobType: 'full_time',
          workLocation: 'remote',
          experienceLevel: 'mid',
          location: 'Remote',
          primaryLlms: ['GPT-4'],
          status: 'active',
        };

        const createResponse = await request(app)
          .post('/api/v1/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData);

        jobId = createResponse.body.data.id;
      }

      const response = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(jobId);
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('company');
    });

    it('should return 404 for nonexistent job ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/v1/jobs/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/jobs/:id', () => {
    it('should update job posting', async () => {
      if (!jobId) {
        throw new Error('jobId not set');
      }

      const updateData = {
        title: 'Updated Senior LLM Engineer Position',
        salaryMin: 160000,
        salaryMax: 210000,
      };

      const response = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(Number(response.body.data.salaryMin)).toBe(updateData.salaryMin);
      expect(Number(response.body.data.salaryMax)).toBe(updateData.salaryMax);
    });

    it('should fail to update job without authentication', async () => {
      if (!jobId) {
        throw new Error('jobId not set');
      }

      await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .send({ title: 'Updated Title' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/jobs/:id', () => {
    it('should soft delete job posting', async () => {
      if (!jobId) {
        throw new Error('jobId not set');
      }

      const response = await request(app)
        .delete(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should fail to delete job without authentication', async () => {
      // Create a new job for deletion test
      const jobData = {
        companyId,
        title: 'Job for Delete Test',
        description: 'Test description that is long enough to pass validation rules',
        requirements: 'Test requirements that are long enough to pass',
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'mid',
        location: 'Remote',
        primaryLlms: ['GPT-4'],
        status: 'draft',
      };

      const createResponse = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData);

      const testJobId = createResponse.body.data.id;

      await request(app)
        .delete(`/api/v1/jobs/${testJobId}`)
        .expect(401);
    });
  });
});
