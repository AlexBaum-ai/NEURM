import { PrismaClient, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';

/**
 * BulkMessagingRepository
 * Data access layer for bulk messaging operations
 */
export class BulkMessagingRepository {
  constructor(private prisma: PrismaClient) {}

  // ============================================================================
  // MESSAGE TEMPLATES
  // ============================================================================

  /**
   * Create a message template
   */
  async createTemplate(companyId: string, data: Prisma.MessageTemplateCreateInput) {
    return this.prisma.messageTemplate.create({
      data: {
        ...data,
        company: {
          connect: { id: companyId },
        },
      },
    });
  }

  /**
   * Get templates for a company
   */
  async getTemplates(companyId: string, options: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.MessageTemplateWhereInput = {
      companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [templates, total] = await Promise.all([
      this.prisma.messageTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.messageTemplate.count({ where }),
    ]);

    return { templates, total };
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string, companyId: string) {
    return this.prisma.messageTemplate.findFirst({
      where: {
        id: templateId,
        companyId,
      },
    });
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, companyId: string, data: Prisma.MessageTemplateUpdateInput) {
    return this.prisma.messageTemplate.updateMany({
      where: {
        id: templateId,
        companyId,
      },
      data,
    });
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, companyId: string) {
    return this.prisma.messageTemplate.deleteMany({
      where: {
        id: templateId,
        companyId,
      },
    });
  }

  // ============================================================================
  // BULK MESSAGES
  // ============================================================================

  /**
   * Create bulk message record
   */
  async createBulkMessage(data: {
    companyId: string;
    templateId?: string;
    subject?: string;
    recipientCount: number;
    recipientIds: string[];
  }) {
    return this.prisma.bulkMessage.create({
      data: {
        companyId: data.companyId,
        templateId: data.templateId,
        subject: data.subject,
        recipientCount: data.recipientCount,
        recipientIds: data.recipientIds,
        status: 'sent',
      },
      include: {
        template: true,
      },
    });
  }

  /**
   * Create bulk message recipient
   */
  async createBulkMessageRecipient(data: {
    bulkMessageId: string;
    recipientId: string;
    conversationMessageId: string;
    personalizedContent: string;
    status: string;
  }) {
    return this.prisma.bulkMessageRecipient.create({
      data,
    });
  }

  /**
   * Create multiple bulk message recipients
   */
  async createBulkMessageRecipients(
    recipients: Array<{
      bulkMessageId: string;
      recipientId: string;
      conversationMessageId: string;
      personalizedContent: string;
      status: string;
    }>,
  ) {
    return this.prisma.bulkMessageRecipient.createMany({
      data: recipients,
      skipDuplicates: true,
    });
  }

  /**
   * Get bulk messages for a company
   */
  async getBulkMessages(companyId: string, options: {
    page: number;
    limit: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page, limit, status, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.BulkMessageWhereInput = {
      companyId,
      ...(status && { status }),
      ...(startDate || endDate
        ? {
            sentAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [bulkMessages, total] = await Promise.all([
      this.prisma.bulkMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              recipients: true,
            },
          },
        },
      }),
      this.prisma.bulkMessage.count({ where }),
    ]);

    return { bulkMessages, total };
  }

  /**
   * Get bulk message by ID
   */
  async getBulkMessageById(bulkMessageId: string, companyId: string) {
    return this.prisma.bulkMessage.findFirst({
      where: {
        id: bulkMessageId,
        companyId,
      },
      include: {
        template: true,
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get bulk message recipients
   */
  async getBulkMessageRecipients(bulkMessageId: string, options: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.BulkMessageRecipientWhereInput = {
      bulkMessageId,
      ...(status && { status }),
    };

    const [recipients, total] = await Promise.all([
      this.prisma.bulkMessageRecipient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.bulkMessageRecipient.count({ where }),
    ]);

    return { recipients, total };
  }

  /**
   * Update bulk message recipient status
   */
  async updateRecipientStatus(recipientId: string, status: string, metadata?: {
    deliveredAt?: Date;
    readAt?: Date;
    repliedAt?: Date;
    failedReason?: string;
  }) {
    return this.prisma.bulkMessageRecipient.update({
      where: { id: recipientId },
      data: {
        status,
        ...metadata,
      },
    });
  }

  /**
   * Update bulk message counts
   */
  async updateBulkMessageCounts(bulkMessageId: string) {
    const counts = await this.prisma.bulkMessageRecipient.groupBy({
      by: ['status'],
      where: { bulkMessageId },
      _count: true,
    });

    const delivered = counts.find((c) => c.status === 'delivered')?._count || 0;
    const read = counts.find((c) => c.status === 'read')?._count || 0;
    const replied = counts.find((c) => c.status === 'replied')?._count || 0;
    const failed = counts.find((c) => c.status === 'failed')?._count || 0;

    return this.prisma.bulkMessage.update({
      where: { id: bulkMessageId },
      data: {
        deliveredCount: delivered,
        readCount: read,
        repliedCount: replied,
        failedCount: failed,
      },
    });
  }

  // ============================================================================
  // COMPANY BLOCKS
  // ============================================================================

  /**
   * Block a company
   */
  async blockCompany(candidateId: string, companyId: string, reason?: string) {
    return this.prisma.companyBlock.create({
      data: {
        candidateId,
        companyId,
        reason,
      },
    });
  }

  /**
   * Unblock a company
   */
  async unblockCompany(candidateId: string, companyId: string) {
    return this.prisma.companyBlock.deleteMany({
      where: {
        candidateId,
        companyId,
      },
    });
  }

  /**
   * Check if company is blocked by candidate
   */
  async isCompanyBlocked(candidateId: string, companyId: string): Promise<boolean> {
    const block = await this.prisma.companyBlock.findUnique({
      where: {
        candidateId_companyId: {
          candidateId,
          companyId,
        },
      },
    });
    return !!block;
  }

  /**
   * Get blocked companies for a candidate
   */
  async getBlockedCompanies(candidateId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [blocks, total] = await Promise.all([
      this.prisma.companyBlock.findMany({
        where: { candidateId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              industry: true,
            },
          },
        },
      }),
      this.prisma.companyBlock.count({ where: { candidateId } }),
    ]);

    return { blocks, total };
  }

  /**
   * Check multiple candidates for company blocks
   */
  async getBlockedCandidateIds(companyId: string, candidateIds: string[]): Promise<string[]> {
    const blocks = await this.prisma.companyBlock.findMany({
      where: {
        companyId,
        candidateId: {
          in: candidateIds,
        },
      },
      select: {
        candidateId: true,
      },
    });

    return blocks.map((block) => block.candidateId);
  }

  // ============================================================================
  // RATE LIMITING HELPERS
  // ============================================================================

  /**
   * Count bulk messages sent today by company
   */
  async countBulkMessagesToday(companyId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.bulkMessage.count({
      where: {
        companyId,
        sentAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }

  /**
   * Count total recipients messaged today by company
   */
  async countRecipientsToday(companyId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.bulkMessage.aggregate({
      where: {
        companyId,
        sentAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        recipientCount: true,
      },
    });

    return result._sum.recipientCount || 0;
  }
}
