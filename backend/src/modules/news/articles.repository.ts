import { Article, ArticleStatus, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import prisma from '@/config/database';
import logger from '@/utils/logger';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesQuery,
} from './articles.validation';

/**
 * Article Repository
 * Handles all database operations for articles
 */
export class ArticleRepository {
  /**
   * Create a new article
   */
  async create(
    data: CreateArticleInput,
    createdById: string
  ): Promise<Article> {
    try {
      const { tagIds, modelIds, ...articleData } = data;

      const article = await prisma.article.create({
        data: {
          ...articleData,
          createdById,
          updatedById: createdById,
          // Connect tags
          tags: tagIds && tagIds.length > 0
            ? {
                create: tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              }
            : undefined,
          // Connect models
          models: modelIds && modelIds.length > 0
            ? {
                create: modelIds.map((modelId, index) => ({
                  model: { connect: { id: modelId } },
                  isPrimary: index === 0, // First model is primary
                })),
              }
            : undefined,
        },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          models: {
            include: {
              model: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      logger.info(`Article created: ${article.id} (${article.slug})`);

      return article;
    } catch (error) {
      logger.error('Failed to create article:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRepository', method: 'create' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Find article by ID (all statuses)
   */
  async findById(id: string): Promise<Article | null> {
    try {
      return await prisma.article.findUnique({
        where: { id },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          models: {
            include: {
              model: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to find article by ID ${id}:`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRepository', method: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Find article by slug (public - only published)
   */
  async findBySlug(slug: string, userId?: string): Promise<Article | null> {
    try {
      const article = await prisma.article.findUnique({
        where: {
          slug,
          status: ArticleStatus.published,
        },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  bio: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          models: {
            include: {
              model: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  provider: true,
                  logoUrl: true,
                },
              },
            },
          },
          bookmarks: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
        },
      });

      return article;
    } catch (error) {
      logger.error(`Failed to find article by slug ${slug}:`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRepository', method: 'findBySlug' },
        extra: { slug, userId },
      });
      throw error;
    }
  }

  /**
   * List articles with filters and pagination (enhanced with full-text search)
   */
  async findMany(query: ListArticlesQuery): Promise<{
    articles: Article[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore?: boolean;
    nextCursor?: string;
  }> {
    try {
      const {
        page,
        limit,
        category,
        categoryId,
        tags,
        tagId,
        authorId,
        difficulty,
        difficultyLevel,
        model,
        modelId,
        isFeatured,
        isTrending,
        search,
        cursor,
        sortBy,
        sortOrder,
      } = query;

      // Use full-text search if searching
      if (search && sortBy === 'relevance') {
        return this.searchArticles(query);
      }

      const skip = cursor ? 0 : (page - 1) * limit;

      // Build where clause
      const where: Prisma.ArticleWhereInput = {
        status: ArticleStatus.published,
        publishedAt: { lte: new Date() },
      };

      // Apply cursor if provided
      if (cursor) {
        where.id = { lt: cursor };
      }

      // Category filter - support both slug and ID
      if (category) {
        where.category = {
          slug: category,
        };
      } else if (categoryId) {
        where.categoryId = categoryId;
      }

      // Tags filter - support multiple tags (AND logic)
      if (tags && tags.length > 0) {
        where.AND = tags.map((tag) => ({
          tags: {
            some: {
              tag: {
                slug: tag,
              },
            },
          },
        }));
      } else if (tagId) {
        where.tags = {
          some: { tagId },
        };
      }

      // Model filter - support slug
      if (model) {
        where.models = {
          some: {
            model: {
              slug: model,
            },
          },
        };
      } else if (modelId) {
        where.models = {
          some: { modelId },
        };
      }

      if (authorId) {
        where.authorId = authorId;
      }

      // Difficulty filter - support both field names
      const difficultyValue = difficulty || difficultyLevel;
      if (difficultyValue) {
        where.difficultyLevel = difficultyValue;
      }

      if (isFeatured !== undefined) {
        where.isFeatured = isFeatured;
      }

      if (isTrending !== undefined) {
        where.isTrending = isTrending;
      }

      // Simple text search (for non-relevance sorts)
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build order by clause
      let orderBy: Prisma.ArticleOrderByWithRelationInput = {};

      switch (sortBy) {
        case 'publishedAt':
          orderBy = { publishedAt: sortOrder };
          break;
        case 'viewCount':
          orderBy = { viewCount: sortOrder };
          break;
        case 'bookmarkCount':
          orderBy = { bookmarkCount: sortOrder };
          break;
        case 'createdAt':
          orderBy = { createdAt: sortOrder };
          break;
        default:
          orderBy = { publishedAt: 'desc' };
      }

      // Fetch one extra to check if there are more results
      const fetchLimit = cursor ? limit + 1 : limit;

      // Execute queries
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: {
            category: true,
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
            tags: {
              include: {
                tag: true,
              },
            },
            models: {
              include: {
                model: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
          orderBy,
          skip,
          take: fetchLimit,
        }),
        cursor ? Promise.resolve(0) : prisma.article.count({ where }),
      ]);

      // Handle cursor pagination
      let hasMore = false;
      let nextCursor: string | undefined;
      let resultArticles = articles;

      if (cursor) {
        hasMore = articles.length > limit;
        if (hasMore) {
          resultArticles = articles.slice(0, limit);
          nextCursor = resultArticles[resultArticles.length - 1].id;
        }
      }

      const totalPages = cursor ? 0 : Math.ceil(total / limit);

      return {
        articles: resultArticles,
        total: cursor ? articles.length : total,
        page,
        limit,
        totalPages,
        ...(cursor ? { hasMore, nextCursor } : {}),
      };
    } catch (error) {
      logger.error('Failed to list articles:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRepository', method: 'findMany' },
        extra: { query },
      });
      throw error;
    }
  }

  /**
   * Full-text search articles using PostgreSQL ts_rank and ts_headline
   */
  private async searchArticles(query: ListArticlesQuery): Promise<{
    articles: Article[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore?: boolean;
    nextCursor?: string;
  }> {
    try {
      const {
        page,
        limit,
        category,
        categoryId,
        tags,
        tagId,
        difficulty,
        difficultyLevel,
        model,
        modelId,
        isFeatured,
        isTrending,
        search,
        cursor,
        sortOrder,
      } = query;

      const skip = cursor ? 0 : (page - 1) * limit;

      // Build WHERE conditions
      const conditions: string[] = [
        "a.status = 'published'",
        'a.published_at <= NOW()',
      ];

      const params: any[] = [search];
      let paramIndex = 1;

      // Category filter
      if (category) {
        paramIndex++;
        conditions.push(`c.slug = $${paramIndex}`);
        params.push(category);
      } else if (categoryId) {
        paramIndex++;
        conditions.push(`a.category_id = $${paramIndex}`);
        params.push(categoryId);
      }

      // Difficulty filter
      const difficultyValue = difficulty || difficultyLevel;
      if (difficultyValue) {
        paramIndex++;
        conditions.push(`a.difficulty_level = $${paramIndex}`);
        params.push(difficultyValue);
      }

      if (isFeatured !== undefined) {
        paramIndex++;
        conditions.push(`a.is_featured = $${paramIndex}`);
        params.push(isFeatured);
      }

      if (isTrending !== undefined) {
        paramIndex++;
        conditions.push(`a.is_trending = $${paramIndex}`);
        params.push(isTrending);
      }

      // Tags filter (all tags must match)
      if (tags && tags.length > 0) {
        paramIndex++;
        conditions.push(`
          a.id IN (
            SELECT at.article_id
            FROM article_tags at
            JOIN news_tags nt ON at.tag_id = nt.id
            WHERE nt.slug = ANY($${paramIndex}::text[])
            GROUP BY at.article_id
            HAVING COUNT(DISTINCT nt.slug) = $${paramIndex + 1}
          )
        `);
        params.push(tags, tags.length);
        paramIndex++;
      } else if (tagId) {
        paramIndex++;
        conditions.push(`
          EXISTS (
            SELECT 1 FROM article_tags at
            WHERE at.article_id = a.id AND at.tag_id = $${paramIndex}
          )
        `);
        params.push(tagId);
      }

      // Model filter
      if (model) {
        paramIndex++;
        conditions.push(`
          EXISTS (
            SELECT 1 FROM article_models am
            JOIN llm_models lm ON am.model_id = lm.id
            WHERE am.article_id = a.id AND lm.slug = $${paramIndex}
          )
        `);
        params.push(model);
      } else if (modelId) {
        paramIndex++;
        conditions.push(`
          EXISTS (
            SELECT 1 FROM article_models am
            WHERE am.article_id = a.id AND am.model_id = $${paramIndex}
          )
        `);
        params.push(modelId);
      }

      // Cursor pagination
      if (cursor) {
        paramIndex++;
        conditions.push(`a.id < $${paramIndex}`);
        params.push(cursor);
      }

      const whereClause = conditions.join(' AND ');

      // Build full-text search query with ts_rank
      const sqlQuery = `
        WITH ranked_articles AS (
          SELECT
            a.id,
            a.title,
            a.slug,
            a.summary,
            a.content,
            a.featured_image_url,
            a.difficulty_level,
            a.reading_time_minutes,
            a.view_count,
            a.bookmark_count,
            a.published_at,
            a.created_at,
            ts_rank(
              to_tsvector('english',
                COALESCE(a.title, '') || ' ' ||
                COALESCE(a.summary, '') || ' ' ||
                COALESCE(a.content, '')
              ),
              plainto_tsquery('english', $1)
            ) as rank,
            ts_headline('english', a.title, plainto_tsquery('english', $1),
              'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=10'
            ) as highlighted_title,
            ts_headline('english', a.summary, plainto_tsquery('english', $1),
              'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
            ) as highlighted_summary
          FROM articles a
          LEFT JOIN news_categories c ON a.category_id = c.id
          WHERE ${whereClause}
            AND to_tsvector('english',
              COALESCE(a.title, '') || ' ' ||
              COALESCE(a.summary, '') || ' ' ||
              COALESCE(a.content, '')
            ) @@ plainto_tsquery('english', $1)
        )
        SELECT * FROM ranked_articles
        ORDER BY rank ${sortOrder === 'asc' ? 'ASC' : 'DESC'}, published_at DESC
        LIMIT ${limit + 1}
        OFFSET ${skip};
      `;

      // Execute search query
      const searchResults = await prisma.$queryRawUnsafe<any[]>(sqlQuery, ...params);

      // Check if there are more results
      const hasMore = searchResults.length > limit;
      const resultArticles = hasMore ? searchResults.slice(0, limit) : searchResults;

      // Get full article data for each result
      const articleIds = resultArticles.map((r) => r.id);
      const articles = await prisma.article.findMany({
        where: {
          id: { in: articleIds },
        },
        include: {
          category: true,
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
          tags: {
            include: {
              tag: true,
            },
          },
          models: {
            include: {
              model: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      // Sort articles by rank and maintain order
      const articleMap = new Map(articles.map((a) => [a.id, a]));
      const sortedArticles: Article[] = [];

      for (const id of articleIds) {
        const article = articleMap.get(id);
        if (article) {
          sortedArticles.push(article);
        }
      }

      // Add highlighting info to articles (as metadata)
      sortedArticles.forEach((article, index) => {
        const searchResult = resultArticles[index];
        if (searchResult) {
          (article as any).searchHighlight = {
            title: searchResult.highlighted_title,
            summary: searchResult.highlighted_summary,
            rank: searchResult.rank,
          };
        }
      });

      // Get total count for pagination (only if not using cursor)
      let total = 0;
      if (!cursor) {
        const countQuery = `
          SELECT COUNT(*) as count
          FROM articles a
          LEFT JOIN news_categories c ON a.category_id = c.id
          WHERE ${whereClause}
            AND to_tsvector('english',
              COALESCE(a.title, '') || ' ' ||
              COALESCE(a.summary, '') || ' ' ||
              COALESCE(a.content, '')
            ) @@ plainto_tsquery('english', $1);
        `;
        const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
          countQuery,
          ...params
        );
        total = Number(countResult[0].count);
      }

      const totalPages = cursor ? 0 : Math.ceil(total / limit);
      const nextCursor = hasMore && cursor ? sortedArticles[sortedArticles.length - 1].id : undefined;

      return {
        articles: sortedArticles,
        total: cursor ? sortedArticles.length : total,
        page,
        limit,
        totalPages,
        ...(cursor ? { hasMore, nextCursor } : {}),
      };
    } catch (error) {
      logger.error('Failed to search articles:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRepository', method: 'searchArticles' },
        extra: { query },
      });
      throw error;
    }
  }

  /**
   * Update article
   */
  async update(
    id: string,
    data: UpdateArticleInput,
    updatedById: string
  ): Promise<Article> {
    try {
      const { tagIds, modelIds, ...articleData } = data;

      // Build update data
      const updateData: Prisma.ArticleUpdateInput = {
        ...articleData,
        updatedBy: {
          connect: { id: updatedById },
        },
      };

      // Handle tags update
      if (tagIds !== undefined) {
        // Delete existing tags and create new ones
        await prisma.articleTag.deleteMany({
          where: { articleId: id },
        });

        if (tagIds.length > 0) {
          updateData.tags = {
            create: tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          };
        }
      }

      // Handle models update
      if (modelIds !== undefined) {
        // Delete existing models and create new ones
        await prisma.articleModel.deleteMany({
          where: { articleId: id },
        });

        if (modelIds.length > 0) {
          updateData.models = {
            create: modelIds.map((modelId, index) => ({
              model: { connect: { id: modelId } },
              isPrimary: index === 0,
            })),
          };
        }
      }

      const article = await prisma.article.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          models: {
            include: {
              model: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      logger.info(`Article updated: ${article.id} (${article.slug})`);

      return article;
    } catch (error) {
      logger.error(`Failed to update article ${id}:`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRepository', method: 'update' },
        extra: { id, data },
      });
      throw error;
    }
  }

  /**
   * Delete article
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.article.delete({
        where: { id },
      });

      logger.info(`Article deleted: ${id}`);
    } catch (error) {
      logger.error(`Failed to delete article ${id}:`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRepository', method: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Increment article view count
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      await prisma.article.update({
        where: { id },
        data: {
          viewCount: { increment: 1 },
        },
      });
    } catch (error) {
      logger.error(`Failed to increment view count for article ${id}:`, error);
      // Don't throw - view count is not critical
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRepository', method: 'incrementViewCount' },
        extra: { id },
      });
    }
  }

  /**
   * Find related articles based on tags
   */
  async findRelated(
    articleId: string,
    limit: number = 5
  ): Promise<Article[]> {
    try {
      // Get article tags
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          tags: {
            select: { tagId: true },
          },
        },
      });

      if (!article || article.tags.length === 0) {
        return [];
      }

      const tagIds = article.tags.map((t) => t.tagId);

      // Find articles with common tags, excluding the current article
      const relatedArticles = await prisma.article.findMany({
        where: {
          id: { not: articleId },
          status: ArticleStatus.published,
          publishedAt: { lte: new Date() },
          tags: {
            some: {
              tagId: { in: tagIds },
            },
          },
        },
        include: {
          category: true,
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
          tags: {
            include: {
              tag: true,
            },
          },
        },
        take: limit,
        orderBy: {
          viewCount: 'desc',
        },
      });

      return relatedArticles;
    } catch (error) {
      logger.error(`Failed to find related articles for ${articleId}:`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRepository', method: 'findRelated' },
        extra: { articleId, limit },
      });
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const count = await prisma.article.count({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });

      return count > 0;
    } catch (error) {
      logger.error(`Failed to check slug existence ${slug}:`, error);
      throw error;
    }
  }
}

export default ArticleRepository;
