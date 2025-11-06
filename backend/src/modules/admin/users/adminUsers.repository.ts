import prisma from '@/config/database';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { GetUsersQuery, GetUserActivityQuery, GetUserReportsQuery } from './adminUsers.validation';

/**
 * AdminUsersRepository
 * Handles database operations for admin user management
 */
export class AdminUsersRepository {
  /**
   * Get paginated list of users with filters and search
   */
  async getUsers(query: GetUsersQuery) {
    const {
      page,
      limit,
      search,
      role,
      status,
      registrationDateFrom,
      registrationDateTo,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // Search filter (email, username, or ID)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { id: { equals: search } },
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Registration date filter
    if (registrationDateFrom || registrationDateTo) {
      where.createdAt = {};
      if (registrationDateFrom) {
        where.createdAt.gte = registrationDateFrom;
      }
      if (registrationDateTo) {
        where.createdAt.lte = registrationDateTo;
      }
    }

    // Build order by clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy === 'last_login_at' ? 'lastLoginAt' : sortBy === 'created_at' ? 'createdAt' : sortBy]: sortOrder,
    };

    // Execute query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          loginCount: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
            },
          },
          reputation: {
            select: {
              totalPoints: true,
            },
          },
          _count: {
            select: {
              articles: true,
              topics: true,
              replies: true,
              jobApplications: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID with full details (including private data)
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        privacySettings: true,
        reputation: true,
        oauthProviders: {
          select: {
            provider: true,
            createdAt: true,
          },
        },
        sessions: {
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            lastActiveAt: true,
            expiresAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            articles: true,
            topics: true,
            replies: true,
            jobApplications: true,
            bookmarks: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  }

  /**
   * Update user data
   */
  async updateUser(userId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        emailVerified: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Change user role
   */
  async changeUserRole(userId: string, role: UserRole) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Manually verify user email
   */
  async verifyUserEmail(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.suspended },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Ban user
   */
  async banUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.banned },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Soft delete user
   */
  async softDeleteUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.deleted },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Hard delete user (permanently remove from database)
   */
  async hardDeleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Get user activity history
   */
  async getUserActivity(userId: string, query: GetUserActivityQuery) {
    const { page, limit, type, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) dateFilter.gte = dateFrom;
    if (dateTo) dateFilter.lte = dateTo;

    // Get different types of activities based on filter
    const activities: Array<{
      type: string;
      action: string;
      timestamp: Date;
      details?: Record<string, unknown>;
    }> = [];

    // Get login history from sessions
    if (type === 'all' || type === 'login') {
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
        },
        select: {
          createdAt: true,
          ipAddress: true,
          userAgent: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: type === 'login' ? skip : 0,
      });

      sessions.forEach((session) => {
        activities.push({
          type: 'login',
          action: 'User logged in',
          timestamp: session.createdAt,
          details: {
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
          },
        });
      });
    }

    // Get content creation activities
    if (type === 'all' || type === 'content') {
      const [articles, topics, replies] = await Promise.all([
        prisma.article.findMany({
          where: {
            authorId: userId,
            ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
          },
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.topic.findMany({
          where: {
            authorId: userId,
            ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
          },
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.reply.findMany({
          where: {
            authorId: userId,
            ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
          },
          select: { id: true, topicId: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      articles.forEach((article) => {
        activities.push({
          type: 'content',
          action: 'Created article',
          timestamp: article.createdAt,
          details: { articleId: article.id, title: article.title },
        });
      });

      topics.forEach((topic) => {
        activities.push({
          type: 'content',
          action: 'Created topic',
          timestamp: topic.createdAt,
          details: { topicId: topic.id, title: topic.title },
        });
      });

      replies.forEach((reply) => {
        activities.push({
          type: 'content',
          action: 'Posted reply',
          timestamp: reply.createdAt,
          details: { replyId: reply.id, topicId: reply.topicId },
        });
      });
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(skip, skip + limit);

    return {
      activities: paginatedActivities,
      pagination: {
        page,
        limit,
        total: activities.length,
        totalPages: Math.ceil(activities.length / limit),
      },
    };
  }

  /**
   * Get reports against a user
   */
  async getUserReports(userId: string, query: GetUserReportsQuery) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {
      reportableType: 'user',
      reportableId: userId,
      ...(status ? { status } : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create admin audit log entry
   */
  async createAuditLog(data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    changes?: Record<string, unknown>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.adminAuditLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        changes: data.changes as Prisma.JsonValue,
        reason: data.reason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Get users by IDs (for bulk operations)
   */
  async getUsersByIds(userIds: string[]) {
    return prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
      },
    });
  }

  /**
   * Bulk update user status
   */
  async bulkUpdateStatus(userIds: string[], status: UserStatus) {
    return prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { status },
    });
  }
}

export default AdminUsersRepository;
