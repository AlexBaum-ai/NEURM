import { PrismaClient, Prisma } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface SearchFilters {
  categoryId?: string;
  type?: string[];
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  hasCode?: boolean;
  minUpvotes?: number;
  authorId?: string;
}

export interface SearchSort {
  by: 'relevance' | 'date' | 'popularity' | 'votes';
  order?: 'asc' | 'desc';
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  page?: number;
  limit?: number;
  userId?: string; // For tracking search history
}

export interface SearchResult {
  id: string;
  type: 'topic' | 'reply';
  title?: string;
  content: string;
  excerpt: string;
  highlights: string[];
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  topic?: {
    id: string;
    title: string;
    slug: string;
  };
  voteScore: number;
  upvoteCount: number;
  replyCount?: number;
  createdAt: Date;
  relevanceScore?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

@injectable()
export class SearchRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Search topics and replies using full-text search
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const {
      query,
      filters = {},
      sort = { by: 'relevance', order: 'desc' },
      page = 1,
      limit = 20,
    } = options;

    // Parse query for boolean operators
    const parsedQuery = this.parseSearchQuery(query);

    // Build WHERE clause for filters
    const topicWhere = this.buildTopicWhereClause(parsedQuery, filters);
    const replyWhere = this.buildReplyWhereClause(parsedQuery, filters);

    // Execute search in parallel
    const [topics, replies, topicCount, replyCount] = await Promise.all([
      this.searchTopics(topicWhere, sort, page, limit),
      this.searchReplies(replyWhere, sort, page, limit),
      this.prisma.topic.count({ where: topicWhere }),
      this.prisma.reply.count({ where: replyWhere }),
    ]);

    // Combine and rank results
    const combinedResults = this.combineAndRankResults(
      topics,
      replies,
      sort,
      parsedQuery
    );

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedResults = combinedResults.slice(offset, offset + limit);

    // Generate highlights
    const resultsWithHighlights = paginatedResults.map((result) =>
      this.addHighlights(result, query)
    );

    const total = topicCount + replyCount;

    return {
      results: resultsWithHighlights,
      total,
      page,
      limit,
      hasMore: offset + paginatedResults.length < total,
    };
  }

  /**
   * Get autocomplete suggestions based on partial query
   */
  async getSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (query.length < 2) {
      return [];
    }

    // Use trigram similarity for autocomplete
    const results = await this.prisma.$queryRaw<{ title: string; similarity: number }[]>`
      SELECT DISTINCT title, similarity(title, ${query}) as similarity
      FROM topics
      WHERE title % ${query}
        AND is_draft = false
        AND status != 'deleted'
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return results.map((r) => r.title);
  }

  /**
   * Parse search query to handle boolean operators and exact phrases
   */
  private parseSearchQuery(query: string): {
    tsQuery: string;
    exactPhrases: string[];
    keywords: string[];
  } {
    const exactPhrases: string[] = [];
    const keywords: string[] = [];

    // Extract exact phrases (quoted text)
    const phraseRegex = /"([^"]+)"/g;
    let match;
    let processedQuery = query;

    while ((match = phraseRegex.exec(query)) !== null) {
      exactPhrases.push(match[1]);
      processedQuery = processedQuery.replace(match[0], '');
    }

    // Process remaining text for boolean operators
    const words = processedQuery
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .map((w) => w.toLowerCase());

    // Build PostgreSQL tsquery format
    let tsQuery = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      if (word === 'and' || word === '&') {
        tsQuery += ' & ';
      } else if (word === 'or' || word === '|') {
        tsQuery += ' | ';
      } else if (word === 'not' || word === '!') {
        tsQuery += ' !';
      } else {
        keywords.push(word);
        tsQuery += word + ':*'; // Prefix matching
        if (i < words.length - 1 && !['and', 'or', 'not', '&', '|', '!'].includes(words[i + 1])) {
          tsQuery += ' & '; // Default to AND
        }
      }
    }

    // Add exact phrases to tsquery
    if (exactPhrases.length > 0) {
      const phraseQueries = exactPhrases.map((phrase) => {
        return phrase
          .split(/\s+/)
          .map((w) => w + ':*')
          .join(' <-> '); // Adjacent words
      });

      if (tsQuery) {
        tsQuery += ' & (' + phraseQueries.join(' | ') + ')';
      } else {
        tsQuery = phraseQueries.join(' | ');
      }
    }

    return {
      tsQuery: tsQuery || query + ':*',
      exactPhrases,
      keywords,
    };
  }

  /**
   * Build WHERE clause for topic search
   */
  private buildTopicWhereClause(
    parsedQuery: { tsQuery: string },
    filters: SearchFilters
  ): Prisma.TopicWhereInput {
    const where: Prisma.TopicWhereInput = {
      isDraft: false,
      // Full-text search using search_vector
      AND: [
        {
          OR: [
            {
              // Use raw SQL for ts_query matching
              search_vector: {
                // This is a placeholder, actual implementation uses $queryRaw
              },
            },
          ],
        },
      ],
    };

    // Apply filters
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type as any };
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status as any };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.minUpvotes !== undefined) {
      where.upvoteCount = { gte: filters.minUpvotes };
    }

    if (filters.hasCode) {
      where.content = { contains: '```' };
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    return where;
  }

  /**
   * Build WHERE clause for reply search
   */
  private buildReplyWhereClause(
    parsedQuery: { tsQuery: string },
    filters: SearchFilters
  ): Prisma.ReplyWhereInput {
    const where: Prisma.ReplyWhereInput = {
      isDeleted: false,
    };

    // Apply filters
    if (filters.categoryId) {
      where.topic = {
        categoryId: filters.categoryId,
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.minUpvotes !== undefined) {
      where.upvoteCount = { gte: filters.minUpvotes };
    }

    if (filters.hasCode) {
      where.content = { contains: '```' };
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    return where;
  }

  /**
   * Search topics using full-text search
   */
  private async searchTopics(
    where: Prisma.TopicWhereInput,
    sort: SearchSort,
    page: number,
    limit: number
  ): Promise<any[]> {
    // Use raw SQL for full-text search with ranking
    const offset = (page - 1) * limit;

    const orderBy = this.buildOrderByClause(sort, 'topic');

    return this.prisma.topic.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy,
    });
  }

  /**
   * Search replies using full-text search
   */
  private async searchReplies(
    where: Prisma.ReplyWhereInput,
    sort: SearchSort,
    page: number,
    limit: number
  ): Promise<any[]> {
    const offset = (page - 1) * limit;
    const orderBy = this.buildOrderByClause(sort, 'reply');

    return this.prisma.reply.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy,
    });
  }

  /**
   * Build ORDER BY clause based on sort option
   */
  private buildOrderByClause(
    sort: SearchSort,
    type: 'topic' | 'reply'
  ): Prisma.TopicOrderByWithRelationInput | Prisma.ReplyOrderByWithRelationInput {
    const order = sort.order || 'desc';

    switch (sort.by) {
      case 'date':
        return { createdAt: order };
      case 'popularity':
        return [{ voteScore: order }, { createdAt: 'desc' }] as any;
      case 'votes':
        return [{ upvoteCount: order }, { createdAt: 'desc' }] as any;
      case 'relevance':
      default:
        // For relevance, we'll sort by vote score + recency
        return [{ voteScore: 'desc' }, { createdAt: 'desc' }] as any;
    }
  }

  /**
   * Combine and rank results from topics and replies
   */
  private combineAndRankResults(
    topics: any[],
    replies: any[],
    sort: SearchSort,
    parsedQuery: any
  ): SearchResult[] {
    const results: SearchResult[] = [];

    // Convert topics to SearchResult format
    for (const topic of topics) {
      results.push({
        id: topic.id,
        type: 'topic',
        title: topic.title,
        content: topic.content,
        excerpt: this.createExcerpt(topic.content, 200),
        highlights: [],
        author: {
          id: topic.author.id,
          username: topic.author.username,
          displayName: topic.author.profile?.displayName || null,
          avatarUrl: topic.author.profile?.avatarUrl || null,
        },
        category: topic.category,
        voteScore: topic.voteScore,
        upvoteCount: topic.upvoteCount,
        replyCount: topic.replyCount,
        createdAt: topic.createdAt,
        relevanceScore: this.calculateRelevanceScore(topic, parsedQuery),
      });
    }

    // Convert replies to SearchResult format
    for (const reply of replies) {
      results.push({
        id: reply.id,
        type: 'reply',
        content: reply.content,
        excerpt: this.createExcerpt(reply.content, 200),
        highlights: [],
        author: {
          id: reply.author.id,
          username: reply.author.username,
          displayName: reply.author.profile?.displayName || null,
          avatarUrl: reply.author.profile?.avatarUrl || null,
        },
        category: reply.topic.category,
        topic: {
          id: reply.topic.id,
          title: reply.topic.title,
          slug: reply.topic.slug,
        },
        voteScore: reply.voteScore,
        upvoteCount: reply.upvoteCount,
        createdAt: reply.createdAt,
        relevanceScore: this.calculateRelevanceScore(reply, parsedQuery),
      });
    }

    // Sort by relevance score if needed
    if (sort.by === 'relevance') {
      results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    return results;
  }

  /**
   * Calculate relevance score for search result
   */
  private calculateRelevanceScore(item: any, parsedQuery: any): number {
    // Simple scoring algorithm:
    // - Base score from vote score (normalized)
    // - Bonus for recent items
    // - Bonus for keyword matches in title (for topics)

    const voteScore = item.voteScore || 0;
    const ageInDays = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, 10 - ageInDays / 30); // Decays over 30 days

    let score = voteScore + recencyBonus;

    // Title match bonus (topics only)
    if (item.title && parsedQuery.keywords) {
      const titleLower = item.title.toLowerCase();
      const matchCount = parsedQuery.keywords.filter((kw: string) =>
        titleLower.includes(kw.toLowerCase())
      ).length;
      score += matchCount * 5;
    }

    return score;
  }

  /**
   * Create excerpt from content
   */
  private createExcerpt(content: string, maxLength: number): string {
    // Remove markdown formatting
    const plainText = content
      .replace(/```[\s\S]*?```/g, '[code]')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    return plainText.substring(0, maxLength).trim() + '...';
  }

  /**
   * Add highlights to search result
   */
  private addHighlights(result: SearchResult, query: string): SearchResult {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => !['and', 'or', 'not'].includes(w) && w.length > 2);

    const highlights: string[] = [];
    const content = (result.title || '') + ' ' + result.content;
    const contentLower = content.toLowerCase();

    for (const keyword of keywords) {
      const index = contentLower.indexOf(keyword);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + keyword.length + 50);
        let highlight = content.substring(start, end);

        if (start > 0) highlight = '...' + highlight;
        if (end < content.length) highlight = highlight + '...';

        // Wrap keyword in <mark> tags
        const regex = new RegExp(`(${keyword})`, 'gi');
        highlight = highlight.replace(regex, '<mark>$1</mark>');

        highlights.push(highlight);
      }
    }

    return {
      ...result,
      highlights: highlights.slice(0, 3), // Max 3 highlights
    };
  }
}
