/**
 * Search Repository
 *
 * Data access layer for search operations
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  ContentType,
  SearchOptions,
  SearchResult,
  AutocompleteResult,
  SavedSearchInput,
  SearchHistoryEntry,
  PopularSearch,
} from './types/search.types';

export class SearchRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Search articles using PostgreSQL full-text search
   */
  async searchArticles(
    query: string,
    limit: number,
    offset: number
  ): Promise<any[]> {
    const tsQuery = query
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word) => `${word}:*`)
      .join(' & ');

    return this.prisma.$queryRaw<any[]>`
      SELECT
        a.id,
        a.title,
        a.slug,
        a.summary AS excerpt,
        a.content,
        a.published_at AS "publishedAt",
        a.view_count AS "viewCount",
        a.bookmark_count AS "bookmarkCount",
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt",
        a.author_name AS "authorName",
        nc.name AS "categoryName",
        (
          ts_rank(
            to_tsvector('english', a.title || ' ' || a.summary || ' ' || a.content),
            to_tsquery('english', ${tsQuery})
          ) *
          CASE WHEN to_tsvector('english', a.title) @@ to_tsquery('english', ${tsQuery}) THEN 3.0 ELSE 1.0 END
        ) AS relevance_score,
        ts_headline('english', a.title, to_tsquery('english', ${tsQuery}),
          'MaxWords=10, MinWords=5, ShortWord=3, HighlightAll=false, MaxFragments=1') AS title_highlight,
        ts_headline('english', a.summary, to_tsquery('english', ${tsQuery}),
          'MaxWords=30, MinWords=15, ShortWord=3, HighlightAll=false, MaxFragments=2') AS excerpt_highlight
      FROM articles a
      LEFT JOIN news_categories nc ON a.category_id = nc.id
      WHERE
        a.status = 'published'
        AND to_tsvector('english', a.title || ' ' || a.summary || ' ' || a.content) @@ to_tsquery('english', ${tsQuery})
      ORDER BY relevance_score DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  /**
   * Search forum topics
   */
  async searchForumTopics(
    query: string,
    limit: number,
    offset: number
  ): Promise<any[]> {
    const tsQuery = query
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word) => `${word}:*`)
      .join(' & ');

    return this.prisma.$queryRaw<any[]>`
      SELECT
        t.id,
        t.title,
        t.slug,
        t.content,
        LEFT(t.content, 300) AS excerpt,
        t.created_at AS "createdAt",
        t.updated_at AS "updatedAt",
        t.view_count AS "viewCount",
        t.reply_count AS "replyCount",
        t.vote_score AS "voteScore",
        t.upvote_count AS "upvoteCount",
        t.type,
        t.status,
        u.username AS "authorUsername",
        u.id AS "authorId",
        fc.name AS "categoryName",
        (
          ts_rank(
            to_tsvector('english', t.title || ' ' || t.content),
            to_tsquery('english', ${tsQuery})
          ) *
          CASE WHEN to_tsvector('english', t.title) @@ to_tsquery('english', ${tsQuery}) THEN 2.0 ELSE 1.0 END
        ) AS relevance_score,
        ts_headline('english', t.title, to_tsquery('english', ${tsQuery}),
          'MaxWords=10, MinWords=5, ShortWord=3') AS title_highlight,
        ts_headline('english', t.content, to_tsquery('english', ${tsQuery}),
          'MaxWords=30, MinWords=15, ShortWord=3, MaxFragments=2') AS content_highlight
      FROM topics t
      LEFT JOIN users u ON t.author_id = u.id
      LEFT JOIN forum_categories fc ON t.category_id = fc.id
      WHERE
        t.status = 'open'
        AND t.is_hidden = false
        AND to_tsvector('english', t.title || ' ' || t.content) @@ to_tsquery('english', ${tsQuery})
      ORDER BY relevance_score DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  /**
   * Search forum replies
   */
  async searchForumReplies(
    query: string,
    limit: number,
    offset: number
  ): Promise<any[]> {
    const tsQuery = query
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word) => `${word}:*`)
      .join(' & ');

    return this.prisma.$queryRaw<any[]>`
      SELECT
        r.id,
        r.content,
        LEFT(r.content, 300) AS excerpt,
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt",
        r.vote_score AS "voteScore",
        r.upvote_count AS "upvoteCount",
        r.topic_id AS "topicId",
        u.username AS "authorUsername",
        u.id AS "authorId",
        t.title AS "topicTitle",
        t.slug AS "topicSlug",
        ts_rank(
          to_tsvector('english', r.content),
          to_tsquery('english', ${tsQuery})
        ) AS relevance_score,
        ts_headline('english', r.content, to_tsquery('english', ${tsQuery}),
          'MaxWords=40, MinWords=20, ShortWord=3, MaxFragments=2') AS content_highlight
      FROM replies r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN topics t ON r.topic_id = t.id
      WHERE
        r.is_deleted = false
        AND to_tsvector('english', r.content) @@ to_tsquery('english', ${tsQuery})
      ORDER BY relevance_score DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  /**
   * Search jobs
   */
  async searchJobs(
    query: string,
    limit: number,
    offset: number
  ): Promise<any[]> {
    const tsQuery = query
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word) => `${word}:*`)
      .join(' & ');

    return this.prisma.$queryRaw<any[]>`
      SELECT
        j.id,
        j.title,
        j.slug,
        j.description,
        LEFT(j.description, 300) AS excerpt,
        j.requirements,
        j.location,
        j.job_type AS "jobType",
        j.work_location AS "workLocation",
        j.experience_level AS "experienceLevel",
        j.salary_min AS "salaryMin",
        j.salary_max AS "salaryMax",
        j.salary_currency AS "salaryCurrency",
        j.published_at AS "publishedAt",
        j.view_count AS "viewCount",
        j.application_count AS "applicationCount",
        j.created_at AS "createdAt",
        j.updated_at AS "updatedAt",
        c.name AS "companyName",
        c.slug AS "companySlug",
        c.logo_url AS "companyLogo",
        (
          ts_rank(
            to_tsvector('english', j.title || ' ' || j.description || ' ' || j.requirements),
            to_tsquery('english', ${tsQuery})
          ) *
          CASE WHEN to_tsvector('english', j.title) @@ to_tsquery('english', ${tsQuery}) THEN 2.0 ELSE 1.0 END
        ) AS relevance_score,
        ts_headline('english', j.title, to_tsquery('english', ${tsQuery}),
          'MaxWords=10, MinWords=5, ShortWord=3') AS title_highlight,
        ts_headline('english', j.description, to_tsquery('english', ${tsQuery}),
          'MaxWords=30, MinWords=15, ShortWord=3, MaxFragments=2') AS description_highlight
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE
        j.status = 'published'
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
        AND to_tsvector('english', j.title || ' ' || j.description || ' ' || j.requirements) @@ to_tsquery('english', ${tsQuery})
      ORDER BY relevance_score DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  /**
   * Search users
   */
  async searchUsers(
    query: string,
    limit: number,
    offset: number
  ): Promise<any[]> {
    const similarityThreshold = 0.3;

    return this.prisma.$queryRaw<any[]>`
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at AS "createdAt",
        p.display_name AS "displayName",
        p.headline,
        p.bio,
        p.avatar_url AS "avatarUrl",
        p.location,
        p.availability_status AS "availabilityStatus",
        GREATEST(
          similarity(u.username, ${query}),
          similarity(COALESCE(p.display_name, ''), ${query}),
          similarity(COALESCE(p.headline, ''), ${query})
        ) AS relevance_score
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE
        u.status = 'active'
        AND (
          u.username ILIKE ${`%${query}%`}
          OR p.display_name ILIKE ${`%${query}%`}
          OR p.headline ILIKE ${`%${query}%`}
          OR similarity(u.username, ${query}) > ${similarityThreshold}
          OR similarity(COALESCE(p.display_name, ''), ${query}) > ${similarityThreshold}
        )
      ORDER BY relevance_score DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  /**
   * Search companies
   */
  async searchCompanies(
    query: string,
    limit: number,
    offset: number
  ): Promise<any[]> {
    const tsQuery = query
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word) => `${word}:*`)
      .join(' & ');

    return this.prisma.$queryRaw<any[]>`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.website,
        c.description,
        LEFT(COALESCE(c.description, ''), 300) AS excerpt,
        c.logo_url AS "logoUrl",
        c.industry,
        c.company_size AS "companySize",
        c.location,
        c.verified_company AS "verifiedCompany",
        c.follower_count AS "followerCount",
        c.view_count AS "viewCount",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        (
          similarity(c.name, ${query}) * 2.0 +
          ts_rank(
            to_tsvector('english', c.name || ' ' || COALESCE(c.description, '')),
            to_tsquery('english', ${tsQuery})
          )
        ) AS relevance_score,
        ts_headline('english', COALESCE(c.description, ''), to_tsquery('english', ${tsQuery}),
          'MaxWords=30, MinWords=15, ShortWord=3, MaxFragments=2') AS description_highlight
      FROM companies c
      WHERE
        c.name ILIKE ${`%${query}%`}
        OR to_tsvector('english', c.name || ' ' || COALESCE(c.description, '')) @@ to_tsquery('english', ${tsQuery})
      ORDER BY relevance_score DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query: string, limit: number = 10): Promise<AutocompleteResult[]> {
    const similarityThreshold = 0.3;

    // Get suggestions from articles, topics, jobs, and companies
    const suggestions = await this.prisma.$queryRaw<any[]>`
      (
        SELECT DISTINCT ON (title)
          title AS suggestion,
          'articles' AS type,
          COUNT(*) OVER (PARTITION BY title) AS count,
          similarity(title, ${query}) AS score
        FROM articles
        WHERE
          status = 'published'
          AND (title ILIKE ${`%${query}%`} OR similarity(title, ${query}) > ${similarityThreshold})
        ORDER BY title, score DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT DISTINCT ON (title)
          title AS suggestion,
          'forum_topics' AS type,
          COUNT(*) OVER (PARTITION BY title) AS count,
          similarity(title, ${query}) AS score
        FROM topics
        WHERE
          status = 'open'
          AND is_hidden = false
          AND (title ILIKE ${`%${query}%`} OR similarity(title, ${query}) > ${similarityThreshold})
        ORDER BY title, score DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT DISTINCT ON (title)
          title AS suggestion,
          'jobs' AS type,
          COUNT(*) OVER (PARTITION BY title) AS count,
          similarity(title, ${query}) AS score
        FROM jobs
        WHERE
          status = 'published'
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (title ILIKE ${`%${query}%`} OR similarity(title, ${query}) > ${similarityThreshold})
        ORDER BY title, score DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT DISTINCT ON (name)
          name AS suggestion,
          'companies' AS type,
          COUNT(*) OVER (PARTITION BY name) AS count,
          similarity(name, ${query}) AS score
        FROM companies
        WHERE
          name ILIKE ${`%${query}%`} OR similarity(name, ${query}) > ${similarityThreshold}
        ORDER BY name, score DESC
        LIMIT 3
      )
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    return suggestions.map((s) => ({
      suggestion: s.suggestion,
      type: s.type as ContentType,
      count: Number(s.count),
    }));
  }

  /**
   * Track search query
   */
  async trackSearchQuery(
    userId: string | undefined,
    query: string,
    contentTypes: ContentType[],
    resultsCount: number,
    sortBy?: string
  ): Promise<void> {
    await this.prisma.searchQuery.create({
      data: {
        userId,
        query,
        contentTypes,
        resultsCount,
        sortBy,
      },
    });
  }

  /**
   * Track clicked result
   */
  async trackClickedResult(
    queryId: string,
    resultId: string,
    resultType: ContentType
  ): Promise<void> {
    await this.prisma.searchQuery.update({
      where: { id: queryId },
      data: {
        clickedResultId: resultId,
        clickedResultType: resultType,
      },
    });
  }

  /**
   * Add to search history
   */
  async addToSearchHistory(
    userId: string,
    query: string,
    contentTypes: ContentType[],
    sortBy?: string
  ): Promise<void> {
    // Add new history entry
    await this.prisma.searchHistory.create({
      data: {
        userId,
        query,
        contentTypes,
        sortBy,
      },
    });

    // Keep only last 10 entries per user
    const histories = await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (histories.length > 10) {
      const idsToDelete = histories.slice(10).map((h) => h.id);
      await this.prisma.searchHistory.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });
    }
  }

  /**
   * Get search history
   */
  async getSearchHistory(userId: string): Promise<SearchHistoryEntry[]> {
    const histories = await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return histories.map((h) => ({
      id: h.id,
      query: h.query,
      contentTypes: h.contentTypes as ContentType[],
      sortBy: h.sortBy || undefined,
      createdAt: h.createdAt,
    }));
  }

  /**
   * Save search
   */
  async saveSearch(userId: string, input: SavedSearchInput): Promise<any> {
    return this.prisma.savedSearch.create({
      data: {
        userId,
        name: input.name,
        query: input.query,
        contentTypes: input.contentTypes || [],
        sortBy: input.sortBy,
        notificationEnabled: input.notificationEnabled || false,
      },
    });
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(userId: string): Promise<any[]> {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(userId: string, searchId: string): Promise<void> {
    await this.prisma.savedSearch.delete({
      where: {
        id: searchId,
        userId,
      },
    });
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit: number = 10): Promise<PopularSearch[]> {
    const popularSearches = await this.prisma.$queryRaw<any[]>`
      SELECT
        query,
        COUNT(*) as count,
        MAX(created_at) as "lastSearched"
      FROM search_queries
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    return popularSearches.map((s) => ({
      query: s.query,
      count: Number(s.count),
      lastSearched: s.lastSearched,
    }));
  }
}
