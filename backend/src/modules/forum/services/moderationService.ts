import { injectable, inject } from 'tsyringe';
import * as Sentry from '@sentry/node';
import {
  ModerationRepository,
  CreateModerationLogData,
  ModerationLogFilters,
  ModerationLogPagination,
} from '../repositories/ModerationRepository';
import { UserRole, UserStatus } from '@prisma/client';

interface User {
  id: string;
  role: UserRole;
}

interface PinTopicInput {
  isPinned: boolean;
  reason?: string;
}

interface LockTopicInput {
  isLocked: boolean;
  reason?: string;
}

interface MoveTopicInput {
  categoryId: string;
  reason?: string;
}

interface MergeTopicsInput {
  targetTopicId: string;
  reason?: string;
}

interface WarnUserInput {
  reason: string;
}

interface SuspendUserInput {
  reason: string;
  duration?: number; // in days
}

interface BanUserInput {
  reason: string;
}

/**
 * ModerationService
 *
 * Business logic for moderation operations:
 * - Permission checks
 * - Topic moderation (pin, lock, move, merge, delete)
 * - User moderation (warn, suspend, ban)
 * - Moderation logging
 */
@injectable()
export class ModerationService {
  constructor(
    @inject('ModerationRepository')
    private moderationRepository: ModerationRepository
  ) {}

  /**
   * Pin or unpin a topic
   */
  async pinTopic(topicId: string, input: PinTopicInput, moderator: User) {
    try {
      // Permission check
      await this.checkModeratorPermission(moderator, topicId);

      // Pin/unpin topic
      const topic = await this.moderationRepository.pinTopic(topicId, input.isPinned);

      // Log action
      await this.logModerationAction({
        moderatorId: moderator.id,
        action: input.isPinned ? 'topic_pinned' : 'topic_unpinned',
        targetType: 'topic',
        targetId: topicId,
        reason: input.reason,
      });

      Sentry.addBreadcrumb({
        category: 'moderation',
        message: input.isPinned ? 'Topic pinned' : 'Topic unpinned',
        level: 'info',
        data: { topicId, moderatorId: moderator.id },
      });

      return topic;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'pinTopic' },
        extra: { topicId, input, moderatorId: moderator.id },
      });
      throw error;
    }
  }

  /**
   * Lock or unlock a topic
   */
  async lockTopic(topicId: string, input: LockTopicInput, moderator: User) {
    try {
      // Permission check
      await this.checkModeratorPermission(moderator, topicId);

      // Lock/unlock topic
      const topic = await this.moderationRepository.lockTopic(topicId, input.isLocked);

      // Log action
      await this.logModerationAction({
        moderatorId: moderator.id,
        action: input.isLocked ? 'topic_locked' : 'topic_unlocked',
        targetType: 'topic',
        targetId: topicId,
        reason: input.reason,
      });

      Sentry.addBreadcrumb({
        category: 'moderation',
        message: input.isLocked ? 'Topic locked' : 'Topic unlocked',
        level: 'info',
        data: { topicId, moderatorId: moderator.id },
      });

      return topic;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'lockTopic' },
        extra: { topicId, input, moderatorId: moderator.id },
      });
      throw error;
    }
  }

  /**
   * Move topic to different category
   */
  async moveTopic(topicId: string, input: MoveTopicInput, moderator: User) {
    try {
      // Permission check
      await this.checkModeratorPermission(moderator, topicId);

      // Verify target category exists
      const targetCategory = await this.moderationRepository.getCategoryById(input.categoryId);
      if (!targetCategory) {
        throw new Error('Target category not found');
      }

      // Check moderator has permission for target category (or is admin)
      if (moderator.role !== UserRole.admin) {
        const isModerator = await this.moderationRepository.isCategoryModerator(
          moderator.id,
          input.categoryId
        );
        if (!isModerator) {
          throw new Error('You do not have permission to move topics to this category');
        }
      }

      // Move topic
      const topic = await this.moderationRepository.moveTopic(topicId, input.categoryId);

      // Log action
      await this.logModerationAction({
        moderatorId: moderator.id,
        action: 'topic_moved',
        targetType: 'topic',
        targetId: topicId,
        reason: input.reason,
        metadata: {
          newCategoryId: input.categoryId,
          newCategoryName: targetCategory.name,
        },
      });

      Sentry.addBreadcrumb({
        category: 'moderation',
        message: 'Topic moved',
        level: 'info',
        data: { topicId, categoryId: input.categoryId, moderatorId: moderator.id },
      });

      return topic;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'moveTopic' },
        extra: { topicId, input, moderatorId: moderator.id },
      });
      throw error;
    }
  }

  /**
   * Merge duplicate topics
   */
  async mergeTopics(sourceTopicId: string, input: MergeTopicsInput, moderator: User) {
    try {
      // Permission check for both topics
      await this.checkModeratorPermission(moderator, sourceTopicId);
      await this.checkModeratorPermission(moderator, input.targetTopicId);

      // Verify both topics exist
      const [sourceTopic, targetTopic] = await Promise.all([
        this.moderationRepository.getTopicById(sourceTopicId),
        this.moderationRepository.getTopicById(input.targetTopicId),
      ]);

      if (!sourceTopic) {
        throw new Error('Source topic not found');
      }

      if (!targetTopic) {
        throw new Error('Target topic not found');
      }

      if (sourceTopic.id === targetTopic.id) {
        throw new Error('Cannot merge a topic with itself');
      }

      // Merge topics
      await this.moderationRepository.mergeTopics(sourceTopicId, input.targetTopicId);

      // Log action
      await this.logModerationAction({
        moderatorId: moderator.id,
        action: 'topics_merged',
        targetType: 'topic',
        targetId: sourceTopicId,
        reason: input.reason,
        metadata: {
          targetTopicId: input.targetTopicId,
          targetTopicTitle: targetTopic.title,
          sourceTopicTitle: sourceTopic.title,
        },
      });

      Sentry.addBreadcrumb({
        category: 'moderation',
        message: 'Topics merged',
        level: 'info',
        data: { sourceTopicId, targetTopicId: input.targetTopicId, moderatorId: moderator.id },
      });

      return {
        message: 'Topics merged successfully',
        targetTopicId: input.targetTopicId,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'mergeTopics' },
        extra: { sourceTopicId, input, moderatorId: moderator.id },
      });
      throw error;
    }
  }

  /**
   * Hard delete topic (admin only)
   */
  async hardDeleteTopic(topicId: string, reason: string, moderator: User) {
    try {
      // Only admins can hard delete
      if (moderator.role !== UserRole.admin) {
        throw new Error('Only administrators can permanently delete topics');
      }

      // Get topic for logging
      const topic = await this.moderationRepository.getTopicById(topicId);
      if (!topic) {
        throw new Error('Topic not found');
      }

      // Hard delete
      await this.moderationRepository.hardDeleteTopic(topicId);

      // Log action
      await this.logModerationAction({
        moderatorId: moderator.id,
        action: 'topic_deleted_permanently',
        targetType: 'topic',
        targetId: topicId,
        reason,
        metadata: {
          topicTitle: topic.title,
          authorId: topic.authorId,
        },
      });

      Sentry.addBreadcrumb({
        category: 'moderation',
        message: 'Topic permanently deleted',
        level: 'warning',
        data: { topicId, moderatorId: moderator.id },
      });

      return { message: 'Topic permanently deleted' };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'hardDeleteTopic' },
        extra: { topicId, reason, moderatorId: moderator.id },
      });
      throw error;
    }
  }

  /**
   * Issue warning to user
   */
  async warnUser(userId: string, input: WarnUserInput, moderator: User) {
    try {
      // Only moderators and admins can warn
      if (moderator.role !== UserRole.moderator && moderator.role !== UserRole.admin) {
        throw new Error('Only moderators and administrators can issue warnings');
      }

      // Get user
      const user = await this.moderationRepository.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Cannot warn admins
      if (user.role === UserRole.admin) {
        throw new Error('Cannot warn administrators');
      }

      // Moderators can only warn regular users, not other moderators
      if (moderator.role === UserRole.moderator && user.role === UserRole.moderator) {
        throw new Error('Moderators cannot warn other moderators');
      }

      // Log action (warning doesn't change user status)
      await this.logModerationAction({
        moderatorId: moderator.id,
        action: 'user_warned',
        targetType: 'user',
        targetId: userId,
        reason: input.reason,
      });

      Sentry.addBreadcrumb({
        category: 'moderation',
        message: 'User warned',
        level: 'info',
        data: { userId, moderatorId: moderator.id },
      });

      return {
        message: 'Warning issued successfully',
        user: {
          id: user.id,
          username: user.username,
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'warnUser' },
        extra: { userId, input, moderatorId: moderator.id },
      });
      throw error;
    }
  }

  /**
   * Suspend user temporarily
   */
  async suspendUser(userId: string, input: SuspendUserInput, moderator: User) {
    try {
      // Only moderators and admins can suspend
      if (moderator.role !== UserRole.moderator && moderator.role !== UserRole.admin) {
        throw new Error('Only moderators and administrators can suspend users');
      }

      // Get user
      const user = await this.moderationRepository.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Cannot suspend admins
      if (user.role === UserRole.admin) {
        throw new Error('Cannot suspend administrators');
      }

      // Moderators can only suspend regular users, not other moderators
      if (moderator.role === UserRole.moderator && user.role === UserRole.moderator) {
        throw new Error('Moderators cannot suspend other moderators');
      }

      // Update user status
      await this.moderationRepository.updateUserStatus(userId, UserStatus.suspended);

      // Log action
      await this.logModerationAction({
        moderatorId: moderator.id,
        action: 'user_suspended',
        targetType: 'user',
        targetId: userId,
        reason: input.reason,
        metadata: {
          duration: input.duration,
          username: user.username,
        },
      });

      Sentry.addBreadcrumb({
        category: 'moderation',
        message: 'User suspended',
        level: 'warning',
        data: { userId, duration: input.duration, moderatorId: moderator.id },
      });

      return {
        message: 'User suspended successfully',
        user: {
          id: user.id,
          username: user.username,
          status: UserStatus.suspended,
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'suspendUser' },
        extra: { userId, input, moderatorId: moderator.id },
      });
      throw error;
    }
  }

  /**
   * Ban user permanently
   */
  async banUser(userId: string, input: BanUserInput, moderator: User) {
    try {
      // Only admins can ban
      if (moderator.role !== UserRole.admin) {
        throw new Error('Only administrators can permanently ban users');
      }

      // Get user
      const user = await this.moderationRepository.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Cannot ban other admins
      if (user.role === UserRole.admin) {
        throw new Error('Cannot ban administrators');
      }

      // Update user status
      await this.moderationRepository.updateUserStatus(userId, UserStatus.banned);

      // Log action
      await this.logModerationAction({
        moderatorId: moderator.id,
        action: 'user_banned',
        targetType: 'user',
        targetId: userId,
        reason: input.reason,
        metadata: {
          username: user.username,
        },
      });

      Sentry.addBreadcrumb({
        category: 'moderation',
        message: 'User banned',
        level: 'error',
        data: { userId, moderatorId: moderator.id },
      });

      return {
        message: 'User banned successfully',
        user: {
          id: user.id,
          username: user.username,
          status: UserStatus.banned,
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'banUser' },
        extra: { userId, input, moderatorId: moderator.id },
      });
      throw error;
    }
  }

  /**
   * Get moderation logs
   */
  async getModerationLogs(
    filters: ModerationLogFilters,
    pagination: ModerationLogPagination,
    moderator: User
  ) {
    try {
      // Only moderators and admins can view logs
      if (moderator.role !== UserRole.moderator && moderator.role !== UserRole.admin) {
        throw new Error('Only moderators and administrators can view moderation logs');
      }

      const result = await this.moderationRepository.findLogs(filters, pagination);

      return {
        logs: result.logs,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'getModerationLogs' },
        extra: { filters, pagination, moderatorId: moderator.id },
      });
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Check if user has moderator permission for a topic
   */
  private async checkModeratorPermission(moderator: User, topicId: string): Promise<void> {
    // Admins have permission for everything
    if (moderator.role === UserRole.admin) {
      return;
    }

    // Must be at least a moderator
    if (moderator.role !== UserRole.moderator) {
      throw new Error('Only moderators and administrators can perform moderation actions');
    }

    // Get topic to check category
    const topic = await this.moderationRepository.getTopicById(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    // Check if moderator has permission for this category
    const isCategoryModerator = await this.moderationRepository.isCategoryModerator(
      moderator.id,
      topic.categoryId
    );

    if (!isCategoryModerator) {
      throw new Error('You do not have moderator permissions for this category');
    }
  }

  /**
   * Log moderation action
   */
  private async logModerationAction(data: CreateModerationLogData): Promise<void> {
    try {
      await this.moderationRepository.createLog(data);
    } catch (error) {
      // Don't fail the operation if logging fails
      Sentry.captureException(error, {
        tags: { module: 'moderation', operation: 'logModerationAction' },
        extra: { data },
      });
    }
  }
}
