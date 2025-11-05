import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from 'vitest';
import { BulkMessagingService } from '../bulkMessaging.service';
import { BulkMessagingRepository } from '../bulkMessaging.repository';
import { MessagingRepository } from '../messaging.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/errors';

// Mock repositories
vi.mock('../bulkMessaging.repository');
vi.mock('../messaging.repository');
vi.mock('ioredis');

describe('BulkMessagingService', () => {
  let service: BulkMessagingService;
  let mockRepository: BulkMessagingRepository;
  let mockMessagingRepository: MessagingRepository;
  let mockRedis: any;

  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockTemplateId = 'template-123';

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock instances
    mockRedis = {
      get: vi.fn(),
      incrby: vi.fn(),
      expire: vi.fn(),
    };

    // Create service with mocked dependencies
    service = new BulkMessagingService(undefined, mockRedis);
    mockRepository = (service as any).repository;
    mockMessagingRepository = (service as any).messagingRepository;
  });

  describe('createTemplate', () => {
    it('should create a message template successfully', async () => {
      const input = {
        name: 'Welcome Template',
        subject: 'Welcome to our team!',
        body: 'Hello {{candidate_name}}, welcome!',
        isDefault: false,
      };

      const expectedTemplate = {
        id: mockTemplateId,
        companyId: mockCompanyId,
        ...input,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(mockRepository, 'createTemplate').mockResolvedValue(expectedTemplate as any);

      const result = await service.createTemplate(mockCompanyId, input);

      expect(result).toEqual(expectedTemplate);
      expect(mockRepository.createTemplate).toHaveBeenCalledWith(mockCompanyId, expect.objectContaining({
        name: input.name,
        subject: input.subject,
        body: input.body,
        isDefault: input.isDefault,
      }));
    });
  });

  describe('getTemplates', () => {
    it('should get templates with pagination', async () => {
      const query = { page: 1, limit: 20 };
      const mockTemplates = [
        { id: 'template-1', name: 'Template 1', companyId: mockCompanyId },
        { id: 'template-2', name: 'Template 2', companyId: mockCompanyId },
      ];

      vi.spyOn(mockRepository, 'getTemplates').mockResolvedValue({
        templates: mockTemplates as any,
        total: 2,
      });

      const result = await service.getTemplates(mockCompanyId, query);

      expect(result.templates).toEqual(mockTemplates);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });
  });

  describe('sendBulkMessage', () => {
    it('should send bulk messages successfully', async () => {
      const input = {
        body: 'Hello {{candidate_name}}, we have an opportunity for you!',
        subject: 'Job Opportunity',
        recipientIds: ['user-1', 'user-2'],
        personalizeContent: true,
      };

      // Mock rate limit check
      vi.spyOn(mockRepository, 'countRecipientsToday').mockResolvedValue(0);
      mockRedis.get.mockResolvedValue('0');

      // Mock blocked candidates check
      vi.spyOn(mockRepository, 'getBlockedCandidateIds').mockResolvedValue([]);

      // Mock bulk message creation
      const mockBulkMessage = {
        id: 'bulk-message-123',
        companyId: mockCompanyId,
        recipientCount: 2,
        status: 'sent',
      };
      vi.spyOn(mockRepository, 'createBulkMessage').mockResolvedValue(mockBulkMessage as any);

      // Mock recipient data
      vi.spyOn(mockMessagingRepository, 'prisma' as any, 'get').mockReturnValue({
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'user-1',
            username: 'john_doe',
            profile: { displayName: 'John Doe' },
            skills: [{ skillName: 'Python' }],
            workExperiences: [],
          }),
        },
      });

      // Mock conversation creation
      vi.spyOn(mockMessagingRepository, 'findOrCreateConversation').mockResolvedValue({
        id: 'conversation-123',
      } as any);

      // Mock message creation
      vi.spyOn(mockMessagingRepository, 'createMessage').mockResolvedValue({
        id: 'message-123',
      } as any);

      // Mock recipient records creation
      vi.spyOn(mockRepository, 'createBulkMessageRecipients').mockResolvedValue({ count: 2 } as any);

      // Mock count updates
      vi.spyOn(mockRepository, 'updateBulkMessageCounts').mockResolvedValue(mockBulkMessage as any);

      const result = await service.sendBulkMessage(mockCompanyId, input);

      expect(result.successful).toBeGreaterThan(0);
      expect(result.bulkMessageId).toBe(mockBulkMessage.id);
    });

    it('should throw error when rate limit is exceeded', async () => {
      const input = {
        body: 'Test message',
        recipientIds: ['user-1', 'user-2'],
        personalizeContent: false,
      };

      // Mock rate limit exceeded (current count is 49, trying to send 2 more)
      vi.spyOn(mockRepository, 'countRecipientsToday').mockResolvedValue(49);
      mockRedis.get.mockResolvedValue('49');

      await expect(service.sendBulkMessage(mockCompanyId, input)).rejects.toThrow(ForbiddenError);
    });

    it('should filter out blocked candidates', async () => {
      const input = {
        body: 'Test message',
        recipientIds: ['user-1', 'user-2', 'user-3'],
        personalizeContent: false,
      };

      // Mock rate limit check
      vi.spyOn(mockRepository, 'countRecipientsToday').mockResolvedValue(0);
      mockRedis.get.mockResolvedValue('0');

      // Mock blocked candidates (user-2 has blocked the company)
      vi.spyOn(mockRepository, 'getBlockedCandidateIds').mockResolvedValue(['user-2']);

      // Mock bulk message creation
      const mockBulkMessage = {
        id: 'bulk-message-123',
        companyId: mockCompanyId,
        recipientCount: 2, // Only 2 recipients (user-2 is blocked)
        status: 'sent',
      };
      vi.spyOn(mockRepository, 'createBulkMessage').mockResolvedValue(mockBulkMessage as any);

      // Mock other dependencies
      vi.spyOn(mockMessagingRepository, 'findOrCreateConversation').mockResolvedValue({
        id: 'conversation-123',
      } as any);
      vi.spyOn(mockMessagingRepository, 'createMessage').mockResolvedValue({
        id: 'message-123',
      } as any);
      vi.spyOn(mockRepository, 'createBulkMessageRecipients').mockResolvedValue({ count: 2 } as any);
      vi.spyOn(mockRepository, 'updateBulkMessageCounts').mockResolvedValue(mockBulkMessage as any);

      const result = await service.sendBulkMessage(mockCompanyId, input);

      expect(result.blockedCount).toBe(1);
      expect(result.totalRecipients).toBe(2); // Only 2 valid recipients
    });

    it('should throw error when all recipients have blocked the company', async () => {
      const input = {
        body: 'Test message',
        recipientIds: ['user-1', 'user-2'],
        personalizeContent: false,
      };

      // Mock rate limit check
      vi.spyOn(mockRepository, 'countRecipientsToday').mockResolvedValue(0);
      mockRedis.get.mockResolvedValue('0');

      // All recipients have blocked the company
      vi.spyOn(mockRepository, 'getBlockedCandidateIds').mockResolvedValue(['user-1', 'user-2']);

      await expect(service.sendBulkMessage(mockCompanyId, input)).rejects.toThrow(BadRequestError);
    });

    it('should personalize message content', async () => {
      const input = {
        body: 'Hello {{candidate_name}}, we noticed your {{candidate_skills}} experience!',
        recipientIds: ['user-1'],
        personalizeContent: true,
      };

      // Mock all dependencies
      vi.spyOn(mockRepository, 'countRecipientsToday').mockResolvedValue(0);
      mockRedis.get.mockResolvedValue('0');
      vi.spyOn(mockRepository, 'getBlockedCandidateIds').mockResolvedValue([]);

      const mockUser = {
        id: 'user-1',
        username: 'john_doe',
        profile: { displayName: 'John Doe', location: 'New York' },
        skills: [{ skillName: 'Python' }, { skillName: 'JavaScript' }],
        workExperiences: [{ title: 'Senior Developer' }],
      };

      // Mock Prisma user query
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(mockUser),
        },
      };
      Object.defineProperty(mockMessagingRepository, 'prisma', {
        get: () => mockPrisma,
        configurable: true,
      });

      const mockBulkMessage = {
        id: 'bulk-message-123',
        companyId: mockCompanyId,
        recipientCount: 1,
      };
      vi.spyOn(mockRepository, 'createBulkMessage').mockResolvedValue(mockBulkMessage as any);
      vi.spyOn(mockMessagingRepository, 'findOrCreateConversation').mockResolvedValue({
        id: 'conversation-123',
      } as any);

      let capturedMessage: any = null;
      vi.spyOn(mockMessagingRepository, 'createMessage').mockImplementation((data: any) => {
        capturedMessage = data;
        return Promise.resolve({ id: 'message-123' } as any);
      });

      vi.spyOn(mockRepository, 'createBulkMessageRecipients').mockResolvedValue({ count: 1 } as any);
      vi.spyOn(mockRepository, 'updateBulkMessageCounts').mockResolvedValue(mockBulkMessage as any);

      await service.sendBulkMessage(mockCompanyId, input);

      expect(capturedMessage.content).toContain('John Doe');
      expect(capturedMessage.content).toContain('Python, JavaScript');
    });
  });

  describe('blockCompany', () => {
    it('should block a company successfully', async () => {
      const candidateId = 'candidate-123';
      const companyId = 'company-456';
      const input = { reason: 'Spam messages' };

      vi.spyOn(mockRepository, 'isCompanyBlocked').mockResolvedValue(false);
      vi.spyOn(mockRepository, 'blockCompany').mockResolvedValue({
        id: 'block-123',
        candidateId,
        companyId,
        reason: input.reason,
        createdAt: new Date(),
      } as any);

      const result = await service.blockCompany(candidateId, companyId, input);

      expect(result.success).toBe(true);
      expect(mockRepository.blockCompany).toHaveBeenCalledWith(candidateId, companyId, input.reason);
    });

    it('should throw error when company is already blocked', async () => {
      const candidateId = 'candidate-123';
      const companyId = 'company-456';
      const input = { reason: 'Spam messages' };

      vi.spyOn(mockRepository, 'isCompanyBlocked').mockResolvedValue(true);

      await expect(service.blockCompany(candidateId, companyId, input)).rejects.toThrow(BadRequestError);
    });
  });

  describe('unblockCompany', () => {
    it('should unblock a company successfully', async () => {
      const candidateId = 'candidate-123';
      const companyId = 'company-456';

      vi.spyOn(mockRepository, 'unblockCompany').mockResolvedValue({ count: 1 } as any);

      const result = await service.unblockCompany(candidateId, companyId);

      expect(result.success).toBe(true);
      expect(mockRepository.unblockCompany).toHaveBeenCalledWith(candidateId, companyId);
    });

    it('should throw error when block does not exist', async () => {
      const candidateId = 'candidate-123';
      const companyId = 'company-456';

      vi.spyOn(mockRepository, 'unblockCompany').mockResolvedValue({ count: 0 } as any);

      await expect(service.unblockCompany(candidateId, companyId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTemplate', () => {
    it('should update a template successfully', async () => {
      const templateId = 'template-123';
      const input = {
        name: 'Updated Template',
        body: 'Updated body',
      };

      const updatedTemplate = {
        id: templateId,
        companyId: mockCompanyId,
        name: input.name,
        body: input.body,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(mockRepository, 'updateTemplate').mockResolvedValue({ count: 1 } as any);
      vi.spyOn(mockRepository, 'getTemplateById').mockResolvedValue(updatedTemplate as any);

      const result = await service.updateTemplate(templateId, mockCompanyId, input);

      expect(result).toEqual(updatedTemplate);
      expect(mockRepository.updateTemplate).toHaveBeenCalledWith(templateId, mockCompanyId, input);
    });

    it('should throw error when template not found', async () => {
      const templateId = 'template-123';
      const input = { name: 'Updated Template' };

      vi.spyOn(mockRepository, 'updateTemplate').mockResolvedValue({ count: 0 } as any);

      await expect(service.updateTemplate(templateId, mockCompanyId, input)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template successfully', async () => {
      const templateId = 'template-123';

      vi.spyOn(mockRepository, 'deleteTemplate').mockResolvedValue({ count: 1 } as any);

      const result = await service.deleteTemplate(templateId, mockCompanyId);

      expect(result.success).toBe(true);
      expect(mockRepository.deleteTemplate).toHaveBeenCalledWith(templateId, mockCompanyId);
    });

    it('should throw error when template not found', async () => {
      const templateId = 'template-123';

      vi.spyOn(mockRepository, 'deleteTemplate').mockResolvedValue({ count: 0 } as any);

      await expect(service.deleteTemplate(templateId, mockCompanyId)).rejects.toThrow(NotFoundError);
    });
  });
});
