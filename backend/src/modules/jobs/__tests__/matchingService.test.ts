import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MatchingService } from '../services/matchingService';
import prisma from '@/config/database';
import { redis } from '@/config/redis';

// Mock dependencies
vi.mock('@/config/database', () => ({
  default: {
    job: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/config/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('MatchingService', () => {
  let matchingService: MatchingService;

  beforeEach(() => {
    matchingService = new MatchingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateMatchScore', () => {
    it('should calculate a match score with all factors', async () => {
      // Mock job data
      const mockJob = {
        id: 'job-id-1',
        title: 'Senior LLM Engineer',
        experienceLevel: 'senior',
        workLocation: 'remote',
        salaryMin: 80000,
        salaryMax: 120000,
        primaryLlms: ['GPT-4', 'Claude'],
        frameworks: ['LangChain', 'LlamaIndex'],
        programmingLanguages: ['Python', 'TypeScript'],
        location: 'New York, NY',
        skills: [
          {
            skillName: 'Python',
            skillType: 'programming',
            requiredLevel: 4,
            isRequired: true,
          },
          {
            skillName: 'Machine Learning',
            skillType: 'technical',
            requiredLevel: 4,
            isRequired: true,
          },
          {
            skillName: 'NLP',
            skillType: 'technical',
            requiredLevel: 3,
            isRequired: false,
          },
        ],
        company: {
          benefits: ['Health Insurance', 'Remote Work', 'Equity'],
          cultureDescription: 'Innovation-focused startup',
        },
      };

      // Mock user data
      const mockUser = {
        id: 'user-id-1',
        skills: [
          {
            skillName: 'Python',
            skillType: 'programming',
            proficiency: 5,
          },
          {
            skillName: 'Machine Learning',
            skillType: 'technical',
            proficiency: 4,
          },
          {
            skillName: 'NLP',
            skillType: 'technical',
            proficiency: 3,
          },
        ],
        userModels: [
          {
            model: {
              name: 'GPT-4',
              slug: 'gpt-4',
            },
            proficiency: 4,
          },
          {
            model: {
              name: 'Claude',
              slug: 'claude',
            },
            proficiency: 4,
          },
        ],
        workExperiences: [
          {
            title: 'ML Engineer',
            company: 'Tech Corp',
            startDate: new Date('2015-01-01'),
            endDate: null,
            techStack: {
              frameworks: ['LangChain', 'LlamaIndex'],
              languages: ['Python', 'TypeScript'],
            },
          },
        ],
        profile: {
          yearsExperience: 8,
        },
        jobPreferences: {
          workLocations: ['remote', 'hybrid'],
          preferredLocations: ['New York'],
          salaryExpectationMin: 90000,
          salaryExpectationMax: 130000,
          openToRelocation: false,
          companyPreferences: {},
        },
      };

      // Mock Prisma calls
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      // Mock Redis cache miss
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(redis.setex).mockResolvedValue('OK' as any);

      // Execute
      const result = await matchingService.calculateMatchScore('job-id-1', 'user-id-1');

      // Assertions
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toHaveProperty('skills');
      expect(result.breakdown).toHaveProperty('techStack');
      expect(result.breakdown).toHaveProperty('experience');
      expect(result.breakdown).toHaveProperty('location');
      expect(result.breakdown).toHaveProperty('salary');
      expect(result.breakdown).toHaveProperty('culturalFit');
      expect(result.explanation).toHaveLength(3);
      expect(result.explanation[0]).toBeTypeOf('string');

      // Verify caching
      expect(redis.setex).toHaveBeenCalledWith(
        'match_score:user-id-1:job-id-1',
        expect.any(Number),
        expect.any(String)
      );
    });

    it('should return cached match score if available', async () => {
      const cachedScore = {
        score: 85,
        breakdown: {
          skills: 90,
          techStack: 85,
          experience: 80,
          location: 100,
          salary: 75,
          culturalFit: 50,
        },
        explanation: ['Test reason 1', 'Test reason 2', 'Test reason 3'],
      };

      // Mock Redis cache hit
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedScore));

      // Execute
      const result = await matchingService.calculateMatchScore('job-id-1', 'user-id-1');

      // Assertions
      expect(result).toEqual(cachedScore);
      expect(prisma.job.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if job not found', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

      await expect(
        matchingService.calculateMatchScore('invalid-job-id', 'user-id-1')
      ).rejects.toThrow('Job not found');
    });

    it('should throw NotFoundError if user not found', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.job.findUnique).mockResolvedValue({ id: 'job-id-1' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        matchingService.calculateMatchScore('job-id-1', 'invalid-user-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('Skills Matching', () => {
    it('should calculate 100% for perfect skills match', async () => {
      const mockJob = {
        id: 'job-id-1',
        experienceLevel: 'mid',
        workLocation: 'remote',
        primaryLlms: [],
        frameworks: [],
        programmingLanguages: [],
        skills: [
          {
            skillName: 'Python',
            skillType: 'programming',
            requiredLevel: 4,
            isRequired: true,
          },
        ],
        company: { benefits: [] },
      };

      const mockUser = {
        id: 'user-id-1',
        skills: [
          {
            skillName: 'Python',
            skillType: 'programming',
            proficiency: 5,
          },
        ],
        userModels: [],
        workExperiences: [],
        profile: { yearsExperience: 5 },
        jobPreferences: {
          workLocations: ['remote'],
          preferredLocations: [],
          openToRelocation: false,
        },
      };

      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await matchingService.calculateMatchScore('job-id-1', 'user-id-1');

      expect(result.breakdown.skills).toBeGreaterThanOrEqual(90);
    });

    it('should handle missing skills', async () => {
      const mockJob = {
        id: 'job-id-1',
        experienceLevel: 'mid',
        workLocation: 'remote',
        primaryLlms: [],
        frameworks: [],
        programmingLanguages: [],
        skills: [
          {
            skillName: 'Python',
            skillType: 'programming',
            requiredLevel: 4,
            isRequired: true,
          },
          {
            skillName: 'Java',
            skillType: 'programming',
            requiredLevel: 4,
            isRequired: true,
          },
        ],
        company: { benefits: [] },
      };

      const mockUser = {
        id: 'user-id-1',
        skills: [
          {
            skillName: 'Python',
            skillType: 'programming',
            proficiency: 5,
          },
        ],
        userModels: [],
        workExperiences: [],
        profile: { yearsExperience: 5 },
        jobPreferences: {
          workLocations: ['remote'],
          preferredLocations: [],
          openToRelocation: false,
        },
      };

      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await matchingService.calculateMatchScore('job-id-1', 'user-id-1');

      expect(result.breakdown.skills).toBeLessThan(100);
    });
  });

  describe('Experience Matching', () => {
    it('should calculate high score for matching experience level', async () => {
      const mockJob = {
        id: 'job-id-1',
        experienceLevel: 'senior',
        workLocation: 'remote',
        primaryLlms: [],
        frameworks: [],
        programmingLanguages: [],
        skills: [],
        company: { benefits: [] },
      };

      const mockUser = {
        id: 'user-id-1',
        skills: [],
        userModels: [],
        workExperiences: [],
        profile: { yearsExperience: 8 }, // Senior level
        jobPreferences: {
          workLocations: ['remote'],
          preferredLocations: [],
          openToRelocation: false,
        },
      };

      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await matchingService.calculateMatchScore('job-id-1', 'user-id-1');

      expect(result.breakdown.experience).toBeGreaterThanOrEqual(90);
    });

    it('should penalize overqualification', async () => {
      const mockJob = {
        id: 'job-id-1',
        experienceLevel: 'junior',
        workLocation: 'remote',
        primaryLlms: [],
        frameworks: [],
        programmingLanguages: [],
        skills: [],
        company: { benefits: [] },
      };

      const mockUser = {
        id: 'user-id-1',
        skills: [],
        userModels: [],
        workExperiences: [],
        profile: { yearsExperience: 15 }, // Overqualified for junior
        jobPreferences: {
          workLocations: ['remote'],
          preferredLocations: [],
          openToRelocation: false,
        },
      };

      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await matchingService.calculateMatchScore('job-id-1', 'user-id-1');

      expect(result.breakdown.experience).toBeLessThan(90);
    });
  });

  describe('Location Matching', () => {
    it('should score 100% for remote preference match', async () => {
      const mockJob = {
        id: 'job-id-1',
        experienceLevel: 'mid',
        workLocation: 'remote',
        primaryLlms: [],
        frameworks: [],
        programmingLanguages: [],
        skills: [],
        company: { benefits: [] },
      };

      const mockUser = {
        id: 'user-id-1',
        skills: [],
        userModels: [],
        workExperiences: [],
        profile: { yearsExperience: 5 },
        jobPreferences: {
          workLocations: ['remote'],
          preferredLocations: [],
          openToRelocation: false,
        },
      };

      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await matchingService.calculateMatchScore('job-id-1', 'user-id-1');

      expect(result.breakdown.location).toBe(100);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate user match scores', async () => {
      vi.mocked(redis.keys).mockResolvedValue(['match_score:user-id:job-1', 'match_score:user-id:job-2']);
      vi.mocked(redis.del).mockResolvedValue(2 as any);

      await matchingService.invalidateUserMatches('user-id');

      expect(redis.keys).toHaveBeenCalledWith('match_score:user-id:*');
      expect(redis.del).toHaveBeenCalledWith('match_score:user-id:job-1', 'match_score:user-id:job-2');
    });

    it('should invalidate single match score', async () => {
      vi.mocked(redis.del).mockResolvedValue(1 as any);

      await matchingService.invalidateMatchScore('job-id-1', 'user-id-1');

      expect(redis.del).toHaveBeenCalledWith('match_score:user-id-1:job-id-1');
    });
  });

  describe('Batch Match Scoring', () => {
    it('should calculate match scores for multiple jobs', async () => {
      const mockJob = {
        id: 'job-id-1',
        experienceLevel: 'mid',
        workLocation: 'remote',
        primaryLlms: [],
        frameworks: [],
        programmingLanguages: [],
        skills: [],
        company: { benefits: [] },
      };

      const mockUser = {
        id: 'user-id-1',
        skills: [],
        userModels: [],
        workExperiences: [],
        profile: { yearsExperience: 5 },
        jobPreferences: {
          workLocations: ['remote'],
          preferredLocations: [],
          openToRelocation: false,
        },
      };

      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const jobIds = ['job-id-1', 'job-id-2', 'job-id-3'];
      const results = await matchingService.getMatchScoresForJobs(jobIds, 'user-id-1');

      expect(results.size).toBe(3);
      expect(results.has('job-id-1')).toBe(true);
      expect(results.has('job-id-2')).toBe(true);
      expect(results.has('job-id-3')).toBe(true);
    });
  });
});
