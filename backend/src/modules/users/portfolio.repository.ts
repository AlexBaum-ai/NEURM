import { PrismaClient, PortfolioProject, Prisma } from '@prisma/client';
import prisma from '@/config/database';
import {
  CreatePortfolioProjectInput,
  UpdatePortfolioProjectInput,
} from './portfolio.validation';
import { BadRequestError } from '@/utils/errors';

/**
 * PortfolioProjectRepository
 * Data access layer for portfolio project operations
 */
export class PortfolioProjectRepository {
  private prisma: PrismaClient;
  private readonly MAX_FEATURED_PROJECTS = 5;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create a new portfolio project
   */
  async create(
    userId: string,
    data: CreatePortfolioProjectInput
  ): Promise<PortfolioProject> {
    // If project is marked as featured, check the featured count
    if (data.isFeatured) {
      await this.validateFeaturedCount(userId);
    }

    // Convert arrays to appropriate format for Prisma
    const createData: Prisma.PortfolioProjectCreateInput = {
      user: {
        connect: { id: userId },
      },
      title: data.title,
      description: data.description || null,
      techStack: data.techStack ? data.techStack : Prisma.JsonNull,
      projectUrl: data.projectUrl || null,
      githubUrl: data.githubUrl || null,
      demoUrl: data.demoUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      screenshots: data.screenshots || [],
      isFeatured: data.isFeatured || false,
      displayOrder: data.displayOrder || 0,
    };

    return this.prisma.portfolioProject.create({
      data: createData,
    });
  }

  /**
   * Find all portfolio projects for a user
   * Sorted by displayOrder and createdAt (most recent first)
   */
  async findByUserId(userId: string): Promise<PortfolioProject[]> {
    return this.prisma.portfolioProject.findMany({
      where: { userId },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Find a specific portfolio project by ID
   */
  async findById(
    id: string,
    userId: string
  ): Promise<PortfolioProject | null> {
    return this.prisma.portfolioProject.findFirst({
      where: {
        id,
        userId, // Ensure the project belongs to the user
      },
    });
  }

  /**
   * Update a portfolio project
   */
  async update(
    id: string,
    userId: string,
    data: UpdatePortfolioProjectInput
  ): Promise<PortfolioProject> {
    // If updating to featured, check the featured count
    if (data.isFeatured) {
      await this.validateFeaturedCount(userId, id);
    }

    // Build update data dynamically to only update provided fields
    const updateData: Prisma.PortfolioProjectUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.techStack !== undefined)
      updateData.techStack = data.techStack ? data.techStack : Prisma.JsonNull;
    if (data.projectUrl !== undefined) updateData.projectUrl = data.projectUrl;
    if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl;
    if (data.demoUrl !== undefined) updateData.demoUrl = data.demoUrl;
    if (data.thumbnailUrl !== undefined)
      updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.screenshots !== undefined)
      updateData.screenshots = data.screenshots || [];
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder;

    return this.prisma.portfolioProject.update({
      where: {
        id,
        userId, // Ensure the project belongs to the user
      },
      data: updateData,
    });
  }

  /**
   * Delete a portfolio project
   */
  async delete(id: string, userId: string): Promise<PortfolioProject> {
    return this.prisma.portfolioProject.delete({
      where: {
        id,
        userId, // Ensure the project belongs to the user
      },
    });
  }

  /**
   * Count portfolio projects for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.prisma.portfolioProject.count({
      where: { userId },
    });
  }

  /**
   * Count featured portfolio projects for a user
   */
  async countFeaturedByUserId(userId: string): Promise<number> {
    return this.prisma.portfolioProject.count({
      where: {
        userId,
        isFeatured: true,
      },
    });
  }

  /**
   * Check if a portfolio project belongs to a user
   */
  async belongsToUser(id: string, userId: string): Promise<boolean> {
    const project = await this.prisma.portfolioProject.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    return !!project;
  }

  /**
   * Validate that user doesn't exceed maximum featured projects
   * @param userId - User ID
   * @param excludeId - Optional project ID to exclude from count (for updates)
   */
  private async validateFeaturedCount(
    userId: string,
    excludeId?: string
  ): Promise<void> {
    const whereClause: Prisma.PortfolioProjectWhereInput = {
      userId,
      isFeatured: true,
    };

    // Exclude the current project being updated
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const featuredCount = await this.prisma.portfolioProject.count({
      where: whereClause,
    });

    if (featuredCount >= this.MAX_FEATURED_PROJECTS) {
      throw new BadRequestError(
        `Maximum ${this.MAX_FEATURED_PROJECTS} featured projects allowed. Please unfeature another project first.`
      );
    }
  }
}

export default PortfolioProjectRepository;
