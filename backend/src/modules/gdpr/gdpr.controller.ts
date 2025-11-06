import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { GDPRService } from './gdpr.service';
import { BaseController } from '@/utils/baseController';
import { ConsentType, LegalDocumentType } from '@prisma/client';
import {
  UpdateConsentInput,
  RequestDataExportInput,
  RequestDataDeletionInput,
  CreateLegalDocumentInput,
  UpdateRetentionPolicyInput,
  ProcessDataDeletionParams,
  ProcessDataDeletionInput,
  UpdateDPOContactInput,
  DPOContactRequestInput,
  GetLegalDocumentParams,
  GetLegalDocumentQuery,
} from './gdpr.validation';

/**
 * GDPR Controller
 * Handles GDPR compliance endpoints
 */
export class GDPRController extends BaseController {
  private gdprService: GDPRService;

  constructor(gdprService?: GDPRService) {
    super();
    this.gdprService = gdprService || new GDPRService();
  }

  // ============================================================================
  // CONSENT MANAGEMENT
  // ============================================================================

  /**
   * GET /api/v1/gdpr/consents
   * Get user's current consent preferences
   */
  getConsents = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const consents = await this.gdprService.getUserConsents(userId);

    this.sendSuccess(res, { consents }, 'Consent preferences retrieved');
  });

  /**
   * PUT /api/v1/gdpr/consents
   * Update user's consent preferences
   */
  updateConsents = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data: UpdateConsentInput = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    const consents = await this.gdprService.updateConsents(userId, data, ipAddress, userAgent);

    this.sendSuccess(res, { consents }, 'Consent preferences updated successfully');
  });

  /**
   * GET /api/v1/gdpr/consents/history
   * Get consent change history
   */
  getConsentHistory = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const consentType = req.query.type as ConsentType | undefined;

    const history = await this.gdprService.getConsentHistory(userId, consentType);

    this.sendSuccess(res, { history }, 'Consent history retrieved');
  });

  // ============================================================================
  // DATA EXPORT
  // ============================================================================

  /**
   * POST /api/v1/gdpr/data-export
   * Request user data export
   */
  requestDataExport = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data: RequestDataExportInput = req.body;

    const exportData = await this.gdprService.requestDataExport(userId, data);

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}-${Date.now()}.json"`);

    res.json(exportData);
  });

  // ============================================================================
  // DATA DELETION
  // ============================================================================

  /**
   * POST /api/v1/gdpr/data-deletion
   * Request account/data deletion
   */
  requestDataDeletion = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data: RequestDataDeletionInput = req.body;

    const result = await this.gdprService.requestDataDeletion(userId, data);

    this.sendSuccess(res, result, 'Data deletion request submitted');
  });

  /**
   * GET /api/v1/gdpr/data-deletion
   * Get user's deletion requests
   */
  getDeletionRequests = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const requests = await this.gdprService.getUserDeletionRequests(userId);

    this.sendSuccess(res, { requests }, 'Deletion requests retrieved');
  });

  /**
   * PATCH /api/v1/gdpr/admin/data-deletion/:requestId
   * Process data deletion request (Admin only)
   */
  processDataDeletion = this.asyncHandler(async (req: Request, res: Response) => {
    const { requestId }: ProcessDataDeletionParams = req.params as any;
    const data: ProcessDataDeletionInput = req.body;
    const processedBy = req.user!.id;

    const result = await this.gdprService.processDataDeletionRequest(requestId, data, processedBy);

    this.sendSuccess(res, { request: result }, 'Deletion request processed');
  });

  // ============================================================================
  // EMAIL UNSUBSCRIBE
  // ============================================================================

  /**
   * GET /api/v1/gdpr/unsubscribe
   * Get unsubscribe information by token
   */
  getUnsubscribeInfo = this.asyncHandler(async (req: Request, res: Response) => {
    const token = req.query.token as string;

    if (!token) {
      return this.sendError(res, 'Token is required', 400);
    }

    const info = await this.gdprService.processUnsubscribe(token);

    this.sendSuccess(res, info, 'Unsubscribe information retrieved');
  });

  /**
   * POST /api/v1/gdpr/unsubscribe
   * Process unsubscribe request
   */
  processUnsubscribe = this.asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    const result = await this.gdprService.processUnsubscribe(token);

    this.sendSuccess(res, result, 'Successfully unsubscribed');
  });

  // ============================================================================
  // LEGAL DOCUMENTS
  // ============================================================================

  /**
   * GET /api/v1/gdpr/legal/:type
   * Get legal document (privacy policy, terms of service, etc.)
   */
  getLegalDocument = this.asyncHandler(async (req: Request, res: Response) => {
    const { type }: GetLegalDocumentParams = req.params as any;
    const { version }: GetLegalDocumentQuery = req.query;

    const document = await this.gdprService.getLegalDocument(type, version);

    if (!document) {
      return this.sendError(res, 'Document not found', 404);
    }

    this.sendSuccess(res, { document }, 'Legal document retrieved');
  });

  /**
   * GET /api/v1/gdpr/legal/:type/versions
   * Get all versions of a legal document
   */
  getLegalDocumentVersions = this.asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;

    const versions = await this.gdprService.getLegalDocumentVersions(type as LegalDocumentType);

    this.sendSuccess(res, { versions }, 'Document versions retrieved');
  });

  /**
   * POST /api/v1/gdpr/admin/legal
   * Create legal document (Admin only)
   */
  createLegalDocument = this.asyncHandler(async (req: Request, res: Response) => {
    const data: CreateLegalDocumentInput = req.body;
    const publishedBy = req.user!.id;

    const document = await this.gdprService.createLegalDocument(data, publishedBy);

    this.sendSuccess(res, { document }, 'Legal document created successfully', 201);
  });

  // ============================================================================
  // DATA RETENTION POLICIES
  // ============================================================================

  /**
   * GET /api/v1/gdpr/retention-policies
   * Get data retention policies
   */
  getRetentionPolicies = this.asyncHandler(async (req: Request, res: Response) => {
    const policies = await this.gdprService.getRetentionPolicies();

    this.sendSuccess(res, { policies }, 'Retention policies retrieved');
  });

  /**
   * PUT /api/v1/gdpr/admin/retention-policies
   * Update retention policy (Admin only)
   */
  updateRetentionPolicy = this.asyncHandler(async (req: Request, res: Response) => {
    const data: UpdateRetentionPolicyInput = req.body;

    const policy = await this.gdprService.updateRetentionPolicy(data);

    this.sendSuccess(res, { policy }, 'Retention policy updated successfully');
  });

  // ============================================================================
  // DPO CONTACT
  // ============================================================================

  /**
   * GET /api/v1/gdpr/dpo
   * Get DPO contact information
   */
  getDPOContact = this.asyncHandler(async (req: Request, res: Response) => {
    const contact = await this.gdprService.getDPOContact();

    this.sendSuccess(res, { contact }, 'DPO contact information retrieved');
  });

  /**
   * POST /api/v1/gdpr/dpo/contact
   * Send message to DPO
   */
  contactDPO = this.asyncHandler(async (req: Request, res: Response) => {
    const data: DPOContactRequestInput = req.body;

    const result = await this.gdprService.contactDPO(data);

    this.sendSuccess(res, result, 'Message sent to DPO successfully');
  });

  /**
   * PUT /api/v1/gdpr/admin/dpo
   * Update DPO contact (Admin only)
   */
  updateDPOContact = this.asyncHandler(async (req: Request, res: Response) => {
    const data: UpdateDPOContactInput = req.body;

    const contact = await this.gdprService.updateDPOContact(data);

    this.sendSuccess(res, { contact }, 'DPO contact updated successfully');
  });
}

export default GDPRController;
