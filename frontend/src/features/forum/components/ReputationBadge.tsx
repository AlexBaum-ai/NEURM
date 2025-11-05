/**
 * ReputationBadge Component
 * Displays a user's reputation level badge inline with their username
 * Used in posts, replies, and user cards
 */

import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import { REPUTATION_LEVELS, formatReputationPoints } from '../types/reputation';
import type { ReputationLevel } from '../types';

interface ReputationBadgeProps {
  level: ReputationLevel;
  totalReputation: number;
  size?: 'small' | 'medium';
  showPoints?: boolean;
  showIcon?: boolean;
  showTooltip?: boolean;
}

const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  level,
  totalReputation,
  size = 'small',
  showPoints = true,
  showIcon = true,
  showTooltip = true,
}) => {
  const config = REPUTATION_LEVELS[level];

  const badge = (
    <Chip
      label={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          }}
        >
          {showIcon && <span role="img" aria-label={`${config.label} level`}>{config.icon}</span>}
          <span>{config.label}</span>
          {showPoints && (
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                ml: 0.5,
              }}
            >
              {formatReputationPoints(totalReputation)}
            </Box>
          )}
        </Box>
      }
      size={size}
      sx={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}40`,
        fontWeight: 500,
        height: size === 'small' ? 20 : 24,
        '& .MuiChip-label': {
          px: size === 'small' ? 0.75 : 1,
        },
      }}
      aria-label={`User reputation: ${config.label}, ${totalReputation} points`}
    />
  );

  if (!showTooltip) {
    return badge;
  }

  const nextLevelThreshold = config.nextLevelPoints;
  const tooltipContent = (
    <Box>
      <Box sx={{ fontWeight: 600, mb: 0.5 }}>
        {config.label} - {totalReputation} points
      </Box>
      {nextLevelThreshold ? (
        <Box sx={{ fontSize: '0.875rem' }}>
          {nextLevelThreshold - totalReputation} points to next level
        </Box>
      ) : (
        <Box sx={{ fontSize: '0.875rem' }}>
          Max level reached!
        </Box>
      )}
      <Box sx={{ fontSize: '0.75rem', mt: 0.5, opacity: 0.8 }}>
        Reputation unlocks special privileges
      </Box>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      {badge}
    </Tooltip>
  );
};

export default ReputationBadge;
