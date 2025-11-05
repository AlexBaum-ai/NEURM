import { Request, Response } from 'express';
import SessionsService from './sessions.service';
import { sessionIdParamSchema } from './sessions.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * SessionsController
 * Handles HTTP requests for session management endpoints
 */
export class SessionsController {
  private sessionsService: typeof SessionsService;

  constructor(sessionsService?: typeof SessionsService) {
    this.sessionsService = sessionsService || SessionsService;
  }

  /**
   * GET /api/v1/users/me/sessions
   * Get all active sessions for the current user
   */
  getUserSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Get current session ID from request (set by auth middleware)
      const currentSessionId = req.sessionId;

      const sessions = await this.sessionsService.getUserSessions(
        userId,
        currentSessionId
      );

      res.status(200).json({
        success: true,
        data: {
          sessions,
          count: sessions.length,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * DELETE /api/v1/users/me/sessions/:id
   * Revoke a specific session
   */
  revokeSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate session ID parameter
      const validationResult = sessionIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        throw new ValidationError(
          validationResult.error.issues[0].message
        );
      }

      const { id } = validationResult.data;
      const currentSessionId = req.sessionId;

      logger.info(`User ${userId} revoking session ${id}`);

      await this.sessionsService.revokeSession(userId, id, currentSessionId);

      res.status(200).json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/v1/users/me/sessions/revoke-all
   * Revoke all sessions except the current one
   */
  revokeAllSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const currentSessionId = req.sessionId;

      logger.info(`User ${userId} revoking all sessions except current`);

      const revokedCount = await this.sessionsService.revokeAllSessions(
        userId,
        currentSessionId
      );

      res.status(200).json({
        success: true,
        message: `Successfully revoked ${revokedCount} session(s)`,
        data: {
          revokedCount,
        },
      });
    } catch (error) {
      throw error;
    }
  };
}

export default SessionsController;
