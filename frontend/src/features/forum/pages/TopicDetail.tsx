/**
 * TopicDetail Page
 * Displays full topic content with header, content, and replies
 */

import React, { Suspense, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Skeleton,
  Alert,
  Stack,
} from '@mui/material';
import { useTopic } from '../hooks';
import {
  useReplies,
  useCreateReply,
  useUpdateReply,
  useDeleteReply,
  useAcceptAnswer,
} from '../hooks/useReplies';
import TopicHeader from '../components/TopicHeader';
import { ReplyTree } from '../components/ReplyTree';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { QuotedReply, ReplySortOption } from '../types';

// Skeleton loader for topic detail
const TopicDetailSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Stack spacing={3}>
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
    </Stack>
  </Container>
);

// Topic content component
const TopicContent: React.FC<{ topicId: string }> = ({ topicId }) => {
  const { data: topic, error } = useTopic({ topicId });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<ReplySortOption>('oldest');

  // Reply hooks
  const { data: repliesData } = useReplies({ topicId, sortBy, refetchInterval: 30000 });
  const createReplyMutation = useCreateReply();
  const updateReplyMutation = useUpdateReply();
  const deleteReplyMutation = useDeleteReply();
  const acceptAnswerMutation = useAcceptAnswer();

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load topic. It may have been deleted or you don't have permission to view it.
        </Alert>
      </Container>
    );
  }

  if (!topic) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Topic not found.</Alert>
      </Container>
    );
  }

  const canEdit = user?.id === topic.authorId;

  // Reply handlers
  const handleCreateReply = useCallback(
    (parentId: string | null, content: string, quotedReply?: QuotedReply) => {
      createReplyMutation.mutate({
        topicId: topic.id,
        content,
        parentReplyId: parentId,
        quotedReplyId: quotedReply?.id,
      });
    },
    [topic.id, createReplyMutation]
  );

  const handleUpdateReply = useCallback(
    (replyId: string, content: string) => {
      updateReplyMutation.mutate({ replyId, data: { content } });
    },
    [updateReplyMutation]
  );

  const handleDeleteReply = useCallback(
    (replyId: string) => {
      deleteReplyMutation.mutate({ replyId, topicId: topic.id });
    },
    [topic.id, deleteReplyMutation]
  );

  const handleAcceptAnswer = useCallback(
    (replyId: string) => {
      acceptAnswerMutation.mutate({ topicId: topic.id, replyId });
    },
    [topic.id, acceptAnswerMutation]
  );

  const handleEdit = () => {
    navigate(`/forum/topics/${topic.id}/edit`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: topic.title,
          text: topic.excerpt,
          url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      // TODO: Show toast notification
    }
  };

  const handleBookmark = () => {
    // TODO: Implement bookmark functionality in future sprint
    console.log('Bookmark clicked');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Topic Header */}
        <TopicHeader
          topic={topic}
          onEdit={canEdit ? handleEdit : undefined}
          onShare={handleShare}
          onBookmark={handleBookmark}
          canEdit={canEdit}
        />

        {/* Topic Content */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          {/* Content */}
          <Box
            sx={{
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1,
              },
              '& pre': {
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
              },
              '& code': {
                bgcolor: 'grey.100',
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              },
              '& pre code': {
                bgcolor: 'transparent',
                p: 0,
              },
              '& blockquote': {
                borderLeft: 4,
                borderColor: 'primary.main',
                pl: 2,
                ml: 0,
                color: 'text.secondary',
                fontStyle: 'italic',
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                mt: 3,
                mb: 2,
                fontWeight: 600,
              },
              '& p': {
                mb: 2,
                lineHeight: 1.7,
              },
              '& ul, & ol': {
                mb: 2,
                pl: 4,
              },
              '& li': {
                mb: 1,
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
            }}
          >
            {/* Render markdown content as HTML */}
            <Typography
              component="div"
              variant="body1"
              dangerouslySetInnerHTML={{ __html: topic.content }}
            />
          </Box>

          {/* Attachments */}
          {topic.attachments && topic.attachments.length > 0 && (
            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Attachments
              </Typography>
              <Stack spacing={1}>
                {topic.attachments.map((attachment) => (
                  <Box
                    key={attachment.id}
                    component="a"
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {attachment.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(attachment.fileSize / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Poll */}
          {topic.poll && (
            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                {topic.poll.question}
              </Typography>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                {topic.poll.allowMultiple ? 'Multiple choice' : 'Single choice'}
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {topic.poll.options.map((option) => (
                  <Box
                    key={option.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{option.text}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.voteCount} votes
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Replies Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <ReplyTree
            replies={repliesData?.replies || []}
            topicId={topic.id}
            topicType={topic.type}
            topicAuthorId={topic.authorId}
            acceptedAnswerId={topic.acceptedAnswerId}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onCreateReply={handleCreateReply}
            onUpdateReply={handleUpdateReply}
            onDeleteReply={handleDeleteReply}
            onAcceptAnswer={topic.type === 'question' ? handleAcceptAnswer : undefined}
            isSubmitting={
              createReplyMutation.isPending ||
              updateReplyMutation.isPending ||
              deleteReplyMutation.isPending ||
              acceptAnswerMutation.isPending
            }
          />
        </Paper>
      </Stack>
    </Container>
  );
};

// Main component with Suspense
const TopicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Invalid topic ID</Alert>
      </Container>
    );
  }

  return (
    <Suspense fallback={<TopicDetailSkeleton />}>
      <TopicContent topicId={id} />
    </Suspense>
  );
};

export default TopicDetail;
