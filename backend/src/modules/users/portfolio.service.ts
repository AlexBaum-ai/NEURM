import * as Sentry from '@sentry/node';
import { PortfolioProject } from '@prisma/client';
import PortfolioProjectRepository from './portfolio.repository';
import {
  CreatePortfolioProjectInput,
  UpdatePortfolioProjectInput,
} from './portfolio.validation';
import { NotFoundError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Portfolio Project Response DTO
 */
export interface PortfolioProjectResponse {
  id: string;
  title: string;
  description: string | null;
  techStack: string[] | null;
  projectUrl: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  thumbnailUrl: string | null;
  screenshots: string[];
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
}

/**
 * PortfolioProjectService
 * Business logic for portfolio project operations
 */
export class PortfolioProjectService {
  private repository: PortfolioProjectRepository;

  constructor(repository?: PortfolioProjectRepository) {
    this.repository = repository || new PortfolioProjectRepository();
  }

  /**
   * Create a new portfolio project
   */
  async createPortfolioProject(
    userId: string,
    data: CreatePortfolioProjectInput
  ): Promise<PortfolioProjectResponse> {
    try {
      logger.info(`Creating portfolio project for user ${userId}`);

      const project = await this.repository.create(userId, data);

      logger.info(`Portfolio project created successfully: ${project.id}`);
      return this.mapToResponse(project);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PortfolioProjectService', method: 'createPortfolioProject' },
        extra: { userId, data },
      });
      logger.error(`Failed to create portfolio project for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all portfolio projects for a user
   */
  async getPortfolioProjects(userId: string): Promise<PortfolioProjectResponse[]> {
    try {
      const projects = await this.repository.findByUserId(userId);

      return projects.map((project) => this.mapToResponse(project));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PortfolioProjectService', method: 'getPortfolioProjects' },
        extra: { userId },
      });
      logger.error(`Failed to get portfolio projects for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific portfolio project by ID
   */
  async getPortfolioProjectById(
    id: string,
    userId: string
  ): Promise<PortfolioProjectResponse> {
    try {
      const project = await this.repository.findById(id, userId);

      if (!project) {
        throw new NotFoundError('Portfolio project not found');
      }

      return this.mapToResponse(project);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PortfolioProjectService', method: 'getPortfolioProjectById' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * Update a portfolio project
   */
  async updatePortfolioProject(
    id: string,
    userId: string,
    data: UpdatePortfolioProjectInput
  ): Promise<PortfolioProjectResponse> {
    try {
      logger.info(`Updating portfolio project ${id} for user ${userId}`);

      // Check if project exists and belongs to user
      const exists = await this.repository.belongsToUser(id, userId);
      if (!exists) {
        throw new NotFoundError('Portfolio project not found');
      }

      const updated = await this.repository.update(id, userId, data);

      logger.info(`Portfolio project ${id} updated successfully`);
      return this.mapToResponse(updated);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PortfolioProjectService', method: 'updatePortfolioProject' },
        extra: { id, userId, data },
      });
      logger.error(`Failed to update portfolio project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a portfolio project
   */
  async deletePortfolioProject(id: string, userId: string): Promise<void> {
    try {
      logger.info(`Deleting portfolio project ${id} for user ${userId}`);

      // Check if project exists and belongs to user
      const exists = await this.repository.belongsToUser(id, userId);
      if (!exists) {
        throw new NotFoundError('Portfolio project not found');
      }

      await this.repository.delete(id, userId);

      logger.info(`Portfolio project ${id} deleted successfully`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PortfolioProjectService', method: 'deletePortfolioProject' },
        extra: { id, userId },
      });
      logger.error(`Failed to delete portfolio project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get portfolio project statistics for a user
   */
  async getPortfolioStats(userId: string): Promise<{
    totalProjects: number;
    featuredProjects: number;
  }> {
    try {
      const [totalProjects, featuredProjects] = await Promise.all([
        this.repository.countByUserId(userId),
        this.repository.countFeaturedByUserId(userId),
      ]);

      return {
        totalProjects,
        featuredProjects,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PortfolioProjectService', method: 'getPortfolioStats' },
        extra: { userId },
      });
      logger.error(`Failed to get portfolio stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Map PortfolioProject entity to response DTO
   */
  private mapToResponse(project: PortfolioProject): PortfolioProjectResponse {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      techStack: project.techStack as string[] | null,
      projectUrl: project.projectUrl,
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      thumbnailUrl: project.thumbnailUrl,
      screenshots: project.screenshots,
      isFeatured: project.isFeatured,
      displayOrder: project.displayOrder,
      createdAt: project.createdAt,
    };
  }
}

export default PortfolioProjectService;
