import { ProfilesService } from '../profiles.service';
import ProfilesRepository from '../profiles.repository';
import { UserRole } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '@/utils/errors';

// Mock the repository
jest.mock('../profiles.repository');

describe('ProfilesService', () => {
  let profilesService: ProfilesService;
  let mockProfilesRepository: jest.Mocked<ProfilesRepository>;

  const mockUserId = 'user-123';
  const mockUsername = 'johndoe';

  const mockCandidateProfile = {
    id: mockUserId,
    username: mockUsername,
    email: 'john@example.com',
    role: UserRole.user,
    accountType: 'individual',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    emailVerified: true,
    passwordHash: 'hashed',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    timezone: 'UTC',
    locale: 'en',
    loginCount: 5,
    profile: {
      userId: mockUserId,
      displayName: 'John Doe',
      headline: 'Senior LLM Engineer',
      bio: 'Passionate about AI and ML',
      avatarUrl: 'https://example.com/avatar.jpg',
      coverImageUrl: null,
      location: 'San Francisco, CA',
      website: 'https://johndoe.com',
      githubUrl: 'https://github.com/johndoe',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      twitterUrl: null,
      huggingfaceUrl: null,
      pronouns: 'he/him',
      availabilityStatus: 'actively_looking',
      yearsExperience: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    jobPreferences: {
      id: 'pref-123',
      userId: mockUserId,
      rolesInterested: ['AI Engineer', 'ML Engineer'],
      jobTypes: ['full_time'],
      workLocations: ['remote', 'hybrid'],
      preferredLocations: ['San Francisco', 'New York'],
      openToRelocation: true,
      salaryExpectationMin: 150000,
      salaryExpectationMax: 200000,
      salaryCurrency: 'USD',
      desiredStartDate: new Date('2024-03-01'),
      availability: 'Available immediately',
      companyPreferences: {
        companySize: ['startup', 'mid'],
        industries: ['AI', 'SaaS'],
      },
      visibleToRecruiters: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    skills: [
      {
        id: 'skill-1',
        userId: mockUserId,
        skillName: 'Python',
        skillType: 'programming',
        proficiency: 5,
        endorsementCount: 10,
        createdAt: new Date('2024-01-01'),
      },
    ],
    workExperiences: [
      {
        id: 'exp-1',
        userId: mockUserId,
        title: 'Senior AI Engineer',
        company: 'AI Corp',
        location: 'San Francisco, CA',
        employmentType: 'full_time',
        startDate: new Date('2020-01-01'),
        endDate: null,
        description: 'Working on LLM applications',
        techStack: { languages: ['Python', 'TypeScript'], frameworks: ['LangChain'] },
        displayOrder: 0,
        createdAt: new Date('2024-01-01'),
      },
    ],
    educations: [
      {
        id: 'edu-1',
        userId: mockUserId,
        institution: 'Stanford University',
        degree: 'BS Computer Science',
        fieldOfStudy: 'Artificial Intelligence',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-06-01'),
        description: null,
        displayOrder: 0,
        createdAt: new Date('2024-01-01'),
      },
    ],
    portfolioProjects: [
      {
        id: 'proj-1',
        userId: mockUserId,
        title: 'AI Chatbot',
        description: 'An intelligent chatbot using GPT-4',
        techStack: { languages: ['Python'], frameworks: ['OpenAI'] },
        projectUrl: 'https://chatbot.example.com',
        githubUrl: 'https://github.com/johndoe/chatbot',
        demoUrl: 'https://demo.chatbot.example.com',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        screenshots: [],
        isFeatured: true,
        displayOrder: 0,
        createdAt: new Date('2024-01-01'),
      },
    ],
    userBadges: [
      {
        id: 'ub-1',
        userId: mockUserId,
        badgeId: 'badge-1',
        earnedAt: new Date('2024-01-10'),
        badge: {
          id: 'badge-1',
          name: 'AI Expert',
          slug: 'ai-expert',
          description: 'Awarded for AI expertise',
          iconUrl: 'https://example.com/badge.png',
          badgeType: 'gold',
          criteria: {},
          createdAt: new Date('2024-01-01'),
        },
      },
    ],
    reputation: {
      userId: mockUserId,
      totalReputation: 500,
      level: 'expert',
      updatedAt: new Date('2024-01-15'),
    },
    _count: {
      topics: 10,
      replies: 50,
      articles: 5,
    },
  };

  const mockCommunityStats = {
    reputation: 500,
    reputationLevel: 'expert',
    topReplies: [],
    topTopics: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProfilesRepository = new ProfilesRepository() as jest.Mocked<ProfilesRepository>;
    profilesService = new ProfilesService(mockProfilesRepository);
  });

  describe('updateCandidateProfile', () => {
    it('should update candidate profile with job preferences', async () => {
      const updateData = {
        jobPreferences: {
          rolesInterested: ['ML Engineer'],
          jobTypes: ['full_time'],
          workLocations: ['remote'],
        },
        headline: 'Lead AI Engineer',
      };

      mockProfilesRepository.upsertJobPreferences = jest.fn().resolves({} as any);
      mockProfilesRepository.updateProfile = jest.fn().resolves({} as any);
      mockProfilesRepository.findCandidateProfileById = jest
        .fn()
        .resolves(mockCandidateProfile as any);
      mockProfilesRepository.getCommunityStats = jest.fn().resolves(mockCommunityStats);

      const result = await profilesService.updateCandidateProfile(mockUserId, updateData);

      expect(mockProfilesRepository.upsertJobPreferences).toHaveBeenCalledWith(
        mockUserId,
        updateData.jobPreferences
      );
      expect(mockProfilesRepository.updateProfile).toHaveBeenCalledWith(mockUserId, {
        headline: 'Lead AI Engineer',
      });
      expect(result.username).toBe(mockUsername);
      expect(result.profile?.headline).toBe('Senior LLM Engineer');
    });

    it('should throw NotFoundError if user not found', async () => {
      mockProfilesRepository.upsertJobPreferences = jest.fn().resolves({} as any);
      mockProfilesRepository.updateProfile = jest.fn().resolves({} as any);
      mockProfilesRepository.findCandidateProfileById = jest.fn().resolves(null);

      await expect(
        profilesService.updateCandidateProfile(mockUserId, {
          headline: 'New Headline',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCandidateProfile', () => {
    it('should return public candidate profile', async () => {
      mockProfilesRepository.findCandidateProfileByUsername = jest
        .fn()
        .resolves(mockCandidateProfile as any);
      mockProfilesRepository.getPrivacySettings = jest.fn().resolves({});
      mockProfilesRepository.isVisibleToRecruiters = jest.fn().resolves(true);
      mockProfilesRepository.getCommunityStats = jest.fn().resolves(mockCommunityStats);

      const result = await profilesService.getCandidateProfile(mockUsername);

      expect(result.username).toBe(mockUsername);
      expect(result.profile?.headline).toBe('Senior LLM Engineer');
      expect(result.skills).toHaveLength(1);
    });

    it('should throw NotFoundError if user not found', async () => {
      mockProfilesRepository.findCandidateProfileByUsername = jest.fn().resolves(null);

      await expect(profilesService.getCandidateProfile('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ForbiddenError if recruiter tries to view hidden profile', async () => {
      const hiddenProfile = { ...mockCandidateProfile };

      mockProfilesRepository.findCandidateProfileByUsername = jest
        .fn()
        .resolves(hiddenProfile as any);
      mockProfilesRepository.getPrivacySettings = jest.fn().resolves({});
      mockProfilesRepository.getUserRole = jest.fn().resolves({
        role: UserRole.company,
        accountType: 'company',
      });
      mockProfilesRepository.isVisibleToRecruiters = jest.fn().resolves(false);

      await expect(
        profilesService.getCandidateProfile(mockUsername, 'recruiter-123')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should apply privacy filters for non-authenticated users', async () => {
      mockProfilesRepository.findCandidateProfileByUsername = jest
        .fn()
        .resolves(mockCandidateProfile as any);
      mockProfilesRepository.getPrivacySettings = jest.fn().resolves({
        bio: 'private',
        contact: 'community',
      });
      mockProfilesRepository.isVisibleToRecruiters = jest.fn().resolves(true);
      mockProfilesRepository.getCommunityStats = jest.fn().resolves(mockCommunityStats);

      const result = await profilesService.getCandidateProfile(mockUsername);

      expect(result.profile?.bio).toBeNull();
      expect(result.profile?.website).toBeNull();
    });
  });

  describe('getPortfolio', () => {
    const mockPortfolioProjects = [
      {
        id: 'proj-1',
        userId: mockUserId,
        title: 'AI Chatbot',
        description: 'An intelligent chatbot',
        techStack: {},
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/johndoe/chatbot',
        demoUrl: null,
        thumbnailUrl: null,
        screenshots: [],
        isFeatured: true,
        displayOrder: 0,
        createdAt: new Date('2024-01-01'),
      },
    ];

    it('should return portfolio projects', async () => {
      mockProfilesRepository.findCandidateProfileByUsername = jest
        .fn()
        .resolves(mockCandidateProfile as any);
      mockProfilesRepository.getPrivacySettings = jest.fn().resolves({
        portfolio: 'public',
      });
      mockProfilesRepository.getPortfolioProjects = jest.fn().resolves(mockPortfolioProjects);

      const result = await profilesService.getPortfolio(mockUsername);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('AI Chatbot');
    });

    it('should throw ForbiddenError if portfolio is private', async () => {
      mockProfilesRepository.findCandidateProfileByUsername = jest
        .fn()
        .resolves(mockCandidateProfile as any);
      mockProfilesRepository.getPrivacySettings = jest.fn().resolves({
        portfolio: 'private',
      });
      mockProfilesRepository.getUserRole = jest.fn().resolves({
        role: UserRole.user,
        accountType: 'individual',
      });

      await expect(profilesService.getPortfolio(mockUsername, 'other-user')).rejects.toThrow(
        ForbiddenError
      );
    });

    it('should allow owner to view private portfolio', async () => {
      mockProfilesRepository.findCandidateProfileByUsername = jest
        .fn()
        .resolves(mockCandidateProfile as any);
      mockProfilesRepository.getPrivacySettings = jest.fn().resolves({
        portfolio: 'private',
      });
      mockProfilesRepository.getPortfolioProjects = jest.fn().resolves(mockPortfolioProjects);

      const result = await profilesService.getPortfolio(mockUsername, mockUserId);

      expect(result).toHaveLength(1);
    });
  });
});
