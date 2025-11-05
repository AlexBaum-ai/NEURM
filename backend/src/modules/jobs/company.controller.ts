import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import companyService, { CompanyService } from './company.service';
import { AuthRequest } from '@/middleware/auth.middleware';
import { logger } from '@/utils/logger';

export class CompanyController {
  private service: CompanyService;

  constructor(service: CompanyService) {
    this.service = service;
  }

  /**
   * GET /api/v1/companies/:id
   * Get public company profile by ID or slug
   */
  getCompanyProfile = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const company = await this.service.getCompanyProfile(id, userId);

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'get_company_profile' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * PUT /api/v1/companies/:id
   * Update company profile (company admin only)
   */
  updateCompanyProfile = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData = req.body;

      const updatedCompany = await this.service.updateCompanyProfile(
        id,
        userId,
        updateData
      );

      logger.info('Company profile updated', {
        companyId: id,
        userId,
        fields: Object.keys(updateData),
      });

      res.status(200).json({
        success: true,
        message: 'Company profile updated successfully',
        data: updatedCompany,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'update_company_profile' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * GET /api/v1/companies/:id/jobs
   * Get company's active jobs
   */
  getCompanyJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const includeDetails = req.query.includeDetails === 'true';

      const jobs = await this.service.getCompanyJobs(id, includeDetails);

      res.status(200).json({
        success: true,
        data: {
          jobs,
          count: jobs.length,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'get_company_jobs' },
      });
      next(error);
    }
  };

  /**
   * POST /api/v1/companies/:id/follow
   * Follow company
   */
  followCompany = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await this.service.followCompany(id, userId);

      logger.info('User followed company', {
        companyId: id,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Successfully followed company',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'follow_company' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * DELETE /api/v1/companies/:id/follow
   * Unfollow company
   */
  unfollowCompany = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await this.service.unfollowCompany(id, userId);

      logger.info('User unfollowed company', {
        companyId: id,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Successfully unfollowed company',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'unfollow_company' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * POST /api/v1/companies
   * Create company profile (company account owners)
   */
  createCompany = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const companyData = req.body;

      const company = await this.service.createCompany(userId, companyData);

      logger.info('Company created', {
        companyId: company.id,
        userId,
      });

      res.status(201).json({
        success: true,
        message: 'Company profile created successfully',
        data: company,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'create_company' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * GET /api/v1/companies
   * List companies with pagination and filters
   */
  listCompanies = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { page, limit, search, industry, companySize, verified } =
        req.query;

      const result = await this.service.listCompanies({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        industry: industry as string,
        companySize: companySize as string,
        verified:
          verified === 'true'
            ? true
            : verified === 'false'
              ? false
              : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.companies,
        pagination: {
          page: result.page,
          limit: limit ? parseInt(limit as string, 10) : 20,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'list_companies' },
      });
      next(error);
    }
  };
}

export default new CompanyController(companyService);
