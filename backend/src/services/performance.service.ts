import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import redisClient from '@/config/redisClient';
import prisma from '@/config/database';

/**
 * Performance Monitoring Service
 * Tracks and reports on system performance metrics
 */

export interface PerformanceMetrics {
  timestamp: Date;
  apiResponseTimes: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  databaseMetrics: {
    activeConnections: number;
    queryCount: number;
    slowQueryCount: number;
    avgQueryTime: number;
  };
  redisMetrics: {
    connected: boolean;
    hitRate: number;
    memoryUsage: number;
  };
  systemMetrics: {
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    uptime: number;
    cpu: NodeJS.CpuUsage;
  };
}

export interface QueryPerformanceLog {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any;
}

class PerformanceService {
  private responseTimeBuffer: number[] = [];
  private queryPerformanceLogs: QueryPerformanceLog[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;
  private readonly SLOW_QUERY_THRESHOLD = 100; // ms
  private redisHits = 0;
  private redisMisses = 0;

  /**
   * Track API response time
   */
  trackResponseTime(duration: number): void {
    this.responseTimeBuffer.push(duration);

    // Keep buffer at reasonable size
    if (this.responseTimeBuffer.length > this.MAX_BUFFER_SIZE) {
      this.responseTimeBuffer.shift();
    }

    // Alert on slow responses
    if (duration > 200) {
      logger.warn(`Slow API response detected: ${duration}ms`);
      Sentry.captureMessage(`Slow API response: ${duration}ms`, 'warning');
    }
  }

  /**
   * Track database query performance
   */
  trackQueryPerformance(query: string, duration: number, params?: any): void {
    const log: QueryPerformanceLog = {
      query,
      duration,
      timestamp: new Date(),
      params,
    };

    this.queryPerformanceLogs.push(log);

    // Keep logs at reasonable size
    if (this.queryPerformanceLogs.length > this.MAX_BUFFER_SIZE) {
      this.queryPerformanceLogs.shift();
    }

    // Alert on slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      logger.warn(`Slow query detected (${duration}ms):`, {
        query: query.substring(0, 100),
        duration,
      });

      Sentry.captureMessage(`Slow database query: ${duration}ms`, {
        level: 'warning',
        extra: { query: query.substring(0, 200), duration },
      });
    }
  }

  /**
   * Track Redis cache performance
   */
  trackCacheHit(): void {
    this.redisHits++;
  }

  trackCacheMiss(): void {
    this.redisMisses++;
  }

  /**
   * Get current performance metrics
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    const apiResponseTimes = this.calculateResponseTimeMetrics();
    const databaseMetrics = await this.getDatabaseMetrics();
    const redisMetrics = await this.getRedisMetrics();
    const systemMetrics = this.getSystemMetrics();

    return {
      timestamp: new Date(),
      apiResponseTimes,
      databaseMetrics,
      redisMetrics,
      systemMetrics,
    };
  }

  /**
   * Calculate response time percentiles
   */
  private calculateResponseTimeMetrics() {
    if (this.responseTimeBuffer.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0 };
    }

    const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.5)] || 0,
      p95: sorted[Math.floor(len * 0.95)] || 0,
      p99: sorted[Math.floor(len * 0.99)] || 0,
      avg: sorted.reduce((sum, val) => sum + val, 0) / len,
    };
  }

  /**
   * Get database performance metrics
   */
  private async getDatabaseMetrics() {
    const recentQueries = this.queryPerformanceLogs.slice(-100);
    const slowQueries = recentQueries.filter(
      (log) => log.duration > this.SLOW_QUERY_THRESHOLD
    );

    const avgQueryTime =
      recentQueries.length > 0
        ? recentQueries.reduce((sum, log) => sum + log.duration, 0) /
          recentQueries.length
        : 0;

    return {
      activeConnections: 0, // Prisma doesn't expose this easily
      queryCount: this.queryPerformanceLogs.length,
      slowQueryCount: slowQueries.length,
      avgQueryTime: Math.round(avgQueryTime * 100) / 100,
    };
  }

  /**
   * Get Redis performance metrics
   */
  private async getRedisMetrics() {
    const client = redisClient.getClient();
    const totalRequests = this.redisHits + this.redisMisses;
    const hitRate = totalRequests > 0 ? (this.redisHits / totalRequests) * 100 : 0;

    let memoryUsage = 0;
    try {
      const info = await client.info('memory');
      const match = info.match(/used_memory:(\d+)/);
      if (match) {
        memoryUsage = parseInt(match[1], 10);
      }
    } catch (error) {
      logger.error('Failed to get Redis memory info:', error);
    }

    return {
      connected: redisClient.isReady(),
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    };
  }

  /**
   * Get system performance metrics
   */
  private getSystemMetrics() {
    const memUsage = process.memoryUsage();

    return {
      memoryUsage: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
        rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      },
      uptime: process.uptime(),
      cpu: process.cpuUsage(),
    };
  }

  /**
   * Get slow query report
   */
  getSlowQueries(limit = 20): QueryPerformanceLog[] {
    return this.queryPerformanceLogs
      .filter((log) => log.duration > this.SLOW_QUERY_THRESHOLD)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset(): void {
    this.responseTimeBuffer = [];
    this.queryPerformanceLogs = [];
    this.redisHits = 0;
    this.redisMisses = 0;
  }

  /**
   * Check if system is healthy
   */
  async isHealthy(): Promise<{
    healthy: boolean;
    checks: {
      database: boolean;
      redis: boolean;
      memory: boolean;
      responseTime: boolean;
    };
  }> {
    const checks = {
      database: false,
      redis: false,
      memory: true,
      responseTime: true,
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    // Check Redis
    checks.redis = redisClient.isReady();

    // Check memory usage (alert if > 90% of heap)
    const memUsage = process.memoryUsage();
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    checks.memory = heapUsagePercent < 90;

    // Check response times (p95 should be < 200ms)
    const metrics = this.calculateResponseTimeMetrics();
    checks.responseTime = metrics.p95 < 200;

    const healthy = Object.values(checks).every((check) => check === true);

    return { healthy, checks };
  }
}

export const performanceService = new PerformanceService();
export default PerformanceService;
