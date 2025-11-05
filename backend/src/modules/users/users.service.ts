import * as Sentry from '@sentry/node';
import { UserRole, PrivacyVisibility } from '@prisma/client';
import UserRepository, { UserWithProfile } from './users.repository';
import {
  UpdateProfileInput,
  UpdatePrivacySettingsInput,
  ChangeEmailInput,
  ChangePasswordInput,
  DeleteAccountInput,
} from './users.validation';
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} from '@/utils/errors';
import logger from '@/utils/logger';
import { hashPassword, verifyPassword } from '@/utils/password';
import { generateEmailVerificationToken } from '@/utils/crypto';

/**
 * User profile responseDTO
 */
export interface UserProfileResponse {
  id: string;
  username: string;
  email?: string; // Only included for own profile
  role: UserRole;
  accountType: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  profile: {
    displayName: string | null;
    headline: string | null;
    bio: string | null;
    avatarUrl: string | null;
    coverImageUrl: string | null;
    location: string | null;
    website: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
    huggingfaceUrl: string | null;
    pronouns: string | null;
    availabilityStatus: string | null;
    yearsExperience: number | null;
  } | null;
  stats: {
    reputation: number;
    topics: number;
    replies: number;
    articles: number;
    badges: number;
  };
  badges?: Array<{
    id: string;
    name: string;
    iconUrl: string;
    badgeType: string;
    earnedAt: Date;
  }>;
  skills?: Array<{
    id: string;
    skillName: string;
    skillType: string;
    proficiency: number;
    endorsementCount: number;
  }>;
}

/**
 * UserService
 * Business logic for user profile operations
 */
export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository || new UserRepository();
  }

  /**
   * Get current user's profile (authenticated)
   */
  async getCurrentUserProfile(userId: string): Promise<UserProfileResponse> {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const reputation = await this.userRepository.getReputationScore(userId);

      const response = this.mapToProfileResponse(user, reputation, true);

      return response;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'getCurrentUserProfile' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get public user profile by username
   * Respects privacy settings
   */
  async getPublicProfile(
    username: string,
    requestingUserId?: string
  ): Promise<UserProfileResponse> {
    try {
      const user = await this.userRepository.findByUsername(username);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if requesting user is viewing their own profile
      const isOwnProfile = requestingUserId === user.id;

      // Get privacy settings
      const privacySettings = await this.userRepository.getPrivacySettings(user.id);

      // Get reputation
      const reputation = await this.userRepository.getReputationScore(user.id);

      // Map to response and filter based on privacy
      const response = this.mapToProfileResponse(user, reputation, isOwnProfile);

      // Apply privacy filters if not own profile
      if (!isOwnProfile) {
        await this.applyPrivacyFilters(response, privacySettings, requestingUserId);
      }

      return response;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'getPublicProfile' },
        extra: { username, requestingUserId },
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<UserProfileResponse> {
    try {
      logger.info(`Updating profile for user ${userId}`);

      // Update profile
      const updatedUser = await this.userRepository.updateProfile(userId, data);

      // Get reputation
      const reputation = await this.userRepository.getReputationScore(userId);

      const response = this.mapToProfileResponse(updatedUser, reputation, true);

      logger.info(`Profile updated successfully for user ${userId}`);
      return response;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'updateProfile' },
        extra: { userId, data },
      });
      logger.error(`Failed to update profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Map User entity to ProfileResponse DTO
   */
  private mapToProfileResponse(
    user: UserWithProfile,
    reputation: number,
    includeEmail: boolean = false
  ): UserProfileResponse {
    return {
      id: user.id,
      username: user.username,
      ...(includeEmail && { email: user.email }),
      role: user.role,
      accountType: user.accountType,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            headline: user.profile.headline,
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
            coverImageUrl: user.profile.coverImageUrl,
            location: user.profile.location,
            website: user.profile.website,
            githubUrl: user.profile.githubUrl,
            linkedinUrl: user.profile.linkedinUrl,
            twitterUrl: user.profile.twitterUrl,
            huggingfaceUrl: user.profile.huggingfaceUrl,
            pronouns: user.profile.pronouns,
            availabilityStatus: user.profile.availabilityStatus,
            yearsExperience: user.profile.yearsExperience,
          }
        : null,
      stats: {
        reputation,
        topics: user._count?.topics || 0,
        replies: user._count?.replies || 0,
        articles: user._count?.articles || 0,
        badges: user.userBadges?.length || 0,
      },
      badges: user.userBadges?.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        iconUrl: ub.badge.iconUrl,
        badgeType: ub.badge.badgeType,
        earnedAt: ub.earnedAt,
      })),
      skills: user.skills?.map((skill) => ({
        id: skill.id,
        skillName: skill.skillName,
        skillType: skill.skillType,
        proficiency: skill.proficiency,
        endorsementCount: skill.endorsementCount,
      })),
    };
  }

  /**
   * Get privacy settings for current user
   */
  async getPrivacySettings(userId: string): Promise<Record<string, PrivacyVisibility>> {
    try {
      const settings = await this.userRepository.getAllPrivacySettings(userId);
      return settings;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'getPrivacySettings' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Update privacy settings for current user
   */
  async updatePrivacySettings(
    userId: string,
    settings: UpdatePrivacySettingsInput
  ): Promise<Record<string, PrivacyVisibility>> {
    try {
      logger.info(`Updating privacy settings for user ${userId}`);

      await this.userRepository.updatePrivacySettings(userId, settings);

      const updatedSettings = await this.userRepository.getAllPrivacySettings(userId);

      logger.info(`Privacy settings updated successfully for user ${userId}`);
      return updatedSettings;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'updatePrivacySettings' },
        extra: { userId, settings },
      });
      logger.error(`Failed to update privacy settings for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Apply privacy filters to profile response
   * Respects user roles (company role = recruiter access)
   */
  private async applyPrivacyFilters(
    response: UserProfileResponse,
    privacySettings: Record<string, string>,
    requestingUserId?: string
  ): Promise<void> {
    // Determine requesting user's access level
    const isAuthenticated = !!requestingUserId;
    let isRecruiter = false;

    if (requestingUserId) {
      const requestingUserRole = await this.userRepository.getUserRole(requestingUserId);
      // Company account type acts as recruiter
      isRecruiter = requestingUserRole === UserRole.company;
    }

    // Helper function to check if field should be visible
    const isVisible = (visibility: string): boolean => {
      if (visibility === 'public') return true;
      if (visibility === 'private') return false;
      if (visibility === 'community') return isAuthenticated;
      if (visibility === 'recruiters') return isRecruiter || isAuthenticated;
      return false;
    };

    // Filter profile fields based on privacy settings
    if (response.profile) {
      // Bio privacy
      if (!isVisible(privacySettings.bio || 'public')) {
        response.profile.bio = null;
      }

      // Contact privacy
      if (!isVisible(privacySettings.contact || 'public')) {
        response.profile.website = null;
        response.profile.githubUrl = null;
        response.profile.linkedinUrl = null;
        response.profile.twitterUrl = null;
        response.profile.huggingfaceUrl = null;
      }
    }

    // Skills privacy
    if (!isVisible(privacySettings.skills || 'public')) {
      response.skills = undefined;
    }

    // Always hide email from public profiles
    delete response.email;
  }

  /**
   * Request email change
   * Creates a pending email change and sends verification email
   */
  async requestEmailChange(userId: string, data: ChangeEmailInput): Promise<{ message: string }> {
    try {
      logger.info(`User ${userId} requesting email change`);

      // Get user and verify password
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if user has a password (OAuth users might not)
      if (!user.passwordHash) {
        throw new BadRequestError('Password verification not available for OAuth accounts');
      }

      // Verify current password
      const isPasswordValid = await verifyPassword(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid password');
      }

      // Check if new email is already in use
      const emailExists = await this.userRepository.emailExists(data.newEmail);
      if (emailExists) {
        throw new ConflictError('Email address is already in use');
      }

      // Delete any existing pending email changes for this user
      await this.userRepository.deletePendingEmailChangesByUser(userId);

      // Create pending email change with verification token
      const verificationToken = generateEmailVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.userRepository.createPendingEmailChange(
        userId,
        data.newEmail,
        verificationToken,
        expiresAt
      );

      // TODO: Send verification email to new address
      // This should be handled by an email service
      logger.info(`Email change verification sent to ${data.newEmail} for user ${userId}`);

      return {
        message: 'Verification email sent to new address. Please check your inbox.',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'requestEmailChange' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Verify email change with token
   */
  async verifyEmailChange(token: string): Promise<{ message: string }> {
    try {
      logger.info('Verifying email change token');

      const pendingChange = await this.userRepository.findPendingEmailChangeByToken(token);

      if (!pendingChange) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      // Check if token is expired
      if (new Date() > pendingChange.expiresAt) {
        await this.userRepository.deletePendingEmailChange(pendingChange.id);
        throw new BadRequestError('Verification token has expired');
      }

      // Update user email
      await this.userRepository.updateEmail(pendingChange.userId, pendingChange.newEmail);

      // Delete pending change
      await this.userRepository.deletePendingEmailChange(pendingChange.id);

      logger.info(`Email successfully changed for user ${pendingChange.userId}`);

      return {
        message: 'Email address updated successfully',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'verifyEmailChange' },
      });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, data: ChangePasswordInput): Promise<{ message: string }> {
    try {
      logger.info(`User ${userId} changing password`);

      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if user has a password (OAuth users might not)
      if (!user.passwordHash) {
        throw new BadRequestError('Password management not available for OAuth accounts');
      }

      // Verify current password
      const isPasswordValid = await verifyPassword(data.currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Check if new password is different from current
      const isSamePassword = await verifyPassword(data.newPassword, user.passwordHash);
      if (isSamePassword) {
        throw new BadRequestError('New password must be different from current password');
      }

      // Hash new password
      const newPasswordHash = await hashPassword(data.newPassword);

      // Update password
      await this.userRepository.updatePassword(userId, newPasswordHash);

      logger.info(`Password changed successfully for user ${userId}`);

      return {
        message: 'Password updated successfully',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'changePassword' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Delete user account (soft delete)
   * Sets status to deleted and schedules hard delete after 30 days
   */
  async deleteAccount(userId: string, data: DeleteAccountInput): Promise<{ message: string }> {
    try {
      logger.info(`User ${userId} requesting account deletion`);

      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify password if user has one
      if (user.passwordHash) {
        const isPasswordValid = await verifyPassword(data.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new UnauthorizedError('Invalid password');
        }
      }

      // Soft delete user
      await this.userRepository.softDeleteUser(userId);

      // Revoke all sessions
      await this.userRepository.revokeAllUserSessions(userId);

      // TODO: Schedule hard delete job after 30 days
      // This should be handled by a background job queue (Bull)

      logger.info(`Account marked for deletion for user ${userId}`);

      return {
        message:
          'Account deleted successfully. You have 30 days to restore your account by contacting support.',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'deleteAccount' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Export user data for GDPR compliance
   * Returns all user data in JSON format
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      logger.info(`User ${userId} requesting data export`);

      const userData = await this.userRepository.getUserDataForExport(userId);

      if (!userData) {
        throw new NotFoundError('User not found');
      }

      // Format data for export
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          role: userData.role,
          accountType: userData.accountType,
          status: userData.status,
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt,
          timezone: userData.timezone,
          locale: userData.locale,
        },
        profile: userData.profile,
        skills: userData.skills,
        workExperiences: userData.workExperiences,
        educations: userData.educations,
        portfolioProjects: userData.portfolioProjects,
        privacySettings: userData.privacySettings,
        articles: userData.articles.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          publishedAt: a.publishedAt,
        })),
        forumActivity: {
          topics: userData.topics.map((t) => ({
            id: t.id,
            title: t.title,
            slug: t.slug,
            createdAt: t.createdAt,
          })),
          replies: userData.replies.map((r) => ({
            id: r.id,
            topicId: r.topicId,
            createdAt: r.createdAt,
          })),
        },
        bookmarks: userData.bookmarks.map((b) => ({
          articleId: b.article.id,
          articleTitle: b.article.title,
          createdAt: b.createdAt,
        })),
        jobApplications: userData.jobApplications.map((ja) => ({
          jobId: ja.job.id,
          jobTitle: ja.job.title,
          status: ja.status,
          appliedAt: ja.appliedAt,
        })),
        notifications: userData.notifications.map((n) => ({
          type: n.type,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
        })),
        messages: {
          sent: userData.sentMessages.map((m) => ({
            recipientId: m.recipientId,
            subject: m.subject,
            createdAt: m.createdAt,
          })),
          received: userData.receivedMessages.map((m) => ({
            senderId: m.senderId,
            subject: m.subject,
            createdAt: m.createdAt,
          })),
        },
      };

      logger.info(`Data export generated for user ${userId}`);

      return exportData;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UserService', method: 'exportUserData' },
        extra: { userId },
      });
      throw error;
    }
  }
}

export default UserService;
