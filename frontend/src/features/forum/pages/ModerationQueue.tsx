/**
 * ModerationQueue Page
 * Shows list of reports with filters for moderators
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Checkbox,
  IconButton,
  Tooltip,
  Badge,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  CheckCircle as ResolveIcon,
} from '@mui/icons-material';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import { ReportReviewPanel } from '../components/ReportReviewPanel';
import {
  reportReasonLabels,
  reportStatusLabels,
  reportStatusColors,
  type ReportReason,
  type ReportStatus,
  type Report,
} from '../types/report';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow } from 'date-fns';

const ModerationQueue: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter state
  const [reason, setReason] = useState<ReportReason | 'all'>('all');
  const [status, setStatus] = useState<ReportStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [reviewingReportId, setReviewingReportId] = useState<string | null>(null);

  // Build filters object
  const filters = useMemo(
    () => ({
      reason: reason !== 'all' ? reason : undefined,
      status: status !== 'all' ? status : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: 20,
    }),
    [reason, status, dateFrom, dateTo, page]
  );

  // Fetch reports
  const { data, refetch } = useSuspenseQuery({
    queryKey: ['reports', filters],
    queryFn: () => forumApi.getReports(filters),
    refetchInterval: 60000, // Poll every 60s for new reports
  });

  // Fetch statistics
  const { data: statsData } = useSuspenseQuery({
    queryKey: ['reportStatistics'],
    queryFn: () => forumApi.getReportStatistics(),
    refetchInterval: 60000,
  });

  const reports = data?.data?.reports || [];
  const pagination = data?.data?.pagination;
  const statistics = statsData?.data?.statistics;

  // Batch resolve mutation
  const batchResolveMutation = useMutation({
    mutationFn: (data: { reportIds: string[]; action: string; notes?: string }) =>
      forumApi.batchResolveReports(data),
    onSuccess: () => {
      toast.success('Reports resolved successfully');
      setSelectedReportIds([]);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reportStatistics'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to resolve reports');
    },
  });

  // Handle batch actions
  const handleBatchResolve = useCallback(
    (action: 'mark_violation' | 'no_action' | 'dismiss') => {
      if (selectedReportIds.length === 0) {
        toast.warning('Please select reports to resolve');
        return;
      }

      if (
        window.confirm(
          `Are you sure you want to resolve ${selectedReportIds.length} report(s) with action "${action}"?`
        )
      ) {
        batchResolveMutation.mutate({ reportIds: selectedReportIds, action });
      }
    },
    [selectedReportIds, batchResolveMutation, toast]
  );

  // Toggle report selection
  const toggleReportSelection = useCallback((reportId: string) => {
    setSelectedReportIds((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  }, []);

  // Select all / deselect all
  const toggleSelectAll = useCallback(() => {
    if (selectedReportIds.length === reports.length) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(reports.map((r) => r.id));
    }
  }, [selectedReportIds, reports]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setReason('all');
    setStatus('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

  const reasons: (ReportReason | 'all')[] = ['all', 'spam', 'harassment', 'off_topic', 'misinformation', 'copyright'];
  const statuses: (ReportStatus | 'all')[] = ['all', 'pending', 'reviewing', 'resolved_violation', 'resolved_no_action', 'dismissed'];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Moderation Queue
          </Typography>
          <Tooltip title="Refresh reports">
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Statistics Cards */}
        {statistics && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Total Reports
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {statistics.totalReports}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                <CardContent>
                  <Typography color="inherit" variant="body2">
                    Pending
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {statistics.pendingReports}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Resolved Today
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {statistics.resolvedToday}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Most Common
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {Object.entries(statistics.byReason)
                      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon color="action" />
              <Typography variant="h6" fontWeight={600}>
                Filters
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Reason</InputLabel>
                  <Select value={reason} onChange={(e) => setReason(e.target.value as any)} label="Reason">
                    {reasons.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r === 'all' ? 'All Reasons' : reportReasonLabels[r as ReportReason]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={status} onChange={(e) => setStatus(e.target.value as any)} label="Status">
                    {statuses.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s === 'all' ? 'All Statuses' : reportStatusLabels[s as ReportStatus]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Date From"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Date To"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Batch Actions */}
        {selectedReportIds.length > 0 && (
          <Alert
            severity="info"
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleBatchResolve('mark_violation')}
                  disabled={batchResolveMutation.isPending}
                >
                  Mark Violation
                </Button>
                <Button
                  size="small"
                  color="success"
                  onClick={() => handleBatchResolve('no_action')}
                  disabled={batchResolveMutation.isPending}
                >
                  No Action
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBatchResolve('dismiss')}
                  disabled={batchResolveMutation.isPending}
                >
                  Dismiss
                </Button>
              </Stack>
            }
          >
            {selectedReportIds.length} report(s) selected
          </Alert>
        )}

        {/* Reports List */}
        <Paper sx={{ overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={reports.length > 0 && selectedReportIds.length === reports.length}
              indeterminate={selectedReportIds.length > 0 && selectedReportIds.length < reports.length}
              onChange={toggleSelectAll}
            />
            <Typography variant="h6" fontWeight={600} sx={{ ml: 1 }}>
              Reports ({pagination?.totalCount || 0})
            </Typography>
          </Box>

          {reports.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No reports found matching your filters</Typography>
            </Box>
          ) : (
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
              {reports.map((report: Report) => (
                <Box
                  key={report.id}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                  }}
                  onClick={() => setReviewingReportId(report.id)}
                >
                  <Checkbox
                    checked={selectedReportIds.includes(report.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleReportSelection(report.id);
                    }}
                  />

                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Chip
                        label={reportReasonLabels[report.reason]}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                      <Chip
                        label={reportStatusLabels[report.status]}
                        size="small"
                        sx={{
                          bgcolor: reportStatusColors[report.status] + '20',
                          color: reportStatusColors[report.status],
                          border: 'none',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </Typography>
                    </Stack>

                    <Typography variant="body1" fontWeight={500} mb={0.5}>
                      {report.content?.title || `${report.reportableType} reported`}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {report.content?.excerpt || report.description}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" mt={1}>
                      Reported by: {report.reporter.displayName || report.reporter.username}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button
                size="small"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ px: 2, py: 1 }}>
                Page {pagination.page} of {pagination.totalPages}
              </Typography>
              <Button
                size="small"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </Paper>
      </Stack>

      {/* Review Panel */}
      {reviewingReportId && (
        <ReportReviewPanel
          reportId={reviewingReportId}
          open={!!reviewingReportId}
          onClose={() => setReviewingReportId(null)}
          onResolved={() => {
            setReviewingReportId(null);
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            queryClient.invalidateQueries({ queryKey: ['reportStatistics'] });
          }}
        />
      )}
    </Container>
  );
};

export default ModerationQueue;
