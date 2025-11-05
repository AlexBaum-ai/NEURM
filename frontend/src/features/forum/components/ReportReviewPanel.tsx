/**
 * ReportReviewPanel Component
 * Drawer panel for reviewing individual reports in detail
 */

import React, { useState, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Chip,
  Avatar,
  Button,
  TextField,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { Close as CloseIcon, Flag as FlagIcon } from '@mui/icons-material';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import {
  reportReasonLabels,
  reportStatusLabels,
  reportStatusColors,
  reportReasonDescriptions,
} from '../types/report';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow } from 'date-fns';

interface ReportReviewPanelProps {
  reportId: string;
  open: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

export const ReportReviewPanel: React.FC<ReportReviewPanelProps> = ({
  reportId,
  open,
  onClose,
  onResolved,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  // Fetch report details
  const { data } = useSuspenseQuery({
    queryKey: ['report', reportId],
    queryFn: () => forumApi.getReportById(reportId),
    enabled: !!reportId,
  });

  const report = data?.data?.report;

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (data: { action: string; notes?: string }) =>
      forumApi.resolveReport(reportId, data),
    onSuccess: () => {
      toast.success('Report resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
      queryClient.invalidateQueries({ queryKey: ['reportStatistics'] });
      onResolved?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to resolve report');
    },
  });

  const handleResolve = useCallback(
    (action: 'mark_violation' | 'no_action' | 'dismiss') => {
      if (
        window.confirm(
          `Are you sure you want to resolve this report with action "${action}"?`
        )
      ) {
        resolveMutation.mutate({ action, notes: notes.trim() || undefined });
      }
    },
    [notes, resolveMutation]
  );

  if (!report) {
    return null;
  }

  const isResolved = report.status !== 'pending' && report.status !== 'reviewing';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 600 },
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <FlagIcon color="error" />
            <Typography variant="h6" fontWeight={600}>
              Report Review
            </Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Stack spacing={3}>
            {/* Status & Reason */}
            <Box>
              <Stack direction="row" spacing={1} mb={2}>
                <Chip
                  label={reportStatusLabels[report.status]}
                  sx={{
                    bgcolor: reportStatusColors[report.status] + '20',
                    color: reportStatusColors[report.status],
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label={reportReasonLabels[report.reason]}
                  color="error"
                  variant="outlined"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {reportReasonDescriptions[report.reason]}
              </Typography>
            </Box>

            <Divider />

            {/* Reporter Information */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={2}>
                  Reporter Information
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={report.reporter.avatarUrl || undefined}
                    alt={report.reporter.username}
                  >
                    {report.reporter.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {report.reporter.displayName || report.reporter.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{report.reporter.username}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Reported {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                </Typography>
              </CardContent>
            </Card>

            {/* Report Description */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={2}>
                  Report Description
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.description}
                </Typography>
              </CardContent>
            </Card>

            {/* Reported Content */}
            {report.content && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Reported Content
                  </Typography>

                  {/* Content Author */}
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Avatar
                      src={report.content.author.avatarUrl || undefined}
                      alt={report.content.author.username}
                      sx={{ width: 32, height: 32 }}
                    >
                      {report.content.author.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {report.content.author.displayName || report.content.author.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(report.content.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Content Title (for topics) */}
                  {report.content.title && (
                    <Typography variant="h6" fontWeight={600} mb={1}>
                      {report.content.title}
                    </Typography>
                  )}

                  {/* Content Preview */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      maxHeight: 300,
                      overflow: 'auto',
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: report.content.content }}
                      style={{ fontSize: '0.875rem' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Resolution Information (if resolved) */}
            {isResolved && report.resolver && report.resolvedAt && (
              <Alert severity="info">
                <Typography variant="body2" fontWeight={500}>
                  Resolved by {report.resolver.displayName || report.resolver.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(report.resolvedAt), { addSuffix: true })}
                </Typography>
              </Alert>
            )}

            {/* Actions (if not resolved) */}
            {!isResolved && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Resolution Actions
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about your decision (optional)..."
                    sx={{ mb: 2 }}
                  />

                  <Stack spacing={1}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      onClick={() => handleResolve('mark_violation')}
                      disabled={resolveMutation.isPending}
                      startIcon={resolveMutation.isPending ? <CircularProgress size={16} /> : null}
                    >
                      Mark as Violation
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={() => handleResolve('no_action')}
                      disabled={resolveMutation.isPending}
                      startIcon={resolveMutation.isPending ? <CircularProgress size={16} /> : null}
                    >
                      No Action Needed
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleResolve('dismiss')}
                      disabled={resolveMutation.isPending}
                      startIcon={resolveMutation.isPending ? <CircularProgress size={16} /> : null}
                    >
                      Dismiss Report
                    </Button>
                  </Stack>

                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      <strong>Mark as Violation:</strong> Confirms the content violates guidelines and
                      may result in content removal and user warnings.
                      <br />
                      <strong>No Action:</strong> The report is valid but no policy violation occurred.
                      <br />
                      <strong>Dismiss:</strong> The report is false or frivolous.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ReportReviewPanel;
