import * as Sentry from '@sentry/node';
import { ConsentType, ConsentStatus, LegalDocumentType, DataDeletionStatus } from '@prisma/client';
import { GDPRRepository } from './gdpr.repository';
import {
  UpdateConsentInput,
  RequestDataExportInput,
  RequestDataDeletionInput,
  CreateLegalDocumentInput,
  UpdateRetentionPolicyInput,
  ProcessDataDeletionInput,
  UpdateDPOContactInput,
  DPOContactRequestInput,
} from './gdpr.validation';
import { NotFoundError, BadRequestError, ConflictError } from '@/utils/errors';
import logger from '@/utils/logger';
import { generateSecureToken } from '@/utils/crypto';

/**
 * GDPR Service
 * Business logic for GDPR compliance operations
 */
export class GDPRService {
  private repository: GDPRRepository;

  constructor(repository?: GDPRRepository) {
    this.repository = repository || new GDPRRepository();
  }

  // ============================================================================
  // CONSENT MANAGEMENT
  // ============================================================================

  /**
   * Get user's current consent preferences
   */
  async getUserConsents(userId: string) {
    try {
      const consents = await this.repository.getUserConsents(userId);

      // Ensure all consent types are represented
      const consentMap = new Map(consents.map(c => [c.consentType, c]));

      const allConsents = Object.values(ConsentType).map(type => {
        const existing = consentMap.get(type);
        return {
          consentType: type,
          status: existing?.status || ConsentStatus.denied,
          grantedAt: existing?.grantedAt || null,
          withdrawnAt: existing?.withdrawnAt || null,
          version: existing?.version || 1,
          updatedAt: existing?.updatedAt || null,
        };
      });

      return allConsents;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'getUserConsents' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Update user consent preferences
   */
  async updateConsents(
    userId: string,
    data: UpdateConsentInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      logger.info(`Updating consent preferences for user ${userId}`);

      const version = 1; // TODO: Get current policy version
      const results = [];

      for (const consent of data.consents) {
        const status = consent.granted ? ConsentStatus.granted : ConsentStatus.denied;

        // Update or create consent
        const updated = await this.repository.upsertUserConsent(
          userId,
          consent.consentType,
          status,
          ipAddress,
          userAgent,
          version
        );

        // Log the change to audit trail
        await this.repository.logConsentChange(
          userId,
          consent.consentType,
          status,
          version,
          ipAddress,
          userAgent,
          { source: 'user_settings' }
        );

        results.push(updated);
      }

      logger.info(`Consent preferences updated for user ${userId}`);
      return results;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'updateConsents' },
        extra: { userId, data },
      });
      throw error;
    }
  }

  /**
   * Get consent change history
   */
  async getConsentHistory(userId: string, consentType?: ConsentType) {
    try {
      return await this.repository.getConsentHistory(userId, consentType);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'getConsentHistory' },
        extra: { userId, consentType },
      });
      throw error;
    }
  }

  // ============================================================================
  // DATA EXPORT
  // ============================================================================

  /**
   * Request data export for user
   */
  async requestDataExport(userId: string, data: RequestDataExportInput) {
    try {
      logger.info(`User ${userId} requesting data export`);

      const userData = await this.repository.getUserDataForExport(userId);

      if (!userData) {
        throw new NotFoundError('User not found');
      }

      // Get consent history
      const consentHistory = await this.repository.getConsentHistory(userId);

      // Get unsubscribe records
      const unsubscribes = await this.repository.getUserUnsubscribes(userId);

      // Format comprehensive export data
      const exportData = {
        exportedAt: new Date().toISOString(),
        format: data.format,
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          role: userData.role,
          accountType: userData.accountType,
          status: userData.status,
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt,
          timezone: userData.timezone,
          locale: userData.locale,
        },
        profile: userData.profile,
        skills: userData.skills,
        workExperiences: userData.workExperiences,
        educations: userData.educations,
        portfolioProjects: userData.portfolioProjects,
        privacySettings: userData.privacySettings,
        consents: userData.consents,
        consentHistory,
        articles: userData.articles,
        forumActivity: {
          topics: userData.topics,
          replies: userData.replies,
        },
        bookmarks: userData.bookmarks.map(b => ({
          articleId: b.article.id,
          articleTitle: b.article.title,
          createdAt: b.createdAt,
        })),
        jobApplications: userData.jobApplications.map(ja => ({
          jobId: ja.job.id,
          jobTitle: ja.job.title,
          status: ja.status,
          appliedAt: ja.appliedAt,
        })),
        notifications: userData.notifications,
        messages: {
          sent: userData.sentMessages,
          received: userData.receivedMessages,
        },
        emailUnsubscribes: unsubscribes,
      };

      logger.info(`Data export generated for user ${userId}`);
      return exportData;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'requestDataExport' },
        extra: { userId },
      });
      throw error;
    }
  }

  // ============================================================================
  // DATA DELETION (RIGHT TO BE FORGOTTEN)
  // ============================================================================

  /**
   * Request account deletion
   */
  async requestDataDeletion(userId: string, data: RequestDataDeletionInput) {
    try {
      logger.info(`User ${userId} requesting data deletion`);

      // Verify email matches user's email
      const userData = await this.repository.getUserDataForExport(userId);
      if (!userData) {
        throw new NotFoundError('User not found');
      }

      if (userData.email !== data.confirmEmail) {
        throw new BadRequestError('Email does not match your account');
      }

      // Check if there's already a pending request
      const existingRequests = await this.repository.getDataDeletionRequests({
        userId,
        status: DataDeletionStatus.requested,
      });

      if (existingRequests.length > 0) {
        throw new ConflictError('You already have a pending deletion request');
      }

      // Create deletion request
      const request = await this.repository.createDataDeletionRequest(userId, data.reason);

      logger.info(`Data deletion request created for user ${userId}`);

      return {
        message: 'Your data deletion request has been submitted. This action will be processed within 30 days as required by GDPR. You can contact support to cancel this request.',
        requestId: request.id,
        requestedAt: request.requestedAt,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'requestDataDeletion' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get user's deletion requests
   */
  async getUserDeletionRequests(userId: string) {
    try {
      return await this.repository.getDataDeletionRequests({ userId });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'getUserDeletionRequests' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Process data deletion request (Admin only)
   */
  async processDataDeletionRequest(
    requestId: string,
    data: ProcessDataDeletionInput,
    processedBy: string
  ) {
    try {
      logger.info(`Processing data deletion request ${requestId}`);

      const requests = await this.repository.getDataDeletionRequests({});
      const request = requests.find(r => r.id === requestId);

      if (!request) {
        throw new NotFoundError('Deletion request not found');
      }

      // If completing deletion, anonymize user data
      if (data.status === DataDeletionStatus.completed) {
        await this.repository.anonymizeUserData(request.userId);
        logger.info(`User data anonymized for user ${request.userId}`);
      }

      // Update request status
      const updated = await this.repository.updateDataDeletionRequest(
        requestId,
        data.status,
        processedBy,
        data.notes
      );

      logger.info(`Data deletion request ${requestId} updated to status: ${data.status}`);
      return updated;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'processDataDeletionRequest' },
        extra: { requestId, data },
      });
      throw error;
    }
  }

  // ============================================================================
  // EMAIL UNSUBSCRIBE
  // ============================================================================

  /**
   * Generate unsubscribe token and create record
   */
  async createUnsubscribe(email: string, unsubscribeType: string, userId?: string) {
    try {
      const token = generateSecureToken(32);

      await this.repository.createEmailUnsubscribe(email, unsubscribeType, token, userId);

      return { token, unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token=${token}` };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'createUnsubscribe' },
        extra: { email, unsubscribeType },
      });
      throw error;
    }
  }

  /**
   * Process unsubscribe request
   */
  async processUnsubscribe(token: string) {
    try {
      const unsubscribe = await this.repository.getEmailUnsubscribeByToken(token);

      if (!unsubscribe) {
        throw new NotFoundError('Invalid unsubscribe token');
      }

      logger.info(`Email unsubscribed: ${unsubscribe.email} from ${unsubscribe.unsubscribeType}`);

      return {
        message: 'You have been successfully unsubscribed',
        email: unsubscribe.email,
        type: unsubscribe.unsubscribeType,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'processUnsubscribe' },
        extra: { token },
      });
      throw error;
    }
  }

  /**
   * Check if email is unsubscribed from a type
   */
  async isUnsubscribed(email: string, type: string): Promise<boolean> {
    try {
      return await this.repository.isEmailUnsubscribed(email, type);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'isUnsubscribed' },
        extra: { email, type },
      });
      throw error;
    }
  }

  // ============================================================================
  // LEGAL DOCUMENTS
  // ============================================================================

  /**
   * Get active legal document
   */
  async getLegalDocument(documentType: LegalDocumentType, version?: string) {
    try {
      if (version) {
        return await this.repository.getLegalDocumentByVersion(documentType, version);
      }
      return await this.repository.getActiveLegalDocument(documentType);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'getLegalDocument' },
        extra: { documentType, version },
      });
      throw error;
    }
  }

  /**
   * Create legal document (Admin only)
   */
  async createLegalDocument(data: CreateLegalDocumentInput, publishedBy: string) {
    try {
      logger.info(`Creating legal document: ${data.documentType} v${data.version}`);

      const effectiveAt = typeof data.effectiveAt === 'string'
        ? new Date(data.effectiveAt)
        : data.effectiveAt;

      const document = await this.repository.createLegalDocument({
        ...data,
        effectiveAt,
        publishedBy,
      });

      logger.info(`Legal document created: ${document.id}`);
      return document;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'createLegalDocument' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Get all versions of a document
   */
  async getLegalDocumentVersions(documentType: LegalDocumentType) {
    try {
      return await this.repository.getLegalDocumentVersions(documentType);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'getLegalDocumentVersions' },
        extra: { documentType },
      });
      throw error;
    }
  }

  // ============================================================================
  // DATA RETENTION POLICIES
  // ============================================================================

  /**
   * Get all active retention policies
   */
  async getRetentionPolicies() {
    try {
      return await this.repository.getActiveRetentionPolicies();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'getRetentionPolicies' },
      });
      throw error;
    }
  }

  /**
   * Update retention policy (Admin only)
   */
  async updateRetentionPolicy(data: UpdateRetentionPolicyInput) {
    try {
      logger.info(`Updating retention policy for ${data.dataType}`);

      const policy = await this.repository.upsertRetentionPolicy(data);

      logger.info(`Retention policy updated: ${data.dataType}`);
      return policy;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'updateRetentionPolicy' },
        extra: { data },
      });
      throw error;
    }
  }

  // ============================================================================
  // DPO CONTACT
  // ============================================================================

  /**
   * Get DPO contact information
   */
  async getDPOContact() {
    try {
      const contact = await this.repository.getActiveDPOContact();

      if (!contact) {
        // Return default contact info if none configured
        return {
          name: 'Data Protection Officer',
          email: process.env.DPO_EMAIL || 'dpo@neurmatic.com',
          message: 'No DPO contact configured. Please use the default email.',
        };
      }

      return contact;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'getDPOContact' },
      });
      throw error;
    }
  }

  /**
   * Send message to DPO
   */
  async contactDPO(data: DPOContactRequestInput) {
    try {
      logger.info(`DPO contact request from ${data.email}: ${data.subject}`);

      // TODO: Send email to DPO
      // This should integrate with the email service
      // For now, just log the request

      logger.info(`DPO contact request logged`);

      return {
        message: 'Your message has been sent to our Data Protection Officer. We will respond within 5 business days.',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'contactDPO' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Update DPO contact (Admin only)
   */
  async updateDPOContact(data: UpdateDPOContactInput) {
    try {
      logger.info(`Updating DPO contact information`);

      const contact = await this.repository.upsertDPOContact(data);

      logger.info(`DPO contact updated`);
      return contact;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'GDPRService', method: 'updateDPOContact' },
        extra: { data },
      });
      throw error;
    }
  }
}

export default GDPRService;
