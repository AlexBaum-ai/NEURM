import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Search, Warning } from '@mui/icons-material';
import { CollectionSidebar } from '../components/CollectionSidebar';
import { BookmarkList } from '../components/BookmarkList';
import { CreateCollectionModal } from '../components/CreateCollectionModal';
import { EditCollectionModal } from '../components/EditCollectionModal';
import { useCollections, useDeleteCollection } from '../hooks/useCollections';
import type { BookmarkCollection } from '../types';

export const BookmarksPage: React.FC = () => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<BookmarkCollection | null>(null);

  const deleteCollection = useDeleteCollection();

  const handleCollectionSelect = (collectionId?: string) => {
    setSelectedCollectionId(collectionId);
  };

  const handleCreateCollection = () => {
    setCreateModalOpen(true);
  };

  const handleEditCollection = (collection: BookmarkCollection) => {
    setSelectedCollection(collection);
    setEditModalOpen(true);
  };

  const handleDeleteCollection = (collection: BookmarkCollection) => {
    if (collection.isDefault) {
      alert('Cannot delete the default collection');
      return;
    }
    setSelectedCollection(collection);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCollection = async () => {
    if (!selectedCollection) return;

    try {
      await deleteCollection.mutateAsync(selectedCollection.id);
      setDeleteDialogOpen(false);
      setSelectedCollection(null);
      // If we deleted the currently selected collection, reset to all bookmarks
      if (selectedCollectionId === selectedCollection.id) {
        setSelectedCollectionId(undefined);
      }
    } catch (error) {
      alert('Failed to delete collection. Please try again.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 3, pb: 6 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
          My Bookmarks
        </Typography>

        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <CollectionSidebar
              selectedCollectionId={selectedCollectionId}
              onCollectionSelect={handleCollectionSelect}
              onCreateCollection={handleCreateCollection}
              onEditCollection={handleEditCollection}
              onDeleteCollection={handleDeleteCollection}
            />
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <BookmarkList collectionId={selectedCollectionId} />
          </Grid>
        </Grid>
      </Container>

      {/* Create Collection Modal */}
      <CreateCollectionModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      {/* Edit Collection Modal */}
      <EditCollectionModal
        open={editModalOpen}
        collection={selectedCollection}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCollection(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Collection?</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
            <Warning color="warning" />
            <Typography>
              Are you sure you want to delete the collection "{selectedCollection?.name}"?
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Bookmarks in this collection will be moved to your default "Read Later" collection.
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteCollection}
            color="error"
            variant="contained"
            disabled={deleteCollection.isPending}
          >
            {deleteCollection.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
