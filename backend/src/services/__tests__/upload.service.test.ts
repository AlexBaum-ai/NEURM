import { UploadService } from '../upload.service';
import StorageService from '../storage.service';
import ImageService from '../image.service';
import UserRepository from '@/modules/users/users.repository';
import { BadRequestError } from '@/utils/errors';

// Mock dependencies
jest.mock('../storage.service');
jest.mock('../image.service');
jest.mock('@/modules/users/users.repository');
jest.mock('@/utils/logger');

describe('UploadService', () => {
  let uploadService: UploadService;
  let mockStorageService: jest.Mocked<StorageService>;
  let mockImageService: jest.Mocked<ImageService>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockStorageService = new StorageService() as jest.Mocked<StorageService>;
    mockImageService = new ImageService() as jest.Mocked<ImageService>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;

    // Initialize service with mocks
    uploadService = new UploadService(
      mockStorageService,
      mockImageService,
      mockUserRepository
    );
  });

  describe('uploadAvatar', () => {
    const userId = 'user-123';
    const mockBuffer = Buffer.from('fake-image-data');
    const mockMetadata = {
      width: 1024,
      height: 1024,
      format: 'jpeg',
      size: mockBuffer.length,
    };

    it('should upload avatar with multiple sizes', async () => {
      // Mock image validation
      mockImageService.validateImage.mockResolvedValue(mockMetadata);

      // Mock avatar size generation
      mockImageService.generateAvatarSizes.mockResolvedValue({
        thumbnail: Buffer.from('thumbnail'),
        small: Buffer.from('small'),
        medium: Buffer.from('medium'),
        large: Buffer.from('large'),
      });

      // Mock storage uploads
      mockStorageService.uploadFile.mockResolvedValueOnce(
        'https://cdn.example.com/avatar/user-123/thumbnail-123.webp'
      );
      mockStorageService.uploadFile.mockResolvedValueOnce(
        'https://cdn.example.com/avatar/user-123/small-123.webp'
      );
      mockStorageService.uploadFile.mockResolvedValueOnce(
        'https://cdn.example.com/avatar/user-123/medium-123.webp'
      );
      mockStorageService.uploadFile.mockResolvedValueOnce(
        'https://cdn.example.com/avatar/user-123/large-123.webp'
      );

      // Mock user repository
      mockUserRepository.findById.mockResolvedValue({
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        profile: { avatarUrl: null },
      } as any);

      mockUserRepository.updateProfile.mockResolvedValue({} as any);

      // Execute
      const result = await uploadService.uploadAvatar(userId, mockBuffer);

      // Verify
      expect(result.avatarUrl).toBe(
        'https://cdn.example.com/avatar/user-123/large-123.webp'
      );
      expect(result.sizes).toEqual({
        thumbnail: 'https://cdn.example.com/avatar/user-123/thumbnail-123.webp',
        small: 'https://cdn.example.com/avatar/user-123/small-123.webp',
        medium: 'https://cdn.example.com/avatar/user-123/medium-123.webp',
        large: 'https://cdn.example.com/avatar/user-123/large-123.webp',
      });

      expect(mockImageService.validateImage).toHaveBeenCalledWith(mockBuffer);
      expect(mockImageService.generateAvatarSizes).toHaveBeenCalledWith(mockBuffer);
      expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(4);
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(userId, {
        avatarUrl: result.avatarUrl,
      });
    });

    it('should delete old avatar images when uploading new avatar', async () => {
      const oldAvatarUrl = 'https://cdn.example.com/avatar/user-123/old-avatar.webp';

      // Mock image validation
      mockImageService.validateImage.mockResolvedValue(mockMetadata);

      // Mock avatar size generation
      mockImageService.generateAvatarSizes.mockResolvedValue({
        thumbnail: Buffer.from('thumbnail'),
        small: Buffer.from('small'),
        medium: Buffer.from('medium'),
        large: Buffer.from('large'),
      });

      // Mock storage uploads
      mockStorageService.uploadFile.mockResolvedValue(
        'https://cdn.example.com/avatar/user-123/new-avatar.webp'
      );

      // Mock user repository with existing avatar
      mockUserRepository.findById.mockResolvedValue({
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        profile: { avatarUrl: oldAvatarUrl },
      } as any);

      mockUserRepository.updateProfile.mockResolvedValue({} as any);

      // Mock extractKeyFromUrl
      mockStorageService.extractKeyFromUrl.mockReturnValue(
        'avatar/user-123/old-avatar.webp'
      );

      // Execute
      await uploadService.uploadAvatar(userId, mockBuffer);

      // Wait for async deletion
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify old images are being deleted (async)
      expect(mockStorageService.extractKeyFromUrl).toHaveBeenCalledWith(oldAvatarUrl);
    });
  });

  describe('uploadCover', () => {
    const userId = 'user-123';
    const mockBuffer = Buffer.from('fake-cover-image-data');
    const mockMetadata = {
      width: 1920,
      height: 1080,
      format: 'jpeg',
      size: mockBuffer.length,
    };

    it('should upload cover image with multiple sizes', async () => {
      // Mock image validation
      mockImageService.validateImage.mockResolvedValue(mockMetadata);

      // Mock cover size generation
      mockImageService.generateCoverSizes.mockResolvedValue({
        small: Buffer.from('small'),
        medium: Buffer.from('medium'),
        large: Buffer.from('large'),
      });

      // Mock storage uploads
      mockStorageService.uploadFile.mockResolvedValueOnce(
        'https://cdn.example.com/cover/user-123/small-123.webp'
      );
      mockStorageService.uploadFile.mockResolvedValueOnce(
        'https://cdn.example.com/cover/user-123/medium-123.webp'
      );
      mockStorageService.uploadFile.mockResolvedValueOnce(
        'https://cdn.example.com/cover/user-123/large-123.webp'
      );

      // Mock user repository
      mockUserRepository.findById.mockResolvedValue({
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        profile: { coverImageUrl: null },
      } as any);

      mockUserRepository.updateProfile.mockResolvedValue({} as any);

      // Execute
      const result = await uploadService.uploadCover(userId, mockBuffer);

      // Verify
      expect(result.coverImageUrl).toBe(
        'https://cdn.example.com/cover/user-123/large-123.webp'
      );
      expect(result.sizes).toEqual({
        small: 'https://cdn.example.com/cover/user-123/small-123.webp',
        medium: 'https://cdn.example.com/cover/user-123/medium-123.webp',
        large: 'https://cdn.example.com/cover/user-123/large-123.webp',
      });

      expect(mockImageService.validateImage).toHaveBeenCalledWith(mockBuffer);
      expect(mockImageService.generateCoverSizes).toHaveBeenCalledWith(mockBuffer);
      expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(3);
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(userId, {
        coverImageUrl: result.coverImageUrl,
      });
    });
  });
});
