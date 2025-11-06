/**
 * MoveTopicModal Component
 * Modal for moving a topic to a different category
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type { ForumCategory, ForumTopic } from '../types';

interface MoveTopicModalProps {
  open: boolean;
  topic: ForumTopic;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MoveTopicModal: React.FC<MoveTopicModalProps> = ({
  open,
  topic,
  onClose,
  onSuccess,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(topic.categoryId);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: forumApi.getCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Move topic mutation
  const moveMutation = useMutation({
    mutationFn: (data: { topicId: string; categoryId: string; reason?: string }) =>
      forumApi.moveTopic(data.topicId, data.categoryId, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic', topic.id] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-logs'] });
      onSuccess?.();
      handleClose();
    },
  });

  const handleClose = () => {
    setSelectedCategoryId(topic.categoryId);
    setReason('');
    moveMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (selectedCategoryId === topic.categoryId) {
      return;
    }

    moveMutation.mutate({
      topicId: topic.id,
      categoryId: selectedCategoryId,
      reason: reason.trim() || undefined,
    });
  };

  // Flatten categories for select dropdown
  const flattenCategories = (
    categories: ForumCategory[],
    level = 0
  ): Array<{ category: ForumCategory; level: number }> => {
    const result: Array<{ category: ForumCategory; level: number }> = [];

    categories.forEach((cat) => {
      result.push({ category: cat, level });
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, level + 1));
      }
    });

    return result;
  };

  const categories = categoriesData?.categories || [];
  const flatCategories = flattenCategories(categories);

  const ___selectedCategory = flatCategories.find((c) => c.category.id === selectedCategoryId);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="move-topic-dialog-title"
    >
      <DialogTitle id="move-topic-dialog-title">Move Topic to Different Category</DialogTitle>

      <DialogContent>
        {moveMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to move topic. Please try again.
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Topic: <strong>{topic.title}</strong>
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Current category: <strong>{topic.category.name}</strong>
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="category-select-label">New Category</InputLabel>
          <Select
            labelId="category-select-label"
            id="category-select"
            value={selectedCategoryId}
            label="New Category"
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            disabled={loadingCategories || moveMutation.isPending}
          >
            {loadingCategories ? (
              <MenuItem disabled>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <span>Loading categories...</span>
                </Box>
              </MenuItem>
            ) : (
              flatCategories.map(({ category, level }) => (
                <MenuItem
                  key={category.id}
                  value={category.id}
                  disabled={category.id === topic.categoryId}
                  sx={{ pl: 2 + level * 2 }}
                >
                  {level > 0 && '↳ '}
                  {category.name}
                  {category.id === topic.categoryId && ' (current)'}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <TextField
          label="Reason (optional)"
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this topic is being moved..."
          disabled={moveMutation.isPending}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={moveMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            moveMutation.isPending ||
            loadingCategories ||
            selectedCategoryId === topic.categoryId
          }
          startIcon={moveMutation.isPending && <CircularProgress size={16} />}
        >
          {moveMutation.isPending ? 'Moving...' : 'Move Topic'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveTopicModal;
