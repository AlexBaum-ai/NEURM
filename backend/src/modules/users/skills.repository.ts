import { PrismaClient, UserSkill } from '@prisma/client';
import prisma from '@/config/database';
import { CreateSkillInput, UpdateSkillInput, SkillType } from './skills.validation';

/**
 * Popular skill for autocomplete
 */
export interface PopularSkill {
  skillName: string;
  skillType: string;
  count: number;
}

/**
 * SkillsRepository
 * Data access layer for user skills operations
 */
export class SkillsRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create a new skill for a user
   */
  async create(userId: string, data: CreateSkillInput): Promise<UserSkill> {
    return this.prisma.userSkill.create({
      data: {
        userId,
        skillName: data.skillName,
        skillType: data.skillType,
        proficiency: data.proficiency,
      },
    });
  }

  /**
   * Find all skills for a user
   */
  async findByUserId(
    userId: string,
    options?: { skillType?: SkillType; limit?: number }
  ): Promise<UserSkill[]> {
    return this.prisma.userSkill.findMany({
      where: {
        userId,
        ...(options?.skillType && { skillType: options.skillType }),
      },
      orderBy: [{ proficiency: 'desc' }, { endorsementCount: 'desc' }],
      take: options?.limit || 50,
    });
  }

  /**
   * Find a specific skill by ID
   */
  async findById(skillId: string, userId: string): Promise<UserSkill | null> {
    return this.prisma.userSkill.findFirst({
      where: {
        id: skillId,
        userId, // Ensure user owns this skill
      },
    });
  }

  /**
   * Update skill proficiency
   */
  async update(skillId: string, userId: string, data: UpdateSkillInput): Promise<UserSkill> {
    return this.prisma.userSkill.update({
      where: {
        id: skillId,
        userId, // Ensure user owns this skill
      },
      data: {
        proficiency: data.proficiency,
      },
    });
  }

  /**
   * Delete a skill
   */
  async delete(skillId: string, userId: string): Promise<UserSkill> {
    return this.prisma.userSkill.delete({
      where: {
        id: skillId,
        userId, // Ensure user owns this skill
      },
    });
  }

  /**
   * Count skills for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.prisma.userSkill.count({
      where: { userId },
    });
  }

  /**
   * Check if a skill with the same name exists for the user
   */
  async existsByName(userId: string, skillName: string): Promise<boolean> {
    const count = await this.prisma.userSkill.count({
      where: {
        userId,
        skillName: {
          equals: skillName,
          mode: 'insensitive',
        },
      },
    });
    return count > 0;
  }

  /**
   * Get popular skills for autocomplete
   * Returns skills that match the query, ordered by frequency
   */
  async getPopularSkills(query: string, limit: number = 10): Promise<PopularSkill[]> {
    // Use raw query for efficient GROUP BY aggregation
    const results = await this.prisma.$queryRaw<PopularSkill[]>`
      SELECT
        skill_name as "skillName",
        skill_type as "skillType",
        COUNT(*)::int as count
      FROM user_skills
      WHERE LOWER(skill_name) LIKE LOWER(${`%${query}%`})
      GROUP BY skill_name, skill_type
      ORDER BY count DESC, skill_name ASC
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Get all unique skill names (for full autocomplete list)
   */
  async getAllUniqueSkills(limit: number = 100): Promise<Array<{ skillName: string; skillType: string }>> {
    const results = await this.prisma.userSkill.groupBy({
      by: ['skillName', 'skillType'],
      _count: {
        skillName: true,
      },
      orderBy: {
        _count: {
          skillName: 'desc',
        },
      },
      take: limit,
    });

    return results.map((r) => ({
      skillName: r.skillName,
      skillType: r.skillType,
    }));
  }
}

export default SkillsRepository;
