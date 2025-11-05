/**
 * TopicCard Component
 * Displays a forum topic card with metadata, tags, and interaction stats
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Avatar,
  Stack,
  alpha,
} from '@mui/material';
import {
  QuestionAnswer as QuestionIcon,
  Chat as DiscussionIcon,
  EmojiObjects as ShowcaseIcon,
  School as TutorialIcon,
  Campaign as AnnouncementIcon,
  Article as PaperIcon,
  ThumbUp as VoteIcon,
  Visibility as ViewIcon,
  Comment as ReplyIcon,
  CheckCircle as SolvedIcon,
  Lock as LockedIcon,
  PushPin as PinnedIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import type { ForumTopic, TopicType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import ReputationBadge from './ReputationBadge';

interface TopicCardProps {
  topic: ForumTopic;
}

const topicTypeConfig: Record<
  TopicType,
  { icon: React.ElementType; label: string; color: string }
> = {
  question: {
    icon: QuestionIcon,
    label: 'Question',
    color: '#1976d2',
  },
  discussion: {
    icon: DiscussionIcon,
    label: 'Discussion',
    color: '#9c27b0',
  },
  showcase: {
    icon: ShowcaseIcon,
    label: 'Showcase',
    color: '#f57c00',
  },
  tutorial: {
    icon: TutorialIcon,
    label: 'Tutorial',
    color: '#388e3c',
  },
  announcement: {
    icon: AnnouncementIcon,
    label: 'Announcement',
    color: '#d32f2f',
  },
  paper: {
    icon: PaperIcon,
    label: 'Paper',
    color: '#5e35b1',
  },
};

const TopicCard: React.FC<TopicCardProps> = ({ topic }) => {
  const typeConfig = topicTypeConfig[topic.type];
  const TypeIcon = typeConfig.icon;

  const displayName = topic.author.displayName || topic.author.username;
  const isResolved = topic.status === 'resolved';
  const isLocked = topic.isLocked;
  const isPinned = topic.isPinned;

  return (
    <Card
      sx={{
        mb: 2,
        transition: 'all 0.2s ease-in-out',
        border: (theme) =>
          isPinned
            ? `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
            : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        bgcolor: (theme) =>
          isPinned ? alpha(theme.palette.primary.main, 0.02) : 'background.paper',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Header: Type badge + Title + Status indicators */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="flex-start" mb={1.5}>
              {/* Type Badge */}
              <Chip
                icon={<TypeIcon sx={{ fontSize: '1rem' }} />}
                label={typeConfig.label}
                size="small"
                sx={{
                  bgcolor: alpha(typeConfig.color, 0.1),
                  color: typeConfig.color,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: typeConfig.color,
                  },
                }}
              />

              {/* Status Indicators */}
              {isPinned && (
                <Chip
                  icon={<PinnedIcon sx={{ fontSize: '1rem' }} />}
                  label="Pinned"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}

              {isLocked && (
                <Chip
                  icon={<LockedIcon sx={{ fontSize: '1rem' }} />}
                  label="Locked"
                  size="small"
                  sx={{
                    borderColor: 'text.disabled',
                    color: 'text.disabled',
                  }}
                />
              )}

              {isResolved && (
                <Chip
                  icon={<SolvedIcon sx={{ fontSize: '1rem' }} />}
                  label="Solved"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}

              {topic.hasCode && (
                <Chip
                  icon={<CodeIcon sx={{ fontSize: '1rem' }} />}
                  size="small"
                  variant="outlined"
                  sx={{ color: 'text.secondary' }}
                />
              )}
            </Stack>

            {/* Title */}
            <Link
              to={`/forum/t/${topic.slug}/${topic.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {topic.title}
              </Typography>
            </Link>

            {/* Excerpt */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.6,
              }}
            >
              {topic.excerpt}
            </Typography>
          </Box>

          {/* Tags */}
          {topic.tags.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {topic.tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/forum/topics?tag=${tag.slug}`}
                  style={{ textDecoration: 'none' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Chip
                    label={tag.name}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.75rem',
                      height: '24px',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                        borderColor: 'primary.main',
                      },
                    }}
                  />
                </Link>
              ))}
            </Stack>
          )}

          {/* Footer: Author + Stats */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            {/* Author Info */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                src={topic.author.avatarUrl || undefined}
                alt={displayName}
                sx={{ width: 32, height: 32 }}
              >
                {displayName[0].toUpperCase()}
              </Avatar>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" fontWeight={500}>
                    {displayName}
                  </Typography>
                  {topic.author.reputationLevel && topic.author.reputation !== undefined && (
                    <ReputationBadge
                      level={topic.author.reputationLevel}
                      totalReputation={topic.author.reputation}
                      size="small"
                      showPoints={false}
                      showIcon={true}
                    />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
            </Stack>

            {/* Stats */}
            <Stack direction="row" spacing={3} alignItems="center">
              {/* Votes */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                <VoteIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography
                  variant="body2"
                  color={topic.voteScore > 0 ? 'success.main' : 'text.secondary'}
                  fontWeight={topic.voteScore > 0 ? 600 : 400}
                >
                  {topic.voteScore}
                </Typography>
              </Stack>

              {/* Replies */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ReplyIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {topic.replyCount}
                </Typography>
              </Stack>

              {/* Views */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ViewIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {topic.viewCount >= 1000
                    ? `${(topic.viewCount / 1000).toFixed(1)}k`
                    : topic.viewCount}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TopicCard;
