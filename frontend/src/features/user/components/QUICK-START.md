# Image Upload Quick Start Guide

## 🚀 Quick Start

### Using in Profile Edit Modal

The image upload components are already integrated into the profile edit modal. Users can:

1. Click "Edit Profile" button
2. Navigate to "Images" tab
3. Upload avatar or cover image
4. Crop, zoom, and rotate as needed
5. Save to upload

### Basic Usage

#### Avatar Upload
```tsx
import { AvatarUpload } from '@/features/user/components';

<AvatarUpload
  currentAvatar={profile.avatar}
  displayName={profile.displayName}
  username={profile.username}
/>
```

#### Cover Image Upload
```tsx
import { CoverImageUpload } from '@/features/user/components';

<CoverImageUpload
  currentCoverImage={profile.coverImage}
  username={profile.username}
/>
```

#### Standalone Upload Button
```tsx
import { ImageUploadButton } from '@/features/user/components';

const [file, setFile] = useState<File | null>(null);

<ImageUploadButton
  onImageSelect={(file) => setFile(file)}
  maxSize={5}
  acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
  buttonText="Upload Image"
/>
```

#### Crop Modal
```tsx
import { ImageCropModal } from '@/features/user/components';

const [imageUrl, setImageUrl] = useState('');
const [showCrop, setShowCrop] = useState(false);

{showCrop && (
  <ImageCropModal
    imageUrl={imageUrl}
    aspectRatio={1} // 1:1 for square, 16/9 for landscape
    onCropComplete={(blob) => {
      // Upload blob to server
      uploadImage(blob);
      setShowCrop(false);
    }}
    onClose={() => setShowCrop(false)}
    title="Crop Image"
  />
)}
```

## 📝 Common Scenarios

### Custom Upload Flow
```tsx
import { ImageUploadButton, ImageCropModal } from '@/features/user/components';

const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState('');
const [showCropModal, setShowCropModal] = useState(false);

const handleFileSelect = (file: File) => {
  setSelectedFile(file);
  const url = URL.createObjectURL(file);
  setPreviewUrl(url);
  setShowCropModal(true);
};

const handleCropComplete = async (blob: Blob) => {
  // Upload to server
  const formData = new FormData();
  formData.append('image', blob, 'image.jpg');

  await axios.post('/api/upload', formData);

  setShowCropModal(false);
  URL.revokeObjectURL(previewUrl);
};

return (
  <>
    <ImageUploadButton
      onImageSelect={handleFileSelect}
      maxSize={10}
      buttonText="Choose Image"
    />

    {showCropModal && (
      <ImageCropModal
        imageUrl={previewUrl}
        aspectRatio={16/9}
        onCropComplete={handleCropComplete}
        onClose={() => {
          setShowCropModal(false);
          URL.revokeObjectURL(previewUrl);
        }}
        title="Crop Your Image"
      />
    )}
  </>
);
```

### With Upload Progress
```tsx
import { useState } from 'react';
import axios from 'axios';

const [uploadProgress, setUploadProgress] = useState(0);

const uploadImage = async (blob: Blob) => {
  const formData = new FormData();
  formData.append('image', blob);

  await axios.post('/api/upload', formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentage = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentage);
      }
    }
  });
};
```

## ⚙️ Configuration Options

### ImageUploadButton Props
```typescript
interface ImageUploadButtonProps {
  onImageSelect: (file: File) => void;
  maxSize?: number;              // MB (default: 5)
  acceptedFormats?: string[];    // MIME types
  buttonText?: string;           // Button label
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}
```

### ImageCropModal Props
```typescript
interface ImageCropModalProps {
  imageUrl: string;              // Data URL or blob URL
  aspectRatio: number;           // 1 for square, 16/9 for landscape
  onCropComplete: (blob: Blob) => void;
  onClose: () => void;
  title: string;
}
```

### AvatarUpload Props
```typescript
interface AvatarUploadProps {
  currentAvatar?: string;        // Current avatar URL
  displayName?: string;          // For fallback initials
  username: string;              // Required for API calls
  onUploadSuccess?: (url: string) => void;
  onDeleteSuccess?: () => void;
}
```

### CoverImageUpload Props
```typescript
interface CoverImageUploadProps {
  currentCoverImage?: string;    // Current cover URL
  username: string;              // Required for API calls
  onUploadSuccess?: (url: string) => void;
  onDeleteSuccess?: () => void;
}
```

## 🔧 Troubleshooting

### File Not Uploading
- Check file size (avatar: 5MB, cover: 10MB)
- Verify file format (JPEG, PNG, WebP only)
- Check browser console for errors
- Verify backend endpoint is working

### Crop Modal Not Opening
- Ensure preview URL is created with `URL.createObjectURL()`
- Check that `showCropModal` state is true
- Verify file was selected successfully

### Upload Progress Not Showing
- Use Axios for upload (not fetch)
- Add `onUploadProgress` callback
- Check that progress state is updating

### Memory Leaks
- Always cleanup URLs: `URL.revokeObjectURL(url)`
- Use `useEffect` cleanup function
- Example:
```tsx
useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);
```

## 📚 API Endpoints

### Upload Avatar
```
POST /api/v1/users/me/avatar
Content-Type: multipart/form-data
Body: FormData with 'avatar' file

Response: { avatarUrl: string }
```

### Delete Avatar
```
DELETE /api/v1/users/me/avatar

Response: 204 No Content
```

### Upload Cover
```
POST /api/v1/users/me/cover
Content-Type: multipart/form-data
Body: FormData with 'cover' file

Response: { coverImageUrl: string }
```

### Delete Cover
```
DELETE /api/v1/users/me/cover

Response: 204 No Content
```

## ✅ Best Practices

1. **Always validate on both client and server**
   ```tsx
   // Client-side validation is for UX
   // Server-side validation is for security
   ```

2. **Clean up preview URLs**
   ```tsx
   useEffect(() => {
     return () => URL.revokeObjectURL(previewUrl);
   }, [previewUrl]);
   ```

3. **Show upload progress**
   ```tsx
   // Users expect feedback for slow uploads
   onUploadProgress: (progressEvent) => {
     setProgress(percentage);
   }
   ```

4. **Handle errors gracefully**
   ```tsx
   try {
     await uploadImage(blob);
   } catch (error) {
     console.error('Upload failed:', error);
     // Show user-friendly error message
   }
   ```

5. **Invalidate cache after upload**
   ```tsx
   onSuccess: () => {
     queryClient.invalidateQueries(['profile', username]);
   }
   ```

## 🎨 Styling

All components use Tailwind CSS and support dark mode out of the box.

### Custom Styling
```tsx
<ImageUploadButton
  className="custom-class"
  variant="primary"
  size="lg"
/>
```

### Dark Mode
Components automatically adapt to dark mode using Tailwind's `dark:` prefix.

## 🔐 Security Notes

- Client validation is for UX only
- Server must validate file type and size
- Server should scan for malware
- Server should strip EXIF data
- Use signed URLs for private images

## 📱 Mobile Support

All components are fully responsive and work on:
- iOS Safari 14+
- Android Chrome 90+
- Mobile Firefox 88+

Touch gestures work for:
- Zoom (pinch)
- Pan (drag)
- Rotate (two-finger rotation)

## 🌍 Accessibility

- Keyboard navigation: Tab, Enter, Escape
- Screen reader support: ARIA labels
- High contrast mode: Full support
- Focus indicators: Visible on all controls

---

For more details, see:
- `ImageUpload.README.md` - Full documentation
- `ARCHITECTURE.md` - Technical architecture
- `ImageUploadExample.tsx` - Code examples
