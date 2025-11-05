/**
 * Leaderboards Page
 * Displays top contributors with tabs for different time periods
 * Features: Podium for top 3, animated rankings, current user highlight
 */

import React, { Suspense, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import { EmojiEvents, TrendingUp, AccessTime } from '@mui/icons-material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { forumApi } from '../api/forumApi';
import RankPodium from '../components/RankPodium';
import LeaderboardEntry from '../components/LeaderboardEntry';
import LeaderboardSkeleton from '../components/LeaderboardSkeleton';
import type { LeaderboardPeriod, LeaderboardData } from '../types/leaderboard';
import { getPeriodLabel } from '../types/leaderboard';

const Leaderboards: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: LeaderboardPeriod) => {
    setSelectedPeriod(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <EmojiEvents sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Leaderboards
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Top contributors in the Neurmatic community
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedPeriod}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab
            label="This Week"
            value="weekly"
            icon={<TrendingUp />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            label="This Month"
            value="monthly"
            icon={<TrendingUp />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            label="All Time"
            value="all-time"
            icon={<EmojiEvents />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            label="Hall of Fame"
            value="hall-of-fame"
            icon={<EmojiEvents />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Paper>

      {/* Leaderboard Content */}
      <Suspense fallback={<LeaderboardSkeletonWrapper />}>
        <LeaderboardContent period={selectedPeriod} />
      </Suspense>
    </Container>
  );
};

// Leaderboard Content Component with data fetching
interface LeaderboardContentProps {
  period: LeaderboardPeriod;
}

const LeaderboardContent: React.FC<LeaderboardContentProps> = ({ period }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch leaderboard data based on period
  const { data: leaderboardData } = useSuspenseQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      switch (period) {
        case 'weekly':
          return forumApi.getWeeklyLeaderboard();
        case 'monthly':
          return forumApi.getMonthlyLeaderboard();
        case 'all-time':
          return forumApi.getAllTimeLeaderboard();
        case 'hall-of-fame':
          return forumApi.getHallOfFame();
        default:
          return forumApi.getWeeklyLeaderboard();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch current user ranks
  const { data: currentUserData } = useSuspenseQuery({
    queryKey: ['leaderboard', 'me'],
    queryFn: () => forumApi.getCurrentUserRanks(),
    staleTime: 5 * 60 * 1000,
  });

  const leaderboard: LeaderboardData = leaderboardData;
  const currentUserId = currentUserData?.userId;

  // Separate top 3 and rest
  const topThree = leaderboard.users.slice(0, 3);
  const restOfUsers = leaderboard.users.slice(3);

  if (leaderboard.users.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info">
          No leaderboard data available for {getPeriodLabel(period).toLowerCase()} yet.
        </Alert>
      </Paper>
    );
  }

  return (
    <>
      {/* Top 3 Podium */}
      {topThree.length > 0 && <RankPodium topThree={topThree} />}

      {/* Leaderboard Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: isMobile ? 50 : 80 }}>
                  Rank
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Reputation
                </TableCell>
                {!isMobile && (
                  <>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Posts
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Answers
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Badges
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {restOfUsers.map((user, index) => (
                <LeaderboardEntry
                  key={user.userId}
                  user={user}
                  isCurrentUser={user.userId === currentUserId}
                  index={index}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Update Timestamp */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            color: 'text.secondary',
          }}
        >
          <AccessTime sx={{ fontSize: '1rem' }} />
          <Typography variant="caption">
            Updated {formatDistanceToNow(new Date(leaderboard.updatedAt), { addSuffix: true })}
          </Typography>
        </Box>
      </Paper>

      {/* Current User Rank Card */}
      {leaderboard.currentUserRank && (
        <Paper
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.primary.main}05 100%)`,
            border: `2px solid ${theme.palette.primary.main}40`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Your Rank
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`#${leaderboard.currentUserRank.rank} of ${leaderboard.currentUserRank.totalUsers}`}
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  icon={<EmojiEvents sx={{ fontSize: '0.9rem' }} />}
                  label={`+${leaderboard.currentUserRank.reputationGain.toLocaleString()} reputation`}
                  variant="outlined"
                />
                <Chip
                  label={`Top ${leaderboard.currentUserRank.percentile.toFixed(1)}%`}
                  variant="outlined"
                  color="success"
                />
              </Box>
            </Box>
            <Box sx={{ textAlign: isMobile ? 'left' : 'right' }}>
              <Typography variant="body2" color="text.secondary">
                {leaderboard.currentUserRank.postCount} posts • {leaderboard.currentUserRank.acceptedAnswers} answers
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};

// Loading skeleton wrapper
const LeaderboardSkeletonWrapper: React.FC = () => {
  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>User</TableCell>
              <TableCell align="center">Reputation</TableCell>
              <TableCell align="center">Posts</TableCell>
              <TableCell align="center">Answers</TableCell>
              <TableCell align="center">Badges</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <LeaderboardSkeleton rows={10} showPodium={true} />
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default Leaderboards;
