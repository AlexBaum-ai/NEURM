import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import ProfileViewsService from '../profileViews.service';
import ProfileViewsRepository from '../profileViews.repository';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';

// Mock the repository
vi.mock('../profileViews.repository');

describe('ProfileViewsService', () => {
  let service: ProfileViewsService;
  let mockRepository: {
    getUserByUsername: Mock;
    isViewTrackingEnabled: Mock;
    getUserCompanyId: Mock;
    trackProfileView: Mock;
    hasPremiumAccess: Mock;
    getProfileViewers: Mock;
    getTotalViewCount: Mock;
    getUniqueViewersCount: Mock;
  };

  beforeEach(() => {
    mockRepository = {
      getUserByUsername: vi.fn(),
      isViewTrackingEnabled: vi.fn(),
      getUserCompanyId: vi.fn(),
      trackProfileView: vi.fn(),
      hasPremiumAccess: vi.fn(),
      getProfileViewers: vi.fn(),
      getTotalViewCount: vi.fn(),
      getUniqueViewersCount: vi.fn(),
    };

    service = new ProfileViewsService(mockRepository as any);
  });

  describe('trackProfileView', () => {
    it('should track a profile view successfully', async () => {
      const username = 'testuser';
      const viewerId = 'viewer-id';
      const profileId = 'profile-id';

      mockRepository.getUserByUsername.mockResolvedValue({ id: profileId, role: 'user' });
      mockRepository.isViewTrackingEnabled.mockResolvedValue(true);
      mockRepository.getUserCompanyId.mockResolvedValue('company-id');
      mockRepository.trackProfileView.mockResolvedValue({ id: 'view-id' });

      const result = await service.trackProfileView(username, viewerId, false);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile view tracked successfully');
      expect(mockRepository.trackProfileView).toHaveBeenCalledWith(
        profileId,
        viewerId,
        false,
        'company-id'
      );
    });

    it('should not track view on own profile', async () => {
      const username = 'testuser';
      const viewerId = 'same-id';

      mockRepository.getUserByUsername.mockResolvedValue({ id: viewerId, role: 'user' });

      const result = await service.trackProfileView(username, viewerId, false);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot track views on your own profile');
      expect(mockRepository.trackProfileView).not.toHaveBeenCalled();
    });

    it('should not track view if tracking is disabled', async () => {
      const username = 'testuser';
      const viewerId = 'viewer-id';
      const profileId = 'profile-id';

      mockRepository.getUserByUsername.mockResolvedValue({ id: profileId, role: 'user' });
      mockRepository.isViewTrackingEnabled.mockResolvedValue(false);

      const result = await service.trackProfileView(username, viewerId, false);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Profile view tracking is disabled for this user');
      expect(mockRepository.trackProfileView).not.toHaveBeenCalled();
    });

    it('should handle duplicate views (24h deduplication)', async () => {
      const username = 'testuser';
      const viewerId = 'viewer-id';
      const profileId = 'profile-id';

      mockRepository.getUserByUsername.mockResolvedValue({ id: profileId, role: 'user' });
      mockRepository.isViewTrackingEnabled.mockResolvedValue(true);
      mockRepository.getUserCompanyId.mockResolvedValue(null);
      mockRepository.trackProfileView.mockResolvedValue(null); // Duplicate view

      const result = await service.trackProfileView(username, viewerId, false);

      expect(result.success).toBe(false);
      expect(result.message).toBe('View already tracked within the last 24 hours');
    });

    it('should throw NotFoundError if profile not found', async () => {
      const username = 'nonexistent';
      const viewerId = 'viewer-id';

      mockRepository.getUserByUsername.mockResolvedValue(null);

      await expect(service.trackProfileView(username, viewerId, false)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should track anonymous view', async () => {
      const username = 'testuser';
      const viewerId = 'viewer-id';
      const profileId = 'profile-id';

      mockRepository.getUserByUsername.mockResolvedValue({ id: profileId, role: 'user' });
      mockRepository.isViewTrackingEnabled.mockResolvedValue(true);
      mockRepository.getUserCompanyId.mockResolvedValue(null);
      mockRepository.trackProfileView.mockResolvedValue({ id: 'view-id', anonymous: true });

      const result = await service.trackProfileView(username, viewerId, true);

      expect(result.success).toBe(true);
      expect(mockRepository.trackProfileView).toHaveBeenCalledWith(
        profileId,
        viewerId,
        true,
        undefined
      );
    });
  });

  describe('getMyProfileViewers', () => {
    it('should return profile viewers for premium users', async () => {
      const userId = 'user-id';
      const mockViews = [
        {
          id: 'view-1',
          viewedAt: new Date(),
          anonymous: false,
          viewer: {
            id: 'viewer-1',
            username: 'viewer1',
            role: 'user',
            profile: {
              displayName: 'Viewer One',
              avatarUrl: 'https://example.com/avatar.jpg',
            },
            company: null,
          },
        },
      ];

      mockRepository.hasPremiumAccess.mockResolvedValue(true);
      mockRepository.getProfileViewers.mockResolvedValue({
        views: mockViews,
        total: 1,
      });
      mockRepository.getTotalViewCount.mockResolvedValue(10);
      mockRepository.getUniqueViewersCount.mockResolvedValue(5);

      const result = await service.getMyProfileViewers(userId, 1, 20);

      expect(result.totalViews).toBe(10);
      expect(result.uniqueViewers).toBe(5);
      expect(result.views).toHaveLength(1);
      expect(result.views[0].viewer).not.toBeNull();
      expect(result.views[0].viewer?.username).toBe('viewer1');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should throw ForbiddenError for non-premium users', async () => {
      const userId = 'user-id';

      mockRepository.hasPremiumAccess.mockResolvedValue(false);

      await expect(service.getMyProfileViewers(userId, 1, 20)).rejects.toThrow(ForbiddenError);
    });

    it('should hide viewer details for anonymous views', async () => {
      const userId = 'user-id';
      const mockViews = [
        {
          id: 'view-1',
          viewedAt: new Date(),
          anonymous: true,
          viewer: {
            id: 'viewer-1',
            username: 'viewer1',
            role: 'user',
            profile: {
              displayName: 'Viewer One',
              avatarUrl: 'https://example.com/avatar.jpg',
            },
            company: null,
          },
        },
      ];

      mockRepository.hasPremiumAccess.mockResolvedValue(true);
      mockRepository.getProfileViewers.mockResolvedValue({
        views: mockViews,
        total: 1,
      });
      mockRepository.getTotalViewCount.mockResolvedValue(1);
      mockRepository.getUniqueViewersCount.mockResolvedValue(1);

      const result = await service.getMyProfileViewers(userId, 1, 20);

      expect(result.views[0].anonymous).toBe(true);
      expect(result.views[0].viewer).toBeNull();
    });

    it('should validate pagination parameters', async () => {
      const userId = 'user-id';

      mockRepository.hasPremiumAccess.mockResolvedValue(true);

      await expect(service.getMyProfileViewers(userId, 0, 20)).rejects.toThrow(BadRequestError);
      await expect(service.getMyProfileViewers(userId, 1, 0)).rejects.toThrow(BadRequestError);
      await expect(service.getMyProfileViewers(userId, 1, 101)).rejects.toThrow(BadRequestError);
    });
  });

  describe('getProfileViewCount', () => {
    it('should return profile view count', async () => {
      const username = 'testuser';
      const profileId = 'profile-id';

      mockRepository.getUserByUsername.mockResolvedValue({ id: profileId, role: 'user' });
      mockRepository.getTotalViewCount.mockResolvedValue(42);

      const result = await service.getProfileViewCount(username);

      expect(result.totalViews).toBe(42);
    });

    it('should throw NotFoundError if profile not found', async () => {
      const username = 'nonexistent';

      mockRepository.getUserByUsername.mockResolvedValue(null);

      await expect(service.getProfileViewCount(username)).rejects.toThrow(NotFoundError);
    });
  });
});
