import { injectable } from 'tsyringe';
import prisma from '@/config/database';
import * as Sentry from '@sentry/node';
import { Prisma, TopicStatus } from '@prisma/client';

/**
 * ModerationRepository
 *
 * Handles data access for moderation operations:
 * - Log moderation actions
 * - Topic moderation (pin, lock, move, merge, delete)
 * - User moderation (warn, suspend, ban)
 * - Moderation log queries
 */

export interface CreateModerationLogData {
  moderatorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  metadata?: any;
}

export interface ModerationLogFilters {
  moderatorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ModerationLogPagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@injectable()
export class ModerationRepository {
  /**
   * Create moderation log entry
   */
  async createLog(data: CreateModerationLogData) {
    try {
      return await prisma.moderationLog.create({
        data: {
          moderatorId: data.moderatorId,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          reason: data.reason,
          metadata: data.metadata || Prisma.JsonNull,
        },
        include: {
          moderator: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'createLog' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Get moderation logs with filters and pagination
   */
  async findLogs(filters: ModerationLogFilters, pagination: ModerationLogPagination) {
    try {
      const where: any = {};

      if (filters.moderatorId) {
        where.moderatorId = filters.moderatorId;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.targetType) {
        where.targetType = filters.targetType;
      }

      if (filters.targetId) {
        where.targetId = filters.targetId;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const orderBy: any = {};
      orderBy[pagination.sortBy || 'createdAt'] = pagination.sortOrder || 'desc';

      const [logs, total] = await Promise.all([
        prisma.moderationLog.findMany({
          where,
          orderBy,
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
          include: {
            moderator: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
              },
            },
          },
        }),
        prisma.moderationLog.count({ where }),
      ]);

      return { logs, total };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'findLogs' },
        extra: { filters, pagination },
      });
      throw error;
    }
  }

  /**
   * Pin/unpin topic
   */
  async pinTopic(topicId: string, isPinned: boolean) {
    try {
      return await prisma.topic.update({
        where: { id: topicId },
        data: { isPinned },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'pinTopic' },
        extra: { topicId, isPinned },
      });
      throw error;
    }
  }

  /**
   * Lock/unlock topic
   */
  async lockTopic(topicId: string, isLocked: boolean) {
    try {
      return await prisma.topic.update({
        where: { id: topicId },
        data: { isLocked },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'lockTopic' },
        extra: { topicId, isLocked },
      });
      throw error;
    }
  }

  /**
   * Move topic to different category
   */
  async moveTopic(topicId: string, categoryId: string) {
    try {
      return await prisma.topic.update({
        where: { id: topicId },
        data: { categoryId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'moveTopic' },
        extra: { topicId, categoryId },
      });
      throw error;
    }
  }

  /**
   * Merge duplicate topics (move replies from source to target)
   */
  async mergeTopics(sourceTopicId: string, targetTopicId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Move all replies from source to target
        await tx.reply.updateMany({
          where: { topicId: sourceTopicId },
          data: { topicId: targetTopicId },
        });

        // Update target topic reply count
        const replyCount = await tx.reply.count({
          where: { topicId: targetTopicId, isDeleted: false },
        });

        await tx.topic.update({
          where: { id: targetTopicId },
          data: { replyCount },
        });

        // Soft delete source topic
        const deletedTopic = await tx.topic.update({
          where: { id: sourceTopicId },
          data: {
            status: TopicStatus.archived,
            replyCount: 0,
          },
        });

        return deletedTopic;
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'mergeTopics' },
        extra: { sourceTopicId, targetTopicId },
      });
      throw error;
    }
  }

  /**
   * Hard delete topic (admin only)
   */
  async hardDeleteTopic(topicId: string) {
    try {
      return await prisma.topic.delete({
        where: { id: topicId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'hardDeleteTopic' },
        extra: { topicId },
      });
      throw error;
    }
  }

  /**
   * Update user status (warn, suspend, ban)
   */
  async updateUserStatus(userId: string, status: string) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { status: status as any },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'updateUserStatus' },
        extra: { userId, status },
      });
      throw error;
    }
  }

  /**
   * Get topic by ID (for permission checks)
   */
  async getTopicById(topicId: string) {
    try {
      return await prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'getTopicById' },
        extra: { topicId },
      });
      throw error;
    }
  }

  /**
   * Get user by ID (for moderation)
   */
  async getUserById(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'getUserById' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Check if user is category moderator
   */
  async isCategoryModerator(userId: string, categoryId: string) {
    try {
      const moderator = await prisma.categoryModerator.findUnique({
        where: {
          categoryId_userId: {
            categoryId,
            userId,
          },
        },
      });

      return !!moderator;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'isCategoryModerator' },
        extra: { userId, categoryId },
      });
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string) {
    try {
      return await prisma.forumCategory.findUnique({
        where: { id: categoryId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'ModerationRepository', operation: 'getCategoryById' },
        extra: { categoryId },
      });
      throw error;
    }
  }
}
