import * as Sentry from '@sentry/node';
import { WorkExperience } from '@prisma/client';
import WorkExperienceRepository from './workExperience.repository';
import {
  CreateWorkExperienceInput,
  UpdateWorkExperienceInput,
} from './workExperience.validation';
import { NotFoundError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Work Experience Response DTO
 */
export interface WorkExperienceResponse {
  id: string;
  title: string;
  company: string;
  location: string | null;
  employmentType: string | null;
  startDate: Date;
  endDate: Date | null;
  description: string | null;
  techStack: string[] | null;
  displayOrder: number;
  isCurrent: boolean; // Derived field: endDate === null
  createdAt: Date;
}

/**
 * WorkExperienceService
 * Business logic for work experience operations
 */
export class WorkExperienceService {
  private repository: WorkExperienceRepository;

  constructor(repository?: WorkExperienceRepository) {
    this.repository = repository || new WorkExperienceRepository();
  }

  /**
   * Create a new work experience entry
   */
  async createWorkExperience(
    userId: string,
    data: CreateWorkExperienceInput
  ): Promise<WorkExperienceResponse> {
    try {
      logger.info(`Creating work experience for user ${userId}`);

      const workExperience = await this.repository.create(userId, data);

      logger.info(`Work experience created successfully: ${workExperience.id}`);
      return this.mapToResponse(workExperience);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WorkExperienceService', method: 'createWorkExperience' },
        extra: { userId, data },
      });
      logger.error(`Failed to create work experience for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all work experiences for a user
   */
  async getWorkExperiences(userId: string): Promise<WorkExperienceResponse[]> {
    try {
      const experiences = await this.repository.findByUserId(userId);

      return experiences.map((exp) => this.mapToResponse(exp));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WorkExperienceService', method: 'getWorkExperiences' },
        extra: { userId },
      });
      logger.error(`Failed to get work experiences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific work experience by ID
   */
  async getWorkExperienceById(
    id: string,
    userId: string
  ): Promise<WorkExperienceResponse> {
    try {
      const workExperience = await this.repository.findById(id, userId);

      if (!workExperience) {
        throw new NotFoundError('Work experience not found');
      }

      return this.mapToResponse(workExperience);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WorkExperienceService', method: 'getWorkExperienceById' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * Update a work experience entry
   */
  async updateWorkExperience(
    id: string,
    userId: string,
    data: UpdateWorkExperienceInput
  ): Promise<WorkExperienceResponse> {
    try {
      logger.info(`Updating work experience ${id} for user ${userId}`);

      // Check if work experience exists and belongs to user
      const exists = await this.repository.belongsToUser(id, userId);
      if (!exists) {
        throw new NotFoundError('Work experience not found');
      }

      const updated = await this.repository.update(id, userId, data);

      logger.info(`Work experience ${id} updated successfully`);
      return this.mapToResponse(updated);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WorkExperienceService', method: 'updateWorkExperience' },
        extra: { id, userId, data },
      });
      logger.error(`Failed to update work experience ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a work experience entry
   */
  async deleteWorkExperience(id: string, userId: string): Promise<void> {
    try {
      logger.info(`Deleting work experience ${id} for user ${userId}`);

      // Check if work experience exists and belongs to user
      const exists = await this.repository.belongsToUser(id, userId);
      if (!exists) {
        throw new NotFoundError('Work experience not found');
      }

      await this.repository.delete(id, userId);

      logger.info(`Work experience ${id} deleted successfully`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WorkExperienceService', method: 'deleteWorkExperience' },
        extra: { id, userId },
      });
      logger.error(`Failed to delete work experience ${id}:`, error);
      throw error;
    }
  }

  /**
   * Map WorkExperience entity to response DTO
   */
  private mapToResponse(workExperience: WorkExperience): WorkExperienceResponse {
    return {
      id: workExperience.id,
      title: workExperience.title,
      company: workExperience.company,
      location: workExperience.location,
      employmentType: workExperience.employmentType,
      startDate: workExperience.startDate,
      endDate: workExperience.endDate,
      description: workExperience.description,
      techStack: workExperience.techStack as string[] | null,
      displayOrder: workExperience.displayOrder,
      isCurrent: workExperience.endDate === null,
      createdAt: workExperience.createdAt,
    };
  }
}

export default WorkExperienceService;
