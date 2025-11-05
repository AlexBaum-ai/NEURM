import { Request, Response } from 'express';
import { ZodError } from 'zod';
import SkillsService from './skills.service';
import {
  createSkillSchema,
  updateSkillSchema,
  skillIdParamSchema,
  listSkillsQuerySchema,
  autocompleteSkillsQuerySchema,
  CreateSkillInput,
  UpdateSkillInput,
} from './skills.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * SkillsController
 * Handles HTTP requests for user skills endpoints
 */
export class SkillsController {
  private skillsService: SkillsService;

  constructor(skillsService?: SkillsService) {
    this.skillsService = skillsService || new SkillsService();
  }

  /**
   * POST /api/v1/users/me/skills
   * Create a new skill for the current user
   */
  createSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = createSkillSchema.safeParse(req.body);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const data: CreateSkillInput = validationResult.data;

      const skill = await this.skillsService.createSkill(userId, data);

      res.status(201).json({
        success: true,
        data: skill,
        message: 'Skill created successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/skills
   * Get all skills for the current user
   */
  getUserSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate query parameters
      const validationResult = listSkillsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { skillType, limit } = validationResult.data;

      const skills = await this.skillsService.getUserSkills(userId, {
        skillType,
        limit,
      });

      res.status(200).json({
        success: true,
        data: skills,
        meta: {
          count: skills.length,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * PATCH /api/v1/users/me/skills/:id
   * Update skill proficiency
   */
  updateSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate skill ID parameter
      const paramValidation = skillIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id: skillId } = paramValidation.data;

      // Validate request body
      const bodyValidation = updateSkillSchema.safeParse(req.body);

      if (!bodyValidation.success) {
        const error = bodyValidation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const data: UpdateSkillInput = bodyValidation.data;

      logger.info(`User ${userId} updating skill ${skillId}`, {
        userId,
        skillId,
        proficiency: data.proficiency,
      });

      const updatedSkill = await this.skillsService.updateSkill(userId, skillId, data);

      res.status(200).json({
        success: true,
        data: updatedSkill,
        message: 'Skill updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * DELETE /api/v1/users/me/skills/:id
   * Delete a skill
   */
  deleteSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate skill ID parameter
      const paramValidation = skillIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id: skillId } = paramValidation.data;

      logger.info(`User ${userId} deleting skill ${skillId}`, {
        userId,
        skillId,
      });

      await this.skillsService.deleteSkill(userId, skillId);

      res.status(200).json({
        success: true,
        message: 'Skill deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/skills/autocomplete
   * Get popular skills for autocomplete
   */
  autocompleteSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = autocompleteSkillsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { query, limit } = validationResult.data;

      const skills = await this.skillsService.getPopularSkills(query, limit);

      res.status(200).json({
        success: true,
        data: skills,
        meta: {
          count: skills.length,
          query,
        },
      });
    } catch (error) {
      throw error;
    }
  };
}

export default SkillsController;
