import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import ApplicationService from './services/applicationService';
import {
  applyToJobSchema,
  listApplicationsQuerySchema,
  updateApplicationStatusSchema,
  jobIdParamSchema,
  applicationIdParamSchema,
  ApplyToJobInput,
  ListApplicationsQuery,
  UpdateApplicationStatusInput,
} from './jobs.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * ApplicationController
 * Handles HTTP requests for job application endpoints
 */
export class ApplicationController {
  private service: ApplicationService;

  constructor(service?: ApplicationService) {
    this.service = service || new ApplicationService();
  }

  /**
   * POST /api/v1/jobs/:id/apply
   * Apply to a job (Easy Apply)
   */
  applyToJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate job ID
      const jobIdValidation = jobIdParamSchema.safeParse(req.params);
      if (!jobIdValidation.success) {
        const error = jobIdValidation.error as ZodError;
        throw new ValidationError(
          `Invalid job ID: ${error.issues.map((e) => e.message).join(', ')}`
        );
      }

      const { id: jobId } = jobIdValidation.data;

      // Validate request body
      const validationResult = applyToJobSchema.safeParse(req.body);

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

      const data: ApplyToJobInput = validationResult.data;

      logger.info(`User ${userId} applying to job ${jobId}`);

      const application = await this.service.applyToJob({
        jobId,
        userId,
        ...data,
      });

      res.status(201).json({
        success: true,
        data: application,
        message: 'Application submitted successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ApplicationController', method: 'applyToJob' },
        extra: {
          userId: req.user?.id,
          jobId: req.params.id,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/applications
   * Get user's applications
   */
  getUserApplications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate query parameters
      const validationResult = listApplicationsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          `Invalid query parameters: ${error.issues.map((e) => e.message).join(', ')}`
        );
      }

      const filters: ListApplicationsQuery = validationResult.data;

      logger.info(`User ${userId} fetching applications`, { filters });

      const applications = await this.service.getUserApplications(userId, filters);

      res.status(200).json({
        success: true,
        data: applications,
        count: applications.length,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ApplicationController', method: 'getUserApplications' },
        extra: {
          userId: req.user?.id,
          query: req.query,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/applications/:id
   * Get application details
   */
  getApplicationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate application ID
      const validationResult = applicationIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          `Invalid application ID: ${error.issues.map((e) => e.message).join(', ')}`
        );
      }

      const { id: applicationId } = validationResult.data;

      logger.info(`User ${userId} fetching application ${applicationId}`);

      const application = await this.service.getApplicationById(applicationId, userId);

      res.status(200).json({
        success: true,
        data: application,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ApplicationController', method: 'getApplicationById' },
        extra: {
          userId: req.user?.id,
          applicationId: req.params.id,
        },
      });
      throw error;
    }
  };

  /**
   * PUT /api/v1/applications/:id/withdraw
   * Withdraw application
   */
  withdrawApplication = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate application ID
      const validationResult = applicationIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          `Invalid application ID: ${error.issues.map((e) => e.message).join(', ')}`
        );
      }

      const { id: applicationId } = validationResult.data;

      logger.info(`User ${userId} withdrawing application ${applicationId}`);

      const application = await this.service.withdrawApplication(applicationId, userId);

      res.status(200).json({
        success: true,
        data: application,
        message: 'Application withdrawn successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ApplicationController', method: 'withdrawApplication' },
        extra: {
          userId: req.user?.id,
          applicationId: req.params.id,
        },
      });
      throw error;
    }
  };

  /**
   * PUT /api/v1/applications/:id/status
   * Update application status (company side)
   */
  updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate application ID
      const idValidation = applicationIdParamSchema.safeParse(req.params);
      if (!idValidation.success) {
        const error = idValidation.error as ZodError;
        throw new ValidationError(
          `Invalid application ID: ${error.issues.map((e) => e.message).join(', ')}`
        );
      }

      const { id: applicationId } = idValidation.data;

      // Validate request body
      const validationResult = updateApplicationStatusSchema.safeParse(req.body);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          `Invalid status: ${error.issues.map((e) => e.message).join(', ')}`
        );
      }

      const { status }: UpdateApplicationStatusInput = validationResult.data;

      logger.info(`User ${userId} updating application ${applicationId} status to ${status}`);

      const application = await this.service.updateApplicationStatus(
        applicationId,
        status,
        userId
      );

      res.status(200).json({
        success: true,
        data: application,
        message: 'Application status updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ApplicationController', method: 'updateApplicationStatus' },
        extra: {
          userId: req.user?.id,
          applicationId: req.params.id,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/applications/stats
   * Get application statistics
   */
  getApplicationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      logger.info(`User ${userId} fetching application statistics`);

      const stats = await this.service.getUserApplicationStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ApplicationController', method: 'getApplicationStats' },
        extra: {
          userId: req.user?.id,
        },
      });
      throw error;
    }
  };
}

export default ApplicationController;
