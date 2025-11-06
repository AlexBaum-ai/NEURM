import { PrismaClient, DigestType, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

/**
 * DigestRepository
 * Database operations for email digests and digest preferences
 */
export class DigestRepository {
  // ============================================================================
  // DIGEST PREFERENCES
  // ============================================================================

  /**
   * Get user's digest preferences
   */
  async getDigestPreferences(userId: string) {
    try {
      return await prisma.digestPreference.findUnique({
        where: { userId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getDigestPreferences' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Create or update digest preferences
   */
  async upsertDigestPreferences(
    data: Prisma.DigestPreferenceCreateInput | Prisma.DigestPreferenceUpdateInput & { userId: string }
  ) {
    try {
      const userId = 'userId' in data ? data.userId : (data.user as any).connect.id;

      return await prisma.digestPreference.upsert({
        where: { userId },
        create: data as Prisma.DigestPreferenceCreateInput,
        update: data as Prisma.DigestPreferenceUpdateInput,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'upsertDigestPreferences' },
      });
      throw error;
    }
  }

  /**
   * Update last sent digest timestamp
   */
  async updateLastDigestSent(userId: string, type: DigestType) {
    try {
      const updateData =
        type === 'daily'
          ? { lastDailyDigest: new Date() }
          : { lastWeeklyDigest: new Date() };

      return await prisma.digestPreference.update({
        where: { userId },
        data: updateData,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'updateLastDigestSent' },
        extra: { userId, type },
      });
      throw error;
    }
  }

  // ============================================================================
  // EMAIL DIGEST OPERATIONS
  // ============================================================================

  /**
   * Create email digest record
   */
  async createEmailDigest(data: {
    userId: string;
    type: DigestType;
    emailTo: string;
    subject: string;
    contentSummary: any;
    itemCount: number;
  }) {
    try {
      const trackingToken = uuid();

      return await prisma.emailDigest.create({
        data: {
          ...data,
          sentAt: new Date(),
          trackingToken,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'createEmailDigest' },
        extra: { userId: data.userId, type: data.type },
      });
      throw error;
    }
  }

  /**
   * Get email digest by tracking token
   */
  async getDigestByTrackingToken(trackingToken: string) {
    try {
      return await prisma.emailDigest.findUnique({
        where: { trackingToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getDigestByTrackingToken' },
        extra: { trackingToken },
      });
      throw error;
    }
  }

  /**
   * Mark digest as opened
   */
  async markDigestOpened(digestId: string) {
    try {
      return await prisma.emailDigest.update({
        where: { id: digestId },
        data: {
          openedAt: new Date(),
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'markDigestOpened' },
        extra: { digestId },
      });
      throw error;
    }
  }

  /**
   * Increment digest click count
   */
  async incrementDigestClickCount(digestId: string) {
    try {
      return await prisma.emailDigest.update({
        where: { id: digestId },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'incrementDigestClickCount' },
        extra: { digestId },
      });
      throw error;
    }
  }

  /**
   * Mark digest as unsubscribed
   */
  async markDigestUnsubscribed(digestId: string) {
    try {
      return await prisma.emailDigest.update({
        where: { id: digestId },
        data: {
          unsubscribedAt: new Date(),
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'markDigestUnsubscribed' },
        extra: { digestId },
      });
      throw error;
    }
  }

  /**
   * Get user's recent digests
   */
  async getUserDigests(userId: string, limit: number = 10) {
    try {
      return await prisma.emailDigest.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getUserDigests' },
        extra: { userId, limit },
      });
      throw error;
    }
  }

  /**
   * Check if digest was sent recently (rate limiting)
   */
  async wasDigestSentRecently(userId: string, type: DigestType, hoursAgo: number = 20) {
    try {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      const recent = await prisma.emailDigest.findFirst({
        where: {
          userId,
          type,
          sentAt: {
            gte: since,
          },
        },
      });

      return recent !== null;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'wasDigestSentRecently' },
        extra: { userId, type, hoursAgo },
      });
      throw error;
    }
  }

  // ============================================================================
  // EMAIL TRACKING EVENTS
  // ============================================================================

  /**
   * Create tracking event
   */
  async createTrackingEvent(data: {
    digestId?: string;
    eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
    linkUrl?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      return await prisma.emailTrackingEvent.create({
        data,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'createTrackingEvent' },
        extra: { digestId: data.digestId, eventType: data.eventType },
      });
      throw error;
    }
  }

  // ============================================================================
  // CONTENT AGGREGATION QUERIES
  // ============================================================================

  /**
   * Get user's followed categories, tags, and models for personalization
   */
  async getUserFollows(userId: string) {
    try {
      const follows = await prisma.polymorphicFollow.findMany({
        where: { followerId: userId },
        select: {
          followableType: true,
          followableId: true,
        },
      });

      const categories = follows
        .filter((f) => f.followableType === 'category')
        .map((f) => f.followableId);
      const tags = follows
        .filter((f) => f.followableType === 'tag')
        .map((f) => f.followableId);
      const models = follows
        .filter((f) => f.followableType === 'model')
        .map((f) => f.followableId);

      return { categories, tags, models };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getUserFollows' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get top articles for digest (personalized)
   */
  async getTopArticles(params: {
    categories?: string[];
    tags?: string[];
    since: Date;
    limit: number;
  }) {
    try {
      const { categories, tags, since, limit } = params;

      const whereClause: any = {
        status: 'published',
        publishedAt: {
          gte: since,
        },
      };

      // Add category filter if user follows categories
      if (categories && categories.length > 0) {
        whereClause.categoryId = {
          in: categories,
        };
      }

      return await prisma.article.findMany({
        where: whereClause,
        orderBy: [
          { viewCount: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: limit,
        include: {
          author: {
            select: {
              username: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getTopArticles' },
      });
      throw error;
    }
  }

  /**
   * Get trending forum discussions
   */
  async getTrendingDiscussions(params: {
    categories?: string[];
    since: Date;
    limit: number;
  }) {
    try {
      const { categories, since, limit } = params;

      const whereClause: any = {
        status: 'open',
        createdAt: {
          gte: since,
        },
      };

      if (categories && categories.length > 0) {
        whereClause.categoryId = {
          in: categories,
        };
      }

      return await prisma.topic.findMany({
        where: whereClause,
        orderBy: [
          { viewCount: 'desc' },
          { replyCount: 'desc' },
        ],
        take: limit,
        include: {
          author: {
            select: {
              username: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getTrendingDiscussions' },
      });
      throw error;
    }
  }

  /**
   * Get new job matches for user
   */
  async getNewJobMatches(userId: string, since: Date, limit: number) {
    try {
      return await prisma.jobMatch.findMany({
        where: {
          userId,
          dismissed: false,
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          matchScore: 'desc',
        },
        take: limit,
        include: {
          job: {
            include: {
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getNewJobMatches' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getActivitySummary(userId: string, since: Date) {
    try {
      // Get new followers
      const newFollowers = await prisma.follow.count({
        where: {
          followingId: userId,
          createdAt: {
            gte: since,
          },
        },
      });

      // Get replies to user's topics
      const userTopics = await prisma.topic.findMany({
        where: { authorId: userId },
        select: { id: true },
      });

      const topicIds = userTopics.map((t) => t.id);

      const topicReplies = await prisma.reply.count({
        where: {
          topicId: {
            in: topicIds,
          },
          authorId: {
            not: userId, // Don't count own replies
          },
          createdAt: {
            gte: since,
          },
        },
      });

      // Get upvotes on user's content
      const upvotes =
        (await prisma.topicVote.count({
          where: {
            topic: {
              authorId: userId,
            },
            value: 1,
            createdAt: {
              gte: since,
            },
          },
        })) +
        (await prisma.replyVote.count({
          where: {
            reply: {
              authorId: userId,
            },
            value: 1,
            createdAt: {
              gte: since,
            },
          },
        }));

      // Get badges earned
      const badgesEarned = await prisma.userBadge.count({
        where: {
          userId,
          earnedAt: {
            gte: since,
          },
        },
      });

      return {
        newFollowers,
        topicReplies,
        upvotes,
        badgesEarned,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getActivitySummary' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get users eligible for daily digest at a specific time
   */
  async getUsersForDailyDigest(time: string, timezones: string[]) {
    try {
      return await prisma.user.findMany({
        where: {
          status: 'active',
          emailVerified: true,
          digestPreference: {
            dailyEnabled: true,
            dailyTime: time,
            timezone: {
              in: timezones,
            },
            vacationMode: false,
          },
          doNotDisturbSchedule: {
            OR: [
              { enabled: false },
              { id: null }, // No DND schedule
            ],
          },
        },
        include: {
          profile: {
            select: {
              fullName: true,
            },
          },
          digestPreference: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getUsersForDailyDigest' },
      });
      throw error;
    }
  }

  /**
   * Get users eligible for weekly digest
   */
  async getUsersForWeeklyDigest(timezones: string[]) {
    try {
      return await prisma.user.findMany({
        where: {
          status: 'active',
          emailVerified: true,
          digestPreference: {
            weeklyEnabled: true,
            timezone: {
              in: timezones,
            },
            vacationMode: false,
          },
        },
        include: {
          profile: {
            select: {
              fullName: true,
            },
          },
          digestPreference: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'DigestRepository', method: 'getUsersForWeeklyDigest' },
      });
      throw error;
    }
  }
}

export default DigestRepository;
