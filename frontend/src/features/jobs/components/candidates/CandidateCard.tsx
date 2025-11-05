/**
 * CandidateCard Component
 *
 * Displays candidate preview with key information
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  LocationOn,
  Star,
  WorkOutline,
  CheckCircle,
} from '@mui/icons-material';
import type { CandidateSearchResult } from '../../types/candidates';

interface CandidateCardProps {
  candidate: CandidateSearchResult;
  onClick: (candidate: CandidateSearchResult) => void;
  selected?: boolean;
}

/**
 * Candidate card component for search results
 */
const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onClick, selected = false }) => {
  const {
    displayName,
    avatarUrl,
    headline,
    location,
    topSkills = [],
    reputation,
    matchScore,
    openToWork,
    experienceLevel,
  } = candidate;

  const handleClick = () => {
    onClick(candidate);
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardActionArea onClick={handleClick} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header with Avatar and Match Score */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Avatar
              src={avatarUrl}
              alt={displayName}
              sx={{ width: 60, height: 60 }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" fontWeight="bold" noWrap>
                  {displayName}
                </Typography>
                {openToWork && (
                  <Chip
                    label="Open to work"
                    size="small"
                    color="success"
                    icon={<CheckCircle />}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              {headline && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {headline}
                </Typography>
              )}
            </Box>

            {matchScore !== undefined && (
              <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={matchScore >= 80 ? 'success.main' : matchScore >= 60 ? 'warning.main' : 'text.secondary'}
                >
                  {matchScore}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Match
                </Typography>
              </Box>
            )}
          </Box>

          {/* Location and Experience */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            {location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {location}
                </Typography>
              </Box>
            )}

            {experienceLevel && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WorkOutline sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {experienceLevel.replace('_', ' ')}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Top Skills */}
          {topSkills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Top Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {topSkills.slice(0, 5).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                ))}
                {topSkills.length > 5 && (
                  <Chip
                    label={`+${topSkills.length - 5} more`}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.7rem',
                      height: 24,
                      color: 'text.secondary',
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Reputation */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Reputation
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="medium">
                {reputation.toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((reputation / 1000) * 100, 100)}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: reputation >= 500 ? 'success.main' : 'primary.main',
                },
              }}
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default CandidateCard;
