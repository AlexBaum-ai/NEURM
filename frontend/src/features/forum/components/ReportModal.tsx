/**
 * ReportModal Component
 * Modal for reporting content with reason selector and description field
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import {
  reportReasonLabels,
  reportReasonDescriptions,
  type ReportReason,
  type ReportableType,
} from '../types/report';
import { useToast } from '@/hooks/useToast';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  reportableType: ReportableType;
  reportableId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  open,
  onClose,
  reportableType,
  reportableId,
}) => {
  const { toast } = useToast();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reportMutation = useMutation({
    mutationFn: (data: {
      reportableType: ReportableType;
      reportableId: string;
      reason: string;
      description: string;
    }) => forumApi.createReport(data),
    onSuccess: () => {
      toast.success('Report submitted successfully', 'Thank you for helping keep our community safe');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to submit report';
      setError(errorMessage);
      toast.error(errorMessage, 'Report Failed');
    },
  });

  const handleClose = useCallback(() => {
    setReason('');
    setDescription('');
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!reason) {
      setError('Please select a reason for reporting');
      return;
    }

    if (description.trim().length < 10) {
      setError('Please provide more details (at least 10 characters)');
      return;
    }

    setError(null);
    reportMutation.mutate({
      reportableType,
      reportableId,
      reason,
      description: description.trim(),
    });
  }, [reason, description, reportableType, reportableId, reportMutation]);

  const reasons: ReportReason[] = ['spam', 'harassment', 'off_topic', 'misinformation', 'copyright'];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="report-dialog-title"
    >
      <DialogTitle id="report-dialog-title">
        Report {reportableType === 'topic' ? 'Topic' : 'Reply'}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Help us understand why you're reporting this content. Reports are reviewed by moderators
            and help maintain our community standards.
          </Typography>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Reason Selector */}
          <FormControl component="fieldset" required>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
              Why are you reporting this?
            </FormLabel>
            <RadioGroup value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
              {reasons.map((reasonKey) => (
                <Box key={reasonKey} sx={{ mb: 1 }}>
                  <FormControlLabel
                    value={reasonKey}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {reportReasonLabels[reasonKey]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reportReasonDescriptions[reasonKey]}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              ))}
            </RadioGroup>
          </FormControl>

          {/* Description Field */}
          <FormControl required>
            <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Additional Details</FormLabel>
            <TextField
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide specific details about why this content violates our community guidelines..."
              helperText={`${description.length}/500 characters (minimum 10 required)`}
              inputProps={{ maxLength: 500 }}
              fullWidth
            />
          </FormControl>

          <Alert severity="info" sx={{ mt: 1 }}>
            Your report will be reviewed by our moderation team. False reports may result in
            restrictions on your account.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={reportMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={!reason || description.trim().length < 10 || reportMutation.isPending}
          startIcon={reportMutation.isPending ? <CircularProgress size={16} /> : null}
        >
          {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportModal;
