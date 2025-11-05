import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import {
  ReplyRepository,
  CreateReplyData,
  ReplyWithRelations,
  ReplySortOptions,
} from '../repositories/ReplyRepository';
import {
  extractMentions,
  validateThreadingDepth,
  isWithinEditTimeLimit,
} from '../validators/replyValidators';
import { ReputationService } from './reputationService';

/**
 * Reply Service
 *
 * Business logic for forum replies including:
 * - Reply CRUD with threading (max 3 levels)
 * - @mention extraction and notification
 * - Quote functionality
 * - Edit restrictions (within 15 min)
 * - Accept answer (question topics only)
 * - Edit history tracking
 * - Soft deletes
 */

export interface CreateReplyInput {
  topicId: string;
  userId: string;
  content: string;
  parentReplyId?: string;
  quotedReplyId?: string;
}

export interface UpdateReplyInput {
  content: string;
  editReason?: string;
}

@injectable()
export class ReplyService {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject(ReplyRepository) private replyRepository: ReplyRepository,
    @inject('ReputationService') private reputationService: ReputationService
  ) {}

  /**
   * Create a new reply
   */
  async createReply(input: CreateReplyInput): Promise<ReplyWithRelations> {
    try {
      // Validate topic exists and is not locked
      const topic = await this.prisma.topic.findUnique({
        where: { id: input.topicId },
        select: {
          id: true,
          isLocked: true,
          status: true,
          authorId: true,
        },
      });

      if (!topic) {
        throw new Error('Topic not found');
      }

      if (topic.isLocked) {
        throw new Error('Cannot reply to locked topic');
      }

      // If parent reply exists, validate depth
      if (input.parentReplyId) {
        const parentReply = await this.replyRepository.findById(input.parentReplyId);

        if (!parentReply) {
          throw new Error('Parent reply not found');
        }

        if (!validateThreadingDepth(parentReply.depth, 3)) {
          throw new Error('Maximum reply depth (3 levels) exceeded');
        }

        // Ensure parent reply belongs to the same topic
        if (parentReply.topicId !== input.topicId) {
          throw new Error('Parent reply must belong to the same topic');
        }
      }

      // If quoted reply exists, validate it exists and belongs to the topic
      if (input.quotedReplyId) {
        const quotedReply = await this.replyRepository.findById(input.quotedReplyId);

        if (!quotedReply) {
          throw new Error('Quoted reply not found');
        }

        if (quotedReply.topicId !== input.topicId) {
          throw new Error('Quoted reply must belong to the same topic');
        }
      }

      // Extract mentions from content
      const mentions = extractMentions(input.content);

      // Create reply
      const replyData: CreateReplyData = {
        topicId: input.topicId,
        authorId: input.userId,
        content: input.content,
        parentReplyId: input.parentReplyId,
        quotedReplyId: input.quotedReplyId,
        mentions,
      };

      const reply = await this.replyRepository.create(replyData);

      // Increment topic reply count
      await this.replyRepository.incrementTopicReplyCount(input.topicId);

      // Award reputation for reply creation
      this.reputationService.awardReplyCreation(input.userId, reply.id).catch((err) => {
        Sentry.captureException(err, {
          tags: { module: 'forum', operation: 'awardReplyCreation' },
          extra: { replyId: reply.id, userId: input.userId },
        });
      });

      // TODO: Send notifications for mentions
      if (mentions.length > 0) {
        await this.sendMentionNotifications(mentions, reply.id, input.userId);
      }

      // TODO: Send notification to topic author (if not the reply author)
      if (topic.authorId !== input.userId) {
        await this.sendReplyNotification(topic.authorId, reply.id, input.userId);
      }

      return reply;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ReplyService', method: 'createReply' },
        extra: { input },
      });
      throw error;
    }
  }

  /**
   * Get replies for a topic
   */
  async getRepliesByTopic(
    topicId: string,
    options: ReplySortOptions = { sort: 'oldest' },
    userId?: string
  ): Promise<ReplyWithRelations[]> {
    try {
      // Check if user is moderator to include deleted replies
      let includeDeleted = false;
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        includeDeleted = user?.role === 'moderator' || user?.role === 'admin';
      }

      const replies = await this.replyRepository.findByTopicId(
        topicId,
        options,
        includeDeleted
      );

      return replies;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ReplyService', method: 'getRepliesByTopic' },
        extra: { topicId, options },
      });
      throw error;
    }
  }

  /**
   * Get a single reply by ID
   */
  async getReplyById(replyId: string, userId?: string): Promise<ReplyWithRelations> {
    try {
      // Check if user is moderator to include deleted replies
      let includeDeleted = false;
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        includeDeleted = user?.role === 'moderator' || user?.role === 'admin';
      }

      const reply = await this.replyRepository.findById(replyId, includeDeleted);

      if (!reply) {
        throw new Error('Reply not found');
      }

      return reply;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ReplyService', method: 'getReplyById' },
        extra: { replyId },
      });
      throw error;
    }
  }

  /**
   * Update a reply (author only, within 15 min)
   */
  async updateReply(
    replyId: string,
    userId: string,
    input: UpdateReplyInput
  ): Promise<ReplyWithRelations> {
    try {
      const reply = await this.replyRepository.findById(replyId);

      if (!reply) {
        throw new Error('Reply not found');
      }

      // Check authorization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const isModerator = user?.role === 'moderator' || user?.role === 'admin';
      const isAuthor = reply.authorId === userId;

      if (!isAuthor && !isModerator) {
        throw new Error('Unauthorized to update this reply');
      }

      // Check edit time limit (15 minutes) for regular users
      if (!isModerator && !isWithinEditTimeLimit(reply.createdAt)) {
        throw new Error('Edit time limit (15 minutes) exceeded');
      }

      // Store previous content in edit history
      await this.replyRepository.createEditHistory(
        replyId,
        reply.content,
        userId,
        input.editReason
      );

      // Extract new mentions
      const mentions = extractMentions(input.content);

      // Update reply
      const updatedReply = await this.replyRepository.update(replyId, {
        content: input.content,
        editedAt: new Date(),
      });

      // Update mentions array
      await this.prisma.reply.update({
        where: { id: replyId },
        data: { mentions },
      });

      // TODO: Send notifications for new mentions
      if (mentions.length > 0) {
        await this.sendMentionNotifications(mentions, replyId, userId);
      }

      return updatedReply;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ReplyService', method: 'updateReply' },
        extra: { replyId, userId, input },
      });
      throw error;
    }
  }

  /**
   * Delete a reply (soft delete)
   * Allowed by: author, moderator, admin
   */
  async deleteReply(replyId: string, userId: string): Promise<void> {
    try {
      const reply = await this.replyRepository.findById(replyId);

      if (!reply) {
        throw new Error('Reply not found');
      }

      // Check authorization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const isModerator = user?.role === 'moderator' || user?.role === 'admin';
      const isAuthor = reply.authorId === userId;

      if (!isAuthor && !isModerator) {
        throw new Error('Unauthorized to delete this reply');
      }

      // Soft delete the reply
      await this.replyRepository.softDelete(replyId);

      // Decrement topic reply count
      await this.replyRepository.decrementTopicReplyCount(reply.topicId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ReplyService', method: 'deleteReply' },
        extra: { replyId, userId },
      });
      throw error;
    }
  }

  /**
   * Mark reply as accepted answer (topic author only, for question topics)
   */
  async markAsAcceptedAnswer(
    topicId: string,
    replyId: string,
    userId: string
  ): Promise<void> {
    try {
      // Validate topic
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        select: {
          id: true,
          type: true,
          authorId: true,
        },
      });

      if (!topic) {
        throw new Error('Topic not found');
      }

      // Only question topics can have accepted answers
      if (topic.type !== 'question') {
        throw new Error('Only question topics can have accepted answers');
      }

      // Only topic author can mark accepted answer
      if (topic.authorId !== userId) {
        throw new Error('Only topic author can mark accepted answer');
      }

      // Validate reply exists and belongs to the topic
      const reply = await this.replyRepository.findById(replyId);

      if (!reply) {
        throw new Error('Reply not found');
      }

      if (reply.topicId !== topicId) {
        throw new Error('Reply does not belong to this topic');
      }

      // Set accepted answer
      await this.replyRepository.setAcceptedAnswer(topicId, replyId);

      // TODO: Send notification to reply author
      await this.sendAcceptedAnswerNotification(reply.authorId, replyId, userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ReplyService', method: 'markAsAcceptedAnswer' },
        extra: { topicId, replyId, userId },
      });
      throw error;
    }
  }

  /**
   * Remove accepted answer mark
   */
  async removeAcceptedAnswer(topicId: string, userId: string): Promise<void> {
    try {
      // Validate topic
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        select: {
          id: true,
          type: true,
          authorId: true,
        },
      });

      if (!topic) {
        throw new Error('Topic not found');
      }

      // Only topic author can remove accepted answer
      if (topic.authorId !== userId) {
        throw new Error('Only topic author can remove accepted answer');
      }

      await this.replyRepository.removeAcceptedAnswer(topicId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ReplyService', method: 'removeAcceptedAnswer' },
        extra: { topicId, userId },
      });
      throw error;
    }
  }

  /**
   * Get edit history for a reply (moderators only)
   */
  async getEditHistory(replyId: string, userId: string) {
    try {
      // Check if user is moderator
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const isModerator = user?.role === 'moderator' || user?.role === 'admin';

      if (!isModerator) {
        throw new Error('Unauthorized to view edit history');
      }

      return this.replyRepository.getEditHistory(replyId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ReplyService', method: 'getEditHistory' },
        extra: { replyId, userId },
      });
      throw error;
    }
  }

  /**
   * Send mention notifications (placeholder)
   * TODO: Implement actual notification logic
   */
  private async sendMentionNotifications(
    mentions: string[],
    replyId: string,
    senderId: string
  ): Promise<void> {
    // This is a placeholder for notification logic
    // In a real implementation, this would:
    // 1. Look up users by username
    // 2. Create notification records
    // 3. Optionally send emails
    console.log(`Sending mention notifications to: ${mentions.join(', ')}`);
  }

  /**
   * Send reply notification to topic author (placeholder)
   * TODO: Implement actual notification logic
   */
  private async sendReplyNotification(
    recipientId: string,
    replyId: string,
    senderId: string
  ): Promise<void> {
    // This is a placeholder for notification logic
    console.log(`Sending reply notification to user: ${recipientId}`);
  }

  /**
   * Send accepted answer notification (placeholder)
   * TODO: Implement actual notification logic
   */
  private async sendAcceptedAnswerNotification(
    recipientId: string,
    replyId: string,
    senderId: string
  ): Promise<void> {
    // This is a placeholder for notification logic
    console.log(`Sending accepted answer notification to user: ${recipientId}`);
  }
}
