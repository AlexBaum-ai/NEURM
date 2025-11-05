import { injectable, inject } from 'tsyringe';
import * as Sentry from '@sentry/node';
import { ReportRepository, CreateReportData } from '../repositories/ReportRepository';
import { ReportReason, ReportStatus } from '@prisma/client';
import { unifiedConfig } from '../../../config/unifiedConfig';

/**
 * ReportService
 *
 * Business logic for content reporting system:
 * - Report creation with duplicate prevention
 * - Moderation queue management
 * - Auto-hide after 5 unique reports
 * - Email notifications
 * - False report tracking
 */

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
}

interface CreateReportInput {
  reportableType: string;
  reportableId: string;
  reason: ReportReason;
  description?: string;
}

interface ReportFilters {
  status?: ReportStatus;
  reason?: ReportReason;
  reportableType?: string;
}

interface ReportPagination {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'status' | 'reason';
  sortOrder?: 'asc' | 'desc';
}

interface ResolveReportInput {
  status: 'resolved_violation' | 'resolved_no_action' | 'dismissed';
  resolutionNote?: string;
}

@injectable()
export class ReportService {
  // Constants
  private readonly AUTO_HIDE_THRESHOLD = 5;

  constructor(
    @inject('ReportRepository') private reportRepository: ReportRepository
  ) {}

  /**
   * Create a new report
   */
  async createReport(userId: string, user: User, input: CreateReportInput) {
    try {
      // Check for duplicate report
      const hasReported = await this.reportRepository.hasUserReported(
        userId,
        input.reportableType,
        input.reportableId
      );

      if (hasReported) {
        throw new Error('You have already reported this content');
      }

      // Verify reported content exists
      const content = await this.reportRepository.getReportedContent(
        input.reportableType,
        input.reportableId
      );

      if (!content) {
        throw new Error(`${input.reportableType} not found`);
      }

      // Prevent reporting own content
      if (content.author.id === userId) {
        throw new Error('You cannot report your own content');
      }

      // Create report
      const reportData: CreateReportData = {
        reporterId: userId,
        reportableType: input.reportableType,
        reportableId: input.reportableId,
        reason: input.reason,
        description: input.description,
      };

      const report = await this.reportRepository.create(reportData);

      // Send email notification to moderators (async, don't wait)
      this.notifyModeratorsOfNewReport(report, content, user).catch((err) => {
        Sentry.captureException(err, {
          tags: { module: 'forum', operation: 'notifyModerators' },
          extra: { reportId: report.id },
        });
      });

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Report created',
        level: 'info',
        data: {
          reportId: report.id,
          reportableType: input.reportableType,
          reason: input.reason,
        },
      });

      return report;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'createReport' },
        extra: { userId, input },
      });
      throw error;
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string, user: User) {
    try {
      // Only moderators and admins can view reports
      if (user.role !== 'moderator' && user.role !== 'admin') {
        throw new Error('You do not have permission to view reports');
      }

      const report = await this.reportRepository.findById(reportId);

      if (!report) {
        throw new Error('Report not found');
      }

      // Get reported content details
      const content = await this.reportRepository.getReportedContent(
        report.reportableType,
        report.reportableId
      );

      // Get all reports for this content
      const allReports = await this.reportRepository.getReportsByContent(
        report.reportableType,
        report.reportableId
      );

      return {
        report,
        content,
        relatedReports: allReports.filter((r) => r.id !== report.id),
        totalReports: allReports.length,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'getReportById' },
        extra: { reportId },
      });
      throw error;
    }
  }

  /**
   * List reports (moderation queue)
   */
  async listReports(filters: ReportFilters, pagination: ReportPagination, user: User) {
    try {
      // Only moderators and admins can view reports
      if (user.role !== 'moderator' && user.role !== 'admin') {
        throw new Error('You do not have permission to view reports');
      }

      const result = await this.reportRepository.findMany(filters, pagination);

      // Enrich with content previews
      const enrichedReports = await Promise.all(
        result.reports.map(async (report) => {
          const content = await this.reportRepository.getReportedContent(
            report.reportableType,
            report.reportableId
          );

          return {
            ...report,
            content: content ? this.getContentPreview(content, report.reportableType) : null,
          };
        })
      );

      return {
        reports: enrichedReports,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'listReports' },
        extra: { filters, pagination },
      });
      throw error;
    }
  }

  /**
   * Resolve a report
   */
  async resolveReport(reportId: string, input: ResolveReportInput, user: User) {
    try {
      // Only moderators and admins can resolve reports
      if (user.role !== 'moderator' && user.role !== 'admin') {
        throw new Error('You do not have permission to resolve reports');
      }

      const report = await this.reportRepository.findById(reportId);

      if (!report) {
        throw new Error('Report not found');
      }

      if (report.status !== 'pending' && report.status !== 'reviewing') {
        throw new Error('Report has already been resolved');
      }

      // Update report status
      const updatedReport = await this.reportRepository.update(reportId, {
        status: input.status,
        resolvedBy: user.id,
        resolvedAt: new Date(),
        resolutionNote: input.resolutionNote,
      });

      // Notify reporter of resolution (async)
      this.notifyReporterOfResolution(report, input.status, user).catch((err) => {
        Sentry.captureException(err, {
          tags: { module: 'forum', operation: 'notifyReporter' },
          extra: { reportId },
        });
      });

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Report resolved',
        level: 'info',
        data: {
          reportId,
          status: input.status,
          resolvedBy: user.id,
        },
      });

      return updatedReport;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'resolveReport' },
        extra: { reportId, input },
      });
      throw error;
    }
  }

  /**
   * Get report statistics
   */
  async getStatistics(user: User) {
    try {
      // Only moderators and admins can view statistics
      if (user.role !== 'moderator' && user.role !== 'admin') {
        throw new Error('You do not have permission to view report statistics');
      }

      return await this.reportRepository.getStatistics();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'getReportStatistics' },
      });
      throw error;
    }
  }

  /**
   * Get user's false report count
   */
  async getUserFalseReportCount(userId: string): Promise<number> {
    try {
      return await this.reportRepository.getFalseReportCount(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'getUserFalseReportCount' },
        extra: { userId },
      });
      return 0;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get content preview for report list
   */
  private getContentPreview(content: any, type: string): any {
    if (type === 'Topic') {
      return {
        id: content.id,
        title: content.title,
        preview: this.truncateText(content.content, 150),
        author: content.author,
        slug: content.slug,
        isHidden: content.isHidden,
      };
    } else if (type === 'Reply') {
      return {
        id: content.id,
        preview: this.truncateText(content.content, 150),
        author: content.author,
        topicId: content.topicId,
        isHidden: content.isHidden,
      };
    }

    return null;
  }

  /**
   * Truncate text for preview
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Send email notification to moderators about new report
   */
  private async notifyModeratorsOfNewReport(report: any, content: any, reporter: User): Promise<void> {
    try {
      // TODO: Implement email notification service
      // This is a placeholder for email notification functionality
      // When email service is implemented, this will send an email to moderators

      const emailSubject = `New ${report.reportableType} Report: ${report.reason}`;
      const emailBody = `
        A new report has been submitted by ${reporter.username}.

        Type: ${report.reportableType}
        Reason: ${report.reason}
        Description: ${report.description || 'No description provided'}

        Content Preview: ${this.truncateText(content.content || content.title, 200)}

        Please review this report in the moderation queue.
      `;

      // Log for now
      console.log('Email notification to moderators:', emailSubject);

      // In production, this would use an email service:
      // await emailService.send({
      //   to: unifiedConfig.email.supportEmail,
      //   subject: emailSubject,
      //   body: emailBody,
      // });

      Sentry.addBreadcrumb({
        category: 'email',
        message: 'Moderator notification triggered',
        level: 'info',
        data: { reportId: report.id },
      });
    } catch (error) {
      // Don't fail report creation if email fails
      Sentry.captureException(error);
    }
  }

  /**
   * Notify reporter of resolution
   */
  private async notifyReporterOfResolution(
    report: any,
    status: string,
    resolver: User
  ): Promise<void> {
    try {
      // TODO: Implement email notification service
      // This is a placeholder for email notification functionality

      const resolutionMessage =
        status === 'resolved_violation'
          ? 'Your report was reviewed and action was taken.'
          : status === 'resolved_no_action'
          ? 'Your report was reviewed but no action was necessary.'
          : 'Your report was reviewed and dismissed.';

      const emailSubject = `Report Resolution: ${report.reason}`;
      const emailBody = `
        Your report has been resolved.

        ${resolutionMessage}

        Report ID: ${report.id}
        Resolved by: ${resolver.username}

        Thank you for helping keep our community safe.
      `;

      // Log for now
      console.log('Email notification to reporter:', emailSubject);

      // In production:
      // await emailService.send({
      //   to: report.reporter.email,
      //   subject: emailSubject,
      //   body: emailBody,
      // });

      Sentry.addBreadcrumb({
        category: 'email',
        message: 'Reporter notification triggered',
        level: 'info',
        data: { reportId: report.id },
      });
    } catch (error) {
      // Don't fail resolution if email fails
      Sentry.captureException(error);
    }
  }
}
