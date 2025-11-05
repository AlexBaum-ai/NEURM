/**
 * ReputationHistory Component
 * Displays a timeline of reputation changes
 * Shows recent activity that affected user's reputation
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add,
  Remove,
  TrendingUp,
  ThumbUp,
  ThumbDown,
  CheckCircle,
  EmojiEvents,
  Warning,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import type { ReputationActivity } from '../types';

interface ReputationHistoryProps {
  activities: ReputationActivity[];
  maxItems?: number;
}

const ReputationHistory: React.FC<ReputationHistoryProps> = ({ activities, maxItems = 10 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const displayedActivities = activities.slice(0, maxItems);

  if (displayedActivities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Reputation History
          </Typography>
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              No reputation activity yet. Start contributing to earn reputation!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Reputation History
        </Typography>
        <Timeline
          position={isMobile ? 'right' : 'alternate'}
          sx={{
            p: 0,
            m: 0,
            '& .MuiTimelineItem-root': {
              minHeight: 'auto',
            },
            '& .MuiTimelineItem-root:before': {
              flex: isMobile ? 0 : 1,
              padding: isMobile ? 0 : undefined,
            },
          }}
        >
          {displayedActivities.map((activity, index) => (
            <TimelineItem key={activity.id}>
              <TimelineSeparator>
                <TimelineDot
                  sx={{
                    bgcolor: getActivityColor(activity.eventType, activity.points),
                    boxShadow: `0 0 0 4px ${getActivityColor(activity.eventType, activity.points)}20`,
                  }}
                >
                  {getActivityIcon(activity.eventType)}
                </TimelineDot>
                {index < displayedActivities.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent sx={{ py: isMobile ? 1.5 : 2, px: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                    flexDirection: isMobile ? 'column' : 'row',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {activity.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                      aria-label={`Activity occurred ${formatDistanceToNow(new Date(activity.createdAt))} ago`}
                    >
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Chip
                    icon={activity.points > 0 ? <Add sx={{ fontSize: '1rem' }} /> : <Remove sx={{ fontSize: '1rem' }} />}
                    label={`${activity.points > 0 ? '+' : ''}${activity.points}`}
                    size="small"
                    sx={{
                      backgroundColor:
                        activity.points > 0 ? '#4CAF5020' : activity.points < 0 ? '#F4433620' : '#9E9E9E20',
                      color: activity.points > 0 ? '#4CAF50' : activity.points < 0 ? '#F44336' : '#9E9E9E',
                      border: `1px solid ${
                        activity.points > 0 ? '#4CAF5040' : activity.points < 0 ? '#F4433640' : '#9E9E9E40'
                      }`,
                      fontWeight: 600,
                      minWidth: 60,
                      '& .MuiChip-icon': {
                        color: activity.points > 0 ? '#4CAF50' : '#F44336',
                      },
                    }}
                    aria-label={`${activity.points > 0 ? 'Gained' : 'Lost'} ${Math.abs(activity.points)} reputation points`}
                  />
                </Box>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
        {activities.length > maxItems && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Showing {maxItems} of {activities.length} activities
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Helper to get icon based on event type
function getActivityIcon(eventType: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    topic_created: <TrendingUp sx={{ fontSize: '1rem' }} />,
    reply_created: <TrendingUp sx={{ fontSize: '1rem' }} />,
    upvote_received: <ThumbUp sx={{ fontSize: '1rem' }} />,
    downvote_received: <ThumbDown sx={{ fontSize: '1rem' }} />,
    best_answer: <CheckCircle sx={{ fontSize: '1rem' }} />,
    badge_earned: <EmojiEvents sx={{ fontSize: '1rem' }} />,
    penalty: <Warning sx={{ fontSize: '1rem' }} />,
  };
  return iconMap[eventType] || <TrendingUp sx={{ fontSize: '1rem' }} />;
}

// Helper to get color based on event type and points
function getActivityColor(eventType: string, points: number): string {
  if (points > 0) {
    if (eventType === 'best_answer') return '#FFB300'; // Gold for best answer
    if (eventType === 'badge_earned') return '#9C27B0'; // Purple for badges
    return '#4CAF50'; // Green for positive
  }
  if (points < 0) {
    return '#F44336'; // Red for negative
  }
  return '#9E9E9E'; // Gray for neutral
}

export default ReputationHistory;
