/**
 * ModeratorMenu Component
 * Dropdown menu with moderation actions for topics and replies
 * Only visible to moderators and admins
 */

import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  PushPin as PinIcon,
  Lock as LockIcon,
  DriveFileMove as MoveIcon,
  MergeType as MergeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as HideIcon,
  Warning as WarnIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import type { ForumTopic, ForumReply } from '../types';

interface ModeratorMenuProps {
  type: 'topic' | 'reply';
  target: ForumTopic | ForumReply;
  onPin?: (isPinned: boolean) => void;
  onLock?: (isLocked: boolean) => void;
  onMove?: () => void;
  onMerge?: () => void;
  onDelete?: (reason?: string) => void;
  onEdit?: () => void;
  onHide?: (isHidden: boolean, reason?: string) => void;
  onWarnUser?: () => void;
}

export const ModeratorMenu: React.FC<ModeratorMenuProps> = ({
  type,
  target,
  onPin,
  onLock,
  onMove,
  onMerge,
  onDelete,
  onEdit,
  onHide,
  onWarnUser,
}) => {
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    message: string;
    requireReason?: boolean;
    onConfirm: (reason?: string) => void;
  } | null>(null);
  const [reason, setReason] = useState('');

  // Check if user is moderator or admin
  const isModerator = user?.role === 'moderator' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  if (!isModerator) return null;

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleConfirm = () => {
    if (confirmDialog) {
      confirmDialog.onConfirm(reason || undefined);
      setConfirmDialog(null);
      setReason('');
      handleClose();
    }
  };

  const handleCancelConfirm = () => {
    setConfirmDialog(null);
    setReason('');
  };

  const showConfirmDialog = (
    action: string,
    title: string,
    message: string,
    onConfirm: (reason?: string) => void,
    requireReason = false
  ) => {
    setConfirmDialog({
      open: true,
      action,
      title,
      message,
      requireReason,
      onConfirm,
    });
  };

  // Topic actions
  const isTopic = type === 'topic';
  const topic = isTopic ? (target as ForumTopic) : null;

  // Reply actions
  const isReply = type === 'reply';
  const reply = isReply ? (target as ForumReply) : null;

  return (
    <>
      <IconButton
        aria-label="moderator actions"
        aria-controls={open ? 'moderator-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        size="small"
        sx={{ color: 'warning.main' }}
      >
        <MoreIcon />
      </IconButton>

      <Menu
        id="moderator-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'moderator-menu-button',
        }}
      >
        {isTopic && topic && (
          <>
            {onPin && (
              <MenuItem
                onClick={() => {
                  onPin(!topic.isPinned);
                  handleClose();
                }}
              >
                <ListItemIcon>
                  <PinIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topic.isPinned ? 'Unpin Topic' : 'Pin Topic'}</ListItemText>
              </MenuItem>
            )}

            {onLock && (
              <MenuItem
                onClick={() => {
                  onLock(!topic.isLocked);
                  handleClose();
                }}
              >
                <ListItemIcon>
                  <LockIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topic.isLocked ? 'Unlock Topic' : 'Lock Topic'}</ListItemText>
              </MenuItem>
            )}

            {onMove && (
              <MenuItem
                onClick={() => {
                  onMove();
                  handleClose();
                }}
              >
                <ListItemIcon>
                  <MoveIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Move to Category</ListItemText>
              </MenuItem>
            )}

            {onMerge && (
              <MenuItem
                onClick={() => {
                  onMerge();
                  handleClose();
                }}
              >
                <ListItemIcon>
                  <MergeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Merge with Topic</ListItemText>
              </MenuItem>
            )}

            <Divider />
          </>
        )}

        {isReply && reply && (
          <>
            {onEdit && (
              <MenuItem
                onClick={() => {
                  onEdit();
                  handleClose();
                }}
              >
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit Reply</ListItemText>
              </MenuItem>
            )}

            {onHide && (
              <MenuItem
                onClick={() => {
                  showConfirmDialog(
                    'hide',
                    reply.isDeleted ? 'Unhide Reply' : 'Hide Reply',
                    reply.isDeleted
                      ? 'Are you sure you want to unhide this reply?'
                      : 'Are you sure you want to hide this reply? It will be hidden from regular users.',
                    (reason) => onHide(!reply.isDeleted, reason),
                    !reply.isDeleted
                  );
                }}
              >
                <ListItemIcon>
                  <HideIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{reply.isDeleted ? 'Unhide Reply' : 'Hide Reply'}</ListItemText>
              </MenuItem>
            )}

            <Divider />
          </>
        )}

        {onWarnUser && (
          <MenuItem
            onClick={() => {
              onWarnUser();
              handleClose();
            }}
          >
            <ListItemIcon>
              <WarnIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Warn User</ListItemText>
          </MenuItem>
        )}

        {onDelete && (
          <MenuItem
            onClick={() => {
              showConfirmDialog(
                'delete',
                `Delete ${type === 'topic' ? 'Topic' : 'Reply'}`,
                `Are you sure you want to ${isAdmin ? 'permanently delete' : 'delete'} this ${type}? ${
                  isAdmin ? 'This action cannot be undone.' : ''
                }`,
                (reason) => onDelete(reason),
                true
              );
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete {isAdmin && '(Permanent)'}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog?.open || false}
        onClose={handleCancelConfirm}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">{confirmDialog?.title}</DialogTitle>
        <DialogContent>
          <p id="confirm-dialog-description">{confirmDialog?.message}</p>
          {confirmDialog?.requireReason && (
            <TextField
              autoFocus
              margin="dense"
              label="Reason (required)"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this action is being taken..."
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirm}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={confirmDialog?.action === 'delete' ? 'error' : 'primary'}
            disabled={confirmDialog?.requireReason && !reason.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ModeratorMenu;
