/**
 * RankPodium Component
 * Displays top 3 users in a podium-style layout
 * Animated and responsive design
 */

import React from 'react';
import { Box, Avatar, Typography, Chip, useTheme, useMediaQuery } from '@mui/material';
import { EmojiEvents, TrendingUp, TrendingDown } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LeaderboardUser } from '../types/leaderboard';
import { getRankColor, getRankIcon } from '../types/leaderboard';

interface RankPodiumProps {
  topThree: LeaderboardUser[];
  isLoading?: boolean;
}

const RankPodium: React.FC<RankPodiumProps> = ({ topThree, isLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isLoading || topThree.length === 0) {
    return null;
  }

  // Arrange podium: 2nd, 1st, 3rd
  const [first, second, third] = topThree;
  const podiumOrder = [second, first, third].filter(Boolean);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: isMobile ? 1 : 2,
        mb: 4,
        px: 2,
      }}
    >
      {podiumOrder.map((user, index) => {
        if (!user) return null;

        const actualRank = user.rank;
        const heights = isMobile ? [100, 140, 80] : [140, 180, 120];
        const height = heights[index];
        const delay = index * 0.1;

        return (
          <motion.div
            key={user.userId}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            style={{ flex: 1, maxWidth: isMobile ? '110px' : '160px' }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {/* User Avatar and Info */}
              <Box
                sx={{
                  position: 'relative',
                  mb: 1,
                }}
              >
                <Link to={`/u/${user.username}`} style={{ textDecoration: 'none' }}>
                  <Avatar
                    src={user.avatarUrl || undefined}
                    alt={user.displayName || user.username}
                    sx={{
                      width: isMobile ? 60 : 80,
                      height: isMobile ? 60 : 80,
                      border: `4px solid ${getRankColor(actualRank)}`,
                      boxShadow: `0 4px 12px ${getRankColor(actualRank)}40`,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </Avatar>
                </Link>
                {/* Rank Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: getRankColor(actualRank),
                    color: actualRank === 1 ? '#000' : '#fff',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    border: '2px solid white',
                    boxShadow: theme.shadows[3],
                  }}
                >
                  {getRankIcon(actualRank)}
                </Box>
              </Box>

              {/* Username */}
              <Link
                to={`/u/${user.username}`}
                style={{ textDecoration: 'none', textAlign: 'center' }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {user.displayName || user.username}
                </Typography>
              </Link>

              {/* Reputation Gain */}
              <Chip
                icon={<EmojiEvents sx={{ fontSize: '1rem' }} />}
                label={`+${user.reputationGain.toLocaleString()}`}
                size="small"
                sx={{
                  backgroundColor: `${getRankColor(actualRank)}20`,
                  color: actualRank === 1 ? '#B8860B' : actualRank === 2 ? '#708090' : '#8B4513',
                  border: `1px solid ${getRankColor(actualRank)}`,
                  fontWeight: 600,
                }}
              />

              {/* Stats */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="caption">
                  {user.postCount} posts
                </Typography>
                {user.acceptedAnswers > 0 && (
                  <>
                    <Typography variant="caption">•</Typography>
                    <Typography variant="caption">
                      {user.acceptedAnswers} answers
                    </Typography>
                  </>
                )}
              </Box>

              {/* Rank Change Indicator */}
              {user.rankChange !== undefined && user.rankChange !== 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.3, type: 'spring' }}
                >
                  <Chip
                    icon={
                      user.rankChange > 0 ? (
                        <TrendingUp sx={{ fontSize: '0.9rem' }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: '0.9rem' }} />
                      )
                    }
                    label={Math.abs(user.rankChange)}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      backgroundColor: user.rankChange > 0 ? '#4CAF5020' : '#F4433620',
                      color: user.rankChange > 0 ? '#4CAF50' : '#F44336',
                      border: `1px solid ${user.rankChange > 0 ? '#4CAF5040' : '#F4433640'}`,
                    }}
                  />
                </motion.div>
              )}

              {/* Podium Block */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ duration: 0.6, delay: delay + 0.2 }}
                style={{ width: '100%' }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(180deg, ${getRankColor(actualRank)}40 0%, ${getRankColor(actualRank)}20 100%)`,
                    border: `2px solid ${getRankColor(actualRank)}`,
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: getRankColor(actualRank),
                    },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: getRankColor(actualRank),
                      opacity: 0.3,
                      fontSize: isMobile ? '2rem' : '3rem',
                    }}
                  >
                    {actualRank}
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
};

export default RankPodium;
