import * as Sentry from '@sentry/node';
import { Education } from '@prisma/client';
import prisma from '@/config/database';
import { CreateEducationInput, UpdateEducationInput } from './education.validation';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Education response DTO
 */
export interface EducationResponse {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  displayOrder: number;
  createdAt: Date;
}

/**
 * EducationService
 * Business logic for education management operations
 */
export class EducationService {
  /**
   * Get all education entries for a user
   * Sorted by displayOrder ASC, endDate DESC NULLS FIRST
   */
  async getEducationList(userId: string): Promise<EducationResponse[]> {
    try {
      const educations = await prisma.education.findMany({
        where: { userId },
        orderBy: [
          { displayOrder: 'asc' },
          { endDate: { sort: 'desc', nulls: 'first' } },
        ],
      });

      return educations.map(this.mapToEducationResponse);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'EducationService', method: 'getEducationList' },
        extra: { userId },
      });
      logger.error(`Failed to get education list for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new education entry
   */
  async createEducation(
    userId: string,
    data: CreateEducationInput
  ): Promise<EducationResponse> {
    try {
      logger.info(`Creating education entry for user ${userId}`);

      const education = await prisma.education.create({
        data: {
          userId,
          institution: data.institution,
          degree: data.degree ?? null,
          fieldOfStudy: data.fieldOfStudy ?? null,
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
          description: data.description ?? null,
          displayOrder: data.displayOrder ?? 0,
        },
      });

      logger.info(`Education entry created successfully: ${education.id}`);
      return this.mapToEducationResponse(education);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'EducationService', method: 'createEducation' },
        extra: { userId, data },
      });
      logger.error(`Failed to create education entry for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update an education entry
   * Only the owner can update
   */
  async updateEducation(
    userId: string,
    educationId: string,
    data: UpdateEducationInput
  ): Promise<EducationResponse> {
    try {
      logger.info(`Updating education entry ${educationId} for user ${userId}`);

      // Check if education entry exists and belongs to user
      const existingEducation = await prisma.education.findUnique({
        where: { id: educationId },
      });

      if (!existingEducation) {
        throw new NotFoundError('Education entry not found');
      }

      if (existingEducation.userId !== userId) {
        throw new ForbiddenError('You do not have permission to update this education entry');
      }

      // If updating dates, we need to handle the validation
      // Fetch current dates if not provided in update
      const startDate = data.startDate !== undefined
        ? data.startDate
        : existingEducation.startDate;
      const endDate = data.endDate !== undefined
        ? data.endDate
        : existingEducation.endDate;

      // Validate date relationship
      if (startDate && endDate && endDate < startDate) {
        throw new Error('End date must be after or equal to start date');
      }

      const education = await prisma.education.update({
        where: { id: educationId },
        data: {
          ...(data.institution !== undefined && { institution: data.institution }),
          ...(data.degree !== undefined && { degree: data.degree }),
          ...(data.fieldOfStudy !== undefined && { fieldOfStudy: data.fieldOfStudy }),
          ...(data.startDate !== undefined && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        },
      });

      logger.info(`Education entry updated successfully: ${educationId}`);
      return this.mapToEducationResponse(education);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'EducationService', method: 'updateEducation' },
        extra: { userId, educationId, data },
      });
      logger.error(`Failed to update education entry ${educationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an education entry
   * Only the owner can delete
   */
  async deleteEducation(userId: string, educationId: string): Promise<void> {
    try {
      logger.info(`Deleting education entry ${educationId} for user ${userId}`);

      // Check if education entry exists and belongs to user
      const existingEducation = await prisma.education.findUnique({
        where: { id: educationId },
      });

      if (!existingEducation) {
        throw new NotFoundError('Education entry not found');
      }

      if (existingEducation.userId !== userId) {
        throw new ForbiddenError('You do not have permission to delete this education entry');
      }

      await prisma.education.delete({
        where: { id: educationId },
      });

      logger.info(`Education entry deleted successfully: ${educationId}`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'EducationService', method: 'deleteEducation' },
        extra: { userId, educationId },
      });
      logger.error(`Failed to delete education entry ${educationId}:`, error);
      throw error;
    }
  }

  /**
   * Map Education entity to EducationResponse DTO
   */
  private mapToEducationResponse(education: Education): EducationResponse {
    return {
      id: education.id,
      institution: education.institution,
      degree: education.degree,
      fieldOfStudy: education.fieldOfStudy,
      startDate: education.startDate,
      endDate: education.endDate,
      description: education.description,
      displayOrder: education.displayOrder,
      createdAt: education.createdAt,
    };
  }
}

export default EducationService;
