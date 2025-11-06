import { Request, Response } from 'express';
import AuthService from './auth.service';
import prisma from '@/config/database';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './validation/auth.validation';
import { BadRequestError, UnauthorizedError } from '@/utils/errors';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * AuthController
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Register a new user account
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as RegisterInput;

      const result = await AuthService.createUser({
        email: data.email,
        password: data.password,
        username: data.username,
      });

      logger.info(`User registered: ${result.userId}`);

      res.status(201).json({
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        data: {
          userId: result.userId,
          email: result.email,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /api/v1/auth/login
   * Authenticate user and return tokens
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as LoginInput;

      // Authenticate user
      const { user } = await AuthService.authenticateUser(
        data.email,
        data.password
      );

      // Generate tokens
      const tokens = await AuthService.generateTokens(user.id);

      // Create session
      const sessionId = await AuthService.createSession(
        user.id,
        tokens.refreshToken,
        req.ip,
        req.headers['user-agent']
      );

      // Generate new tokens with session ID
      const tokensWithSession = await AuthService.generateTokens(
        user.id,
        sessionId
      );

      logger.info(`User logged in: ${user.id} (${user.email})`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            emailVerified: user.emailVerified,
          },
          accessToken: tokensWithSession.accessToken,
          refreshToken: tokensWithSession.refreshToken,
          expiresIn: tokensWithSession.expiresIn,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user and invalidate session
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.sessionId;

      if (sessionId) {
        await AuthService.invalidateSession(sessionId);
        logger.info(`Session invalidated: ${sessionId}`);
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      // Log error but return success anyway
      logger.error('Error during logout:', error);
      Sentry.captureException(error, {
        tags: { controller: 'auth', method: 'logout' },
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as RefreshTokenInput;

      // Verify refresh token
      const { userId } = await AuthService.verifyRefreshToken(
        data.refreshToken
      );

      // Find session by refresh token
      const session = await prisma.session.findUnique({
        where: { refreshToken: data.refreshToken },
      });

      if (!session) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      if (session.expiresAt < new Date()) {
        // Clean up expired session
        await AuthService.invalidateSession(session.id);
        throw new UnauthorizedError('Refresh token expired');
      }

      // Generate new tokens
      const tokens = await AuthService.generateTokens(userId, session.id);

      // Update session with new refresh token
      await prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          lastActiveAt: new Date(),
        },
      });

      logger.debug(`Tokens refreshed for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('Not authenticated');
      }

      // Fetch user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          emailVerified: true,
          accountType: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          twoFactorEnabled: true,
          profile: {
            select: {
              displayName: true,
              headline: true,
              avatarUrl: true,
              location: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /api/v1/auth/verify-email
   * Verify email address with token
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as VerifyEmailInput;

      await AuthService.verifyEmail(data.token);

      logger.info('Email verified successfully');

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /api/v1/auth/resend-verification
   * Resend email verification link
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as ResendVerificationInput;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        select: {
          id: true,
          emailVerified: true,
        },
      });

      // Don't reveal if user exists or not (security)
      if (!user) {
        res.status(200).json({
          success: true,
          message: 'If the email exists, a verification link has been sent.',
        });
        return;
      }

      if (user.emailVerified) {
        throw new BadRequestError('Email is already verified');
      }

      await AuthService.sendVerificationEmail(user.id);

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      // Don't reveal errors to prevent email enumeration
      logger.error('Error resending verification:', error);
      Sentry.captureException(error, {
        tags: { controller: 'auth', method: 'resendVerification' },
      });

      res.status(200).json({
        success: true,
        message: 'If the email exists, a verification link has been sent.',
      });
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Send password reset email
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as ForgotPasswordInput;

      await AuthService.sendPasswordResetEmail(data.email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    } catch (error) {
      // Log error but don't reveal it
      logger.error('Error in forgot password:', error);
      Sentry.captureException(error, {
        tags: { controller: 'auth', method: 'forgotPassword' },
      });

      // Always return success
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as ResetPasswordInput;

      await AuthService.resetPassword(data.token, data.newPassword);

      logger.info('Password reset successfully');

      res.status(200).json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.',
      });
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthController();
