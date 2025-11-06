import { injectable, inject } from 'tsyringe';
import { PrismaClient, Prisma } from '@prisma/client';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';
import { SpamDetectionService } from './spamDetectionService';
import {
  ContentType,
  ListContentQuery,
  ListReportedContentQuery,
  ApproveContentInput,
  RejectContentInput,
  HideContentInput,
  DeleteContentInput,
  BulkActionInput,
} from '../validators/contentModerationValidators';

/**
 * ContentModerationService
 *
 * Unified content moderation service for all content types:
 * - Articles, Topics, Replies, Jobs
 * - Approve/reject/hide/delete operations
 * - Spam detection and auto-flagging
 * - Bulk operations
 * - Audit logging
 */

export interface ModerationUser {
  id: string;
  role: string;
  username: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title?: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    email: string;
  };
  status: string;
  spamScore?: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
  flaggedBySystem: boolean;
}

export interface PaginatedContent {
  items: ContentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@injectable()
export class ContentModerationService {
  constructor(
    private prisma: PrismaClient,
    @inject('SpamDetectionService') private spamDetectionService: SpamDetectionService
  ) {}

  /**
   * List all content for moderation
   * Unified view across all content types
   */
  public async listContent(query: ListContentQuery, user: ModerationUser): Promise<PaginatedContent> {
    // Verify user is admin or moderator
    this.verifyModerationPermission(user);

    try {
      const { page, limit, sortBy, sortOrder, type, status, reported, flaggedBySystem, minSpamScore, authorId, startDate, endDate } = query;

      // Build content items from different sources
      let allItems: ContentItem[] = [];

      // Fetch from each content type
      if (!type || type === 'article') {
        const articles = await this.fetchArticles({ status, reported, flaggedBySystem, minSpamScore, authorId, startDate, endDate });
        allItems = allItems.concat(articles);
      }

      if (!type || type === 'topic') {
        const topics = await this.fetchTopics({ status, reported, flaggedBySystem, minSpamScore, authorId, startDate, endDate });
        allItems = allItems.concat(topics);
      }

      if (!type || type === 'reply') {
        const replies = await this.fetchReplies({ status, reported, flaggedBySystem, minSpamScore, authorId, startDate, endDate });
        allItems = allItems.concat(replies);
      }

      if (!type || type === 'job') {
        const jobs = await this.fetchJobs({ status, reported, flaggedBySystem, minSpamScore, authorId, startDate, endDate });
        allItems = allItems.concat(jobs);
      }

      // Sort items
      allItems = this.sortContent(allItems, sortBy, sortOrder);

      // Paginate
      const total = allItems.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = allItems.slice(startIndex, endIndex);

      return {
        items: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Error listing content for moderation:', error);
      Sentry.captureException(error);
      throw new Error('Failed to list content for moderation');
    }
  }

  /**
   * List reported content queue
   */
  public async listReportedContent(query: ListReportedContentQuery, user: ModerationUser): Promise<PaginatedContent> {
    this.verifyModerationPermission(user);

    try {
      const { page, limit, sortBy, sortOrder, type, reason, minReportCount } = query;

      // Fetch reports
      const where: any = {
        status: { in: ['pending', 'reviewing'] },
      };

      if (type) {
        where.reportableType = this.getReportableType(type);
      }

      if (reason) {
        where.reason = reason;
      }

      const reports = await this.prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by reportable
      const groupedReports = this.groupReportsByContent(reports);

      // Filter by report count
      let filteredReports = minReportCount
        ? groupedReports.filter((group) => group.reports.length >= minReportCount)
        : groupedReports;

      // Fetch content details for each reported item
      const contentItems: ContentItem[] = [];

      for (const group of filteredReports) {
        try {
          const contentType = this.getContentTypeFromReportable(group.reportableType);
          const content = await this.fetchContentById(contentType, group.reportableId);

          if (content) {
            contentItems.push({
              ...content,
              reportCount: group.reports.length,
            });
          }
        } catch (error) {
          logger.warn(`Failed to fetch content ${group.reportableType}:${group.reportableId}`, error);
        }
      }

      // Sort
      const sortedItems = this.sortContent(contentItems, sortBy, sortOrder);

      // Paginate
      const total = sortedItems.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = sortedItems.slice(startIndex, endIndex);

      return {
        items: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Error listing reported content:', error);
      Sentry.captureException(error);
      throw new Error('Failed to list reported content');
    }
  }

  /**
   * Approve content
   */
  public async approveContent(
    type: ContentType,
    id: string,
    input: ApproveContentInput,
    user: ModerationUser
  ): Promise<{ success: boolean; message: string }> {
    this.verifyModerationPermission(user);

    try {
      // Update content status
      await this.updateContentStatus(type, id, 'approved');

      // Create audit log
      await this.createAuditLog({
        moderatorId: user.id,
        action: 'approve_content',
        targetType: type,
        targetId: id,
        reason: input.note,
      });

      // Resolve related reports
      await this.resolveContentReports(type, id, 'resolved_no_action', user.id);

      logger.info(`Content approved: ${type}:${id} by ${user.username}`);

      return {
        success: true,
        message: 'Content approved successfully',
      };
    } catch (error) {
      logger.error(`Error approving content ${type}:${id}:`, error);
      Sentry.captureException(error);
      throw new Error('Failed to approve content');
    }
  }

  /**
   * Reject content
   */
  public async rejectContent(
    type: ContentType,
    id: string,
    input: RejectContentInput,
    user: ModerationUser
  ): Promise<{ success: boolean; message: string }> {
    this.verifyModerationPermission(user);

    try {
      // Update content status
      await this.updateContentStatus(type, id, 'rejected');

      // Create audit log
      await this.createAuditLog({
        moderatorId: user.id,
        action: 'reject_content',
        targetType: type,
        targetId: id,
        reason: input.reason,
      });

      // Resolve related reports
      await this.resolveContentReports(type, id, 'resolved_violation', user.id);

      // Notify author if requested
      if (input.notifyAuthor) {
        await this.notifyAuthor(type, id, 'rejected', input.reason);
      }

      logger.info(`Content rejected: ${type}:${id} by ${user.username}`);

      return {
        success: true,
        message: 'Content rejected successfully',
      };
    } catch (error) {
      logger.error(`Error rejecting content ${type}:${id}:`, error);
      Sentry.captureException(error);
      throw new Error('Failed to reject content');
    }
  }

  /**
   * Hide content from public view
   */
  public async hideContent(
    type: ContentType,
    id: string,
    input: HideContentInput,
    user: ModerationUser
  ): Promise<{ success: boolean; message: string }> {
    this.verifyModerationPermission(user);

    try {
      // Update content status
      await this.updateContentStatus(type, id, 'hidden');

      // Create audit log
      await this.createAuditLog({
        moderatorId: user.id,
        action: 'hide_content',
        targetType: type,
        targetId: id,
        reason: input.reason,
      });

      // Notify author if requested
      if (input.notifyAuthor) {
        await this.notifyAuthor(type, id, 'hidden', input.reason);
      }

      logger.info(`Content hidden: ${type}:${id} by ${user.username}`);

      return {
        success: true,
        message: 'Content hidden successfully',
      };
    } catch (error) {
      logger.error(`Error hiding content ${type}:${id}:`, error);
      Sentry.captureException(error);
      throw new Error('Failed to hide content');
    }
  }

  /**
   * Delete content (hard or soft delete)
   */
  public async deleteContent(
    type: ContentType,
    id: string,
    input: DeleteContentInput,
    user: ModerationUser
  ): Promise<{ success: boolean; message: string }> {
    // Only admins can hard delete
    if (input.hardDelete && user.role !== 'admin') {
      throw new Error('Only administrators can permanently delete content');
    }

    this.verifyModerationPermission(user);

    try {
      if (input.hardDelete) {
        // Hard delete
        await this.hardDeleteContent(type, id);
      } else {
        // Soft delete
        await this.updateContentStatus(type, id, 'deleted');
      }

      // Create audit log
      await this.createAuditLog({
        moderatorId: user.id,
        action: input.hardDelete ? 'hard_delete_content' : 'soft_delete_content',
        targetType: type,
        targetId: id,
        reason: input.reason,
      });

      // Resolve related reports
      await this.resolveContentReports(type, id, 'resolved_violation', user.id);

      logger.info(`Content deleted (hard: ${input.hardDelete}): ${type}:${id} by ${user.username}`);

      return {
        success: true,
        message: input.hardDelete ? 'Content permanently deleted' : 'Content deleted successfully',
      };
    } catch (error) {
      logger.error(`Error deleting content ${type}:${id}:`, error);
      Sentry.captureException(error);
      throw new Error('Failed to delete content');
    }
  }

  /**
   * Bulk action on multiple content items
   */
  public async bulkAction(
    input: BulkActionInput,
    user: ModerationUser
  ): Promise<{ success: boolean; processed: number; failed: number; errors: string[] }> {
    this.verifyModerationPermission(user);

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (const item of input.items) {
        try {
          switch (input.action) {
            case 'approve':
              await this.approveContent(item.type, item.id, {}, user);
              break;
            case 'reject':
              if (!input.reason) {
                throw new Error('Reason is required for reject action');
              }
              await this.rejectContent(
                item.type,
                item.id,
                { reason: input.reason, notifyAuthor: input.notifyAuthors },
                user
              );
              break;
            case 'hide':
              if (!input.reason) {
                throw new Error('Reason is required for hide action');
              }
              await this.hideContent(
                item.type,
                item.id,
                { reason: input.reason, notifyAuthor: input.notifyAuthors },
                user
              );
              break;
            case 'delete':
              if (!input.reason) {
                throw new Error('Reason is required for delete action');
              }
              await this.deleteContent(
                item.type,
                item.id,
                { reason: input.reason, hardDelete: false },
                user
              );
              break;
          }
          processed++;
        } catch (error) {
          failed++;
          errors.push(`${item.type}:${item.id} - ${(error as Error).message}`);
          logger.warn(`Bulk action failed for ${item.type}:${item.id}:`, error);
        }
      }

      logger.info(`Bulk ${input.action} completed: ${processed} processed, ${failed} failed`);

      return {
        success: failed === 0,
        processed,
        failed,
        errors,
      };
    } catch (error) {
      logger.error('Error executing bulk action:', error);
      Sentry.captureException(error);
      throw new Error('Failed to execute bulk action');
    }
  }

  /**
   * Auto-flag content with high spam score
   */
  public async autoFlagSpam(type: ContentType, id: string, content: string, title?: string): Promise<void> {
    try {
      const analysis = await this.spamDetectionService.analyzeContent(content, title);

      if (analysis.isSpam) {
        // Update content with spam score
        await this.updateContentSpamScore(type, id, analysis.spamScore);

        // Create audit log for auto-flag
        await this.createAuditLog({
          moderatorId: 'system',
          action: 'auto_flag_spam',
          targetType: type,
          targetId: id,
          reason: `Spam detected: ${analysis.reason} (score: ${analysis.spamScore})`,
          metadata: {
            spamScore: analysis.spamScore,
            flaggedKeywords: analysis.flaggedKeywords,
            confidence: analysis.confidence,
          },
        });

        logger.info(`Content auto-flagged as spam: ${type}:${id} (score: ${analysis.spamScore})`);
      }
    } catch (error) {
      logger.error(`Error auto-flagging spam for ${type}:${id}:`, error);
      // Don't throw - auto-flagging should not block content creation
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  private verifyModerationPermission(user: ModerationUser): void {
    if (!['admin', 'moderator'].includes(user.role)) {
      throw new Error('You do not have permission to perform moderation actions');
    }
  }

  private async fetchArticles(filters: any): Promise<ContentItem[]> {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };

    const articles = await this.prisma.article.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get report counts
    const articleIds = articles.map((a) => a.id);
    const reports = await this.getReportCounts('Article', articleIds);

    return articles.map((article) => ({
      id: article.id,
      type: 'article' as ContentType,
      title: article.title,
      content: article.excerpt || article.content.substring(0, 200),
      authorId: article.authorId,
      author: article.author,
      status: article.status,
      spamScore: 0, // TODO: Store spam score in article table
      reportCount: reports[article.id] || 0,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      flaggedBySystem: false,
    }));
  }

  private async fetchTopics(filters: any): Promise<ContentItem[]> {
    const where: any = {};

    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };

    const topics = await this.prisma.topic.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const topicIds = topics.map((t) => t.id);
    const reports = await this.getReportCounts('Topic', topicIds);

    return topics.map((topic) => ({
      id: topic.id,
      type: 'topic' as ContentType,
      title: topic.title,
      content: topic.content.substring(0, 200),
      authorId: topic.authorId,
      author: topic.author,
      status: 'approved', // Topics don't have status field
      spamScore: topic.spamScore || 0,
      reportCount: reports[topic.id] || 0,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      flaggedBySystem: (topic.spamScore || 0) > 75,
    }));
  }

  private async fetchReplies(filters: any): Promise<ContentItem[]> {
    const where: any = {};

    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };

    const replies = await this.prisma.reply.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit replies
    });

    const replyIds = replies.map((r) => r.id);
    const reports = await this.getReportCounts('Reply', replyIds);

    return replies.map((reply) => ({
      id: reply.id,
      type: 'reply' as ContentType,
      content: reply.content.substring(0, 200),
      authorId: reply.authorId,
      author: reply.author,
      status: 'approved',
      spamScore: reply.spamScore || 0,
      reportCount: reports[reply.id] || 0,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      flaggedBySystem: (reply.spamScore || 0) > 75,
    }));
  }

  private async fetchJobs(filters: any): Promise<ContentItem[]> {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.authorId) where.companyId = filters.authorId; // Jobs use companyId
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        company: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const jobIds = jobs.map((j) => j.id);
    const reports = await this.getReportCounts('Job', jobIds);

    return jobs.map((job) => ({
      id: job.id,
      type: 'job' as ContentType,
      title: job.title,
      content: job.description.substring(0, 200),
      authorId: job.companyId,
      author: job.company.user,
      status: job.status,
      spamScore: 0,
      reportCount: reports[job.id] || 0,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      flaggedBySystem: false,
    }));
  }

  private async getReportCounts(reportableType: string, ids: string[]): Promise<Record<string, number>> {
    if (ids.length === 0) return {};

    const reports = await this.prisma.report.groupBy({
      by: ['reportableId'],
      where: {
        reportableType,
        reportableId: { in: ids },
        status: { in: ['pending', 'reviewing'] },
      },
      _count: true,
    });

    const counts: Record<string, number> = {};
    for (const report of reports) {
      counts[report.reportableId] = report._count;
    }

    return counts;
  }

  private sortContent(items: ContentItem[], sortBy: string, sortOrder: string): ContentItem[] {
    return items.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'createdAt':
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aVal = a.updatedAt.getTime();
          bVal = b.updatedAt.getTime();
          break;
        case 'spamScore':
          aVal = a.spamScore || 0;
          bVal = b.spamScore || 0;
          break;
        case 'reportCount':
          aVal = a.reportCount || 0;
          bVal = b.reportCount || 0;
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  private async updateContentStatus(type: ContentType, id: string, status: string): Promise<void> {
    switch (type) {
      case 'article':
        await this.prisma.article.update({
          where: { id },
          data: { status },
        });
        break;
      case 'topic':
        // Topics don't have status field - use isDeleted for soft delete
        if (status === 'deleted') {
          await this.prisma.topic.update({
            where: { id },
            data: { isDeleted: true },
          });
        }
        break;
      case 'reply':
        // Replies don't have status - use isDeleted
        if (status === 'deleted') {
          await this.prisma.reply.update({
            where: { id },
            data: { isDeleted: true },
          });
        }
        break;
      case 'job':
        await this.prisma.job.update({
          where: { id },
          data: { status },
        });
        break;
    }
  }

  private async hardDeleteContent(type: ContentType, id: string): Promise<void> {
    switch (type) {
      case 'article':
        await this.prisma.article.delete({ where: { id } });
        break;
      case 'topic':
        await this.prisma.topic.delete({ where: { id } });
        break;
      case 'reply':
        await this.prisma.reply.delete({ where: { id } });
        break;
      case 'job':
        await this.prisma.job.delete({ where: { id } });
        break;
    }
  }

  private async updateContentSpamScore(type: ContentType, id: string, spamScore: number): Promise<void> {
    // Only topics and replies have spamScore field
    if (type === 'topic') {
      await this.prisma.topic.update({
        where: { id },
        data: { spamScore },
      });
    } else if (type === 'reply') {
      await this.prisma.reply.update({
        where: { id },
        data: { spamScore },
      });
    }
  }

  private async createAuditLog(data: {
    moderatorId: string;
    action: string;
    targetType: string;
    targetId: string;
    reason?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.prisma.moderationLog.create({
        data: {
          moderatorId: data.moderatorId === 'system' ? data.moderatorId : data.moderatorId,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          reason: data.reason,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        },
      });
    } catch (error) {
      logger.error('Error creating audit log:', error);
      // Don't throw - audit log failure should not block moderation action
    }
  }

  private async resolveContentReports(type: ContentType, id: string, resolution: string, moderatorId: string): Promise<void> {
    try {
      const reportableType = this.getReportableType(type);

      await this.prisma.report.updateMany({
        where: {
          reportableType,
          reportableId: id,
          status: { in: ['pending', 'reviewing'] },
        },
        data: {
          status: resolution,
          resolvedAt: new Date(),
          resolvedBy: moderatorId,
        },
      });
    } catch (error) {
      logger.error(`Error resolving reports for ${type}:${id}:`, error);
    }
  }

  private async notifyAuthor(type: ContentType, id: string, action: string, reason: string): Promise<void> {
    try {
      // TODO: Integrate with notification service
      logger.info(`Would notify author about ${action} on ${type}:${id}: ${reason}`);
    } catch (error) {
      logger.error('Error notifying author:', error);
    }
  }

  private getReportableType(contentType: ContentType): string {
    const mapping: Record<ContentType, string> = {
      article: 'Article',
      topic: 'Topic',
      reply: 'Reply',
      job: 'Job',
    };
    return mapping[contentType];
  }

  private getContentTypeFromReportable(reportableType: string): ContentType {
    const mapping: Record<string, ContentType> = {
      Article: 'article',
      Topic: 'topic',
      Reply: 'reply',
      Job: 'job',
    };
    return mapping[reportableType] || 'article';
  }

  private groupReportsByContent(reports: any[]): Array<{ reportableType: string; reportableId: string; reports: any[] }> {
    const groups: Record<string, any[]> = {};

    for (const report of reports) {
      const key = `${report.reportableType}:${report.reportableId}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(report);
    }

    return Object.entries(groups).map(([key, reports]) => {
      const [reportableType, reportableId] = key.split(':');
      return { reportableType, reportableId, reports };
    });
  }

  private async fetchContentById(type: ContentType, id: string): Promise<ContentItem | null> {
    try {
      switch (type) {
        case 'article': {
          const article = await this.prisma.article.findUnique({
            where: { id },
            include: { author: { select: { id: true, username: true, email: true } } },
          });
          if (!article) return null;
          return {
            id: article.id,
            type: 'article',
            title: article.title,
            content: article.excerpt || article.content.substring(0, 200),
            authorId: article.authorId,
            author: article.author,
            status: article.status,
            spamScore: 0,
            reportCount: 0,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
            flaggedBySystem: false,
          };
        }
        case 'topic': {
          const topic = await this.prisma.topic.findUnique({
            where: { id },
            include: { author: { select: { id: true, username: true, email: true } } },
          });
          if (!topic) return null;
          return {
            id: topic.id,
            type: 'topic',
            title: topic.title,
            content: topic.content.substring(0, 200),
            authorId: topic.authorId,
            author: topic.author,
            status: 'approved',
            spamScore: topic.spamScore || 0,
            reportCount: 0,
            createdAt: topic.createdAt,
            updatedAt: topic.updatedAt,
            flaggedBySystem: (topic.spamScore || 0) > 75,
          };
        }
        case 'reply': {
          const reply = await this.prisma.reply.findUnique({
            where: { id },
            include: { author: { select: { id: true, username: true, email: true } } },
          });
          if (!reply) return null;
          return {
            id: reply.id,
            type: 'reply',
            content: reply.content.substring(0, 200),
            authorId: reply.authorId,
            author: reply.author,
            status: 'approved',
            spamScore: reply.spamScore || 0,
            reportCount: 0,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            flaggedBySystem: (reply.spamScore || 0) > 75,
          };
        }
        case 'job': {
          const job = await this.prisma.job.findUnique({
            where: { id },
            include: {
              company: {
                include: {
                  user: { select: { id: true, username: true, email: true } },
                },
              },
            },
          });
          if (!job) return null;
          return {
            id: job.id,
            type: 'job',
            title: job.title,
            content: job.description.substring(0, 200),
            authorId: job.companyId,
            author: job.company.user,
            status: job.status,
            spamScore: 0,
            reportCount: 0,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
            flaggedBySystem: false,
          };
        }
      }
    } catch (error) {
      logger.error(`Error fetching content ${type}:${id}:`, error);
      return null;
    }
  }
}
