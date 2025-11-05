import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ZodError } from 'zod';
import { BaseController } from '../../../utils/baseController';
import { ReportService } from '../services/reportService';
import {
  createReportSchema,
  listReportsQuerySchema,
  resolveReportSchema,
  reportIdParamSchema,
} from '../validators/reportValidators';

/**
 * ReportController
 *
 * Handles HTTP requests for content reporting:
 * - Create reports (authenticated users)
 * - List reports (moderators only)
 * - Get report details (moderators only)
 * - Resolve reports (moderators only)
 * - Get report statistics (moderators only)
 */
@injectable()
export class ReportController extends BaseController {
  constructor(
    @inject('ReportService')
    private reportService: ReportService
  ) {
    super();
  }

  /**
   * POST /api/forum/reports
   * Create a new report
   */
  public createReport = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = createReportSchema.parse(req.body);
      const userId = req.user!.id;
      const user = req.user!;

      const report = await this.reportService.createReport(userId, user, data);

      return this.created(res, { report }, 'Report submitted successfully. Moderators will review it shortly.');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('already reported')) {
          return this.conflict(res, error.message);
        }
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('cannot report your own')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/reports
   * List all reports (moderation queue)
   * Moderators only
   */
  public listReports = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = listReportsQuerySchema.parse(req.query);
      const user = req.user!;

      const filters = {
        status: query.status,
        reason: query.reason,
        reportableType: query.reportableType,
      };

      const pagination = {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      const result = await this.reportService.listReports(filters, pagination, user);

      return this.success(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error && error.message.includes('permission')) {
        return this.forbidden(res, error.message);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/reports/:id
   * Get single report by ID with full details
   * Moderators only
   */
  public getReportById = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = reportIdParamSchema.parse(req.params);
      const user = req.user!;

      const result = await this.reportService.getReportById(id, user);

      return this.success(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
        if (error.message === 'Report not found') {
          return this.notFound(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * PUT /api/forum/reports/:id/resolve
   * Resolve a report
   * Moderators only
   */
  public resolveReport = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = reportIdParamSchema.parse(req.params);
      const data = resolveReportSchema.parse(req.body);
      const user = req.user!;

      const report = await this.reportService.resolveReport(id, data, user);

      return this.success(res, { report }, 'Report resolved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
        if (error.message === 'Report not found') {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('already been resolved')) {
          return this.conflict(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/reports/statistics
   * Get report statistics
   * Moderators only
   */
  public getStatistics = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      const statistics = await this.reportService.getStatistics(user);

      return this.success(res, { statistics });
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        return this.forbidden(res, error.message);
      }
      return this.handleError(res, error);
    }
  });
}
