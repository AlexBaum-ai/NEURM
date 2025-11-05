import UserService from '@/modules/users/users.service';
import UserRepository from '@/modules/users/users.repository';
import { UserRole, AccountType, UserStatus, AvailabilityStatus } from '@prisma/client';

// Mock the repository
jest.mock('@/modules/users/users.repository');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock repository
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    userService = new UserService(mockUserRepository);
  });

  describe('getCurrentUserProfile', () => {
    it('should return user profile with email for authenticated user', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.user,
        accountType: AccountType.individual,
        status: UserStatus.active,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: true,
        passwordHash: 'hashed',
        loginCount: 5,
        timezone: 'UTC',
        locale: 'en',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        profile: {
          userId,
          displayName: 'Test User',
          headline: 'Software Engineer',
          bio: 'I love LLMs',
          avatarUrl: 'https://example.com/avatar.jpg',
          coverImageUrl: null,
          location: 'Amsterdam',
          website: 'https://example.com',
          githubUrl: 'https://github.com/testuser',
          linkedinUrl: null,
          twitterUrl: null,
          huggingfaceUrl: null,
          pronouns: 'they/them',
          availabilityStatus: AvailabilityStatus.open,
          yearsExperience: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        _count: {
          topics: 10,
          replies: 25,
          articles: 3,
        },
        userBadges: [],
        skills: [],
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.getReputationScore.mockResolvedValue(150);

      const result = await userService.getCurrentUserProfile(userId);

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(result.profile?.displayName).toBe('Test User');
      expect(result.stats.reputation).toBe(150);
      expect(result.stats.topics).toBe(10);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.getReputationScore).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        userService.getCurrentUserProfile('nonexistent-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('getPublicProfile', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      role: UserRole.user,
      accountType: AccountType.individual,
      status: UserStatus.active,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      emailVerified: true,
      passwordHash: 'hashed',
      loginCount: 5,
      timezone: 'UTC',
      locale: 'en',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      profile: {
        userId: 'user-123',
        displayName: 'Test User',
        headline: 'Software Engineer',
        bio: 'I love LLMs',
        avatarUrl: 'https://example.com/avatar.jpg',
        coverImageUrl: null,
        location: 'Amsterdam',
        website: 'https://example.com',
        githubUrl: 'https://github.com/testuser',
        linkedinUrl: null,
        twitterUrl: null,
        huggingfaceUrl: null,
        pronouns: 'they/them',
        availabilityStatus: AvailabilityStatus.open,
        yearsExperience: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      _count: {
        topics: 10,
        replies: 25,
        articles: 3,
      },
      userBadges: [],
      skills: [
        {
          id: 'skill-1',
          userId: 'user-123',
          skillName: 'Prompt Engineering',
          skillType: 'prompt_engineering',
          proficiency: 5,
          endorsementCount: 10,
          createdAt: new Date(),
        },
      ],
    };

    it('should return public profile without email', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockUserRepository.getPrivacySettings.mockResolvedValue({});
      mockUserRepository.getReputationScore.mockResolvedValue(150);

      const result = await userService.getPublicProfile('testuser');

      expect(result).toBeDefined();
      expect(result.email).toBeUndefined();
      expect(result.username).toBe('testuser');
      expect(result.profile?.displayName).toBe('Test User');
      expect(result.skills).toBeDefined();
      expect(result.skills?.length).toBe(1);
    });

    it('should include email when viewing own profile', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockUserRepository.getPrivacySettings.mockResolvedValue({});
      mockUserRepository.getReputationScore.mockResolvedValue(150);

      const result = await userService.getPublicProfile('testuser', 'user-123');

      expect(result.email).toBe('test@example.com');
    });

    it('should respect privacy settings for bio', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockUserRepository.getPrivacySettings.mockResolvedValue({
        bio: 'private',
      });
      mockUserRepository.getReputationScore.mockResolvedValue(150);

      const result = await userService.getPublicProfile('testuser', 'other-user');

      expect(result.profile?.bio).toBeNull();
    });

    it('should respect privacy settings for skills', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockUserRepository.getPrivacySettings.mockResolvedValue({
        skills: 'private',
      });
      mockUserRepository.getReputationScore.mockResolvedValue(150);

      const result = await userService.getPublicProfile('testuser', 'other-user');

      expect(result.skills).toBeUndefined();
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(
        userService.getPublicProfile('nonexistent')
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const userId = 'user-123';
      const updateData = {
        displayName: 'Updated Name',
        headline: 'Senior Engineer',
        bio: 'Updated bio',
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.user,
        accountType: AccountType.individual,
        status: UserStatus.active,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: true,
        passwordHash: 'hashed',
        loginCount: 5,
        timezone: 'UTC',
        locale: 'en',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        profile: {
          userId,
          displayName: 'Updated Name',
          headline: 'Senior Engineer',
          bio: 'Updated bio',
          avatarUrl: null,
          coverImageUrl: null,
          location: null,
          website: null,
          githubUrl: null,
          linkedinUrl: null,
          twitterUrl: null,
          huggingfaceUrl: null,
          pronouns: null,
          availabilityStatus: AvailabilityStatus.not_looking,
          yearsExperience: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        _count: {
          topics: 0,
          replies: 0,
          articles: 0,
        },
        userBadges: [],
        skills: [],
      };

      mockUserRepository.updateProfile.mockResolvedValue(mockUpdatedUser);
      mockUserRepository.getReputationScore.mockResolvedValue(0);

      const result = await userService.updateProfile(userId, updateData);

      expect(result).toBeDefined();
      expect(result.profile?.displayName).toBe('Updated Name');
      expect(result.profile?.headline).toBe('Senior Engineer');
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(userId, updateData);
    });

    it('should handle partial updates', async () => {
      const userId = 'user-123';
      const updateData = {
        location: 'Rotterdam',
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.user,
        accountType: AccountType.individual,
        status: UserStatus.active,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: true,
        passwordHash: 'hashed',
        loginCount: 5,
        timezone: 'UTC',
        locale: 'en',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        profile: {
          userId,
          displayName: 'Test User',
          headline: 'Engineer',
          bio: 'Bio',
          avatarUrl: null,
          coverImageUrl: null,
          location: 'Rotterdam',
          website: null,
          githubUrl: null,
          linkedinUrl: null,
          twitterUrl: null,
          huggingfaceUrl: null,
          pronouns: null,
          availabilityStatus: AvailabilityStatus.not_looking,
          yearsExperience: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        _count: {
          topics: 0,
          replies: 0,
          articles: 0,
        },
        userBadges: [],
        skills: [],
      };

      mockUserRepository.updateProfile.mockResolvedValue(mockUpdatedUser);
      mockUserRepository.getReputationScore.mockResolvedValue(0);

      const result = await userService.updateProfile(userId, updateData);

      expect(result.profile?.location).toBe('Rotterdam');
    });
  });
});
