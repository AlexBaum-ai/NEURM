/**
 * UserModerationPanel Component
 * Panel for moderating users (warn, suspend, ban)
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
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Warning as WarnIcon,
  Block as SuspendIcon,
  Gavel as BanIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import { useAuthStore } from '@/store/authStore';
import type { TopicAuthor } from '../types';

interface UserModerationPanelProps {
  open: boolean;
  user: TopicAuthor;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModerationActionType = 'warn' | 'suspend' | 'ban';

const SUSPENSION_DURATIONS = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export const UserModerationPanel: React.FC<UserModerationPanelProps> = ({
  open,
  user,
  onClose,
  onSuccess,
}) => {
  const { user: currentUser } = useAuthStore();
  const [actionType, setActionType] = useState<ModerationActionType>('warn');
  const [reason, setReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [isPermanent, setIsPermanent] = useState(false);
  const queryClient = useQueryClient();

  const isAdmin = currentUser?.role === 'admin';

  // Warn mutation
  const warnMutation = useMutation({
    mutationFn: (data: { userId: string; reason: string }) =>
      forumApi.warnUser(data.userId, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-logs'] });
      onSuccess?.();
      handleClose();
    },
  });

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: (data: { userId: string; reason: string; durationDays: number }) =>
      forumApi.suspendUser(data.userId, data.reason, data.durationDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-logs'] });
      onSuccess?.();
      handleClose();
    },
  });

  // Ban mutation
  const banMutation = useMutation({
    mutationFn: (data: { userId: string; reason: string; isPermanent: boolean }) =>
      forumApi.banUser(data.userId, data.reason, data.isPermanent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-logs'] });
      onSuccess?.();
      handleClose();
    },
  });

  const isPending = warnMutation.isPending || suspendMutation.isPending || banMutation.isPending;
  const error = warnMutation.error || suspendMutation.error || banMutation.error;

  const handleClose = () => {
    setActionType('warn');
    setReason('');
    setSuspensionDays(7);
    setIsPermanent(false);
    warnMutation.reset();
    suspendMutation.reset();
    banMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!reason.trim()) return;

    switch (actionType) {
      case 'warn':
        warnMutation.mutate({ userId: user.id, reason: reason.trim() });
        break;
      case 'suspend':
        suspendMutation.mutate({
          userId: user.id,
          reason: reason.trim(),
          durationDays: suspensionDays,
        });
        break;
      case 'ban':
        banMutation.mutate({
          userId: user.id,
          reason: reason.trim(),
          isPermanent,
        });
        break;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="user-moderation-dialog-title"
    >
      <DialogTitle id="user-moderation-dialog-title">Moderate User</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to moderate user. Please try again.
          </Alert>
        )}

        {/* User Info */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
          }}
        >
          <Avatar src={user.avatarUrl || undefined} alt={user.displayName || user.username}>
            {(user.displayName || user.username).charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{user.displayName || user.username}</Typography>
            <Typography variant="body2" color="text.secondary">
              @{user.username}
            </Typography>
            {user.reputation !== undefined && (
              <Chip
                label={`${user.reputation} reputation`}
                size="small"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
        </Box>

        {/* Action Type Selection */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Select Action:
        </Typography>
        <ToggleButtonGroup
          value={actionType}
          exclusive
          onChange={(_, newValue) => newValue && setActionType(newValue)}
          aria-label="moderation action type"
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="warn" aria-label="warn user">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <WarnIcon />
              <Typography variant="caption">Warn</Typography>
            </Box>
          </ToggleButton>
          <ToggleButton value="suspend" aria-label="suspend user">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <SuspendIcon />
              <Typography variant="caption">Suspend</Typography>
            </Box>
          </ToggleButton>
          <ToggleButton value="ban" aria-label="ban user" disabled={!isAdmin}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <BanIcon />
              <Typography variant="caption">Ban</Typography>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Action-specific options */}
        {actionType === 'warn' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            A warning will be sent to the user. Multiple warnings may result in automatic suspension.
          </Alert>
        )}

        {actionType === 'suspend' && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="suspension-duration-label">Suspension Duration</InputLabel>
            <Select
              labelId="suspension-duration-label"
              value={suspensionDays}
              label="Suspension Duration"
              onChange={(e) => setSuspensionDays(Number(e.target.value))}
              disabled={isPending}
            >
              {SUSPENSION_DURATIONS.map((duration) => (
                <MenuItem key={duration.days} value={duration.days}>
                  {duration.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {actionType === 'ban' && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {isPermanent
              ? 'This user will be permanently banned from the forum.'
              : 'This user will be banned temporarily. Set duration below.'}
          </Alert>
        )}

        {/* Reason */}
        <TextField
          label="Reason (required)"
          multiline
          rows={4}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={`Explain why this user is being ${actionType === 'warn' ? 'warned' : actionType === 'suspend' ? 'suspended' : 'banned'}...`}
          disabled={isPending}
          required
          error={!reason.trim()}
          helperText={!reason.trim() ? 'Reason is required' : ''}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={actionType === 'ban' ? 'error' : actionType === 'suspend' ? 'warning' : 'primary'}
          disabled={isPending || !reason.trim()}
          startIcon={isPending && <CircularProgress size={16} />}
        >
          {isPending
            ? `${actionType === 'warn' ? 'Warning' : actionType === 'suspend' ? 'Suspending' : 'Banning'}...`
            : actionType === 'warn'
              ? 'Issue Warning'
              : actionType === 'suspend'
                ? 'Suspend User'
                : 'Ban User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserModerationPanel;
