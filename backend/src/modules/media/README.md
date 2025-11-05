# Media Library API Documentation

## Overview

The Media Library API provides comprehensive media management functionality including file uploads, folder organization, automatic thumbnail generation, CDN integration, and usage tracking.

**Module Status**: ✅ **COMPLETE** (SPRINT-3-001)

---

## Features

✅ **File Upload**: Supports images, videos, and documents (max 10MB)
✅ **Automatic Thumbnail Generation**: 3 sizes (sm: 150x150, md: 300x300, lg: 600x600)
✅ **CDN Integration**: Cloudflare/CloudFront support
✅ **Paginated Media Library**: Search and filter capabilities
✅ **Folder Organization**: Create, rename, delete folders with hierarchy
✅ **Image Metadata**: Dimensions, size, format, alt text
✅ **Search**: By filename, tags, folder
✅ **Bulk Operations**: Move and delete multiple files
✅ **Usage Tracking**: Track which articles/entities use which images
✅ **Image Optimization**: Automatic compression and format conversion

---

## API Endpoints

### Media Management

#### 1. Upload Media File

**Endpoint**: `POST /api/v1/media/upload`

**Authentication**: Required

**Request**:
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file` (file, required): Media file to upload (max 10MB)
  - `folderId` (string, optional): Target folder ID
  - `altText` (string, optional): Alt text for accessibility
  - `caption` (string, optional): Media caption
  - `tags` (array, optional): Array of tags

**Supported File Types**:
- Images: JPEG, PNG, WebP, GIF
- Videos: MP4, WebM, MOV
- Documents: PDF, DOC, DOCX

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "example-abc123.jpg",
    "originalFilename": "example.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 2048576,
    "fileType": "image",
    "url": "https://vps-1a707765.vps.ovh.net/uploads/media/image/2024/11/example-abc123.jpg",
    "cdnUrl": "https://cdn.example.com/media/image/2024/11/example-abc123.jpg",
    "width": 1920,
    "height": 1080,
    "altText": "Example image",
    "caption": "This is an example",
    "tags": ["example", "test"],
    "uploadedById": "user-uuid",
    "createdAt": "2024-11-05T10:30:00Z",
    "thumbnails": [
      {
        "size": "sm",
        "url": "...",
        "width": 150,
        "height": 150
      },
      {
        "size": "md",
        "url": "...",
        "width": 300,
        "height": 300
      },
      {
        "size": "lg",
        "url": "...",
        "width": 600,
        "height": 600
      }
    ]
  },
  "message": "Media file uploaded successfully"
}
```

**Example cURL**:
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "altText=Example image" \
  -F "tags[]=example" \
  -F "tags[]=test"
```

---

#### 2. Get Media Files List

**Endpoint**: `GET /api/v1/media`

**Authentication**: Required

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `folderId` (string, optional): Filter by folder
- `search` (string, optional): Search by filename, alt text, or tags
- `fileType` (enum, optional): `image`, `video`, `document`, `audio`, `other`
- `sortBy` (enum, default: `createdAt`): `createdAt`, `filename`, `fileSize`, `fileType`
- `sortOrder` (enum, default: `desc`): `asc`, `desc`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "filename": "example-abc123.jpg",
      "originalFilename": "example.jpg",
      "url": "https://...",
      "cdnUrl": "https://...",
      "fileType": "image",
      "fileSize": 2048576,
      "width": 1920,
      "height": 1080,
      "folder": {
        "id": "folder-uuid",
        "name": "Photos"
      },
      "thumbnails": [...],
      "createdAt": "2024-11-05T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Example cURL**:
```bash
curl -X GET "http://vps-1a707765.vps.ovh.net:3000/api/v1/media?page=1&limit=20&fileType=image&search=example" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### 3. Get Media File by ID

**Endpoint**: `GET /api/v1/media/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "example-abc123.jpg",
    "originalFilename": "example.jpg",
    "url": "https://...",
    "cdnUrl": "https://...",
    "fileType": "image",
    "fileSize": 2048576,
    "width": 1920,
    "height": 1080,
    "altText": "Example image",
    "caption": "This is an example",
    "tags": ["example", "test"],
    "folder": {...},
    "uploader": {
      "id": "user-uuid",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "thumbnails": [...],
    "usage": [
      {
        "entityType": "article",
        "entityId": "article-uuid",
        "fieldName": "featuredImage"
      }
    ],
    "createdAt": "2024-11-05T10:30:00Z"
  }
}
```

---

#### 4. Update Media File

**Endpoint**: `PUT /api/v1/media/:id`

**Authentication**: Required

**Request Body**:
```json
{
  "folderId": "new-folder-uuid",
  "altText": "Updated alt text",
  "caption": "Updated caption",
  "tags": ["updated", "tags"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": { /* Updated media object */ },
  "message": "Media file updated successfully"
}
```

---

#### 5. Delete Media File

**Endpoint**: `DELETE /api/v1/media/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Media file deleted successfully"
}
```

**Note**: Deletes file from storage (S3/local) and all thumbnails

---

#### 6. Bulk Delete Media Files

**Endpoint**: `POST /api/v1/media/bulk-delete`

**Authentication**: Required

**Request Body**:
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deletedCount": 3
  },
  "message": "3 media file(s) deleted successfully"
}
```

---

#### 7. Bulk Move Media Files

**Endpoint**: `POST /api/v1/media/bulk-move`

**Authentication**: Required

**Request Body**:
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "targetFolderId": "folder-uuid"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "movedCount": 3
  },
  "message": "3 media file(s) moved successfully"
}
```

---

### Folder Management

#### 8. Create Folder

**Endpoint**: `POST /api/v1/media/folders`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "My Photos",
  "description": "Personal photo collection",
  "parentId": "parent-folder-uuid"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Photos",
    "slug": "my-photos",
    "description": "Personal photo collection",
    "parentId": "parent-folder-uuid",
    "level": 2,
    "fileCount": 0,
    "createdAt": "2024-11-05T10:30:00Z"
  },
  "message": "Folder created successfully"
}
```

---

#### 9. Get Folders List

**Endpoint**: `GET /api/v1/media/folders`

**Authentication**: Required

**Query Parameters**:
- `parentId` (string, optional): Filter by parent folder

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Photos",
      "slug": "photos",
      "level": 1,
      "fileCount": 25,
      "children": [...]
    }
  ]
}
```

---

#### 10. Get Folder Tree

**Endpoint**: `GET /api/v1/media/folders/tree`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Photos",
      "level": 1,
      "children": [
        {
          "id": "child-uuid",
          "name": "Vacation",
          "level": 2,
          "children": []
        }
      ]
    }
  ]
}
```

---

#### 11. Get Folder by ID

**Endpoint**: `GET /api/v1/media/folders/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Photos",
    "slug": "photos",
    "description": "Photo collection",
    "level": 1,
    "fileCount": 25,
    "parent": null,
    "children": [...],
    "files": [...]
  }
}
```

---

#### 12. Update Folder

**Endpoint**: `PUT /api/v1/media/folders/:id`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Updated Folder Name",
  "description": "Updated description",
  "displayOrder": 1
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": { /* Updated folder object */ },
  "message": "Folder updated successfully"
}
```

---

#### 13. Delete Folder

**Endpoint**: `DELETE /api/v1/media/folders/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Folder deleted successfully"
}
```

**Note**: Folder must be empty (no files or subfolders)

---

#### 14. Get Folder Path (Breadcrumb)

**Endpoint**: `GET /api/v1/media/folders/:id/path`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "root-uuid",
      "name": "Media",
      "slug": "media"
    },
    {
      "id": "folder-uuid",
      "name": "Photos",
      "slug": "photos"
    },
    {
      "id": "current-uuid",
      "name": "Vacation",
      "slug": "vacation"
    }
  ]
}
```

---

### Usage Tracking

#### 15. Track Media Usage

**Endpoint**: `POST /api/v1/media/track-usage`

**Authentication**: Required

**Request Body**:
```json
{
  "mediaId": "media-uuid",
  "entityType": "article",
  "entityId": "article-uuid",
  "fieldName": "featuredImage",
  "usageContext": "Featured image for article"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "usage-uuid",
    "mediaId": "media-uuid",
    "entityType": "article",
    "entityId": "article-uuid",
    "fieldName": "featuredImage",
    "createdAt": "2024-11-05T10:30:00Z"
  },
  "message": "Media usage tracked successfully"
}
```

---

#### 16. Get Media Usage

**Endpoint**: `GET /api/v1/media/:id/usage`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "entityType": "article",
      "entityId": "article-uuid",
      "fieldName": "featuredImage",
      "usageContext": "Featured image for article",
      "createdAt": "2024-11-05T10:30:00Z"
    }
  ]
}
```

---

## Configuration

### Storage Configuration

The media library supports two storage providers:

#### 1. Local Storage (Default)

**Environment Variables**:
```env
# No AWS credentials needed for local storage
```

**Configuration** (`unifiedConfig.ts`):
```typescript
storage: {
  provider: 'local',
  local: {
    uploadDir: './uploads',
    baseUrl: 'http://vps-1a707765.vps.ovh.net:3000/uploads'
  }
}
```

#### 2. AWS S3 Storage

**Environment Variables**:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=neurmatic-media
AWS_REGION=eu-west-1
```

**Configuration** (`unifiedConfig.ts`):
```typescript
storage: {
  provider: 's3',
  s3: {
    bucket: 'neurmatic-media',
    region: 'eu-west-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    cdnUrl: 'https://cdn.neurmatic.com' // Optional: CloudFront CDN URL
  }
}
```

---

### CDN Integration

#### Cloudflare CDN

To integrate with Cloudflare CDN:

1. **Set up Cloudflare R2 or CloudFront**:
   - Create a Cloudflare R2 bucket or AWS CloudFront distribution
   - Point it to your S3 bucket

2. **Update Configuration**:
```typescript
storage: {
  provider: 's3',
  s3: {
    // ... other config
    cdnUrl: 'https://your-cdn-domain.cloudflare.com'
  }
}
```

3. **Benefits**:
   - ✅ Global edge caching
   - ✅ Faster image delivery
   - ✅ Reduced S3 bandwidth costs
   - ✅ Automatic image optimization (with Cloudflare Transform)

---

## Image Processing

### Thumbnail Sizes

The system automatically generates 3 thumbnail sizes for all images:

| Size | Dimensions | Use Case |
|------|------------|----------|
| `sm` | 150x150px | List views, avatars |
| `md` | 300x300px | Grid views, previews |
| `lg` | 600x600px | Detail views, lightbox |

### Image Optimization

- **Compression**: JPEG quality 85%, PNG level 9
- **Progressive JPEG**: Enabled for better perceived load time
- **Format Conversion**: Automatic WebP conversion (optional)
- **Metadata Stripping**: Removes EXIF data for privacy

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": "File size exceeds maximum allowed size of 10MB"
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Media file not found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Failed to upload file to storage"
}
```

---

## Testing

### Manual Testing

Use the provided cURL examples or Postman collection.

### Automated Testing

Run the test suite:
```bash
cd backend
npm test -- media
```

---

## Architecture

### Layered Architecture

```
Routes → Controllers → Services → Repositories → Database
                    ↓
              Storage Service
              Image Processor
```

### Key Classes

- **MediaController**: HTTP request handling
- **MediaService**: Business logic
- **MediaRepository**: Database operations
- **StorageService**: File storage (S3/local)
- **ImageProcessor**: Image manipulation (Sharp)
- **FolderController**: Folder management
- **FolderService**: Folder business logic
- **FolderRepository**: Folder database operations

---

## Performance Considerations

1. **File Upload**: Max 10MB per file
2. **Pagination**: Default 20 items, max 100
3. **Thumbnail Generation**: Async, doesn't block response
4. **CDN**: Recommended for production
5. **Caching**: Browser caching enabled for media URLs

---

## Security

1. **Authentication**: JWT required for all endpoints
2. **File Type Validation**: Whitelist approach
3. **Size Limits**: 10MB hard limit
4. **Path Traversal**: Prevention built-in
5. **Metadata Stripping**: EXIF data removed from uploads

---

## Acceptance Criteria Status

✅ **AC1**: POST /api/media/upload accepts images (max 10MB)
✅ **AC2**: Automatic thumbnail generation (3 sizes: sm, md, lg)
✅ **AC3**: CDN integration (Cloudflare) for serving images
✅ **AC4**: GET /api/media returns paginated media library
✅ **AC5**: Folder organization (create, rename, delete folders)
✅ **AC6**: Image metadata stored (dimensions, size, format, alt text)
✅ **AC7**: Search media by filename, tags, folder
✅ **AC8**: Bulk operations (move, delete multiple files)
✅ **AC9**: Usage tracking (which articles use which images)
✅ **AC10**: Image optimization on upload (compression, format conversion)

---

## Future Enhancements

- [ ] Video transcoding
- [ ] Image filters and transformations
- [ ] Batch upload
- [ ] Drag-and-drop UI
- [ ] Image EXIF viewer
- [ ] Duplicate detection
- [ ] AI-powered tagging

---

## Support

For issues or questions:
- Check logs: `backend/logs/`
- Sentry dashboard: [Sentry Dashboard](https://sentry.io)
- Documentation: `projectdoc/`

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
