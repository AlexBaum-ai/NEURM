import { SpamDetectionService } from '../services/spamDetectionService';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@/utils/logger');
jest.mock('@sentry/node');

const mockPrismaClient = {
  spamKeyword: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('SpamDetectionService', () => {
  let spamDetectionService: SpamDetectionService;

  beforeEach(() => {
    jest.clearAllMocks();
    spamDetectionService = new SpamDetectionService(mockPrismaClient as any);
  });

  describe('analyzeContent', () => {
    it('should detect spam with high score for obvious spam content', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([
        { keyword: 'buy now', severity: 3 },
        { keyword: 'click here', severity: 2 },
        { keyword: 'free money', severity: 3 },
      ]);

      const result = await spamDetectionService.analyzeContent(
        'BUY NOW! Click here to get FREE MONEY!!! Limited time offer!!!',
        'GET RICH QUICK'
      );

      expect(result.spamScore).toBeGreaterThan(75);
      expect(result.isSpam).toBe(true);
      expect(result.flaggedKeywords.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect spam from excessive links', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([]);

      const content = `
        Check out https://spam1.com and https://spam2.com
        Also visit https://spam3.com and https://spam4.com
        Don't forget https://spam5.com and https://spam6.com
      `;

      const result = await spamDetectionService.analyzeContent(content);

      expect(result.spamScore).toBeGreaterThan(0);
      expect(result.reason).toContain('patterns');
    });

    it('should detect spam from all caps text', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([]);

      const result = await spamDetectionService.analyzeContent(
        'THIS IS AN URGENT MESSAGE PLEASE READ IMMEDIATELY',
        'IMPORTANT ANNOUNCEMENT'
      );

      expect(result.spamScore).toBeGreaterThan(0);
    });

    it('should detect spam from excessive exclamation marks', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([]);

      const result = await spamDetectionService.analyzeContent(
        'Amazing offer!!! Don\'t miss out!!! Act now!!! Limited time!!!'
      );

      expect(result.spamScore).toBeGreaterThan(0);
    });

    it('should not flag legitimate content as spam', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([]);

      const result = await spamDetectionService.analyzeContent(
        'This is a thoughtful discussion about machine learning models and their applications in natural language processing.',
        'Machine Learning Discussion'
      );

      expect(result.spamScore).toBeLessThan(50);
      expect(result.isSpam).toBe(false);
      expect(result.flaggedKeywords).toHaveLength(0);
    });

    it('should detect cryptocurrency spam indicators', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([]);

      const result = await spamDetectionService.analyzeContent(
        'Invest in Bitcoin now! Guaranteed returns of 500% ROI! Join our crypto trading group!'
      );

      expect(result.spamScore).toBeGreaterThan(0);
    });

    it('should detect repeated characters as spam', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([]);

      const result = await spamDetectionService.analyzeContent(
        'Hellooooooo everyone! This is amaaaaazing!!!'
      );

      expect(result.spamScore).toBeGreaterThan(0);
    });

    it('should handle empty content gracefully', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([]);

      const result = await spamDetectionService.analyzeContent('');

      expect(result.spamScore).toBeGreaterThanOrEqual(0);
      expect(result.isSpam).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaClient.spamKeyword.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await spamDetectionService.analyzeContent('Test content');

      expect(result.spamScore).toBe(0);
      expect(result.isSpam).toBe(false);
      expect(result.reason).toBe('Analysis failed');
    });
  });

  describe('addSpamKeyword', () => {
    it('should add new spam keyword successfully', async () => {
      mockPrismaClient.spamKeyword.create.mockResolvedValue({
        id: 'keyword-1',
        keyword: 'scam',
        severity: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await spamDetectionService.addSpamKeyword('scam', 2);

      expect(mockPrismaClient.spamKeyword.create).toHaveBeenCalledWith({
        data: {
          keyword: 'scam',
          severity: 2,
          isActive: true,
        },
      });
    });

    it('should default severity to 1 if not provided', async () => {
      mockPrismaClient.spamKeyword.create.mockResolvedValue({});

      await spamDetectionService.addSpamKeyword('test');

      expect(mockPrismaClient.spamKeyword.create).toHaveBeenCalledWith({
        data: {
          keyword: 'test',
          severity: 1,
          isActive: true,
        },
      });
    });

    it('should convert keyword to lowercase', async () => {
      mockPrismaClient.spamKeyword.create.mockResolvedValue({});

      await spamDetectionService.addSpamKeyword('UPPERCASE');

      expect(mockPrismaClient.spamKeyword.create).toHaveBeenCalledWith({
        data: {
          keyword: 'uppercase',
          severity: 1,
          isActive: true,
        },
      });
    });
  });

  describe('updateSpamKeyword', () => {
    it('should update spam keyword successfully', async () => {
      mockPrismaClient.spamKeyword.update.mockResolvedValue({});

      await spamDetectionService.updateSpamKeyword('keyword-1', 3, false);

      expect(mockPrismaClient.spamKeyword.update).toHaveBeenCalledWith({
        where: { id: 'keyword-1' },
        data: { severity: 3, isActive: false },
      });
    });
  });

  describe('analyzeWithMLModel', () => {
    it('should fall back to rule-based detection when ML model not available', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([]);

      const result = await spamDetectionService.analyzeWithMLModel('Test content');

      expect(result).toBeDefined();
      expect(result.spamScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('spam score calculation', () => {
    it('should combine keyword, pattern, and heuristic scores correctly', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([
        { keyword: 'spam', severity: 2 },
      ]);

      // Content with spam keyword + links + caps + exclamation marks
      const spamContent = 'SPAM!!! Click here https://spam.com and https://spam2.com!!!';

      const result = await spamDetectionService.analyzeContent(spamContent);

      expect(result.spamScore).toBeGreaterThan(50);
      expect(result.flaggedKeywords).toContain('spam');
    });

    it('should cap spam score at 100', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([
        { keyword: 'spam', severity: 5 },
        { keyword: 'scam', severity: 5 },
        { keyword: 'fake', severity: 5 },
      ]);

      // Extreme spam content
      const extremeSpam = 'SPAM SCAM FAKE '.repeat(50) + '!!!'.repeat(20);

      const result = await spamDetectionService.analyzeContent(extremeSpam);

      expect(result.spamScore).toBeLessThanOrEqual(100);
    });

    it('should have higher confidence when multiple detection methods agree', async () => {
      mockPrismaClient.spamKeyword.findMany.mockResolvedValue([
        { keyword: 'buy now', severity: 3 },
      ]);

      const result = await spamDetectionService.analyzeContent(
        'BUY NOW!!! https://spam.com https://spam2.com https://spam3.com',
        'CLICK HERE'
      );

      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });
});
