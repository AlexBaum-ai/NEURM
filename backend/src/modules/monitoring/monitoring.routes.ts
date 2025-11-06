/**
 * Monitoring Routes
 *
 * Health check and monitoring endpoints
 */
import { Router } from 'express';
import monitoringController from './monitoring.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/authorize.middleware';

const router = Router();

/**
 * Public health check endpoints
 */
router.get('/health', monitoringController.getHealth.bind(monitoringController));
router.get('/health/live', monitoringController.getLiveness.bind(monitoringController));
router.get('/health/ready', monitoringController.getReadiness.bind(monitoringController));

/**
 * Protected monitoring endpoints (admin only)
 */
router.get(
  '/metrics',
  authenticate,
  authorize(['admin']),
  monitoringController.getMetrics.bind(monitoringController)
);

router.get(
  '/monitoring/status',
  authenticate,
  authorize(['admin']),
  monitoringController.getStatus.bind(monitoringController)
);

export default router;
