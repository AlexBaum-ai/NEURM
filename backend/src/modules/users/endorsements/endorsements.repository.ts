import { PrismaClient, SkillEndorsement, User, UserSkill } from '@prisma/client';
import prisma from '@/config/database';

/**
 * Endorsement with user details
 */
export interface EndorsementWithUser extends SkillEndorsement {
  user: {
    id: string;
    username: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      photoUrl: string | null;
      headline: string | null;
    } | null;
  };
}

/**
 * EndorsementsRepository
 * Data access layer for skill endorsements operations
 */
export class EndorsementsRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create a new endorsement
   */
  async create(
    userId: string,
    profileId: string,
    skillId: string
  ): Promise<SkillEndorsement> {
    return this.prisma.skillEndorsement.create({
      data: {
        userId,
        profileId,
        skillId,
      },
    });
  }

  /**
   * Delete an endorsement
   */
  async delete(userId: string, profileId: string, skillId: string): Promise<SkillEndorsement> {
    return this.prisma.skillEndorsement.delete({
      where: {
        userId_profileId_skillId: {
          userId,
          profileId,
          skillId,
        },
      },
    });
  }

  /**
   * Check if an endorsement exists
   */
  async exists(userId: string, profileId: string, skillId: string): Promise<boolean> {
    const count = await this.prisma.skillEndorsement.count({
      where: {
        userId,
        profileId,
        skillId,
      },
    });
    return count > 0;
  }

  /**
   * Get all endorsements for a specific skill
   */
  async findBySkillId(
    skillId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<EndorsementWithUser[]> {
    return this.prisma.skillEndorsement.findMany({
      where: { skillId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                photoUrl: true,
                headline: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });
  }

  /**
   * Count endorsements for a skill
   */
  async countBySkillId(skillId: string): Promise<number> {
    return this.prisma.skillEndorsement.count({
      where: { skillId },
    });
  }

  /**
   * Increment endorsement count on UserSkill
   */
  async incrementSkillEndorsementCount(skillId: string): Promise<UserSkill> {
    return this.prisma.userSkill.update({
      where: { id: skillId },
      data: {
        endorsementCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Decrement endorsement count on UserSkill
   */
  async decrementSkillEndorsementCount(skillId: string): Promise<UserSkill> {
    return this.prisma.userSkill.update({
      where: { id: skillId },
      data: {
        endorsementCount: {
          decrement: 1,
        },
      },
    });
  }

  /**
   * Execute multiple operations in a transaction
   */
  async transaction<T>(
    callback: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(callback as any);
  }
}

export default EndorsementsRepository;
