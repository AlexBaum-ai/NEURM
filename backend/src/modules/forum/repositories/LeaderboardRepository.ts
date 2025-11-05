import { injectable } from 'tsyringe';
import { PrismaClient, Leaderboard, Prisma } from '@prisma/client';
import prisma from '@/config/database';
import * as Sentry from '@sentry/node';

/**
 * LeaderboardRepository
 *
 * Data access layer for leaderboards:
 * - Query precomputed rankings
 * - Store ranking snapshots
 * - Calculate rankings from reputation history
 */

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputationGain: number;
  postCount: number;
  replyCount: number;
  acceptedAnswers: number;
  totalReputation: number;
}

export interface UserRankInfo {
  period: LeaderboardPeriod;
  rank: number | null;
  reputationGain: number;
  totalUsers: number;
  percentile: number | null;
}

export interface LeaderboardStats {
  period: LeaderboardPeriod;
  totalUsers: number;
  topReputationGain: number;
  updatedAt: Date;
}

@injectable()
export class LeaderboardRepository {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Get leaderboard rankings for a specific period
   */
  async getLeaderboard(
    period: LeaderboardPeriod,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      const leaderboardData = await this.db.leaderboard.findMany({
        where: { period },
        orderBy: { rank: 'asc' },
        take: limit,
        include: {
          user: {
            select: {
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
              reputation: {
                select: {
                  totalReputation: true,
                },
              },
            },
          },
        },
      });

      return leaderboardData.map((entry) => ({
        rank: entry.rank,
        userId: entry.userId,
        username: entry.user.username,
        displayName: entry.user.profile?.displayName || null,
        avatarUrl: entry.user.profile?.avatarUrl || null,
        reputationGain: entry.reputationGain,
        postCount: entry.postCount,
        replyCount: entry.replyCount,
        acceptedAnswers: entry.acceptedAnswers,
        totalReputation: entry.user.reputation?.totalReputation || 0,
      }));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'LeaderboardRepository', method: 'getLeaderboard' },
        extra: { period, limit },
      });
      throw error;
    }
  }

  /**
   * Get user's rank for a specific period
   */
  async getUserRank(userId: string, period: LeaderboardPeriod): Promise<UserRankInfo> {
    try {
      const userEntry = await this.db.leaderboard.findUnique({
        where: {
          period_userId: {
            period,
            userId,
          },
        },
      });

      const totalUsers = await this.db.leaderboard.count({
        where: { period },
      });

      if (!userEntry) {
        return {
          period,
          rank: null,
          reputationGain: 0,
          totalUsers,
          percentile: null,
        };
      }

      const percentile = totalUsers > 0 ? (1 - userEntry.rank / totalUsers) * 100 : null;

      return {
        period,
        rank: userEntry.rank,
        reputationGain: userEntry.reputationGain,
        totalUsers,
        percentile,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'LeaderboardRepository', method: 'getUserRank' },
        extra: { userId, period },
      });
      throw error;
    }
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(period: LeaderboardPeriod): Promise<LeaderboardStats | null> {
    try {
      const stats = await this.db.leaderboard.aggregate({
        where: { period },
        _count: true,
        _max: {
          reputationGain: true,
          updatedAt: true,
        },
      });

      if (stats._count === 0) {
        return null;
      }

      return {
        period,
        totalUsers: stats._count,
        topReputationGain: stats._max.reputationGain || 0,
        updatedAt: stats._max.updatedAt || new Date(),
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'LeaderboardRepository', method: 'getLeaderboardStats' },
        extra: { period },
      });
      throw error;
    }
  }

  /**
   * Calculate and store rankings for a period
   * This is called by the hourly cron job
   */
  async calculateAndStoreRankings(
    period: LeaderboardPeriod,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    try {
      // Calculate reputation gains for the period
      const userStats = await this.db.$queryRaw<
        Array<{
          user_id: string;
          reputation_gain: bigint;
          post_count: bigint;
          reply_count: bigint;
          accepted_answers: bigint;
        }>
      >`
        SELECT
          rh.user_id,
          COALESCE(SUM(rh.points), 0) as reputation_gain,
          COALESCE(COUNT(DISTINCT t.id), 0) as post_count,
          COALESCE(COUNT(DISTINCT r.id), 0) as reply_count,
          COALESCE(COUNT(DISTINCT CASE WHEN r.is_accepted THEN r.id END), 0) as accepted_answers
        FROM reputation_history rh
        LEFT JOIN topics t ON t.author_id = rh.user_id
          AND t.created_at BETWEEN ${periodStart} AND ${periodEnd}
        LEFT JOIN replies r ON r.author_id = rh.user_id
          AND r.created_at BETWEEN ${periodStart} AND ${periodEnd}
        WHERE rh.created_at BETWEEN ${periodStart} AND ${periodEnd}
        GROUP BY rh.user_id
        HAVING SUM(rh.points) > 0
        ORDER BY reputation_gain DESC
      `;

      // Delete existing rankings for this period
      await this.db.leaderboard.deleteMany({
        where: { period },
      });

      // Store new rankings
      const rankings = userStats.map((stats, index) => ({
        period,
        periodStart,
        periodEnd,
        userId: stats.user_id,
        rank: index + 1,
        reputationGain: Number(stats.reputation_gain),
        postCount: Number(stats.post_count),
        replyCount: Number(stats.reply_count),
        acceptedAnswers: Number(stats.accepted_answers),
      }));

      if (rankings.length > 0) {
        await this.db.leaderboard.createMany({
          data: rankings,
        });
      }

      return rankings.length;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'LeaderboardRepository', method: 'calculateAndStoreRankings' },
        extra: { period, periodStart, periodEnd },
      });
      throw error;
    }
  }

  /**
   * Get Hall of Fame (top monthly contributors from previous months)
   */
  async getHallOfFame(limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      // Get unique top performers from archived monthly leaderboards
      const hallOfFame = await this.db.$queryRaw<
        Array<{
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          total_reputation: number;
          max_reputation_gain: number;
          months_featured: bigint;
          best_rank: number;
        }>
      >`
        SELECT
          l.user_id,
          u.username,
          p.display_name,
          p.avatar_url,
          COALESCE(ur.total_reputation, 0) as total_reputation,
          MAX(l.reputation_gain) as max_reputation_gain,
          COUNT(DISTINCT l.period) as months_featured,
          MIN(l.rank) as best_rank
        FROM leaderboards l
        INNER JOIN users u ON u.id = l.user_id
        LEFT JOIN profiles p ON p.user_id = l.user_id
        LEFT JOIN user_reputation ur ON ur.user_id = l.user_id
        WHERE l.period = 'monthly'
          AND l.rank <= 10
          AND l.period_end < NOW()
        GROUP BY l.user_id, u.username, p.display_name, p.avatar_url, ur.total_reputation
        ORDER BY months_featured DESC, max_reputation_gain DESC
        LIMIT ${limit}
      `;

      return hallOfFame.map((entry, index) => ({
        rank: index + 1,
        userId: entry.user_id,
        username: entry.username,
        displayName: entry.display_name,
        avatarUrl: entry.avatar_url,
        reputationGain: entry.max_reputation_gain,
        postCount: 0, // Not relevant for Hall of Fame
        replyCount: 0,
        acceptedAnswers: 0,
        totalReputation: entry.total_reputation,
      }));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'LeaderboardRepository', method: 'getHallOfFame' },
        extra: { limit },
      });
      throw error;
    }
  }

  /**
   * Get period boundaries for calculations
   */
  getPeriodBoundaries(period: LeaderboardPeriod): { start: Date; end: Date } {
    const now = new Date();
    const end = now;
    let start: Date;

    switch (period) {
      case 'weekly':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        break;
      case 'all-time':
        start = new Date('2020-01-01'); // Platform launch date
        break;
    }

    return { start, end };
  }
}
