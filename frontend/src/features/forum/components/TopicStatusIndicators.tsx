/**
 * TopicStatusIndicators Component
 * Visual indicators for topic status (pinned, locked, edited)
 */

import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import {
  PushPin as PinnedIcon,
  Lock as LockedIcon,
  Edit as EditedIcon,
  CheckCircle as ResolvedIcon,
  Archive as ArchivedIcon,
} from '@mui/icons-material';
import type { ForumTopic, TopicStatus } from '../types';

interface TopicStatusIndicatorsProps {
  topic: ForumTopic;
  size?: 'small' | 'medium';
  showAll?: boolean;
}

export const TopicStatusIndicators: React.FC<TopicStatusIndicatorsProps> = ({
  topic,
  size = 'small',
  showAll = true,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {/* Pinned Indicator */}
      {topic.isPinned && (
        <Tooltip title="This topic is pinned to the top">
          <Chip
            icon={<PinnedIcon />}
            label="Pinned"
            size={size}
            color="primary"
            variant="outlined"
          />
        </Tooltip>
      )}

      {/* Locked Indicator */}
      {topic.isLocked && (
        <Tooltip title="This topic is locked - no new replies allowed">
          <Chip
            icon={<LockedIcon />}
            label="Locked"
            size={size}
            color="warning"
            variant="outlined"
          />
        </Tooltip>
      )}

      {/* Status Indicators */}
      {showAll && topic.status === 'resolved' && (
        <Tooltip title="This question has been resolved">
          <Chip
            icon={<ResolvedIcon />}
            label="Resolved"
            size={size}
            color="success"
            variant="outlined"
          />
        </Tooltip>
      )}

      {showAll && topic.status === 'archived' && (
        <Tooltip title="This topic has been archived">
          <Chip
            icon={<ArchivedIcon />}
            label="Archived"
            size={size}
            color="default"
            variant="outlined"
          />
        </Tooltip>
      )}
    </Box>
  );
};

interface ReplyStatusIndicatorsProps {
  isEdited: boolean;
  editedAt?: string | null;
  isDeleted: boolean;
  size?: 'small' | 'medium';
}

export const ReplyStatusIndicators: React.FC<ReplyStatusIndicatorsProps> = ({
  isEdited,
  editedAt,
  isDeleted,
  size = 'small',
}) => {
  if (!isEdited && !isDeleted) return null;

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
      {isEdited && editedAt && (
        <Tooltip
          title={`Last edited: ${new Date(editedAt).toLocaleString()}`}
        >
          <Chip
            icon={<EditedIcon />}
            label="Edited"
            size={size}
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        </Tooltip>
      )}

      {isDeleted && (
        <Chip
          label="Hidden by moderator"
          size={size}
          color="error"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
      )}
    </Box>
  );
};

export default TopicStatusIndicators;
