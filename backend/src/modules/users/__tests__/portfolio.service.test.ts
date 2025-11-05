import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import PortfolioProjectService from '../portfolio.service';
import PortfolioProjectRepository from '../portfolio.repository';

// Mock PortfolioProjectRepository
jest.mock('../portfolio.repository');

describe('PortfolioProjectService', () => {
  let portfolioService: PortfolioProjectService;
  let mockRepository: jest.Mocked<PortfolioProjectRepository>;
  const mockUserId = 'user-123';
  const mockProjectId = 'project-456';

  beforeEach(() => {
    mockRepository =
      new PortfolioProjectRepository() as jest.Mocked<PortfolioProjectRepository>;
    portfolioService = new PortfolioProjectService(mockRepository);
    jest.clearAllMocks();
  });

  describe('createPortfolioProject', () => {
    const createProjectData = {
      title: 'LLM Chat Application',
      description: 'A real-time chat application powered by GPT-4',
      techStack: ['React', 'Node.js', 'OpenAI API', 'WebSocket'],
      projectUrl: 'https://example.com/project',
      githubUrl: 'https://github.com/user/project',
      demoUrl: 'https://demo.example.com',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      screenshots: ['https://example.com/screenshot1.jpg'],
      isFeatured: false,
      displayOrder: 0,
    };

    it('should create a new portfolio project successfully', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        ...createProjectData,
        screenshots: createProjectData.screenshots,
        createdAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockProject);

      const result = await portfolioService.createPortfolioProject(
        mockUserId,
        createProjectData
      );

      expect(result).toEqual({
        id: mockProjectId,
        title: 'LLM Chat Application',
        description: 'A real-time chat application powered by GPT-4',
        techStack: ['React', 'Node.js', 'OpenAI API', 'WebSocket'],
        projectUrl: 'https://example.com/project',
        githubUrl: 'https://github.com/user/project',
        demoUrl: 'https://demo.example.com',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        screenshots: ['https://example.com/screenshot1.jpg'],
        isFeatured: false,
        displayOrder: 0,
        createdAt: mockProject.createdAt,
      });
      expect(mockRepository.create).toHaveBeenCalledWith(mockUserId, createProjectData);
    });

    it('should throw error when max featured projects limit is reached', async () => {
      const featuredProjectData = {
        ...createProjectData,
        isFeatured: true,
      };

      mockRepository.create.mockRejectedValue(
        new Error('Maximum 5 featured projects allowed')
      );

      await expect(
        portfolioService.createPortfolioProject(mockUserId, featuredProjectData)
      ).rejects.toThrow('Maximum 5 featured projects allowed');
    });

    it('should handle projects with minimal data', async () => {
      const minimalProjectData = {
        title: 'Simple Project',
        isFeatured: false,
        displayOrder: 0,
      };

      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        title: 'Simple Project',
        description: null,
        techStack: null,
        projectUrl: null,
        githubUrl: null,
        demoUrl: null,
        thumbnailUrl: null,
        screenshots: [],
        isFeatured: false,
        displayOrder: 0,
        createdAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockProject);

      const result = await portfolioService.createPortfolioProject(
        mockUserId,
        minimalProjectData
      );

      expect(result.title).toBe('Simple Project');
      expect(result.description).toBeNull();
      expect(result.techStack).toBeNull();
    });
  });

  describe('getPortfolioProjects', () => {
    it('should return all portfolio projects for a user', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          userId: mockUserId,
          title: 'Project 1',
          description: 'First project',
          techStack: ['React', 'Node.js'],
          projectUrl: 'https://example.com/project1',
          githubUrl: 'https://github.com/user/project1',
          demoUrl: null,
          thumbnailUrl: null,
          screenshots: [],
          isFeatured: true,
          displayOrder: 0,
          createdAt: new Date(),
        },
        {
          id: 'project-2',
          userId: mockUserId,
          title: 'Project 2',
          description: 'Second project',
          techStack: ['Python', 'FastAPI'],
          projectUrl: null,
          githubUrl: 'https://github.com/user/project2',
          demoUrl: null,
          thumbnailUrl: null,
          screenshots: [],
          isFeatured: false,
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      mockRepository.findByUserId.mockResolvedValue(mockProjects);

      const result = await portfolioService.getPortfolioProjects(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Project 1');
      expect(result[1].title).toBe('Project 2');
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array when user has no projects', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await portfolioService.getPortfolioProjects(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getPortfolioProjectById', () => {
    it('should return a specific portfolio project', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        title: 'My Project',
        description: 'Project description',
        techStack: ['React'],
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/user/project',
        demoUrl: null,
        thumbnailUrl: null,
        screenshots: [],
        isFeatured: false,
        displayOrder: 0,
        createdAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockProject);

      const result = await portfolioService.getPortfolioProjectById(
        mockProjectId,
        mockUserId
      );

      expect(result.id).toBe(mockProjectId);
      expect(result.title).toBe('My Project');
      expect(mockRepository.findById).toHaveBeenCalledWith(mockProjectId, mockUserId);
    });

    it('should throw NotFoundError when project does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        portfolioService.getPortfolioProjectById(mockProjectId, mockUserId)
      ).rejects.toThrow('Portfolio project not found');
    });
  });

  describe('updatePortfolioProject', () => {
    const updateData = {
      title: 'Updated Project',
      isFeatured: true,
    };

    it('should update portfolio project successfully', async () => {
      const existingProject = {
        id: mockProjectId,
        userId: mockUserId,
        title: 'Original Project',
        description: 'Original description',
        techStack: ['React'],
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/user/project',
        demoUrl: null,
        thumbnailUrl: null,
        screenshots: [],
        isFeatured: false,
        displayOrder: 0,
        createdAt: new Date(),
      };

      const updatedProject = {
        ...existingProject,
        title: 'Updated Project',
        isFeatured: true,
      };

      mockRepository.belongsToUser.mockResolvedValue(true);
      mockRepository.update.mockResolvedValue(updatedProject);

      const result = await portfolioService.updatePortfolioProject(
        mockProjectId,
        mockUserId,
        updateData
      );

      expect(result.title).toBe('Updated Project');
      expect(result.isFeatured).toBe(true);
      expect(mockRepository.belongsToUser).toHaveBeenCalledWith(mockProjectId, mockUserId);
      expect(mockRepository.update).toHaveBeenCalledWith(
        mockProjectId,
        mockUserId,
        updateData
      );
    });

    it('should throw NotFoundError when project does not exist', async () => {
      mockRepository.belongsToUser.mockResolvedValue(false);

      await expect(
        portfolioService.updatePortfolioProject(mockProjectId, mockUserId, updateData)
      ).rejects.toThrow('Portfolio project not found');

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when project belongs to different user', async () => {
      mockRepository.belongsToUser.mockResolvedValue(false);

      await expect(
        portfolioService.updatePortfolioProject(mockProjectId, 'different-user', updateData)
      ).rejects.toThrow('Portfolio project not found');
    });
  });

  describe('deletePortfolioProject', () => {
    it('should delete portfolio project successfully', async () => {
      const existingProject = {
        id: mockProjectId,
        userId: mockUserId,
        title: 'Project to Delete',
        description: null,
        techStack: null,
        projectUrl: null,
        githubUrl: null,
        demoUrl: null,
        thumbnailUrl: null,
        screenshots: [],
        isFeatured: false,
        displayOrder: 0,
        createdAt: new Date(),
      };

      mockRepository.belongsToUser.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue(existingProject);

      await portfolioService.deletePortfolioProject(mockProjectId, mockUserId);

      expect(mockRepository.belongsToUser).toHaveBeenCalledWith(mockProjectId, mockUserId);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockProjectId, mockUserId);
    });

    it('should throw NotFoundError when project does not exist', async () => {
      mockRepository.belongsToUser.mockResolvedValue(false);

      await expect(
        portfolioService.deletePortfolioProject(mockProjectId, mockUserId)
      ).rejects.toThrow('Portfolio project not found');

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getPortfolioStats', () => {
    it('should return portfolio statistics', async () => {
      mockRepository.countByUserId.mockResolvedValue(10);
      mockRepository.countFeaturedByUserId.mockResolvedValue(3);

      const result = await portfolioService.getPortfolioStats(mockUserId);

      expect(result).toEqual({
        totalProjects: 10,
        featuredProjects: 3,
      });
      expect(mockRepository.countByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockRepository.countFeaturedByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it('should return zero counts when user has no projects', async () => {
      mockRepository.countByUserId.mockResolvedValue(0);
      mockRepository.countFeaturedByUserId.mockResolvedValue(0);

      const result = await portfolioService.getPortfolioStats(mockUserId);

      expect(result).toEqual({
        totalProjects: 0,
        featuredProjects: 0,
      });
    });
  });
});
