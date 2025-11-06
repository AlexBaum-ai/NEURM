import { Request, Response } from 'express';
import { performanceService } from '@/services/performance.service';
import { cacheService } from '@/services/cache.service';
import {
  checkDatabaseHealth,
  getDatabaseStats,
  getSlowQueries,
  getMissingIndexes,
} from '@/config/database.optimized';
import BaseController from '@/utils/baseController';
import { rateMonitor } from '@/middleware/performance.middleware';
import logger from '@/utils/logger';

/**
 * Performance Monitoring Controller
 * Provides endpoints for performance metrics and monitoring
 */

class PerformanceController extends BaseController {
  /**
   * Get comprehensive performance metrics
   * GET /api/v1/performance/metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    const metrics = await performanceService.getMetrics();

    this.sendSuccess(res, metrics, 'Performance metrics retrieved');
  }

  /**
   * Get performance dashboard data
   * GET /api/v1/performance/dashboard
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    const [
      performanceMetrics,
      cacheStats,
      databaseStats,
      healthCheck,
    ] = await Promise.all([
      performanceService.getMetrics(),
      cacheService.getStats(),
      getDatabaseStats(),
      performanceService.isHealthy(),
    ]);

    const dashboard = {
      timestamp: new Date(),
      health: healthCheck,
      performance: performanceMetrics,
      cache: cacheStats,
      database: databaseStats,
    };

    this.sendSuccess(res, dashboard, 'Performance dashboard data retrieved');
  }

  /**
   * Get slow queries report
   * GET /api/v1/performance/slow-queries
   */
  async getSlowQueries(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const [appSlowQueries, dbSlowQueries] = await Promise.all([
      performanceService.getSlowQueries(limit),
      getSlowQueries(limit),
    ]);

    this.sendSuccess(res, {
      applicationQueries: appSlowQueries,
      databaseQueries: dbSlowQueries,
    }, 'Slow queries retrieved');
  }

  /**
   * Get cache statistics
   * GET /api/v1/performance/cache-stats
   */
  async getCacheStats(req: Request, res: Response): Promise<void> {
    const stats = await cacheService.getStats();

    this.sendSuccess(res, stats, 'Cache statistics retrieved');
  }

  /**
   * Get database statistics
   * GET /api/v1/performance/database-stats
   */
  async getDatabaseStats(req: Request, res: Response): Promise<void> {
    const stats = await getDatabaseStats();

    this.sendSuccess(res, stats, 'Database statistics retrieved');
  }

  /**
   * Get missing indexes recommendations
   * GET /api/v1/performance/missing-indexes
   */
  async getMissingIndexes(req: Request, res: Response): Promise<void> {
    const missingIndexes = await getMissingIndexes();

    this.sendSuccess(res, missingIndexes, 'Missing indexes retrieved');
  }

  /**
   * Health check endpoint
   * GET /api/v1/performance/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    const health = await performanceService.isHealthy();

    const statusCode = health.healthy ? 200 : 503;

    res.status(statusCode).json({
      success: health.healthy,
      message: health.healthy ? 'System is healthy' : 'System health issues detected',
      data: health,
    });
  }

  /**
   * Get request rate statistics
   * GET /api/v1/performance/request-rates
   */
  async getRequestRates(req: Request, res: Response): Promise<void> {
    // This is a simplified version - in production, you'd want to track more endpoints
    const endpoints = [
      'GET /api/v1/articles',
      'GET /api/v1/forum/topics',
      'GET /api/v1/jobs',
      'POST /api/v1/auth/login',
    ];

    const rates = endpoints.map((endpoint) => ({
      endpoint,
      requestsPerMinute: rateMonitor.getRequestRate(endpoint),
    }));

    this.sendSuccess(res, rates, 'Request rates retrieved');
  }

  /**
   * Invalidate cache by pattern
   * DELETE /api/v1/performance/cache/:pattern
   */
  async invalidateCache(req: Request, res: Response): Promise<void> {
    const { pattern } = req.params;

    if (!pattern) {
      this.sendError(res, 'Pattern is required', 400);
      return;
    }

    const deletedCount = await cacheService.delPattern(pattern);

    this.sendSuccess(res, { deletedCount }, `Invalidated ${deletedCount} cache entries`);
  }

  /**
   * Invalidate cache by tag
   * DELETE /api/v1/performance/cache/tag/:tag
   */
  async invalidateCacheByTag(req: Request, res: Response): Promise<void> {
    const { tag } = req.params;

    if (!tag) {
      this.sendError(res, 'Tag is required', 400);
      return;
    }

    const deletedCount = await cacheService.invalidateByTag(tag);

    this.sendSuccess(res, { deletedCount }, `Invalidated ${deletedCount} cache entries for tag: ${tag}`);
  }

  /**
   * Get system resource usage
   * GET /api/v1/performance/resources
   */
  async getResourceUsage(req: Request, res: Response): Promise<void> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const resources = {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
        rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
        external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
        heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    this.sendSuccess(res, resources, 'Resource usage retrieved');
  }

  /**
   * Trigger garbage collection (only in development)
   * POST /api/v1/performance/gc
   */
  async triggerGarbageCollection(req: Request, res: Response): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.sendError(res, 'Garbage collection cannot be triggered in production', 403);
      return;
    }

    if (global.gc) {
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();

      const freed = {
        heapUsed: Math.round((before.heapUsed - after.heapUsed) / 1024 / 1024 * 100) / 100,
        rss: Math.round((before.rss - after.rss) / 1024 / 1024 * 100) / 100,
      };

      this.sendSuccess(res, { freed }, 'Garbage collection triggered');
    } else {
      this.sendError(res, 'Garbage collection not available (run with --expose-gc flag)', 400);
    }
  }

  /**
   * Reset performance metrics
   * POST /api/v1/performance/reset
   */
  async resetMetrics(req: Request, res: Response): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.sendError(res, 'Metrics cannot be reset in production', 403);
      return;
    }

    performanceService.reset();
    rateMonitor.reset();

    this.sendSuccess(res, null, 'Performance metrics reset');
  }
}

export default new PerformanceController();
