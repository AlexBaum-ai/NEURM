/**
 * Monitoring Controller
 *
 * Handles health checks and system monitoring endpoints
 */
import { Request, Response } from 'express';
import { BaseController } from '@/utils/BaseController';
import {
  performHealthCheck,
  getSystemMetrics,
  logHealthCheck,
} from '@/services/monitoring.service';
import logger from '@/utils/logger';

export class MonitoringController extends BaseController {
  /**
   * GET /health
   * Public health check endpoint
   */
  public async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = await performHealthCheck();

      // Log health check results
      logHealthCheck(healthCheck);

      // Return appropriate status code based on health
      const statusCode =
        healthCheck.status === 'healthy'
          ? 200
          : healthCheck.status === 'degraded'
          ? 200 // Still operational, just degraded
          : 503; // Service unavailable

      res.status(statusCode).json({
        success: healthCheck.status !== 'unhealthy',
        data: healthCheck,
      });
    } catch (error) {
      logger.error('Health check endpoint failed:', error);

      res.status(503).json({
        success: false,
        error: {
          message: 'Health check failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /health/live
   * Liveness probe (for Kubernetes)
   * Returns 200 if server is running
   */
  public async getLiveness(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        status: 'alive',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * GET /health/ready
   * Readiness probe (for Kubernetes)
   * Returns 200 if server is ready to accept traffic
   */
  public async getReadiness(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = await performHealthCheck();

      // Ready if not unhealthy (degraded is still ready)
      const isReady = healthCheck.status !== 'unhealthy';

      res.status(isReady ? 200 : 503).json({
        success: isReady,
        data: {
          status: isReady ? 'ready' : 'not ready',
          timestamp: new Date().toISOString(),
          health: healthCheck.status,
        },
      });
    } catch (error) {
      logger.error('Readiness probe failed:', error);

      res.status(503).json({
        success: false,
        data: {
          status: 'not ready',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /metrics
   * System metrics endpoint (admin only)
   */
  public async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = getSystemMetrics();

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /monitoring/status
   * Detailed system status (admin only)
   */
  public async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const [healthCheck, metrics] = await Promise.all([
        performHealthCheck(),
        Promise.resolve(getSystemMetrics()),
      ]);

      res.status(200).json({
        success: true,
        data: {
          health: healthCheck,
          metrics,
        },
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}

export default new MonitoringController();
