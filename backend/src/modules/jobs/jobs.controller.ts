import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import JobService from './jobs.service';
import SavedJobsService from './services/savedJobsService';
import JobAlertsService from './services/jobAlertsService';
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
import {
  saveJobSchema,
  updateSavedJobSchema,
  listSavedJobsQuerySchema,
  SaveJobInput,
  UpdateSavedJobInput,
  ListSavedJobsQuery,
} from './savedJobs.validation';
import {
  createJobAlertSchema,
  updateJobAlertSchema,
  listJobAlertsQuerySchema,
  alertIdParamSchema,
  trackAlertClickSchema,
  CreateJobAlertInput,
  UpdateJobAlertInput,
  ListJobAlertsQuery,
} from './jobAlerts.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * JobController
 * Handles HTTP requests for job endpoints
 */
export class JobController {
  private service: JobService;
  private savedJobsService: SavedJobsService;
  private jobAlertsService: JobAlertsService;

  constructor(
    service?: JobService,
    savedJobsService?: SavedJobsService,
    jobAlertsService?: JobAlertsService
  ) {
    this.service = service || new JobService();
    this.savedJobsService = savedJobsService || new SavedJobsService();
    this.jobAlertsService = jobAlertsService || new JobAlertsService();
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
      const userId = req.user?.id; // Optional user ID for match scoring

      const result = await this.service.listJobs(query, userId);

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

  /**
   * GET /api/v1/jobs/:id/match
   * Get match score for a specific job (authenticated users only)
   */
  getJobMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required to view match scores');
      }

      // Validate ID parameter
      const paramValidation = jobIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      logger.info(`User ${userId} requesting match score for job ${id}`);

      const result = await this.service.getJobMatch(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'getJobMatch' },
        extra: {
          userId: req.user?.id,
          jobId: req.params.id,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/jobs/slug/:slug/match
   * Get match score for a specific job by slug
   */
  getJobMatchBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required to view match scores');
      }

      // Validate slug parameter
      const paramValidation = jobSlugParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { slug } = paramValidation.data;

      logger.info(`User ${userId} requesting match score for job slug ${slug}`);

      const result = await this.service.getJobMatchBySlug(slug, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'getJobMatchBySlug' },
        extra: {
          userId: req.user?.id,
          jobSlug: req.params.slug,
        },
      });
      throw error;
    }
  };

  // ============================================================================
  // SAVED JOBS ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/jobs/:id/save
   * Save/bookmark a job
   */
  saveJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const paramValidation = jobIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError(paramValidation.error.issues[0].message);
      }

      const { id: jobId } = paramValidation.data;

      const bodyValidation = saveJobSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError(bodyValidation.error.issues[0].message);
      }

      const input: SaveJobInput = bodyValidation.data;

      const savedJob = await this.savedJobsService.saveJob(userId, jobId, input);

      res.status(201).json({
        success: true,
        data: savedJob,
        message: 'Job saved successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'saveJob' },
        extra: { userId: req.user?.id, jobId: req.params.id },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/jobs/:id/save
   * Remove saved/bookmarked job
   */
  unsaveJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const paramValidation = jobIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError(paramValidation.error.issues[0].message);
      }

      const { id: jobId } = paramValidation.data;

      await this.savedJobsService.unsaveJob(userId, jobId);

      res.status(200).json({
        success: true,
        message: 'Job removed from saved jobs',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'unsaveJob' },
        extra: { userId: req.user?.id, jobId: req.params.id },
      });
      throw error;
    }
  };

  /**
   * PATCH /api/v1/jobs/:id/save
   * Update saved job notes
   */
  updateSavedJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const paramValidation = jobIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError(paramValidation.error.issues[0].message);
      }

      const { id: jobId } = paramValidation.data;

      const bodyValidation = updateSavedJobSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError(bodyValidation.error.issues[0].message);
      }

      const input: UpdateSavedJobInput = bodyValidation.data;

      const updated = await this.savedJobsService.updateSavedJob(userId, jobId, input);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Saved job updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'updateSavedJob' },
        extra: { userId: req.user?.id, jobId: req.params.id },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/jobs/saved
   * Get user's saved jobs
   */
  getSavedJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const queryValidation = listSavedJobsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError(queryValidation.error.issues[0].message);
      }

      const query: ListSavedJobsQuery = queryValidation.data;

      const result = await this.savedJobsService.getSavedJobs(userId, query);

      res.status(200).json({
        success: true,
        data: result.savedJobs,
        pagination: result.pagination,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'getSavedJobs' },
        extra: { userId: req.user?.id, query: req.query },
      });
      throw error;
    }
  };

  // ============================================================================
  // JOB ALERTS ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/jobs/alerts
   * Create a new job alert
   */
  createJobAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const bodyValidation = createJobAlertSchema.safeParse(req.body);
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

      const input: CreateJobAlertInput = bodyValidation.data;

      const alert = await this.jobAlertsService.createAlert(userId, input);

      res.status(201).json({
        success: true,
        data: alert,
        message: 'Job alert created successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'createJobAlert' },
        extra: { userId: req.user?.id, body: req.body },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/jobs/alerts
   * Get user's job alerts
   */
  getJobAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const queryValidation = listJobAlertsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError(queryValidation.error.issues[0].message);
      }

      const query: ListJobAlertsQuery = queryValidation.data;

      const alerts = await this.jobAlertsService.getUserAlerts(userId, query);

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'getJobAlerts' },
        extra: { userId: req.user?.id, query: req.query },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/jobs/alerts/:id
   * Get specific job alert
   */
  getJobAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const paramValidation = alertIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError(paramValidation.error.issues[0].message);
      }

      const { id: alertId } = paramValidation.data;

      const alert = await this.jobAlertsService.getAlertById(userId, alertId);

      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'getJobAlert' },
        extra: { userId: req.user?.id, alertId: req.params.id },
      });
      throw error;
    }
  };

  /**
   * PATCH /api/v1/jobs/alerts/:id
   * Update job alert
   */
  updateJobAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const paramValidation = alertIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError(paramValidation.error.issues[0].message);
      }

      const { id: alertId } = paramValidation.data;

      const bodyValidation = updateJobAlertSchema.safeParse(req.body);
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

      const input: UpdateJobAlertInput = bodyValidation.data;

      const updated = await this.jobAlertsService.updateAlert(userId, alertId, input);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Job alert updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'updateJobAlert' },
        extra: { userId: req.user?.id, alertId: req.params.id, body: req.body },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/jobs/alerts/:id
   * Delete job alert
   */
  deleteJobAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const paramValidation = alertIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError(paramValidation.error.issues[0].message);
      }

      const { id: alertId } = paramValidation.data;

      await this.jobAlertsService.deleteAlert(userId, alertId);

      res.status(200).json({
        success: true,
        message: 'Job alert deleted successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'deleteJobAlert' },
        extra: { userId: req.user?.id, alertId: req.params.id },
      });
      throw error;
    }
  };

  /**
   * POST /api/v1/jobs/alerts/track-click
   * Track alert click (when user clicks job from alert email)
   */
  trackAlertClick = async (req: Request, res: Response): Promise<void> => {
    try {
      const bodyValidation = trackAlertClickSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError(bodyValidation.error.issues[0].message);
      }

      const { alertId, jobId } = bodyValidation.data;

      await this.jobAlertsService.trackAlertClick(alertId, jobId);

      res.status(200).json({
        success: true,
        message: 'Click tracked successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'trackAlertClick' },
        extra: { body: req.body },
      });
      throw error;
    }
  };

  /**
   * POST /api/v1/jobs/alerts/:id/test
   * Send test alert email
   */
  testJobAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Authentication required');
      }

      const paramValidation = alertIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError(paramValidation.error.issues[0].message);
      }

      const { id: alertId } = paramValidation.data;

      logger.info(`User ${userId} testing alert ${alertId}`);

      const result = await this.jobAlertsService.sendTestAlert(userId, alertId);

      res.status(200).json({
        success: true,
        data: {
          jobsMatched: result.jobsMatched,
        },
        message: result.message,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'JobController', method: 'testJobAlert' },
        extra: { userId: req.user?.id, alertId: req.params.id },
      });
      throw error;
    }
  };
}

export default JobController;
