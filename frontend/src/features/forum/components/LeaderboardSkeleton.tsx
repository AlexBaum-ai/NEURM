/**
 * LeaderboardSkeleton Component
 * Loading skeleton for leaderboard display
 */

import React from 'react';
import {
  Box,
  Skeleton,
  TableRow,
  TableCell,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface LeaderboardSkeletonProps {
  rows?: number;
  showPodium?: boolean;
}

const LeaderboardSkeleton: React.FC<LeaderboardSkeletonProps> = ({
  rows = 10,
  showPodium = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {/* Podium Skeleton */}
      {showPodium && (
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
          {[0, 1, 2].map((index) => {
            const heights = isMobile ? [100, 140, 80] : [140, 180, 120];
            return (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  maxWidth: isMobile ? '110px' : '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {/* Avatar */}
                <Skeleton
                  variant="circular"
                  width={isMobile ? 60 : 80}
                  height={isMobile ? 60 : 80}
                  sx={{ mb: 1 }}
                />
                {/* Username */}
                <Skeleton variant="text" width="80%" height={20} />
                {/* Reputation */}
                <Skeleton variant="rounded" width={80} height={24} />
                {/* Stats */}
                <Skeleton variant="text" width="60%" height={16} />
                {/* Podium */}
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={heights[index]}
                  sx={{ borderRadius: '8px 8px 0 0' }}
                />
              </Box>
            );
          })}
        </Box>
      )}

      {/* Table Rows Skeleton */}
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index}>
          {/* Rank */}
          <TableCell sx={{ width: isMobile ? 50 : 80 }}>
            <Skeleton variant="text" width={30} height={30} />
          </TableCell>

          {/* User */}
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton
                variant="circular"
                width={isMobile ? 40 : 48}
                height={isMobile ? 40 : 48}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                {!isMobile && <Skeleton variant="text" width="40%" height={16} />}
              </Box>
            </Box>
          </TableCell>

          {/* Reputation */}
          <TableCell align="center">
            <Skeleton variant="rounded" width={80} height={24} sx={{ mx: 'auto' }} />
          </TableCell>

          {/* Posts */}
          {!isMobile && (
            <TableCell align="center">
              <Skeleton variant="text" width={40} height={20} sx={{ mx: 'auto' }} />
            </TableCell>
          )}

          {/* Accepted Answers */}
          {!isMobile && (
            <TableCell align="center">
              <Skeleton variant="text" width={40} height={20} sx={{ mx: 'auto' }} />
            </TableCell>
          )}

          {/* Badges */}
          {!isMobile && (
            <TableCell align="center">
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} variant="circular" width={24} height={24} />
                ))}
              </Box>
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
};

export default LeaderboardSkeleton;
