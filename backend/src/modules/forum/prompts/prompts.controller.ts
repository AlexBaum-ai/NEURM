import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import PromptService from './prompts.service';
import {
  createPromptSchema,
  updatePromptSchema,
  ratePromptSchema,
  votePromptSchema,
  listPromptsQuerySchema,
  promptIdParamSchema,
  CreatePromptInput,
  UpdatePromptInput,
  RatePromptInput,
  VotePromptInput,
  ListPromptsQuery,
} from './prompts.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * PromptController
 * Handles HTTP requests for prompt endpoints
 */
export class PromptController {
  private promptService: PromptService;

  constructor(promptService?: PromptService) {
    this.promptService = promptService || new PromptService();
  }

  /**
   * GET /api/v1/prompts
   * List prompts with filters and pagination
   */
  listPrompts = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = listPromptsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          error.issues[0].message
        );
      }

      const query: ListPromptsQuery = validationResult.data;
      const userId = req.user?.id;

      const result = await this.promptService.listPrompts(query, userId);

      res.status(200).json({
        success: true,
        data: result.prompts,
        pagination: result.pagination,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/prompts/:id
   * Get prompt details by ID
   */
  getPromptById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate ID parameter
      const validationResult = promptIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          error.issues[0].message
        );
      }

      const { id } = validationResult.data;
      const userId = req.user?.id;

      const prompt = await this.promptService.getPromptById(id, userId);

      res.status(200).json({
        success: true,
        data: prompt,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/v1/prompts
   * Create new prompt
   */
  createPrompt = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = createPromptSchema.safeParse(req.body);

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

      const data: CreatePromptInput = validationResult.data;

      logger.info(`User ${userId} creating prompt`, {
        userId,
        title: data.title,
      });

      const prompt = await this.promptService.createPrompt(userId, data);

      res.status(201).json({
        success: true,
        data: prompt,
        message: 'Prompt created successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * PUT /api/v1/prompts/:id
   * Update prompt (author only)
   */
  updatePrompt = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const idValidation = promptIdParamSchema.safeParse(req.params);

      if (!idValidation.success) {
        const error = idValidation.error as ZodError;
        throw new ValidationError(
          error.issues[0].message
        );
      }

      const { id } = idValidation.data;

      // Validate request body
      const bodyValidation = updatePromptSchema.safeParse(req.body);

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

      const data: UpdatePromptInput = bodyValidation.data;

      logger.info(`User ${userId} updating prompt ${id}`, {
        userId,
        promptId: id,
      });

      const prompt = await this.promptService.updatePrompt(id, userId, data);

      res.status(200).json({
        success: true,
        data: prompt,
        message: 'Prompt updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/v1/prompts/:id/fork
   * Fork prompt
   */
  forkPrompt = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const validationResult = promptIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          error.issues[0].message
        );
      }

      const { id } = validationResult.data;

      logger.info(`User ${userId} forking prompt ${id}`, {
        userId,
        promptId: id,
      });

      const forkedPrompt = await this.promptService.forkPrompt(id, userId);

      res.status(201).json({
        success: true,
        data: forkedPrompt,
        message: 'Prompt forked successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/v1/prompts/:id/rate
   * Rate prompt
   */
  ratePrompt = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const idValidation = promptIdParamSchema.safeParse(req.params);

      if (!idValidation.success) {
        const error = idValidation.error as ZodError;
        throw new ValidationError(
          error.issues[0].message
        );
      }

      const { id } = idValidation.data;

      // Validate request body
      const bodyValidation = ratePromptSchema.safeParse(req.body);

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

      const data: RatePromptInput = bodyValidation.data;

      logger.info(`User ${userId} rating prompt ${id}`, {
        userId,
        promptId: id,
        rating: data.rating,
      });

      const result = await this.promptService.ratePrompt(id, userId, data);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/v1/prompts/:id/vote
   * Vote on prompt
   */
  votePrompt = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const idValidation = promptIdParamSchema.safeParse(req.params);

      if (!idValidation.success) {
        const error = idValidation.error as ZodError;
        throw new ValidationError(
          error.issues[0].message
        );
      }

      const { id } = idValidation.data;

      // Validate request body
      const bodyValidation = votePromptSchema.safeParse(req.body);

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

      const data: VotePromptInput = bodyValidation.data;

      logger.info(`User ${userId} voting on prompt ${id}`, {
        userId,
        promptId: id,
        value: data.value,
      });

      const result = await this.promptService.votePrompt(id, userId, data);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * DELETE /api/v1/prompts/:id
   * Delete prompt (author only)
   */
  deletePrompt = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const validationResult = promptIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          error.issues[0].message
        );
      }

      const { id } = validationResult.data;

      logger.info(`User ${userId} deleting prompt ${id}`, {
        userId,
        promptId: id,
      });

      const result = await this.promptService.deletePrompt(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      throw error;
    }
  };
}

export default PromptController;
