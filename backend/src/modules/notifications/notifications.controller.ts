import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import NotificationService from './notifications.service';
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  updateNotificationPreferencesSchema,
  updateDndScheduleSchema,
  subscribeToPushSchema,
  unsubscribeFromPushSchema,
  CreateNotificationInput,
  ListNotificationsQuery,
  UpdateNotificationPreferencesInput,
  UpdateDndScheduleInput,
  SubscribeToPushInput,
  UnsubscribeFromPushInput,
} from './notifications.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * NotificationController
 * Handles HTTP requests for notification endpoints
 */
export class NotificationController {
  private service: NotificationService;

  constructor(service?: NotificationService) {
    this.service = service || new NotificationService();
  }

  // ============================================================================
  // NOTIFICATION ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/notifications
   * Create a notification (internal use)
   */
  createNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validation = createNotificationSchema.safeParse(req.body);

      if (!validation.success) {
        const error = validation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const data: CreateNotificationInput = validation.data;

      logger.info(`Creating notification for user ${data.userId}, type: ${data.type}`);

      const notification = await this.service.createNotification(data);

      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error creating notification:', error);

      if (error instanceof ValidationError || error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to create notification' },
      });
    }
  };

  /**
   * GET /api/v1/notifications
   * Get user's notifications
   */
  listNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate query parameters
      const validation = listNotificationsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        const error = validation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const query: ListNotificationsQuery = validation.data;

      const result = await this.service.listNotifications(userId, query);

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / query.limit),
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error listing notifications:', error);

      if (error instanceof ValidationError || error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to list notifications' },
      });
    }
  };

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread notification count
   */
  getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const count = await this.service.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error getting unread count:', error);

      res.status(500).json({
        success: false,
        error: { message: 'Failed to get unread count' },
      });
    }
  };

  /**
   * PUT /api/v1/notifications/:id/read
   * Mark notification as read
   */
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = notificationIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      const notification = await this.service.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error marking notification as read:', error);

      if (error instanceof ValidationError || error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to mark notification as read' },
      });
    }
  };

  /**
   * PUT /api/v1/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const count = await this.service.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error marking all notifications as read:', error);

      res.status(500).json({
        success: false,
        error: { message: 'Failed to mark all notifications as read' },
      });
    }
  };

  /**
   * DELETE /api/v1/notifications/:id
   * Delete notification
   */
  deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = notificationIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      await this.service.deleteNotification(id, userId);

      res.status(204).send();
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error deleting notification:', error);

      if (error instanceof ValidationError || error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to delete notification' },
      });
    }
  };

  // ============================================================================
  // PREFERENCE ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/notifications/preferences
   * Get notification preferences
   */
  getPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const preferences = await this.service.getPreferences(userId);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error getting preferences:', error);

      res.status(500).json({
        success: false,
        error: { message: 'Failed to get notification preferences' },
      });
    }
  };

  /**
   * PUT /api/v1/notifications/preferences
   * Update notification preferences
   */
  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validation = updateNotificationPreferencesSchema.safeParse(req.body);

      if (!validation.success) {
        const error = validation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const data: UpdateNotificationPreferencesInput = validation.data;

      const preferences = await this.service.updatePreferences(userId, data.preferences);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error updating preferences:', error);

      if (error instanceof ValidationError || error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to update notification preferences' },
      });
    }
  };

  // ============================================================================
  // DO NOT DISTURB ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/notifications/dnd
   * Get DND schedule
   */
  getDndSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const schedule = await this.service.getDndSchedule(userId);

      res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error getting DND schedule:', error);

      res.status(500).json({
        success: false,
        error: { message: 'Failed to get DND schedule' },
      });
    }
  };

  /**
   * PUT /api/v1/notifications/dnd
   * Update DND schedule
   */
  updateDndSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validation = updateDndScheduleSchema.safeParse(req.body);

      if (!validation.success) {
        const error = validation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const data: UpdateDndScheduleInput = validation.data;

      const schedule = await this.service.updateDndSchedule(userId, data);

      res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error updating DND schedule:', error);

      if (error instanceof ValidationError || error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to update DND schedule' },
      });
    }
  };

  // ============================================================================
  // PUSH NOTIFICATION ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/notifications/push/subscribe
   * Subscribe to push notifications
   */
  subscribeToPush = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validation = subscribeToPushSchema.safeParse(req.body);

      if (!validation.success) {
        const error = validation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const data: SubscribeToPushInput = validation.data;
      const userAgent = req.headers['user-agent'];

      const subscription = await this.service.subscribeToPush(userId, data, userAgent);

      res.status(201).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error subscribing to push:', error);

      if (error instanceof ValidationError || error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to subscribe to push notifications' },
      });
    }
  };

  /**
   * DELETE /api/v1/notifications/push/unsubscribe
   * Unsubscribe from push notifications
   */
  unsubscribeFromPush = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validation = unsubscribeFromPushSchema.safeParse(req.body);

      if (!validation.success) {
        const error = validation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const data: UnsubscribeFromPushInput = validation.data;

      await this.service.unsubscribeFromPush(data.endpoint);

      res.status(204).send();
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error unsubscribing from push:', error);

      if (error instanceof ValidationError || error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to unsubscribe from push notifications' },
      });
    }
  };

  /**
   * GET /api/v1/notifications/push/subscriptions
   * Get user's push subscriptions
   */
  getPushSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const subscriptions = await this.service.getPushSubscriptions(userId);

      res.status(200).json({
        success: true,
        data: subscriptions,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error getting push subscriptions:', error);

      res.status(500).json({
        success: false,
        error: { message: 'Failed to get push subscriptions' },
      });
    }
  };
}

export default NotificationController;
