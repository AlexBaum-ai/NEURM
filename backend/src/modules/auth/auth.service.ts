import jwt from 'jsonwebtoken';
import prisma from '@/config/database';
import env from '@/config/env';
import logger from '@/utils/logger';
import { hashPassword, verifyPassword } from '@/utils/password';
import {
  generateSecureToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '@/utils/crypto';
import { sendEmail } from '@/utils/email';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '@/utils/errors';
import * as Sentry from '@sentry/node';

/**
 * JWT Payload interface
 */
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

/**
 * Token Pair interface
 */
interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * User creation data
 */
interface CreateUserData {
  email: string;
  password: string;
  username: string;
}

/**
 * AuthService
 * Handles business logic for authentication operations
 */
class AuthService {
  /**
   * Create a new user account
   */
  async createUser(data: CreateUserData): Promise<{ userId: string; email: string }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.email }, { username: data.username }],
        },
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new ConflictError('Email address is already registered');
        }
        throw new ConflictError('Username is already taken');
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash,
          emailVerified: false,
          role: 'user',
          status: 'active',
        },
        select: {
          id: true,
          email: true,
        },
      });

      logger.info(`New user created: ${user.id} (${user.email})`);

      // Send verification email asynchronously
      this.sendVerificationEmail(user.id).catch((error) => {
        logger.error('Failed to send verification email:', error);
        Sentry.captureException(error, {
          tags: { service: 'auth', method: 'createUser' },
          extra: { userId: user.id },
        });
      });

      return {
        userId: user.id,
        email: user.email,
      };
    } catch (error) {
      if (
        error instanceof ConflictError ||
        error instanceof BadRequestError
      ) {
        throw error;
      }

      logger.error('Error creating user:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'createUser' },
      });
      throw new BadRequestError('Failed to create user account');
    }
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(
    email: string,
    password: string
  ): Promise<{
    user: {
      id: string;
      email: string;
      username: string;
      role: string;
      emailVerified: boolean;
    };
  }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          passwordHash: true,
          emailVerified: true,
        },
      });

      if (!user || !user.passwordHash) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check user status
      if (user.status === 'suspended') {
        throw new UnauthorizedError('Your account has been suspended');
      }

      if (user.status === 'banned') {
        throw new UnauthorizedError('Your account has been banned');
      }

      if (user.status === 'deleted') {
        throw new UnauthorizedError('Your account has been deleted');
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      });

      logger.info(`User authenticated: ${user.id} (${user.email})`);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      logger.error('Error authenticating user:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'authenticateUser' },
      });
      throw new UnauthorizedError('Authentication failed');
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  async generateTokens(
    userId: string,
    sessionId?: string
  ): Promise<TokenPair> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Create JWT payload
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      if (sessionId) {
        payload.sessionId = sessionId;
      }

      // Generate access token
      const accessToken = jwt.sign(
        payload,
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
      );

      // Generate refresh token
      const refreshTokenSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET;
      const refreshToken = jwt.sign(
        { userId: user.id },
        refreshTokenSecret,
        { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN || '30d' } as jwt.SignOptions
      );

      // Calculate expiry time in seconds
      const expiresInMatch = (env.JWT_EXPIRES_IN || '15m').match(/^(\d+)([smhd])$/);
      let expiresIn = 900; // Default 15 minutes

      if (expiresInMatch) {
        const value = parseInt(expiresInMatch[1]);
        const unit = expiresInMatch[2];

        switch (unit) {
          case 's':
            expiresIn = value;
            break;
          case 'm':
            expiresIn = value * 60;
            break;
          case 'h':
            expiresIn = value * 60 * 60;
            break;
          case 'd':
            expiresIn = value * 60 * 60 * 24;
            break;
        }
      }

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      logger.error('Error generating tokens:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'generateTokens' },
      });
      throw new BadRequestError('Failed to generate authentication tokens');
    }
  }

  /**
   * Verify and decode refresh token
   */
  async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    try {
      const refreshTokenSecret =
        env.JWT_REFRESH_SECRET || env.JWT_SECRET;

      const decoded = jwt.verify(token, refreshTokenSecret) as {
        userId: string;
      };

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedError('User account is not active');
      }

      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      throw error;
    }
  }

  /**
   * Create a new session for a user
   */
  async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    try {
      // Calculate expiry date (30 days from now)
      const expiresAt = new Date();
      const expiryDays = this.parseExpiryDays(
        env.REFRESH_TOKEN_EXPIRES_IN || '30d'
      );
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Generate session token
      const sessionToken = generateSecureToken(32);

      // Create session
      const session = await prisma.session.create({
        data: {
          userId,
          token: sessionToken,
          refreshToken,
          ipAddress,
          userAgent,
          expiresAt,
        },
      });

      logger.debug(`Session created: ${session.id} for user ${userId}`);

      return session.id;
    } catch (error) {
      logger.error('Error creating session:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'createSession' },
      });
      throw new BadRequestError('Failed to create session');
    }
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { id: sessionId },
      });

      logger.debug(`Session invalidated: ${sessionId}`);
    } catch (error) {
      logger.error('Error invalidating session:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'invalidateSession' },
      });
      // Don't throw error - logout should succeed even if session deletion fails
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      await prisma.session.deleteMany({
        where: { userId },
      });

      logger.debug(`All sessions invalidated for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating user sessions:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'invalidateAllUserSessions' },
      });
    }
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          emailVerified: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.emailVerified) {
        throw new BadRequestError('Email is already verified');
      }

      // Generate verification token
      const token = generateEmailVerificationToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Delete any existing pending verification for this user/email combination
      await prisma.pendingEmailChange.deleteMany({
        where: {
          userId: user.id,
          newEmail: user.email,
        },
      });

      // Store token
      await prisma.pendingEmailChange.create({
        data: {
          userId: user.id,
          newEmail: user.email,
          verificationToken: token,
          expiresAt,
        },
      });

      // Create verification URL
      const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

      // Send email
      await sendEmail({
        to: user.email,
        subject: 'Verify your Neurmatic account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Neurmatic, ${user.username}!</h2>
            <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        `,
        text: `Welcome to Neurmatic! Please verify your email by visiting: ${verificationUrl}`,
      });

      logger.info(`Verification email sent to: ${user.email}`);
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof BadRequestError
      ) {
        throw error;
      }

      logger.error('Error sending verification email:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'sendVerificationEmail' },
      });
      throw new BadRequestError('Failed to send verification email');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      // Find pending verification
      const pending = await prisma.pendingEmailChange.findUnique({
        where: { verificationToken: token },
        include: { user: true },
      });

      if (!pending) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      // Check expiry
      if (pending.expiresAt < new Date()) {
        // Delete expired token
        await prisma.pendingEmailChange.delete({
          where: { id: pending.id },
        });
        throw new BadRequestError('Verification token has expired');
      }

      // Update user email verification status
      await prisma.user.update({
        where: { id: pending.userId },
        data: { emailVerified: true },
      });

      // Delete pending verification
      await prisma.pendingEmailChange.delete({
        where: { id: pending.id },
      });

      logger.info(`Email verified for user: ${pending.userId}`);
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      logger.error('Error verifying email:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'verifyEmail' },
      });
      throw new BadRequestError('Failed to verify email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          status: true,
        },
      });

      // Don't reveal if user exists or not (security)
      if (!user) {
        logger.warn(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      if (user.status !== 'active') {
        logger.warn(`Password reset requested for inactive user: ${user.id}`);
        return;
      }

      // Generate reset token
      const token = generatePasswordResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      // Store token (reuse PendingEmailChange table with a marker)
      const resetMarker = `password-reset:${user.id}`;

      // Delete any existing reset tokens for this user
      await prisma.pendingEmailChange.deleteMany({
        where: {
          userId: user.id,
          newEmail: {
            startsWith: 'password-reset:',
          },
        },
      });

      // Create new reset token
      await prisma.pendingEmailChange.create({
        data: {
          userId: user.id,
          newEmail: resetMarker,
          verificationToken: token,
          expiresAt,
        },
      });

      // Create reset URL
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

      // Send email
      await sendEmail({
        to: user.email,
        subject: 'Reset your Neurmatic password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.username},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        `,
        text: `Reset your password by visiting: ${resetUrl}`,
      });

      logger.info(`Password reset email sent to: ${user.email}`);
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'sendPasswordResetEmail' },
      });
      // Don't throw error - don't reveal if user exists
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Find pending reset
      const pending = await prisma.pendingEmailChange.findUnique({
        where: { verificationToken: token },
        include: { user: true },
      });

      if (!pending || !pending.newEmail.startsWith('password-reset:')) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      // Check expiry
      if (pending.expiresAt < new Date()) {
        // Delete expired token
        await prisma.pendingEmailChange.delete({
          where: { id: pending.id },
        });
        throw new BadRequestError('Reset token has expired');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      await prisma.user.update({
        where: { id: pending.userId },
        data: { passwordHash },
      });

      // Delete pending reset
      await prisma.pendingEmailChange.delete({
        where: { id: pending.id },
      });

      // Invalidate all sessions for security
      await this.invalidateAllUserSessions(pending.userId);

      logger.info(`Password reset completed for user: ${pending.userId}`);
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      logger.error('Error resetting password:', error);
      Sentry.captureException(error, {
        tags: { service: 'auth', method: 'resetPassword' },
      });
      throw new BadRequestError('Failed to reset password');
    }
  }

  /**
   * Parse expiry days from string like "30d" or "7d"
   */
  private parseExpiryDays(expiryString: string): number {
    const match = expiryString.match(/^(\d+)d$/);
    return match ? parseInt(match[1]) : 30; // Default 30 days
  }
}

export default new AuthService();
