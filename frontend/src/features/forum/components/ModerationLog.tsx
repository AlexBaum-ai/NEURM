/**
 * ModerationLog Component
 * Displays recent moderation actions with filtering and pagination
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Stack,
  Pagination,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import {
  PushPin as PinIcon,
  Lock as LockIcon,
  DriveFileMove as MoveIcon,
  MergeType as MergeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as HideIcon,
  Warning as WarnIcon,
  Block as SuspendIcon,
  Gavel as BanIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type { ModerationLog as ModerationLogType, ModerationAction } from '../types';
import { formatDistanceToNow } from 'date-fns';

const ACTION_ICONS: Record<string, React.ReactElement> = {
  pin_topic: <PinIcon />,
  unpin_topic: <PinIcon />,
  lock_topic: <LockIcon />,
  unlock_topic: <LockIcon />,
  move_topic: <MoveIcon />,
  merge_topic: <MergeIcon />,
  delete_topic: <DeleteIcon />,
  edit_topic: <EditIcon />,
  hide_reply: <HideIcon />,
  delete_reply: <DeleteIcon />,
  edit_reply: <EditIcon />,
  warn_user: <WarnIcon />,
  suspend_user: <SuspendIcon />,
  ban_user: <BanIcon />,
};

const ACTION_LABELS: Record<string, string> = {
  pin_topic: 'Pinned Topic',
  unpin_topic: 'Unpinned Topic',
  lock_topic: 'Locked Topic',
  unlock_topic: 'Unlocked Topic',
  move_topic: 'Moved Topic',
  merge_topic: 'Merged Topics',
  delete_topic: 'Deleted Topic',
  edit_topic: 'Edited Topic',
  hide_reply: 'Hid Reply',
  delete_reply: 'Deleted Reply',
  edit_reply: 'Edited Reply',
  warn_user: 'Warned User',
  suspend_user: 'Suspended User',
  ban_user: 'Banned User',
};

const ACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  pin_topic: 'primary',
  unpin_topic: 'default',
  lock_topic: 'warning',
  unlock_topic: 'default',
  move_topic: 'info',
  merge_topic: 'info',
  delete_topic: 'error',
  edit_topic: 'default',
  hide_reply: 'warning',
  delete_reply: 'error',
  edit_reply: 'default',
  warn_user: 'warning',
  suspend_user: 'error',
  ban_user: 'error',
};

interface ModerationLogProps {
  limit?: number;
  showFilters?: boolean;
}

export const ModerationLog: React.FC<ModerationLogProps> = ({
  limit = 20,
  showFilters = true,
}) => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<ModerationAction | 'all'>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['moderation-logs', page, limit],
    queryFn: () => forumApi.getModerationLogs(page, limit),
    staleTime: 30 * 1000, // 30 seconds
  });

  const logs: ModerationLogType[] = data?.logs || [];
  const pagination = data?.pagination;

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredLogs =
    actionFilter === 'all' ? logs : logs.filter((log) => log.action === actionFilter);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">Failed to load moderation logs. Please try again later.</Alert>
    );
  }

  return (
    <Box>
      {showFilters && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="action-filter-label">Filter by Action</InputLabel>
            <Select
              labelId="action-filter-label"
              value={actionFilter}
              label="Filter by Action"
              onChange={(e) => setActionFilter(e.target.value as ModerationAction | 'all')}
            >
              <MenuItem value="all">All Actions</MenuItem>
              <MenuItem value="pin_topic">Pin/Unpin Topic</MenuItem>
              <MenuItem value="lock_topic">Lock/Unlock Topic</MenuItem>
              <MenuItem value="move_topic">Move Topic</MenuItem>
              <MenuItem value="merge_topic">Merge Topics</MenuItem>
              <MenuItem value="delete_topic">Delete Topic</MenuItem>
              <MenuItem value="hide_reply">Hide Reply</MenuItem>
              <MenuItem value="delete_reply">Delete Reply</MenuItem>
              <MenuItem value="edit_reply">Edit Reply</MenuItem>
              <MenuItem value="warn_user">Warn User</MenuItem>
              <MenuItem value="suspend_user">Suspend User</MenuItem>
              <MenuItem value="ban_user">Ban User</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {filteredLogs.length === 0 ? (
        <Alert severity="info">No moderation actions found.</Alert>
      ) : (
        <Stack spacing={2}>
          {filteredLogs.map((log) => (
            <Card key={log.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: `${ACTION_COLORS[log.action] || 'default'}.light`,
                      color: `${ACTION_COLORS[log.action] || 'default'}.dark`,
                    }}
                  >
                    {ACTION_ICONS[log.action] || <EditIcon />}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={ACTION_LABELS[log.action] || log.action}
                        size="small"
                        color={ACTION_COLORS[log.action] || 'default'}
                      />
                      <Chip label={log.targetType} size="small" variant="outlined" />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar
                        src={log.moderator.avatarUrl || undefined}
                        alt={log.moderator.displayName || log.moderator.username}
                        sx={{ width: 24, height: 24 }}
                      >
                        {(log.moderator.displayName || log.moderator.username)
                          .charAt(0)
                          .toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">
                        <strong>
                          {log.moderator.displayName || log.moderator.username}
                        </strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>

                    {log.reason && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Reason:</strong> {log.reason}
                      </Typography>
                    )}

                    {log.targetTitle && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Target:</strong> {log.targetTitle}
                      </Typography>
                    )}

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${value}`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            aria-label="moderation log pagination"
          />
        </Box>
      )}
    </Box>
  );
};

export default ModerationLog;
