import { PrismaClient } from '@prisma/client';
import { redis } from '@/config/redis';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';
import { RecommendationsRepository } from './recommendations.repository';

/**
 * RecommendationsService
 *
 * Implements AI recommendation engine with hybrid approach:
 * - 50% Collaborative Filtering (users similar to you liked X)
 * - 30% Content-Based Filtering (based on your interests)
 * - 20% Trending/Diversity (avoid filter bubble)
 *
 * Features:
 * - Personalized recommendations for articles, forum topics, jobs, users
 * - Relevance scoring (0-100)
 * - Explanation generation ('Because you...')
 * - Redis caching (6 hour TTL)
 * - Feedback learning
 */

const prisma = new PrismaClient();

interface Recommendation {
  type: 'article' | 'forum_topic' | 'job' | 'user';
  id: string;
  relevanceScore: number;
  explanation: string;
  data: any;
}

interface RecommendationOptions {
  userId: string;
  types?: Array<'article' | 'forum_topic' | 'job' | 'user'>;
  limit?: number;
  excludeIds?: string[];
  includeExplanations?: boolean;
}

class RecommendationsService {
  private repository: RecommendationsRepository;
  private readonly CACHE_TTL = 21600; // 6 hours in seconds
  private readonly CACHE_KEY_PREFIX = 'recommendations';

  // Algorithm weights
  private readonly COLLABORATIVE_WEIGHT = 0.5; // 50%
  private readonly CONTENT_BASED_WEIGHT = 0.3; // 30%
  private readonly TRENDING_WEIGHT = 0.2; // 20%

  constructor() {
    this.repository = new RecommendationsRepository(prisma);
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(
    options: RecommendationOptions
  ): Promise<Recommendation[]> {
    const startTime = Date.now();
    const {
      userId,
      types = ['article', 'forum_topic', 'job', 'user'],
      limit = 20,
      excludeIds = [],
      includeExplanations = true,
    } = options;

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(userId, types);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('Recommendations cache hit', { userId, types });
        return this.filterAndLimit(cached, excludeIds, limit);
      }

      // Get user data in parallel
      const [
        explicitInteractions,
        implicitInteractions,
        userProfile,
        similarUsers,
        trending,
        userFeedback,
      ] = await Promise.all([
        this.repository.getUserExplicitInteractions(userId),
        this.repository.getUserImplicitInteractions(userId),
        this.repository.getUserProfile(userId),
        this.repository.findSimilarUsers(userId),
        this.repository.getTrendingContent(),
        this.repository.getUserFeedback(userId),
      ]);

      // Build recommendations per type
      const recommendations: Recommendation[] = [];

      for (const type of types) {
        const typeRecs = await this.getRecommendationsForType(
          type,
          {
            userId,
            explicitInteractions,
            implicitInteractions,
            userProfile,
            similarUsers,
            trending,
            userFeedback,
          },
          includeExplanations
        );

        recommendations.push(...typeRecs);
      }

      // Sort by relevance score
      recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Cache results
      await this.setCache(cacheKey, recommendations);

      const duration = Date.now() - startTime;
      logger.info('Generated recommendations', {
        userId,
        types,
        count: recommendations.length,
        durationMs: duration,
      });

      // Log performance warning if > 200ms
      if (duration > 200) {
        logger.warn('Recommendation generation exceeded 200ms target', {
          userId,
          durationMs: duration,
        });
      }

      return this.filterAndLimit(recommendations, excludeIds, limit);
    } catch (error) {
      logger.error('Failed to generate recommendations:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_recommendations' },
        extra: { userId, types, limit },
      });
      throw error;
    }
  }

  /**
   * Get recommendations for a specific content type
   */
  private async getRecommendationsForType(
    type: 'article' | 'forum_topic' | 'job' | 'user',
    context: any,
    includeExplanations: boolean
  ): Promise<Recommendation[]> {
    const {
      userId,
      explicitInteractions,
      implicitInteractions,
      userProfile,
      similarUsers,
      trending,
      userFeedback,
    } = context;

    // Collect candidate IDs from different sources
    const collaborativeCandidates = await this.getCollaborativeCandidates(
      type,
      similarUsers,
      userId
    );

    const contentBasedCandidates = this.getContentBasedCandidates(
      type,
      explicitInteractions,
      implicitInteractions,
      userProfile
    );

    const trendingCandidates = this.getTrendingCandidates(type, trending);

    // Apply negative feedback filter
    const negativeFeedback = userFeedback
      .filter(
        (f) =>
          f.itemType === type &&
          (f.feedback === 'dislike' || f.feedback === 'not_interested')
      )
      .map((f) => f.itemId);

    // Merge and score candidates
    const scoredCandidates = this.scoreAndMergeCandidates(
      collaborativeCandidates,
      contentBasedCandidates,
      trendingCandidates,
      negativeFeedback
    );

    // Get top candidates
    const topCandidates = scoredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // Fetch full content data
    const itemIds = topCandidates.map((c) => c.id);
    const contentItems = await this.repository.getContentByIds(type, itemIds);

    // Build recommendations with explanations
    const recommendations: Recommendation[] = [];

    for (const candidate of topCandidates) {
      const content = contentItems.find((item) => item.id === candidate.id);
      if (!content) continue;

      const explanation = includeExplanations
        ? this.generateExplanation(type, candidate, context)
        : '';

      recommendations.push({
        type,
        id: candidate.id,
        relevanceScore: Math.round(candidate.score),
        explanation,
        data: content,
      });
    }

    return recommendations;
  }

  /**
   * Get collaborative filtering candidates
   */
  private async getCollaborativeCandidates(
    type: string,
    similarUsers: Array<{ userId: string; similarityScore: number }>,
    currentUserId: string
  ): Promise<Array<{ id: string; score: number; source: string }>> {
    if (similarUsers.length === 0) return [];

    try {
      const userIds = similarUsers.map((u) => u.userId);
      let items: any[] = [];

      switch (type) {
        case 'article':
          items = await prisma.bookmark.findMany({
            where: {
              userId: { in: userIds },
              deletedAt: null,
            },
            select: {
              articleId: true,
              userId: true,
            },
          });
          break;

        case 'forum_topic':
          items = await prisma.topicVote.findMany({
            where: {
              userId: { in: userIds },
              value: { gt: 0 },
            },
            select: {
              topicId: true,
              userId: true,
            },
          });
          break;

        case 'job':
          items = await prisma.jobApplication.findMany({
            where: {
              userId: { in: userIds },
            },
            select: {
              jobId: true,
              userId: true,
            },
          });
          break;

        case 'user':
          items = await prisma.follow.findMany({
            where: {
              followerId: { in: userIds },
              followingId: { not: currentUserId },
            },
            select: {
              followingId: true,
              followerId: true,
            },
          });
          break;
      }

      // Score items based on similarity of users who liked them
      const itemScores = new Map<string, number>();

      for (const item of items) {
        const itemId =
          (item as any).articleId ||
          (item as any).topicId ||
          (item as any).jobId ||
          (item as any).followingId;
        const fromUserId = (item as any).userId || (item as any).followerId;

        const similarUser = similarUsers.find((u) => u.userId === fromUserId);
        if (!similarUser) continue;

        const currentScore = itemScores.get(itemId) || 0;
        itemScores.set(itemId, currentScore + similarUser.similarityScore);
      }

      // Convert to array and normalize scores
      const maxScore = Math.max(...Array.from(itemScores.values()), 1);

      return Array.from(itemScores.entries()).map(([id, score]) => ({
        id,
        score: (score / maxScore) * 100 * this.COLLABORATIVE_WEIGHT,
        source: 'collaborative',
      }));
    } catch (error) {
      logger.error('Failed to get collaborative candidates:', error);
      return [];
    }
  }

  /**
   * Get content-based filtering candidates
   */
  private getContentBasedCandidates(
    type: string,
    explicitInteractions: any,
    implicitInteractions: any,
    userProfile: any
  ): Array<{ id: string; score: number; source: string }> {
    // Extract tags/categories from user's past interactions
    const interestTags = new Set<string>();
    const interestCategories = new Set<string>();

    // From bookmarks
    if (explicitInteractions.bookmarks) {
      for (const bookmark of explicitInteractions.bookmarks) {
        if (bookmark.article.categoryId) {
          interestCategories.add(bookmark.article.categoryId);
        }
        if (bookmark.article.tags) {
          bookmark.article.tags.forEach((t: any) =>
            interestTags.add(t.tag.id)
          );
        }
      }
    }

    // From topic votes
    if (explicitInteractions.topicVotes) {
      for (const vote of explicitInteractions.topicVotes) {
        if (vote.topic.categoryId) {
          interestCategories.add(vote.topic.categoryId);
        }
        if (vote.topic.tags) {
          vote.topic.tags.forEach((t: any) => interestTags.add(t.tag.id));
        }
      }
    }

    // From user skills (for jobs)
    const userSkills = new Set<string>();
    if (userProfile?.skills) {
      userProfile.skills.forEach((s: any) => userSkills.add(s.skillName.toLowerCase()));
    }
    if (userProfile?.jobPreferences?.desiredSkills) {
      userProfile.jobPreferences.desiredSkills.forEach((s: string) =>
        userSkills.add(s.toLowerCase())
      );
    }

    // For now, return empty - in production, you'd query content matching these interests
    // This would require additional database queries based on the collected interests
    return [];
  }

  /**
   * Get trending/diversity candidates
   */
  private getTrendingCandidates(
    type: string,
    trending: any
  ): Array<{ id: string; score: number; source: string }> {
    let items: any[] = [];

    switch (type) {
      case 'article':
        items = trending.articles || [];
        break;
      case 'forum_topic':
        items = trending.topics || [];
        break;
      case 'job':
        items = trending.jobs || [];
        break;
      default:
        return [];
    }

    // Score based on position in trending list
    return items.map((item, index) => ({
      id: item.id,
      score: ((items.length - index) / items.length) * 100 * this.TRENDING_WEIGHT,
      source: 'trending',
    }));
  }

  /**
   * Merge and score candidates from different sources
   */
  private scoreAndMergeCandidates(
    collaborative: Array<{ id: string; score: number; source: string }>,
    contentBased: Array<{ id: string; score: number; source: string }>,
    trending: Array<{ id: string; score: number; source: string }>,
    excludeIds: string[]
  ): Array<{ id: string; score: number; sources: string[] }> {
    const scoreMap = new Map<string, { score: number; sources: Set<string> }>();

    // Merge all candidates
    const allCandidates = [...collaborative, ...contentBased, ...trending];

    for (const candidate of allCandidates) {
      if (excludeIds.includes(candidate.id)) continue;

      const existing = scoreMap.get(candidate.id);
      if (existing) {
        existing.score += candidate.score;
        existing.sources.add(candidate.source);
      } else {
        scoreMap.set(candidate.id, {
          score: candidate.score,
          sources: new Set([candidate.source]),
        });
      }
    }

    // Convert to array
    return Array.from(scoreMap.entries()).map(([id, data]) => ({
      id,
      score: Math.min(data.score, 100), // Cap at 100
      sources: Array.from(data.sources),
    }));
  }

  /**
   * Generate explanation for recommendation
   */
  private generateExplanation(
    type: string,
    candidate: any,
    context: any
  ): string {
    const sources = candidate.sources || [];

    if (sources.includes('collaborative')) {
      return 'Because users with similar interests liked this';
    }

    if (sources.includes('trending')) {
      return 'Trending in the community';
    }

    if (sources.includes('content')) {
      return 'Based on your interests and past activity';
    }

    return 'Recommended for you';
  }

  /**
   * Submit recommendation feedback
   */
  async submitFeedback(
    userId: string,
    itemType: string,
    itemId: string,
    feedback: string
  ) {
    try {
      const result = await this.repository.upsertFeedback(
        userId,
        itemType,
        itemId,
        feedback
      );

      // Invalidate cache to refresh recommendations
      await this.invalidateUserCache(userId);

      logger.info('Recommendation feedback submitted', {
        userId,
        itemType,
        itemId,
        feedback,
      });

      return result;
    } catch (error) {
      logger.error('Failed to submit feedback:', error);
      Sentry.captureException(error, {
        tags: { operation: 'submit_feedback' },
        extra: { userId, itemType, itemId, feedback },
      });
      throw error;
    }
  }

  /**
   * Get cache key for user recommendations
   */
  private getCacheKey(
    userId: string,
    types: Array<'article' | 'forum_topic' | 'job' | 'user'>
  ): string {
    return `${this.CACHE_KEY_PREFIX}:${userId}:${types.sort().join(',')}`;
  }

  /**
   * Get recommendations from cache
   */
  private async getFromCache(key: string): Promise<Recommendation[] | null> {
    try {
      const cached = await redis.get(key);
      if (!cached) return null;

      return JSON.parse(cached);
    } catch (error) {
      logger.error('Failed to get from cache:', error);
      return null;
    }
  }

  /**
   * Set recommendations to cache
   */
  private async setCache(
    key: string,
    recommendations: Recommendation[]
  ): Promise<void> {
    try {
      await redis.setex(key, this.CACHE_TTL, JSON.stringify(recommendations));
    } catch (error) {
      logger.error('Failed to set cache:', error);
    }
  }

  /**
   * Invalidate all cached recommendations for a user
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      const pattern = `${this.CACHE_KEY_PREFIX}:${userId}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug('Invalidated recommendation cache', { userId, keysCount: keys.length });
      }
    } catch (error) {
      logger.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Filter and limit recommendations
   */
  private filterAndLimit(
    recommendations: Recommendation[],
    excludeIds: string[],
    limit: number
  ): Recommendation[] {
    return recommendations
      .filter((rec) => !excludeIds.includes(rec.id))
      .slice(0, limit);
  }
}

export default new RecommendationsService();
