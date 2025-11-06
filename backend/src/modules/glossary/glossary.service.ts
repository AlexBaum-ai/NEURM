import { GlossaryTerm } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import glossaryRepository from './glossary.repository';
import {
  ListGlossaryQuery,
  SearchGlossaryQuery,
  CreateGlossaryTermData,
  UpdateGlossaryTermData,
} from './glossary.validation';

/**
 * Glossary Service
 * Business logic for glossary terms
 */
export class GlossaryService {
  /**
   * Get all glossary terms with filtering and pagination
   */
  async getAllTerms(query: ListGlossaryQuery) {
    try {
      return await glossaryRepository.findAll(query);
    } catch (error) {
      logger.error('Failed to get all glossary terms:', error);
      Sentry.captureException(error, {
        tags: { service: 'GlossaryService', method: 'getAllTerms' },
        extra: { query },
      });
      throw new Error('Failed to fetch glossary terms');
    }
  }

  /**
   * Get glossary term by slug with view count increment
   */
  async getTermBySlug(slug: string): Promise<GlossaryTerm | null> {
    try {
      const term = await glossaryRepository.findBySlug(slug);

      if (!term) {
        return null;
      }

      // Increment view count asynchronously (non-blocking)
      glossaryRepository.incrementViewCount(term.id).catch((error) => {
        logger.warn(`Failed to increment view count for glossary term ${term.id}:`, error);
      });

      return term;
    } catch (error) {
      logger.error(`Failed to get glossary term by slug: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'GlossaryService', method: 'getTermBySlug' },
        extra: { slug },
      });
      throw new Error('Failed to fetch glossary term details');
    }
  }

  /**
   * Search glossary terms
   */
  async searchTerms(query: SearchGlossaryQuery) {
    try {
      return await glossaryRepository.search(query);
    } catch (error) {
      logger.error('Failed to search glossary terms:', error);
      Sentry.captureException(error, {
        tags: { service: 'GlossaryService', method: 'searchTerms' },
        extra: { query },
      });
      throw new Error('Failed to search glossary terms');
    }
  }

  /**
   * Create a new glossary term (Admin only)
   */
  async createTerm(data: CreateGlossaryTermData): Promise<GlossaryTerm> {
    try {
      // Check if term already exists
      const existingTerm = await glossaryRepository.findBySlug(
        this.generateSlug(data.term)
      );

      if (existingTerm) {
        throw new Error('A glossary term with this name already exists');
      }

      return await glossaryRepository.create(data);
    } catch (error) {
      logger.error('Failed to create glossary term:', error);
      Sentry.captureException(error, {
        tags: { service: 'GlossaryService', method: 'createTerm' },
        extra: { data },
      });

      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }

      throw new Error('Failed to create glossary term');
    }
  }

  /**
   * Update a glossary term (Admin only)
   */
  async updateTerm(id: string, data: UpdateGlossaryTermData): Promise<GlossaryTerm | null> {
    try {
      // Check if term exists
      const existingTerm = await glossaryRepository.findById(id);

      if (!existingTerm) {
        return null;
      }

      // If updating term name, check for conflicts
      if (data.term && data.term !== existingTerm.term) {
        const conflictingTerm = await glossaryRepository.findBySlug(
          this.generateSlug(data.term)
        );

        if (conflictingTerm && conflictingTerm.id !== id) {
          throw new Error('A glossary term with this name already exists');
        }
      }

      return await glossaryRepository.update(id, data);
    } catch (error) {
      logger.error(`Failed to update glossary term: ${id}`, error);
      Sentry.captureException(error, {
        tags: { service: 'GlossaryService', method: 'updateTerm' },
        extra: { id, data },
      });

      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }

      throw new Error('Failed to update glossary term');
    }
  }

  /**
   * Delete a glossary term (Admin only)
   */
  async deleteTerm(id: string): Promise<boolean> {
    try {
      // Check if term exists
      const existingTerm = await glossaryRepository.findById(id);

      if (!existingTerm) {
        return false;
      }

      await glossaryRepository.delete(id);
      return true;
    } catch (error) {
      logger.error(`Failed to delete glossary term: ${id}`, error);
      Sentry.captureException(error, {
        tags: { service: 'GlossaryService', method: 'deleteTerm' },
        extra: { id },
      });
      throw new Error('Failed to delete glossary term');
    }
  }

  /**
   * Get popular glossary terms
   */
  async getPopularTerms(limit: number = 10): Promise<GlossaryTerm[]> {
    try {
      return await glossaryRepository.getPopularTerms(limit);
    } catch (error) {
      logger.error('Failed to get popular glossary terms:', error);
      Sentry.captureException(error, {
        tags: { service: 'GlossaryService', method: 'getPopularTerms' },
        extra: { limit },
      });
      throw new Error('Failed to fetch popular glossary terms');
    }
  }

  /**
   * Get categories with term counts
   */
  async getCategoriesWithCounts() {
    try {
      return await glossaryRepository.getCategoriesWithCounts();
    } catch (error) {
      logger.error('Failed to get categories with counts:', error);
      Sentry.captureException(error, {
        tags: { service: 'GlossaryService', method: 'getCategoriesWithCounts' },
      });
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get alphabetical index (A-Z with counts)
   */
  async getAlphabeticalIndex() {
    try {
      return await glossaryRepository.getAlphabeticalIndex();
    } catch (error) {
      logger.error('Failed to get alphabetical index:', error);
      Sentry.captureException(error, {
        tags: { service: 'GlossaryService', method: 'getAlphabeticalIndex' },
      });
      throw new Error('Failed to fetch alphabetical index');
    }
  }

  /**
   * Generate slug from term (helper method)
   */
  private generateSlug(term: string): string {
    return term
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export default new GlossaryService();
