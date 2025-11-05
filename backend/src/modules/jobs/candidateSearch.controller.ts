import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { CandidateSearchService } from './candidateSearch.service';
import {
  candidateSearchSchema,
  saveSearchSchema,
  exportCandidatesSchema,
  trackProfileViewSchema,
} from './candidateSearch.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * CandidateSearchController
 * Handles HTTP requests for candidate search endpoints (premium feature for recruiters)
 */
export class CandidateSearchController {
  private service: CandidateSearchService;

  constructor(service?: CandidateSearchService) {
    this.service = service || new CandidateSearchService();
  }

  /**
   * GET /api/v1/candidates/search
   * Search for candidates (company premium feature)
   */
  searchCandidates = async (req: Request, res: Response): Promise<void> => {
    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: 'POST /api/v1/candidates/search',
    });

    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate query parameters
      const validationResult = candidateSearchSchema.safeParse(req.query);

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

      const filters = validationResult.data;

      logger.info(`Candidate search initiated`, {
        userId,
        filters,
      });

      const result = await this.service.searchCandidates(filters, userId);

      // Add search highlights (matching keywords)
      const highlights: string[] = [];
      if (filters.query) highlights.push(`text: ${filters.query}`);
      if (filters.skills) highlights.push(`skills: ${filters.skills.join(', ')}`);
      if (filters.models) highlights.push(`models: ${filters.models.join(', ')}`);
      if (filters.location) highlights.push(`location: ${filters.location}`);

      res.status(200).json({
        success: true,
        data: {
          candidates: result.candidates,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: Math.ceil(result.total / result.limit),
          },
          filters: filters,
          highlights,
        },
        message: `Found ${result.total} matching candidates`,
      });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  };

  /**
   * POST /api/v1/candidates/track-view
   * Track profile view (for "who viewed my profile")
   */
  trackProfileView = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const validationResult = trackProfileViewSchema.safeParse(req.body);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { profileId } = validationResult.data;

      await this.service.trackProfileView(profileId, userId);

      res.status(200).json({
        success: true,
        message: 'Profile view tracked successfully',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };

  /**
   * POST /api/v1/candidates/save-search
   * Save a candidate search
   */
  saveSearch = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const validationResult = saveSearchSchema.safeParse(req.body);

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

      const data = validationResult.data;

      await this.service.saveSearch(userId, data);

      res.status(201).json({
        success: true,
        message: 'Search saved successfully',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };

  /**
   * GET /api/v1/candidates/saved-searches
   * Get saved searches for the current user
   */
  getSavedSearches = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const searches = await this.service.getSavedSearches(userId);

      res.status(200).json({
        success: true,
        data: searches,
      });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };

  /**
   * DELETE /api/v1/candidates/saved-searches/:searchId
   * Delete a saved search
   */
  deleteSavedSearch = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { searchId } = req.params;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      if (!searchId) {
        throw new BadRequestError('Search ID is required');
      }

      await this.service.deleteSavedSearch(searchId, userId);

      res.status(200).json({
        success: true,
        message: 'Search deleted successfully',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };

  /**
   * POST /api/v1/candidates/export
   * Export candidate list to CSV
   */
  exportCandidates = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const validationResult = exportCandidatesSchema.safeParse(req.body);

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

      const data = validationResult.data;

      logger.info(`Exporting candidates`, {
        userId,
        count: data.candidateIds.length,
        format: data.format,
      });

      const exportData = await this.service.exportCandidates(data, userId);

      if (data.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=candidates-${Date.now()}.csv`
        );
        res.status(200).send(exportData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=candidates-${Date.now()}.json`
        );
        res.status(200).send(exportData);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };

  /**
   * GET /api/v1/candidates/profile-viewers
   * Get who viewed my profile (for candidates)
   */
  getProfileViewers = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.service.getProfileViewers(userId, page, limit);

      res.status(200).json({
        success: true,
        data: {
          views: result.views,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: Math.ceil(result.total / result.limit),
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
}

export default CandidateSearchController;
