import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import EndorsementsService from '../endorsements.service';
import EndorsementsRepository from '../endorsements.repository';
import SkillsRepository from '../../skills.repository';
import { UserRepository } from '../../users.repository';

// Mock dependencies
jest.mock('../endorsements.repository');
jest.mock('../../skills.repository');
jest.mock('../../users.repository');

describe('EndorsementsService', () => {
  let endorsementsService: EndorsementsService;
  let mockEndorsementsRepository: jest.Mocked<EndorsementsRepository>;
  let mockSkillsRepository: jest.Mocked<SkillsRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockEndorserId = 'endorser-123';
  const mockProfileId = 'profile-456';
  const mockSkillId = 'skill-789';
  const mockUsername = 'testuser';

  beforeEach(() => {
    mockEndorsementsRepository = new EndorsementsRepository() as jest.Mocked<EndorsementsRepository>;
    mockSkillsRepository = new SkillsRepository() as jest.Mocked<SkillsRepository>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;

    endorsementsService = new EndorsementsService(
      mockEndorsementsRepository,
      mockSkillsRepository,
      mockUserRepository
    );

    jest.clearAllMocks();
  });

  describe('createEndorsement', () => {
    const mockProfileUser = {
      id: mockProfileId,
      username: mockUsername,
      email: 'test@example.com',
      emailVerified: true,
      passwordHash: 'hashed',
      role: 'user' as const,
      accountType: 'individual' as const,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      loginCount: 5,
      timezone: 'UTC',
      locale: 'en',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      followerCount: 10,
      followingCount: 5,
      profile: null,
    };

    const mockSkill = {
      id: mockSkillId,
      userId: mockProfileId,
      skillName: 'Prompt Engineering',
      skillType: 'prompt_engineering',
      proficiency: 4,
      endorsementCount: 5,
      createdAt: new Date(),
    };

    it('should create an endorsement successfully', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockProfileUser);
      mockSkillsRepository.findById.mockResolvedValue(mockSkill);
      mockEndorsementsRepository.exists.mockResolvedValue(false);
      mockEndorsementsRepository.transaction.mockImplementation(async (callback: any) => {
        return await callback(null);
      });
      mockEndorsementsRepository.create.mockResolvedValue({
        id: 'endorsement-123',
        userId: mockEndorserId,
        profileId: mockProfileId,
        skillId: mockSkillId,
        createdAt: new Date(),
      });

      await endorsementsService.createEndorsement(mockEndorserId, mockUsername, mockSkillId);

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(mockUsername);
      expect(mockSkillsRepository.findById).toHaveBeenCalledWith(mockSkillId, mockProfileId);
      expect(mockEndorsementsRepository.exists).toHaveBeenCalledWith(
        mockEndorserId,
        mockProfileId,
        mockSkillId
      );
      expect(mockEndorsementsRepository.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(
        endorsementsService.createEndorsement(mockEndorserId, mockUsername, mockSkillId)
      ).rejects.toThrow('User not found');

      expect(mockSkillsRepository.findById).not.toHaveBeenCalled();
      expect(mockEndorsementsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when trying to endorse own skill', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockProfileUser);

      await expect(
        endorsementsService.createEndorsement(mockProfileId, mockUsername, mockSkillId)
      ).rejects.toThrow('Cannot endorse your own skills');

      expect(mockSkillsRepository.findById).not.toHaveBeenCalled();
      expect(mockEndorsementsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when skill not found', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockProfileUser);
      mockSkillsRepository.findById.mockResolvedValue(null);

      await expect(
        endorsementsService.createEndorsement(mockEndorserId, mockUsername, mockSkillId)
      ).rejects.toThrow('Skill not found');

      expect(mockEndorsementsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when endorsement already exists', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockProfileUser);
      mockSkillsRepository.findById.mockResolvedValue(mockSkill);
      mockEndorsementsRepository.exists.mockResolvedValue(true);

      await expect(
        endorsementsService.createEndorsement(mockEndorserId, mockUsername, mockSkillId)
      ).rejects.toThrow('You have already endorsed this skill');

      expect(mockEndorsementsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('removeEndorsement', () => {
    const mockProfileUser = {
      id: mockProfileId,
      username: mockUsername,
      email: 'test@example.com',
      emailVerified: true,
      passwordHash: 'hashed',
      role: 'user' as const,
      accountType: 'individual' as const,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      loginCount: 5,
      timezone: 'UTC',
      locale: 'en',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      followerCount: 10,
      followingCount: 5,
      profile: null,
    };

    const mockSkill = {
      id: mockSkillId,
      userId: mockProfileId,
      skillName: 'Prompt Engineering',
      skillType: 'prompt_engineering',
      proficiency: 4,
      endorsementCount: 5,
      createdAt: new Date(),
    };

    it('should remove an endorsement successfully', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockProfileUser);
      mockSkillsRepository.findById.mockResolvedValue(mockSkill);
      mockEndorsementsRepository.exists.mockResolvedValue(true);
      mockEndorsementsRepository.transaction.mockImplementation(async (callback: any) => {
        return await callback(null);
      });
      mockEndorsementsRepository.delete.mockResolvedValue({
        id: 'endorsement-123',
        userId: mockEndorserId,
        profileId: mockProfileId,
        skillId: mockSkillId,
        createdAt: new Date(),
      });

      await endorsementsService.removeEndorsement(mockEndorserId, mockUsername, mockSkillId);

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(mockUsername);
      expect(mockSkillsRepository.findById).toHaveBeenCalledWith(mockSkillId, mockProfileId);
      expect(mockEndorsementsRepository.exists).toHaveBeenCalledWith(
        mockEndorserId,
        mockProfileId,
        mockSkillId
      );
      expect(mockEndorsementsRepository.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundError when endorsement not found', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockProfileUser);
      mockSkillsRepository.findById.mockResolvedValue(mockSkill);
      mockEndorsementsRepository.exists.mockResolvedValue(false);

      await expect(
        endorsementsService.removeEndorsement(mockEndorserId, mockUsername, mockSkillId)
      ).rejects.toThrow('Endorsement not found');

      expect(mockEndorsementsRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getEndorsements', () => {
    const mockProfileUser = {
      id: mockProfileId,
      username: mockUsername,
      email: 'test@example.com',
      emailVerified: true,
      passwordHash: 'hashed',
      role: 'user' as const,
      accountType: 'individual' as const,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      loginCount: 5,
      timezone: 'UTC',
      locale: 'en',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      followerCount: 10,
      followingCount: 5,
      profile: null,
    };

    const mockSkill = {
      id: mockSkillId,
      userId: mockProfileId,
      skillName: 'Prompt Engineering',
      skillType: 'prompt_engineering',
      proficiency: 4,
      endorsementCount: 2,
      createdAt: new Date(),
    };

    const mockEndorsements = [
      {
        id: 'endorsement-1',
        userId: 'user-1',
        profileId: mockProfileId,
        skillId: mockSkillId,
        createdAt: new Date(),
        user: {
          id: 'user-1',
          username: 'endorser1',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            photoUrl: 'https://example.com/photo1.jpg',
            headline: 'AI Engineer',
          },
        },
      },
      {
        id: 'endorsement-2',
        userId: 'user-2',
        profileId: mockProfileId,
        skillId: mockSkillId,
        createdAt: new Date(),
        user: {
          id: 'user-2',
          username: 'endorser2',
          profile: {
            firstName: 'Jane',
            lastName: 'Smith',
            photoUrl: 'https://example.com/photo2.jpg',
            headline: 'ML Specialist',
          },
        },
      },
    ];

    it('should return list of endorsements', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockProfileUser);
      mockSkillsRepository.findById.mockResolvedValue(mockSkill);
      mockEndorsementsRepository.findBySkillId.mockResolvedValue(mockEndorsements as any);
      mockEndorsementsRepository.countBySkillId.mockResolvedValue(2);

      const result = await endorsementsService.getEndorsements(mockUsername, mockSkillId, {
        limit: 20,
        offset: 0,
      });

      expect(result.endorsements).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.endorsements[0].username).toBe('endorser1');
      expect(result.endorsements[1].username).toBe('endorser2');
      expect(mockEndorsementsRepository.findBySkillId).toHaveBeenCalledWith(mockSkillId, {
        limit: 20,
        offset: 0,
      });
      expect(mockEndorsementsRepository.countBySkillId).toHaveBeenCalledWith(mockSkillId);
    });

    it('should return empty array when no endorsements', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockProfileUser);
      mockSkillsRepository.findById.mockResolvedValue(mockSkill);
      mockEndorsementsRepository.findBySkillId.mockResolvedValue([]);
      mockEndorsementsRepository.countBySkillId.mockResolvedValue(0);

      const result = await endorsementsService.getEndorsements(mockUsername, mockSkillId);

      expect(result.endorsements).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(
        endorsementsService.getEndorsements(mockUsername, mockSkillId)
      ).rejects.toThrow('User not found');

      expect(mockEndorsementsRepository.findBySkillId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when skill not found', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(mockProfileUser);
      mockSkillsRepository.findById.mockResolvedValue(null);

      await expect(
        endorsementsService.getEndorsements(mockUsername, mockSkillId)
      ).rejects.toThrow('Skill not found');

      expect(mockEndorsementsRepository.findBySkillId).not.toHaveBeenCalled();
    });
  });
});
