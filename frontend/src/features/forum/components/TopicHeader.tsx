/**
 * TopicHeader Component
 * Displays topic header with title, type, status, author, and metadata
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  alpha,
  Breadcrumbs,
} from '@mui/material';
import {
  QuestionAnswer as QuestionIcon,
  Chat as DiscussionIcon,
  EmojiObjects as ShowcaseIcon,
  School as TutorialIcon,
  Campaign as AnnouncementIcon,
  Article as PaperIcon,
  CheckCircle as SolvedIcon,
  Lock as LockedIcon,
  PushPin as PinnedIcon,
  Code as CodeIcon,
  Visibility as ViewIcon,
  Comment as ReplyIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import type { ForumTopic, TopicType } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface TopicHeaderProps {
  topic: ForumTopic;
  onEdit?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  canEdit?: boolean;
}

const topicTypeConfig: Record<
  TopicType,
  { icon: React.ElementType; label: string; color: string }
> = {
  question: { icon: QuestionIcon, label: 'Question', color: '#1976d2' },
  discussion: { icon: DiscussionIcon, label: 'Discussion', color: '#9c27b0' },
  showcase: { icon: ShowcaseIcon, label: 'Showcase', color: '#f57c00' },
  tutorial: { icon: TutorialIcon, label: 'Tutorial', color: '#388e3c' },
  announcement: { icon: AnnouncementIcon, label: 'Announcement', color: '#d32f2f' },
  paper: { icon: PaperIcon, label: 'Paper', color: '#5e35b1' },
};

const TopicHeader: React.FC<TopicHeaderProps> = ({
  topic,
  onEdit,
  onShare,
  onBookmark,
  canEdit = false,
}) => {
  const typeConfig = topicTypeConfig[topic.type];
  const TypeIcon = typeConfig.icon;

  const displayName = topic.author.displayName || topic.author.username;
  const isResolved = topic.status === 'resolved';
  const isLocked = topic.isLocked;
  const isPinned = topic.isPinned;

  return (
    <Box
      sx={{
        py: 4,
        px: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Stack spacing={3}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link
            to="/forum"
            style={{
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                '&:hover': { color: 'primary.main' },
              }}
            >
              Forum
            </Typography>
          </Link>
          <Link
            to={`/forum/c/${topic.category.slug}`}
            style={{
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                '&:hover': { color: 'primary.main' },
              }}
            >
              {topic.category.name}
            </Typography>
          </Link>
          <Typography variant="body2" color="text.primary">
            {topic.title}
          </Typography>
        </Breadcrumbs>

        {/* Type Badge + Status Indicators */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            icon={<TypeIcon sx={{ fontSize: '1rem' }} />}
            label={typeConfig.label}
            size="medium"
            sx={{
              bgcolor: alpha(typeConfig.color, 0.1),
              color: typeConfig.color,
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: typeConfig.color,
              },
            }}
          />

          {isPinned && (
            <Chip
              icon={<PinnedIcon sx={{ fontSize: '1rem' }} />}
              label="Pinned"
              size="medium"
              color="primary"
              variant="outlined"
            />
          )}

          {isLocked && (
            <Chip
              icon={<LockedIcon sx={{ fontSize: '1rem' }} />}
              label="Locked"
              size="medium"
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
              size="medium"
              color="success"
              variant="outlined"
            />
          )}

          {topic.hasCode && (
            <Chip
              icon={<CodeIcon sx={{ fontSize: '1rem' }} />}
              label="Contains Code"
              size="medium"
              variant="outlined"
              sx={{ color: 'text.secondary' }}
            />
          )}
        </Stack>

        {/* Title */}
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
          }}
        >
          {topic.title}
        </Typography>

        {/* Tags */}
        {topic.tags.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {topic.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/forum/topics?tag=${tag.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <Chip
                  label={tag.name}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.875rem',
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

        {/* Author Info + Stats + Actions */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          {/* Author Info */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={topic.author.avatarUrl || undefined}
              alt={displayName}
              sx={{ width: 48, height: 48 }}
            >
              {displayName[0].toUpperCase()}
            </Avatar>
            <Box>
              <Link
                to={`/u/${topic.author.username}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {displayName}
                </Typography>
              </Link>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  •
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <ViewIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {topic.viewCount}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <ReplyIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {topic.replyCount}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            {canEdit && onEdit && (
              <Tooltip title="Edit topic">
                <IconButton onClick={onEdit} size="small">
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}

            {onShare && (
              <Tooltip title="Share">
                <IconButton onClick={onShare} size="small">
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            )}

            {onBookmark && (
              <Tooltip title={topic.isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
                <IconButton
                  onClick={onBookmark}
                  size="small"
                  color={topic.isBookmarked ? 'primary' : 'default'}
                >
                  <BookmarkIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default TopicHeader;
