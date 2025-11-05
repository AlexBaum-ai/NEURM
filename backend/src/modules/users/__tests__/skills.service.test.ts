import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import SkillsService from '../skills.service';
import SkillsRepository from '../skills.repository';

// Mock SkillsRepository
jest.mock('../skills.repository');

describe('SkillsService', () => {
  let skillsService: SkillsService;
  let mockSkillsRepository: jest.Mocked<SkillsRepository>;
  const mockUserId = 'user-123';
  const mockSkillId = 'skill-456';

  beforeEach(() => {
    mockSkillsRepository = new SkillsRepository() as jest.Mocked<SkillsRepository>;
    skillsService = new SkillsService(mockSkillsRepository);
    jest.clearAllMocks();
  });

  describe('createSkill', () => {
    const createSkillData = {
      skillName: 'Prompt Engineering',
      skillType: 'prompt_engineering' as const,
      proficiency: 4,
    };

    it('should create a new skill successfully', async () => {
      const mockSkill = {
        id: mockSkillId,
        userId: mockUserId,
        skillName: 'Prompt Engineering',
        skillType: 'prompt_engineering',
        proficiency: 4,
        endorsementCount: 0,
        createdAt: new Date(),
      };

      mockSkillsRepository.countByUserId.mockResolvedValue(5);
      mockSkillsRepository.existsByName.mockResolvedValue(false);
      mockSkillsRepository.create.mockResolvedValue(mockSkill);

      const result = await skillsService.createSkill(mockUserId, createSkillData);

      expect(result).toEqual({
        id: mockSkillId,
        skillName: 'Prompt Engineering',
        skillType: 'prompt_engineering',
        proficiency: 4,
        endorsementCount: 0,
        createdAt: mockSkill.createdAt,
      });
      expect(mockSkillsRepository.countByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockSkillsRepository.existsByName).toHaveBeenCalledWith(
        mockUserId,
        'Prompt Engineering'
      );
      expect(mockSkillsRepository.create).toHaveBeenCalledWith(mockUserId, createSkillData);
    });

    it('should throw BadRequestError when user has reached max skills limit', async () => {
      mockSkillsRepository.countByUserId.mockResolvedValue(50);

      await expect(
        skillsService.createSkill(mockUserId, createSkillData)
      ).rejects.toThrow('Maximum of 50 skills allowed per user');

      expect(mockSkillsRepository.existsByName).not.toHaveBeenCalled();
      expect(mockSkillsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when skill name already exists for user', async () => {
      mockSkillsRepository.countByUserId.mockResolvedValue(10);
      mockSkillsRepository.existsByName.mockResolvedValue(true);

      await expect(
        skillsService.createSkill(mockUserId, createSkillData)
      ).rejects.toThrow('Skill "Prompt Engineering" already exists in your profile');

      expect(mockSkillsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserSkills', () => {
    it('should return all skills for a user', async () => {
      const mockSkills = [
        {
          id: 'skill-1',
          userId: mockUserId,
          skillName: 'Prompt Engineering',
          skillType: 'prompt_engineering',
          proficiency: 5,
          endorsementCount: 10,
          createdAt: new Date(),
        },
        {
          id: 'skill-2',
          userId: mockUserId,
          skillName: 'Fine-tuning',
          skillType: 'fine_tuning',
          proficiency: 4,
          endorsementCount: 5,
          createdAt: new Date(),
        },
      ];

      mockSkillsRepository.findByUserId.mockResolvedValue(mockSkills);

      const result = await skillsService.getUserSkills(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].skillName).toBe('Prompt Engineering');
      expect(result[1].skillName).toBe('Fine-tuning');
      expect(mockSkillsRepository.findByUserId).toHaveBeenCalledWith(mockUserId, undefined);
    });

    it('should filter skills by skillType', async () => {
      const mockSkills = [
        {
          id: 'skill-1',
          userId: mockUserId,
          skillName: 'Prompt Engineering',
          skillType: 'prompt_engineering',
          proficiency: 5,
          endorsementCount: 10,
          createdAt: new Date(),
        },
      ];

      mockSkillsRepository.findByUserId.mockResolvedValue(mockSkills);

      const result = await skillsService.getUserSkills(mockUserId, {
        skillType: 'prompt_engineering',
      });

      expect(result).toHaveLength(1);
      expect(mockSkillsRepository.findByUserId).toHaveBeenCalledWith(mockUserId, {
        skillType: 'prompt_engineering',
      });
    });

    it('should return empty array when user has no skills', async () => {
      mockSkillsRepository.findByUserId.mockResolvedValue([]);

      const result = await skillsService.getUserSkills(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('updateSkill', () => {
    const updateData = { proficiency: 5 };

    it('should update skill proficiency successfully', async () => {
      const existingSkill = {
        id: mockSkillId,
        userId: mockUserId,
        skillName: 'Prompt Engineering',
        skillType: 'prompt_engineering',
        proficiency: 4,
        endorsementCount: 10,
        createdAt: new Date(),
      };

      const updatedSkill = { ...existingSkill, proficiency: 5 };

      mockSkillsRepository.findById.mockResolvedValue(existingSkill);
      mockSkillsRepository.update.mockResolvedValue(updatedSkill);

      const result = await skillsService.updateSkill(mockUserId, mockSkillId, updateData);

      expect(result.proficiency).toBe(5);
      expect(mockSkillsRepository.findById).toHaveBeenCalledWith(mockSkillId, mockUserId);
      expect(mockSkillsRepository.update).toHaveBeenCalledWith(
        mockSkillId,
        mockUserId,
        updateData
      );
    });

    it('should throw NotFoundError when skill does not exist', async () => {
      mockSkillsRepository.findById.mockResolvedValue(null);

      await expect(
        skillsService.updateSkill(mockUserId, mockSkillId, updateData)
      ).rejects.toThrow('Skill not found');

      expect(mockSkillsRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when skill belongs to different user', async () => {
      mockSkillsRepository.findById.mockResolvedValue(null);

      await expect(
        skillsService.updateSkill('different-user-id', mockSkillId, updateData)
      ).rejects.toThrow('Skill not found');
    });
  });

  describe('deleteSkill', () => {
    it('should delete skill successfully', async () => {
      const existingSkill = {
        id: mockSkillId,
        userId: mockUserId,
        skillName: 'Prompt Engineering',
        skillType: 'prompt_engineering',
        proficiency: 4,
        endorsementCount: 10,
        createdAt: new Date(),
      };

      mockSkillsRepository.findById.mockResolvedValue(existingSkill);
      mockSkillsRepository.delete.mockResolvedValue(existingSkill);

      await skillsService.deleteSkill(mockUserId, mockSkillId);

      expect(mockSkillsRepository.findById).toHaveBeenCalledWith(mockSkillId, mockUserId);
      expect(mockSkillsRepository.delete).toHaveBeenCalledWith(mockSkillId, mockUserId);
    });

    it('should throw NotFoundError when skill does not exist', async () => {
      mockSkillsRepository.findById.mockResolvedValue(null);

      await expect(
        skillsService.deleteSkill(mockUserId, mockSkillId)
      ).rejects.toThrow('Skill not found');

      expect(mockSkillsRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getPopularSkills', () => {
    it('should return popular skills matching query', async () => {
      const mockPopularSkills = [
        { skillName: 'Prompt Engineering', skillType: 'prompt_engineering', count: 150 },
        { skillName: 'Prompt Design', skillType: 'prompt_engineering', count: 80 },
        { skillName: 'Prompt Optimization', skillType: 'prompt_engineering', count: 45 },
      ];

      mockSkillsRepository.getPopularSkills.mockResolvedValue(mockPopularSkills);

      const result = await skillsService.getPopularSkills('prompt', 10);

      expect(result).toEqual(mockPopularSkills);
      expect(mockSkillsRepository.getPopularSkills).toHaveBeenCalledWith('prompt', 10);
    });

    it('should return empty array when no skills match query', async () => {
      mockSkillsRepository.getPopularSkills.mockResolvedValue([]);

      const result = await skillsService.getPopularSkills('nonexistent', 10);

      expect(result).toEqual([]);
    });

    it('should use default limit when not provided', async () => {
      mockSkillsRepository.getPopularSkills.mockResolvedValue([]);

      await skillsService.getPopularSkills('test');

      expect(mockSkillsRepository.getPopularSkills).toHaveBeenCalledWith('test', 10);
    });
  });
});
