import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * RecommendationsRepository
 *
 * Data access layer for the recommendation engine.
 * Handles querying user interactions and content for recommendation algorithms.
 */

export class RecommendationsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get user's explicit interactions (bookmarks, upvotes, follows, applications)
   */
  async getUserExplicitInteractions(userId: string, limit: number = 100) {
    try {
      const [bookmarks, topicVotes, replyVotes, follows, applications] = await Promise.all([
        // Article bookmarks
        this.prisma.bookmark.findMany({
          where: { userId, deletedAt: null },
          select: {
            articleId: true,
            createdAt: true,
            article: {
              select: {
                title: true,
                categoryId: true,
                tags: { select: { tag: { select: { id: true, name: true } } } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),

        // Forum topic votes
        this.prisma.topicVote.findMany({
          where: { userId, value: { gt: 0 } },
          select: {
            topicId: true,
            value: true,
            createdAt: true,
            topic: {
              select: {
                title: true,
                categoryId: true,
                type: true,
                tags: { select: { tag: { select: { id: true, name: true } } } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),

        // Reply votes
        this.prisma.replyVote.findMany({
          where: { userId, value: { gt: 0 } },
          select: {
            replyId: true,
            value: true,
            createdAt: true,
            reply: {
              select: {
                topicId: true,
                topic: {
                  select: {
                    categoryId: true,
                    tags: { select: { tag: { select: { id: true, name: true } } } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),

        // User follows
        this.prisma.follow.findMany({
          where: { followerId: userId },
          select: {
            followingId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),

        // Job applications
        this.prisma.jobApplication.findMany({
          where: { userId },
          select: {
            jobId: true,
            appliedAt: true,
            job: {
              select: {
                title: true,
                companyId: true,
                requiredSkills: true,
                jobType: true,
                experienceLevel: true,
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
          take: limit,
        }),
      ]);

      return {
        bookmarks,
        topicVotes,
        replyVotes,
        follows,
        applications,
      };
    } catch (error) {
      logger.error('Failed to get user explicit interactions:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_explicit_interactions' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get user's implicit interactions (views, read time)
   */
  async getUserImplicitInteractions(userId: string, daysAgo: number = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - daysAgo);

      const articleViews = await this.prisma.articleView.findMany({
        where: {
          userId,
          createdAt: { gte: since },
        },
        select: {
          articleId: true,
          readTimeSeconds: true,
          scrollDepth: true,
          createdAt: true,
          article: {
            select: {
              categoryId: true,
              tags: { select: { tag: { select: { id: true, name: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });

      return { articleViews };
    } catch (error) {
      logger.error('Failed to get user implicit interactions:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_implicit_interactions' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get user profile information for content-based filtering
   */
  async getUserProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          profile: {
            select: {
              headline: true,
              bio: true,
              currentRole: true,
              experienceLevel: true,
              primarySkills: true,
            },
          },
          skills: {
            select: {
              skillName: true,
              proficiencyLevel: true,
            },
          },
          jobPreferences: {
            select: {
              desiredRoles: true,
              desiredSkills: true,
              jobType: true,
              workLocation: true,
              experienceLevel: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_user_profile' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Find similar users based on interaction overlap (for collaborative filtering)
   */
  async findSimilarUsers(userId: string, limit: number = 50) {
    try {
      // Find users who bookmarked similar articles
      const similarByBookmarks = await this.prisma.$queryRaw<
        Array<{ user_id: string; similarity_score: number }>
      >`
        SELECT
          b2.user_id,
          COUNT(DISTINCT b2.article_id)::decimal /
            NULLIF(
              (SELECT COUNT(DISTINCT article_id) FROM bookmarks WHERE user_id = ${userId}),
              0
            ) as similarity_score
        FROM bookmarks b1
        INNER JOIN bookmarks b2
          ON b1.article_id = b2.article_id
          AND b2.user_id != ${userId}
        WHERE b1.user_id = ${userId}
          AND b1.deleted_at IS NULL
          AND b2.deleted_at IS NULL
        GROUP BY b2.user_id
        HAVING COUNT(DISTINCT b2.article_id) >= 3
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;

      return similarByBookmarks.map((row) => ({
        userId: row.user_id,
        similarityScore: Number(row.similarity_score),
      }));
    } catch (error) {
      logger.error('Failed to find similar users:', error);
      Sentry.captureException(error, {
        tags: { operation: 'find_similar_users' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get trending content (for diversity boost)
   */
  async getTrendingContent(limit: number = 20) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - 7); // Last 7 days

      const [trendingArticles, trendingTopics, trendingJobs] = await Promise.all([
        // Trending articles
        this.prisma.article.findMany({
          where: {
            status: 'published',
            publishedAt: { gte: since },
          },
          select: {
            id: true,
            title: true,
            categoryId: true,
            viewCount: true,
            bookmarkCount: true,
            publishedAt: true,
            tags: { select: { tag: { select: { id: true, name: true } } } },
          },
          orderBy: [{ viewCount: 'desc' }, { bookmarkCount: 'desc' }],
          take: limit,
        }),

        // Trending topics
        this.prisma.topic.findMany({
          where: {
            status: 'open',
            createdAt: { gte: since },
          },
          select: {
            id: true,
            title: true,
            categoryId: true,
            type: true,
            viewCount: true,
            upvotes: true,
            replyCount: true,
            createdAt: true,
            tags: { select: { tag: { select: { id: true, name: true } } } },
          },
          orderBy: [{ upvotes: 'desc' }, { replyCount: 'desc' }],
          take: limit,
        }),

        // Trending jobs
        this.prisma.job.findMany({
          where: {
            status: 'active',
            createdAt: { gte: since },
          },
          select: {
            id: true,
            title: true,
            companyId: true,
            viewCount: true,
            applicationCount: true,
            requiredSkills: true,
            createdAt: true,
          },
          orderBy: [{ viewCount: 'desc' }, { applicationCount: 'desc' }],
          take: limit,
        }),
      ]);

      return {
        articles: trendingArticles,
        topics: trendingTopics,
        jobs: trendingJobs,
      };
    } catch (error) {
      logger.error('Failed to get trending content:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_trending_content' },
      });
      throw error;
    }
  }

  /**
   * Get user's recommendation feedback
   */
  async getUserFeedback(userId: string) {
    try {
      const feedback = await this.prisma.recommendationFeedback.findMany({
        where: { userId },
        select: {
          itemType: true,
          itemId: true,
          feedback: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return feedback;
    } catch (error) {
      logger.error('Failed to get user feedback:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_user_feedback' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Create or update recommendation feedback
   */
  async upsertFeedback(
    userId: string,
    itemType: string,
    itemId: string,
    feedback: string
  ) {
    try {
      return await this.prisma.recommendationFeedback.upsert({
        where: {
          userId_itemType_itemId: {
            userId,
            itemType,
            itemId,
          },
        },
        create: {
          userId,
          itemType,
          itemId,
          feedback,
        },
        update: {
          feedback,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to upsert feedback:', error);
      Sentry.captureException(error, {
        tags: { operation: 'upsert_feedback' },
        extra: { userId, itemType, itemId, feedback },
      });
      throw error;
    }
  }

  /**
   * Get content items by IDs
   */
  async getContentByIds(
    itemType: string,
    itemIds: string[]
  ): Promise<any[]> {
    try {
      switch (itemType) {
        case 'article':
          return await this.prisma.article.findMany({
            where: { id: { in: itemIds }, status: 'published' },
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              categoryId: true,
              category: { select: { name: true } },
              author: { select: { id: true, username: true } },
              publishedAt: true,
              viewCount: true,
              bookmarkCount: true,
              tags: { select: { tag: { select: { id: true, name: true } } } },
            },
          });

        case 'forum_topic':
          return await this.prisma.topic.findMany({
            where: { id: { in: itemIds }, status: 'open' },
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              categoryId: true,
              category: { select: { name: true } },
              author: { select: { id: true, username: true } },
              createdAt: true,
              viewCount: true,
              upvotes: true,
              replyCount: true,
              tags: { select: { tag: { select: { id: true, name: true } } } },
            },
          });

        case 'job':
          return await this.prisma.job.findMany({
            where: { id: { in: itemIds }, status: 'active' },
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              companyId: true,
              company: { select: { name: true, logo: true } },
              jobType: true,
              workLocation: true,
              experienceLevel: true,
              requiredSkills: true,
              createdAt: true,
              viewCount: true,
              applicationCount: true,
            },
          });

        case 'user':
          return await this.prisma.user.findMany({
            where: { id: { in: itemIds }, status: 'active' },
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  fullName: true,
                  headline: true,
                  avatar: true,
                  currentRole: true,
                },
              },
              followerCount: true,
              followingCount: true,
            },
          });

        default:
          return [];
      }
    } catch (error) {
      logger.error('Failed to get content by IDs:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_content_by_ids' },
        extra: { itemType, itemIds },
      });
      throw error;
    }
  }
}
