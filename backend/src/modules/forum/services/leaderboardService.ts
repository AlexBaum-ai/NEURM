import { injectable } from 'tsyringe';
import * as Sentry from '@sentry/node';
import redisClient from '@/config/redisClient';
import {
  LeaderboardRepository,
  LeaderboardPeriod,
  LeaderboardEntry,
  UserRankInfo,
  LeaderboardStats,
} from '../repositories/LeaderboardRepository';

/**
 * LeaderboardService
 *
 * Business logic for leaderboards:
 * - Fetch cached rankings
 * - Calculate new rankings
 * - User rank lookup
 * - Hall of Fame management
 */

const CACHE_TTL_SECONDS = 3600; // 1 hour
const CACHE_KEY_PREFIX = 'leaderboard:';

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  stats: LeaderboardStats | null;
  updatedAt: Date;
}

@injectable()
export class LeaderboardService {
  constructor(private leaderboardRepository: LeaderboardRepository) {}

  /**
   * Get leaderboard for a specific period
   * Returns cached data if available, otherwise fetches from database
   */
  async getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardResponse> {
    try {
      const limit = period === 'all-time' ? 100 : 50;

      // Try to get from cache first
      const cacheKey = `${CACHE_KEY_PREFIX}${period}`;
      const cached = await redisClient.getJSON<LeaderboardResponse>(cacheKey);

      if (cached) {
        Sentry.addBreadcrumb({
          category: 'forum',
          message: 'Leaderboard cache hit',
          level: 'info',
          data: { period, source: 'cache' },
        });
        return cached;
      }

      // Cache miss - fetch from database
      const entries = await this.leaderboardRepository.getLeaderboard(period, limit);
      const stats = await this.leaderboardRepository.getLeaderboardStats(period);

      const response: LeaderboardResponse = {
        period,
        entries,
        stats,
        updatedAt: stats?.updatedAt || new Date(),
      };

      // Store in cache
      await redisClient.setJSON(cacheKey, response, CACHE_TTL_SECONDS);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Leaderboard fetched from database',
        level: 'info',
        data: { period, entryCount: entries.length },
      });

      return response;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'LeaderboardService', operation: 'getLeaderboard' },
        extra: { period },
      });
      throw error;
    }
  }

  /**
   * Get user's rank across all periods
   */
  async getUserRankings(userId: string): Promise<{
    weekly: UserRankInfo;
    monthly: UserRankInfo;
    allTime: UserRankInfo;
  }> {
    try {
      // Try cache first
      const cacheKey = `${CACHE_KEY_PREFIX}user:${userId}`;
      const cached = await redisClient.getJSON<{
        weekly: UserRankInfo;
        monthly: UserRankInfo;
        allTime: UserRankInfo;
      }>(cacheKey);

      if (cached) {
        return cached;
      }

      // Fetch from database
      const [weekly, monthly, allTime] = await Promise.all([
        this.leaderboardRepository.getUserRank(userId, 'weekly'),
        this.leaderboardRepository.getUserRank(userId, 'monthly'),
        this.leaderboardRepository.getUserRank(userId, 'all-time'),
      ]);

      const result = { weekly, monthly, allTime };

      // Cache for 1 hour
      await redisClient.setJSON(cacheKey, result, CACHE_TTL_SECONDS);

      return result;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'LeaderboardService', operation: 'getUserRankings' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get Hall of Fame (archived top monthly contributors)
   */
  async getHallOfFame(): Promise<LeaderboardResponse> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}hall-of-fame`;
      const cached = await redisClient.getJSON<LeaderboardResponse>(cacheKey);

      if (cached) {
        return cached;
      }

      const entries = await this.leaderboardRepository.getHallOfFame(50);

      const response: LeaderboardResponse = {
        period: 'monthly', // Hall of Fame is based on monthly rankings
        entries,
        stats: null,
        updatedAt: new Date(),
      };

      // Cache for 1 hour
      await redisClient.setJSON(cacheKey, response, CACHE_TTL_SECONDS);

      return response;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'LeaderboardService', operation: 'getHallOfFame' },
      });
      throw error;
    }
  }

  /**
   * Recalculate rankings for all periods
   * Called by hourly cron job
   */
  async recalculateAllRankings(): Promise<{
    weekly: number;
    monthly: number;
    allTime: number;
  }> {
    try {
      const results = await Promise.all([
        this.recalculateRankings('weekly'),
        this.recalculateRankings('monthly'),
        this.recalculateRankings('all-time'),
      ]);

      // Clear all leaderboard caches
      await this.clearAllCaches();

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'All leaderboard rankings recalculated',
        level: 'info',
        data: {
          weekly: results[0],
          monthly: results[1],
          allTime: results[2],
        },
      });

      return {
        weekly: results[0],
        monthly: results[1],
        allTime: results[2],
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          service: 'LeaderboardService',
          operation: 'recalculateAllRankings',
        },
      });
      throw error;
    }
  }

  /**
   * Recalculate rankings for a specific period
   */
  async recalculateRankings(period: LeaderboardPeriod): Promise<number> {
    try {
      const { start, end } = this.leaderboardRepository.getPeriodBoundaries(period);

      const count = await this.leaderboardRepository.calculateAndStoreRankings(
        period,
        start,
        end
      );

      // Clear cache for this period
      const cacheKey = `${CACHE_KEY_PREFIX}${period}`;
      await redisClient.del(cacheKey);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Leaderboard rankings recalculated',
        level: 'info',
        data: { period, userCount: count },
      });

      return count;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          service: 'LeaderboardService',
          operation: 'recalculateRankings',
        },
        extra: { period },
      });
      throw error;
    }
  }

  /**
   * Clear all leaderboard caches
   */
  private async clearAllCaches(): Promise<void> {
    try {
      await redisClient.delPattern(`${CACHE_KEY_PREFIX}*`);
    } catch (error) {
      // Log error but don't throw - cache clearing is not critical
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'LeaderboardService', operation: 'clearAllCaches' },
      });
    }
  }
}
