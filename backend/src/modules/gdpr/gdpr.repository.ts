import { PrismaClient, ConsentType, ConsentStatus, LegalDocumentType, DataDeletionStatus, Prisma } from '@prisma/client';
import prisma from '@/config/database';

/**
 * GDPR Repository
 * Data access layer for GDPR compliance operations
 */
export class GDPRRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  // ============================================================================
  // CONSENT MANAGEMENT
  // ============================================================================

  /**
   * Get user's current consent preferences
   */
  async getUserConsents(userId: string) {
    return this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { consentType: 'asc' },
    });
  }

  /**
   * Update or create user consent
   */
  async upsertUserConsent(
    userId: string,
    consentType: ConsentType,
    status: ConsentStatus,
    ipAddress?: string,
    userAgent?: string,
    version: number = 1
  ) {
    const now = new Date();
    const grantedAt = status === ConsentStatus.granted ? now : null;
    const withdrawnAt = status === ConsentStatus.withdrawn ? now : null;

    return this.prisma.userConsent.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
      create: {
        userId,
        consentType,
        status,
        grantedAt,
        withdrawnAt,
        ipAddress,
        userAgent,
        version,
      },
      update: {
        status,
        grantedAt,
        withdrawnAt,
        ipAddress,
        userAgent,
        version,
      },
    });
  }

  /**
   * Log consent change to audit trail
   */
  async logConsentChange(
    userId: string,
    consentType: ConsentType,
    status: ConsentStatus,
    version: number,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  ) {
    return this.prisma.consentLog.create({
      data: {
        userId,
        consentType,
        status,
        version,
        ipAddress,
        userAgent,
        metadata,
      },
    });
  }

  /**
   * Get consent change history for user
   */
  async getConsentHistory(userId: string, consentType?: ConsentType) {
    return this.prisma.consentLog.findMany({
      where: {
        userId,
        ...(consentType && { consentType }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================================
  // DATA EXPORT & DELETION
  // ============================================================================

  /**
   * Get comprehensive user data for export
   */
  async getUserDataForExport(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: true,
        workExperiences: true,
        educations: true,
        portfolioProjects: true,
        privacySettings: true,
        consents: true,
        articles: {
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            viewCount: true,
          },
        },
        topics: {
          select: {
            id: true,
            title: true,
            slug: true,
            createdAt: true,
            viewCount: true,
          },
        },
        replies: {
          select: {
            id: true,
            topicId: true,
            createdAt: true,
          },
        },
        bookmarks: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        jobApplications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        notifications: {
          select: {
            type: true,
            title: true,
            message: true,
            createdAt: true,
            isRead: true,
          },
        },
        sentMessages: {
          select: {
            recipientId: true,
            subject: true,
            createdAt: true,
          },
        },
        receivedMessages: {
          select: {
            senderId: true,
            subject: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Create data deletion request
   */
  async createDataDeletionRequest(userId: string, reason?: string) {
    return this.prisma.dataDeletionRequest.create({
      data: {
        userId,
        reason,
        status: DataDeletionStatus.requested,
      },
    });
  }

  /**
   * Get data deletion requests
   */
  async getDataDeletionRequests(filters?: {
    userId?: string;
    status?: DataDeletionStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.DataDeletionRequestWhereInput = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.dataDeletionRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });
  }

  /**
   * Update data deletion request status
   */
  async updateDataDeletionRequest(
    requestId: string,
    status: DataDeletionStatus,
    processedBy?: string,
    notes?: string,
    exportedData?: string
  ) {
    const now = new Date();
    return this.prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: {
        status,
        processedBy,
        notes,
        exportedData,
        ...(status === DataDeletionStatus.processing && { processedAt: now }),
        ...(status === DataDeletionStatus.completed && { completedAt: now }),
      },
    });
  }

  /**
   * Anonymize user data (right to be forgotten)
   * Replaces PII with anonymized values while keeping content for data integrity
   */
  async anonymizeUserData(userId: string) {
    const anonymizedEmail = `deleted_user_${userId.substring(0, 8)}@anonymized.local`;
    const anonymizedUsername = `deleted_user_${userId.substring(0, 8)}`;

    // Update user record
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        username: anonymizedUsername,
        emailVerified: false,
        passwordHash: null,
        status: 'deleted',
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Delete profile data
    await this.prisma.profile.deleteMany({
      where: { userId },
    });

    // Delete sensitive personal data
    await this.prisma.workExperience.deleteMany({ where: { userId } });
    await this.prisma.education.deleteMany({ where: { userId } });
    await this.prisma.portfolioProject.deleteMany({ where: { userId } });
    await this.prisma.userSkill.deleteMany({ where: { userId } });

    // Delete all sessions
    await this.prisma.session.deleteMany({ where: { userId } });

    // Delete OAuth connections
    await this.prisma.oAuthProvider_Model.deleteMany({ where: { userId } });

    // Delete consents
    await this.prisma.userConsent.deleteMany({ where: { userId } });

    // Delete email preferences
    await this.prisma.notificationPreference.deleteMany({ where: { userId } });
    await this.prisma.digestPreference.deleteMany({ where: { userId } });

    // Note: We keep forum posts, articles, and job applications
    // but with anonymized author info for data integrity
  }

  // ============================================================================
  // EMAIL UNSUBSCRIBE
  // ============================================================================

  /**
   * Create email unsubscribe record
   */
  async createEmailUnsubscribe(
    email: string,
    unsubscribeType: string,
    token: string,
    userId?: string
  ) {
    return this.prisma.emailUnsubscribe.create({
      data: {
        userId,
        email,
        unsubscribeType,
        token,
      },
    });
  }

  /**
   * Get email unsubscribe by token
   */
  async getEmailUnsubscribeByToken(token: string) {
    return this.prisma.emailUnsubscribe.findUnique({
      where: { token },
    });
  }

  /**
   * Check if email is unsubscribed
   */
  async isEmailUnsubscribed(email: string, unsubscribeType: string) {
    const unsubscribe = await this.prisma.emailUnsubscribe.findFirst({
      where: {
        email,
        unsubscribeType: { in: [unsubscribeType, 'all'] },
      },
    });
    return !!unsubscribe;
  }

  /**
   * Get all unsubscribes for a user
   */
  async getUserUnsubscribes(userId: string) {
    return this.prisma.emailUnsubscribe.findMany({
      where: { userId },
      orderBy: { unsubscribedAt: 'desc' },
    });
  }

  // ============================================================================
  // LEGAL DOCUMENTS
  // ============================================================================

  /**
   * Get active legal document by type
   */
  async getActiveLegalDocument(documentType: LegalDocumentType) {
    return this.prisma.legalDocument.findFirst({
      where: {
        documentType,
        isActive: true,
      },
      orderBy: { effectiveAt: 'desc' },
    });
  }

  /**
   * Get legal document by type and version
   */
  async getLegalDocumentByVersion(documentType: LegalDocumentType, version: string) {
    return this.prisma.legalDocument.findUnique({
      where: {
        documentType_version: {
          documentType,
          version,
        },
      },
    });
  }

  /**
   * Create legal document
   */
  async createLegalDocument(data: {
    documentType: LegalDocumentType;
    version: string;
    title: string;
    content: string;
    effectiveAt: Date;
    publishedBy?: string;
    isActive?: boolean;
  }) {
    return this.prisma.legalDocument.create({
      data: {
        ...data,
        publishedAt: new Date(),
      },
    });
  }

  /**
   * Update legal document
   */
  async updateLegalDocument(id: string, data: Partial<{
    title: string;
    content: string;
    effectiveAt: Date;
    isActive: boolean;
  }>) {
    return this.prisma.legalDocument.update({
      where: { id },
      data,
    });
  }

  /**
   * Get all versions of a legal document
   */
  async getLegalDocumentVersions(documentType: LegalDocumentType) {
    return this.prisma.legalDocument.findMany({
      where: { documentType },
      orderBy: { effectiveAt: 'desc' },
    });
  }

  // ============================================================================
  // DATA RETENTION POLICIES
  // ============================================================================

  /**
   * Get active retention policies
   */
  async getActiveRetentionPolicies() {
    return this.prisma.dataRetentionPolicy.findMany({
      where: { isActive: true },
      orderBy: { dataType: 'asc' },
    });
  }

  /**
   * Get retention policy by data type
   */
  async getRetentionPolicyByType(dataType: string) {
    return this.prisma.dataRetentionPolicy.findUnique({
      where: { dataType },
    });
  }

  /**
   * Upsert retention policy
   */
  async upsertRetentionPolicy(data: {
    dataType: string;
    retentionDays: number;
    description?: string;
    isActive?: boolean;
  }) {
    return this.prisma.dataRetentionPolicy.upsert({
      where: { dataType: data.dataType },
      create: data,
      update: data,
    });
  }

  // ============================================================================
  // DPO CONTACT
  // ============================================================================

  /**
   * Get active DPO contact
   */
  async getActiveDPOContact() {
    return this.prisma.dPOContact.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create or update DPO contact
   */
  async upsertDPOContact(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
  }) {
    // Deactivate all existing contacts
    await this.prisma.dPOContact.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active contact
    return this.prisma.dPOContact.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }
}

export default GDPRRepository;
