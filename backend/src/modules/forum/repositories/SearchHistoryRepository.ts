import { PrismaClient, SearchHistory } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface CreateSearchHistoryData {
  userId: string;
  query: string;
  filters?: Record<string, any>;
  resultCount: number;
}

@injectable()
export class SearchHistoryRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Add a search to history
   * Automatically maintains only last 10 searches per user
   */
  async create(data: CreateSearchHistoryData): Promise<SearchHistory> {
    // Create the new search history entry
    const searchHistory = await this.prisma.searchHistory.create({
      data: {
        userId: data.userId,
        query: data.query,
        filters: data.filters || {},
        resultCount: data.resultCount,
      },
    });

    // Clean up old history (keep only last 10)
    await this.cleanupOldHistory(data.userId, 10);

    return searchHistory;
  }

  /**
   * Get search history for a user
   */
  async findByUserId(userId: string, limit: number = 10): Promise<SearchHistory[]> {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get distinct search queries for a user (for autocomplete)
   */
  async getDistinctQueries(userId: string, limit: number = 10): Promise<string[]> {
    const results = await this.prisma.searchHistory.findMany({
      where: { userId },
      select: { query: true },
      distinct: ['query'],
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return results.map((r) => r.query);
  }

  /**
   * Delete a specific search history entry
   */
  async delete(id: string, userId: string): Promise<SearchHistory> {
    // Verify ownership before deleting
    const searchHistory = await this.prisma.searchHistory.findFirst({
      where: { id, userId },
    });

    if (!searchHistory) {
      throw new Error('Search history not found or unauthorized');
    }

    return this.prisma.searchHistory.delete({
      where: { id },
    });
  }

  /**
   * Clear all search history for a user
   */
  async clearAll(userId: string): Promise<{ count: number }> {
    return this.prisma.searchHistory.deleteMany({
      where: { userId },
    });
  }

  /**
   * Clean up old history entries, keeping only the most recent N entries
   */
  private async cleanupOldHistory(userId: string, keepCount: number): Promise<void> {
    // Get all entries for the user, ordered by creation date
    const allEntries = await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    // If we have more than keepCount entries, delete the oldest ones
    if (allEntries.length > keepCount) {
      const entriesToDelete = allEntries.slice(keepCount);
      const idsToDelete = entriesToDelete.map((e) => e.id);

      await this.prisma.searchHistory.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });
    }
  }

  /**
   * Get popular search queries (across all users)
   */
  async getPopularQueries(limit: number = 10): Promise<{ query: string; count: number }[]> {
    // Use raw SQL for aggregation
    const results = await this.prisma.$queryRaw<{ query: string; count: bigint }[]>`
      SELECT query, COUNT(*) as count
      FROM search_history
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      query: r.query,
      count: Number(r.count),
    }));
  }
}
