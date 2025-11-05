import React, { Suspense } from 'react';
import {
  Box,
  List,
  Typography,
  Button,
  Paper,
  Skeleton,
  Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { CollectionItem } from './CollectionItem';
import { useCollections } from '../hooks/useCollections';
import type { BookmarkCollection } from '../types';

interface CollectionSidebarProps {
  selectedCollectionId?: string;
  onCollectionSelect: (collectionId?: string) => void;
  onCreateCollection: () => void;
  onEditCollection: (collection: BookmarkCollection) => void;
  onDeleteCollection: (collection: BookmarkCollection) => void;
}

const CollectionListContent: React.FC<CollectionSidebarProps> = ({
  selectedCollectionId,
  onCollectionSelect,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
}) => {
  const { data } = useCollections();
  const collections = data.data.collections;

  // Calculate total bookmarks across all collections
  const totalBookmarks = collections.reduce((sum, col) => sum + col.bookmarkCount, 0);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Collections
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={onCreateCollection}
          size="small"
        >
          New Collection
        </Button>
      </Box>

      {collections.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No collections yet. Create your first collection to organize bookmarks.
        </Alert>
      ) : (
        <>
          <List dense>
            {/* All bookmarks item */}
            <CollectionItem
              collection={{
                id: 'all',
                name: 'All Bookmarks',
                isDefault: false,
                isPublic: false,
                bookmarkCount: totalBookmarks,
                createdAt: '',
              }}
              isActive={!selectedCollectionId}
              onClick={() => onCollectionSelect(undefined)}
              onEdit={() => {}}
              onDelete={() => {}}
            />

            {/* User collections */}
            {collections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isActive={selectedCollectionId === collection.id}
                onClick={() => onCollectionSelect(collection.id)}
                onEdit={onEditCollection}
                onDelete={onDeleteCollection}
              />
            ))}
          </List>

          {/* Warning for approaching limit */}
          {totalBookmarks >= 450 && (
            <Alert severity="warning" sx={{ mt: 2, fontSize: '0.75rem' }}>
              You have {totalBookmarks} bookmarks. Maximum is 500.
            </Alert>
          )}
        </>
      )}
    </>
  );
};

const CollectionListSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 1 }} />
    <Skeleton variant="rectangular" height={36} sx={{ mb: 1, borderRadius: 1 }} />
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
    ))}
  </Box>
);

export const CollectionSidebar: React.FC<CollectionSidebarProps> = (props) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Suspense fallback={<CollectionListSkeleton />}>
        <CollectionListContent {...props} />
      </Suspense>
    </Paper>
  );
};
