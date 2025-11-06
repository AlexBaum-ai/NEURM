import DigestService from '../digest.service';
import DigestRepository from '../digest.repository';

jest.mock('../digest.repository');

describe('DigestService', () => {
  let service: DigestService;
  let mockRepository: jest.Mocked<DigestRepository>;

  beforeEach(() => {
    mockRepository = new DigestRepository() as jest.Mocked<DigestRepository>;
    service = new DigestService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return existing preferences', async () => {
      const userId = 'user-123';
      const mockPreferences = {
        id: 'pref-1',
        userId,
        dailyEnabled: true,
        dailyTime: '09:00',
        weeklyEnabled: true,
        weeklyDay: 1,
        weeklyTime: '09:00',
        timezone: 'America/New_York',
        includeNews: true,
        includeForum: true,
        includeJobs: true,
        includeActivity: true,
        minContentItems: 3,
        vacationMode: false,
        vacationUntil: null,
        lastDailyDigest: null,
        lastWeeklyDigest: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.getDigestPreferences = jest.fn().mockResolvedValue(mockPreferences);

      const result = await service.getPreferences(userId);

      expect(result).toEqual(mockPreferences);
      expect(mockRepository.getDigestPreferences).toHaveBeenCalledWith(userId);
    });

    it('should create default preferences if none exist', async () => {
      const userId = 'user-123';

      mockRepository.getDigestPreferences = jest.fn().mockResolvedValue(null);
      mockRepository.upsertDigestPreferences = jest.fn().mockResolvedValue({
        id: 'pref-1',
        userId,
        dailyEnabled: true,
        dailyTime: '09:00',
        weeklyEnabled: true,
        weeklyDay: 1,
        weeklyTime: '09:00',
        timezone: 'UTC',
        includeNews: true,
        includeForum: true,
        includeJobs: true,
        includeActivity: true,
        minContentItems: 3,
        vacationMode: false,
        vacationUntil: null,
        lastDailyDigest: null,
        lastWeeklyDigest: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getPreferences(userId);

      expect(result).toBeDefined();
      expect(mockRepository.upsertDigestPreferences).toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('should update digest preferences', async () => {
      const userId = 'user-123';
      const updates = {
        dailyEnabled: false,
        vacationMode: true,
      };

      mockRepository.upsertDigestPreferences = jest.fn().mockResolvedValue({
        id: 'pref-1',
        userId,
        ...updates,
        dailyTime: '09:00',
        weeklyEnabled: true,
        weeklyDay: 1,
        weeklyTime: '09:00',
        timezone: 'UTC',
        includeNews: true,
        includeForum: true,
        includeJobs: true,
        includeActivity: true,
        minContentItems: 3,
        vacationUntil: null,
        lastDailyDigest: null,
        lastWeeklyDigest: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updatePreferences(userId, updates);

      expect(result).toBeDefined();
      expect(result.dailyEnabled).toBe(false);
      expect(result.vacationMode).toBe(true);
      expect(mockRepository.upsertDigestPreferences).toHaveBeenCalledWith({
        userId,
        ...updates,
      });
    });
  });

  describe('trackOpen', () => {
    it('should track email open event', async () => {
      const trackingToken = 'token-123';
      const mockDigest = {
        id: 'digest-1',
        userId: 'user-123',
        type: 'daily' as const,
        sentAt: new Date(),
        emailTo: 'test@example.com',
        subject: 'Test Digest',
        contentSummary: {},
        itemCount: 5,
        trackingToken,
        openedAt: null,
        clickCount: 0,
        unsubscribedAt: null,
        createdAt: new Date(),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
        },
        tracking: [],
      };

      mockRepository.getDigestByTrackingToken = jest.fn().mockResolvedValue(mockDigest);
      mockRepository.markDigestOpened = jest.fn().mockResolvedValue(mockDigest);
      mockRepository.createTrackingEvent = jest.fn().mockResolvedValue({
        id: 'event-1',
        digestId: mockDigest.id,
        eventType: 'opened',
        linkUrl: null,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        metadata: null,
        createdAt: new Date(),
      });

      const result = await service.trackOpen(trackingToken, '127.0.0.1', 'Test Agent');

      expect(result).toEqual({ success: true });
      expect(mockRepository.markDigestOpened).toHaveBeenCalledWith(mockDigest.id);
      expect(mockRepository.createTrackingEvent).toHaveBeenCalledWith({
        digestId: mockDigest.id,
        eventType: 'opened',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      });
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe user from digests', async () => {
      const trackingToken = 'token-123';
      const mockDigest = {
        id: 'digest-1',
        userId: 'user-123',
        type: 'daily' as const,
        sentAt: new Date(),
        emailTo: 'test@example.com',
        subject: 'Test Digest',
        contentSummary: {},
        itemCount: 5,
        trackingToken,
        openedAt: null,
        clickCount: 0,
        unsubscribedAt: null,
        createdAt: new Date(),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
        },
        tracking: [],
      };

      mockRepository.getDigestByTrackingToken = jest.fn().mockResolvedValue(mockDigest);
      mockRepository.upsertDigestPreferences = jest.fn().mockResolvedValue({} as any);
      mockRepository.markDigestUnsubscribed = jest.fn().mockResolvedValue(mockDigest);
      mockRepository.createTrackingEvent = jest.fn().mockResolvedValue({} as any);

      const result = await service.unsubscribe(trackingToken);

      expect(result).toEqual({ success: true });
      expect(mockRepository.upsertDigestPreferences).toHaveBeenCalledWith({
        userId: mockDigest.userId,
        dailyEnabled: false,
        weeklyEnabled: false,
      });
      expect(mockRepository.markDigestUnsubscribed).toHaveBeenCalledWith(mockDigest.id);
    });
  });
});
