import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import Redis from 'ioredis';
import { BulkMessagingRepository } from './bulkMessaging.repository';
import { MessagingRepository } from './messaging.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/errors';
import logger from '@/utils/logger';
import {
  CreateMessageTemplateInput,
  UpdateMessageTemplateInput,
  GetTemplatesQuery,
  SendBulkMessageInput,
  GetBulkMessagesQuery,
  GetBulkMessageRecipientsQuery,
  BlockCompanyInput,
  GetBlockedCompaniesQuery,
  TemplateVariables,
} from './bulkMessaging.validation';

/**
 * BulkMessagingService
 * Business logic for bulk messaging operations with rate limiting and personalization
 */
export class BulkMessagingService {
  private repository: BulkMessagingRepository;
  private messagingRepository: MessagingRepository;
  private redis: Redis;

  // Rate limit constants
  private readonly MAX_DAILY_RECIPIENTS = 50;
  private readonly RATE_LIMIT_KEY_PREFIX = 'bulk_message_count';

  constructor(prisma?: PrismaClient, redis?: Redis) {
    const prismaClient = prisma || new PrismaClient();
    this.repository = new BulkMessagingRepository(prismaClient);
    this.messagingRepository = new MessagingRepository(prismaClient);
    this.redis = redis || new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // ============================================================================
  // MESSAGE TEMPLATES
  // ============================================================================

  /**
   * Create a message template
   */
  async createTemplate(companyId: string, input: CreateMessageTemplateInput) {
    try {
      const template = await this.repository.createTemplate(companyId, {
        name: input.name,
        subject: input.subject,
        body: input.body,
        isDefault: input.isDefault,
        company: {
          connect: { id: companyId },
        },
      });

      logger.info(`Template created for company ${companyId}`);
      return template;
    } catch (error) {
      logger.error('Error in createTemplate service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get templates for a company
   */
  async getTemplates(companyId: string, query: GetTemplatesQuery) {
    try {
      const { templates, total } = await this.repository.getTemplates(companyId, query);

      return {
        templates,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    } catch (error) {
      logger.error('Error in getTemplates service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string, companyId: string) {
    try {
      const template = await this.repository.getTemplateById(templateId, companyId);
      if (!template) {
        throw new NotFoundError('Template not found');
      }
      return template;
    } catch (error) {
      logger.error('Error in getTemplateById service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, companyId: string, input: UpdateMessageTemplateInput) {
    try {
      const result = await this.repository.updateTemplate(templateId, companyId, input);
      if (result.count === 0) {
        throw new NotFoundError('Template not found');
      }

      // Fetch updated template
      const template = await this.repository.getTemplateById(templateId, companyId);
      logger.info(`Template ${templateId} updated for company ${companyId}`);
      return template;
    } catch (error) {
      logger.error('Error in updateTemplate service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, companyId: string) {
    try {
      const result = await this.repository.deleteTemplate(templateId, companyId);
      if (result.count === 0) {
        throw new NotFoundError('Template not found');
      }

      logger.info(`Template ${templateId} deleted for company ${companyId}`);
      return { success: true, message: 'Template deleted successfully' };
    } catch (error) {
      logger.error('Error in deleteTemplate service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  // ============================================================================
  // BULK MESSAGING
  // ============================================================================

  /**
   * Send bulk messages to multiple candidates
   */
  async sendBulkMessage(companyId: string, input: SendBulkMessageInput) {
    try {
      const { templateId, subject, body, recipientIds, personalizeContent } = input;

      // Check rate limit (50 messages per day)
      await this.checkRateLimit(companyId, recipientIds.length);

      // Remove blocked candidates
      const blockedCandidateIds = await this.repository.getBlockedCandidateIds(companyId, recipientIds);
      const validRecipientIds = recipientIds.filter((id) => !blockedCandidateIds.includes(id));

      if (validRecipientIds.length === 0) {
        throw new BadRequestError('All recipients have blocked your company');
      }

      if (blockedCandidateIds.length > 0) {
        logger.info(`${blockedCandidateIds.length} recipients blocked company ${companyId}`);
      }

      // Get template if provided
      let template = null;
      let messageBody = body;
      let messageSubject = subject;

      if (templateId) {
        template = await this.repository.getTemplateById(templateId, companyId);
        if (!template) {
          throw new NotFoundError('Template not found');
        }
        messageBody = template.body;
        messageSubject = template.subject || subject;
      }

      // Create bulk message record
      const bulkMessage = await this.repository.createBulkMessage({
        companyId,
        templateId,
        subject: messageSubject,
        recipientCount: validRecipientIds.length,
        recipientIds: validRecipientIds,
      });

      // Send individual messages
      const recipientRecords = [];
      const sendResults = {
        successful: 0,
        failed: 0,
        errors: [] as Array<{ recipientId: string; error: string }>,
      };

      for (const recipientId of validRecipientIds) {
        try {
          // Get recipient data for personalization
          const recipientData = await this.getRecipientData(recipientId);

          // Personalize content
          const personalizedContent = personalizeContent
            ? this.personalizeTemplate(messageBody, recipientData)
            : messageBody;

          const personalizedSubject = personalizeContent && messageSubject
            ? this.personalizeTemplate(messageSubject, recipientData)
            : messageSubject;

          // Find or create conversation
          const conversation = await this.messagingRepository.findOrCreateConversation(
            companyId,
            recipientId,
          );

          // Create message in conversation
          const message = await this.messagingRepository.createMessage({
            conversationId: conversation.id,
            senderId: companyId,
            content: personalizedContent,
            contentFormat: 'markdown',
          });

          // Create bulk message recipient record
          recipientRecords.push({
            bulkMessageId: bulkMessage.id,
            recipientId,
            conversationMessageId: message.id,
            personalizedContent,
            status: 'sent',
          });

          sendResults.successful++;
        } catch (error) {
          logger.error(`Failed to send message to ${recipientId}:`, error);
          sendResults.failed++;
          sendResults.errors.push({
            recipientId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Create failed recipient record
          recipientRecords.push({
            bulkMessageId: bulkMessage.id,
            recipientId,
            conversationMessageId: '',
            personalizedContent: messageBody,
            status: 'failed',
          });
        }
      }

      // Save all recipient records
      await this.repository.createBulkMessageRecipients(
        recipientRecords.map((r) => ({
          ...r,
          conversationMessageId: r.conversationMessageId || '',
        })),
      );

      // Update bulk message counts
      await this.repository.updateBulkMessageCounts(bulkMessage.id);

      // Increment rate limit counter
      await this.incrementRateLimitCounter(companyId, validRecipientIds.length);

      logger.info(
        `Bulk message sent by company ${companyId}: ${sendResults.successful} successful, ${sendResults.failed} failed`,
      );

      return {
        bulkMessageId: bulkMessage.id,
        totalRecipients: validRecipientIds.length,
        blockedCount: blockedCandidateIds.length,
        successful: sendResults.successful,
        failed: sendResults.failed,
        errors: sendResults.errors,
        message: `Bulk message sent to ${sendResults.successful} recipients`,
      };
    } catch (error) {
      logger.error('Error in sendBulkMessage service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get bulk messages for a company
   */
  async getBulkMessages(companyId: string, query: GetBulkMessagesQuery) {
    try {
      const { bulkMessages, total } = await this.repository.getBulkMessages(companyId, query);

      return {
        bulkMessages: bulkMessages.map((bm) => ({
          id: bm.id,
          subject: bm.subject,
          template: bm.template,
          recipientCount: bm.recipientCount,
          deliveredCount: bm.deliveredCount,
          readCount: bm.readCount,
          repliedCount: bm.repliedCount,
          failedCount: bm.failedCount,
          status: bm.status,
          sentAt: bm.sentAt,
        })),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    } catch (error) {
      logger.error('Error in getBulkMessages service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get bulk message details by ID
   */
  async getBulkMessageById(bulkMessageId: string, companyId: string) {
    try {
      const bulkMessage = await this.repository.getBulkMessageById(bulkMessageId, companyId);
      if (!bulkMessage) {
        throw new NotFoundError('Bulk message not found');
      }
      return bulkMessage;
    } catch (error) {
      logger.error('Error in getBulkMessageById service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get bulk message recipients
   */
  async getBulkMessageRecipients(
    bulkMessageId: string,
    companyId: string,
    query: GetBulkMessageRecipientsQuery,
  ) {
    try {
      // Verify bulk message belongs to company
      const bulkMessage = await this.repository.getBulkMessageById(bulkMessageId, companyId);
      if (!bulkMessage) {
        throw new NotFoundError('Bulk message not found');
      }

      const { recipients, total } = await this.repository.getBulkMessageRecipients(bulkMessageId, query);

      return {
        recipients: recipients.map((r) => ({
          id: r.id,
          recipient: {
            id: r.recipient.id,
            username: r.recipient.username,
            displayName: r.recipient.profile?.displayName || r.recipient.username,
            avatarUrl: r.recipient.profile?.avatarUrl,
          },
          status: r.status,
          deliveredAt: r.deliveredAt,
          readAt: r.readAt,
          repliedAt: r.repliedAt,
          failedReason: r.failedReason,
          createdAt: r.createdAt,
        })),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    } catch (error) {
      logger.error('Error in getBulkMessageRecipients service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  // ============================================================================
  // COMPANY BLOCKING
  // ============================================================================

  /**
   * Block a company from messaging
   */
  async blockCompany(candidateId: string, companyId: string, input: BlockCompanyInput) {
    try {
      // Check if already blocked
      const isBlocked = await this.repository.isCompanyBlocked(candidateId, companyId);
      if (isBlocked) {
        throw new BadRequestError('Company is already blocked');
      }

      await this.repository.blockCompany(candidateId, companyId, input.reason);

      logger.info(`Candidate ${candidateId} blocked company ${companyId}`);
      return {
        success: true,
        message: 'Company blocked successfully',
      };
    } catch (error) {
      logger.error('Error in blockCompany service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Unblock a company
   */
  async unblockCompany(candidateId: string, companyId: string) {
    try {
      const result = await this.repository.unblockCompany(candidateId, companyId);
      if (result.count === 0) {
        throw new NotFoundError('Company block not found');
      }

      logger.info(`Candidate ${candidateId} unblocked company ${companyId}`);
      return {
        success: true,
        message: 'Company unblocked successfully',
      };
    } catch (error) {
      logger.error('Error in unblockCompany service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get blocked companies for a candidate
   */
  async getBlockedCompanies(candidateId: string, query: GetBlockedCompaniesQuery) {
    try {
      const { blocks, total } = await this.repository.getBlockedCompanies(candidateId, query);

      return {
        companies: blocks.map((block) => ({
          id: block.id,
          company: block.company,
          reason: block.reason,
          blockedAt: block.createdAt,
        })),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    } catch (error) {
      logger.error('Error in getBlockedCompanies service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  /**
   * Check if company has exceeded daily rate limit
   */
  private async checkRateLimit(companyId: string, newRecipientCount: number) {
    try {
      // Check current count from database
      const currentCount = await this.repository.countRecipientsToday(companyId);

      // Check Redis cache
      const redisKey = this.getRateLimitKey(companyId);
      const redisCount = await this.redis.get(redisKey);
      const totalCount = Math.max(currentCount, parseInt(redisCount || '0'));

      if (totalCount + newRecipientCount > this.MAX_DAILY_RECIPIENTS) {
        throw new ForbiddenError(
          `Daily recipient limit exceeded. You can send to ${this.MAX_DAILY_RECIPIENTS - totalCount} more recipients today.`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      logger.error('Error checking rate limit:', error);
      // If Redis is down, fall back to database count only
      const currentCount = await this.repository.countRecipientsToday(companyId);
      if (currentCount + newRecipientCount > this.MAX_DAILY_RECIPIENTS) {
        throw new ForbiddenError('Daily recipient limit exceeded');
      }
      return true;
    }
  }

  /**
   * Increment rate limit counter in Redis
   */
  private async incrementRateLimitCounter(companyId: string, count: number) {
    try {
      const redisKey = this.getRateLimitKey(companyId);
      const ttl = this.getSecondsUntilMidnight();

      await this.redis.incrby(redisKey, count);
      await this.redis.expire(redisKey, ttl);
    } catch (error) {
      logger.error('Error incrementing rate limit counter:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Get rate limit key for Redis
   */
  private getRateLimitKey(companyId: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${this.RATE_LIMIT_KEY_PREFIX}:${companyId}:${date}`;
  }

  /**
   * Get seconds until midnight (for Redis TTL)
   */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  // ============================================================================
  // PERSONALIZATION
  // ============================================================================

  /**
   * Get recipient data for personalization
   */
  private async getRecipientData(recipientId: string): Promise<TemplateVariables> {
    try {
      const user = await this.messagingRepository['prisma'].user.findUnique({
        where: { id: recipientId },
        include: {
          profile: true,
          skills: true,
          workExperiences: {
            orderBy: { startDate: 'desc' },
            take: 1,
          },
        },
      });

      if (!user) {
        return {};
      }

      const experience = user.workExperiences[0];
      const skills = user.skills.map((s) => s.skillName).join(', ');

      return {
        candidate_name: user.profile?.displayName || user.username,
        candidate_username: user.username,
        candidate_skills: skills || undefined,
        candidate_experience: experience?.title || undefined,
        candidate_location: user.profile?.location || undefined,
      };
    } catch (error) {
      logger.error('Error getting recipient data:', error);
      return {};
    }
  }

  /**
   * Personalize template with candidate data
   */
  private personalizeTemplate(template: string, variables: TemplateVariables): string {
    let personalized = template;

    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
        personalized = personalized.replace(regex, value);
      }
    });

    // Remove unreplaced variables
    personalized = personalized.replace(/{{[^}]+}}/g, '');

    return personalized;
  }
}
