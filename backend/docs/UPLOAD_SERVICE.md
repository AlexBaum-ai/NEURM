# File Upload Service

## Overview

The file upload service provides secure image upload functionality for user avatars and cover images. It includes:

- Multi-size image generation (thumbnails, responsive sizes)
- Image optimization (WebP conversion, compression)
- S3/CloudFlare R2 storage integration
- Automatic cleanup of old images
- Rate limiting (5 uploads per hour per user)
- File type and size validation

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Routes     │────▶│  Controller  │────▶│    Upload    │
│              │     │              │     │   Service    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                            ┌─────────────────────┼─────────────────────┐
                            ▼                     ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                     │    Image     │     │   Storage    │     │     User     │
                     │   Service    │     │   Service    │     │  Repository  │
                     └──────────────┘     └──────────────┘     └──────────────┘
                            │                     │
                            ▼                     ▼
                       ┌────────┐          ┌─────────┐
                       │ Sharp  │          │   S3    │
                       └────────┘          └─────────┘
```

## Endpoints

### Upload Avatar

**Endpoint**: `POST /api/v1/users/me/avatar`

**Authentication**: Required (JWT)

**Rate Limit**: 5 uploads per hour

**Request**:
```http
POST /api/v1/users/me/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: <image file>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.example.com/avatar/user-123/large-123456.webp",
    "sizes": {
      "thumbnail": "https://cdn.example.com/avatar/user-123/thumbnail-123456.webp",
      "small": "https://cdn.example.com/avatar/user-123/small-123456.webp",
      "medium": "https://cdn.example.com/avatar/user-123/medium-123456.webp",
      "large": "https://cdn.example.com/avatar/user-123/large-123456.webp"
    }
  },
  "message": "Avatar uploaded successfully"
}
```

**Avatar Sizes**:
- Thumbnail: 32x32px (80% quality)
- Small: 64x64px (80% quality)
- Medium: 128x128px (85% quality)
- Large: 256x256px (90% quality)

**Validation**:
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 5MB
- **Output Format**: WebP (for optimization)

### Upload Cover Image

**Endpoint**: `POST /api/v1/users/me/cover`

**Authentication**: Required (JWT)

**Rate Limit**: 5 uploads per hour

**Request**:
```http
POST /api/v1/users/me/cover
Authorization: Bearer <token>
Content-Type: multipart/form-data

cover: <image file>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "coverImageUrl": "https://cdn.example.com/cover/user-123/large-123456.webp",
    "sizes": {
      "small": "https://cdn.example.com/cover/user-123/small-123456.webp",
      "medium": "https://cdn.example.com/cover/user-123/medium-123456.webp",
      "large": "https://cdn.example.com/cover/user-123/large-123456.webp"
    }
  },
  "message": "Cover image uploaded successfully"
}
```

**Cover Sizes**:
- Small: 640x320px (80% quality)
- Medium: 1280x640px (85% quality)
- Large: 1920x960px (90% quality)

**Validation**:
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 10MB
- **Output Format**: WebP (for optimization)

## Error Responses

### 400 Bad Request - No File Uploaded
```json
{
  "success": false,
  "error": "No file uploaded"
}
```

### 400 Bad Request - Invalid File Type
```json
{
  "success": false,
  "error": "Invalid file type. Only image/jpeg, image/png, image/webp are allowed."
}
```

### 413 Payload Too Large
```json
{
  "success": false,
  "error": "File too large. Maximum size is 5MB for avatars, 10MB for covers."
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many file uploads. Please try again later.",
  "message": "You have exceeded the upload limit of 5 uploads per hour.",
  "retryAfter": 3600
}
```

## Configuration

### Environment Variables

```env
# AWS S3 / CloudFlare R2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=neurmatic-media
AWS_REGION=eu-west-1

# Optional: CDN URL for faster delivery
CDN_URL=https://cdn.neurmatic.com

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379
```

### Upload Limits

Configured in `/backend/src/config/upload.ts`:

```typescript
export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  COVER: 10 * 1024 * 1024, // 10MB
};

export const UPLOAD_RATE_LIMIT = {
  MAX_UPLOADS: 5,
  WINDOW_HOURS: 1,
};
```

### Image Sizes

```typescript
export const IMAGE_SIZES = {
  AVATAR: {
    THUMBNAIL: { width: 32, height: 32 },
    SMALL: { width: 64, height: 64 },
    MEDIUM: { width: 128, height: 128 },
    LARGE: { width: 256, height: 256 },
  },
  COVER: {
    SMALL: { width: 640, height: 320 },
    MEDIUM: { width: 1280, height: 640 },
    LARGE: { width: 1920, height: 960 },
  },
};
```

## Services

### UploadService

Main service orchestrating the upload flow.

**Methods**:
- `uploadAvatar(userId: string, buffer: Buffer)`: Upload and process avatar
- `uploadCover(userId: string, buffer: Buffer)`: Upload and process cover image

### ImageService

Handles image processing with Sharp.

**Methods**:
- `processImage(buffer, width, height, quality)`: Resize and optimize image
- `generateAvatarSizes(buffer)`: Generate all avatar sizes
- `generateCoverSizes(buffer)`: Generate all cover sizes
- `validateImage(buffer)`: Validate image metadata
- `extractDominantColor(buffer)`: Get dominant color (for UI theming)

### StorageService

Handles S3/R2 storage operations.

**Methods**:
- `uploadFile(buffer, key, contentType, metadata)`: Upload to S3/R2
- `deleteFile(key)`: Delete single file
- `deleteFiles(keys)`: Delete multiple files
- `fileExists(key)`: Check if file exists
- `getPublicUrl(key)`: Generate public CDN URL
- `extractKeyFromUrl(url)`: Extract S3 key from URL

## Usage Examples

### Frontend - Upload Avatar

```typescript
async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/v1/users/me/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  return result.data; // { avatarUrl, sizes }
}
```

### Frontend - Upload Cover Image

```typescript
async function uploadCover(file: File) {
  const formData = new FormData();
  formData.append('cover', file);

  const response = await fetch('/api/v1/users/me/cover', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  return result.data; // { coverImageUrl, sizes }
}
```

### Frontend - Display Responsive Images

```tsx
function UserAvatar({ sizes, alt }: { sizes: AvatarSizes; alt: string }) {
  return (
    <img
      src={sizes.large}
      srcSet={`
        ${sizes.thumbnail} 32w,
        ${sizes.small} 64w,
        ${sizes.medium} 128w,
        ${sizes.large} 256w
      `}
      sizes="(max-width: 768px) 64px, 128px"
      alt={alt}
      loading="lazy"
    />
  );
}
```

## Security Considerations

1. **Authentication Required**: All upload endpoints require JWT authentication
2. **Rate Limiting**: 5 uploads per hour per user (tracked by Redis)
3. **File Type Validation**: Only JPEG, PNG, WebP allowed
4. **File Size Limits**: 5MB for avatars, 10MB for covers
5. **Virus Scanning**: Consider adding ClamAV for production
6. **Image Processing**: Sharp library prevents malicious image exploits
7. **S3 Bucket Policy**: Configure proper CORS and access policies

## Storage Structure

### S3/R2 Directory Structure

```
neurmatic-media/
├── avatar/
│   └── user-123/
│       ├── thumbnail-1699564800000-abc123.webp
│       ├── small-1699564800000-abc123.webp
│       ├── medium-1699564800000-abc123.webp
│       └── large-1699564800000-abc123.webp
└── cover/
    └── user-123/
        ├── small-1699564800000-xyz789.webp
        ├── medium-1699564800000-xyz789.webp
        └── large-1699564800000-xyz789.webp
```

### Filename Format

`{type}/{userId}/{size}-{timestamp}-{random}.webp`

- **type**: `avatar` or `cover`
- **userId**: User UUID
- **size**: `thumbnail`, `small`, `medium`, `large`
- **timestamp**: Unix timestamp in milliseconds
- **random**: Random string for uniqueness

## Performance Optimizations

1. **WebP Format**: 25-35% smaller than JPEG at same quality
2. **Responsive Sizes**: Frontend loads appropriate size for viewport
3. **CDN Delivery**: CloudFlare CDN for global distribution
4. **Lazy Loading**: Images loaded only when needed
5. **Cache Headers**: 1-year cache for immutable images
6. **Parallel Uploads**: All sizes uploaded concurrently
7. **Async Cleanup**: Old images deleted asynchronously

## Monitoring

### Sentry Error Tracking

All upload operations are instrumented with Sentry:

```typescript
Sentry.captureException(error, {
  tags: { service: 'UploadService', method: 'uploadAvatar' },
  extra: { userId, fileSize, mimetype },
});
```

### Logging

Structured logging with Winston:

```typescript
logger.info(`Uploading avatar for user ${userId}`, {
  userId,
  filename: file.originalname,
  size: file.size,
  mimetype: file.mimetype,
});
```

## Testing

### Unit Tests

```bash
npm test src/services/__tests__/upload.service.test.ts
```

### Integration Tests

```bash
npm test src/modules/users/__tests__/upload.integration.test.ts
```

## Troubleshooting

### Images Not Displaying

1. Check S3/R2 bucket CORS policy
2. Verify CDN_URL environment variable
3. Check image URLs in database
4. Verify AWS credentials

### Upload Fails

1. Check file size limits
2. Verify Redis connection for rate limiting
3. Check Sharp library installation
4. Verify S3/R2 credentials and permissions

### Rate Limit Issues

1. Check Redis connection
2. Verify rate limit configuration
3. Check user authentication
4. Review rate limit logs

## Future Enhancements

1. **Image Cropping**: Allow users to crop images before upload
2. **Virus Scanning**: Integrate ClamAV for security
3. **Video Support**: Support for profile videos
4. **Animated Avatars**: Support for GIF/WebP animations
5. **AI Processing**: Auto-crop, background removal
6. **Watermarking**: Optional watermarks for cover images
7. **Batch Upload**: Upload multiple images at once
8. **Image Gallery**: Store multiple profile images

## References

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [AWS S3 SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [WebP Format](https://developers.google.com/speed/webp)
