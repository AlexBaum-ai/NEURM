import React, { Suspense } from 'react';
import { Box, Typography, Skeleton, Alert } from '@mui/material';
import { BookmarkBorder } from '@mui/icons-material';
import { BookmarkCard } from './BookmarkCard';
import { useBookmarks, useRemoveBookmark, useUpdateBookmark } from '../hooks/useBookmarks';
import { useCollections } from '../hooks/useCollections';
import type { BookmarkCollection } from '../types';

interface BookmarkListProps {
  collectionId?: string;
}

const BookmarkListContent: React.FC<BookmarkListProps> = ({ collectionId }) => {
  const { bookmarks, totalBookmarks } = useBookmarks(collectionId);
  const { data: collectionsData } = useCollections();
  const removeBookmark = useRemoveBookmark();
  const updateBookmark = useUpdateBookmark();

  const collections = collectionsData.data.collections;

  const handleRemove = (slug: string) => {
    if (window.confirm('Are you sure you want to remove this bookmark?')) {
      removeBookmark.mutate(slug);
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    updateBookmark.mutate({ id, data: { notes } });
  };

  const handleMoveToCollection = (id: string, collectionId: string) => {
    updateBookmark.mutate({ id, data: { collectionId } });
  };

  if (bookmarks.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
        }}
      >
        <BookmarkBorder sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No bookmarks yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start bookmarking articles to read them later
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {totalBookmarks} {totalBookmarks === 1 ? 'bookmark' : 'bookmarks'}
      </Typography>

      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          collections={collections}
          onRemove={handleRemove}
          onUpdateNotes={handleUpdateNotes}
          onMoveToCollection={handleMoveToCollection}
        />
      ))}
    </Box>
  );
};

const BookmarkListSkeleton: React.FC = () => (
  <Box>
    {[...Array(3)].map((_, i) => (
      <Box key={i} sx={{ mb: 2 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Box>
    ))}
  </Box>
);

export const BookmarkList: React.FC<BookmarkListProps> = (props) => {
  return (
    <Suspense fallback={<BookmarkListSkeleton />}>
      <BookmarkListContent {...props} />
    </Suspense>
  );
};
