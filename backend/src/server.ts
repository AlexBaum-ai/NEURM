// IMPORTANT: Instrument must be imported first
import './instrument';

import app from './app';
import env from '@/config/env';
import logger from '@/utils/logger';
import redisClient from '@/config/redisClient';
import { setupSessionCleanupScheduler } from '@/jobs/schedulers/sessionCleanup.scheduler';
import { setupArticleScheduler } from '@/jobs/schedulers/articleScheduler.scheduler';
import { analyticsQueue, shutdownAnalyticsQueue } from '@/jobs/queues/analyticsQueue';
import { articleSchedulerQueue, shutdownArticleSchedulerQueue } from '@/jobs/queues/articleSchedulerQueue';
import processAnalyticsEvent from '@/jobs/workers/analyticsWorker';
import processArticleScheduler from '@/jobs/workers/articleSchedulerWorker';

const PORT = env.PORT || 3000;

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    // Close database connections
    // Close Redis connections
    try {
      await redisClient.disconnect();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }

    // Close queue connections
    try {
      await shutdownAnalyticsQueue();
      logger.info('Analytics queue closed');
    } catch (error) {
      logger.error('Error closing analytics queue:', error);
    }

    try {
      await shutdownArticleSchedulerQueue();
      logger.info('Article scheduler queue closed');
    } catch (error) {
      logger.error('Error closing article scheduler queue:', error);
    }

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forceful shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Initialize Redis connection
const initializeRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    logger.warn('Server will continue without Redis caching');
  }
};

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  logger.info(`API URL: ${env.API_URL || `http://localhost:${PORT}`}`);
  logger.info(`Frontend URL: ${env.FRONTEND_URL}`);

  // Initialize Redis
  await initializeRedis();

  // Initialize analytics worker
  analyticsQueue.process(processAnalyticsEvent);
  logger.info('Analytics worker initialized');

  // Initialize article scheduler worker
  articleSchedulerQueue.process(processArticleScheduler);
  logger.info('Article scheduler worker initialized');

  // Initialize scheduled jobs
  setupSessionCleanupScheduler();
  setupArticleScheduler();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', { promise, reason: reason.message, stack: reason.stack });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
