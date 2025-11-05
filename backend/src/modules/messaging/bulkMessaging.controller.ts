import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { BulkMessagingService } from './bulkMessaging.service';
import {
  createMessageTemplateSchema,
  updateMessageTemplateSchema,
  getTemplatesQuerySchema,
  sendBulkMessageSchema,
  getBulkMessagesQuerySchema,
  getBulkMessageRecipientsQuerySchema,
  blockCompanySchema,
  getBlockedCompaniesQuerySchema,
  uuidParamSchema,
} from './bulkMessaging.validation';
import { BadRequestError, ForbiddenError } from '@/utils/errors';
import logger from '@/utils/logger';
import { BaseController } from '@/utils/baseController';

/**
 * BulkMessagingController
 * Handles HTTP requests for bulk messaging endpoints
 */
export class BulkMessagingController extends BaseController {
  private service: BulkMessagingService;

  constructor(service?: BulkMessagingService) {
    super();
    this.service = service || new BulkMessagingService();
  }

  // ============================================================================
  // MESSAGE TEMPLATES
  // ============================================================================

  /**
   * POST /api/v1/companies/messages/templates
   * Create a message template
   */
  createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      // Get company for this user
      const companyId = await this.getCompanyId(userId);

      const validatedData = createMessageTemplateSchema.parse(req.body);
      const result = await this.service.createTemplate(companyId, validatedData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error creating template');
    }
  };

  /**
   * GET /api/v1/companies/messages/templates
   * Get message templates
   */
  getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const companyId = await this.getCompanyId(userId);

      const validatedQuery = getTemplatesQuerySchema.parse(req.query);
      const result = await this.service.getTemplates(companyId, validatedQuery);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching templates');
    }
  };

  /**
   * GET /api/v1/companies/messages/templates/:id
   * Get template by ID
   */
  getTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const companyId = await this.getCompanyId(userId);
      const { id: templateId } = uuidParamSchema.parse(req.params);

      const result = await this.service.getTemplateById(templateId, companyId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching template');
    }
  };

  /**
   * PUT /api/v1/companies/messages/templates/:id
   * Update template
   */
  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const companyId = await this.getCompanyId(userId);
      const { id: templateId } = uuidParamSchema.parse(req.params);
      const validatedData = updateMessageTemplateSchema.parse(req.body);

      const result = await this.service.updateTemplate(templateId, companyId, validatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error updating template');
    }
  };

  /**
   * DELETE /api/v1/companies/messages/templates/:id
   * Delete template
   */
  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const companyId = await this.getCompanyId(userId);
      const { id: templateId } = uuidParamSchema.parse(req.params);

      const result = await this.service.deleteTemplate(templateId, companyId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error deleting template');
    }
  };

  // ============================================================================
  // BULK MESSAGES
  // ============================================================================

  /**
   * POST /api/v1/companies/messages/bulk
   * Send bulk messages
   */
  sendBulkMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const companyId = await this.getCompanyId(userId);
      const validatedData = sendBulkMessageSchema.parse(req.body);

      const result = await this.service.sendBulkMessage(companyId, validatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error sending bulk message');
    }
  };

  /**
   * GET /api/v1/companies/messages/bulk
   * Get bulk messages
   */
  getBulkMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const companyId = await this.getCompanyId(userId);
      const validatedQuery = getBulkMessagesQuerySchema.parse(req.query);

      const result = await this.service.getBulkMessages(companyId, validatedQuery);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching bulk messages');
    }
  };

  /**
   * GET /api/v1/companies/messages/bulk/:id
   * Get bulk message by ID
   */
  getBulkMessageById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const companyId = await this.getCompanyId(userId);
      const { id: bulkMessageId } = uuidParamSchema.parse(req.params);

      const result = await this.service.getBulkMessageById(bulkMessageId, companyId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching bulk message');
    }
  };

  /**
   * GET /api/v1/companies/messages/bulk/:id/recipients
   * Get bulk message recipients
   */
  getBulkMessageRecipients = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const companyId = await this.getCompanyId(userId);
      const { id: bulkMessageId } = uuidParamSchema.parse(req.params);
      const validatedQuery = getBulkMessageRecipientsQuerySchema.parse(req.query);

      const result = await this.service.getBulkMessageRecipients(bulkMessageId, companyId, validatedQuery);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching bulk message recipients');
    }
  };

  // ============================================================================
  // COMPANY BLOCKING
  // ============================================================================

  /**
   * POST /api/v1/candidates/blocks/companies/:companyId
   * Block a company
   */
  blockCompany = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { companyId } = req.params;
      const validatedData = blockCompanySchema.parse(req.body);

      const result = await this.service.blockCompany(userId, companyId, validatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error blocking company');
    }
  };

  /**
   * DELETE /api/v1/candidates/blocks/companies/:companyId
   * Unblock a company
   */
  unblockCompany = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { companyId } = req.params;

      const result = await this.service.unblockCompany(userId, companyId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error unblocking company');
    }
  };

  /**
   * GET /api/v1/candidates/blocks/companies
   * Get blocked companies
   */
  getBlockedCompanies = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const validatedQuery = getBlockedCompaniesQuerySchema.parse(req.query);

      const result = await this.service.getBlockedCompanies(userId, validatedQuery);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching blocked companies');
    }
  };

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get company ID for authenticated user
   */
  private async getCompanyId(userId: string): Promise<string> {
    // This should use the company repository to get the company for the user
    // For now, we'll use a simple Prisma query
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const company = await prisma.company.findUnique({
      where: { ownerUserId: userId },
      select: { id: true },
    });

    if (!company) {
      throw new ForbiddenError('User is not associated with a company');
    }

    return company.id;
  }
}
