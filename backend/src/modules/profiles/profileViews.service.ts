import * as Sentry from '@sentry/node';
import ProfileViewsRepository, { ProfileViewWithViewer } from './profileViews.repository';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Profile View Response DTO
 */
export interface ProfileViewResponse {
  id: string;
  viewedAt: Date;
  anonymous: boolean;
  viewer: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    company: {
      name: string;
    } | null;
  } | null;
}

/**
 * Profile Views Summary Response DTO
 */
export interface ProfileViewsSummaryResponse {
  totalViews: number;
  uniqueViewers: number;
  views: ProfileViewResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * ProfileViewsService
 * Business logic for profile view tracking
 */
export class ProfileViewsService {
  private repository: ProfileViewsRepository;

  constructor(repository?: ProfileViewsRepository) {
    this.repository = repository || new ProfileViewsRepository();
  }

  /**
   * Track a profile view
   * Handles deduplication, privacy settings, and anonymous views
   */
  async trackProfileView(
    username: string,
    viewerId: string,
    anonymous: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get profile user by username
      const profileUser = await this.repository.getUserByUsername(username);

      if (!profileUser) {
        throw new NotFoundError('Profile not found');
      }

      const profileId = profileUser.id;

      // Don't track if viewing own profile
      if (profileId === viewerId) {
        return {
          success: false,
          message: 'Cannot track views on your own profile',
        };
      }

      // Check if profile owner has view tracking enabled
      const viewTrackingEnabled = await this.repository.isViewTrackingEnabled(profileId);

      if (!viewTrackingEnabled) {
        return {
          success: false,
          message: 'Profile view tracking is disabled for this user',
        };
      }

      // Get viewer's company ID (if recruiter)
      const companyId = await this.repository.getUserCompanyId(viewerId);

      // Track the view (with 24h deduplication)
      const view = await this.repository.trackProfileView(
        profileId,
        viewerId,
        anonymous,
        companyId || undefined
      );

      if (!view) {
        return {
          success: false,
          message: 'View already tracked within the last 24 hours',
        };
      }

      logger.info(`Profile view tracked`, {
        profileId,
        viewerId,
        anonymous,
        companyId,
      });

      return {
        success: true,
        message: 'Profile view tracked successfully',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ProfileViewsService', method: 'trackProfileView' },
        extra: { username, viewerId, anonymous },
      });
      logger.error(`Failed to track profile view:`, error);
      throw error;
    }
  }

  /**
   * Get who viewed my profile (premium only)
   * Returns viewers from last 30 days
   */
  async getMyProfileViewers(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ProfileViewsSummaryResponse> {
    try {
      // Check if user has premium access
      const hasPremiumAccess = await this.repository.hasPremiumAccess(userId);

      if (!hasPremiumAccess) {
        throw new ForbiddenError(
          'This feature is only available for premium users. Upgrade to premium to see who viewed your profile.'
        );
      }

      // Validate pagination parameters
      if (page < 1) {
        throw new BadRequestError('Page must be greater than 0');
      }

      if (limit < 1 || limit > 100) {
        throw new BadRequestError('Limit must be between 1 and 100');
      }

      // Get profile views
      const { views, total } = await this.repository.getProfileViewers(userId, page, limit);

      // Get view counts
      const [totalViews, uniqueViewers] = await Promise.all([
        this.repository.getTotalViewCount(userId),
        this.repository.getUniqueViewersCount(userId),
      ]);

      // Map views to response format
      const viewsResponse: ProfileViewResponse[] = views.map((view) =>
        this.mapViewToResponse(view)
      );

      const totalPages = Math.ceil(total / limit);

      logger.info(`Profile viewers retrieved for user ${userId}`, {
        userId,
        page,
        limit,
        total,
      });

      return {
        totalViews,
        uniqueViewers,
        views: viewsResponse,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ProfileViewsService', method: 'getMyProfileViewers' },
        extra: { userId, page, limit },
      });
      logger.error(`Failed to get profile viewers for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get profile view count for a user
   * Public method to get view count (for displaying on profile)
   */
  async getProfileViewCount(username: string): Promise<{ totalViews: number }> {
    try {
      // Get profile user by username
      const profileUser = await this.repository.getUserByUsername(username);

      if (!profileUser) {
        throw new NotFoundError('Profile not found');
      }

      const totalViews = await this.repository.getTotalViewCount(profileUser.id);

      return { totalViews };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ProfileViewsService', method: 'getProfileViewCount' },
        extra: { username },
      });
      logger.error(`Failed to get profile view count:`, error);
      throw error;
    }
  }

  /**
   * Map database entity to response DTO
   * Handles anonymous views
   */
  private mapViewToResponse(view: ProfileViewWithViewer): ProfileViewResponse {
    // If view is anonymous, hide viewer details
    if (view.anonymous) {
      return {
        id: view.id,
        viewedAt: view.viewedAt,
        anonymous: true,
        viewer: null,
      };
    }

    // Return full viewer details
    return {
      id: view.id,
      viewedAt: view.viewedAt,
      anonymous: false,
      viewer: {
        username: view.viewer.username,
        displayName: view.viewer.profile?.displayName || null,
        avatarUrl: view.viewer.profile?.avatarUrl || null,
        company: view.viewer.company
          ? {
              name: view.viewer.company.name,
            }
          : null,
      },
    };
  }
}

export default ProfileViewsService;
