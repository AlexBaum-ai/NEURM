import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { useUpdateCollection } from '../hooks/useCollections';
import type { BookmarkCollection } from '../types';

interface EditCollectionModalProps {
  open: boolean;
  collection: BookmarkCollection | null;
  onClose: () => void;
}

export const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  open,
  collection,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');

  const updateCollection = useUpdateCollection();

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || '');
      setIsPublic(collection.isPublic);
    }
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!collection) return;

    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    if (name.length < 3 || name.length > 50) {
      setError('Collection name must be between 3 and 50 characters');
      return;
    }

    try {
      await updateCollection.mutateAsync({
        id: collection.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          isPublic,
        },
      });
      handleClose();
    } catch (err) {
      setError('Failed to update collection. Please try again.');
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!collection) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Collection</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Collection Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            margin="normal"
            inputProps={{ maxLength: 50 }}
            helperText={`${name.length}/50 characters`}
          />

          <TextField
            fullWidth
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this collection"
            multiline
            rows={3}
            margin="normal"
            inputProps={{ maxLength: 200 }}
            helperText={`${description.length}/200 characters`}
          />

          <FormControlLabel
            control={
              <Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            }
            label="Make this collection public"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateCollection.isPending || !name.trim()}
          >
            {updateCollection.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
