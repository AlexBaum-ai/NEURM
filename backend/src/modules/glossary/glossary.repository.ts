import { GlossaryTerm, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import prisma from '@/config/database';
import logger from '@/utils/logger';
import { ListGlossaryQuery, SearchGlossaryQuery, CreateGlossaryTermData, UpdateGlossaryTermData } from './glossary.validation';

/**
 * Glossary Repository
 * Handles all database operations for glossary terms
 */
export class GlossaryRepository {
  /**
   * Generate slug from term
   */
  private generateSlug(term: string): string {
    return term
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Find all glossary terms with optional filtering and pagination
   */
  async findAll(query: ListGlossaryQuery): Promise<{
    data: GlossaryTerm[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        page = 1,
        limit = 50,
        category,
        letter,
        sortBy = 'term',
        sortOrder = 'asc',
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.GlossaryTermWhereInput = {
        ...(category && { category }),
        ...(letter && {
          term: {
            startsWith: letter,
            mode: 'insensitive',
          },
        }),
      };

      // Build orderBy
      const orderBy: Prisma.GlossaryTermOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [data, total] = await Promise.all([
        prisma.glossaryTerm.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        prisma.glossaryTerm.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to fetch glossary terms:', error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'findAll' },
        extra: { query },
      });
      throw error;
    }
  }

  /**
   * Find glossary term by slug
   */
  async findBySlug(slug: string): Promise<GlossaryTerm | null> {
    try {
      return await prisma.glossaryTerm.findUnique({
        where: { slug },
      });
    } catch (error) {
      logger.error(`Failed to fetch glossary term by slug: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'findBySlug' },
        extra: { slug },
      });
      throw error;
    }
  }

  /**
   * Find glossary term by ID
   */
  async findById(id: string): Promise<GlossaryTerm | null> {
    try {
      return await prisma.glossaryTerm.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error(`Failed to fetch glossary term by ID: ${id}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Search glossary terms (full-text search on term and definition)
   */
  async search(query: SearchGlossaryQuery): Promise<{
    data: GlossaryTerm[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { q, page = 1, limit = 20, category } = query;
      const skip = (page - 1) * limit;

      // Build where clause with OR search
      const where: Prisma.GlossaryTermWhereInput = {
        AND: [
          {
            OR: [
              { term: { contains: q, mode: 'insensitive' } },
              { definition: { contains: q, mode: 'insensitive' } },
              { examples: { contains: q, mode: 'insensitive' } },
            ],
          },
          ...(category ? [{ category }] : []),
        ],
      };

      const [data, total] = await Promise.all([
        prisma.glossaryTerm.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            // Prioritize exact term matches
            { term: 'asc' },
          ],
        }),
        prisma.glossaryTerm.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to search glossary terms:', error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'search' },
        extra: { query },
      });
      throw error;
    }
  }

  /**
   * Create a new glossary term
   */
  async create(data: CreateGlossaryTermData): Promise<GlossaryTerm> {
    try {
      const slug = this.generateSlug(data.term);

      const glossaryTerm = await prisma.glossaryTerm.create({
        data: {
          slug,
          term: data.term,
          definition: data.definition,
          examples: data.examples,
          category: data.category,
          relatedTerms: data.relatedTerms || [],
        },
      });

      logger.info(`Glossary term created: ${glossaryTerm.id}`);
      return glossaryTerm;
    } catch (error) {
      logger.error('Failed to create glossary term:', error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'create' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Update a glossary term
   */
  async update(id: string, data: UpdateGlossaryTermData): Promise<GlossaryTerm> {
    try {
      const updateData: Prisma.GlossaryTermUpdateInput = {
        ...(data.term && {
          term: data.term,
          slug: this.generateSlug(data.term),
        }),
        ...(data.definition && { definition: data.definition }),
        ...(data.examples !== undefined && { examples: data.examples }),
        ...(data.category && { category: data.category }),
        ...(data.relatedTerms && { relatedTerms: data.relatedTerms }),
      };

      const glossaryTerm = await prisma.glossaryTerm.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Glossary term updated: ${id}`);
      return glossaryTerm;
    } catch (error) {
      logger.error(`Failed to update glossary term: ${id}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'update' },
        extra: { id, data },
      });
      throw error;
    }
  }

  /**
   * Delete a glossary term
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.glossaryTerm.delete({
        where: { id },
      });

      logger.info(`Glossary term deleted: ${id}`);
    } catch (error) {
      logger.error(`Failed to delete glossary term: ${id}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Increment view count for a glossary term
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      await prisma.glossaryTerm.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to increment glossary term view count:', error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'incrementViewCount' },
        extra: { id },
      });
      // Don't throw - view count is not critical
    }
  }

  /**
   * Get popular glossary terms (by view count)
   */
  async getPopularTerms(limit: number = 10): Promise<GlossaryTerm[]> {
    try {
      return await prisma.glossaryTerm.findMany({
        take: limit,
        orderBy: {
          viewCount: 'desc',
        },
      });
    } catch (error) {
      logger.error('Failed to fetch popular glossary terms:', error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'getPopularTerms' },
        extra: { limit },
      });
      throw error;
    }
  }

  /**
   * Get all categories with term counts
   */
  async getCategoriesWithCounts(): Promise<Array<{ category: string; count: number }>> {
    try {
      const categories = await prisma.glossaryTerm.groupBy({
        by: ['category'],
        _count: {
          category: true,
        },
        orderBy: {
          category: 'asc',
        },
      });

      return categories.map((cat) => ({
        category: cat.category,
        count: cat._count.category,
      }));
    } catch (error) {
      logger.error('Failed to fetch categories with counts:', error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'getCategoriesWithCounts' },
      });
      throw error;
    }
  }

  /**
   * Get alphabetical index with counts (A-Z)
   */
  async getAlphabeticalIndex(): Promise<Array<{ letter: string; count: number }>> {
    try {
      // Get all terms
      const terms = await prisma.glossaryTerm.findMany({
        select: { term: true },
      });

      // Group by first letter
      const letterCounts = terms.reduce((acc: Record<string, number>, term) => {
        const firstLetter = term.term.charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstLetter)) {
          acc[firstLetter] = (acc[firstLetter] || 0) + 1;
        }
        return acc;
      }, {});

      // Convert to array and sort
      return Object.entries(letterCounts)
        .map(([letter, count]) => ({ letter, count }))
        .sort((a, b) => a.letter.localeCompare(b.letter));
    } catch (error) {
      logger.error('Failed to fetch alphabetical index:', error);
      Sentry.captureException(error, {
        tags: { repository: 'GlossaryRepository', method: 'getAlphabeticalIndex' },
      });
      throw error;
    }
  }
}

export default new GlossaryRepository();
