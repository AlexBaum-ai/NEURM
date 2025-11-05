import { PrismaClient, WorkExperience, Prisma } from '@prisma/client';
import prisma from '@/config/database';
import {
  CreateWorkExperienceInput,
  UpdateWorkExperienceInput,
} from './workExperience.validation';

/**
 * WorkExperienceRepository
 * Data access layer for work experience operations
 */
export class WorkExperienceRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create a new work experience entry
   */
  async create(
    userId: string,
    data: CreateWorkExperienceInput
  ): Promise<WorkExperience> {
    // Convert techStack array to JSON for Prisma
    const createData: Prisma.WorkExperienceCreateInput = {
      user: {
        connect: { id: userId },
      },
      title: data.title,
      company: data.company,
      location: data.location || null,
      employmentType: data.employmentType || null,
      startDate: data.startDate,
      endDate: data.endDate || null,
      description: data.description || null,
      techStack: data.techStack ? data.techStack : Prisma.JsonNull,
      displayOrder: data.displayOrder || 0,
    };

    return this.prisma.workExperience.create({
      data: createData,
    });
  }

  /**
   * Find all work experiences for a user
   * Sorted by displayOrder and startDate (most recent first)
   */
  async findByUserId(userId: string): Promise<WorkExperience[]> {
    return this.prisma.workExperience.findMany({
      where: { userId },
      orderBy: [{ displayOrder: 'asc' }, { startDate: 'desc' }],
    });
  }

  /**
   * Find a specific work experience by ID
   */
  async findById(id: string, userId: string): Promise<WorkExperience | null> {
    return this.prisma.workExperience.findFirst({
      where: {
        id,
        userId, // Ensure the work experience belongs to the user
      },
    });
  }

  /**
   * Update a work experience entry
   */
  async update(
    id: string,
    userId: string,
    data: UpdateWorkExperienceInput
  ): Promise<WorkExperience> {
    // Build update data dynamically to only update provided fields
    const updateData: Prisma.WorkExperienceUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.employmentType !== undefined)
      updateData.employmentType = data.employmentType;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.techStack !== undefined)
      updateData.techStack = data.techStack ? data.techStack : Prisma.JsonNull;
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder;

    return this.prisma.workExperience.update({
      where: {
        id,
        userId, // Ensure the work experience belongs to the user
      },
      data: updateData,
    });
  }

  /**
   * Delete a work experience entry
   */
  async delete(id: string, userId: string): Promise<WorkExperience> {
    return this.prisma.workExperience.delete({
      where: {
        id,
        userId, // Ensure the work experience belongs to the user
      },
    });
  }

  /**
   * Count work experiences for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.prisma.workExperience.count({
      where: { userId },
    });
  }

  /**
   * Check if a work experience belongs to a user
   */
  async belongsToUser(id: string, userId: string): Promise<boolean> {
    const workExperience = await this.prisma.workExperience.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    return !!workExperience;
  }
}

export default WorkExperienceRepository;
