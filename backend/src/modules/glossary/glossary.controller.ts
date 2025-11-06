import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import glossaryService from './glossary.service';
import {
  listGlossaryQuerySchema,
  getGlossaryBySlugParamsSchema,
  searchGlossaryQuerySchema,
  createGlossaryTermSchema,
  updateGlossaryTermSchema,
  getGlossaryByIdParamsSchema,
  ListGlossaryQuery,
  SearchGlossaryQuery,
  CreateGlossaryTermData,
  UpdateGlossaryTermData,
} from './glossary.validation';
import { BadRequestError, NotFoundError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * GlossaryController
 * Handles HTTP requests for glossary endpoints
 */
export class GlossaryController {
  /**
   * GET /api/v1/glossary
   * Get all glossary terms with filtering and pagination
   */
  getAllTerms = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = listGlossaryQuerySchema.safeParse(req.query);

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

      const query: ListGlossaryQuery = validationResult.data;

      const result = await glossaryService.getAllTerms(query);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'GlossaryController', method: 'getAllTerms' },
        extra: { query: req.query },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/glossary/:slug
   * Get glossary term details by slug
   */
  getTermBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const validationResult = getGlossaryBySlugParamsSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid slug');
      }

      const { slug } = validationResult.data;

      const term = await glossaryService.getTermBySlug(slug);

      if (!term) {
        throw new NotFoundError(`Glossary term with slug '${slug}' not found`);
      }

      res.status(200).json({
        success: true,
        data: term,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'GlossaryController', method: 'getTermBySlug' },
        extra: { params: req.params },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/glossary/search
   * Search glossary terms
   */
  searchTerms = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = searchGlossaryQuerySchema.safeParse(req.query);

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

      const query: SearchGlossaryQuery = validationResult.data;

      const result = await glossaryService.searchTerms(query);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'GlossaryController', method: 'searchTerms' },
        extra: { query: req.query },
      });
      throw error;
    }
  };

  /**
   * POST /api/v1/glossary
   * Create a new glossary term (Admin only)
   */
  createTerm = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validationResult = createGlossaryTermSchema.safeParse(req.body);

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

      const data: CreateGlossaryTermData = validationResult.data;

      const term = await glossaryService.createTerm(data);

      res.status(201).json({
        success: true,
        data: term,
        message: 'Glossary term created successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        Sentry.captureException(error, {
          tags: { controller: 'GlossaryController', method: 'createTerm' },
          extra: { body: req.body },
        });
        throw new BadRequestError(error.message);
      }

      Sentry.captureException(error, {
        tags: { controller: 'GlossaryController', method: 'createTerm' },
        extra: { body: req.body },
      });
      throw error;
    }
  };

  /**
   * PUT /api/v1/glossary/:id
   * Update a glossary term (Admin only)
   */
  updateTerm = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const paramsValidation = getGlossaryByIdParamsSchema.safeParse(req.params);

      if (!paramsValidation.success) {
        const error = paramsValidation.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid glossary term ID');
      }

      // Validate request body
      const bodyValidation = updateGlossaryTermSchema.safeParse(req.body);

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

      const { id } = paramsValidation.data;
      const data: UpdateGlossaryTermData = bodyValidation.data;

      const term = await glossaryService.updateTerm(id, data);

      if (!term) {
        throw new NotFoundError(`Glossary term with ID '${id}' not found`);
      }

      res.status(200).json({
        success: true,
        data: term,
        message: 'Glossary term updated successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        Sentry.captureException(error, {
          tags: { controller: 'GlossaryController', method: 'updateTerm' },
          extra: { params: req.params, body: req.body },
        });
        throw new BadRequestError(error.message);
      }

      Sentry.captureException(error, {
        tags: { controller: 'GlossaryController', method: 'updateTerm' },
        extra: { params: req.params, body: req.body },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/glossary/:id
   * Delete a glossary term (Admin only)
   */
  deleteTerm = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const validationResult = getGlossaryByIdParamsSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid glossary term ID');
      }

      const { id } = validationResult.data;

      const deleted = await glossaryService.deleteTerm(id);

      if (!deleted) {
        throw new NotFoundError(`Glossary term with ID '${id}' not found`);
      }

      res.status(200).json({
        success: true,
        message: 'Glossary term deleted successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'GlossaryController', method: 'deleteTerm' },
        extra: { params: req.params },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/glossary/popular
   * Get popular glossary terms
   */
  getPopularTerms = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const terms = await glossaryService.getPopularTerms(limit);

      res.status(200).json({
        success: true,
        data: terms,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'GlossaryController', method: 'getPopularTerms' },
        extra: { query: req.query },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/glossary/categories
   * Get all categories with term counts
   */
  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await glossaryService.getCategoriesWithCounts();

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'GlossaryController', method: 'getCategories' },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/glossary/index
   * Get alphabetical index (A-Z with counts)
   */
  getAlphabeticalIndex = async (req: Request, res: Response): Promise<void> => {
    try {
      const index = await glossaryService.getAlphabeticalIndex();

      res.status(200).json({
        success: true,
        data: index,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'GlossaryController', method: 'getAlphabeticalIndex' },
      });
      throw error;
    }
  };
}

export default new GlossaryController();
