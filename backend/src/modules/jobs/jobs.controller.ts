import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import JobService from './jobs.service';
import {
  createJobSchema,
  updateJobSchema,
  listJobsQuerySchema,
  jobIdParamSchema,
  jobSlugParamSchema,
  CreateJobInput,
  UpdateJobInput,
  ListJobsQuery,
} from './jobs.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * JobController
 * Handles HTTP requests for job endpoints
 */
export class JobController {
  private service: JobService;

  constructor(service?: JobService) {
    this.service = service || new JobService();
  }

  /**
   * POST /api/v1/jobs
   * Create a new job posting (company accounts only)
   */
  createJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const companyId = req.body.companyId;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      if (!companyId) {
        throw new BadRequestError('Company ID is required');
      }

      // Validate request body
      const validationResult = createJobSchema.safeParse(req.body);

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

      const data: CreateJobInput = validationResult.data;

      logger.info(`User ${userId} creating job for company ${companyId}`);

      const job = await this.service.createJob(companyId, userId, data);

      res.status(201).json({
        success: true,
        data: job,
        message: 'Job created successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'createJob' },
        extra: {
          userId: req.user?.id,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/jobs
   * List job postings with filters and pagination
   */
  listJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = listJobsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const query: ListJobsQuery = validationResult.data;

      const result = await this.service.listJobs(query);

      res.status(200).json({
        success: true,
        data: result.jobs,
        pagination: result.pagination,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'listJobs' },
        extra: {
          query: req.query,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/jobs/:id
   * Get job details by ID
   */
  getJobById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate ID parameter
      const paramValidation = jobIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      const job = await this.service.getJobById(id, true);

      res.status(200).json({
        success: true,
        data: job,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'getJobById' },
        extra: {
          id: req.params.id,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/jobs/slug/:slug
   * Get job details by slug
   */
  getJobBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate slug parameter
      const paramValidation = jobSlugParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { slug } = paramValidation.data;

      const job = await this.service.getJobBySlug(slug, true);

      res.status(200).json({
        success: true,
        data: job,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'getJobBySlug' },
        extra: {
          slug: req.params.slug,
        },
      });
      throw error;
    }
  };

  /**
   * PUT /api/v1/jobs/:id
   * Update job posting (company only)
   */
  updateJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = jobIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = updateJobSchema.safeParse(req.body);

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

      const data: UpdateJobInput = bodyValidation.data;

      logger.info(`User ${userId} updating job ${id}`);

      const job = await this.service.updateJob(id, userId, data);

      res.status(200).json({
        success: true,
        data: job,
        message: 'Job updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'updateJob' },
        extra: {
          userId: req.user?.id,
          id: req.params.id,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/jobs/:id
   * Soft delete job posting (company only)
   */
  deleteJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = jobIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      logger.info(`User ${userId} deleting job ${id}`);

      await this.service.deleteJob(id, userId);

      res.status(200).json({
        success: true,
        message: 'Job deleted successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'deleteJob' },
        extra: {
          userId: req.user?.id,
          id: req.params.id,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/companies/:companyId/jobs
   * Get all jobs for a company
   */
  getCompanyJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyId } = req.params;
      const userId = req.user?.id;
      const includeInactive = req.query.includeInactive === 'true';

      if (!companyId) {
        throw new BadRequestError('Company ID is required');
      }

      const jobs = await this.service.getCompanyJobs(
        companyId,
        userId,
        includeInactive
      );

      res.status(200).json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'getCompanyJobs' },
        extra: {
          companyId: req.params.companyId,
          userId: req.user?.id,
        },
      });
      throw error;
    }
  };
}

export default JobController;
