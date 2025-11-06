import { Router } from 'express';
import { GDPRController } from './gdpr.controller';
import { authMiddleware, requireRole } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validation.middleware';
import { UserRole } from '@prisma/client';
import {
  updateConsentSchema,
  getConsentSchema,
  requestDataExportSchema,
  requestDataDeletionSchema,
  emailUnsubscribeSchema,
  getUnsubscribeByTokenSchema,
  getLegalDocumentSchema,
  createLegalDocumentSchema,
  updateRetentionPolicySchema,
  processDataDeletionSchema,
  updateDPOContactSchema,
  dpoContactRequestSchema,
} from './gdpr.validation';

const router = Router();
const gdprController = new GDPRController();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * GET /api/v1/gdpr/legal/:type
 * Get legal document (privacy policy, terms of service, etc.)
 * Public endpoint - anyone can view legal documents
 */
router.get(
  '/legal/:type',
  validateRequest(getLegalDocumentSchema),
  gdprController.getLegalDocument
);

/**
 * GET /api/v1/gdpr/legal/:type/versions
 * Get all versions of a legal document
 * Public endpoint
 */
router.get(
  '/legal/:type/versions',
  gdprController.getLegalDocumentVersions
);

/**
 * GET /api/v1/gdpr/unsubscribe
 * Get unsubscribe information by token
 * Public endpoint - accessible via email link
 */
router.get(
  '/unsubscribe',
  validateRequest(getUnsubscribeByTokenSchema),
  gdprController.getUnsubscribeInfo
);

/**
 * POST /api/v1/gdpr/unsubscribe
 * Process email unsubscribe request
 * Public endpoint - accessible via email link
 */
router.post(
  '/unsubscribe',
  validateRequest(emailUnsubscribeSchema),
  gdprController.processUnsubscribe
);

/**
 * GET /api/v1/gdpr/dpo
 * Get DPO contact information
 * Public endpoint
 */
router.get(
  '/dpo',
  gdprController.getDPOContact
);

/**
 * POST /api/v1/gdpr/dpo/contact
 * Send message to DPO
 * Public endpoint - anyone can contact DPO
 */
router.post(
  '/dpo/contact',
  validateRequest(dpoContactRequestSchema),
  gdprController.contactDPO
);

// ============================================================================
// AUTHENTICATED USER ROUTES
// ============================================================================

/**
 * GET /api/v1/gdpr/consents
 * Get user's current consent preferences
 */
router.get(
  '/consents',
  authMiddleware,
  validateRequest(getConsentSchema),
  gdprController.getConsents
);

/**
 * PUT /api/v1/gdpr/consents
 * Update user's consent preferences
 */
router.put(
  '/consents',
  authMiddleware,
  validateRequest(updateConsentSchema),
  gdprController.updateConsents
);

/**
 * GET /api/v1/gdpr/consents/history
 * Get consent change history
 */
router.get(
  '/consents/history',
  authMiddleware,
  gdprController.getConsentHistory
);

/**
 * POST /api/v1/gdpr/data-export
 * Request user data export (GDPR right to data portability)
 */
router.post(
  '/data-export',
  authMiddleware,
  validateRequest(requestDataExportSchema),
  gdprController.requestDataExport
);

/**
 * POST /api/v1/gdpr/data-deletion
 * Request account/data deletion (GDPR right to be forgotten)
 */
router.post(
  '/data-deletion',
  authMiddleware,
  validateRequest(requestDataDeletionSchema),
  gdprController.requestDataDeletion
);

/**
 * GET /api/v1/gdpr/data-deletion
 * Get user's deletion requests
 */
router.get(
  '/data-deletion',
  authMiddleware,
  gdprController.getDeletionRequests
);

/**
 * GET /api/v1/gdpr/retention-policies
 * Get data retention policies
 * Authenticated users can view how long their data is retained
 */
router.get(
  '/retention-policies',
  authMiddleware,
  gdprController.getRetentionPolicies
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * POST /api/v1/gdpr/admin/legal
 * Create/publish legal document
 * Admin only
 */
router.post(
  '/admin/legal',
  authMiddleware,
  requireRole([UserRole.admin]),
  validateRequest(createLegalDocumentSchema),
  gdprController.createLegalDocument
);

/**
 * PUT /api/v1/gdpr/admin/retention-policies
 * Update data retention policy
 * Admin only
 */
router.put(
  '/admin/retention-policies',
  authMiddleware,
  requireRole([UserRole.admin]),
  validateRequest(updateRetentionPolicySchema),
  gdprController.updateRetentionPolicy
);

/**
 * PATCH /api/v1/gdpr/admin/data-deletion/:requestId
 * Process data deletion request
 * Admin only
 */
router.patch(
  '/admin/data-deletion/:requestId',
  authMiddleware,
  requireRole([UserRole.admin]),
  validateRequest(processDataDeletionSchema),
  gdprController.processDataDeletion
);

/**
 * PUT /api/v1/gdpr/admin/dpo
 * Update DPO contact information
 * Admin only
 */
router.put(
  '/admin/dpo',
  authMiddleware,
  requireRole([UserRole.admin]),
  validateRequest(updateDPOContactSchema),
  gdprController.updateDPOContact
);

export default router;
