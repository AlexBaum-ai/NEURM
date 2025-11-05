/**
 * LeaderboardEntry Component
 * Displays a single entry in the leaderboard table
 * Includes rank, avatar, username, stats, and badges
 */

import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  EmojiEvents,
  CheckCircle,
  Forum,
  Remove,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LeaderboardUser } from '../types/leaderboard';
import { getRankIcon } from '../types/leaderboard';

interface LeaderboardEntryProps {
  user: LeaderboardUser;
  isCurrentUser?: boolean;
  index: number;
}

const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({
  user,
  isCurrentUser,
  index,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const rankIcon = getRankIcon(user.rank);

  return (
    <TableRow
      component={motion.tr}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      sx={{
        backgroundColor: isCurrentUser ? 'primary.50' : 'transparent',
        border: isCurrentUser ? `2px solid ${theme.palette.primary.main}` : 'none',
        '&:hover': {
          backgroundColor: isCurrentUser ? 'primary.100' : 'action.hover',
        },
        ...(isCurrentUser && {
          boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
        }),
      }}
    >
      {/* Rank */}
      <TableCell
        sx={{
          width: isMobile ? 50 : 80,
          fontWeight: 700,
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: user.rank <= 3 ? 'primary.main' : 'text.secondary',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {rankIcon && <span style={{ fontSize: '1.5rem' }}>{rankIcon}</span>}
          <span>{user.rank}</span>
          {/* Rank Change Indicator */}
          {user.rankChange !== undefined && user.rankChange !== 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              {user.rankChange > 0 ? (
                <TrendingUp
                  sx={{
                    fontSize: '1rem',
                    color: '#4CAF50',
                  }}
                />
              ) : (
                <TrendingDown
                  sx={{
                    fontSize: '1rem',
                    color: '#F44336',
                  }}
                />
              )}
            </motion.div>
          )}
          {user.rankChange === 0 && (
            <Remove
              sx={{
                fontSize: '1rem',
                color: 'text.disabled',
              }}
            />
          )}
        </Box>
      </TableCell>

      {/* User Avatar and Name */}
      <TableCell>
        <Link
          to={`/u/${user.username}`}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <Avatar
            src={user.avatarUrl || undefined}
            alt={user.displayName || user.username}
            sx={{
              width: isMobile ? 40 : 48,
              height: isMobile ? 40 : 48,
              border: isCurrentUser ? `2px solid ${theme.palette.primary.main}` : 'none',
            }}
          >
            {(user.displayName || user.username).charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {user.displayName || user.username}
              {isCurrentUser && (
                <Chip
                  label="You"
                  size="small"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: 'primary.main',
                    color: 'white',
                  }}
                />
              )}
            </Typography>
            {!isMobile && (
              <Typography variant="caption" color="text.secondary">
                @{user.username}
              </Typography>
            )}
          </Box>
        </Link>
      </TableCell>

      {/* Reputation Gain */}
      <TableCell align="center">
        <Chip
          icon={<EmojiEvents sx={{ fontSize: '0.9rem' }} />}
          label={`+${user.reputationGain.toLocaleString()}`}
          size="small"
          sx={{
            backgroundColor: '#4CAF5020',
            color: '#4CAF50',
            border: '1px solid #4CAF5040',
            fontWeight: 600,
          }}
        />
      </TableCell>

      {/* Posts */}
      {!isMobile && (
        <TableCell align="center">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Forum sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant="body2">{user.postCount.toLocaleString()}</Typography>
          </Box>
        </TableCell>
      )}

      {/* Accepted Answers */}
      {!isMobile && (
        <TableCell align="center">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <CheckCircle sx={{ fontSize: '1rem', color: 'success.main' }} />
            <Typography variant="body2">{user.acceptedAnswers.toLocaleString()}</Typography>
          </Box>
        </TableCell>
      )}

      {/* Badges */}
      {!isMobile && user.badges && user.badges.length > 0 && (
        <TableCell align="center">
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user.badges.slice(0, 3).map((badge) => (
              <Box
                key={badge.id}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  border: `2px solid ${getBadgeColor(badge.rarity)}`,
                  backgroundColor: `${getBadgeColor(badge.rarity)}20`,
                }}
                title={badge.name}
              >
                {badge.icon}
              </Box>
            ))}
            {user.badges.length > 3 && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                +{user.badges.length - 3}
              </Typography>
            )}
          </Box>
        </TableCell>
      )}
    </TableRow>
  );
};

// Helper to get badge rarity color
function getBadgeColor(rarity: 'common' | 'rare' | 'epic' | 'legendary'): string {
  const colors = {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FFB300',
  };
  return colors[rarity];
}

export default LeaderboardEntry;
