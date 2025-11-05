import * as Sentry from '@sentry/node';
import { UserSkill } from '@prisma/client';
import SkillsRepository, { PopularSkill } from './skills.repository';
import {
  CreateSkillInput,
  UpdateSkillInput,
  SkillType,
} from './skills.validation';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Skill response DTO
 */
export interface SkillResponse {
  id: string;
  skillName: string;
  skillType: string;
  proficiency: number;
  endorsementCount: number;
  createdAt: Date;
}

/**
 * SkillsService
 * Business logic for user skills management
 */
export class SkillsService {
  private skillsRepository: SkillsRepository;
  private readonly MAX_SKILLS_PER_USER = 50;

  constructor(skillsRepository?: SkillsRepository) {
    this.skillsRepository = skillsRepository || new SkillsRepository();
  }

  /**
   * Create a new skill for a user
   */
  async createSkill(userId: string, data: CreateSkillInput): Promise<SkillResponse> {
    try {
      // Check if user has reached the maximum number of skills
      const currentCount = await this.skillsRepository.countByUserId(userId);
      if (currentCount >= this.MAX_SKILLS_PER_USER) {
        throw new BadRequestError(
          `Maximum of ${this.MAX_SKILLS_PER_USER} skills allowed per user`
        );
      }

      // Check if skill with same name already exists for this user
      const exists = await this.skillsRepository.existsByName(userId, data.skillName);
      if (exists) {
        throw new ConflictError(
          `Skill "${data.skillName}" already exists in your profile`
        );
      }

      logger.info(`Creating skill for user ${userId}`, {
        userId,
        skillName: data.skillName,
        skillType: data.skillType,
      });

      const skill = await this.skillsRepository.create(userId, data);

      return this.mapToSkillResponse(skill);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'SkillsService', method: 'createSkill' },
        extra: { userId, data },
      });
      throw error;
    }
  }

  /**
   * Get all skills for a user
   */
  async getUserSkills(
    userId: string,
    options?: { skillType?: SkillType; limit?: number }
  ): Promise<SkillResponse[]> {
    try {
      const skills = await this.skillsRepository.findByUserId(userId, options);
      return skills.map(this.mapToSkillResponse);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'SkillsService', method: 'getUserSkills' },
        extra: { userId, options },
      });
      throw error;
    }
  }

  /**
   * Update skill proficiency
   */
  async updateSkill(
    userId: string,
    skillId: string,
    data: UpdateSkillInput
  ): Promise<SkillResponse> {
    try {
      // Check if skill exists and belongs to user
      const existingSkill = await this.skillsRepository.findById(skillId, userId);
      if (!existingSkill) {
        throw new NotFoundError('Skill not found');
      }

      logger.info(`Updating skill ${skillId} for user ${userId}`, {
        userId,
        skillId,
        newProficiency: data.proficiency,
      });

      const updatedSkill = await this.skillsRepository.update(skillId, userId, data);

      return this.mapToSkillResponse(updatedSkill);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'SkillsService', method: 'updateSkill' },
        extra: { userId, skillId, data },
      });
      throw error;
    }
  }

  /**
   * Delete a skill
   */
  async deleteSkill(userId: string, skillId: string): Promise<void> {
    try {
      // Check if skill exists and belongs to user
      const existingSkill = await this.skillsRepository.findById(skillId, userId);
      if (!existingSkill) {
        throw new NotFoundError('Skill not found');
      }

      logger.info(`Deleting skill ${skillId} for user ${userId}`, {
        userId,
        skillId,
        skillName: existingSkill.skillName,
      });

      await this.skillsRepository.delete(skillId, userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'SkillsService', method: 'deleteSkill' },
        extra: { userId, skillId },
      });
      throw error;
    }
  }

  /**
   * Get popular skills for autocomplete
   */
  async getPopularSkills(query: string, limit: number = 10): Promise<PopularSkill[]> {
    try {
      return await this.skillsRepository.getPopularSkills(query, limit);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'SkillsService', method: 'getPopularSkills' },
        extra: { query, limit },
      });
      throw error;
    }
  }

  /**
   * Map UserSkill entity to SkillResponse DTO
   */
  private mapToSkillResponse(skill: UserSkill): SkillResponse {
    return {
      id: skill.id,
      skillName: skill.skillName,
      skillType: skill.skillType,
      proficiency: skill.proficiency,
      endorsementCount: skill.endorsementCount,
      createdAt: skill.createdAt,
    };
  }
}

export default SkillsService;
