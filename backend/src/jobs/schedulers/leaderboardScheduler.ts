import logger from '@/utils/logger';
import { scheduleHourlyRecalculation } from '../queues/leaderboardQueue';

/**
 * Leaderboard Scheduler
 *
 * Initializes scheduled jobs for leaderboard recalculation:
 * - Hourly recalculation of all leaderboards
 */

export const initializeLeaderboardScheduler = async (): Promise<void> => {
  try {
    logger.info('Initializing leaderboard scheduler...');

    // Schedule hourly recalculation
    await scheduleHourlyRecalculation();

    logger.info('Leaderboard scheduler initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize leaderboard scheduler:', error);
    throw error;
  }
};

export default initializeLeaderboardScheduler;
