/**
 * ReputationWidget Component
 * Displays detailed reputation information on user profiles
 * Shows level, progress bar, breakdown, and permissions
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  ThumbUp,
  ThumbDown,
  CheckCircle,
  Star,
} from '@mui/icons-material';
import { REPUTATION_LEVELS, formatReputationPoints } from '../types/reputation';
import type { UserReputation } from '../types';

interface ReputationWidgetProps {
  reputation: UserReputation;
}

const ReputationWidget: React.FC<ReputationWidgetProps> = ({ reputation }) => {
  const config = REPUTATION_LEVELS[reputation.level];
  const { levelProgress, breakdown, permissions } = reputation;

  // Calculate progress percentage for display
  const progressPercentage = levelProgress.percentage;

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${config.color}15 0%, transparent 100%)`,
        border: `1px solid ${config.color}30`,
      }}
    >
      <CardContent>
        {/* Header with level badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              role="img"
              aria-label={`${config.label} level`}
            >
              {config.icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {config.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reputation Level
              </Typography>
            </Box>
          </Box>
          <Chip
            label={formatReputationPoints(reputation.totalReputation)}
            sx={{
              backgroundColor: config.color,
              color: 'white',
              fontWeight: 700,
              fontSize: '1.1rem',
              height: 36,
              px: 1,
            }}
            aria-label={`Total reputation: ${reputation.totalReputation} points`}
          />
        </Box>

        {/* Progress bar to next level */}
        {levelProgress.nextLevelThreshold && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress to {REPUTATION_LEVELS[getNextLevel(reputation.level) || reputation.level].label}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {progressPercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${config.color}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: config.color,
                  borderRadius: 4,
                },
              }}
              aria-label={`Progress to next level: ${progressPercentage}%`}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {levelProgress.nextLevelThreshold - reputation.totalReputation} points to next level
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Reputation Breakdown */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Reputation Breakdown
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <StatItem
              icon={<TrendingUp />}
              label="Topics Created"
              value={breakdown.topicsCreated}
              color="#4CAF50"
            />
          </Grid>
          <Grid item xs={6}>
            <StatItem
              icon={<TrendingUp />}
              label="Replies Created"
              value={breakdown.repliesCreated}
              color="#2196F3"
            />
          </Grid>
          <Grid item xs={6}>
            <StatItem
              icon={<ThumbUp />}
              label="Upvotes Received"
              value={breakdown.upvotesReceived}
              color="#4CAF50"
            />
          </Grid>
          <Grid item xs={6}>
            <StatItem
              icon={<ThumbDown />}
              label="Downvotes Received"
              value={breakdown.downvotesReceived}
              color="#F44336"
            />
          </Grid>
          <Grid item xs={6}>
            <StatItem
              icon={<CheckCircle />}
              label="Best Answers"
              value={breakdown.bestAnswers}
              color="#FFB300"
            />
          </Grid>
          <Grid item xs={6}>
            <StatItem
              icon={<EmojiEvents />}
              label="Badges Earned"
              value={breakdown.badgesEarned}
              color="#9C27B0"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Permissions */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Unlocked Privileges
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <PermissionChip
            label="Upvote"
            enabled={true}
            tooltip="Vote up helpful content"
          />
          <PermissionChip
            label="Downvote"
            enabled={permissions.canDownvote}
            tooltip={
              permissions.canDownvote
                ? 'Vote down low-quality content'
                : 'Requires 50+ reputation'
            }
          />
          <PermissionChip
            label="Edit Others' Content"
            enabled={permissions.canEditOthersContent}
            tooltip={
              permissions.canEditOthersContent
                ? 'Edit other users\' posts'
                : 'Requires 500+ reputation'
            }
          />
          <PermissionChip
            label="Moderate"
            enabled={permissions.canModerate}
            tooltip={
              permissions.canModerate
                ? 'Access moderation tools'
                : 'Requires 1000+ reputation'
            }
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// Helper component for stat items
interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      p: 1,
      borderRadius: 1,
      backgroundColor: `${color}10`,
      border: `1px solid ${color}30`,
    }}
  >
    <Box sx={{ color, display: 'flex', alignItems: 'center', fontSize: '1.2rem' }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

// Helper component for permission chips
interface PermissionChipProps {
  label: string;
  enabled: boolean;
  tooltip: string;
}

const PermissionChip: React.FC<PermissionChipProps> = ({ label, enabled, tooltip }) => (
  <Tooltip title={tooltip} arrow>
    <Chip
      icon={enabled ? <CheckCircle sx={{ fontSize: '1rem' }} /> : undefined}
      label={label}
      size="small"
      sx={{
        backgroundColor: enabled ? '#4CAF5020' : '#9E9E9E20',
        color: enabled ? '#4CAF50' : '#9E9E9E',
        border: `1px solid ${enabled ? '#4CAF5040' : '#9E9E9E40'}`,
        opacity: enabled ? 1 : 0.6,
        '& .MuiChip-icon': {
          color: '#4CAF50',
        },
      }}
      aria-label={`${label} privilege ${enabled ? 'unlocked' : 'locked'}`}
    />
  </Tooltip>
);

// Helper to get next level
function getNextLevel(currentLevel: string): string | null {
  const levels = ['newcomer', 'contributor', 'expert', 'master', 'legend'];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
}

export default ReputationWidget;
