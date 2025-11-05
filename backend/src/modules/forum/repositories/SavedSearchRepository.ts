import { PrismaClient, SavedSearch, Prisma } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface CreateSavedSearchData {
  userId: string;
  name: string;
  query: string;
  filters?: Record<string, any>;
}

export interface UpdateSavedSearchData {
  name?: string;
  query?: string;
  filters?: Record<string, any>;
}

@injectable()
export class SavedSearchRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a saved search
   */
  async create(data: CreateSavedSearchData): Promise<SavedSearch> {
    return this.prisma.savedSearch.create({
      data: {
        userId: data.userId,
        name: data.name,
        query: data.query,
        filters: data.filters || {},
      },
    });
  }

  /**
   * Get all saved searches for a user
   */
  async findByUserId(userId: string): Promise<SavedSearch[]> {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a saved search by ID
   */
  async findById(id: string, userId: string): Promise<SavedSearch | null> {
    return this.prisma.savedSearch.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Update a saved search
   */
  async update(
    id: string,
    userId: string,
    data: UpdateSavedSearchData
  ): Promise<SavedSearch> {
    return this.prisma.savedSearch.update({
      where: {
        id,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a saved search
   */
  async delete(id: string, userId: string): Promise<SavedSearch> {
    // Verify ownership before deleting
    const savedSearch = await this.findById(id, userId);
    if (!savedSearch) {
      throw new Error('Saved search not found or unauthorized');
    }

    return this.prisma.savedSearch.delete({
      where: { id },
    });
  }

  /**
   * Count saved searches for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.prisma.savedSearch.count({
      where: { userId },
    });
  }

  /**
   * Check if a saved search name already exists for a user
   */
  async existsByName(userId: string, name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.SavedSearchWhereInput = {
      userId,
      name,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.savedSearch.count({ where });
    return count > 0;
  }
}
