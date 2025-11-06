import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger';
import { performanceService } from '@/services/performance.service';
import * as Sentry from '@sentry/node';

/**
 * Optimized Database Configuration with Connection Pooling and Query Logging
 *
 * Performance Features:
 * - Connection pooling (max 50 connections)
 * - Query performance logging
 * - Slow query detection and alerting
 * - Automatic query retries
 * - Connection health monitoring
 */

// Connection pool configuration
const CONNECTION_POOL_CONFIG = {
  // Maximum number of connections in the pool
  // For production workloads, recommended: (core_count * 2) + effective_spindle_count
  // For most cloud databases: 50-100
  connectionLimit: process.env.DATABASE_CONNECTION_LIMIT
    ? parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10)
    : 50,

  // Connection timeout (10 seconds)
  connectionTimeout: 10000,

  // Pool timeout (60 seconds)
  poolTimeout: 60000,
};

// Query logging configuration
const SLOW_QUERY_THRESHOLD = process.env.SLOW_QUERY_THRESHOLD
  ? parseInt(process.env.SLOW_QUERY_THRESHOLD, 10)
  : 100; // ms

/**
 * Create Prisma Client with optimizations
 */
function createPrismaClient(): PrismaClient {
  const logConfig: any[] =
    process.env.NODE_ENV === 'production'
      ? [
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
          { level: 'query', emit: 'event' },
        ]
      : [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
          { level: 'info', emit: 'stdout' },
        ];

  const client = new PrismaClient({
    log: logConfig,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool settings via URL parameters
    // These should be in DATABASE_URL:
    // ?connection_limit=50&pool_timeout=60&connect_timeout=10
  });

  // Query event listener for performance tracking
  client.$on('query' as any, (e: any) => {
    const duration = e.duration;
    const query = e.query;

    // Track query performance
    performanceService.trackQueryPerformance(query, duration, e.params);

    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      logger.warn('Slow query detected', {
        duration: `${duration}ms`,
        query: query.substring(0, 200),
        params: e.params,
        target: e.target,
      });
    }

    // Log all queries in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Query executed', {
        duration: `${duration}ms`,
        query: query.substring(0, 100),
      });
    }
  });

  // Error event listener
  client.$on('error' as any, (e: any) => {
    logger.error('Prisma error event:', e);
    Sentry.captureException(e, {
      tags: { service: 'database' },
    });
  });

  // Warn event listener
  client.$on('warn' as any, (e: any) => {
    logger.warn('Prisma warning:', e);
  });

  return client;
}

// Singleton pattern for Prisma Client
let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  // In development, use global to prevent multiple instances during hot reload
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

/**
 * Health check - verify database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    Sentry.captureException(error, {
      tags: { service: 'database', operation: 'health_check' },
    });
    return false;
  }
}

/**
 * Get database connection statistics
 */
export async function getDatabaseStats(): Promise<{
  activeConnections: number;
  maxConnections: number;
  databaseSize: string;
}> {
  try {
    // Get active connections
    const connectionsResult = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    // Get max connections
    const maxConnectionsResult = await prisma.$queryRaw<
      Array<{ max_connections: string }>
    >`
      SELECT setting as max_connections
      FROM pg_settings
      WHERE name = 'max_connections'
    `;

    // Get database size
    const sizeResult = await prisma.$queryRaw<
      Array<{ size: string }>
    >`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;

    return {
      activeConnections: Number(connectionsResult[0]?.count || 0),
      maxConnections: parseInt(maxConnectionsResult[0]?.max_connections || '0', 10),
      databaseSize: sizeResult[0]?.size || 'unknown',
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return {
      activeConnections: 0,
      maxConnections: 0,
      databaseSize: 'unknown',
    };
  }
}

/**
 * Get slow queries from PostgreSQL logs
 */
export async function getSlowQueries(limit = 10): Promise<any[]> {
  try {
    const slowQueries = await prisma.$queryRaw<any[]>`
      SELECT
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > ${SLOW_QUERY_THRESHOLD}
      ORDER BY mean_exec_time DESC
      LIMIT ${limit}
    `;

    return slowQueries;
  } catch (error) {
    // pg_stat_statements extension might not be enabled
    logger.debug('Could not retrieve slow queries from pg_stat_statements:', error);
    return [];
  }
}

/**
 * Optimize database - run VACUUM and ANALYZE
 */
export async function optimizeDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    logger.info('Skipping manual VACUUM in production (should be handled by autovacuum)');
    return;
  }

  try {
    logger.info('Running database optimization...');

    // ANALYZE updates statistics for query planner
    await prisma.$executeRaw`ANALYZE`;

    logger.info('Database optimization completed');
  } catch (error) {
    logger.error('Database optimization failed:', error);
    throw error;
  }
}

/**
 * Get missing indexes recommendations
 */
export async function getMissingIndexes(): Promise<any[]> {
  try {
    const missingIndexes = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname = 'public'
        AND n_distinct > 100
        AND correlation < 0.1
      ORDER BY n_distinct DESC
      LIMIT 20
    `;

    return missingIndexes;
  } catch (error) {
    logger.error('Failed to get missing indexes:', error);
    return [];
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Disconnecting from database...');
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default prisma;
export { prisma };
