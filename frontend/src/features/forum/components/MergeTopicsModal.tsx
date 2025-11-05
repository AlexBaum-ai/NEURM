/**
 * MergeTopicsModal Component
 * Modal for merging duplicate topics
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Autocomplete,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { MergeType as MergeIcon } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type { ForumTopic } from '../types';

interface MergeTopicsModalProps {
  open: boolean;
  sourceTopic: ForumTopic;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MergeTopicsModal: React.FC<MergeTopicsModalProps> = ({
  open,
  sourceTopic,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  // Search for topics in the same category
  const { data: topicsData, isLoading: loadingTopics } = useQuery({
    queryKey: ['topics', { categoryId: sourceTopic.categoryId, search: searchQuery }],
    queryFn: () =>
      forumApi.getTopics({
        categoryId: sourceTopic.categoryId,
        search: searchQuery,
        limit: 10,
      }),
    enabled: open && searchQuery.length >= 3,
  });

  // Merge topics mutation
  const mergeMutation = useMutation({
    mutationFn: (data: { sourceTopicId: string; targetTopicId: string; reason?: string }) =>
      forumApi.mergeTopics(data.sourceTopicId, data.targetTopicId, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-logs'] });
      onSuccess?.();
      handleClose();
    },
  });

  const handleClose = () => {
    setSearchQuery('');
    setSelectedTopic(null);
    setReason('');
    mergeMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedTopic) return;

    mergeMutation.mutate({
      sourceTopicId: sourceTopic.id,
      targetTopicId: selectedTopic.id,
      reason: reason.trim() || undefined,
    });
  };

  const topics = topicsData?.topics?.filter((t) => t.id !== sourceTopic.id) || [];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="merge-topics-dialog-title"
    >
      <DialogTitle id="merge-topics-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MergeIcon />
          Merge Duplicate Topics
        </Box>
      </DialogTitle>

      <DialogContent>
        {mergeMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to merge topics. Please try again.
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          This will merge the selected duplicate topic into the target topic. All replies from the
          duplicate will be moved to the target, and the duplicate will be deleted.
        </Alert>

        {/* Source Topic */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Duplicate Topic (will be deleted):
        </Typography>
        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'error.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {sourceTopic.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={sourceTopic.type} size="small" />
              <Chip label={`${sourceTopic.replyCount} replies`} size="small" />
              <Chip label={`${sourceTopic.voteScore} votes`} size="small" />
            </Box>
          </CardContent>
        </Card>

        {/* Target Topic Selection */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Select Target Topic (replies will be moved here):
        </Typography>
        <Autocomplete
          options={topics}
          getOptionLabel={(option) => option.title}
          value={selectedTopic}
          onChange={(_, newValue) => setSelectedTopic(newValue)}
          onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
          loading={loadingTopics}
          disabled={mergeMutation.isPending}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search for target topic"
              placeholder="Type at least 3 characters to search..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingTopics && <CircularProgress size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Typography variant="body1">{option.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip label={option.type} size="small" />
                  <Chip label={`${option.replyCount} replies`} size="small" />
                  <Chip label={`${option.voteScore} votes`} size="small" />
                </Box>
              </Box>
            </li>
          )}
          sx={{ mb: 3 }}
        />

        {/* Selected Target Preview */}
        {selectedTopic && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Target Topic Preview:
            </Typography>
            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'success.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedTopic.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedTopic.excerpt}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={selectedTopic.type} size="small" color="success" />
                  <Chip label={`${selectedTopic.replyCount} replies`} size="small" color="success" />
                  <Chip label={`${selectedTopic.voteScore} votes`} size="small" color="success" />
                </Box>
              </CardContent>
            </Card>
          </>
        )}

        {/* Reason */}
        <TextField
          label="Reason (optional)"
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why these topics are being merged..."
          disabled={mergeMutation.isPending}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={mergeMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={mergeMutation.isPending || !selectedTopic}
          startIcon={mergeMutation.isPending && <CircularProgress size={16} />}
        >
          {mergeMutation.isPending ? 'Merging...' : 'Merge Topics'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MergeTopicsModal;
