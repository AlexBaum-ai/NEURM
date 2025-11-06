import { DigestType } from '@prisma/client';
import DigestRepository from './digest.repository';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { generateDailyDigest, generateWeeklyDigest, DigestContent, DigestData } from './digestTemplate';
import { sendEmail } from '@/utils/email';
import { unifiedConfig } from '@/config/unifiedConfig';

/**
 * DigestService
 * Business logic for email digests - content aggregation, email generation, and sending
 */
export class DigestService {
  private repository: DigestRepository;

  constructor(repository?: DigestRepository) {
    this.repository = repository || new DigestRepository();
  }

  // ============================================================================
  // DIGEST PREFERENCES
  // ============================================================================

  /**
   * Get user's digest preferences
   */
  async getPreferences(userId: string) {
    try {
      let preferences = await this.repository.getDigestPreferences(userId);

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await this.repository.upsertDigestPreferences({
          user: {
            connect: { id: userId },
          },
          dailyEnabled: true,
          dailyTime: '09:00',
          weeklyEnabled: true,
          weeklyDay: 1, // Monday
          weeklyTime: '09:00',
          timezone: 'UTC',
          includeNews: true,
          includeForum: true,
          includeJobs: true,
          includeActivity: true,
          minContentItems: 3,
          vacationMode: false,
        });
      }

      return preferences;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DigestService', method: 'getPreferences' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Update digest preferences
   */
  async updatePreferences(userId: string, updates: any) {
    try {
      return await this.repository.upsertDigestPreferences({
        userId,
        ...updates,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DigestService', method: 'updatePreferences' },
        extra: { userId, updates },
      });
      throw error;
    }
  }

  // ============================================================================
  // DIGEST GENERATION & SENDING
  // ============================================================================

  /**
   * Generate and send digest for a user
   */
  async generateAndSendDigest(userId: string, type: DigestType) {
    try {
      // Check rate limiting - max 1 digest per day per user
      const sentRecently = await this.repository.wasDigestSentRecently(userId, type);
      if (sentRecently) {
        logger.info(`Digest rate limited for user ${userId}, type ${type}`);
        return null;
      }

      // Get user preferences
      const preferences = await this.getPreferences(userId);

      // Check if user has digests enabled
      if (type === 'daily' && !preferences.dailyEnabled) {
        logger.info(`Daily digest disabled for user ${userId}`);
        return null;
      }
      if (type === 'weekly' && !preferences.weeklyEnabled) {
        logger.info(`Weekly digest disabled for user ${userId}`);
        return null;
      }

      // Check vacation mode
      if (preferences.vacationMode) {
        if (preferences.vacationUntil && preferences.vacationUntil > new Date()) {
          logger.info(`User ${userId} is in vacation mode until ${preferences.vacationUntil}`);
          return null;
        }
      }

      // Aggregate content
      const content = await this.aggregateDigestContent(userId, type, preferences);

      // Check if we have minimum content items
      const totalItems =
        (content.topStories?.length || 0) +
        (content.trendingDiscussions?.length || 0) +
        (content.jobMatches?.length || 0);

      if (totalItems < preferences.minContentItems) {
        logger.info(
          `Skipping digest for user ${userId} - only ${totalItems} items (min: ${preferences.minContentItems})`
        );
        return null;
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const firstName = user.profile?.fullName?.split(' ')[0] || user.username;

      // Generate digest email
      const digestData: DigestData = {
        user: {
          firstName,
          email: user.email,
        },
        type,
        content,
        unsubscribeToken: user.id, // In production, use a dedicated token
        trackingToken: '', // Will be set when digest record is created
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };

      // Create digest record
      const digest = await this.repository.createEmailDigest({
        userId: user.id,
        type,
        emailTo: user.email,
        subject: this.getDigestSubject(type, firstName),
        contentSummary: {
          topStoriesCount: content.topStories?.length || 0,
          trendingCount: content.trendingDiscussions?.length || 0,
          jobMatchesCount: content.jobMatches?.length || 0,
          hasActivity: !!content.activitySummary,
        },
        itemCount: totalItems,
      });

      // Update digest data with tracking token
      digestData.trackingToken = digest.trackingToken;

      // Generate HTML email
      const html = type === 'daily'
        ? generateDailyDigest(digestData)
        : generateWeeklyDigest(digestData);

      // Send email
      await sendEmail({
        to: user.email,
        subject: digest.subject,
        html,
      });

      // Track sent event
      await this.repository.createTrackingEvent({
        digestId: digest.id,
        eventType: 'sent',
      });

      // Update last sent timestamp
      await this.repository.updateLastDigestSent(userId, type);

      logger.info(`Sent ${type} digest to user ${userId} (${user.email})`);

      return digest;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DigestService', method: 'generateAndSendDigest' },
        extra: { userId, type },
      });
      throw error;
    }
  }

  /**
   * Preview digest content without sending
   */
  async previewDigest(userId: string, type: DigestType) {
    try {
      const preferences = await this.getPreferences(userId);
      const content = await this.aggregateDigestContent(userId, type, preferences);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const firstName = user.profile?.fullName?.split(' ')[0] || user.username;

      const digestData: DigestData = {
        user: {
          firstName,
          email: user.email,
        },
        type,
        content,
        unsubscribeToken: 'PREVIEW_TOKEN',
        trackingToken: 'PREVIEW_TRACKING_TOKEN',
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };

      const html = type === 'daily'
        ? generateDailyDigest(digestData)
        : generateWeeklyDigest(digestData);

      return {
        content,
        html,
        subject: this.getDigestSubject(type, firstName),
        itemCount:
          (content.topStories?.length || 0) +
          (content.trendingDiscussions?.length || 0) +
          (content.jobMatches?.length || 0),
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DigestService', method: 'previewDigest' },
        extra: { userId, type },
      });
      throw error;
    }
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Track email open
   */
  async trackOpen(trackingToken: string, ipAddress?: string, userAgent?: string) {
    try {
      const digest = await this.repository.getDigestByTrackingToken(trackingToken);

      if (!digest) {
        throw new NotFoundError('Digest not found');
      }

      // Only mark as opened once
      if (!digest.openedAt) {
        await this.repository.markDigestOpened(digest.id);
      }

      // Track event
      await this.repository.createTrackingEvent({
        digestId: digest.id,
        eventType: 'opened',
        ipAddress,
        userAgent,
      });

      return { success: true };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DigestService', method: 'trackOpen' },
        extra: { trackingToken },
      });
      throw error;
    }
  }

  /**
   * Track link click
   */
  async trackClick(trackingToken: string, linkUrl: string, ipAddress?: string, userAgent?: string) {
    try {
      const digest = await this.repository.getDigestByTrackingToken(trackingToken);

      if (!digest) {
        throw new NotFoundError('Digest not found');
      }

      // Increment click count
      await this.repository.incrementDigestClickCount(digest.id);

      // Track event
      await this.repository.createTrackingEvent({
        digestId: digest.id,
        eventType: 'clicked',
        linkUrl,
        ipAddress,
        userAgent,
      });

      return { success: true };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DigestService', method: 'trackClick' },
        extra: { trackingToken, linkUrl },
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from digests
   */
  async unsubscribe(trackingToken: string) {
    try {
      const digest = await this.repository.getDigestByTrackingToken(trackingToken);

      if (!digest) {
        throw new NotFoundError('Digest not found');
      }

      // Disable both daily and weekly digests
      await this.repository.upsertDigestPreferences({
        userId: digest.userId,
        dailyEnabled: false,
        weeklyEnabled: false,
      });

      // Mark digest as unsubscribed
      await this.repository.markDigestUnsubscribed(digest.id);

      // Track event
      await this.repository.createTrackingEvent({
        digestId: digest.id,
        eventType: 'unsubscribed',
      });

      logger.info(`User ${digest.userId} unsubscribed from digests via token ${trackingToken}`);

      return { success: true };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DigestService', method: 'unsubscribe' },
        extra: { trackingToken },
      });
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Aggregate content for digest
   */
  private async aggregateDigestContent(
    userId: string,
    type: DigestType,
    preferences: any
  ): Promise<DigestContent> {
    try {
      const content: DigestContent = {};

      // Determine time range
      const since = type === 'daily'
        ? new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

      // Get user's follows for personalization
      const follows = await this.repository.getUserFollows(userId);

      // Get top stories (if enabled)
      if (preferences.includeNews) {
        const articles = await this.repository.getTopArticles({
          categories: follows.categories,
          tags: follows.tags,
          since,
          limit: type === 'daily' ? 5 : 10,
        });

        content.topStories = articles.map((article) => ({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt || '',
          author: article.author.profile?.fullName || article.author.username,
          publishedAt: article.publishedAt?.toISOString() || '',
          url: `/articles/${article.slug}`,
          imageUrl: article.featuredImage || undefined,
          category: article.category.name,
        }));
      }

      // Get trending discussions (if enabled)
      if (preferences.includeForum) {
        const discussions = await this.repository.getTrendingDiscussions({
          categories: follows.categories,
          since,
          limit: type === 'daily' ? 5 : 10,
        });

        content.trendingDiscussions = discussions.map((topic) => ({
          id: topic.id,
          title: topic.title,
          author: topic.author.username,
          replyCount: topic.replyCount,
          viewCount: topic.viewCount,
          lastActivityAt: topic.lastActivityAt?.toISOString() || topic.createdAt.toISOString(),
          url: `/forum/${topic.slug}`,
          category: topic.category.name,
        }));
      }

      // Get job matches (if enabled)
      if (preferences.includeJobs) {
        const matches = await this.repository.getNewJobMatches(
          userId,
          since,
          type === 'daily' ? 3 : 5
        );

        content.jobMatches = matches.map((match) => ({
          id: match.jobId,
          title: match.job.title,
          company: match.job.company.name,
          location: match.job.location,
          matchScore: Number(match.matchScore),
          url: `/jobs/${match.job.slug}`,
          salary: match.job.salaryMin && match.job.salaryMax
            ? `$${Number(match.job.salaryMin).toLocaleString()} - $${Number(match.job.salaryMax).toLocaleString()}`
            : undefined,
          type: match.job.jobType,
        }));
      }

      // Get activity summary (if enabled)
      if (preferences.includeActivity) {
        const activity = await this.repository.getActivitySummary(userId, since);

        // Only include if there's any activity
        if (activity.newFollowers > 0 || activity.topicReplies > 0 || activity.upvotes > 0 || activity.badgesEarned > 0) {
          content.activitySummary = activity;
        }
      }

      return content;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DigestService', method: 'aggregateDigestContent' },
        extra: { userId, type },
      });
      throw error;
    }
  }

  /**
   * Get digest subject line
   */
  private getDigestSubject(type: DigestType, firstName: string): string {
    if (type === 'daily') {
      const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      return `Good morning, ${firstName}! Your ${day} LLM Digest 🧠`;
    } else {
      return `${firstName}, here's your weekly LLM roundup 🚀`;
    }
  }
}

// Import prisma here to avoid circular dependency
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default DigestService;
