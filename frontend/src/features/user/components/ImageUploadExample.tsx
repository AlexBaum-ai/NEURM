/**
 * ImageUploadExample - Example component demonstrating image upload usage
 *
 * This is a reference implementation showing how to use the image upload components.
 * NOT used in production - for documentation purposes only.
 */

import React, { useState } from 'react';
import { AvatarUpload } from './AvatarUpload';
import { CoverImageUpload } from './CoverImageUpload';
import { ImageUploadButton } from './ImageUploadButton';
import { ImageCropModal } from './ImageCropModal';

export const ImageUploadExample: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);

  const handleImageSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setShowCropModal(true);
  };

  const handleCropComplete = (blob: Blob) => {
    console.log('Cropped image blob:', blob);
    setShowCropModal(false);
    // Here you would upload the blob to your server
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Image Upload Examples
      </h1>

      {/* Example 1: Avatar Upload */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          1. Avatar Upload (1:1 ratio, max 5MB)
        </h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <AvatarUpload
            currentAvatar="https://via.placeholder.com/150"
            displayName="John Doe"
            username="johndoe"
            onUploadSuccess={(url) => console.log('Avatar uploaded:', url)}
            onDeleteSuccess={() => console.log('Avatar deleted')}
          />
        </div>
      </section>

      {/* Example 2: Cover Image Upload */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          2. Cover Image Upload (16:9 ratio, max 10MB)
        </h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <CoverImageUpload
            currentCoverImage="https://via.placeholder.com/1200x675"
            username="johndoe"
            onUploadSuccess={(url) => console.log('Cover uploaded:', url)}
            onDeleteSuccess={() => console.log('Cover deleted')}
          />
        </div>
      </section>

      {/* Example 3: Standalone Upload Button */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          3. Standalone Upload Button with Custom Validation
        </h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <ImageUploadButton
            onImageSelect={handleImageSelect}
            maxSize={2}
            acceptedFormats={['image/jpeg', 'image/png']}
            buttonText="Select Image to Crop"
            variant="primary"
            size="lg"
          />
        </div>
      </section>

      {/* Example 4: Crop Modal */}
      {showCropModal && selectedImage && (
        <ImageCropModal
          imageUrl={selectedImage}
          aspectRatio={16 / 9}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setShowCropModal(false);
            URL.revokeObjectURL(selectedImage);
            setSelectedImage('');
          }}
          title="Crop Your Image"
        />
      )}

      {/* Code Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Code Examples
        </h2>
        <div className="bg-gray-900 p-6 rounded-lg overflow-x-auto">
          <pre className="text-green-400 text-sm">
            <code>{`// Avatar Upload
<AvatarUpload
  currentAvatar={profile.avatar}
  displayName={profile.displayName}
  username={profile.username}
  onUploadSuccess={(url) => console.log('Uploaded:', url)}
/>

// Cover Image Upload
<CoverImageUpload
  currentCoverImage={profile.coverImage}
  username={profile.username}
  onUploadSuccess={(url) => console.log('Uploaded:', url)}
/>

// Custom Upload with Crop
const [image, setImage] = useState('');
const [showCrop, setShowCrop] = useState(false);

<ImageUploadButton
  onImageSelect={(file) => {
    setImage(URL.createObjectURL(file));
    setShowCrop(true);
  }}
  maxSize={5}
/>

{showCrop && (
  <ImageCropModal
    imageUrl={image}
    aspectRatio={1}
    onCropComplete={(blob) => uploadToServer(blob)}
    onClose={() => setShowCrop(false)}
    title="Crop Image"
  />
)}`}</code>
          </pre>
        </div>
      </section>

      {/* Features List */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Features</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>File type validation (JPEG, PNG, WebP)</li>
          <li>File size validation (configurable max size)</li>
          <li>Image preview before upload</li>
          <li>Interactive crop with zoom and rotation</li>
          <li>Aspect ratio enforcement</li>
          <li>Upload progress indicator</li>
          <li>Delete functionality with confirmation</li>
          <li>Automatic cache invalidation</li>
          <li>Error handling and user feedback</li>
          <li>Responsive design (mobile-friendly)</li>
          <li>Dark mode support</li>
          <li>Accessibility (keyboard navigation, ARIA labels)</li>
        </ul>
      </section>
    </div>
  );
};

export default ImageUploadExample;
