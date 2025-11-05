import { PrismaClient, Report, ReportReason, ReportStatus, Prisma } from '@prisma/client';
import { injectable, inject } from 'tsyringe';

/**
 * Report Repository
 *
 * Handles all database operations for content reports including:
 * - CRUD operations
 * - Filtering and pagination
 * - Report count aggregation
 * - Duplicate detection
 */

export interface CreateReportData {
  reporterId: string;
  reportableType: string;
  reportableId: string;
  reason: ReportReason;
  description?: string;
}

export interface UpdateReportData {
  status?: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNote?: string;
}

export interface ReportWithRelations extends Report {
  reporter: {
    id: string;
    username: string;
    email: string;
    profile: {
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  };
  resolver?: {
    id: string;
    username: string;
  } | null;
}

export interface ReportFilters {
  status?: ReportStatus;
  reason?: ReportReason;
  reportableType?: string;
  reporterId?: string;
}

export interface ReportPagination {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'status' | 'reason';
  sortOrder?: 'asc' | 'desc';
}

@injectable()
export class ReportRepository {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient
  ) {}

  /**
   * Create a new report
   * Automatically enforces unique constraint to prevent duplicates
   */
  async create(data: CreateReportData): Promise<ReportWithRelations> {
    const report = await this.prisma.report.create({
      data: {
        reporterId: data.reporterId,
        reportableType: data.reportableType,
        reportableId: data.reportableId,
        reason: data.reason,
        description: data.description,
        status: 'pending',
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return report;
  }

  /**
   * Check if a user has already reported this content
   */
  async hasUserReported(
    reporterId: string,
    reportableType: string,
    reportableId: string
  ): Promise<boolean> {
    const count = await this.prisma.report.count({
      where: {
        reporterId,
        reportableType,
        reportableId,
      },
    });

    return count > 0;
  }

  /**
   * Count reports for specific content
   */
  async countReportsForContent(
    reportableType: string,
    reportableId: string,
    status?: ReportStatus
  ): Promise<number> {
    const where: Prisma.ReportWhereInput = {
      reportableType,
      reportableId,
    };

    if (status) {
      where.status = status;
    }

    return await this.prisma.report.count({ where });
  }

  /**
   * Count unique reporters for specific content
   */
  async countUniqueReporters(
    reportableType: string,
    reportableId: string,
    status?: ReportStatus
  ): Promise<number> {
    const where: Prisma.ReportWhereInput = {
      reportableType,
      reportableId,
    };

    if (status) {
      where.status = status;
    }

    const reports = await this.prisma.report.findMany({
      where,
      select: {
        reporterId: true,
      },
      distinct: ['reporterId'],
    });

    return reports.length;
  }

  /**
   * Find report by ID
   */
  async findById(id: string): Promise<ReportWithRelations | null> {
    return await this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Find reports with filters and pagination
   */
  async findMany(
    filters: ReportFilters,
    pagination: ReportPagination
  ): Promise<{ reports: ReportWithRelations[]; total: number }> {
    const where: Prisma.ReportWhereInput = {};

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.reason) {
      where.reason = filters.reason;
    }

    if (filters.reportableType) {
      where.reportableType = filters.reportableType;
    }

    if (filters.reporterId) {
      where.reporterId = filters.reporterId;
    }

    // Define sorting
    const orderBy: Prisma.ReportOrderByWithRelationInput = {};
    if (pagination.sortBy) {
      orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Get total count
    const total = await this.prisma.report.count({ where });

    // Get paginated reports
    const reports = await this.prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return { reports, total };
  }

  /**
   * Update report
   */
  async update(id: string, data: UpdateReportData): Promise<Report> {
    return await this.prisma.report.update({
      where: { id },
      data,
    });
  }

  /**
   * Get report statistics
   */
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    reviewing: number;
    resolved: number;
    byReason: { reason: ReportReason; count: number }[];
  }> {
    const [total, pending, reviewing, resolved, byReason] = await Promise.all([
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.report.count({ where: { status: 'reviewing' } }),
      this.prisma.report.count({
        where: {
          status: {
            in: ['resolved_violation', 'resolved_no_action', 'dismissed'],
          },
        },
      }),
      this.prisma.report.groupBy({
        by: ['reason'],
        _count: {
          reason: true,
        },
      }),
    ]);

    return {
      total,
      pending,
      reviewing,
      resolved,
      byReason: byReason.map((item) => ({
        reason: item.reason,
        count: item._count.reason,
      })),
    };
  }

  /**
   * Get reports by content (for checking auto-hide threshold)
   */
  async getReportsByContent(
    reportableType: string,
    reportableId: string
  ): Promise<ReportWithRelations[]> {
    return await this.prisma.report.findMany({
      where: {
        reportableType,
        reportableId,
        status: 'pending',
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Get reported content details (Topic or Reply)
   */
  async getReportedContent(
    reportableType: string,
    reportableId: string
  ): Promise<any | null> {
    if (reportableType === 'Topic') {
      return await this.prisma.topic.findUnique({
        where: { id: reportableId },
        select: {
          id: true,
          title: true,
          content: true,
          slug: true,
          isHidden: true,
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    } else if (reportableType === 'Reply') {
      return await this.prisma.reply.findUnique({
        where: { id: reportableId },
        select: {
          id: true,
          content: true,
          isHidden: true,
          topicId: true,
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    }

    return null;
  }

  /**
   * Track false reports (when resolved as 'resolved_no_action' or 'dismissed')
   */
  async getFalseReportCount(userId: string): Promise<number> {
    return await this.prisma.report.count({
      where: {
        reporterId: userId,
        status: {
          in: ['resolved_no_action', 'dismissed'],
        },
      },
    });
  }
}
