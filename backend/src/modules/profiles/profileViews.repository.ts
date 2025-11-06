import { PrismaClient, ProfileView, UserRole } from '@prisma/client';
import { prisma } from '@/utils/prisma';

/**
 * Profile View with Viewer Details
 */
export interface ProfileViewWithViewer extends ProfileView {
  viewer: {
    id: string;
    username: string;
    role: UserRole;
    profile: {
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
    company: {
      id: string;
      name: string;
    } | null;
  };
}

/**
 * ProfileViewsRepository
 * Data access layer for profile views
 */
export class ProfileViewsRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Track a profile view with 24h deduplication
   * Returns the created view or null if view already exists within 24h
   */
  async trackProfileView(
    profileId: string,
    viewerId: string,
    anonymous: boolean = false,
    companyId?: string
  ): Promise<ProfileView | null> {
    // Check if viewer already viewed this profile today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingView = await this.prisma.profileView.findFirst({
      where: {
        profileId,
        viewerId,
        viewedAt: {
          gte: today,
        },
      },
    });

    // If view already exists within 24h, return null (deduplication)
    if (existingView) {
      return null;
    }

    // Create new view
    return await this.prisma.profileView.create({
      data: {
        profileId,
        viewerId,
        anonymous,
        companyId,
        viewerType: 'recruiter', // Default, can be customized based on viewer role
      },
    });
  }

  /**
   * Get profile viewers (last 30 days)
   * Returns viewers with their details (respects anonymous setting)
   */
  async getProfileViewers(
    profileId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ views: ProfileViewWithViewer[]; total: number }> {
    const offset = (page - 1) * limit;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [views, total] = await Promise.all([
      this.prisma.profileView.findMany({
        where: {
          profileId,
          viewedAt: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          viewer: {
            select: {
              id: true,
              username: true,
              role: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          viewedAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.profileView.count({
        where: {
          profileId,
          viewedAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    return {
      views: views as ProfileViewWithViewer[],
      total,
    };
  }

  /**
   * Get total profile view count (all time)
   */
  async getTotalViewCount(profileId: string): Promise<number> {
    return await this.prisma.profileView.count({
      where: {
        profileId,
      },
    });
  }

  /**
   * Get total unique viewers count (last 30 days)
   */
  async getUniqueViewersCount(profileId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const uniqueViewers = await this.prisma.profileView.groupBy({
      by: ['viewerId'],
      where: {
        profileId,
        viewedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return uniqueViewers.length;
  }

  /**
   * Check if user has premium access
   */
  async hasPremiumAccess(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    // Premium roles: premium, admin, company
    return ['premium', 'admin', 'company'].includes(user.role);
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<{ id: string; role: UserRole } | null> {
    return await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, role: true },
    });
  }

  /**
   * Get user's company ID (for recruiters)
   */
  async getUserCompanyId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    return user?.company?.id || null;
  }

  /**
   * Check if profile view tracking is enabled for a user
   */
  async isViewTrackingEnabled(userId: string): Promise<boolean> {
    // Check privacy settings for profile_views section
    const privacySetting = await this.prisma.profilePrivacySetting.findFirst({
      where: {
        userId,
        section: 'profile_views',
      },
    });

    // If no setting exists, default to enabled (public)
    if (!privacySetting) {
      return true;
    }

    // If visibility is 'private', view tracking is disabled
    return privacySetting.visibility !== 'private';
  }

  /**
   * Get user's profile privacy setting for profile views
   */
  async getProfileViewPrivacySetting(
    userId: string
  ): Promise<{ enabled: boolean; visibility: string }> {
    const privacySetting = await this.prisma.profilePrivacySetting.findFirst({
      where: {
        userId,
        section: 'profile_views',
      },
    });

    if (!privacySetting) {
      return { enabled: true, visibility: 'public' };
    }

    return {
      enabled: privacySetting.visibility !== 'private',
      visibility: privacySetting.visibility,
    };
  }
}

export default ProfileViewsRepository;
