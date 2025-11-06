/**
 * Dashboard Repository
 *
 * Data access layer for dashboard operations
 */

import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import {
  TopStory,
  TrendingDiscussion,
  JobMatch,
  UserStats,
  TrendingTag,
  UserActivity,
  DashboardConfig,
  WidgetConfig,
} from './types/dashboard.types';

export class DashboardRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get top stories published today
   */
  async getTopStoriesToday(limit: number = 5): Promise<TopStory[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const articles = await this.prisma.article.findMany({
        where: {
          status: 'published',
          publishedAt: {
            gte: today,
          },
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          slug: true,
          coverImageUrl: true,
          viewCount: true,
          createdAt: true,
          author: {
            select: {
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      });

      return articles as TopStory[];
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get trending forum discussions
   */
  async getTrendingDiscussions(limit: number = 5): Promise<TrendingDiscussion[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const topics = await this.prisma.topic.findMany({
        where: {
          status: { not: 'archived' },
          createdAt: {
            gte: oneDayAgo,
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          viewCount: true,
          replyCount: true,
          upvoteCount: true,
          createdAt: true,
          author: {
            select: {
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { upvoteCount: 'desc' },
          { replyCount: 'desc' },
          { viewCount: 'desc' },
        ],
        take: limit,
      });

      return topics as TrendingDiscussion[];
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get job matches for user based on their skills and preferences
   */
  async getJobMatchesForUser(userId: string, limit: number = 5): Promise<JobMatch[]> {
    try {
      // Get user skills and preferences
      const userSkills = await this.prisma.userSkill.findMany({
        where: { userId },
        select: { skillId: true },
      });

      const skillIds = userSkills.map((s) => s.skillId);

      const jobPreferences = await this.prisma.jobPreferences.findUnique({
        where: { userId },
      });

      // Build query based on user profile
      const where: any = {
        status: 'active',
        expiresAt: {
          gt: new Date(),
        },
      };

      // Filter by job type preference
      if (jobPreferences?.preferredJobTypes && jobPreferences.preferredJobTypes.length > 0) {
        where.jobType = { in: jobPreferences.preferredJobTypes };
      }

      // Filter by work location preference
      if (jobPreferences?.preferredWorkLocations && jobPreferences.preferredWorkLocations.length > 0) {
        where.workLocation = { in: jobPreferences.preferredWorkLocations };
      }

      // Filter by experience level
      if (jobPreferences?.experienceLevel) {
        where.experienceLevel = jobPreferences.experienceLevel;
      }

      const jobs = await this.prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          workLocation: true,
          jobType: true,
          experienceLevel: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              slug: true,
              logoUrl: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit * 2, // Get more to filter by skills
      });

      // If user has skills, prioritize jobs requiring those skills
      if (skillIds.length > 0) {
        const jobsWithSkillMatch = await Promise.all(
          jobs.map(async (job) => {
            const jobSkills = await this.prisma.jobSkill.findMany({
              where: { jobId: job.id },
              select: { skillId: true },
            });

            const matchingSkills = jobSkills.filter((js) =>
              skillIds.includes(js.skillId)
            );

            return {
              ...job,
              matchScore: (matchingSkills.length / Math.max(jobSkills.length, 1)) * 100,
            };
          })
        );

        // Sort by match score and return top matches
        return jobsWithSkillMatch
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, limit) as JobMatch[];
      }

      return jobs.slice(0, limit) as JobMatch[];
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const [
        reputationData,
        articlesRead,
        jobsSaved,
        applicationsSent,
        topicsCreated,
        repliesPosted,
        upvotesReceived,
      ] = await Promise.all([
        // Forum reputation
        this.prisma.userReputation.findUnique({
          where: { userId },
          select: { points: true },
        }),
        // Articles read (from article views)
        this.prisma.articleView.count({
          where: { userId },
        }),
        // Jobs saved (bookmarks)
        this.prisma.bookmark.count({
          where: {
            userId,
            bookmarkableType: 'job',
          },
        }),
        // Applications sent
        this.prisma.jobApplication.count({
          where: { userId },
        }),
        // Topics created
        this.prisma.topic.count({
          where: { authorId: userId },
        }),
        // Replies posted
        this.prisma.reply.count({
          where: { authorId: userId },
        }),
        // Upvotes received on topics and replies
        Promise.all([
          this.prisma.topicVote.count({
            where: {
              voteType: 'upvote',
              topic: { authorId: userId },
            },
          }),
          this.prisma.replyVote.count({
            where: {
              voteType: 'upvote',
              reply: { authorId: userId },
            },
          }),
        ]).then(([topicUpvotes, replyUpvotes]) => topicUpvotes + replyUpvotes),
      ]);

      return {
        forumReputation: reputationData?.points || 0,
        articlesRead,
        jobsSaved,
        applicationsSent,
        topicsCreated,
        repliesPosted,
        upvotesReceived,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get trending tags from news and forum
   */
  async getTrendingTags(limit: number = 10): Promise<TrendingTag[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Get news tags used in recent articles
      const newsTags = await this.prisma.$queryRaw<any[]>`
        SELECT
          nt.id,
          nt.name,
          nt.slug,
          COUNT(at.article_id) as usage_count,
          'news' as type
        FROM news_tags nt
        JOIN article_tags at ON nt.id = at.tag_id
        JOIN articles a ON at.article_id = a.id
        WHERE a.published_at >= ${oneDayAgo}
        GROUP BY nt.id, nt.name, nt.slug
        ORDER BY usage_count DESC
        LIMIT ${Math.ceil(limit / 2)}
      `;

      // Get forum tags used in recent topics
      const forumTags = await this.prisma.$queryRaw<any[]>`
        SELECT
          ft.id,
          ft.name,
          ft.slug,
          COUNT(tt.topic_id) as usage_count,
          'forum' as type
        FROM forum_tags ft
        JOIN topic_tags tt ON ft.id = tt.tag_id
        JOIN topics t ON tt.topic_id = t.id
        WHERE t.created_at >= ${oneDayAgo}
        GROUP BY ft.id, ft.name, ft.slug
        ORDER BY usage_count DESC
        LIMIT ${Math.ceil(limit / 2)}
      `;

      const allTags = [...newsTags, ...forumTags].map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        usageCount: Number(tag.usage_count),
        type: tag.type as 'news' | 'forum',
      }));

      // Sort by usage count and return top tags
      return allTags.sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get user's recent activity
   */
  async getUserActivity(userId: string, limit: number = 10): Promise<UserActivity[]> {
    try {
      const [topics, replies, applications, bookmarks] = await Promise.all([
        // Recent topics created
        this.prisma.topic.findMany({
          where: { authorId: userId },
          select: {
            id: true,
            title: true,
            slug: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        // Recent replies posted
        this.prisma.reply.findMany({
          where: { authorId: userId },
          select: {
            id: true,
            content: true,
            createdAt: true,
            topic: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        // Recent job applications
        this.prisma.jobApplication.findMany({
          where: { userId },
          select: {
            id: true,
            createdAt: true,
            job: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        // Recent article bookmarks
        this.prisma.bookmark.findMany({
          where: {
            userId,
            bookmarkableType: 'article',
          },
          select: {
            id: true,
            bookmarkableId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
      ]);

      // Get article details for bookmarks
      const articleIds = bookmarks.map((b) => b.bookmarkableId);
      const articles = await this.prisma.article.findMany({
        where: { id: { in: articleIds } },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });

      const articleMap = new Map(articles.map((a) => [a.id, a]));

      // Combine all activities
      const activities: UserActivity[] = [];

      topics.forEach((topic) => {
        activities.push({
          id: topic.id,
          type: 'topic_created',
          title: topic.title,
          url: `/forum/${topic.slug}`,
          createdAt: topic.createdAt,
        });
      });

      replies.forEach((reply) => {
        activities.push({
          id: reply.id,
          type: 'reply_posted',
          title: `Reply to: ${reply.topic.title}`,
          url: `/forum/${reply.topic.slug}#reply-${reply.id}`,
          createdAt: reply.createdAt,
        });
      });

      applications.forEach((app) => {
        activities.push({
          id: app.id,
          type: 'application_sent',
          title: `Applied to: ${app.job.title}`,
          url: `/jobs/${app.job.slug}`,
          createdAt: app.createdAt,
        });
      });

      bookmarks.forEach((bookmark) => {
        const article = articleMap.get(bookmark.bookmarkableId);
        if (article) {
          activities.push({
            id: bookmark.id,
            type: 'article_bookmarked',
            title: `Bookmarked: ${article.title}`,
            url: `/news/${article.slug}`,
            createdAt: bookmark.createdAt,
          });
        }
      });

      // Sort by recency and return top activities
      return activities
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get user's dashboard configuration
   */
  async getDashboardConfig(userId: string): Promise<DashboardConfig | null> {
    try {
      const config = await this.prisma.userDashboardConfig.findUnique({
        where: { userId },
      });

      if (!config || !config.widgetConfig) {
        return this.getDefaultDashboardConfig();
      }

      return config.widgetConfig as DashboardConfig;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Update user's dashboard configuration
   */
  async updateDashboardConfig(
    userId: string,
    config: DashboardConfig
  ): Promise<DashboardConfig> {
    try {
      const updated = await this.prisma.userDashboardConfig.upsert({
        where: { userId },
        create: {
          userId,
          widgetConfig: config as any,
        },
        update: {
          widgetConfig: config as any,
        },
      });

      return updated.widgetConfig as DashboardConfig;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get default dashboard configuration
   */
  private getDefaultDashboardConfig(): DashboardConfig {
    return {
      widgets: [
        { id: 'top_stories_today', enabled: true, order: 0 },
        { id: 'trending_discussions', enabled: true, order: 1 },
        { id: 'job_matches', enabled: true, order: 2 },
        { id: 'your_stats', enabled: true, order: 3 },
        { id: 'following_activity', enabled: true, order: 4 },
        { id: 'trending_tags', enabled: true, order: 5 },
      ],
    };
  }
}
