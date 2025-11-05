import React from 'react';
import { AvatarUpload } from '../AvatarUpload';
import { CoverImageUpload } from '../CoverImageUpload';
import type { UserProfile } from '../../types';

interface ImagesFormProps {
  profile: UserProfile;
  onSuccess?: () => void;
  onDirty?: () => void;
}

/**
 * ImagesForm - Form for uploading avatar and cover images
 *
 * Features:
 * - Avatar upload (1:1 ratio, max 5MB)
 * - Cover image upload (16:9 ratio, max 10MB)
 * - Image cropping with zoom and rotation
 * - Upload progress indicators
 * - Delete functionality
 */
const ImagesForm: React.FC<ImagesFormProps> = ({ profile, onSuccess, onDirty }) => {
  const handleUploadSuccess = () => {
    onSuccess?.();
  };

  const handleDeleteSuccess = () => {
    onSuccess?.();
  };

  return (
    <div className="space-y-8">
      {/* Cover Image Section */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cover Image</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload a landscape image to personalize your profile header. Recommended size: 1200x675px (16:9 ratio).
          </p>
        </div>
        <CoverImageUpload
          currentCoverImage={profile.coverImage}
          username={profile.username}
          onUploadSuccess={handleUploadSuccess}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Avatar Section */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Avatar</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload a square image for your profile picture. This will be displayed throughout the platform.
          </p>
        </div>
        <AvatarUpload
          currentAvatar={profile.avatar}
          displayName={profile.displayName}
          username={profile.username}
          onUploadSuccess={handleUploadSuccess}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </section>

      {/* Tips Section */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Image Upload Tips
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Use high-quality images for the best results</li>
          <li>Avatar: Square format (1:1 ratio), max 5MB</li>
          <li>Cover: Landscape format (16:9 ratio), max 10MB</li>
          <li>Supported formats: JPEG, PNG, WebP</li>
          <li>You can zoom, rotate, and crop before uploading</li>
          <li>Images are automatically optimized for web display</li>
        </ul>
      </section>
    </div>
  );
};

export default ImagesForm;
