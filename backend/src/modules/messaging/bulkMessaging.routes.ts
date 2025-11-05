import { Router } from 'express';
import { BulkMessagingController } from './bulkMessaging.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

const router = Router();
const controller = new BulkMessagingController();

// All bulk messaging routes require authentication
router.use(authMiddleware);

// Rate limiters
const bulkMessageRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bulk message operations per hour
  message: 'Too many bulk message requests. Please try again later.',
});

const templateRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});

const blockingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
});

// ============================================================================
// MESSAGE TEMPLATE ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/companies/messages/templates
 * @desc    Create a message template
 * @access  Private (Company owners only)
 */
router.post('/companies/messages/templates', templateRateLimiter, controller.createTemplate);

/**
 * @route   GET /api/v1/companies/messages/templates
 * @desc    Get message templates
 * @access  Private (Company owners only)
 */
router.get('/companies/messages/templates', templateRateLimiter, controller.getTemplates);

/**
 * @route   GET /api/v1/companies/messages/templates/:id
 * @desc    Get template by ID
 * @access  Private (Company owners only)
 */
router.get('/companies/messages/templates/:id', templateRateLimiter, controller.getTemplateById);

/**
 * @route   PUT /api/v1/companies/messages/templates/:id
 * @desc    Update template
 * @access  Private (Company owners only)
 */
router.put('/companies/messages/templates/:id', templateRateLimiter, controller.updateTemplate);

/**
 * @route   DELETE /api/v1/companies/messages/templates/:id
 * @desc    Delete template
 * @access  Private (Company owners only)
 */
router.delete('/companies/messages/templates/:id', templateRateLimiter, controller.deleteTemplate);

// ============================================================================
// BULK MESSAGE ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/companies/messages/bulk
 * @desc    Send bulk messages to multiple candidates
 * @access  Private (Company owners only)
 * @rateLimit 10 requests per hour
 */
router.post('/companies/messages/bulk', bulkMessageRateLimiter, controller.sendBulkMessage);

/**
 * @route   GET /api/v1/companies/messages/bulk
 * @desc    Get bulk messages sent by company
 * @access  Private (Company owners only)
 */
router.get('/companies/messages/bulk', templateRateLimiter, controller.getBulkMessages);

/**
 * @route   GET /api/v1/companies/messages/bulk/:id
 * @desc    Get bulk message by ID
 * @access  Private (Company owners only)
 */
router.get('/companies/messages/bulk/:id', templateRateLimiter, controller.getBulkMessageById);

/**
 * @route   GET /api/v1/companies/messages/bulk/:id/recipients
 * @desc    Get bulk message recipients and their status
 * @access  Private (Company owners only)
 */
router.get('/companies/messages/bulk/:id/recipients', templateRateLimiter, controller.getBulkMessageRecipients);

// ============================================================================
// COMPANY BLOCKING ROUTES (Candidate perspective)
// ============================================================================

/**
 * @route   POST /api/v1/candidates/blocks/companies/:companyId
 * @desc    Block a company from messaging
 * @access  Private (Candidates only)
 */
router.post('/candidates/blocks/companies/:companyId', blockingRateLimiter, controller.blockCompany);

/**
 * @route   DELETE /api/v1/candidates/blocks/companies/:companyId
 * @desc    Unblock a company
 * @access  Private (Candidates only)
 */
router.delete('/candidates/blocks/companies/:companyId', blockingRateLimiter, controller.unblockCompany);

/**
 * @route   GET /api/v1/candidates/blocks/companies
 * @desc    Get list of blocked companies
 * @access  Private (Candidates only)
 */
router.get('/candidates/blocks/companies', blockingRateLimiter, controller.getBlockedCompanies);

export default router;
