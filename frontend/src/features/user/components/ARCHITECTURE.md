# Image Upload Architecture

## Component Hierarchy

```
ProfilePage
└── EditProfileModalWrapper (on edit click)
    └── EditProfileModal
        ├── Tab: Basic Info
        │   └── Form (React Hook Form)
        │       ├── Display Name Input
        │       ├── Headline Input
        │       ├── Bio Textarea
        │       ├── Location Input
        │       ├── Website Input
        │       └── Social Links
        │           ├── Twitter Input
        │           ├── LinkedIn Input
        │           └── GitHub Input
        │
        └── Tab: Images
            ├── CoverImageUpload
            │   ├── Cover Preview
            │   ├── ImageUploadButton (max 10MB, 16:9)
            │   ├── Delete Button
            │   └── ImageCropModal (conditional)
            │       ├── Cropper (react-easy-crop)
            │       ├── Zoom Slider
            │       └── Rotate Button
            │
            └── AvatarUpload
                ├── Avatar Preview
                ├── ImageUploadButton (max 5MB, 1:1)
                ├── Delete Button
                └── ImageCropModal (conditional)
                    ├── Cropper (react-easy-crop)
                    ├── Zoom Slider
                    └── Rotate Button
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        User Action                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ImageUploadButton                               │
│  - Opens file picker                                         │
│  - Validates file type (JPEG, PNG, WebP)                     │
│  - Validates file size (5MB/10MB)                            │
│  - Creates preview URL (URL.createObjectURL)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ImageCropModal                                  │
│  - Displays preview image                                    │
│  - User adjusts crop area                                    │
│  - User adjusts zoom (1x - 3x)                              │
│  - User rotates image (90° increments)                       │
│  - Enforces aspect ratio                                     │
│  - Processes crop on save                                    │
│  - Returns cropped Blob                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         AvatarUpload / CoverImageUpload                      │
│  - Creates FormData with blob                                │
│  - Uploads via Axios                                         │
│  - Tracks upload progress                                    │
│  - Shows progress indicator                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API                                     │
│  POST /api/v1/users/me/avatar                               │
│  POST /api/v1/users/me/cover                                │
│  - Validates file                                            │
│  - Stores in S3/CloudFlare R2                               │
│  - Returns image URL                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         React Query Cache Invalidation                       │
│  - Invalidates ['profile', username]                         │
│  - Invalidates ['currentUser']                              │
│  - Triggers automatic refetch                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              UI Update                                       │
│  - ProfileHeader shows new image                             │
│  - Upload progress hidden                                    │
│  - Success callback invoked                                  │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### Local Component State
```typescript
// AvatarUpload / CoverImageUpload
const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
const [showCropModal, setShowCropModal] = useState(false);
const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

// ImageCropModal
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [rotation, setRotation] = useState(0);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

// EditProfileModal
const [activeTab, setActiveTab] = useState<'basic' | 'images'>('basic');
```

### Server State (React Query)
```typescript
// Upload mutation
const uploadMutation = useMutation({
  mutationFn: async (blob: Blob) => uploadAvatar(blob),
  onSuccess: () => {
    queryClient.invalidateQueries(['profile', username]);
    queryClient.invalidateQueries(['currentUser']);
  }
});

// Delete mutation
const deleteMutation = useMutation({
  mutationFn: deleteAvatar,
  onSuccess: () => {
    queryClient.invalidateQueries(['profile', username]);
  }
});
```

### Form State (React Hook Form)
```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isDirty }
} = useForm<ProfileUpdateFormData>({
  resolver: zodResolver(profileUpdateSchema),
  defaultValues: { ... }
});
```

## Image Processing Pipeline

```
Original Image
     │
     ▼
┌──────────────────────┐
│  Load into Canvas    │ ← User selects file
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Apply Rotation      │ ← User rotates (0°, 90°, 180°, 270°)
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Apply Zoom          │ ← User zooms (1x - 3x)
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Apply Crop Area     │ ← User positions crop box
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Extract Pixels      │ ← getImageData()
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Create New Canvas   │ ← Exact crop dimensions
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Put Cropped Pixels  │ ← putImageData()
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Convert to Blob     │ ← toBlob('image/jpeg')
└──────┬───────────────┘
       │
       ▼
   Optimized JPEG Blob
```

## Validation Layers

### Layer 1: Client-Side (ImageUploadButton)
```typescript
// File type validation
if (!acceptedFormats.includes(file.type)) {
  return 'Invalid file format';
}

// File size validation
if (file.size > maxSize * 1024 * 1024) {
  return 'File too large';
}
```

### Layer 2: Aspect Ratio (ImageCropModal)
```typescript
// Enforced via react-easy-crop
<Cropper
  aspect={aspectRatio} // 1 for avatar, 16/9 for cover
  restrictPosition={true}
/>
```

### Layer 3: Server-Side (Backend API)
```typescript
// Backend validates:
// - File type (MIME type)
// - File size
// - Image dimensions
// - File integrity
// - Malware scan (optional)
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│                     Error Scenarios                          │
└─────────────────────────────────────────────────────────────┘

1. Invalid File Type
   → Client validation fails
   → Error message displayed below button
   → File input reset

2. File Too Large
   → Client validation fails
   → Error message shows max size
   → File input reset

3. Network Error (Upload)
   → Axios catches error
   → Upload progress hidden
   → Error logged to Sentry
   → User sees error notification

4. Server Validation Error
   → Backend returns 400
   → Mutation onError triggered
   → User sees specific error message

5. Insufficient Permissions
   → Backend returns 403
   → User redirected or shown message

6. Image Processing Error
   → Canvas operation fails
   → Error caught in try/catch
   → User sees "Processing failed" message
   → Original image preserved
```

## Performance Optimizations

### 1. Lazy Loading
```typescript
// EditProfileModal only loads when needed
{showEditModal && (
  <Suspense fallback={null}>
    <EditProfileModalWrapper />
  </Suspense>
)}
```

### 2. Memory Management
```typescript
// Cleanup preview URLs
useEffect(() => {
  return () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
  };
}, [imagePreviewUrl]);
```

### 3. Upload Progress
```typescript
// Axios progress tracking
axios.post(url, formData, {
  onUploadProgress: (progressEvent) => {
    const percentage = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    setUploadProgress({ percentage });
  }
});
```

### 4. Cache Invalidation
```typescript
// Only invalidate relevant queries
queryClient.invalidateQueries(['profile', username]);
queryClient.invalidateQueries(['currentUser']);
```

## Accessibility Features

```
┌─────────────────────────────────────────────────────────────┐
│                   Accessibility (a11y)                       │
└─────────────────────────────────────────────────────────────┘

1. Keyboard Navigation
   - Tab through buttons
   - Enter/Space to activate
   - Escape to close modal

2. ARIA Labels
   aria-label="Close modal"
   aria-label="Upload avatar"
   aria-label="Dismiss error"

3. Focus Management
   - Focus trap in modal
   - Return focus on close
   - Visible focus indicators

4. Screen Reader Support
   - Descriptive button text
   - Progress announcements
   - Error announcements
   - Status updates

5. Color Contrast
   - WCAG AA compliance
   - Dark mode support
   - Error colors (red)
   - Success colors (green)
```

## Testing Strategy

```
Unit Tests (Vitest)
├── ImageUploadButton
│   ├── Renders correctly
│   ├── Validates file type
│   ├── Validates file size
│   ├── Shows error messages
│   ├── Calls onImageSelect
│   └── Shows loading state
│
Integration Tests (React Testing Library)
├── AvatarUpload
│   ├── Upload flow
│   ├── Delete flow
│   ├── Error handling
│   └── Progress display
│
E2E Tests (Playwright)
└── Complete Upload Flow
    ├── Select image
    ├── Crop image
    ├── Upload image
    ├── Verify display
    └── Delete image
```

## Browser APIs Used

```typescript
// File API
const file = input.files[0];

// URL API
const url = URL.createObjectURL(file);
URL.revokeObjectURL(url);

// Canvas API
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.drawImage(image, x, y, width, height);
const imageData = ctx.getImageData(x, y, width, height);

// Blob API
canvas.toBlob(blob => {
  // Upload blob
}, 'image/jpeg', 0.9);

// FormData API
const formData = new FormData();
formData.append('avatar', file);
```

## Security Considerations

1. **Client validation is not security** - Backend must validate
2. **Preview URLs are temporary** - Cleaned up properly
3. **CORS headers** - Required for cross-origin uploads
4. **File size limits** - Prevents DoS attacks
5. **Content-Type validation** - Prevents file type spoofing
6. **Image processing** - Strips EXIF data (server-side)

---

**Last Updated:** November 4, 2025
**Architecture Version:** 1.0
**Status:** Implemented and tested
