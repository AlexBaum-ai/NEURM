import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import EducationService from '../education.service';
import prisma from '@/config/database';
import { NotFoundError, ForbiddenError } from '@/utils/errors';

// Mock Prisma client
jest.mock('@/config/database', () => ({
  education: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('EducationService', () => {
  let educationService: EducationService;
  const mockUserId = 'user-123';
  const mockEducationId = 'edu-456';

  beforeEach(() => {
    educationService = new EducationService();
    jest.clearAllMocks();
  });

  describe('getEducationList', () => {
    it('should return sorted education entries', async () => {
      const mockEducations = [
        {
          id: 'edu-1',
          userId: mockUserId,
          institution: 'MIT',
          degree: 'PhD',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2015-09-01'),
          endDate: new Date('2019-06-01'),
          description: 'Research in AI',
          displayOrder: 0,
          createdAt: new Date(),
        },
        {
          id: 'edu-2',
          userId: mockUserId,
          institution: 'Stanford',
          degree: 'BS',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2011-09-01'),
          endDate: new Date('2015-06-01'),
          description: null,
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      (prisma.education.findMany as jest.Mock).mockResolvedValue(mockEducations);

      const result = await educationService.getEducationList(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].institution).toBe('MIT');
      expect(prisma.education.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: [
          { displayOrder: 'asc' },
          { endDate: { sort: 'desc', nulls: 'first' } },
        ],
      });
    });
  });

  describe('createEducation', () => {
    it('should create a new education entry', async () => {
      const mockData = {
        institution: 'Harvard',
        degree: 'MBA',
        fieldOfStudy: 'Business Administration',
        startDate: new Date('2020-09-01'),
        endDate: new Date('2022-06-01'),
        description: 'Business strategy focus',
        displayOrder: 0,
      };

      const mockCreatedEducation = {
        id: mockEducationId,
        userId: mockUserId,
        ...mockData,
        createdAt: new Date(),
      };

      (prisma.education.create as jest.Mock).mockResolvedValue(mockCreatedEducation);

      const result = await educationService.createEducation(mockUserId, mockData);

      expect(result.id).toBe(mockEducationId);
      expect(result.institution).toBe('Harvard');
      expect(prisma.education.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          institution: mockData.institution,
          degree: mockData.degree,
          fieldOfStudy: mockData.fieldOfStudy,
        }),
      });
    });
  });

  describe('updateEducation', () => {
    it('should update education entry when user is owner', async () => {
      const mockExistingEducation = {
        id: mockEducationId,
        userId: mockUserId,
        institution: 'MIT',
        degree: 'PhD',
        fieldOfStudy: 'Computer Science',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-06-01'),
        description: 'Old description',
        displayOrder: 0,
        createdAt: new Date(),
      };

      const mockUpdateData = {
        description: 'Updated description',
        displayOrder: 1,
      };

      const mockUpdatedEducation = {
        ...mockExistingEducation,
        ...mockUpdateData,
      };

      (prisma.education.findUnique as jest.Mock).mockResolvedValue(mockExistingEducation);
      (prisma.education.update as jest.Mock).mockResolvedValue(mockUpdatedEducation);

      const result = await educationService.updateEducation(
        mockUserId,
        mockEducationId,
        mockUpdateData
      );

      expect(result.description).toBe('Updated description');
      expect(result.displayOrder).toBe(1);
      expect(prisma.education.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError when education entry does not exist', async () => {
      (prisma.education.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        educationService.updateEducation(mockUserId, mockEducationId, {
          description: 'New description',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user is not owner', async () => {
      const mockExistingEducation = {
        id: mockEducationId,
        userId: 'other-user-123',
        institution: 'MIT',
        degree: 'PhD',
        fieldOfStudy: 'Computer Science',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-06-01'),
        description: 'Description',
        displayOrder: 0,
        createdAt: new Date(),
      };

      (prisma.education.findUnique as jest.Mock).mockResolvedValue(mockExistingEducation);

      await expect(
        educationService.updateEducation(mockUserId, mockEducationId, {
          description: 'Hacked description',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteEducation', () => {
    it('should delete education entry when user is owner', async () => {
      const mockExistingEducation = {
        id: mockEducationId,
        userId: mockUserId,
        institution: 'MIT',
        degree: 'PhD',
        fieldOfStudy: 'Computer Science',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-06-01'),
        description: 'Description',
        displayOrder: 0,
        createdAt: new Date(),
      };

      (prisma.education.findUnique as jest.Mock).mockResolvedValue(mockExistingEducation);
      (prisma.education.delete as jest.Mock).mockResolvedValue(mockExistingEducation);

      await educationService.deleteEducation(mockUserId, mockEducationId);

      expect(prisma.education.delete).toHaveBeenCalledWith({
        where: { id: mockEducationId },
      });
    });

    it('should throw NotFoundError when education entry does not exist', async () => {
      (prisma.education.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        educationService.deleteEducation(mockUserId, mockEducationId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user is not owner', async () => {
      const mockExistingEducation = {
        id: mockEducationId,
        userId: 'other-user-123',
        institution: 'MIT',
        degree: 'PhD',
        fieldOfStudy: 'Computer Science',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-06-01'),
        description: 'Description',
        displayOrder: 0,
        createdAt: new Date(),
      };

      (prisma.education.findUnique as jest.Mock).mockResolvedValue(mockExistingEducation);

      await expect(
        educationService.deleteEducation(mockUserId, mockEducationId)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
