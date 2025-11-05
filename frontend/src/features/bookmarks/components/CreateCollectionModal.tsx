import React, { useState } from 'react';
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
import { useCreateCollection } from '../hooks/useCollections';

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({ open, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');

  const createCollection = useCreateCollection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    if (name.length < 3 || name.length > 50) {
      setError('Collection name must be between 3 and 50 characters');
      return;
    }

    try {
      await createCollection.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      handleClose();
    } catch (err) {
      setError('Failed to create collection. Please try again.');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPublic(false);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Collection</DialogTitle>
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
            placeholder="e.g., AI Research, Reading List"
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
            disabled={createCollection.isPending || !name.trim()}
          >
            {createCollection.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
