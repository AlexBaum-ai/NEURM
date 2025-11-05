import { PrismaClient, User, Profile, UserSkill, UserBadge, PrivacyVisibility, UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { UpdateProfileInput, UpdatePrivacySettingsInput } from './users.validation';

/**
 * User with full profile data
 */
export interface UserWithProfile extends User {
  profile: Profile | null;
  _count?: {
    topics: number;
    replies: number;
    articles: number;
  };
  userBadges?: Array<UserBadge & { badge: { id: string; name: string; iconUrl: string; badgeType: string } }>;
  skills?: UserSkill[];
}

/**
 * UserRepository
 * Data access layer for user and profile operations
 */
export class UserRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Find user by ID with full profile data
   */
  async findById(userId: string): Promise<UserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        _count: {
          select: {
            topics: true,
            replies: true,
            articles: true,
          },
        },
        userBadges: {
          include: {
            badge: true,
          },
          take: 10, // Limit badges shown
          orderBy: {
            earnedAt: 'desc',
          },
        },
        skills: {
          orderBy: {
            proficiency: 'desc',
          },
          take: 20, // Limit skills shown
        },
      },
    });
  }

  /**
   * Find user by username with profile data
   */
  async findByUsername(username: string): Promise<UserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        _count: {
          select: {
            topics: true,
            replies: true,
            articles: true,
          },
        },
        userBadges: {
          include: {
            badge: true,
          },
          take: 10,
          orderBy: {
            earnedAt: 'desc',
          },
        },
        skills: {
          orderBy: {
            proficiency: 'desc',
          },
          take: 20,
        },
      },
    });
  }

  /**
   * Update user profile
   * Creates profile if it doesn't exist
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<UserWithProfile> {
    // First, ensure profile exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Update or create profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: data,
            update: data,
          },
        },
      },
      include: {
        profile: true,
        _count: {
          select: {
            topics: true,
            replies: true,
            articles: true,
          },
        },
        userBadges: {
          include: {
            badge: true,
          },
          take: 10,
          orderBy: {
            earnedAt: 'desc',
          },
        },
        skills: {
          orderBy: {
            proficiency: 'desc',
          },
          take: 20,
        },
      },
    });

    return updatedUser;
  }

  /**
   * Get user's privacy settings
   */
  async getPrivacySettings(userId: string) {
    const settings = await this.prisma.profilePrivacySetting.findMany({
      where: { userId },
    });

    // Convert to key-value map
    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.section] = setting.visibility;
    });

    return settingsMap;
  }

  /**
   * Get user reputation score
   * Sum of all reputation points from history
   */
  async getReputationScore(userId: string): Promise<number> {
    const result = await this.prisma.reputationHistory.aggregate({
      where: { userId },
      _sum: {
        points: true,
      },
    });

    return result._sum.points || 0;
  }

  /**
   * Check if user exists
   */
  async exists(userId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id: userId },
    });
    return count > 0;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username },
    });
    return count > 0;
  }

  /**
   * Update user privacy settings
   * Creates default settings for sections not yet configured
   */
  async updatePrivacySettings(
    userId: string,
    settings: UpdatePrivacySettingsInput
  ): Promise<void> {
    const updates = Object.entries(settings).map(([section, visibility]) => {
      return this.prisma.profilePrivacySetting.upsert({
        where: {
          userId_section: {
            userId,
            section,
          },
        },
        create: {
          userId,
          section,
          visibility: visibility as PrivacyVisibility,
        },
        update: {
          visibility: visibility as PrivacyVisibility,
        },
      });
    });

    await this.prisma.$transaction(updates);
  }

  /**
   * Get all privacy settings for a user
   * Returns defaults for sections not yet configured
   */
  async getAllPrivacySettings(userId: string): Promise<Record<string, PrivacyVisibility>> {
    const defaults: Record<string, PrivacyVisibility> = {
      bio: 'public',
      work_experience: 'public',
      education: 'public',
      portfolio: 'public',
      skills: 'public',
      salary: 'recruiters', // Salary is recruiters-only by default
      contact: 'public',
    };

    const existingSettings = await this.prisma.profilePrivacySetting.findMany({
      where: { userId },
    });

    const settingsMap: Record<string, PrivacyVisibility> = { ...defaults };
    existingSettings.forEach((setting) => {
      settingsMap[setting.section] = setting.visibility;
    });

    return settingsMap;
  }

  /**
   * Initialize default privacy settings for new user
   */
  async initializeDefaultPrivacySettings(userId: string): Promise<void> {
    const defaultSettings = [
      { section: 'bio', visibility: 'public' as PrivacyVisibility },
      { section: 'work_experience', visibility: 'public' as PrivacyVisibility },
      { section: 'education', visibility: 'public' as PrivacyVisibility },
      { section: 'portfolio', visibility: 'public' as PrivacyVisibility },
      { section: 'skills', visibility: 'public' as PrivacyVisibility },
      { section: 'salary', visibility: 'recruiters' as PrivacyVisibility },
      { section: 'contact', visibility: 'public' as PrivacyVisibility },
    ];

    await this.prisma.profilePrivacySetting.createMany({
      data: defaultSettings.map((setting) => ({
        userId,
        ...setting,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Get user role by ID
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role || null;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Update user email
   */
  async updateEmail(userId: string, newEmail: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: true,
      },
    });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });
  }

  /**
   * Soft delete user account
   */
  async softDeleteUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'deleted',
      },
    });
  }

  /**
   * Create pending email change
   */
  async createPendingEmailChange(
    userId: string,
    newEmail: string,
    verificationToken: string,
    expiresAt: Date
  ): Promise<void> {
    await this.prisma.pendingEmailChange.create({
      data: {
        userId,
        newEmail,
        verificationToken,
        expiresAt,
      },
    });
  }

  /**
   * Find pending email change by token
   */
  async findPendingEmailChangeByToken(token: string) {
    return this.prisma.pendingEmailChange.findUnique({
      where: { verificationToken: token },
      include: { user: true },
    });
  }

  /**
   * Delete pending email change
   */
  async deletePendingEmailChange(id: string): Promise<void> {
    await this.prisma.pendingEmailChange.delete({
      where: { id },
    });
  }

  /**
   * Delete all pending email changes for user
   */
  async deletePendingEmailChangesByUser(userId: string): Promise<void> {
    await this.prisma.pendingEmailChange.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get user data for GDPR export
   */
  async getUserDataForExport(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: true,
        workExperiences: true,
        educations: true,
        portfolioProjects: true,
        privacySettings: true,
        articles: true,
        topics: true,
        replies: true,
        bookmarks: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        jobApplications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        notifications: true,
        sentMessages: true,
        receivedMessages: true,
      },
    });

    return user;
  }

  /**
   * Get user's password hash for verification
   */
  async getPasswordHash(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    return user?.passwordHash || null;
  }

  /**
   * Revoke all user sessions (for account deletion)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }
}

export default UserRepository;
