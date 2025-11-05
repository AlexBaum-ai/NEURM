# Media Library Feature

Complete media management system with drag-drop upload, folder organization, and image selection.

## Quick Start

### Install Dependencies
```bash
npm install  # react-dropzone is already included
```

### Access Media Library
Navigate to: `/admin/media`

## Components

### 1. MediaLibrary
Full media management interface for admin use.

```tsx
import MediaLibrary from '@/features/media/components/MediaLibrary';

function AdminPage() {
  return <MediaLibrary />;
}
```

**Features:**
- Grid/list view toggle
- Folder navigation
- Search and filter
- Bulk operations
- Upload files
- Edit metadata

### 2. MediaPicker
Modal for selecting media in article editor or forms.

```tsx
import { MediaPicker } from '@/features/media';
import { useState } from 'react';

function ArticleEditor() {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectMedia = (files: MediaFile[]) => {
    files.forEach(file => {
      // Insert image into editor
      console.log('Selected:', file.cdnUrl);
    });
  };

  return (
    <>
      <button onClick={() => setShowPicker(true)}>
        Insert Image
      </button>

      <MediaPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        multiple={true}
        maxFiles={5}
        accept={['image/*']}
        onSelect={handleSelectMedia}
      />
    </>
  );
}
```

**Props:**
- `isOpen: boolean` - Show/hide modal
- `onClose: () => void` - Close handler
- `multiple?: boolean` - Allow multiple selection (default: false)
- `maxFiles?: number` - Max files to select (default: 1)
- `accept?: string[]` - File type filter (e.g., `['image/*']`)
- `onSelect: (files: MediaFile[]) => void` - Selection handler

### 3. MediaUploader
Standalone drag-drop upload component.

```tsx
import { MediaUploader } from '@/features/media';

function CustomUploadForm() {
  return (
    <MediaUploader
      folderId="folder-uuid"
      onUploadComplete={() => console.log('Done!')}
      maxFiles={10}
      maxFileSize={10 * 1024 * 1024} // 10MB
    />
  );
}
```

**Props:**
- `folderId?: string` - Upload to specific folder
- `onUploadComplete?: () => void` - Success callback
- `maxFiles?: number` - Max files per upload (default: 10)
- `maxFileSize?: number` - Max bytes per file (default: 10MB)
- `accept?: Record<string, string[]>` - File types

### 4. FolderTree
Folder navigation sidebar.

```tsx
import { FolderTree } from '@/features/media';
import { useState } from 'react';

function MediaBrowser() {
  const [selectedFolder, setSelectedFolder] = useState<string>();

  return (
    <FolderTree
      selectedFolderId={selectedFolder}
      onSelectFolder={setSelectedFolder}
    />
  );
}
```

## Hooks

### useMediaList
Fetch paginated media list.

```tsx
import { useMediaList } from '@/features/media';

function MediaGallery() {
  const { data, isLoading } = useMediaList({
    page: 1,
    limit: 24,
    folderId: 'folder-uuid',
    search: 'sunset',
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  return (
    <div>
      {data?.data.map(media => (
        <img key={media.id} src={media.thumbnailUrl} />
      ))}
    </div>
  );
}
```

### useUploadMedia
Upload files with progress tracking.

```tsx
import { useUploadMedia } from '@/features/media';

function UploadForm() {
  const { mutate: upload, uploadProgress } = useUploadMedia();

  const handleFiles = (files: File[]) => {
    upload({ files, folderId: 'optional-folder-id' });
  };

  return (
    <div>
      {uploadProgress.map(progress => (
        <div key={progress.filename}>
          {progress.filename}: {progress.progress}%
        </div>
      ))}
    </div>
  );
}
```

### Other Hooks
- `useMediaItem(id)` - Fetch single media
- `useSearchMedia(query)` - Search media
- `useFolders()` - Get all folders
- `useFolderTree()` - Get folder tree
- `useUpdateMedia()` - Update metadata
- `useDeleteMedia()` - Delete single media
- `useBulkDeleteMedia()` - Delete multiple
- `useMoveMedia()` - Move to folder
- `useCreateFolder()` - Create folder
- `useUpdateFolder()` - Rename folder
- `useDeleteFolder()` - Delete folder

## Types

```typescript
interface MediaFile {
  id: string;
  filename: string;
  originalFilename: string;
  path: string;
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  folderId?: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  createdAt: string;
  children?: MediaFolder[];
  mediaCount?: number;
}
```

## Integration Examples

### Tiptap Editor Integration

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { MediaPicker } from '@/features/media';
import { useState } from 'react';

function TiptapArticleEditor() {
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '<p>Start writing...</p>',
  });

  const handleInsertImage = (files: MediaFile[]) => {
    files.forEach(file => {
      editor
        ?.chain()
        .focus()
        .setImage({
          src: file.cdnUrl || file.url,
          alt: file.altText || file.filename,
        })
        .run();
    });
  };

  return (
    <div>
      <div className="toolbar">
        <button onClick={() => setShowMediaPicker(true)}>
          📷 Insert Image
        </button>
      </div>

      <EditorContent editor={editor} />

      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        multiple={true}
        maxFiles={10}
        accept={['image/*']}
        onSelect={handleInsertImage}
      />
    </div>
  );
}
```

### React Hook Form Integration

```tsx
import { useForm } from 'react-hook-form';
import { MediaPicker } from '@/features/media';
import { useState } from 'react';

interface FormData {
  title: string;
  featuredImage?: string;
}

function ArticleForm() {
  const [showPicker, setShowPicker] = useState(false);
  const { register, setValue, watch } = useForm<FormData>();
  const featuredImage = watch('featuredImage');

  const handleSelectImage = (files: MediaFile[]) => {
    if (files[0]) {
      setValue('featuredImage', files[0].cdnUrl || files[0].url);
    }
  };

  return (
    <form>
      <input {...register('title')} placeholder="Title" />

      <div>
        <label>Featured Image</label>
        {featuredImage && <img src={featuredImage} alt="Featured" />}
        <button type="button" onClick={() => setShowPicker(true)}>
          Select Image
        </button>
      </div>

      <MediaPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        multiple={false}
        accept={['image/*']}
        onSelect={handleSelectImage}
      />
    </form>
  );
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/media/upload` | Upload files |
| GET | `/api/v1/media` | List media (paginated) |
| GET | `/api/v1/media/:id` | Get single media |
| PUT | `/api/v1/media/:id` | Update metadata |
| DELETE | `/api/v1/media/:id` | Delete media |
| POST | `/api/v1/media/bulk-delete` | Delete multiple |
| POST | `/api/v1/media/bulk-move` | Move multiple |
| POST | `/api/v1/media/folders` | Create folder |
| GET | `/api/v1/media/folders` | List folders |
| GET | `/api/v1/media/folders/tree` | Folder tree |
| PUT | `/api/v1/media/folders/:id` | Rename folder |
| DELETE | `/api/v1/media/folders/:id` | Delete folder |

## Styling

All components support dark mode and use TailwindCSS.

### Customization Example

```tsx
import { MediaCard } from '@/features/media';

function CustomGallery() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {media.map(item => (
        <MediaCard
          key={item.id}
          media={item}
          className="hover:shadow-2xl" // Custom styles
        />
      ))}
    </div>
  );
}
```

## Accessibility

- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Focus management
- ✅ Screen reader support
- ✅ Alt text for images

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance

- Image lazy loading
- Pagination (24 per page)
- Debounced search (500ms)
- Query caching
- Optimistic updates

## Troubleshooting

### Images not displaying
1. Check CDN URL configuration
2. Verify CORS headers
3. Check network tab for 404s

### Upload failing
1. Check file size (max 10MB default)
2. Verify file type is allowed
3. Check API endpoint is accessible
4. Verify authentication token

### Folder tree not loading
1. Check API response format
2. Verify backend returns nested structure
3. Check browser console for errors

## Contributing

When adding new features:
1. Add types to `media.types.ts`
2. Add API calls to `mediaApi.ts`
3. Create React Query hook in `useMedia.ts`
4. Build UI component
5. Update this README

## License

Part of Neurmatic project.
