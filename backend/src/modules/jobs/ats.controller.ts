import { Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import atsService, { ATSService } from './services/atsService';
import { AuthRequest } from '@/middleware/auth.middleware';
import { logger } from '@/utils/logger';
import { ApplicationStatus } from '@prisma/client';

/**
 * ATSController - Applicant Tracking System Controller
 * Handles company-side application management
 */
export class ATSController {
  private service: ATSService;

  constructor(service: ATSService) {
    this.service = service;
  }

  /**
   * GET /api/v1/companies/applications
   * Get all applications for company's jobs with filtering
   */
  getCompanyApplications = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const {
        jobId,
        status,
        dateFrom,
        dateTo,
        minMatchScore,
        maxMatchScore,
        minRating,
        maxRating,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query as any;

      const filters = {
        jobId,
        status: status as ApplicationStatus,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        minMatchScore: minMatchScore ? parseFloat(minMatchScore) : undefined,
        maxMatchScore: maxMatchScore ? parseFloat(maxMatchScore) : undefined,
        minRating: minRating ? parseInt(minRating, 10) : undefined,
        maxRating: maxRating ? parseInt(maxRating, 10) : undefined,
        sortBy: sortBy as 'date_applied' | 'match_score' | 'rating',
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      };

      const result = await this.service.getCompanyApplications(userId, filters);

      res.status(200).json({
        success: true,
        data: result.applications,
        pagination: result.pagination,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'get_company_applications' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * GET /api/v1/companies/applications/:id
   * Get application detail with full candidate profile
   */
  getApplicationDetail = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const application = await this.service.getApplicationDetail(id, userId);

      res.status(200).json({
        success: true,
        data: application,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'get_application_detail' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * PUT /api/v1/companies/applications/:id/status
   * Update application status
   */
  updateApplicationStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = req.user!.userId;

      const updatedApplication = await this.service.updateApplicationStatus(
        id,
        status,
        userId,
        notes
      );

      logger.info('Application status updated', {
        applicationId: id,
        newStatus: status,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Application status updated successfully',
        data: updatedApplication,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'update_application_status' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * POST /api/v1/companies/applications/:id/notes
   * Add note to application
   */
  addNote = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { note, isInternal } = req.body;
      const userId = req.user!.userId;

      const applicationNote = await this.service.addNote(
        id,
        userId,
        note,
        isInternal
      );

      logger.info('Note added to application', {
        applicationId: id,
        userId,
      });

      res.status(201).json({
        success: true,
        message: 'Note added successfully',
        data: applicationNote,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'add_application_note' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * PUT /api/v1/companies/applications/:id/rating
   * Rate application (1-5 stars)
   */
  rateApplication = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = req.user!.userId;

      const applicationRating = await this.service.rateApplication(
        id,
        userId,
        rating
      );

      logger.info('Application rated', {
        applicationId: id,
        rating,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Application rated successfully',
        data: applicationRating,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'rate_application' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * POST /api/v1/companies/applications/:id/share
   * Share application with team member
   */
  shareApplication = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { sharedWith, message } = req.body;
      const userId = req.user!.userId;

      const share = await this.service.shareApplication(
        id,
        userId,
        sharedWith,
        message
      );

      logger.info('Application shared', {
        applicationId: id,
        sharedWith,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Application shared successfully',
        data: share,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'share_application' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * GET /api/v1/companies/applications/:id/activity
   * Get application activity log
   */
  getApplicationActivity = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const activity = await this.service.getApplicationActivity(id, userId);

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'get_application_activity' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * POST /api/v1/companies/applications/bulk/status
   * Bulk update application status
   */
  bulkUpdateStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { applicationIds, status } = req.body;
      const userId = req.user!.userId;

      const result = await this.service.bulkUpdateStatus(
        applicationIds,
        status,
        userId
      );

      logger.info('Bulk application status update', {
        count: result.updated,
        newStatus: status,
        userId,
      });

      res.status(200).json({
        success: true,
        message: `${result.updated} application(s) updated successfully`,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'bulk_update_status' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * POST /api/v1/companies/applications/bulk/archive
   * Bulk archive applications
   */
  bulkArchive = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { applicationIds } = req.body;
      const userId = req.user!.userId;

      const result = await this.service.bulkArchive(applicationIds, userId);

      logger.info('Bulk application archive', {
        count: result.updated,
        userId,
      });

      res.status(200).json({
        success: true,
        message: `${result.updated} application(s) archived successfully`,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'bulk_archive' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };
}

export default new ATSController(atsService);
