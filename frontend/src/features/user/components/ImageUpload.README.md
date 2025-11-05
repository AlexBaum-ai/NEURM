# Image Upload Components

This directory contains the image upload UI components for avatar and cover image uploads with cropping functionality.

## Components

### 1. ImageUploadButton
A reusable file input button with validation.

**Features:**
- File type validation (JPEG, PNG, WebP)
- File size validation (configurable max size)
- Error display with dismiss functionality
- Loading state support
- Customizable button text and styling

**Usage:**
```tsx
<ImageUploadButton
  onImageSelect={(file) => handleFile(file)}
  maxSize={5} // MB
  acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
  buttonText="Upload Image"
  variant="outline"
  size="md"
/>
```

### 2. ImageCropModal
Modal dialog for cropping images with aspect ratio enforcement.

**Features:**
- Interactive crop area with zoom and rotation
- Enforced aspect ratios (1:1 for avatar, 16:9 for cover)
- Zoom slider (1x - 3x)
- 90-degree rotation
- Canvas-based image processing
- Returns cropped image as Blob

**Usage:**
```tsx
<ImageCropModal
  imageUrl={previewUrl}
  aspectRatio={1} // 1:1 for avatar, 16/9 for cover
  onCropComplete={(blob) => handleCroppedImage(blob)}
  onClose={() => setShowModal(false)}
  title="Crop Avatar"
/>
```

### 3. AvatarUpload
Complete avatar upload workflow with preview and delete.

**Features:**
- Current avatar display with fallback to initials
- Upload with automatic cropping (1:1 aspect ratio)
- Real-time upload progress indicator
- Delete functionality with confirmation
- Automatic cache invalidation
- Max size: 5MB

**Usage:**
```tsx
<AvatarUpload
  currentAvatar={profile.avatar}
  displayName={profile.displayName}
  username={profile.username}
  onUploadSuccess={(url) => console.log('New avatar:', url)}
  onDeleteSuccess={() => console.log('Avatar deleted')}
/>
```

### 4. CoverImageUpload
Complete cover image upload workflow with preview and delete.

**Features:**
- Current cover image display with gradient fallback
- Upload with automatic cropping (16:9 aspect ratio)
- Real-time upload progress indicator
- Delete functionality with confirmation
- Automatic cache invalidation
- Max size: 10MB

**Usage:**
```tsx
<CoverImageUpload
  currentCoverImage={profile.coverImage}
  username={profile.username}
  onUploadSuccess={(url) => console.log('New cover:', url)}
  onDeleteSuccess={() => console.log('Cover deleted')}
/>
```

### 5. EditProfileModal
Comprehensive profile editing modal with tabs for basic info and images.

**Features:**
- Tabbed interface (Basic Info / Images)
- Form validation with Zod
- Avatar and cover image upload
- Real-time form state management
- Auto-save on successful upload
- Error handling

**Usage:**
```tsx
<EditProfileModal
  profile={userProfile}
  onClose={() => setShowModal(false)}
/>
```

## Upload Flow

1. **User clicks upload button** → File picker opens
2. **User selects image** → File validation runs
3. **If valid** → Preview URL created, crop modal opens
4. **User adjusts crop** → Zoom, pan, rotate controls
5. **User clicks save** → Canvas processes crop
6. **Cropped blob created** → Upload to server with progress
7. **Upload complete** → Cache invalidation, UI update

## File Validation

### Avatar
- **Formats:** JPEG, PNG, WebP
- **Max Size:** 5MB
- **Aspect Ratio:** 1:1 (enforced via crop)
- **Output Format:** JPEG (optimized)

### Cover Image
- **Formats:** JPEG, PNG, WebP
- **Max Size:** 10MB
- **Aspect Ratio:** 16:9 (enforced via crop)
- **Output Format:** JPEG (optimized)

## Error Handling

All components handle errors gracefully:
- Invalid file format → User-friendly error message
- File too large → Size limit displayed
- Upload failure → Error logged, user notified
- Network error → Retry suggestion

## Dependencies

- **react-easy-crop**: Image cropping library
- **axios**: HTTP client with upload progress
- **@tanstack/react-query**: Cache management
- **react-hook-form**: Form state management
- **zod**: Schema validation

## API Endpoints

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

## Browser Compatibility

- **File API:** All modern browsers
- **Canvas API:** All modern browsers
- **FormData:** All modern browsers
- **Blob:** All modern browsers
- **URL.createObjectURL:** All modern browsers

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

1. **Preview URLs are cleaned up** on component unmount to prevent memory leaks
2. **Canvas processing** is asynchronous to avoid blocking UI
3. **Upload progress** provides user feedback for slow connections
4. **Image optimization** reduces file size before upload
5. **Cache invalidation** ensures fresh data after upload

## Accessibility

- Keyboard navigation support
- ARIA labels on buttons
- Focus management in modal
- Screen reader announcements for upload progress
- High contrast mode support

## Testing

Test file: `__tests__/ImageUploadButton.test.tsx`

Coverage:
- File type validation
- File size validation
- Success callback invocation
- Error state display
- Loading state display
- Disabled state behavior

## Future Enhancements

- [ ] Multiple image upload
- [ ] Drag and drop support
- [ ] Image filters (brightness, contrast, etc.)
- [ ] Face detection for smart cropping
- [ ] Image compression settings
- [ ] WebP output option
- [ ] Upload queue for bulk uploads
- [ ] Cloudinary/Imgix integration

## Related Components

- `ProfileHeader`: Displays avatar and cover image
- `EditProfileModal`: Contains upload components
- `ProfilePage`: Main profile page with edit modal

## Sprint Task

This component set was developed as part of **SPRINT-1-012**: Build avatar and cover image upload UI.

**Acceptance Criteria Met:**
- ✅ Avatar upload button with file picker
- ✅ Cover image upload button
- ✅ Image preview before upload
- ✅ Crop modal (react-easy-crop)
- ✅ Aspect ratio enforcement (1:1 for avatar, 16:9 for cover)
- ✅ File size validation (max 5MB/10MB)
- ✅ Format validation (JPEG, PNG, WebP only)
- ✅ Upload progress indicator
- ✅ Error handling (file too large, wrong format)
- ✅ Immediate preview after successful upload
- ✅ Delete image option
