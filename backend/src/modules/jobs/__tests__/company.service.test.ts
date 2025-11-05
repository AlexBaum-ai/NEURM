import { CompanyService } from '../company.service';
import { CompanyRepository } from '../company.repository';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '@/utils/errors';

// Mock dependencies
jest.mock('@/utils/logger');
jest.mock('@sentry/node');

describe('CompanyService', () => {
  let companyService: CompanyService;
  let mockRepository: jest.Mocked<CompanyRepository>;

  const mockCompany = {
    id: 'company-123',
    name: 'Tech Innovations Inc',
    slug: 'tech-innovations-inc',
    website: 'https://techinnovations.com',
    description: 'Leading AI company',
    logoUrl: 'https://example.com/logo.png',
    headerImageUrl: 'https://example.com/header.jpg',
    industry: 'Technology',
    companySize: '51-200',
    location: 'San Francisco, CA',
    locations: ['San Francisco', 'New York'],
    foundedYear: 2020,
    mission: 'To innovate with AI',
    benefits: ['Health Insurance', '401k', 'Remote Work'],
    cultureDescription: 'Innovative and collaborative',
    techStack: {
      modelsUsed: ['GPT-4', 'Claude'],
      frameworks: ['LangChain', 'LlamaIndex'],
      languages: ['Python', 'TypeScript'],
    },
    linkedinUrl: 'https://linkedin.com/company/techinnovations',
    twitterUrl: 'https://twitter.com/techinnovations',
    githubUrl: 'https://github.com/techinnovations',
    ownerUserId: 'user-123',
    verifiedCompany: false,
    viewCount: 100,
    followerCount: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByOwnerId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getCompanyJobs: jest.fn(),
      incrementViewCount: jest.fn(),
      isUserFollowing: jest.fn(),
      followCompany: jest.fn(),
      unfollowCompany: jest.fn(),
      list: jest.fn(),
    } as any;

    companyService = new CompanyService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompanyProfile', () => {
    it('should fetch company by ID successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockCompany as any);
      mockRepository.isUserFollowing.mockResolvedValue(false);

      const result = await companyService.getCompanyProfile(
        'company-123',
        'user-456'
      );

      expect(result).toMatchObject(mockCompany);
      expect(result.isFollowing).toBe(false);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        'company-123',
        true
      );
      expect(mockRepository.isUserFollowing).toHaveBeenCalledWith(
        'company-123',
        'user-456'
      );
    });

    it('should fetch company by slug if ID lookup fails', async () => {
      mockRepository.findById.mockResolvedValue(null);
      mockRepository.findBySlug.mockResolvedValue(mockCompany as any);
      mockRepository.isUserFollowing.mockResolvedValue(true);

      const result = await companyService.getCompanyProfile(
        'tech-innovations-inc',
        'user-456'
      );

      expect(result).toMatchObject(mockCompany);
      expect(result.isFollowing).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockRepository.findBySlug).toHaveBeenCalledWith(
        'tech-innovations-inc',
        true
      );
    });

    it('should throw NotFoundError if company does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      mockRepository.findBySlug.mockResolvedValue(null);

      await expect(
        companyService.getCompanyProfile('invalid-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should not check following status if user is not provided', async () => {
      mockRepository.findById.mockResolvedValue(mockCompany as any);

      const result = await companyService.getCompanyProfile('company-123');

      expect(result.isFollowing).toBe(false);
      expect(mockRepository.isUserFollowing).not.toHaveBeenCalled();
    });

    it('should increment view count asynchronously', async () => {
      mockRepository.findById.mockResolvedValue(mockCompany as any);
      mockRepository.incrementViewCount.mockResolvedValue(undefined);

      await companyService.getCompanyProfile('company-123');

      // Allow async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRepository.incrementViewCount).toHaveBeenCalledWith(
        'company-123'
      );
    });
  });

  describe('updateCompanyProfile', () => {
    it('should update company profile successfully', async () => {
      const updateData = {
        description: 'Updated description',
        mission: 'Updated mission',
      };

      mockRepository.findById.mockResolvedValue(mockCompany as any);
      mockRepository.update.mockResolvedValue({
        ...mockCompany,
        ...updateData,
      } as any);

      const result = await companyService.updateCompanyProfile(
        'company-123',
        'user-123',
        updateData
      );

      expect(result.description).toBe(updateData.description);
      expect(result.mission).toBe(updateData.mission);
      expect(mockRepository.update).toHaveBeenCalledWith(
        'company-123',
        updateData
      );
    });

    it('should throw NotFoundError if company does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        companyService.updateCompanyProfile('invalid-id', 'user-123', {})
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user is not the owner', async () => {
      mockRepository.findById.mockResolvedValue(mockCompany as any);

      await expect(
        companyService.updateCompanyProfile(
          'company-123',
          'different-user',
          {}
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getCompanyJobs', () => {
    it('should fetch company jobs successfully', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Senior ML Engineer',
          slug: 'senior-ml-engineer',
          location: 'Remote',
          workLocation: 'remote',
        },
        {
          id: 'job-2',
          title: 'AI Product Manager',
          slug: 'ai-product-manager',
          location: 'San Francisco',
          workLocation: 'hybrid',
        },
      ];

      mockRepository.findById.mockResolvedValue(mockCompany as any);
      mockRepository.getCompanyJobs.mockResolvedValue(mockJobs as any);

      const result = await companyService.getCompanyJobs(
        'company-123',
        false
      );

      expect(result).toEqual(mockJobs);
      expect(mockRepository.getCompanyJobs).toHaveBeenCalledWith(
        'company-123',
        false
      );
    });

    it('should throw NotFoundError if company does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        companyService.getCompanyJobs('invalid-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('followCompany', () => {
    it('should follow company successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockCompany as any);
      mockRepository.isUserFollowing.mockResolvedValue(false);
      mockRepository.followCompany.mockResolvedValue(undefined);

      await companyService.followCompany('company-123', 'user-456');

      expect(mockRepository.followCompany).toHaveBeenCalledWith(
        'company-123',
        'user-456'
      );
    });

    it('should throw NotFoundError if company does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        companyService.followCompany('invalid-id', 'user-456')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if already following', async () => {
      mockRepository.findById.mockResolvedValue(mockCompany as any);
      mockRepository.isUserFollowing.mockResolvedValue(true);

      await expect(
        companyService.followCompany('company-123', 'user-456')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('unfollowCompany', () => {
    it('should unfollow company successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockCompany as any);
      mockRepository.isUserFollowing.mockResolvedValue(true);
      mockRepository.unfollowCompany.mockResolvedValue(undefined);

      await companyService.unfollowCompany('company-123', 'user-456');

      expect(mockRepository.unfollowCompany).toHaveBeenCalledWith(
        'company-123',
        'user-456'
      );
    });

    it('should throw NotFoundError if company does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        companyService.unfollowCompany('invalid-id', 'user-456')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if not following', async () => {
      mockRepository.findById.mockResolvedValue(mockCompany as any);
      mockRepository.isUserFollowing.mockResolvedValue(false);

      await expect(
        companyService.unfollowCompany('company-123', 'user-456')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('createCompany', () => {
    it('should create company successfully', async () => {
      const companyData = {
        name: 'New Company',
        website: 'https://newcompany.com',
        description: 'A new AI company',
        industry: 'AI/ML',
        companySize: '11-50',
        location: 'New York',
      };

      mockRepository.findByOwnerId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        ...mockCompany,
        ...companyData,
      } as any);

      const result = await companyService.createCompany(
        'user-123',
        companyData
      );

      expect(result.name).toBe(companyData.name);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if user already has a company', async () => {
      mockRepository.findByOwnerId.mockResolvedValue(mockCompany as any);

      await expect(
        companyService.createCompany('user-123', {
          name: 'New Company',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('listCompanies', () => {
    it('should list companies with pagination', async () => {
      const mockResult = {
        companies: [mockCompany],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockRepository.list.mockResolvedValue(mockResult as any);

      const result = await companyService.listCompanies({
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockResult);
      expect(mockRepository.list).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter companies by search term', async () => {
      const mockResult = {
        companies: [mockCompany],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockRepository.list.mockResolvedValue(mockResult as any);

      await companyService.listCompanies({
        search: 'Tech',
      });

      expect(mockRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter companies by verified status', async () => {
      const mockResult = {
        companies: [mockCompany],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockRepository.list.mockResolvedValue(mockResult as any);

      await companyService.listCompanies({
        verified: true,
      });

      expect(mockRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verifiedCompany: true,
          }),
        })
      );
    });
  });
});
